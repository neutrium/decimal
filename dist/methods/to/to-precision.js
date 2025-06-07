import { Decimal } from '../../Decimal.js';
import { checkInt32 } from '../utils/check-int.js';
import { finiteToString } from './finite-to-string.js';
import { finalise } from '../utils/finalise.js';
//
// Return a string representing the value of this Decimal rounded to `sd` significant digits
// using rounding mode `rounding`.
//
// Return exponential notation if `sd` is less than the number of digits necessary to represent
// the integer part of the value in normal notation.
//
// [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
// [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
//
export function toPrecision(x, sd, rm = Decimal.config.rounding) {
    let str;
    const config = Decimal.config;
    if (sd === void 0) {
        str = finiteToString(x, x.e <= config.toExpNeg || x.e >= config.toExpPos);
    }
    else {
        checkInt32(sd, 1, Decimal.params.MAX_DIGITS);
        checkInt32(rm, 0, 8);
        const y = finalise(new Decimal(x), sd, rm);
        str = finiteToString(y, sd <= y.e || y.e <= config.toExpNeg, sd);
    }
    return x.isNeg() && !x.isZero() ? '-' + str : str;
}
