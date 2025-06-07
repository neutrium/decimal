import { Decimal } from "../../Decimal.js";
import { finalise } from "../utils/finalise.js";
//
// Return a new Decimal whose value is the absolute value of this Decimal.
//
export function abs(xx) {
    let x = new Decimal(xx);
    if (x.s < 0) {
        x.s = 1;
    }
    return finalise(x);
}
