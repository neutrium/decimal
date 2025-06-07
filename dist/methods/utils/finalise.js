import { Decimal } from '../../Decimal.js';
import { checkOverflow } from '../utils/check-overflow.js';
//
// Round `x` to `sd` significant digits using rounding mode `rm`.
// Check for over/under-flow.
//
export function finalise(x, sd = null, rm = Decimal.rounding, isTruncated) {
    let digits, i, j, k, rd, roundUp, w, xd, xdi, LOG_BASE = Decimal.params.LOG_BASE, BASE = Decimal.params.BASE;
    // Don't round if sd is null or undefined.
    out: if (sd != null) {
        xd = x.d;
        // Infinity/NaN.
        if (!xd) {
            return x;
        }
        // rd: the rounding digit, i.e. the digit after the digit that may be rounded up.
        // w: the word of xd containing rd, a base 1e7 number.
        // xdi: the index of w within xd.
        // digits: the number of digits of w.
        // i: what would be the index of rd within w if all the numbers were 7 digits long (i.e. if
        // they had leading zeros)
        // j: if > 0, the actual index of rd within w (if < 0, rd is a leading zero).
        // Get the length of the first word of the digits array xd.
        for (digits = 1, k = xd[0]; k >= 10; k /= 10) {
            digits++;
        }
        i = sd - digits;
        // Is the rounding digit in the first word of xd?
        if (i < 0) {
            i += LOG_BASE;
            j = sd;
            w = xd[xdi = 0];
            // Get the rounding digit at index j of w.
            rd = w / Math.pow(10, digits - j - 1) % 10 | 0;
        }
        else {
            xdi = Math.ceil((i + 1) / LOG_BASE);
            k = xd.length;
            if (xdi >= k) {
                if (isTruncated) {
                    // Needed by `naturalExponential`, `naturalLogarithm` and `squareRoot`.
                    for (; k++ <= xdi;) {
                        xd.push(0);
                    }
                    w = rd = 0;
                    digits = 1;
                    i %= LOG_BASE;
                    j = i - LOG_BASE + 1;
                }
                else {
                    break out;
                }
            }
            else {
                w = k = xd[xdi];
                // Get the number of digits of w.
                for (digits = 1; k >= 10; k /= 10) {
                    digits++;
                }
                // Get the index of rd within w.
                i %= LOG_BASE;
                // Get the index of rd within w, adjusted for leading zeros.
                // The number of leading zeros of w is given by LOG_BASE - digits.
                j = i - LOG_BASE + digits;
                // Get the rounding digit at index j of w.
                rd = j < 0 ? 0 : w / Math.pow(10, digits - j - 1) % 10 | 0;
            }
        }
        // Are there any non-zero digits after the rounding digit?
        isTruncated = isTruncated || sd < 0 || xd[xdi + 1] !== void 0 || (j < 0 ? w : w % Math.pow(10, digits - j - 1));
        // The expression `w % Math.pow(10, digits - j - 1)` returns all the digits of w to the right
        // of the digit at (left-to-right) index j, e.g. if w is 908714 and j is 2, the expression
        // will give 714.
        roundUp = rm < 4
            ? (rd || isTruncated) && (rm == 0 || rm == (x.s < 0 ? 3 : 2))
            : rd > 5 || rd == 5 && (rm == 4 || isTruncated || rm == 6 &&
                // Check whether the digit to the left of the rounding digit is odd.
                ((i > 0 ? j > 0 ? w / Math.pow(10, digits - j) : 0 : xd[xdi - 1]) % 10) & 1 ||
                rm == (x.s < 0 ? 8 : 7));
        if (sd < 1 || !xd[0]) {
            xd.length = 0;
            if (roundUp) {
                // Convert sd to decimal places.
                sd -= x.e + 1;
                // 1, 0.1, 0.01, 0.001, 0.0001 etc.
                xd[0] = Math.pow(10, (LOG_BASE - sd % LOG_BASE) % LOG_BASE);
                x.e = -sd || 0;
            }
            else {
                // Zero.
                xd[0] = x.e = 0;
            }
            return x;
        }
        // Remove excess digits.
        if (i == 0) {
            xd.length = xdi;
            k = 1;
            xdi--;
        }
        else {
            xd.length = xdi + 1;
            k = Math.pow(10, LOG_BASE - i);
            // E.g. 56700 becomes 56000 if 7 is the rounding digit.
            // j > 0 means i > number of leading zeros of w.
            xd[xdi] = j > 0 ? (w / Math.pow(10, digits - j) % Math.pow(10, j) | 0) * k : 0;
        }
        if (roundUp) {
            for (;;) {
                // Is the digit to be rounded up in the first word of xd?
                if (xdi == 0) {
                    // i will be the length of xd[0] before k is added.
                    for (i = 1, j = xd[0]; j >= 10; j /= 10)
                        i++;
                    j = xd[0] += k;
                    for (k = 1; j >= 10; j /= 10)
                        k++;
                    // if i != k the length has increased.
                    if (i != k) {
                        x.e++;
                        if (xd[0] == BASE)
                            xd[0] = 1;
                    }
                    break;
                }
                else {
                    xd[xdi] += k;
                    if (xd[xdi] != BASE)
                        break;
                    xd[xdi--] = 0;
                    k = 1;
                }
            }
        }
        // Remove trailing zeros.
        for (i = xd.length; xd[--i] === 0;) {
            xd.pop();
        }
    }
    return checkOverflow(x);
}
