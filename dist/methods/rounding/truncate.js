//
// Return a new Decimal whose value is the value of this Decimal truncated to a whole number.
// Does not strip trailing zeros.
//
export function truncate(arr, len) {
    if (arr.length > len) {
        arr.length = len;
        return true;
    }
    return false;
}
