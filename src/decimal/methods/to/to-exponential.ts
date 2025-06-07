import { Decimal } from "../../Decimal.js";
import { finiteToString } from "./finite-to-string.js";
import { finalise } from "../utils/finalise.js";
import { checkInt32 } from "../utils/check-int.js";

//
// Return a string representing the value of this Decimal in exponential notation rounded to
// `dp` fixed decimal places using rounding mode `rounding`.
//
// [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
// [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
//
export function toExponential(x: Decimal, dp ?: number, rm ?: number) : string
{
	let str;

	if (dp === void 0)
	{
		str = finiteToString(x, true);
	}
	else
	{
		checkInt32(dp, 0, Decimal.params.MAX_DIGITS);

		if (rm === void 0)
		{
			rm = Decimal.rounding;
		}
		else
		{
			checkInt32(rm, 0, 8);
		}

		const y = finalise(new Decimal(x), dp + 1, rm);
		str = finiteToString(y, true, dp + 1);
	}

	return x.isNeg() && !x.isZero() ? '-' + str : str;
}