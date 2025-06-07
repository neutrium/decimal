import { Decimal } from "../../Decimal.js";
import { finalise } from "../utils/finalise.js";
import { divide } from "../arithmetic/div.js";
import { sin, sinh } from "./sin.js";
import { cosh } from "./cos.js";
import { getPi } from "./get-pi.js";
//
// Return a new Decimal whose value is the tangent of the value in radians of this Decimal.
//
// Domain: [-Infinity, Infinity]
// Range: [-Infinity, Infinity]
//
// tan(0)         = 0
// tan(-0)        = -0
// tan(Infinity)  = NaN
// tan(-Infinity) = NaN
// tan(NaN)       = NaN
//
export function tan(x) {
    if (!x.isFinite()) {
        return new Decimal(NaN);
    }
    if (x.isZero()) {
        return new Decimal(x);
    }
    const pr = Decimal.precision;
    const rm = Decimal.rounding;
    Decimal.precision = pr + 10;
    Decimal.rounding = 1;
    x = sin(x);
    x.s = 1;
    x = divide(x, new Decimal(1).sub(x.mul(x)).sqrt(), pr + 10, 0);
    Decimal.precision = pr;
    Decimal.rounding = rm;
    return finalise(Decimal.quadrant == 2 || Decimal.quadrant == 4 ? x.neg() : x, pr, rm, true);
}
//
// Return a new Decimal whose value is the arctangent (inverse tangent) in radians of the value of `x`.
//
// Domain: [-Infinity, Infinity]
// Range: [-pi/2, pi/2]
//
// atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
//
// atan(0)         = 0
// atan(-0)        = -0
// atan(1)         = pi/4
// atan(-1)        = -pi/4
// atan(Infinity)  = pi/2
// atan(-Infinity) = -pi/2
// atan(NaN)       = NaN
//
export function atan(x) {
    let i, j, k, n, px, t, r, wpr, x2;
    const pr = Decimal.precision, rm = Decimal.rounding;
    if (!x.isFinite()) {
        if (!x.s) {
            return new Decimal(NaN);
        }
        if (pr + 4 <= Decimal.params.PI_PRECISION) {
            r = getPi(pr + 4, rm).mul(0.5);
            r.s = x.s;
            return r;
        }
    }
    else if (x.isZero()) {
        return new Decimal(x);
    }
    else if (x.abs().eq(1) && pr + 4 <= Decimal.params.PI_PRECISION) {
        r = getPi(pr + 4, rm).mul(0.25);
        r.s = x.s;
        return r;
    }
    Decimal.precision = wpr = pr + 10;
    Decimal.rounding = 1;
    // TODO? if (x >= 1 && pr <= PI_PRECISION) atan(x) = halfPi * x.s - atan(1 / x);
    // Argument reduction
    // Ensure |x| < 0.42
    // atan(x) = 2 * atan(x / (1 + sqrt(1 + x^2)))
    k = Math.min(28, wpr / Decimal.params.LOG_BASE + 2 | 0);
    for (i = k; i; --i) {
        x = x.div(x.mul(x).add(1).sqrt().add(1));
    }
    Decimal.external = false;
    j = Math.ceil(wpr / Decimal.params.LOG_BASE);
    n = 1;
    x2 = x.mul(x);
    r = new Decimal(x);
    px = x;
    // atan(x) = x - x^3/3 + x^5/5 - x^7/7 + ...
    for (; i !== -1;) {
        px = px.mul(x2);
        t = r.sub(px.div(n += 2));
        px = px.mul(x2);
        r = t.add(px.div(n += 2));
        if (r.d[j] !== void 0) {
            for (i = j; r.d[i] === t.d[i] && i--;)
                ;
        }
    }
    if (k) {
        r = r.mul(2 << (k - 1));
    }
    Decimal.external = true;
    return finalise(r, Decimal.precision = pr, Decimal.rounding = rm, true);
}
//
// Return a new Decimal whose value is the arctangent in radians of `y/x` in the range -pi to pi
// (inclusive), rounded to `precision` significant digits using rounding mode `rounding`.
//
// Domain: [-Infinity, Infinity]
// Range: [-pi, pi]
//
// y {number|string|Decimal} The y-coordinate.
// x {number|string|Decimal} The x-coordinate.
//
// atan2(±0, -0)               = ±pi
// atan2(±0, +0)               = ±0
// atan2(±0, -x)               = ±pi for x > 0
// atan2(±0, x)                = ±0 for x > 0
// atan2(-y, ±0)               = -pi/2 for y > 0
// atan2(y, ±0)                = pi/2 for y > 0
// atan2(±y, -Infinity)        = ±pi for finite y > 0
// atan2(±y, +Infinity)        = ±0 for finite y > 0
// atan2(±Infinity, x)         = ±pi/2 for finite x
// atan2(±Infinity, -Infinity) = ±3*pi/4
// atan2(±Infinity, +Infinity) = ±pi/4
// atan2(NaN, x) = NaN
// atan2(y, NaN) = NaN
//
export function atan2(yy, xx) {
    let x = new Decimal(xx), y = new Decimal(yy), pr = Decimal.precision, rm = Decimal.rounding, wpr = pr + 4, r;
    // Either NaN
    if (!y.s || !x.s) {
        r = new Decimal(NaN);
    }
    else if (!y.d && !x.d) // Both ±Infinity
     {
        r = getPi(wpr, 1).mul(x.s > 0 ? 0.25 : 0.75);
        r.s = y.s;
    }
    else if (!x.d || y.isZero()) // x is ±Infinity or y is ±0
     {
        r = x.s < 0 ? getPi(pr, rm) : new Decimal(0);
        r.s = y.s;
    }
    else if (!y.d || x.isZero()) // y is ±Infinity or x is ±0
     {
        r = getPi(wpr, 1).mul(0.5);
        r.s = y.s;
    }
    else if (x.s < 0) // Both non-zero and finite
     {
        Decimal.precision = wpr;
        Decimal.rounding = 1;
        r = atan(divide(y, x, wpr, 1));
        x = getPi(wpr, 1);
        Decimal.precision = pr;
        Decimal.rounding = rm;
        r = y.s < 0 ? r.sub(x) : r.add(x);
    }
    else {
        r = atan(divide(y, x, wpr, 1));
    }
    return r;
}
//
// Return a new Decimal whose value is the hyperbolic tangent of the value in radians of `x`.
//
// Domain: [-Infinity, Infinity]
// Range: [-1, 1]
//
// tanh(x) = sinh(x) / cosh(x)
//
// tanh(0)         = 0
// tanh(-0)        = -0
// tanh(Infinity)  = 1
// tanh(-Infinity) = -1
// tanh(NaN)       = NaN
//
export function tanh(x) {
    if (!x.isFinite()) {
        return new Decimal(x.s);
    }
    if (x.isZero()) {
        return new Decimal(x);
    }
    const pr = Decimal.precision;
    const rm = Decimal.rounding;
    Decimal.precision = pr + 7;
    Decimal.rounding = 1;
    return divide(sinh(x), cosh(x), Decimal.precision = pr, Decimal.rounding = rm);
}
//
// Return a new Decimal whose value is the inverse of the hyperbolic tangent in radians of the value of `x`.
//
// Domain: [-1, 1]
// Range: [-Infinity, Infinity]
//
// atanh(x) = 0.5 * ln((1 + x) / (1 - x))
//
// atanh(|x| > 1)   = NaN
// atanh(NaN)       = NaN
// atanh(Infinity)  = NaN
// atanh(-Infinity) = NaN
// atanh(0)         = 0
// atanh(-0)        = -0
// atanh(1)         = Infinity
// atanh(-1)        = -Infinity
//
export function atanh(x) {
    if (!x.isFinite()) {
        return new Decimal(NaN);
    }
    if (x.e >= 0) {
        return new Decimal(x.abs().eq(1) ? x.s / 0 : x.isZero() ? x : NaN);
    }
    const pr = Decimal.precision, rm = Decimal.rounding, xsd = x.precision();
    if (Math.max(xsd, pr) < 2 * -x.e - 1) {
        return finalise(new Decimal(x), pr, rm, true);
    }
    const wpr = xsd - x.e;
    Decimal.precision = wpr;
    x = divide(x.add(1), new Decimal(1).sub(x), wpr + pr, 1);
    Decimal.precision = pr + 4;
    Decimal.rounding = 1;
    x = x.ln();
    Decimal.precision = pr;
    Decimal.rounding = rm;
    return x.mul(0.5);
}
