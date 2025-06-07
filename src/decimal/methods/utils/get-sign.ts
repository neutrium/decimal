import { Decimal } from "../..//Decimal.js";

export function getSign(x: Decimal) : number
{
	return x.d ? (x.d[0] ? x.s : 0 * x.s) : x.s || NaN;
}