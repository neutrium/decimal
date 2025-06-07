import { Decimal } from "../../Decimal.js"
import { finiteToString } from "./finite-to-string.js";

//
// Return a string representing the value of this Decimal.
// Unlike `toString`, negative zero will include the minus sign.
//
export function toValue(x: Decimal) : string
{
	const str = finiteToString(x, x.e <= Decimal.config.toExpNeg || x.e >= Decimal.config.toExpPos);

	return x.isNeg() ? '-' + str : str;
}