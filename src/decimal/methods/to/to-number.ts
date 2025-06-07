import { Decimal } from "../../Decimal.js";

//
// Return the value of this Decimal converted to a number primitive.
// Zero keeps its sign.
//
export function toNumber(x: Decimal) : number
{
	return +x;
}