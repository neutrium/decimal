import { getPrecision } from "./get-precision.js";
//
// Return the number of significant digits of the value of this Decimal.
// [z] {boolean|number} Whether to count integer-part trailing zeros: true, false, 1 or 0.
//
export function precision(x, z) {
    let k;
    if (z !== void 0 && z !== !!z && z !== 1 && z !== 0) {
        throw Error("[DecimalError] Invaild Argument: " + z);
    }
    if (x.d) {
        k = getPrecision(x.d);
        if (z && x.e + 1 > k)
            k = x.e + 1;
    }
    else {
        k = NaN;
    }
    return k;
}
