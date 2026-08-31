import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import type { RoundingCode } from "../../config/RoundingModes.js";
import { checkInt32 } from "../utils/check-int.js";
import { finalise } from "../utils/finalise.js";
import { getDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `dp`
// decimal places using the resolved rounding mode `rm`.
//
// If `dp` is omitted, return a new Decimal whose value is the value of this Decimal.
//
// [dp] {number} Decimal places. Integer, 0 to MAX_DIGITS inclusive.
// rm {RoundingCode} Validated and defaulted by the public method before dispatch.
//
export function toDP(x: Decimal, dp : number | undefined, rm: RoundingCode, context : CalculationContext) : Decimal
{
	if (dp === void 0)
	{
		return finalise(context.createExact(x), null, rm, undefined, context);
	}

	checkInt32(dp, 0, DecimalConstants.MAX_DIGITS);

	return finalise(context.createExact(x), dp + getDecimalState(x).e + 1, rm, undefined, context);
}
