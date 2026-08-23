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
    static _config = { ...DefaultDecimalConfig };
    static _activeConstructor = null;
    static get config() { return { ...this._config }; }
    ;
    static set config(params) { this.setConfig(params); }
    // Low overhead Getter and setters for config params changed during intermediate calculations
    static get precision() { return this._config.precision; }
    ;
    static set precision(val) { this.setConfig({ precision: val }); }
    static get rounding() { return this._config.rounding; }
    ;
    static set rounding(val) { this.setConfig({ rounding: val }); }
    static get LN10() { return new this(LN10_STR); }
    ;
    static get PI() { return new this(PI_STR); }
    ;
    static clone(config = {}) {
        const Parent = this;
        class DecimalClone extends Parent {
        }
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
    static get isDecimal() { return /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i; }
    // THe actual representation of the decimal
    d; // The digits (Array of integers, each 0 - 1e7, or null)
    e; // The exponent (Integer, -9e15 to 9e15 inclusive, or NaN)
    s; // The sign (-1, 1 or NaN)
    constructor(v) {
        const Constructor = new.target;
        // Intermediate values are constructed with `new Decimal` throughout the implementation.
        // Redirect them to the constructor whose calculation context is currently active.
        if (Constructor === Decimal && Decimal._activeConstructor && Decimal._activeConstructor !== Decimal) {
            return Reflect.construct(Decimal, [v], Decimal._activeConstructor);
        }
        return Decimal.runWithContext(Constructor, () => this.initialise(v));
    }
    initialise(v) {
        let e, i, t, x = this;
        // Duplicate.
        if (v instanceof Decimal) {
            let vv;
            x.s = v.s;
            x.e = v.e;
            x.d = (vv = v.d) ? vv.slice() : vv;
            return x;
        }
        else if (typeof v === 'number') {
            let vv;
            if (v === 0) {
                x.s = (1 / v < 0) ? -1 : 1;
                x.e = 0;
                x.d = [0];
                return x;
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
                return x;
            }
            else if (vv * 0 !== 0) // Infinity, NaN.
             {
                if (!vv)
                    x.s = NaN;
                x.e = NaN;
                x.d = null;
                return x;
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
            return (Decimal.isDecimal.test(vv) ? parseDecimal(x, vv) : parseOther(x, vv));
        }
        else {
            throw Error("[DecimalError] Invalid Argument " + v);
        }
    }
    dp = () => this.execute(() => getDecimalPlaces(this));
    precision = (z) => this.execute(() => precision(this, z));
    // Arithmetic methods
    add = (y) => this.execute(() => add(this, y));
    sub = (y) => this.execute(() => sub(this, y));
    mul = (y) => this.execute(() => mul(this, y));
    div = (y) => this.execute(() => div(this, y));
    divToInt = (y) => this.execute(() => divToInt(this, y));
    mod = (yy) => this.execute(() => mod(this, yy));
    neg = () => this.execute(() => neg(this));
    sign = () => this.execute(() => getSign(this));
    abs = () => this.execute(() => abs(this));
    // Power methods
    pow = (yy) => this.execute(() => pow(this, yy));
    sqrt = () => this.execute(() => sqrt(this));
    cbrt = () => this.execute(() => cbrt(this));
    // Comparison methods
    min = (...values) => this.execute(() => min(this, ...values));
    max = (...values) => this.execute(() => max(this, ...values));
    // Relational Comparison
    cmp = (w) => this.execute(() => cmp(this, w));
    eq = (y) => this.execute(() => eq(this, y));
    gt = (y) => this.execute(() => gt(this, y));
    gte = (y) => this.execute(() => gte(this, y));
    lt = (y) => this.execute(() => lt(this, y));
    lte = (y) => this.execute(() => lte(this, y));
    // Identiy Comparison
    isFinite = () => this.execute(() => isFinite(this));
    isInt = () => this.execute(() => isInt(this));
    isNaN = () => this.execute(() => isNaN(this));
    isNeg = () => this.execute(() => isNeg(this));
    isPos = () => this.execute(() => isPos(this));
    isZero = () => this.execute(() => isZero(this));
    isOdd = () => this.execute(() => isOdd(this));
    isEven = () => this.execute(() => isEven(this));
    // Rounding
    ceil = () => this.execute(() => ceil(this));
    floor = () => this.execute(() => floor(this));
    round = () => this.execute(() => round(this));
    trunc = () => this.execute(() => finalise(new Decimal(this), this.e + 1, 1));
    toNearest = (yy, rm) => this.execute(() => toNearest(this, yy, rm));
    // Exponential methods
    log = (baseN) => this.execute(() => log(this, baseN));
    ln = () => this.execute(() => naturalLogarithm(this));
    exp = () => this.execute(() => naturalExponential(this));
    // Trigonometric functions
    sin = () => this.execute(() => sin(this));
    asin = () => this.execute(() => asin(this));
    sinh = () => this.execute(() => sinh(this));
    asinh = () => this.execute(() => asinh(this));
    cos = () => this.execute(() => cos(this));
    acos = () => this.execute(() => acos(this));
    cosh = () => this.execute(() => cosh(this));
    acosh = () => this.execute(() => acosh(this));
    tan = () => this.execute(() => tan(this));
    atan = () => this.execute(() => atan(this));
    static atan2(y, x) {
        return Decimal.runWithContext(this, () => atan2(y, x));
    }
    tanh = () => this.execute(() => tanh(this));
    atanh = () => this.execute(() => atanh(this));
    // to/output methods
    toString = () => this.execute(() => toString(this));
    toValue = () => this.execute(() => toValue(this));
    toFixed = (dp, rm) => this.execute(() => toFixed(this, dp, rm));
    toNumber = () => this.execute(() => toNumber(this));
    toDP = (dp, rm) => this.execute(() => toDP(this, dp, rm));
    toSD = (sd, rm) => this.execute(() => toSignificantDigits(this, sd, rm));
    toExponential = (dp, rm) => this.execute(() => toExponential(this, dp, rm));
    toPrecision = (sd, rm) => this.execute(() => toPrecision(this, sd, rm));
    toFraction = (denominator) => this.execute(() => toFraction(this, denominator));
    execute(operation) {
        return Decimal.runWithContext(this.constructor, operation);
    }
    static runWithContext(Constructor, operation) {
        if (Decimal._activeConstructor === Constructor) {
            return operation();
        }
        const previousConstructor = Decimal._activeConstructor, previousConfig = Decimal._config, previousExternal = Decimal.external, previousQuadrant = Decimal.quadrant, targetConfig = Constructor._config, targetConfigSnapshot = { ...targetConfig };
        Decimal._activeConstructor = Constructor;
        Decimal._config = targetConfig;
        Decimal.external = true;
        Decimal.quadrant = undefined;
        try {
            return operation();
        }
        finally {
            Object.assign(targetConfig, targetConfigSnapshot);
            Decimal._config = previousConfig;
            Decimal.external = previousExternal;
            Decimal.quadrant = previousQuadrant;
            Decimal._activeConstructor = previousConstructor;
        }
    }
    static setConfig(config) {
        if (!config || typeof config !== 'object') {
            throw Error('[DecimalError] Object expected');
        }
        const ranges = {
            precision: [1, Decimal.params.MAX_DIGITS],
            rounding: [0, 8],
            toExpNeg: [-Decimal.params.EXP_LIMIT, 0],
            toExpPos: [0, Decimal.params.EXP_LIMIT],
            maxE: [0, Decimal.params.EXP_LIMIT],
            minE: [-Decimal.params.EXP_LIMIT, 0],
            modulo: [0, 9]
        };
        const updates = {};
        for (const p of Object.keys(ranges)) {
            const v = config[p];
            if (v !== void 0) {
                const [min, max] = ranges[p];
                if (Math.floor(v) === v && v >= min && v <= max) {
                    updates[p] = v;
                }
                else {
                    throw Error("[DecimalError] Invalid configuration parameter: " + p + ': ' + v);
                }
            }
        }
        Object.assign(this._config, updates);
    }
}
