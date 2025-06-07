import { Decimal } from "../../Decimal.js"
import { finiteToString } from "./finite-to-string.js";

//
// Return a string representing the value of this Decimal.
//
// Return exponential notation if this Decimal has a positive exponent equal to or greater than
// `toExpPos`, or a negative exponent equal to or less than `toExpNeg`.
//
export function toString(x: Decimal) : string
{
	const str = finiteToString(x, x.e <= Decimal.config.toExpNeg || x.e >= Decimal.config.toExpPos);

	return x.isNeg() && !x.isZero() ? '-' + str : str;
}

