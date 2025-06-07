import { Decimal } from '../../Decimal.js';
import { finalise } from '../utils/finalise.js';
import { divide } from '../arithmetic/div.js';
import { digitsToString } from "../utils/digits-to-string.js";
//
// Return a new Decimal whose value is the cube root of the value of `x`, rounded to
// `precision` significant digits using rounding mode `rounding`.
//
//  cbrt(0)  =  0
//  cbrt(-0) = -0
//  cbrt(1)  =  1
//  cbrt(-1) = -1
//  cbrt(N)  =  N
//  cbrt(-I) = -I
//  cbrt(I)  =  I
//
// Math.cbrt(x) = (x < 0 ? -Math.pow(-x, 1/3) : Math.pow(x, 1/3))
//
export function cbrt(x) {
    var e, m, n, r, rep, s, sd, t, t3, t3plusx;
    if (!x.isFinite() || x.isZero()) {
        return new Decimal(x);
    }
    Decimal.external = false;
    // Initial estimate.
    s = x.s * Math.pow(x.s * Number(x.toValue()), 1 / 3);
    // Math.cbrt underflow/overflow?
    // Pass x to Math.pow as integer, then adjust the exponent of the result.
    if (!s || Math.abs(s) == 1 / 0) {
        n = digitsToString(x.d);
        e = x.e;
        // Adjust n exponent so it is a multiple of 3 away from x exponent.
        if (s = (e - n.length + 1) % 3)
            n += (s == 1 || s == -2 ? '0' : '00');
        s = Math.pow(n, 1 / 3);
        // Rarely, e may be one less than the result exponent value.
        e = Math.floor((e + 1) / 3) - ((e % 3) == (e < 0 ? -1 : 2));
        if (s == 1 / 0) {
            n = '5e' + e;
        }
        else {
            n = s.toExponential();
            n = n.slice(0, n.indexOf('e') + 1) + e;
        }
        r = new Decimal(n);
        r.s = x.s;
    }
    else {
        r = new Decimal(s.toString());
    }
    sd = (e = Decimal.precision) + 3;
    // Halley's method.
    // TODO? Compare Newton's method.
    for (;;) {
        t = r;
        t3 = t.mul(t).mul(t);
        t3plusx = t3.add(x);
        r = divide(t3plusx.add(x).mul(t), t3plusx.add(t3), sd + 2, 1);
        // TODO? Replace with for-loop and checkRoundingDigits.
        if (digitsToString(t.d).slice(0, sd) === (n = digitsToString(r.d)).slice(0, sd)) {
            n = n.slice(sd - 3, sd + 1);
            // The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or 4999
            // , i.e. approaching a rounding boundary, continue the iteration.
            if (n == '9999' || !rep && n == '4999') {
                // On the first iteration only, check to see if rounding up gives the exact result as the
                // nines may infinitely repeat.
                if (!rep) {
                    t = finalise(t, e + 1, 0);
                    if (t.mul(t).mul(t).eq(x)) {
                        r = t;
                        break;
                    }
                }
                sd += 4;
                rep = 1;
            }
            else {
                // If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
                // If not, then there are further digits and m will be truthy.
                if (!+n || !+n.slice(1) && n.charAt(0) == '5') {
                    // Truncate to the first rounding digit.
                    r = finalise(r, e + 1, 1);
                    m = !r.mul(r).mul(r).eq(x);
                }
                break;
            }
        }
    }
    Decimal.external = true;
    return finalise(r, e, Decimal.rounding, m);
}
