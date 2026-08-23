
// Based on decimal.js https://github.com/MikeMcl/decimal.js

import { LN10_STR, PI_STR } from './constants.js'
import { DecimalParams, type DecimalParameters } from './DecimalParameters.js'
import type { DecimalConfig } from './config/DecimalConfig.js'
import {
	getModuloModeCode,
	getRoundingModeCode,
	normaliseModuloMode,
	normaliseRoundingMode,
	type ModuloCode,
	type RoundingCode,
	type RoundingMode
} from './config/RoundingModes.js'

// Methods
import { finalise } from './methods/utils/finalise.js'
import { precision } from './methods/utils/precision.js'
import { getDecimalPlaces } from './methods/utils/get-decimal-places.js';
import { getSign } from './methods/utils/get-sign.js';
import { add, sub, mul, div, divToInt, mod, neg, abs, shift } from './methods/arithmetic/index.js'
import { pow, sqrt, cbrt } from './methods/power/index.js';
import { ceil, floor, round, truncate, toNearest } from './methods/rounding/index.js'

import { min, max } from './methods/compare/min-max.js'
import { eq, cmp, gt, gte, lt, lte } from './methods/compare/relational-compare.js'
import { isFinite, isInt, isNaN, isNeg, isPos, isZero, isOdd, isEven } from './methods/compare/identity-compare.js'

import { log, naturalLogarithm, naturalExponential } from './methods/exponential/index.js';

import { toDP, toFixed, toString, toValue, toNumber, toExponential, toPrecision, toFraction, toSignificantDigits } from './methods/to/index.js'
import { parseDecimal, parseOther } from './methods/utils/parse.js'

import { cos, acos, cosh, acosh, sin, asin, sinh, asinh, tan, atan, tanh, atanh, atan2 } from './methods/trigonometry/index.js'
import { DefaultDecimalConfig } from './config/DefaultConfig.js'

/** A value accepted by the Decimal constructor and Decimal arithmetic methods. */
export type DecimalValue = string | number | Decimal;

/** A scalar Decimal input or a readonly, one-level collection of Decimal inputs. */
export type DecimalValueCollection = DecimalValue | readonly DecimalValue[];

/** The fraction representation returned for finite and non-finite Decimal values. */
export type DecimalFraction<T extends Decimal = Decimal> = [T] | [T, T];

/** Whether `precision` should count trailing integer zeroes. */
export type PrecisionTrailingZeros = boolean | 0 | 1;

/** The public static interface of a Decimal constructor returned by `Decimal.clone`. */
export interface DecimalConstructor<T extends Decimal = Decimal> {
	new (value: DecimalValue): T;
	readonly prototype: T;
	get config(): Readonly<DecimalConfig>;
	set config(params: Partial<DecimalConfig>);
	precision: number;
	rounding: RoundingMode;
	readonly LN10: T;
	readonly PI: T;
	readonly params: DecimalParameters;
	clone(config?: Partial<DecimalConfig>): DecimalConstructor<T>;
	atan2(y: DecimalValue, x: DecimalValue): T;
}

/** An arbitrary-precision decimal number. */
export class Decimal
{
	// Decimal parameters and config
	public static readonly params: DecimalParameters = DecimalParams;
	private static _config : DecimalConfig = { ...DefaultDecimalConfig };
	private static _activeConstructor : typeof Decimal | null = null;
	/** A readonly snapshot of this constructor's active configuration. Assign a partial object to update it. */
	static get config() : Readonly<DecimalConfig> { return { ...this._config }};
	static set config(params: Partial<DecimalConfig>) { this.setConfig(params) }

	// Low overhead Getter and setters for config params changed during intermediate calculations
	/** The maximum significant-digit precision used by calculations. */
	static get precision(): number { return this._config.precision };
	static set precision(val: number) { this.setConfig({ precision: val }) }
	/** The rounding mode used by calculations and conversions. */
	static get rounding(): RoundingMode { return this._config.rounding };
	static set rounding(val: RoundingMode) { this.setConfig({ rounding: val }) }
	/** @internal */
	static get roundingCode(): RoundingCode { return getRoundingModeCode(this._config.rounding) };
	/** @internal */
	static set roundingCode(val: RoundingCode) { this._config.rounding = normaliseRoundingMode(val) }
	/** @internal */
	static get moduloCode(): ModuloCode { return getModuloModeCode(this._config.modulo) };


	/** The natural logarithm of 10, constructed with this Decimal constructor. */
	public static get LN10(): Decimal { return new this(LN10_STR) };
	/** Pi, constructed with this Decimal constructor. */
	public static get PI(): Decimal { return new this(PI_STR) };

	/** Create an independent Decimal constructor whose configuration starts with this constructor's settings. */
	public static clone<T extends typeof Decimal>(
		this: T,
		config: Partial<DecimalConfig> = {}
	) : DecimalConstructor<InstanceType<T>>
	{
		const Parent: typeof Decimal = this;

		class DecimalClone extends Parent {}

		Object.defineProperty(DecimalClone, '_config', {
			configurable: true,
			value: { ...Parent._config },
			writable: true
		});

		DecimalClone.setConfig(config);

		return DecimalClone as unknown as DecimalConstructor<InstanceType<T>>;
	}


	//private inexact;  // THink this is only used for binary conversion
	/** @internal */
	static external: boolean = true;
	/** @internal */
	static quadrant: 1 | 2 | 3 | 4 | undefined;

	private static get isDecimal() { return /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i; }

	// THe actual representation of the decimal
	/** @internal The digits (array values are integers from 0 through 1e7, or null). */
	public d! : number[] | null;
	/** @internal The base-10 exponent, or NaN for a non-finite value. */
	public e! : number;
	/** @internal The sign, represented by -1, 1, or NaN. */
	public s! : number;

	/** Create a Decimal from a number, numeric string, or another Decimal. */
	constructor(v : DecimalValue)
	{
		const Constructor = new.target as typeof Decimal;

		// Intermediate values are constructed with `new Decimal` throughout the implementation.
		// Redirect them to the constructor whose calculation context is currently active.
		if (Constructor === Decimal && Decimal._activeConstructor && Decimal._activeConstructor !== Decimal)
		{
			return Reflect.construct(Decimal, [v], Decimal._activeConstructor);
		}

		return Decimal.runWithContext(Constructor, () => this.initialise(v));
	}

	private initialise(v : DecimalValue) : this
	{
		let e, i, t,
			x = this;

		// Duplicate.
		if (v instanceof Decimal)
		{
			let vv : number[] | null;

			x.s = v.s;
			x.e = v.e;
			x.d = (vv = v.d) ? vv.slice() : vv;

			return x;
		}
		else if (typeof v === 'number')
		{
			let vv : number;

			if (v === 0)
			{
				x.s = (1 / v < 0) ? -1 : 1;
				x.e = 0;
				x.d = [0];

				return x;
			}

			if (v < 0)
			{
				vv = -v;
				x.s = -1;
			}
			else
			{
				vv = v;
				x.s = 1;
			}

			// Fast path for small integers.
			if (vv === ~~vv && vv < 1e7)
			{
				for (e = 0, i = vv; i >= 10; i /= 10) e++;
				x.e = e;
				x.d = [vv];
				return x;
			}
			else if (vv * 0 !== 0) // Infinity, NaN.
			{
				if (!vv) x.s = NaN;
				x.e = NaN;
				x.d = null;
				return x;
			}

			return Decimal.castSubclass<this>(parseDecimal(x, vv.toString()));

		}
		else if(typeof v === 'string')
		{
			let vv : string;

			// Minus sign?
			if (v.charCodeAt(0) === 45)
			{
				vv = v.slice(1);
				x.s = -1;
			}
			else
			{
				vv = v;
				x.s = 1;
			}

			return Decimal.castSubclass<this>(Decimal.isDecimal.test(vv) ? parseDecimal(x, vv) : parseOther(x, vv));
		}
		else
		{
			throw Error("[DecimalError] Invalid Argument " + v);
		}
	}

	/** Return the number of decimal places. */
	dp = () : number => this.execute(() => getDecimalPlaces(this));
	/** Return the number of significant digits. */
	precision = (z ?: PrecisionTrailingZeros) : number => this.execute(() => precision(this, z))

	// Arithmetic methods
	/** Add a value and return a Decimal of the same runtime constructor. */
	add = (y : DecimalValue) : this => this.executeDecimal(() => add(this, y));
	/** Subtract a value and return a Decimal of the same runtime constructor. */
	sub = (y : DecimalValue) : this => this.executeDecimal(() => sub(this, y));
	/** Multiply by a value and return a Decimal of the same runtime constructor. */
	mul = (y : DecimalValue) : this => this.executeDecimal(() => mul(this, y));
	/** Divide by a value and return a Decimal of the same runtime constructor. */
	div = (y : DecimalValue) : this => this.executeDecimal(() => div(this, y));
	/** Divide by a value and truncate the result to an integer. */
	divToInt = (y : DecimalValue) : this => this.executeDecimal(() => divToInt(this, y));
	/** Return the remainder after division using the configured modulo mode. */
	mod = (yy : DecimalValue) : this => this.executeDecimal(() => mod(this, yy));
	/** Return this value with its sign inverted. */
	neg = () : this => this.executeDecimal(() => neg(this));
	/** Return -1, 0, 1, or NaN according to this value's sign and state. */
	sign = () : number => this.execute(() => getSign(this));
	/** Return the absolute value. */
	abs = () : this => this.executeDecimal(() => abs(this));
	/** Shift the decimal point by an integer number of places. */
	shift = (places : number) : this => this.executeDecimal(() => shift(this, places));

	// Power methods
	/** Raise this value to a power. */
	pow = (yy : DecimalValue) : this => this.executeDecimal(() => pow(this, yy));
	/** Return the square root. */
	sqrt = () : this => this.executeDecimal(() => sqrt(this));
	/** Return the cube root. */
	cbrt = () : this => this.executeDecimal(() => cbrt(this));

	// Comparison methods
	/** Return the minimum of this value and all supplied values. */
	min = (...values: DecimalValueCollection[]) : this => this.executeDecimal(() => min(this, ...values))
	/** Return the maximum of this value and all supplied values. */
	max = (...values: DecimalValueCollection[]) : this => this.executeDecimal(() => max(this, ...values))

	// Relational Comparison
	/** Compare this value with another, returning -1, 0, 1, or NaN. */
	cmp = (w : DecimalValue) : number => this.execute(() => cmp(this, w));
	/** Return whether this value equals another value. */
	eq =  (y : DecimalValue) : boolean => this.execute(() => eq(this, y));
	/** Return whether this value is greater than another value. */
	gt = (y : DecimalValue) : boolean => this.execute(() => gt(this, y));
	/** Return whether this value is greater than or equal to another value. */
	gte = (y : DecimalValue) : boolean => this.execute(() => gte(this, y));
	/** Return whether this value is less than another value. */
	lt = (y : DecimalValue) : boolean => this.execute(() => lt(this, y));
	/** Return whether this value is less than or equal to another value. */
	lte = (y : DecimalValue) : boolean => this.execute(() => lte(this, y));

	// Identiy Comparison
	/** Return whether this value is finite. */
	isFinite = () : boolean => this.execute(() => isFinite(this));
	/** Return whether this value is an integer. */
	isInt = () : boolean => this.execute(() => isInt(this));
	/** Return whether this value is NaN. */
	isNaN = () : boolean => this.execute(() => isNaN(this));
	/** Return whether this value is negative, including negative zero. */
	isNeg = () : boolean => this.execute(() => isNeg(this));
	/** Return whether this value is positive. */
	isPos = () : boolean => this.execute(() => isPos(this));
	/** Return whether this value is positive or negative zero. */
	isZero = () : boolean => this.execute(() => isZero(this));
	/** Return whether this value is an odd integer. */
	isOdd = () : boolean => this.execute(() => isOdd(this));
	/** Return whether this value is an even integer. */
	isEven = () : boolean => this.execute(() => isEven(this));

	// Rounding
	/** Round toward positive infinity. */
	ceil = () : this => this.executeDecimal(() => ceil(this));
	/** Round toward negative infinity. */
	floor = () : this => this.executeDecimal(() => floor(this));
	/** Round to an integer using the configured rounding mode. */
	round = () : this => this.executeDecimal(() => round(this));
	/** Truncate toward zero. */
	trunc = () : this => this.executeDecimal(() => finalise(new Decimal(this), this.e + 1, 1));
	/** Round to the nearest multiple of a value. */
	toNearest = (yy : DecimalValue, rm ?: RoundingMode) : this => this.executeDecimal(() => toNearest(this, yy, rm === void 0 ? void 0 : getRoundingModeCode(rm)))

	// Exponential methods
	/** Return the logarithm in the supplied base. */
	log = (baseN : DecimalValue) : this => this.executeDecimal(() => log(this, baseN))
	/** Return the natural logarithm. */
	ln = () : this => this.executeDecimal(() => naturalLogarithm(this));
	/** Return e raised to this value. */
	exp = () : this => this.executeDecimal(() => naturalExponential(this));

	// Trigonometric functions
	/** Return the sine of this value in radians. */
	sin = () : this => this.executeDecimal(() => sin(this));
	/** Return the inverse sine in radians. */
	asin = () : this => this.executeDecimal(() => asin(this));
	/** Return the hyperbolic sine. */
	sinh = () : this => this.executeDecimal(() => sinh(this));
	/** Return the inverse hyperbolic sine. */
	asinh = () : this => this.executeDecimal(() => asinh(this));
	/** Return the cosine of this value in radians. */
	cos = () : this => this.executeDecimal(() => cos(this));
	/** Return the inverse cosine in radians. */
	acos = () : this => this.executeDecimal(() => acos(this));
	/** Return the hyperbolic cosine. */
	cosh = () : this => this.executeDecimal(() => cosh(this));
	/** Return the inverse hyperbolic cosine. */
	acosh = () : this => this.executeDecimal(() => acosh(this));
	/** Return the tangent of this value in radians. */
	tan = () : this => this.executeDecimal(() => tan(this));
	/** Return the inverse tangent in radians. */
	atan = () : this => this.executeDecimal(() => atan(this));
	/** Return the angle in radians from the positive x-axis to the point `(x, y)`. */
	static atan2<T extends typeof Decimal>(this: T, y: DecimalValue, x: DecimalValue) : InstanceType<T>
	{
		return Decimal.castSubclass<InstanceType<T>>(Decimal.runWithContext(this, () => atan2(y, x)));
	}
	/** Return the hyperbolic tangent. */
	tanh = () : this => this.executeDecimal(() => tanh(this));
	/** Return the inverse hyperbolic tangent. */
	atanh = () : this => this.executeDecimal(() => atanh(this));

	// to/output methods
	/** Return the canonical string representation. */
	toString = () : string => this.execute(() => toString(this));
	/** Return the primitive string value, preserving negative zero. */
	toValue = () : string => this.execute(() => toValue(this));
	/** Return fixed-point notation with an optional decimal-place count and rounding mode. */
	toFixed = (dp ?: number, rm ?: RoundingMode) : string => this.execute(() => toFixed(this, dp, rm === void 0 ? void 0 : getRoundingModeCode(rm)));
	/** Convert to a JavaScript number. */
	toNumber = () : number => this.execute(() => toNumber(this));
	/** Round to a maximum number of decimal places. */
	toDP = (dp ?: number, rm ?: RoundingMode) : this => this.executeDecimal(() => toDP(this, dp, rm === void 0 ? void 0 : getRoundingModeCode(rm)));
	/** Round to a maximum number of significant digits. */
	toSD = (sd ?: number, rm ?: RoundingMode) : this => this.executeDecimal(() => toSignificantDigits(this, sd, rm === void 0 ? void 0 : getRoundingModeCode(rm)));
	/** Return exponential notation with optional precision and rounding. */
	toExponential = (dp ?: number, rm ?: RoundingMode) : string => this.execute(() => toExponential(this, dp, rm === void 0 ? void 0 : getRoundingModeCode(rm)));
	/** Return precision notation with optional significant digits and rounding. */
	toPrecision = (sd ?: number, rm ?: RoundingMode) : string => this.execute(() => toPrecision(this, sd, rm === void 0 ? void 0 : getRoundingModeCode(rm)))
	/** Return `[numerator, denominator]`, or a one-element tuple for a non-finite value. */
	toFraction = (denominator ?: DecimalValue) : DecimalFraction<this> => this.executeFraction(() => toFraction(this, denominator));


	private execute<T>(operation: () => T) : T
	{
		return Decimal.runWithContext(this.constructor as typeof Decimal, operation);
	}

	/** Centralise the runtime-constructor guarantee for Decimal-returning operations. */
	private executeDecimal(operation: () => Decimal) : this
	{
		return Decimal.castSubclass<this>(this.execute(operation));
	}

	private executeFraction(operation: () => DecimalFraction) : DecimalFraction<this>
	{
		const result = this.execute(operation);

		return result.length === 1
			? [Decimal.castSubclass<this>(result[0])]
			: [Decimal.castSubclass<this>(result[0]), Decimal.castSubclass<this>(result[1])];
	}

	private static castSubclass<T extends Decimal>(value: Decimal) : T
	{
		return value as T;
	}

	private static runWithContext<T>(Constructor: typeof Decimal, operation: () => T) : T
	{
		if (Decimal._activeConstructor === Constructor)
		{
			return operation();
		}

		const previousConstructor = Decimal._activeConstructor,
			previousConfig = Decimal._config,
			previousExternal = Decimal.external,
			previousQuadrant = Decimal.quadrant,
			targetConfig = Constructor._config,
			targetConfigSnapshot = { ...targetConfig };

		Decimal._activeConstructor = Constructor;
		Decimal._config = targetConfig;
		Decimal.external = true;
		Decimal.quadrant = undefined;

		try
		{
			return operation();
		}
		finally
		{
			Object.assign(targetConfig, targetConfigSnapshot);
			Decimal._config = previousConfig;
			Decimal.external = previousExternal;
			Decimal.quadrant = previousQuadrant;
			Decimal._activeConstructor = previousConstructor;
		}
	}

	private static setConfig(config: Partial<DecimalConfig>)
	{
		if (!config || typeof config !== 'object')
		{
			throw Error('[DecimalError] Object expected');
		}

		const ranges = {
			precision: [1, Decimal.params.MAX_DIGITS],
			toExpNeg: [-Decimal.params.EXP_LIMIT, 0],
			toExpPos: [0, Decimal.params.EXP_LIMIT],
			maxE: [0, Decimal.params.EXP_LIMIT],
			minE: [-Decimal.params.EXP_LIMIT, 0]
		} as const;
		const updates : Partial<DecimalConfig> = {};

		for (const p of Object.keys(ranges) as (keyof typeof ranges)[])
		{
			const v = config[p];

			if (v !== void 0)
			{
				const [min, max] = ranges[p];

				if (Math.floor(v) === v && v >= min && v <= max)
				{
					(updates as Record<string, number>)[p] = v;
				}
				else
				{
					throw Error("[DecimalError] Invalid configuration parameter: " + p + ': ' + v);
				}
			}
		}

		if (config.rounding !== void 0) updates.rounding = normaliseRoundingMode(config.rounding);
		if (config.modulo !== void 0) updates.modulo = normaliseModuloMode(config.modulo);

		Object.assign(this._config, updates);
	}
}
