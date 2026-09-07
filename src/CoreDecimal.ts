import type { CalculationContext } from './CalculationContext.js';
import { DecimalEnvironment, calculationConstruction, resultStateConstruction } from './DecimalEnvironment.js';
import { DecimalLike as DecimalBase, decimalEnvironmentAccess, type DecimalValue, type DecimalValueIterable } from './DecimalBase.js';
import { DECIMAL_LIMITS, type DecimalLimits } from './DecimalLimits.js';
import { setDecimalState, type DecimalState } from './DecimalState.js';
import type { DecimalConfig, DecimalConfigInput } from './config/DecimalConfig.js';
import { DefaultDecimalConfig } from './config/DefaultConfig.js';
import { getRoundingModeCode, type RoundingMode } from './config/RoundingModes.js';
import { initialiseDecimal } from './initialise-decimal.js';
import {
	isEven,
	isFinite,
	isInt,
	isNaN,
	isNeg,
	isOdd,
	isPos,
	isZero
} from './methods/compare/identity-compare.js';
import { max, min } from './methods/compare/min-max.js';
import { cmp, compareDecimals } from './methods/compare/relational-compare.js';
import { toExponential } from './methods/to/to-exponential.js';
import { toFixed } from './methods/to/to-fixed.js';
import { toNumber } from './methods/to/to-number.js';
import { toPrecision } from './methods/to/to-precision.js';
import { toString } from './methods/to/to-string.js';
import { toValue } from './methods/to/to-value.js';
import { getDecimalPlaces } from './methods/utils/get-decimal-places.js';
import { getSign } from './methods/utils/get-sign.js';
import { precision } from './methods/utils/precision.js';

let environment : DecimalEnvironment;

/** The independently configurable constructor returned by {@link CoreDecimal.clone}. */
export interface CoreDecimalConstructor
{
	/** Construct a Decimal value. */
	new (value : DecimalValue): CoreDecimal;
	/** Prototype shared by instances from this constructor. */
	readonly prototype : CoreDecimal;
	/** Read the constructor's frozen configuration snapshot. */
	get config(): Readonly<DecimalConfig>;
	/** Apply a validated partial configuration update. */
	set config(params : DecimalConfigInput);
	/** Hard validation limits shared by all tiers. */
	readonly limits : DecimalLimits;
	/** Create an independently configurable constructor. */
	clone(config ?: DecimalConfigInput): CoreDecimalConstructor;
	/** Select the least value from a non-empty iterable. */
	min(value : DecimalValueIterable): CoreDecimal;
	/** Select the least of one or more scalar values. */
	min(value : DecimalValue, ...values : DecimalValue[]): CoreDecimal;
	/** Select the greatest value from a non-empty iterable. */
	max(value : DecimalValueIterable): CoreDecimal;
	/** Select the greatest of one or more scalar values. */
	max(value : DecimalValue, ...values : DecimalValue[]): CoreDecimal;
}

/**
 * Arbitrary-precision decimal representation, comparison, and formatting.
 * Import the arithmetic or scientific tier when calculations are required.
 */
export class CoreDecimal extends DecimalBase
{
	static
	{
		environment = new DecimalEnvironment(CoreDecimal, DefaultDecimalConfig);
	}

	/** @internal Provide the inherited configuration and allocation environment. */
	static [decimalEnvironmentAccess]() : DecimalEnvironment { return environment; }
	/** Hard validation limits shared by every Decimal tier. */
	static get limits() : DecimalLimits { return DECIMAL_LIMITS; }
	/** Read a frozen snapshot of this constructor's active configuration. */
	static get config() : Readonly<DecimalConfig>
	{
		return environment.getConfig(this);
	}
	/** Apply a validated partial configuration update to this constructor. */
	static set config(params : DecimalConfigInput)
	{
		environment.setConfig(this, params);
	}
	/** Select the least value from a non-empty iterable. */
	static min(value : DecimalValueIterable) : CoreDecimal;
	/** Select the least of one or more scalar values. */
	static min(value : DecimalValue, ...values : DecimalValue[]) : CoreDecimal;
	static min(value : DecimalValue | DecimalValueIterable, ...values : DecimalValue[]) : CoreDecimal
	{
		return min(value, this.context(), ...values) as CoreDecimal;
	}
	/** Select the greatest value from a non-empty iterable. */
	static max(value : DecimalValueIterable) : CoreDecimal;
	/** Select the greatest of one or more scalar values. */
	static max(value : DecimalValue, ...values : DecimalValue[]) : CoreDecimal;
	static max(value : DecimalValue | DecimalValueIterable, ...values : DecimalValue[]) : CoreDecimal
	{
		return max(value, this.context(), ...values) as CoreDecimal;
	}
	/** Create an independently configurable constructor for this tier. */
	static clone(config : DecimalConfigInput = {}) : CoreDecimalConstructor
	{
		const Parent = environment.getCalculationConstructor(this);
		class CoreDecimalClone extends (Parent as unknown as typeof CoreDecimal) {}

		environment.registerClone(
			CoreDecimalClone,
			this,
			config
		);

		return CoreDecimalClone;
	}

	/** Create a Decimal from an exact numeric input. */
	constructor(value : DecimalValue);
	constructor(value : DecimalValue | DecimalState, token ?: symbol, context ?: CalculationContext)
	{
		super();

		if (token === resultStateConstruction)
		{
			setDecimalState(this, value as DecimalState);
			return;
		}

		const result = initialiseDecimal(
			this,
			value as DecimalValue,
			token === calculationConstruction && context
				? context
				: environment.getDefaultContext(new.target)
		);

		return result as this;
	}

	/** @returns The number of digits after the decimal point, or `NaN` for a non-finite value. */
	dp() : number { return getDecimalPlaces(this); }

	/** Count this value's significant digits. */
	precision(includeTrailingIntegerZeros ?: boolean) : number
	{
		return precision(this, includeTrailingIntegerZeros);
	}

	/** @returns `-1`, `-0`, `0`, `1`, or `NaN` according to this value's state. */
	sign() : number { return getSign(this); }

	/** Compare this value with another value. */
	cmp(value : DecimalValue) : number
	{
		return value instanceof DecimalBase
			? compareDecimals(this, value)
			: this.execute(context => cmp(this, value, context));
	}

	/** @returns Whether this value compares equal to `value`. */
	eq(value : DecimalValue) : boolean { return this.cmp(value) === 0; }

	/** @returns Whether this value is greater than `value`. */
	gt(value : DecimalValue) : boolean { return this.cmp(value) > 0; }

	/** @returns Whether this value is greater than or equal to `value`. */
	gte(value : DecimalValue) : boolean
	{
		const comparison = this.cmp(value);
		return comparison === 1 || comparison === 0;
	}

	/** @returns Whether this value is less than `value`. */
	lt(value : DecimalValue) : boolean { return this.cmp(value) < 0; }

	/** @returns Whether this value is less than or equal to `value`. */
	lte(value : DecimalValue) : boolean { return this.cmp(value) < 1; }

	/** @returns Whether this value is finite. */
	isFinite() : boolean { return isFinite(this); }

	/** @returns Whether this value is a finite integer. */
	isInt() : boolean { return isInt(this); }

	/** @returns Whether this value is `NaN`. */
	isNaN() : boolean { return isNaN(this); }

	/** @returns Whether this value has a negative sign. */
	isNeg() : boolean { return isNeg(this); }

	/** @returns Whether this value has a positive sign. */
	isPos() : boolean { return isPos(this); }

	/** @returns Whether this value is positive or negative zero. */
	isZero() : boolean { return isZero(this); }

	/** @returns Whether this value is a finite odd integer. */
	isOdd() : boolean { return isOdd(this); }

	/** @returns Whether this value is a finite even integer. */
	isEven() : boolean { return isEven(this); }

	/** Format this value in canonical fixed or exponential notation. */
	toString() : string
	{
		return this.execute(context => toString(this, context));
	}

	/** Return the exact primitive string value, preserving negative zero. */
	toValue() : string
	{
		return this.execute(context => toValue(this, context));
	}

	/** Return the exact string used by default JavaScript coercion. */
	valueOf() : string { return this.toValue(); }

	/** Return the exact string serialized by JSON. */
	toJSON() : string { return this.toValue(); }

	/** Convert according to JavaScript's primitive hint. */
	[Symbol.toPrimitive](hint : 'default' | 'number' | 'string') : string | number
	{
		return hint === 'number'
			? this.toNumber()
			: hint === 'string' ? this.toString() : this.toValue();
	}

	/** Format this value in fixed-point notation. */
	toFixed(dp ?: number, rm ?: RoundingMode) : string
	{
		return this.execute(context => toFixed(
			this,
			dp,
			rm === void 0 ? context.roundingCode : getRoundingModeCode(rm),
			context
		));
	}

	/** Convert to the nearest JavaScript number. */
	toNumber() : number { return toNumber(this); }

	/** Format this value in exponential notation. */
	toExponential(dp ?: number, rm ?: RoundingMode) : string
	{
		return this.execute(context => toExponential(
			this,
			dp,
			rm === void 0 ? context.roundingCode : getRoundingModeCode(rm),
			context
		));
	}

	/** Format this value to a specified number of significant digits. */
	toPrecision(sd ?: number, rm ?: RoundingMode) : string
	{
		return this.execute(context => toPrecision(
			this,
			sd,
			rm === void 0 ? context.roundingCode : getRoundingModeCode(rm),
			context
		));
	}

	/** @internal */
	protected execute<T>(operation : (context : CalculationContext) => T) : T
	{
		return operation((this.constructor as typeof CoreDecimal).context());
	}

	/** @internal */
	protected static context() : CalculationContext
	{
		return environment.getDefaultContext(this);
	}
}

/** Register a richer tier as an allocation boundary in the core environment. @internal */
export function registerCoreTier(Constructor : typeof CoreDecimal, Source : typeof CoreDecimal) : void
{
	environment.registerClone(
		Constructor,
		Source,
		{}
	);
}
