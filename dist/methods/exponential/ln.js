import { Decimal } from "../../Decimal.js";
import { divide } from '../arithmetic/div.js';
import { finalise } from "../utils/finalise.js";
import { digitsToString } from "../utils/digits-to-string.js";
import { checkRoundingDigits } from "../rounding/check-rounding-digits.js";
import { getLn10 } from "./get-ln-10.js";
//
// Return a new Decimal whose value is the natural logarithm of `x` rounded to `sd` significant digits.
//
//  ln(-n)        = NaN
//  ln(0)         = -Infinity
//  ln(-0)        = -Infinity
//  ln(1)         = 0
//  ln(Infinity)  = Infinity
//  ln(-Infinity) = NaN
//  ln(NaN)       = NaN
//
//  ln(n) (n != 1) is non-terminating.
//
export function naturalLogarithm(y, sd) {
    let c, c0, denominator, e, numerator, rep, sum, t, wpr, x1, x2, n = 1, guard = 10, x = y, xd = x.d, rm = Decimal.rounding, pr = Decimal.precision;
    // Is x negative or Infinity, NaN, 0 or 1?
    if (x.s < 0 || !xd || !xd[0] || !x.e && xd[0] == 1 && xd.length == 1) {
        return new Decimal(xd && !xd[0] ? -1 / 0 : x.s != 1 ? NaN : xd ? 0 : x);
    }
    if (sd == null) {
        Decimal.external = false;
        wpr = pr;
    }
    else {
        wpr = sd;
    }
    Decimal.precision = wpr += guard;
    c = digitsToString(xd);
    c0 = c.charAt(0);
    if (Math.abs(e = x.e) < 1.5e15) {
        // Argument reduction.
        // The series converges faster the closer the argument is to 1, so using
        // ln(a^b) = b * ln(a),   ln(a) = ln(a^b) / b
        // multiply the argument by itself until the leading digits of the significand are 7, 8, 9,
        // 10, 11, 12 or 13, recording the number of multiplications so the sum of the series can
        // later be divided by this number, then separate out the power of 10 using
        // ln(a*10^b) = ln(a) + b*ln(10).
        // max n is 21 (gives 0.9, 1.0 or 1.1) (9e15 / 21 = 4.2e14).
        //while (c0 < 9 && c0 != 1 || c0 == 1 && c.charAt(1) > 1) {
        // max n is 6 (gives 0.7 - 1.3)
        while (c0 < 7 && c0 != 1 || c0 == 1 && c.charAt(1) > 3) {
            x = x.mul(y);
            c = digitsToString(x.d);
            c0 = c.charAt(0);
            n++;
        }
        e = x.e;
        if (c0 > 1) {
            x = new Decimal('0.' + c);
            e++;
        }
        else {
            x = new Decimal(c0 + '.' + c.slice(1));
        }
    }
    else {
        // The argument reduction method above may result in overflow if the argument y is a massive
        // number with exponent >= 1500000000000000 (9e15 / 6 = 1.5e15), so instead recall this
        // function using ln(x*10^e) = ln(x) + e*ln(10).
        t = getLn10(wpr + 2, pr).mul(e + '');
        x = naturalLogarithm(new Decimal(c0 + '.' + c.slice(1)), wpr - guard).add(t);
        Decimal.precision = pr;
        return sd == null ? finalise(x, pr, rm, Decimal.external = true) : x;
    }
    // x1 is x reduced to a value near 1.
    x1 = x;
    // Taylor series.
    // ln(y) = ln((1 + x)/(1 - x)) = 2(x + x^3/3 + x^5/5 + x^7/7 + ...)
    // where x = (y - 1)/(y + 1)    (|x| < 1)
    sum = numerator = x = divide(x.sub(1), x.add(1), wpr, 1);
    x2 = finalise(x.mul(x), wpr, 1);
    denominator = 3;
    // x2 = 4.0088409680155977413049889825712290288933e-4   // Working
    // x2 = 4.0088409680155977413049889825712290288933e-4   // Not working
    // x2 is fine also remains the same through the iterations
    // denominator seems ok adds 2 each iteration
    // numerator is the same through the iterations
    // sum is the same through the iterations
    // t is the same through the iterations
    // Everything is fine until the for loop if statement
    for (;;) {
        numerator = finalise(numerator.mul(x2), wpr, 1);
        t = sum.add(divide(numerator, new Decimal(denominator), wpr, 1));
        if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr)) {
            sum = sum.mul(2);
            // Reverse the argument reduction. Check that e is not 0 because, besides preventing an
            // unnecessary calculation, -0 + 0 = +0 and to ensure correct rounding -0 needs to stay -0.
            if (e !== 0) {
                sum = sum.add(getLn10(wpr + 2, pr).mul(e + ''));
            }
            // sum changes here
            sum = divide(sum, new Decimal(n), wpr, 1);
            // Is rm > 3 and the first 4 rounding digits 4999, or rm < 4 (or the summation has
            // been repeated previously) and the first 4 rounding digits 9999?
            // If so, restart the summation with a higher precision, otherwise
            // e.g. with precision: 12, rounding: 1
            // ln(135520028.6126091714265381533) = 18.7246299999 when it should be 18.72463.
            // `wpr - guard` is the index of first rounding digit.
            if (sd == null) {
                if (checkRoundingDigits(sum.d, wpr - guard, rm, rep)) {
                    Decimal.precision = wpr += guard;
                    t = numerator = x = divide(x1.sub(1), x1.add(1), wpr, 1);
                    x2 = finalise(x.mul(x), wpr, 1);
                    denominator = rep = 1;
                }
                else {
                    return finalise(sum, Decimal.precision = pr, rm, Decimal.external = true);
                }
            }
            else {
                Decimal.precision = pr;
                return sum;
            }
        }
        sum = t;
        denominator += 2;
    }
}
