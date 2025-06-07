import { Decimal } from "../../Decimal.js";
import { divide } from "../arithmetic/div.js";
import { digitsToString } from "../utils/digits-to-string.js";
import { getPrecision } from "../utils/get-precision.js";
//
// Return an array representing the value of Decimal `x` as a simple fraction with an integer
// numerator and an integer denominator.
//
// The denominator will be a positive non-zero value less than or equal to the specified maximum
// denominator. If a maximum denominator is not specified, the denominator will be the lowest
// value necessary to represent the number exactly.
//
// [maxD] {number|string|Decimal} Maximum denominator. Integer >= 1 and < Infinity.
//
export function toFraction(x, denominator) {
    let d0, d1, d2, k, n, n0, n1, pr, q, r, xd = x.d, maxD = denominator ? new Decimal(denominator) : null;
    if (!xd) {
        return [new Decimal(x)];
    }
    n1 = d0 = new Decimal(1);
    d1 = n0 = new Decimal(0);
    let d = new Decimal(d1);
    let e = d.e = getPrecision(xd) - x.e - 1;
    k = e % Decimal.params.LOG_BASE;
    d.d[0] = Math.pow(10, k < 0 ? Decimal.params.LOG_BASE + k : k);
    if (maxD == null) {
        // d is 10**e, the minimum max-denominator needed.
        maxD = e > 0 ? d : n1;
    }
    else {
        n = new Decimal(maxD);
        if (!n.isInt() || n.lt(n1)) {
            throw Error("[DecimalError] Invalid Argument: " + n);
        }
        maxD = n.gt(d) ? (e > 0 ? d : n1) : n;
    }
    Decimal.external = false;
    n = new Decimal(digitsToString(xd));
    pr = Decimal.precision;
    e = xd.length * Decimal.params.LOG_BASE * 2;
    Decimal.precision = e;
    for (;;) {
        q = divide(n, d, 0, 1, 1);
        d2 = d0.add(q.mul(d1));
        if (d2.cmp(maxD) == 1) {
            break;
        }
        d0 = d1;
        d1 = d2;
        d2 = n1;
        n1 = n0.add(q.mul(d2));
        n0 = d2;
        d2 = d;
        d = n.sub(q.mul(d2));
        n = d2;
    }
    d2 = divide(maxD.sub(d0), d1, 0, 1, 1);
    n0 = n0.add(d2.mul(n1));
    d0 = d0.add(d2.mul(d1));
    n0.s = n1.s = x.s;
    // Determine which fraction is closer to x, n0/d0 or n1/d1?
    r = divide(n1, d1, e, 1).sub(x).abs().cmp(divide(n0, d0, e, 1).sub(x).abs()) < 1
        ? [n1, d1] : [n0, d0];
    Decimal.precision = pr;
    Decimal.external = true;
    return r;
}
