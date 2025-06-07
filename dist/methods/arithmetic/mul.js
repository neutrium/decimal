import { Decimal } from "../../Decimal.js";
import { finalise } from "../utils/finalise.js";
import { getBase10Exponent } from "../exponential/get-base-10-exponent.js";
//
// Return a new Decimal whose value is `x` times `y`, rounded to `precision` significant
// digits using rounding mode `rounding`.
//
//  n * 0 = 0
//  n * N = N
//  n * I = I
//  0 * n = 0
//  0 * 0 = 0
//  0 * N = N
//  0 * I = N
//  N * n = N
//  N * 0 = N
//  N * N = N
//  N * I = N
//  I * n = I
//  I * 0 = N
//  I * N = N
//  I * I = I
//
export function mul(x, yy) {
    let y = new Decimal(yy);
    let carry, e, i, k, r, rL, t, xdL, ydL, xd = x.d, yd = y.d, LOG_BASE = Decimal.params.LOG_BASE, BASE = Decimal.params.BASE;
    y.s *= x.s;
    // If either is NaN, ±Infinity or ±0...
    if (!xd || !xd[0] || !yd || !yd[0]) {
        return new Decimal(!y.s || xd && !xd[0] && !yd || yd && !yd[0] && !xd
            // Return NaN if either is NaN.
            // Return NaN if x is ±0 and y is ±Infinity, or y is ±0 and x is ±Infinity.
            ? NaN
            // Return ±Infinity if either is ±Infinity.
            // Return ±0 if either is ±0.
            : !xd || !yd ? y.s / 0 : y.s * 0);
    }
    e = Math.floor(x.e / LOG_BASE) + Math.floor(y.e / LOG_BASE);
    xdL = xd.length;
    ydL = yd.length;
    // Ensure xd points to the longer array.
    if (xdL < ydL) {
        r = xd;
        xd = yd;
        yd = r;
        rL = xdL;
        xdL = ydL;
        ydL = rL;
    }
    // Initialise the result array with zeros.
    r = [];
    rL = xdL + ydL;
    for (i = rL; i--;)
        r.push(0);
    // Multiply!
    for (i = ydL; --i >= 0;) {
        carry = 0;
        for (k = xdL + i; k > i;) {
            t = r[k] + yd[i] * xd[k - i - 1] + carry;
            r[k--] = t % BASE | 0;
            carry = t / BASE | 0;
        }
        r[k] = (r[k] + carry) % BASE | 0;
    }
    // Remove trailing zeros.
    for (; !r[--rL];)
        r.pop();
    if (carry)
        ++e;
    else
        r.shift();
    // Remove trailing zeros.
    for (i = r.length; !r[--i];)
        r.pop();
    y.d = r;
    y.e = getBase10Exponent(r, e);
    //return y;
    return Decimal.external ? finalise(y, Decimal.precision, Decimal.rounding) : y;
}
