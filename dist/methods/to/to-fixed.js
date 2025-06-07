import { Decimal } from "../../Decimal.js";
import { DecimalParams } from "../../DecimalParameters.js";
import { checkInt32 } from "../utils/check-int.js";
import { finalise } from "../utils/finalise.js";
import { finiteToString } from "./finite-to-string.js";
//
// Return a string representing the value of this Decimal in normal (fixed-point) notation to
// `dp` fixed decimal places and rounded using rounding mode `rm` or `rounding` if `rm` is omitted.
//
// As with JavaScript numbers, (-0).toFixed(0) is '0', but e.g. (-0.00001).toFixed(0) is '-0'.
//
// [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
// [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
//
// (-0).toFixed(0) is '0', but (-0.1).toFixed(0) is '-0'.
// (-0).toFixed(1) is '0.0', but (-0.01).toFixed(1) is '-0.0'.
// (-0).toFixed(3) is '0.000'.
// (-0.5).toFixed(0) is '-0'.
//
export function toFixed(x, dp, rm = Decimal.config.rounding) {
    var str, y;
    if (dp === void 0) {
        str = finiteToString(x);
    }
    else {
        checkInt32(dp, 0, DecimalParams.MAX_DIGITS);
        checkInt32(rm, 0, 8);
        y = finalise(new Decimal(x), dp + x.e + 1, rm);
        str = finiteToString(y, false, dp + y.e + 1);
    }
    // To determine whether to add the minus sign look at the value before it was rounded,
    // i.e. look at `x` rather than `y`.
    return x.isNeg() && !x.isZero() ? '-' + str : str;
}
