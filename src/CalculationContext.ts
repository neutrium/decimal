import type { KernelDecimal, KernelDecimalConstructor } from './KernelDecimal.js';
import { decimalEnvironmentAccess, type DecimalValue } from './DecimalBase.js';
import type { DecimalState } from './DecimalState.js';
import type { DecimalEnvironment } from './DecimalEnvironment.js';
import type { DecimalConfig } from './config/DecimalConfig.js';
import {
	getModuloModeCode,
	getRoundingModeCode,
	type ModuloCode,
	type RoundingCode
} from './config/RoundingModes.js';

/** Public calculations apply exponent limits and automatic add/mul rounding. */
export type CalculationBoundary = 'public' | 'intermediate';

export type CalculationContextOverrides = {
	readonly boundary?: CalculationBoundary;
	readonly precision?: number;
	readonly roundingCode?: RoundingCode;
};

const intermediateContexts = new WeakMap<CalculationContext, CalculationContext>();

/**
 * Immutable state used by one calculation and any intermediate calculations it creates.
 */
export class CalculationContext
{
	readonly Constructor : KernelDecimalConstructor;
	/** Original immutable constructor configuration; active derived policy uses the fields below. */
	readonly config : Readonly<DecimalConfig>;
	readonly boundary : CalculationBoundary;
	readonly moduloCode : ModuloCode;
	readonly precision : number;
	readonly roundingCode : RoundingCode;
	readonly #environment : DecimalEnvironment;

	constructor(
		Constructor : KernelDecimalConstructor,
		config : Readonly<DecimalConfig>,
		policy : CalculationContextOverrides = {}
	)
	{
		const provider = Constructor as KernelDecimalConstructor & {
			[decimalEnvironmentAccess]?: () => DecimalEnvironment
		};
		const environment = provider[decimalEnvironmentAccess]?.();
		if (!environment) throw new TypeError('Decimal environment is not initialized');
		this.#environment = environment;
		this.Constructor = environment.getCalculationConstructor(Constructor);
		// Constructor-owned configurations and context-derived configurations are immutable
		// snapshots, so they can be shared instead of copied for every operation.
		this.config = Object.isFrozen(config) ? config : Object.freeze({ ...config });
		this.boundary = policy.boundary ?? 'public';
		this.moduloCode = getModuloModeCode(config.modulo);
		this.precision = policy.precision ?? config.precision;
		this.roundingCode = policy.roundingCode ?? getRoundingModeCode(config.rounding);

		Object.freeze(this);
	}

	create(value : DecimalValue) : KernelDecimal
	{
		return this.#environment.createForCalculation(this.Constructor, value, this);
	}

	/** Allocate a result whose mutable state is already owned by this calculation. */
	createResult(state : DecimalState) : KernelDecimal
	{
		return this.#environment.createResultForCalculation(this.Constructor, state);
	}

	isDecimal(value : unknown) : value is KernelDecimal
	{
		return this.#environment.isDecimal(value);
	}

	/** Parse an operand without applying exponent limits, which are output policy. */
	createExact(value : DecimalValue) : KernelDecimal
	{
		return this.forIntermediate().create(value);
	}

	/** Reuse intermediate policy: no exponent limits or automatic add/mul rounding.
	 * Working precision, explicit finalise calls, and resource budgets still apply. */
	forIntermediate() : CalculationContext
	{
		if (this.boundary === 'intermediate')
		{
			return this;
		}

		let context = intermediateContexts.get(this);

		if (!context)
		{
			context = this.with({ boundary: 'intermediate' });
			intermediateContexts.set(this, context);
		}

		return context;
	}

	with(overrides : CalculationContextOverrides) : CalculationContext
	{
		const precision = overrides.precision ?? this.precision;
		const roundingCode = overrides.roundingCode ?? this.roundingCode;
		const boundary = overrides.boundary ?? this.boundary;

		if (precision === this.precision &&
			roundingCode === this.roundingCode &&
			boundary === this.boundary
		){
			return this;
		}

		return new CalculationContext(this.Constructor, this.config, {
			boundary,
			precision,
			roundingCode
		});
	}
}
