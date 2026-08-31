import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal } from '../../Decimal.js';
import type { CalculationContext } from '../../CalculationContext.js';
import type { RoundingCode } from '../../config/RoundingModes.js';
import { checkInt32 } from '../utils/check-int.js';
import { formatFinite } from './finite-to-string.js';
import { finalise } from '../utils/finalise.js';
import { isNeg, isZero } from '../compare/identity-compare.js';
import { getDecimalState } from '../../DecimalState.js';

//
// Return a string representing the value of this Decimal rounded to `sd` significant digits
// using rounding mode `rounding`.
//
// Return exponential notation if `sd` is less than the number of digits necessary to represent
// the integer part of the value in normal notation.
//
// [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
// rm {RoundingCode} Validated and defaulted by the public method before dispatch.
//
export function toPrecision(x: Decimal, sd : number | undefined, rm : RoundingCode, context : CalculationContext) : string
{
	let str: string;
	const config = context.config;

	if (sd === void 0)
	{
		const e = getDecimalState(x).e;
		str = formatFinite(x, e <= config.toExpNeg || e >= config.toExpPos, undefined, config.maxOutputDigits);
	}
	else
	{
		checkInt32(sd, 1, DecimalConstants.MAX_DIGITS);
		const formattingContext = context.withoutLimits();
		const y = finalise(formattingContext.create(x), sd, rm, undefined, formattingContext);
		const e = getDecimalState(y).e;
		str = formatFinite(y, sd <= e || e <= config.toExpNeg, sd, config.maxOutputDigits);
	}

	return isNeg(x) && !isZero(x) ? '-' + str : str;
}
