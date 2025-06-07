import { Decimal } from '../../Decimal.js';
import { DecimalParams } from '../../DecimalParameters.js';
import { finalise } from '../utils/finalise.js';
import { getBase10Exponent } from "../exponential/get-base-10-exponent.js";
//
// Return a new Decimal whose value is the value of `x` minus `y`, rounded to `precision`
// significant digits using rounding mode `rounding`.
//  n - 0 = n
//  n - N = N
//  n - I = -I
//  0 - n = -n
//  0 - 0 = 0
//  0 - N = N
//  0 - I = -I
//  N - n = N
//  N - 0 = N
//  N - N = N
//  N - I = N
//  I - n = I
//  I - 0 = I
//  I - N = N
//  I - I = N
//
export function sub(x, yy) {
    let d, e, i, j, k, len, pr, rm, xd, xe, xLTy, yd, y = new Decimal(yy), LOG_BASE = DecimalParams.LOG_BASE, BASE = DecimalParams.BASE;
    // If either is not finite...
    if (!x.d || !y.d) {
        // Return NaN if either is NaN.
        if (!x.s || !y.s)
            y = new Decimal(NaN);
        // Return y negated if x is finite and y is ±Infinity.
        else if (x.d)
            y.s = -y.s;
        // Return x if y is finite and x is ±Infinity.
        // Return x if both are ±Infinity with different signs.
        // Return NaN if both are ±Infinity with the same sign.
        else
            y = new Decimal(y.d || x.s !== y.s ? x : NaN);
        return y;
    }
    // If signs differ...
    if (x.s != y.s) {
        y.s = -y.s;
        return x.add(y);
    }
    xd = x.d;
    yd = y.d;
    pr = Decimal.precision;
    rm = Decimal.rounding;
    // If either is zero...
    if (!xd[0] || !yd[0]) {
        if (yd[0]) {
            // Return y negated if x is zero and y is non-zero.
            y.s = -y.s;
        }
        else if (xd[0]) {
            // Return x if y is zero and x is non-zero.
            y = new Decimal(x);
        }
        else {
            // Return zero if both are zero.
            // From IEEE 754 (2008) 6.3: 0 - 0 = -0 - -0 = -0 when rounding to -Infinity.
            return new Decimal(rm === 3 ? -0 : 0);
        }
        return Decimal.external ? finalise(y, pr, rm) : y;
    }
    // x and y are finite, non-zero numbers with the same sign.
    // Calculate base 1e7 exponents.
    e = Math.floor(y.e / LOG_BASE);
    xe = Math.floor(x.e / LOG_BASE);
    xd = xd.slice();
    k = xe - e;
    // If base 1e7 exponents differ...
    if (k) {
        xLTy = k < 0;
        if (xLTy) {
            d = xd;
            k = -k;
            len = yd.length;
        }
        else {
            d = yd;
            e = xe;
            len = xd.length;
        }
        // Numbers with massively different exponents would result in a very high number of
        // zeros needing to be prepended, but this can be avoided while still ensuring correct
        // rounding by limiting the number of zeros to `Math.ceil(pr / LOG_BASE) + 2`.
        i = Math.max(Math.ceil(pr / LOG_BASE), len) + 2;
        if (k > i) {
            k = i;
            d.length = 1;
        }
        // Prepend zeros to equalise exponents.
        d.reverse();
        for (i = k; i--;)
            d.push(0);
        d.reverse();
        // Base 1e7 exponents equal.
    }
    else {
        // Check digits to determine which is the bigger number.
        i = xd.length;
        len = yd.length;
        xLTy = i < len;
        if (xLTy)
            len = i;
        for (i = 0; i < len; i++) {
            if (xd[i] != yd[i]) {
                xLTy = xd[i] < yd[i];
                break;
            }
        }
        k = 0;
    }
    if (xLTy) {
        d = xd;
        xd = yd;
        yd = d;
        y.s = -y.s;
    }
    len = xd.length;
    // Append zeros to `xd` if shorter.
    // Don't add zeros to `yd` if shorter as subtraction only needs to start at `yd` length.
    for (i = yd.length - len; i > 0; --i)
        xd[len++] = 0;
    // Subtract yd from xd.
    for (i = yd.length; i > k;) {
        if (xd[--i] < yd[i]) {
            for (j = i; j && xd[--j] === 0;)
                xd[j] = BASE - 1;
            --xd[j];
            xd[i] += BASE;
        }
        xd[i] -= yd[i];
    }
    // Remove trailing zeros.
    for (; xd[--len] === 0;)
        xd.pop();
    // Remove leading zeros and adjust exponent accordingly.
    for (; xd[0] === 0; xd.shift())
        --e;
    // Zero?
    if (!xd[0])
        return new Decimal(rm === 3 ? -0 : 0);
    y.d = xd;
    y.e = getBase10Exponent(xd, e);
    return Decimal.external ? finalise(y, pr, rm) : y;
}
