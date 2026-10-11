import type { KernelDecimal } from './KernelDecimal.js';
import type { CalculationContext } from './CalculationContext.js';
import { CoreDecimal, registerCoreTier, type CoreDecimalConstructor } from './CoreDecimal.js';
import { decimalResultType, type DecimalValue, type DecimalValueIterable } from './DecimalBase.js';
import { getDecimalState } from './DecimalState.js';
import type { DecimalConfigInput } from './config/DecimalConfig.js';
import { getRoundingModeCode, ROUND_DOWN, type RoundingMode } from './config/RoundingModes.js';
import { abs } from './methods/arithmetic/abs.js';
import { add, sub } from './methods/arithmetic/add-subtract.js';
import { div, divToInt } from './methods/arithmetic/div.js';
import { mod } from './methods/arithmetic/mod.js';
import { mul } from './methods/arithmetic/mul.js';
import { neg } from './methods/arithmetic/neg.js';
import type { DecimalRationalTerm } from './DecimalRationalTerm.js';
import { compareRationalSum, fromRationalSum } from './methods/arithmetic/rational-sum.js';
import { powInteger } from './methods/arithmetic/pow-integer.js';
import { shift } from './methods/arithmetic/shift.js';
import { ceil, floor, round } from './methods/rounding/rounding.js';
import { toNearest } from './methods/rounding/to-nearest.js';
import { toDP } from './methods/to/to-dp.js';
import { toFraction } from './methods/to/to-fraction.js';
import { toSignificantDigits } from './methods/to/to-significant-digits.js';
import { finalise } from './methods/utils/finalise.js';

/** Fraction representation returned by {@link ArithmeticDecimal.toFraction}. */
export type ArithmeticDecimalFraction<T extends ArithmeticDecimal = ArithmeticDecimal> =
	readonly [T] | readonly [T, T];

/** The independently configurable constructor returned by {@link ArithmeticDecimal.clone}. */
export interface ArithmeticDecimalConstructor extends CoreDecimalConstructor
{
	/** Construct an arithmetic Decimal value. */
	new (value : DecimalValue): ArithmeticDecimal;
	/** Prototype shared by instances from this constructor. */
	readonly prototype : ArithmeticDecimal;
	/** Create an independently configurable arithmetic constructor. */
	clone(config ?: DecimalConfigInput): ArithmeticDecimalConstructor;
	/** Construct a correctly rounded sum of exact rational terms. */
	fromRationalSum(terms : Iterable<DecimalRationalTerm>): ArithmeticDecimal;
	/** Compare an exact rational sum with zero without rounding or exponent limits. */
	compareRationalSum(terms : Iterable<DecimalRationalTerm>): -1 | 0 | 1;
	/** Select the least value from a non-empty iterable. */
	min(value : DecimalValueIterable): ArithmeticDecimal;
	/** Select the least of one or more scalar values. */
	min(value : DecimalValue, ...values : DecimalValue[]): ArithmeticDecimal;
	/** Select the greatest value from a non-empty iterable. */
	max(value : DecimalValueIterable): ArithmeticDecimal;
	/** Select the greatest of one or more scalar values. */
	max(value : DecimalValue, ...values : DecimalValue[]): ArithmeticDecimal;
}

export interface ArithmeticDecimal
{
	/** @hidden Bind inherited result-producing operations to the arithmetic tier. */
	readonly [decimalResultType] : ArithmeticDecimal;
}

/**
 * The core Decimal representation plus arithmetic and rounding operations.
 * Integer powers are included; import the scientific tier for general powers, logarithms, and trigonometry.
 */
export class ArithmeticDecimal extends CoreDecimal
{
	static
	{
		registerCoreTier(ArithmeticDecimal, CoreDecimal);
	}

	// Declarations narrow inherited statics without creating runtime overrides.
	/** Select the least value from an iterable or scalar inputs. */
	declare static min : ArithmeticDecimalConstructor['min'];
	/** Select the greatest value from an iterable or scalar inputs. */
	declare static max : ArithmeticDecimalConstructor['max'];
	/** Create an independently configurable constructor for this tier. */
	declare static clone : ArithmeticDecimalConstructor['clone'];

	/** Construct a sum of exact rational terms, rounding once using this constructor's settings.
	 * Terms represent numerator / denominator times ten to exponent. Denominators must be positive.
	 * Empty or all-zero inputs produce +0; nonzero cancellation produces -0 only with floor rounding.
	 * Invalid terms or non-iterable input throw INVALID_ARGUMENT. */
	static fromRationalSum(terms : Iterable<DecimalRationalTerm>) : ArithmeticDecimal
	{
		return fromRationalSum(terms, this.context()) as ArithmeticDecimal;
	}

	/** Compare an exact rational sum with zero, returning -1, 0 or 1.
	 * Precision, rounding, exponent and formatting settings do not affect the comparison.
	 * Terms have the same validation and resource limits as fromRationalSum.
	 * Empty, all-zero and exactly cancelling inputs return +0. */
	static compareRationalSum(terms : Iterable<DecimalRationalTerm>) : -1 | 0 | 1
	{
		return compareRationalSum(terms);
	}

	/** Add a value. */
	add(value : DecimalValue) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => add(this, value, context));
	}
	/** Subtract a value. */
	sub(value : DecimalValue) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => sub(this, value, context));
	}
	/** Multiply by a value. */
	mul(value : DecimalValue) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => mul(this, value, context));
	}
	/** Divide by a value using the active precision and rounding mode. */
	div(value : DecimalValue) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => div(this, value, context));
	}
	/** Raise to a safe integer Number exponent, rounding only the final result.
	 * Negative exponents calculate reciprocals. Invalid exponents throw INVALID_ARGUMENT. */
	powInteger(exponent : number) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => powInteger(this, exponent, context));
	}
	/** Divide by a value and truncate the quotient toward zero. */
	divToInt(value : DecimalValue) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => divToInt(this, value, context));
	}
	/** Calculate a remainder using the configured modulo mode. */
	mod(value : DecimalValue) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => mod(this, value, context));
	}
	/** Return a new Decimal with the sign inverted. */
	neg() : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => neg(this, context));
	}
	/** Return the absolute value. */
	abs() : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => abs(this, context));
	}
	/** Shift the decimal point by a power of ten. */
	shift(places : number) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => shift(this, places, context));
	}

	/** Round to an integer toward positive Infinity. */
	ceil() : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => ceil(this, context));
	}
	/** Round to an integer toward negative Infinity. */
	floor() : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => floor(this, context));
	}
	/** Round to an integer using the configured rounding mode. */
	round() : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => round(this, context));
	}
	/** Truncate to an integer toward zero. */
	trunc() : this[typeof decimalResultType]
	{
		const exponent = getDecimalState(this).e;
		return this.executeCalculation(context => finalise(
			context.createExact(this),
			exponent + 1,
			ROUND_DOWN,
			undefined,
			context
		));
	}
	/** Round to a multiple of another value. */
	toNearest(value ?: DecimalValue, rm ?: RoundingMode) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => toNearest(
			this,
			value,
			rm === void 0 ? context.roundingCode : getRoundingModeCode(rm),
			context
		));
	}
	/** Round to a maximum number of decimal places. */
	toDP(dp ?: number, rm ?: RoundingMode) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => toDP(
			this,
			dp,
			rm === void 0 ? context.roundingCode : getRoundingModeCode(rm),
			context
		));
	}
	/** Round to a maximum number of significant digits. */
	toSD(sd ?: number, rm ?: RoundingMode) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => toSignificantDigits(
			this,
			sd,
			rm === void 0 ? context.roundingCode : getRoundingModeCode(rm),
			context
		));
	}
	/** Approximate this value as a fraction. */
	toFraction(denominator ?: DecimalValue) : ArithmeticDecimalFraction<this[typeof decimalResultType]>
	{
		const result = this.execute(context => toFraction(
			this,
			denominator,
			context
		));

		return Object.freeze(result) as ArithmeticDecimalFraction<this[typeof decimalResultType]>;
	}

	/** @internal Bind kernel results to the registered tier of this receiver. */
	protected executeCalculation(
		operation : (context : CalculationContext) => KernelDecimal
	) : this[typeof decimalResultType]
	{
		// The context allocates from the nearest registered library tier or clone.
		return this.execute(operation) as this[typeof decimalResultType];
	}
}
