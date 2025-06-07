import { Decimal } from '../../Decimal.js';
import { finalise } from '../utils/finalise.js';
import { divide } from './div.js';
//
// Return a new Decimal whose value is the value of `x` modulo `y`, rounded to
// `precision` significant digits using rounding mode `rounding`.
//
// The result depends on the modulo mode.
//   n % 0 =  N
//   n % N =  N
//   n % I =  n
//   0 % n =  0
//  -0 % n = -0
//   0 % 0 =  N
//   0 % N =  N
//   0 % I =  0
//   N % n =  N
//   N % 0 =  N
//   N % N =  N
//   N % I =  N
//   I % n =  N
//   I % 0 =  N
//   I % N =  N
//   I % I =  N
//
export function mod(x, yy) {
    let q, y = new Decimal(yy), config = Decimal.config;
    // Return NaN if x is ±Infinity or NaN, or y is NaN or ±0.
    if (!x.d || !y.s || y.d && !y.d[0]) {
        return new Decimal(NaN);
    }
    // Return x if y is ±Infinity or x is ±0.
    if (!y.d || x.d && !x.d[0]) {
        return finalise(new Decimal(x), config.precision, config.rounding);
    }
    // Prevent rounding of intermediate calculations.
    Decimal.external = false;
    if (config.modulo == 9) {
        // Euclidian division: q = sign(y) * floor(x / abs(y))
        // result = x - q * y    where  0 <= result < abs(y)
        q = divide(x, y.abs(), 0, 3, 1);
        q.s *= y.s;
    }
    else {
        q = divide(x, y, 0, config.modulo, 1);
    }
    q = q.mul(y);
    Decimal.external = true;
    return x.sub(q);
}
