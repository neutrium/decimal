import { Decimal } from "../../Decimal.js";
//
// Return true if the value of x Decimal is a finite number, otherwise return false.
//
export function isFinite(x) {
    return !!x.d;
}
//
// Return true if the value of x Decimal is an integer, otherwise return false.
//
export function isInt(x) {
    return !!x.d && Math.floor(x.e / Decimal.params.LOG_BASE) > x.d.length - 2;
}
//
// Return true if the value of x Decimal is NaN, otherwise return false.
//
export function isNaN(x) {
    return !x.s;
}
//
// Return true if the value of x Decimal is negative, otherwise return false.
//
export function isNeg(x) {
    return x.s < 0;
}
//
// Return true if the value of x Decimal is positive, otherwise return false.
//
export function isPos(x) {
    return x.s > 0;
}
//
// Return true if the value of x Decimal is 0 or -0, otherwise return false.
//
export function isZero(x) {
    return !!x.d && x.d[0] === 0;
}
export function isOdd(n) {
    return (n.d[n.d.length - 1] & 1) === 1;
}
export function isEven(n) {
    return (n.d[n.d.length - 1] & 1) === 0;
}
