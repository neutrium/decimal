import { Decimal } from "../../Decimal.js";
import { divide } from "../arithmetic/div.js";
//
// Calculate Taylor series for `cos`, `cosh`, `sin` and `sinh`.
//
export function taylorSeries(n, x, y, isHyperbolic) {
    let j, t, u, x2, i = 1, pr = Decimal.precision, k = Math.ceil(pr / Decimal.params.LOG_BASE);
    Decimal.external = false;
    x2 = x.mul(x);
    u = new Decimal(y);
    for (;;) {
        t = divide(u.mul(x2), new Decimal(n++ * n++), pr, 1);
        u = isHyperbolic ? y.add(t) : y.sub(t);
        y = divide(t.mul(x2), new Decimal(n++ * n++), pr, 1);
        t = u.add(y);
        if (t.d[k] !== void 0) {
            for (j = k; t.d[j] === u.d[j] && j--;)
                ;
            if (j == -1) {
                break;
            }
        }
        j = u;
        u = y;
        y = t;
        t = j;
        i++;
    }
    Decimal.external = true;
    t.d.length = k + 1;
    return t;
}
