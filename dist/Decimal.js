// Based on decimal.js https://github.com/MikeMcl/decimal.js
import { LN10_STR, PI_STR } from './constants.js';
import { DecimalParams } from './DecimalParameters.js';
// Methods
import { finalise } from './methods/utils/finalise.js';
import { precision } from './methods/utils/precision.js';
import { getDecimalPlaces } from './methods/utils/get-decimal-places.js';
import { getSign } from './methods/utils/get-sign.js';
import { add, sub, mul, div, divToInt, mod, neg, abs } from './methods/arithmetic/index.js';
import { pow, sqrt, cbrt } from './methods/power/index.js';
import { ceil, floor, round, toNearest } from './methods/rounding/index.js';
import { min, max } from './methods/compare/min-max.js';
import { eq, cmp, gt, gte, lt, lte } from './methods/compare/relational-compare.js';
import { isFinite, isInt, isNaN, isNeg, isPos, isZero, isOdd, isEven } from './methods/compare/identity-compare.js';
import { log, naturalLogarithm, naturalExponential } from './methods/exponential/index.js';
import { toDP, toFixed, toString, toValue, toNumber, toExponential, toPrecision, toFraction, toSignificantDigits } from './methods/to/index.js';
import { parseDecimal, parseOther } from './methods/utils/parse.js';
import { cos, acos, cosh, acosh, sin, asin, sinh, asinh, tan, atan, tanh, atanh, atan2 } from './methods/trigonometry/index.js';
import { DefaultDecimalConfig } from './config/DefaultConfig.js';
export class Decimal {
    // Decimal parameters and config
    static params = DecimalParams;
    static _config = DefaultDecimalConfig;
    static get config() { return Decimal._config; }
    ;
    static set config(params) { Decimal.setConfig(params); }
    // Low overhead Getter and setters for config params changed during intermediate calculations
    static get precision() { return Decimal._config.precision; }
    ;
    static set precision(val) { Decimal._config.precision = val; }
    static get rounding() { return Decimal._config.rounding; }
    ;
    static set rounding(val) { Decimal._config.rounding = val; }
    static get LN10() { return new Decimal(LN10_STR); }
    ;
    static get PI() { return new Decimal(PI_STR); }
    ;
    //private inexact;  // THink this is only used for binary conversion
    static external = true;
    static quadrant;
    static get isDecimal() { return /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i; }
    // THe actual representation of the decimal
    d; // The digits (Array of integers, each 0 - 1e7, or null)
    e; // The exponent (Integer, -9e15 to 9e15 inclusive, or NaN)
    s; // The sign (-1, 1 or NaN)
    constructor(v) {
        let e, i, t, x = this;
        // Duplicate.
        if (v instanceof Decimal) {
            let vv;
            x.s = v.s;
            x.e = v.e;
            x.d = (vv = v.d) ? vv.slice() : vv;
            return;
        }
        else if (typeof v === 'number') {
            let vv;
            if (v === 0) {
                x.s = (1 / v < 0) ? -1 : 1;
                x.e = 0;
                x.d = [0];
                return;
            }
            if (v < 0) {
                vv = -v;
                x.s = -1;
            }
            else {
                vv = v;
                x.s = 1;
            }
            // Fast path for small integers.
            if (vv === ~~vv && vv < 1e7) {
                for (e = 0, i = vv; i >= 10; i /= 10)
                    e++;
                x.e = e;
                x.d = [vv];
                return;
            }
            else if (vv * 0 !== 0) // Infinity, NaN.
             {
                if (!vv)
                    x.s = NaN;
                x.e = NaN;
                x.d = null;
                return;
            }
            return parseDecimal(x, vv.toString());
        }
        else if (typeof v === 'string') {
            let vv;
            // Minus sign?
            if (v.charCodeAt(0) === 45) {
                vv = v.slice(1);
                x.s = -1;
            }
            else {
                vv = v;
                x.s = 1;
            }
            return Decimal.isDecimal.test(vv) ? parseDecimal(x, vv) : parseOther(x, vv);
        }
        else {
            throw Error("[DecimalError] Invalid Argument " + v);
        }
    }
    dp = () => getDecimalPlaces(this);
    precision = (z) => precision(this, z);
    // Arithmetic methods
    add = (y) => add(this, y);
    sub = (y) => sub(this, y);
    mul = (y) => mul(this, y);
    div = (y) => div(this, y);
    divToInt = (y) => divToInt(this, y);
    mod = (yy) => mod(this, yy);
    neg = () => neg(this);
    sign = () => getSign(this);
    abs = () => abs(this);
    // Power methods
    pow = (yy) => pow(this, yy);
    sqrt = () => sqrt(this);
    cbrt = () => cbrt(this);
    // Comparison methods
    min = (...values) => min(this, ...values);
    max = (...values) => max(this, ...values);
    // Relational Comparison
    cmp = (w) => cmp(this, w);
    eq = (y) => eq(this, y);
    gt = (y) => gt(this, y);
    gte = (y) => gte(this, y);
    lt = (y) => lt(this, y);
    lte = (y) => lte(this, y);
    // Identiy Comparison
    isFinite = () => isFinite(this);
    isInt = () => isInt(this);
    isNaN = () => isNaN(this);
    isNeg = () => isNeg(this);
    isPos = () => isPos(this);
    isZero = () => isZero(this);
    isOdd = () => isOdd(this);
    isEven = () => isEven(this);
    // Rounding
    ceil = () => ceil(this);
    floor = () => floor(this);
    round = () => round(this);
    trunc = () => finalise(new Decimal(this), this.e + 1, 1);
    toNearest = (yy, rm) => toNearest(this, yy, rm);
    // Exponential methods
    log = (baseN) => log(this, baseN);
    ln = () => naturalLogarithm(this);
    exp = () => naturalExponential(this);
    // Trigonometric functions
    sin = () => sin(this);
    asin = () => asin(this);
    sinh = () => sinh(this);
    asinh = () => asinh(this);
    cos = () => cos(this);
    acos = () => acos(this);
    cosh = () => cosh(this);
    acosh = () => acosh(this);
    tan = () => tan(this);
    atan = () => atan(this);
    static atan2 = (y, x) => atan2(y, x);
    tanh = () => tanh(this);
    atanh = () => atanh(this);
    // to/output methods
    toString = () => toString(this);
    toValue = () => toValue(this);
    toFixed = (dp, rm) => toFixed(this, dp, rm);
    toNumber = () => toNumber(this);
    toDP = (dp, rm) => toDP(this, dp, rm);
    toSD = (sd, rm) => toSignificantDigits(this, sd, rm);
    toExponential = (dp, rm) => toExponential(this, dp, rm);
    toPrecision = (sd, rm) => toPrecision(this, sd, rm);
    toFraction = (denominator) => toFraction(this, denominator);
    static setConfig(config) {
        if (!config || typeof config !== 'object') {
            throw Error('[DecimalError] Object expected');
        }
        let i, p, v, ps = [
            'precision', 1, Decimal.params.MAX_DIGITS,
            'rounding', 0, 8,
            'toExpNeg', -Decimal.params.EXP_LIMIT, 0,
            'toExpPos', 0, Decimal.params.EXP_LIMIT,
            'maxE', 0, Decimal.params.EXP_LIMIT,
            'minE', -Decimal.params.EXP_LIMIT, 0,
            'modulo', 0, 9
        ];
        for (i = 0; i < ps.length; i += 3) {
            if ((v = config[p = ps[i]]) !== void 0) {
                if (Math.floor(v) === v && v >= ps[i + 1] && v <= ps[i + 2]) {
                    this._config[p] = v;
                }
                else {
                    throw Error("[DecimalError] Invalid configuration parameter: " + p + ': ' + v);
                }
            }
        }
    }
}
