import type { KernelDecimal } from "../../KernelDecimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { formatFinite } from "./finite-to-string.js";
import { isNeg } from "../compare/identity-compare.js";
import { getDecimalState } from '../../DecimalState.js';

//
// Return a string representing the value of this Decimal.
// Unlike `toString`, negative zero will include the minus sign.
//
export function toValue(x: KernelDecimal, context: CalculationContext) : string
{
	const { toExpNeg, toExpPos, maxOutputDigits } = context.config;
	const e = getDecimalState(x).e;
	const str = formatFinite(x, e <= toExpNeg || e >= toExpPos, undefined, maxOutputDigits);

	return isNeg(x) ? '-' + str : str;
}
