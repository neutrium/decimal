import { Decimal } from "../../Decimal.js";
import { finalise } from "../utils/finalise.js";

//
// Return a new Decimal whose value is the value of `x` negated, i.e. as if multiplied by -1
//
export function neg(xx: Decimal) : Decimal
{
	let x = new Decimal(xx);
	x.s = -x.s;

	return finalise(x);
}