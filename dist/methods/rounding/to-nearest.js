import { Decimal } from "../../Decimal.js";
import { checkInt32 } from "../utils/check-int.js";
import { divide } from "../arithmetic/div.js";
import { finalise } from '../utils/finalise.js';
//
// Returns a new Decimal whose value is the nearest multiple of the magnitude of `y` to the value
// of this Decimal.
//
// If the value of this Decimal is equidistant from two multiples of `y`, the rounding mode `rm`,
// or `Decimal.rounding` if `rm` is omitted, determines the direction of the nearest multiple.
//
// In the context of this method, rounding mode 4 (ROUND_HALF_UP) is the same as rounding mode 0
// (ROUND_UP), and so on.
//
// The return value will always have the same sign as this Decimal, unless either this Decimal
// or `y` is NaN, in which case the return value will be also be NaN.
//
// The return value is not affected by the value of `precision`.
//
// y {number|string|Decimal} The magnitude to round to a multiple of.
// [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
//
// 'toNearest() rounding mode not an integer: {rm}'
// 'toNearest() rounding mode out of range: {rm}'
//
export function toNearest(x, yy, rm = Decimal.config.rounding) {
    let y;
    if (yy == null) {
        // If x is not finite, return x.
        if (!x.d)
            return x;
        y = new Decimal(1);
    }
    else {
        y = new Decimal(yy);
        if (rm !== void 0)
            checkInt32(rm, 0, 8);
        // If x is not finite, return x if y is not NaN, else NaN.
        if (!x.d)
            return y.s ? x : y;
        // If y is not finite, return Infinity with the sign of x if y is Infinity, else NaN.
        if (!y.d) {
            if (y.s)
                y.s = x.s;
            return y;
        }
    }
    // If y is not zero, calculate the nearest multiple of y to x.
    if (y.d !== null && y.d[0]) {
        Decimal.external = false;
        if (rm < 4)
            rm = [4, 5, 7, 8][rm];
        x = divide(x, y, 0, rm, 1).mul(y);
        Decimal.external = true;
        finalise(x);
        // If y is zero, return zero with the sign of x.
    }
    else {
        y.s = x.s;
        x = y;
    }
    return x;
}
