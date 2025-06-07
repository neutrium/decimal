import { Decimal } from "../../Decimal.js";
import { finalise } from "../utils/finalise.js";
import { taylorSeries } from "./taylor-series.js";
import { toLessThanHalfPi } from "./to-lte-pi.js";
import { getPi } from "./get-pi.js";
//
// Return a new Decimal whose value is the cosine of the value in radians of `x`
//
// Domain: [-Infinity, Infinity]
// Range: [-1, 1]
//
// cos(0)         = 1
// cos(-0)        = 1
// cos(Infinity)  = NaN
// cos(-Infinity) = NaN
// cos(NaN)       = NaN
//
export function cos(x) {
    let pr, rm;
    if (!x.d) {
        return new Decimal(NaN);
    }
    // cos(0) = cos(-0) = 1
    if (!x.d[0]) {
        return new Decimal(1);
    }
    pr = Decimal.precision;
    rm = Decimal.rounding;
    Decimal.precision = pr + Math.max(x.e, x.precision()) + Decimal.params.LOG_BASE;
    Decimal.rounding = 1;
    x = cosine(toLessThanHalfPi(x));
    Decimal.precision = pr;
    Decimal.rounding = rm;
    return finalise(Decimal.quadrant == 2 || Decimal.quadrant == 3 ? x.neg() : x, pr, rm, true);
}
//
// Return a new Decimal whose value is the hyperbolic cosine of the value in radians of `x`.
//
// Domain: [-Infinity, Infinity]
// Range: [1, Infinity]
//
// cosh(x) = 1 + x^2/2! + x^4/4! + x^6/6! + ...
//
// cosh(0)         = 1
// cosh(-0)        = 1
// cosh(Infinity)  = Infinity
// cosh(-Infinity) = Infinity
// cosh(NaN)       = NaN
//
//  x        time taken (ms)   result
// 1000      9                 9.8503555700852349694e+433
// 10000     25                4.4034091128314607936e+4342
// 100000    171               1.4033316802130615897e+43429
// 1000000   3817              1.5166076984010437725e+434294
// 10000000  abandoned after 2 minute wait
//
// TODO? Compare performance of cosh(x) = 0.5 * (exp(x) + exp(-x))
//
export function cosh(x) {
    let k, n, pr, rm, len, one = new Decimal(1);
    if (!x.isFinite()) {
        return new Decimal(x.s ? 1 / 0 : NaN);
    }
    if (x.isZero()) {
        return one;
    }
    pr = Decimal.precision;
    rm = Decimal.rounding;
    Decimal.precision = pr + Math.max(x.e, x.precision()) + 4;
    Decimal.rounding = 1;
    len = x.d.length;
    // Argument reduction: cos(4x) = 1 - 8cos^2(x) + 8cos^4(x) + 1
    // i.e. cos(x) = 1 - cos^2(x/4)(8 - 8cos^2(x/4))
    // Estimate the optimum number of times to use the argument reduction.
    // TODO? Estimation reused from cosine() and may not be optimal here.
    if (len < 32) {
        k = Math.ceil(len / 3);
        n = Math.pow(4, -k).toString();
    }
    else {
        k = 16;
        n = '2.3283064365386962890625e-10';
    }
    x = taylorSeries(1, x.mul(n), new Decimal(1), true);
    // Reverse argument reduction
    let cosh2_x, i = k, d8 = new Decimal(8);
    for (; i--;) {
        cosh2_x = x.mul(x);
        x = one.sub(cosh2_x.mul(d8.sub(cosh2_x.mul(d8))));
    }
    return finalise(x, Decimal.precision = pr, Decimal.rounding = rm, true);
}
//
// Return a new Decimal whose value is the inverse of the hyperbolic cosine in radians of the value of `x`.
//
// Domain: [1, Infinity]
// Range: [0, Infinity]
//
// acosh(x) = ln(x + sqrt(x^2 - 1))
//
// acosh(x < 1)     = NaN
// acosh(NaN)       = NaN
// acosh(Infinity)  = Infinity
// acosh(-Infinity) = NaN
// acosh(0)         = NaN
// acosh(-0)        = NaN
// acosh(1)         = 0
// acosh(-1)        = NaN
//
export function acosh(x) {
    let pr, rm;
    if (x.lte(1)) {
        return new Decimal(x.eq(1) ? 0 : NaN);
    }
    if (!x.isFinite()) {
        return new Decimal(x);
    }
    pr = Decimal.precision;
    rm = Decimal.rounding;
    Decimal.precision = pr + Math.max(Math.abs(x.e), x.precision()) + 4;
    Decimal.rounding = 1;
    Decimal.external = false;
    x = x.mul(x).sub(1).sqrt().add(x);
    Decimal.external = true;
    Decimal.precision = pr;
    Decimal.rounding = rm;
    return x.ln();
}
//
// Return a new Decimal whose value is the arccosine (inverse cosine) in radians of the value of `x`
//
// Domain: [-1, 1]
// Range: [0, pi]
//
// acos(x) = pi/2 - asin(x)
// acos(0)       = pi/2
// acos(-0)      = pi/2
// acos(1)       = 0
// acos(-1)      = pi
// acos(1/2)     = pi/3
// acos(-1/2)    = 2*pi/3
// acos(|x| > 1) = NaN
// acos(NaN)     = NaN
//
export function acos(x) {
    let halfPi, k = x.abs().cmp(1), pr = Decimal.precision, rm = Decimal.rounding;
    if (k !== -1) {
        return k === 0
            // |x| is 1
            ? x.isNeg() ? getPi(pr, rm) : new Decimal(0)
            // |x| > 1 or x is NaN
            : new Decimal(NaN);
    }
    if (x.isZero()) {
        return getPi(pr + 4, rm).mul(0.5);
    }
    // TODO? Special case acos(0.5) = pi/3 and acos(-0.5) = 2*pi/3
    Decimal.precision = pr + 6;
    Decimal.rounding = 1;
    x = x.asin();
    halfPi = getPi(pr + 4, rm).mul(0.5);
    Decimal.precision = pr;
    Decimal.rounding = rm;
    return halfPi.sub(x);
}
//
// cos(x) = 1 - x^2/2! + x^4/4! - ...
// |x| < pi/2
//
function cosine(x) {
    let k, y, len = x.d.length;
    // Argument reduction: cos(4x) = 8*(cos^4(x) - cos^2(x)) + 1
    // i.e. cos(x) = 8*(cos^4(x/4) - cos^2(x/4)) + 1
    // Estimate the optimum number of times to use the argument reduction.
    if (len < 32) {
        k = Math.ceil(len / 3);
        y = Math.pow(4, -k).toString();
    }
    else {
        k = 16;
        y = '2.3283064365386962890625e-10';
    }
    Decimal.precision += k;
    x = taylorSeries(1, x.mul(y), new Decimal(1));
    // Reverse argument reduction
    for (var i = k; i--;) {
        var cos2x = x.mul(x);
        x = cos2x.mul(cos2x).sub(cos2x).mul(8).add(1);
    }
    Decimal.precision -= k;
    return x;
}
