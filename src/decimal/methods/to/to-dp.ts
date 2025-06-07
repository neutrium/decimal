import { Decimal } from "../../Decimal.js";
import { checkInt32 } from "../utils/check-int.js";
import { finalise } from "../utils/finalise.js";

//
// Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `dp`
// decimal places using rounding mode `rm` or `rounding` if `rm` is omitted.
//
// If `dp` is omitted, return a new Decimal whose value is the value of this Decimal.
//
// [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
// [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
//
export function toDP(x: Decimal, dp ?: number, rm: number = Decimal.config.rounding) : Decimal
{
	if (dp === void 0)
	{
		return x;
	}

	checkInt32(dp, 0, Decimal.params.MAX_DIGITS);
	checkInt32(rm, 0, 8);

	return finalise(x, dp + x.e + 1, rm);
}