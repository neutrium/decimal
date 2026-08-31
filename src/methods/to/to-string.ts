import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { formatFinite } from "./finite-to-string.js";
import { isNeg, isZero } from "../compare/identity-compare.js";
import { getDecimalState } from '../../DecimalState.js';

//
// Return a string representing the value of this Decimal.
//
// Return exponential notation if this Decimal has a positive exponent equal to or greater than
// `toExpPos`, or a negative exponent equal to or less than `toExpNeg`.
//
export function toString(x: Decimal, context: CalculationContext) : string
{
	const { toExpNeg, toExpPos, maxOutputDigits } = context.config;
	const e = getDecimalState(x).e;
	const str = formatFinite(x, e <= toExpNeg || e >= toExpPos, undefined, maxOutputDigits);

	return isNeg(x) && !isZero(x) ? '-' + str : str;
}
