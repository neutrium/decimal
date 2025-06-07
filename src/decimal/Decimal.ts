
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
	private static _config : DecimalConfig = DefaultDecimalConfig;
	static get config() { return Decimal._config};
	static set config(params: any) { Decimal.setConfig(params) }

	// Low overhead Getter and setters for config params changed during intermediate calculations
	static get precision() { return Decimal._config.precision };
	static set precision(val: number) { Decimal._config.precision = val}
	static get rounding() { return Decimal._config.rounding };
	static set rounding(val: number) { Decimal._config.rounding = val}


	public static get LN10() { return new Decimal(LN10_STR) };
	public static get PI() { return new Decimal(PI_STR) };


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
		let e, i, t,
			x = this;

		// Duplicate.
		if (v instanceof Decimal)
		{
			let vv : number[];

			x.s = v.s;
			x.e = v.e;
			x.d = (vv = v.d) ? vv.slice() : vv;

			return;
		}
		else if (typeof v === 'number')
		{
			let vv : number;

			if (v === 0)
			{
				x.s = (1 / v < 0) ? -1 : 1;
				x.e = 0;
				x.d = [0];

				return;
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
				return;
			}
			else if (vv * 0 !== 0) // Infinity, NaN.
			{
				if (!vv) x.s = NaN;
				x.e = NaN;
				x.d = null;
				return;
			}

			return parseDecimal(x, vv.toString());

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

			return Decimal.isDecimal.test(vv) ? parseDecimal(x, vv) : parseOther(x, vv);
		}
		else
		{
			throw Error("[DecimalError] Invalid Argument " + v);
		}
	}

	dp = () : number => getDecimalPlaces(this);
	precision = (z ?: boolean | number) : number => precision(this, z)

	// Arithmetic methods
	add = (y : number | string | Decimal) : Decimal => add(this, y);
	sub = (y : number | string | Decimal) : Decimal => sub(this, y);
	mul = (y : number | string | Decimal) : Decimal => mul(this, y);
	div = (y : number | string | Decimal) : Decimal => div(this, y);
	divToInt = (y : string | number | Decimal) : Decimal => divToInt(this, y);
	mod = (yy : number | string | Decimal) : Decimal => mod(this, yy);
	neg = () : Decimal => neg(this);
	sign = () : number => getSign(this);
	abs = () : Decimal => abs(this);

	// Power methods
	pow = (yy : number | string | Decimal) : Decimal => pow(this, yy);
	sqrt = () : Decimal => sqrt(this);
	cbrt = () : Decimal => cbrt(this);

	// Comparison methods
	min = (...values) : Decimal => min(this, ...values)
	max = (...values) : Decimal => max(this, ...values)

	// Relational Comparison
	cmp = (w : string | number | Decimal) : number => cmp(this, w);
	eq =  (y : string | number | Decimal) : boolean => eq(this, y);
	gt = (y : string | number | Decimal) : boolean => gt(this, y);
	gte = (y : string | number | Decimal) : boolean => gte(this, y);
	lt = (y : string | number | Decimal) : boolean => lt(this, y);
	lte = (y : string | number | Decimal) : boolean => lte(this, y);

	// Identiy Comparison
	isFinite = () : this is Decimal & { d: string[] } => isFinite(this);
	isInt = () : boolean => isInt(this);
	isNaN = () : boolean => isNaN(this);
	isNeg = () : boolean => isNeg(this);
	isPos = () : boolean => isPos(this);
	isZero = () : boolean => isZero(this);
	isOdd = () : boolean => isOdd(this);
	isEven = () : boolean => isEven(this);

	// Rounding
	ceil = () : Decimal => ceil(this);
	floor = () : Decimal => floor(this);
	round = () : Decimal => round(this);
	trunc = () : Decimal => finalise(new Decimal(this), this.e + 1, 1);
	toNearest = (yy : number | string | Decimal, rm ?: number) : Decimal => toNearest(this, yy, rm)

	// Exponential methods
	log = (baseN : number | string | Decimal) : Decimal => log(this, baseN)
	ln = () : Decimal => naturalLogarithm(this);
	exp = () : Decimal => naturalExponential(this);

	// Trigonometric functions
	sin = () : Decimal => sin(this);
	asin = () : Decimal => asin(this);
	sinh = () : Decimal => sinh(this);
	asinh = () : Decimal => asinh(this);
	cos = () : Decimal => cos(this);
	acos = () : Decimal => acos(this);
	cosh = () : Decimal => cosh(this);
	acosh = () : Decimal => acosh(this);
	tan = () : Decimal => tan(this);
	atan = () : Decimal => atan(this);
	static atan2 = (y: number | string | Decimal, x: number | string | Decimal) : Decimal => atan2(y, x);
	tanh = () : Decimal => tanh(this);
	atanh = () : Decimal => atanh(this);

	// to/output methods
	toString = () : string => toString(this);
	toValue = () : string => toValue(this);
	toFixed = (dp ?: number, rm ?: number) : string => toFixed(this, dp, rm);
	toNumber = () : number => toNumber(this);
	toDP = (dp ?: number, rm ?: number) : Decimal => toDP(this, dp, rm);
	toSD = (sd ?: number, rm ?: number) : Decimal => toSignificantDigits(this, sd, rm);
	toExponential = (dp ?: number, rm ?: number) : string => toExponential(this, dp, rm);
	toPrecision = (sd ?: number, rm ?: number) => toPrecision(this, sd, rm)
	toFraction = (denominator : number | string | Decimal) => toFraction(this, denominator);


	private static setConfig(config: any)
	{
		if (!config || typeof config !== 'object')
		{
			throw Error('[DecimalError] Object expected');
		}

		let i, p, v,
			ps = [
				'precision', 1, Decimal.params.MAX_DIGITS,
				'rounding', 0, 8,
				'toExpNeg', -Decimal.params.EXP_LIMIT, 0,
				'toExpPos', 0, Decimal.params.EXP_LIMIT,
				'maxE', 0, Decimal.params.EXP_LIMIT,
				'minE', -Decimal.params.EXP_LIMIT, 0,
				'modulo', 0, 9
			];

		for (i = 0; i < ps.length; i += 3)
		{
			if ((v = config[p = ps[i]]) !== void 0)
			{
				if (Math.floor(v) === v && v >= ps[i + 1] && v <= ps[i + 2])
				{
					this._config[p] = v;
				}
				else
				{
					throw Error("[DecimalError] Invalid configuration parameter: " + p + ': ' + v);
				}
			}
		}
	}
}