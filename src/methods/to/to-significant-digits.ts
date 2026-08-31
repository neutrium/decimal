import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import type { RoundingCode } from "../../config/RoundingModes.js";
import { checkInt32 } from "../utils/check-int.js";
import { finalise } from "../utils/finalise.js";

//
// Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `sd`
// significant digits using the resolved rounding mode `rm`. Omitted `sd` defaults to `precision`.
//
// [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
// rm {RoundingCode} Validated and defaulted by the public method before dispatch.
//
export function toSignificantDigits(
	x: Decimal,
	sd : number | undefined,
	rm : RoundingCode,
	context : CalculationContext
) : Decimal
{
	if (sd === void 0)
	{
		sd = context.precision;
	}

	checkInt32(sd, 1, DecimalConstants.MAX_DIGITS);

	return finalise(context.createExact(x), sd, rm, undefined, context);
}
