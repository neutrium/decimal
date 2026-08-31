import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import type { RoundingCode } from "../../config/RoundingModes.js";
import { DecimalConstants } from "../../InternalConstants.js";
import { checkInt32 } from "../utils/check-int.js";
import { finalise } from "../utils/finalise.js";
import { formatFinite } from "./finite-to-string.js";
import { isNeg } from "../compare/identity-compare.js";
import { getDecimalState } from '../../DecimalState.js';


//
// Return a string representing the value of this Decimal in normal (fixed-point) notation to
// `dp` fixed decimal places and rounded using the resolved rounding mode `rm`.
//
// Unlike JavaScript numbers, an existing negative zero retains its sign.
//
// [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
// rm {RoundingCode} Validated and defaulted by the public method before dispatch.
//
// (-0).toFixed(0) is '-0', and (-0.1).toFixed(0) is '-0'.
// (-0).toFixed(1) is '-0.0', and (-0.01).toFixed(1) is '-0.0'.
// (-0).toFixed(3) is '-0.000'.
// (-0.5).toFixed(0) is '-0'.
//
export function toFixed(x: Decimal, dp : number | undefined, rm: RoundingCode, context : CalculationContext) : string
{
	var str, y;

	if (dp === void 0)
	{
		str = formatFinite(x, false, undefined, context.config.maxOutputDigits);
	}
	else
	{
		checkInt32(dp, 0, DecimalConstants.MAX_DIGITS);
		const formattingContext = context.withoutLimits();
		y = finalise(formattingContext.create(x), dp + getDecimalState(x).e + 1, rm, undefined, formattingContext);
		str = formatFinite(y, false, dp + getDecimalState(y).e + 1, context.config.maxOutputDigits);
	}

	// To determine whether to add the minus sign look at the value before it was rounded,
	// i.e. look at `x` rather than `y`.
	return isNeg(x) ? '-' + str : str;
}
