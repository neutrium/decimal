
// Based on decimal.js https://github.com/MikeMcl/decimal.js

import { LN10_STR, PI_STR } from './constants.js'
import { DecimalParams } from './DecimalParameters.js'
import { DecimalConfig } from './config/DecimalConfig.js'

// Methods
import { finalise } from './methods/utils/finalise.js'
import { precision } from './methods/utils/precision.js'
import { getDecimalPlaces } from './methods/utils/get-decimal-places.js';
import { getSign } from './methods/utils/get-sign.js';
import { add, sub, mul, div, divToInt, mod, neg, abs } from './methods/arithmetic/index.js'
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

export class Decimal
{
	// Decimal parameters and config
	public static params = DecimalParams;
	private static _config : DecimalConfig = { ...DefaultDecimalConfig };
	private static _activeConstructor : typeof Decimal | null = null;
	static get config() : Readonly<DecimalConfig> { return { ...this._config }};
	static set config(params: Partial<DecimalConfig>) { this.setConfig(params) }

	// Low overhead Getter and setters for config params changed during intermediate calculations
	static get precision() { return this._config.precision };
	static set precision(val: number) { this.setConfig({ precision: val }) }
	static get rounding() { return this._config.rounding };
	static set rounding(val: number) { this.setConfig({ rounding: val as DecimalConfig['rounding'] }) }


	public static get LN10() { return new this(LN10_STR) };
	public static get PI() { return new this(PI_STR) };

	public static clone(config: Partial<DecimalConfig> = {}) : typeof Decimal
	{
		const Parent = this;

		class DecimalClone extends Parent {}

		Object.defineProperty(DecimalClone, '_config', {
			configurable: true,
			value: { ...Parent._config },
			writable: true
		});

		DecimalClone.setConfig(config);

		return DecimalClone;
	}


	//private inexact;  // THink this is only used for binary conversion
	static external = true;
	static quadrant;

	private static get isDecimal() { return /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i; }

	// THe actual representation of the decimal
	public d : number[] | null;		// The digits (Array of integers, each 0 - 1e7, or null)
	public e : number;				// The exponent (Integer, -9e15 to 9e15 inclusive, or NaN)
	public s : number;				// The sign (-1, 1 or NaN)

	constructor(v : string | number | Decimal)
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

	private initialise(v : string | number | Decimal) : this
	{
		let e, i, t,
			x = this;

		// Duplicate.
		if (v instanceof Decimal)
		{
			let vv : number[];

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

			return parseDecimal(x, vv.toString()) as this;

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

			return (Decimal.isDecimal.test(vv) ? parseDecimal(x, vv) : parseOther(x, vv)) as this;
		}
		else
		{
			throw Error("[DecimalError] Invalid Argument " + v);
		}
	}

	dp = () : number => this.execute(() => getDecimalPlaces(this));
	precision = (z ?: boolean | number) : number => this.execute(() => precision(this, z))

	// Arithmetic methods
	add = (y : number | string | Decimal) : Decimal => this.execute(() => add(this, y));
	sub = (y : number | string | Decimal) : Decimal => this.execute(() => sub(this, y));
	mul = (y : number | string | Decimal) : Decimal => this.execute(() => mul(this, y));
	div = (y : number | string | Decimal) : Decimal => this.execute(() => div(this, y));
	divToInt = (y : string | number | Decimal) : Decimal => this.execute(() => divToInt(this, y));
	mod = (yy : number | string | Decimal) : Decimal => this.execute(() => mod(this, yy));
	neg = () : Decimal => this.execute(() => neg(this));
	sign = () : number => this.execute(() => getSign(this));
	abs = () : Decimal => this.execute(() => abs(this));

	// Power methods
	pow = (yy : number | string | Decimal) : Decimal => this.execute(() => pow(this, yy));
	sqrt = () : Decimal => this.execute(() => sqrt(this));
	cbrt = () : Decimal => this.execute(() => cbrt(this));

	// Comparison methods
	min = (...values: (number | string | Decimal)[]) : Decimal => this.execute(() => min(this, ...values))
	max = (...values: (number | string | Decimal)[]) : Decimal => this.execute(() => max(this, ...values))

	// Relational Comparison
	cmp = (w : string | number | Decimal) : number => this.execute(() => cmp(this, w));
	eq =  (y : string | number | Decimal) : boolean => this.execute(() => eq(this, y));
	gt = (y : string | number | Decimal) : boolean => this.execute(() => gt(this, y));
	gte = (y : string | number | Decimal) : boolean => this.execute(() => gte(this, y));
	lt = (y : string | number | Decimal) : boolean => this.execute(() => lt(this, y));
	lte = (y : string | number | Decimal) : boolean => this.execute(() => lte(this, y));

	// Identiy Comparison
	isFinite = () : boolean => this.execute(() => isFinite(this));
	isInt = () : boolean => this.execute(() => isInt(this));
	isNaN = () : boolean => this.execute(() => isNaN(this));
	isNeg = () : boolean => this.execute(() => isNeg(this));
	isPos = () : boolean => this.execute(() => isPos(this));
	isZero = () : boolean => this.execute(() => isZero(this));
	isOdd = () : boolean => this.execute(() => isOdd(this));
	isEven = () : boolean => this.execute(() => isEven(this));

	// Rounding
	ceil = () : Decimal => this.execute(() => ceil(this));
	floor = () : Decimal => this.execute(() => floor(this));
	round = () : Decimal => this.execute(() => round(this));
	trunc = () : Decimal => this.execute(() => finalise(new Decimal(this), this.e + 1, 1));
	toNearest = (yy : number | string | Decimal, rm ?: number) : Decimal => this.execute(() => toNearest(this, yy, rm))

	// Exponential methods
	log = (baseN : number | string | Decimal) : Decimal => this.execute(() => log(this, baseN))
	ln = () : Decimal => this.execute(() => naturalLogarithm(this));
	exp = () : Decimal => this.execute(() => naturalExponential(this));

	// Trigonometric functions
	sin = () : Decimal => this.execute(() => sin(this));
	asin = () : Decimal => this.execute(() => asin(this));
	sinh = () : Decimal => this.execute(() => sinh(this));
	asinh = () : Decimal => this.execute(() => asinh(this));
	cos = () : Decimal => this.execute(() => cos(this));
	acos = () : Decimal => this.execute(() => acos(this));
	cosh = () : Decimal => this.execute(() => cosh(this));
	acosh = () : Decimal => this.execute(() => acosh(this));
	tan = () : Decimal => this.execute(() => tan(this));
	atan = () : Decimal => this.execute(() => atan(this));
	static atan2(y: number | string | Decimal, x: number | string | Decimal) : Decimal
	{
		return Decimal.runWithContext(this, () => atan2(y, x));
	}
	tanh = () : Decimal => this.execute(() => tanh(this));
	atanh = () : Decimal => this.execute(() => atanh(this));

	// to/output methods
	toString = () : string => this.execute(() => toString(this));
	toValue = () : string => this.execute(() => toValue(this));
	toFixed = (dp ?: number, rm ?: number) : string => this.execute(() => toFixed(this, dp, rm));
	toNumber = () : number => this.execute(() => toNumber(this));
	toDP = (dp ?: number, rm ?: number) : Decimal => this.execute(() => toDP(this, dp, rm));
	toSD = (sd ?: number, rm ?: number) : Decimal => this.execute(() => toSignificantDigits(this, sd, rm));
	toExponential = (dp ?: number, rm ?: number) : string => this.execute(() => toExponential(this, dp, rm));
	toPrecision = (sd ?: number, rm ?: number) : string => this.execute(() => toPrecision(this, sd, rm))
	toFraction = (denominator ?: number | string | Decimal) : Decimal[] => this.execute(() => toFraction(this, denominator));


	private execute<T>(operation: () => T) : T
	{
		return Decimal.runWithContext(this.constructor as typeof Decimal, operation);
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

		const ranges : Record<keyof DecimalConfig, readonly [number, number]> = {
			precision: [1, Decimal.params.MAX_DIGITS],
			rounding: [0, 8],
			toExpNeg: [-Decimal.params.EXP_LIMIT, 0],
			toExpPos: [0, Decimal.params.EXP_LIMIT],
			maxE: [0, Decimal.params.EXP_LIMIT],
			minE: [-Decimal.params.EXP_LIMIT, 0],
			modulo: [0, 9]
		};
		const updates : Partial<DecimalConfig> = {};

		for (const p of Object.keys(ranges) as (keyof DecimalConfig)[])
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

		Object.assign(this._config, updates);
	}
}
