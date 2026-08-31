import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import type { RoundingCode } from "../../config/RoundingModes.js";
import { formatFinite } from "./finite-to-string.js";
import { finalise } from "../utils/finalise.js";
import { checkInt32 } from "../utils/check-int.js";
import { isNeg, isZero } from "../compare/identity-compare.js";

//
// Return a string representing the value of this Decimal in exponential notation rounded to
// `dp` fixed decimal places using the resolved rounding mode `rm`.
//
// [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
// rm {RoundingCode} Validated and defaulted by the public method before dispatch.
//
export function toExponential(x: Decimal, dp : number | undefined, rm : RoundingCode, context : CalculationContext) : string
{
	let str;

	if (dp === void 0)
	{
		str = formatFinite(x, true, undefined, context.config.maxOutputDigits);
	}
	else
	{
		checkInt32(dp, 0, DecimalConstants.MAX_DIGITS);
		const formattingContext = context.withoutLimits();
		const y = finalise(formattingContext.create(x), dp + 1, rm, undefined, formattingContext);
		str = formatFinite(y, true, dp + 1, context.config.maxOutputDigits);
	}

	return isNeg(x) && !isZero(x) ? '-' + str : str;
}
