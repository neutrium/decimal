import { getCachedPi } from './ConstantCache.js'
import { DECIMAL_LIMITS, type DecimalLimits } from './DecimalLimits.js'
import type { DecimalConfig, DecimalConfigInput } from './config/DecimalConfig.js'
import {
	getRoundingModeCode,
	ROUND_DOWN,
	type RoundingMode
} from './config/RoundingModes.js'

// Methods
import { finalise } from './methods/utils/finalise.js'
import { precision } from './methods/utils/precision.js'
import { getDecimalPlaces } from './methods/utils/get-decimal-places.js';
import { getSign } from './methods/utils/get-sign.js';
import { add, sub } from "./methods/arithmetic/add-subtract.js";
import { mul } from './methods/arithmetic/mul.js'
import { div, divToInt } from './methods/arithmetic/div.js'
import { mod } from './methods/arithmetic/mod.js'
import { neg } from './methods/arithmetic/neg.js'
import { abs } from './methods/arithmetic/abs.js'
import { shift } from './methods/arithmetic/shift.js'
import { pow } from './methods/power/pow.js'
import { sqrt } from './methods/power/sqrt.js'
import { cbrt } from './methods/power/cbrt.js'
import { ceil, floor, round } from './methods/rounding/rounding.js'
import { toNearest } from './methods/rounding/to-nearest.js'

import { min, max } from './methods/compare/min-max.js'
import { cmp, compareDecimals } from './methods/compare/relational-compare.js'
import { isFinite, isInt, isNaN, isNeg, isPos, isZero, isOdd, isEven } from './methods/compare/identity-compare.js'

import { log } from './methods/exponential/log.js';
import { naturalLogarithm } from './methods/exponential/ln.js';
import { naturalExponential } from './methods/exponential/exponential.js';

import { toDP } from './methods/to/to-dp.js'
import { toFixed } from './methods/to/to-fixed.js'
import { toString } from './methods/to/to-string.js'
import { toValue } from './methods/to/to-value.js'
import { toNumber } from './methods/to/to-number.js'
import { toExponential } from './methods/to/to-exponential.js'
import { toPrecision } from './methods/to/to-precision.js'
import { toFraction } from './methods/to/to-fraction.js'
import { toSignificantDigits } from './methods/to/to-significant-digits.js'
import { parseDecimal, parseNumericString } from './methods/utils/parse.js'

import { acos } from './methods/trigonometry/acos.js'
import { acosh } from './methods/trigonometry/acosh.js'
import { asin } from './methods/trigonometry/asin.js'
import { asinh } from './methods/trigonometry/asinh.js'
import { atan } from './methods/trigonometry/atan.js'
import { atan2 } from './methods/trigonometry/atan2.js'
import { atanh } from './methods/trigonometry/atanh.js'
import { cos } from './methods/trigonometry/cos.js'
import { cosh } from './methods/trigonometry/cosh.js'
import { sin } from './methods/trigonometry/sin.js'
import { sinh } from './methods/trigonometry/sinh.js'
import { tan } from './methods/trigonometry/tan.js'
import { tanh } from './methods/trigonometry/tanh.js'
import { DefaultDecimalConfig } from './config/DefaultConfig.js'
import { invalidArgumentError } from './errors.js';
import { CalculationContext } from './CalculationContext.js';
import { checkOverflow } from './methods/utils/check-overflow.js';
import {
	createDecimalState,
	decimalStateAccess,
	getDecimalState,
	getMutableDecimalState,
	type DecimalState
} from './DecimalState.js';
import { ConstructorEnvironment } from './ConstructorEnvironment.js';
import {
	decimalRuntimeAccess,
	type DecimalRuntime
} from './DecimalRuntime.js';

const calculationConstruction = Symbol('Decimal calculation construction');
const resultStateConstruction = Symbol('Decimal result-state construction');
let constructorEnvironment : ConstructorEnvironment;
let decimalRuntime : DecimalRuntime;

type InternalDecimalConstructor = new (
	value : DecimalValue | DecimalState,
	token : symbol,
	context ?: CalculationContext
) => Decimal;

/**
 * A value accepted by the {@link Decimal} constructor and operations.
 *
 * Strings and bigints preserve their exact value. JavaScript numbers are
 * interpreted from their decimal string representation.
 */
export type DecimalValue = string | number | bigint | Decimal;

/**
 * The immutable fraction representation returned by {@link Decimal.toFraction}.
 * Finite values produce `[numerator, denominator]`; non-finite values produce a
 * one-element tuple containing that value.
 */
export type DecimalFraction<T extends Decimal = Decimal> = readonly [T] | readonly [T, T];

/** The independent Decimal constructor returned by {@link Decimal.clone}. */
export interface DecimalConstructor {
	/**
	 * Construct a decimal value.
	 * @param value - A decimal, numeric string, number, or bigint.
	 */
	new (value: DecimalValue): Decimal;
	/** Prototype shared by instances created by this constructor. */
	readonly prototype: Decimal;
	/** Read a frozen snapshot of the constructor's active configuration. */
	get config(): Readonly<DecimalConfig>;
	/**
	 * Apply a partial configuration update to this constructor only.
	 * @param params - Configuration values to validate and merge.
	 */
	set config(params: DecimalConfigInput);
	/** Pi at the active precision. */
	readonly PI: Decimal;
	/** Hard validation limits shared by all Decimal constructors. */
	readonly limits: DecimalLimits;
	/**
	 * Create another independently configurable constructor.
	 * @param config - Optional settings applied after inheriting this constructor's configuration.
	 * @returns A new Decimal constructor with isolated configuration and constant caches.
	 */
	clone(config?: DecimalConfigInput): DecimalConstructor;
	/**
	 * Calculate the angle from the positive x-axis to `(x, y)`.
	 * @param y - The point's y-coordinate.
	 * @param x - The point's x-coordinate.
	 * @returns The angle in radians in the interval `[-PI, PI]`.
	 */
	atan2(y: DecimalValue, x: DecimalValue): Decimal;
	/**
	 * Select the least of one or more values.
	 * @param value - The first value.
	 * @param values - Additional values to compare.
	 * @returns The minimum as an instance created by this constructor.
	 */
	min(value: DecimalValue, ...values: DecimalValue[]): Decimal;
	/**
	 * Select the greatest of one or more values.
	 * @param value - The first value.
	 * @param values - Additional values to compare.
	 * @returns The maximum as an instance created by this constructor.
	 */
	max(value: DecimalValue, ...values: DecimalValue[]): Decimal;
}

/**
 * An immutable arbitrary-precision decimal number.
 *
 * Arithmetic uses the configuration attached to the value's generated Decimal
 * constructor and returns new values without changing its operands.
 *
 * @example
 * ```ts
 * import { Decimal } from '@neutrium/decimal';
 *
 * const TaxDecimal = Decimal.clone({ precision: 24, rounding: 'half-even' });
 * const total = new TaxDecimal('19.99').mul('1.1');
 * total.toFixed(2); // '21.99'
 * ```
 */
export class Decimal
{
	#state : DecimalState;

	static
	{
		const runtime : DecimalRuntime = {
			isDecimal: (value : unknown): value is Decimal => value instanceof Decimal,
			resolveCalculationConstructor: Constructor => constructorEnvironment.getCalculationConstructor(Constructor),
			createForCalculation: (Constructor, value, context) => {
				return new (Constructor as unknown as InternalDecimalConstructor)(
					value,
					calculationConstruction,
					context
				);
			},
			createResultForCalculation: (Constructor, state) => {
				return new (Constructor as unknown as InternalDecimalConstructor)(
					state,
					resultStateConstruction
				);
			}
		};
		decimalRuntime = Object.freeze(runtime);

		constructorEnvironment = new ConstructorEnvironment(Decimal, decimalRuntime, DefaultDecimalConfig);
	}

	/** @internal Provide allocation and branding capabilities to calculation contexts. */
	static [decimalRuntimeAccess]() : DecimalRuntime { return decimalRuntime; }
	/** @internal Provide module-private access to this value's native private state. */
	[decimalStateAccess]() : DecimalState { return this.#state; }

	/** Hard validation limits shared by every Decimal constructor. */
	public static get limits(): DecimalLimits { return DECIMAL_LIMITS; }
	/** Read a frozen snapshot of this constructor's active configuration. */
	static get config() : Readonly<DecimalConfig> { return constructorEnvironment.getConfig(this) };
	/**
	 * Apply a validated partial configuration update to this constructor.
	 * @param params - Settings to merge into the current configuration.
	 */
	static set config(params: DecimalConfigInput) { constructorEnvironment.setConfig(this, params) }
	/** Pi at the active precision. */
	public static get PI(): Decimal { return getCachedPi(constructorEnvironment.getDefaultContext(this)) };
	/**
	 * Select the least of one or more values.
	 * @param value - The first value.
	 * @param values - Additional values to compare.
	 * @returns The minimum as an instance created by the active constructor.
	 */
	public static min(value : DecimalValue, ...values : DecimalValue[]) : Decimal
	{
		const context = constructorEnvironment.getDefaultContext(this);
		return min(value, context, ...values);
	}
	/**
	 * Select the greatest of one or more values.
	 * @param value - The first value.
	 * @param values - Additional values to compare.
	 * @returns The maximum as an instance created by the active constructor.
	 */
	public static max(value : DecimalValue, ...values : DecimalValue[]) : Decimal
	{
		const context = constructorEnvironment.getDefaultContext(this);
		return max(value, context, ...values);
	}

	/**
	 * Create an independently configurable Decimal constructor.
	 * @param config - Optional settings applied after inheriting this constructor's configuration.
	 * @returns A constructor with isolated configuration and constant caches.
	 */
	public static clone(
		config: DecimalConfigInput = {}
	) : DecimalConstructor
	{
		const Parent = constructorEnvironment.getCalculationConstructor(this);

		class DecimalClone extends Parent {}
		constructorEnvironment.registerClone(DecimalClone, this, config);

		return DecimalClone;
	}

	/**
	 * Create a Decimal from an exact numeric input.
	 * @param v - A Decimal, numeric string, number, or bigint.
	 * @throws {@link DecimalError} if the input is invalid or exceeds a configured limit.
	 */
	constructor(v : DecimalValue);
	constructor(v : DecimalValue | DecimalState, token ?: symbol, context ?: CalculationContext)
	{
		if (token === resultStateConstruction)
		{
			this.#state = v as DecimalState;
			return this;
		}

		this.#state = createDecimalState();

		const Constructor = new.target as typeof Decimal;
		const result = this.initialise(
			v as DecimalValue,
			token === calculationConstruction && context
				? context
				: constructorEnvironment.getDefaultContext(Constructor)
		);

		return result as this;
	}

	private initialise(v : DecimalValue, context : CalculationContext) : this
	{
		let e, i,
			x = this;
		const state = getMutableDecimalState(x);

		// Duplicate.
		if (v instanceof Decimal)
		{
			let vv : readonly number[] | null;
			const source = getDecimalState(v);

			state.s = source.s;
			state.e = source.e;
			state.d = (vv = source.d) ? vv.slice() : vv;

			checkOverflow(x, context);
			return x;
		}
		else if (typeof v === 'number')
		{
			let vv : number;

			if (v === 0)
			{
				state.s = (1 / v < 0) ? -1 : 1;
				state.e = 0;
				state.d = [0];

				return x;
			}

			if (v < 0)
			{
				vv = -v;
				state.s = -1;
			}
			else
			{
				vv = v;
				state.s = 1;
			}

			// Fast path for small integers.
			if (vv === ~~vv && vv < 1e7)
			{
				for (e = 0, i = vv; i >= 10; i /= 10) e++;
				state.e = e;
				state.d = [vv];
				checkOverflow(x, context);
				return x;
			}
			else if (vv * 0 !== 0) // Infinity, NaN.
			{
				if (!vv) state.s = NaN;
				state.e = NaN;
				state.d = null;
				return x;
			}

			return parseDecimal(x, vv.toString(), context) as this;

		}
		else if (typeof v === 'bigint')
		{
			const negative = v < 0n;

			state.s = negative ? -1 : 1;

			return parseDecimal(
				x,
				(negative ? -v : v).toString(),
				context
			) as this;
		}
		else if(typeof v === 'string')
		{
			let vv : string;

			// Minus sign?
			if (v.charCodeAt(0) === 45)
			{
				vv = v.slice(1);
				state.s = -1;
			}
			else
			{
				vv = v;
				state.s = 1;
			}

			return parseNumericString(x, vv, context) as this;
		}
		else
		{
			throw invalidArgumentError(v);
		}
	}

	/** @returns The number of digits after the decimal point, or `NaN` for a non-finite value. */
	dp() : number { return getDecimalPlaces(this); }
	/**
	 * Count this value's significant digits.
	 * @param z - Include trailing integer zeros when `true`.
	 * @returns The significant-digit count, or `NaN` for a non-finite value.
	 */
	precision(z ?: boolean) : number { return precision(this, z); }

	// Arithmetic methods
	/**
	 * Add a value.
	 * @param y - The addend.
	 * @returns The sum as a new Decimal.
	 */
	add(y : DecimalValue) : Decimal { return this.executeDecimal(context => add(this, y, context)); }
	/**
	 * Subtract a value.
	 * @param y - The subtrahend.
	 * @returns The difference as a new Decimal.
	 */
	sub(y : DecimalValue) : Decimal { return this.executeDecimal(context => sub(this, y, context)); }
	/**
	 * Multiply by a value.
	 * @param y - The multiplier.
	 * @returns The product as a new Decimal.
	 */
	mul(y : DecimalValue) : Decimal { return this.executeDecimal(context => mul(this, y, context)); }
	/**
	 * Divide by a value using the active precision and rounding mode.
	 * @param y - The divisor.
	 * @returns The quotient as a new Decimal.
	 */
	div(y : DecimalValue) : Decimal { return this.executeDecimal(context => div(this, y, context)); }
	/**
	 * Divide by a value and truncate the quotient toward zero.
	 * @param y - The divisor.
	 * @returns The integer quotient as a new Decimal.
	 */
	divToInt(y : DecimalValue) : Decimal { return this.executeDecimal(context => divToInt(this, y, context)); }
	/**
	 * Calculate a remainder using the configured modulo mode.
	 * @param yy - The divisor.
	 * @returns The remainder as a new Decimal.
	 */
	mod(yy : DecimalValue) : Decimal { return this.executeDecimal(context => mod(this, yy, context)); }
	/** @returns A new Decimal with the sign inverted, including for signed zero. */
	neg() : Decimal { return this.executeDecimal(context => neg(this, context)); }
	/** @returns `-1`, `-0`, `0`, `1`, or `NaN` according to this value's sign and state. */
	sign() : number { return getSign(this); }
	/** @returns The absolute value as a new Decimal. */
	abs() : Decimal { return this.executeDecimal(context => abs(this, context)); }
	/**
	 * Shift the decimal point by a power of ten without changing the source value.
	 * @param places - A safe integer number of places; positive values shift right.
	 * @returns The shifted value as a new Decimal.
	 */
	shift(places : number) : Decimal { return this.executeDecimal(context => shift(this, places, context)); }

	// Power methods
	/**
	 * Raise this value to a power using the active precision and rounding mode.
	 * @param yy - The exponent.
	 * @returns The power as a new Decimal.
	 */
	pow(yy : DecimalValue) : Decimal { return this.executeDecimal(context => pow(this, yy, context)); }
	/** @returns The principal square root, or `NaN` when this value is negative. */
	sqrt() : Decimal { return this.executeDecimal(context => sqrt(this, context)); }
	/** @returns The real cube root as a new Decimal. */
	cbrt() : Decimal { return this.executeDecimal(context => cbrt(this, context)); }

	// Relational Comparison
	/**
	 * Compare this value with another value.
	 * @param w - The value to compare.
	 * @returns `-1`, `0`, or `1`; returns `NaN` if either value is `NaN`.
	 */
	cmp(w : DecimalValue) : number
	{
		return w instanceof Decimal
			? compareDecimals(this, w)
			: this.execute(context => cmp(this, w, context));
	}
	/** @param y - The value to compare. @returns Whether the values compare equal. */
	eq(y : DecimalValue) : boolean { return this.cmp(y) === 0; }
	/** @param y - The value to compare. @returns Whether this value is greater than `y`. */
	gt(y : DecimalValue) : boolean { return this.cmp(y) > 0; }
	/** @param y - The value to compare. @returns Whether this value is greater than or equal to `y`. */
	gte(y : DecimalValue) : boolean
	{
		const comparison = this.cmp(y);

		return comparison === 1 || comparison === 0;
	}
	/** @param y - The value to compare. @returns Whether this value is less than `y`. */
	lt(y : DecimalValue) : boolean { return this.cmp(y) < 0; }
	/** @param y - The value to compare. @returns Whether this value is less than or equal to `y`. */
	lte(y : DecimalValue) : boolean { return this.cmp(y) < 1; }

	// Identiy Comparison
	/** @returns Whether this value is neither `NaN` nor positive or negative Infinity. */
	isFinite() : boolean { return isFinite(this); }
	/** @returns Whether this value is finite and has no fractional digits. */
	isInt() : boolean { return isInt(this); }
	/** @returns Whether this value is `NaN`. */
	isNaN() : boolean { return isNaN(this); }
	/** @returns Whether this value has a negative sign, including negative zero. */
	isNeg() : boolean { return isNeg(this); }
	/** @returns Whether this value has a positive sign, including positive zero. */
	isPos() : boolean { return isPos(this); }
	/** @returns Whether this value is positive or negative zero. */
	isZero() : boolean { return isZero(this); }
	/** @returns Whether this value is a finite odd integer. */
	isOdd() : boolean { return isOdd(this); }
	/** @returns Whether this value is a finite even integer. */
	isEven() : boolean { return isEven(this); }

	// Rounding
	/** @returns This value rounded to an integer toward positive Infinity. */
	ceil() : Decimal { return this.executeDecimal(context => ceil(this, context)); }
	/** @returns This value rounded to an integer toward negative Infinity. */
	floor() : Decimal { return this.executeDecimal(context => floor(this, context)); }
	/** @returns This value rounded to an integer with the configured rounding mode. */
	round() : Decimal { return this.executeDecimal(context => round(this, context)); }
	/** @returns This value truncated to an integer toward zero. */
	trunc() : Decimal
	{
		const exponent = getDecimalState(this).e;
		return this.executeDecimal(context => finalise(
			context.createExact(this),
			exponent + 1,
			ROUND_DOWN,
			undefined,
			context
		));
	}
	/**
	 * Round to a multiple of another value.
	 * @param yy - The target multiple; its sign is ignored and it defaults to `1`.
	 * @param rm - The rounding mode; defaults to the configured mode.
	 * @returns The rounded value as a new Decimal.
	 */
	toNearest(yy ?: DecimalValue, rm ?: RoundingMode) : Decimal
	{
		return this.executeDecimal(context => toNearest(this, yy, rm === void 0 ? context.roundingCode : getRoundingModeCode(rm), context));
	}

	// Exponential methods
	/**
	 * Calculate a logarithm in an arbitrary base.
	 * @param baseN - The logarithm base.
	 * @returns The logarithm as a new Decimal, or `NaN` when the domain is invalid.
	 */
	log(baseN : DecimalValue) : Decimal { return this.executeDecimal(context => log(this, baseN, context)); }
	/** @returns The natural logarithm, or `NaN` when this value is negative. */
	ln() : Decimal { return this.executeDecimal(context => naturalLogarithm(this, undefined, context)); }
	/** @returns Euler's number raised to this value. */
	exp() : Decimal { return this.executeDecimal(context => naturalExponential(this, undefined, context)); }

	// Trigonometric functions
	/** @returns The sine of this radian value. */
	sin() : Decimal { return this.executeDecimal(context => sin(this, context)); }
	/** @returns The inverse sine in radians, or `NaN` outside `[-1, 1]`. */
	asin() : Decimal { return this.executeDecimal(context => asin(this, context)); }
	/** @returns The hyperbolic sine. */
	sinh() : Decimal { return this.executeDecimal(context => sinh(this, context)); }
	/** @returns The inverse hyperbolic sine. */
	asinh() : Decimal { return this.executeDecimal(context => asinh(this, context)); }
	/** @returns The cosine of this radian value. */
	cos() : Decimal { return this.executeDecimal(context => cos(this, context)); }
	/** @returns The inverse cosine in radians, or `NaN` outside `[-1, 1]`. */
	acos() : Decimal { return this.executeDecimal(context => acos(this, context)); }
	/** @returns The hyperbolic cosine. */
	cosh() : Decimal { return this.executeDecimal(context => cosh(this, context)); }
	/** @returns The inverse hyperbolic cosine, or `NaN` below `1`. */
	acosh() : Decimal { return this.executeDecimal(context => acosh(this, context)); }
	/** @returns The tangent of this radian value. */
	tan() : Decimal { return this.executeDecimal(context => tan(this, context)); }
	/** @returns The inverse tangent in radians. */
	atan() : Decimal { return this.executeDecimal(context => atan(this, context)); }
	/**
	 * Calculate the angle from the positive x-axis to `(x, y)`.
	 * @param y - The point's y-coordinate.
	 * @param x - The point's x-coordinate.
	 * @returns The angle in radians in the interval `[-PI, PI]`.
	 */
	static atan2(y: DecimalValue, x: DecimalValue) : Decimal
	{
		const context = constructorEnvironment.getDefaultContext(this);
		const result = atan2(y, x, context);

		return result;
	}
	/** @returns The hyperbolic tangent. */
	tanh() : Decimal { return this.executeDecimal(context => tanh(this, context)); }
	/** @returns The inverse hyperbolic tangent, or `NaN` outside `[-1, 1]`. */
	atanh() : Decimal { return this.executeDecimal(context => atanh(this, context)); }

	// to/output methods
	/**
	 * Format this value in canonical fixed or exponential notation.
	 * @returns A string using the configured exponential thresholds. Negative zero is rendered as `0`.
	 */
	toString() : string { return this.execute(context => toString(this, context)); }
	/** @returns The exact primitive string value, preserving negative zero as `-0`. */
	toValue() : string { return this.execute(context => toValue(this, context)); }
	/** @returns The exact string used by default JavaScript coercion, preserving negative zero. */
	valueOf() : string { return this.toValue(); }
	/** @returns The exact value JSON serializes as a string, including signed zero and non-finite values. */
	toJSON() : string { return this.toValue(); }
	/**
	 * Convert according to JavaScript's primitive hint. Numeric coercion returns a number;
	 * string coercion uses the canonical representation; default coercion preserves negative zero.
	 * @param hint - The coercion hint supplied by JavaScript.
	 * @returns A number for the `number` hint; otherwise an exact string representation.
	 */
	[Symbol.toPrimitive](hint : 'default' | 'number' | 'string') : string | number
	{
		return hint === 'number'
			? this.toNumber()
			: hint === 'string' ? this.toString() : this.toValue();
	}
	/**
	 * Format this value in fixed-point notation.
	 * @param dp - Decimal places to emit. Omit to retain all coefficient digits.
	 * @param rm - Rounding mode; defaults to the configured mode.
	 * @returns The fixed-point string, preserving a negative sign when rounding negative values to zero.
	 */
	toFixed(dp ?: number, rm ?: RoundingMode) : string
	{
		return this.execute(context => toFixed(this, dp, rm === void 0 ? context.roundingCode : getRoundingModeCode(rm), context));
	}
	/** @returns The nearest JavaScript number; values outside its range become signed Infinity or zero. */
	toNumber() : number { return toNumber(this); }
	/**
	 * Round to a maximum number of decimal places.
	 * @param dp - Maximum decimal places. Omit to return an equal new Decimal.
	 * @param rm - Rounding mode; defaults to the configured mode.
	 * @returns The rounded value as a new Decimal.
	 */
	toDP(dp ?: number, rm ?: RoundingMode) : Decimal
	{
		return this.executeDecimal(context => toDP(this, dp, rm === void 0 ? context.roundingCode : getRoundingModeCode(rm), context));
	}
	/**
	 * Round to a maximum number of significant digits.
	 * @param sd - Maximum significant digits; defaults to the active precision.
	 * @param rm - Rounding mode; defaults to the configured mode.
	 * @returns The rounded value as a new Decimal.
	 */
	toSD(sd ?: number, rm ?: RoundingMode) : Decimal
	{
		return this.executeDecimal(context => toSignificantDigits(this, sd, rm === void 0 ? context.roundingCode : getRoundingModeCode(rm), context));
	}
	/**
	 * Format this value in exponential notation.
	 * @param dp - Digits after the decimal point. Omit to retain all coefficient digits.
	 * @param rm - Rounding mode; defaults to the configured mode.
	 * @returns The exponential-notation string.
	 */
	toExponential(dp ?: number, rm ?: RoundingMode) : string
	{
		return this.execute(context => toExponential(this, dp, rm === void 0 ? context.roundingCode : getRoundingModeCode(rm), context));
	}
	/**
	 * Format this value with a specified number of significant digits.
	 * @param sd - Significant digits to emit. Omit to use the canonical representation.
	 * @param rm - Rounding mode; defaults to the configured mode.
	 * @returns A fixed- or exponential-notation string, matching JavaScript precision formatting thresholds.
	 */
	toPrecision(sd ?: number, rm ?: RoundingMode) : string
	{
		return this.execute(context => toPrecision(this, sd, rm === void 0 ? context.roundingCode : getRoundingModeCode(rm), context));
	}
	/**
	 * Approximate this value as a fraction.
	 * @param denominator - Optional maximum positive denominator.
	 * @returns A frozen `[numerator, denominator]` tuple, or `[value]` for a non-finite value.
	 */
	toFraction(denominator ?: DecimalValue) : DecimalFraction
	{
		return this.executeFraction(context => toFraction(this, denominator, context));
	}


	private execute<T>(operation: (context: CalculationContext) => T) : T
	{
		const Constructor = this.constructor as typeof Decimal;
		return operation(constructorEnvironment.getDefaultContext(Constructor));
	}

	/** Dispatch Decimal-returning operations through the active immutable context. */
	private executeDecimal(operation: (context: CalculationContext) => Decimal) : Decimal
	{
		return this.execute(operation);
	}

	private executeFraction(operation: (context: CalculationContext) => DecimalFraction) : DecimalFraction
	{
		const result = this.execute(operation);
		return Object.freeze(result) as DecimalFraction;
	}

}
