import type { Decimal, DecimalValue } from './Decimal.js';
import type { DecimalState } from './DecimalState.js';
import { getDecimalRuntime, type DecimalRuntime } from './DecimalRuntime.js';
import type { DecimalConfig } from './config/DecimalConfig.js';
import {
	getModuloModeCode,
	getRoundingModeCode,
	type ModuloCode,
	type RoundingCode
} from './config/RoundingModes.js';

export type CalculationContextOverrides = {
	readonly external?: boolean;
	readonly precision?: number;
	readonly roundingCode?: RoundingCode;
};

type ResolvedCalculationContext = {
	readonly moduloCode: ModuloCode;
	readonly precision: number;
	readonly roundingCode: RoundingCode;
};

const unlimitedContexts = new WeakMap<CalculationContext, CalculationContext>();

/**
 * Immutable state used by one calculation and any intermediate calculations it creates.
 */
export class CalculationContext
{
	readonly Constructor : typeof Decimal;
	/** Original immutable constructor configuration; active derived policy uses the fields below. */
	readonly config : Readonly<DecimalConfig>;
	readonly external : boolean;
	readonly moduloCode : ModuloCode;
	readonly precision : number;
	readonly roundingCode : RoundingCode;
	readonly #runtime : DecimalRuntime;

	constructor(
		Constructor : typeof Decimal,
		config : Readonly<DecimalConfig>,
		external = true,
		resolved ?: ResolvedCalculationContext,
		runtime ?: DecimalRuntime
	)
	{
		this.#runtime = runtime ?? getDecimalRuntime(Constructor);
		this.Constructor = this.#runtime.resolveCalculationConstructor(Constructor);
		// Constructor-owned configurations and context-derived configurations are immutable
		// snapshots, so they can be shared instead of copied for every operation.
		this.config = Object.isFrozen(config) ? config : Object.freeze({ ...config });
		this.external = external;
		this.moduloCode = resolved?.moduloCode ?? getModuloModeCode(config.modulo);
		this.precision = resolved?.precision ?? config.precision;
		this.roundingCode = resolved?.roundingCode ?? getRoundingModeCode(config.rounding);

		Object.freeze(this);
	}

	create(value : DecimalValue) : Decimal
	{
		return this.#runtime.createForCalculation(this.Constructor, value, this);
	}

	/** Allocate a result whose mutable state is already owned by this calculation. */
	createResult(state : DecimalState) : Decimal
	{
		return this.#runtime.createResultForCalculation(this.Constructor, state);
	}

	isDecimal(value : unknown) : value is Decimal
	{
		return this.#runtime.isDecimal(value);
	}

	/** Parse an operand without applying exponent limits, which are output policy. */
	createExact(value : DecimalValue) : Decimal
	{
		return this.withoutLimits().create(value);
	}

	/** Reuse an otherwise identical context which does not apply public exponent limits. */
	withoutLimits() : CalculationContext
	{
		if (!this.external) return this;

		let context = unlimitedContexts.get(this);
		if (!context)
		{
			context = this.with({ external: false });
			unlimitedContexts.set(this, context);
		}
		return context;
	}

	with(overrides : CalculationContextOverrides) : CalculationContext
	{
		const precision = overrides.precision ?? this.precision;
		const roundingCode = overrides.roundingCode ?? this.roundingCode;
		const external = overrides.external ?? this.external;

		if (precision === this.precision &&
			roundingCode === this.roundingCode &&
			external === this.external)
		{
			return this;
		}

		return new CalculationContext(this.Constructor, this.config, external, {
			moduloCode: this.moduloCode,
			precision,
			roundingCode
		}, this.#runtime);
	}
}
