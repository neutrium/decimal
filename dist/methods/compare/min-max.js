import { Decimal } from "../../Decimal.js";
//
// Return a new Decimal whose value is the maximum of the arguments and the value of this Decimal.
// arguments {number|string|Decimal}
//
export function max(...values) {
    return maxOrMin(values.flat(), -1);
}
//
// Return a new Decimal whose value is the minimum of the arguments and the value of this Decimal.
// arguments {number|string|Decimal}
//
export function min(...values) {
    return maxOrMin(values.flat(), 1);
}
//
// Handle `max` and `min`. `ltgt` is 'lt' or 'gt'.
//
function maxOrMin(values, n) {
    let y, k, x = new Decimal(values[0]), i = 0;
    for (; ++i < values.length;) {
        y = new Decimal(values[i]);
        if (!y.s) {
            x = y;
            break;
        }
        k = x.cmp(y);
        if (k === n || k === 0 && x.s === n) {
            x = y;
        }
    }
    return x;
}
