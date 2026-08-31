import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_DOWN } from "../../config/RoundingModes.js";
import { isOdd } from "../compare/identity-compare.js";
import { divToInt } from "../arithmetic/div.js";
import { abs } from "../arithmetic/abs.js";
import { mul } from "../arithmetic/mul.js";
import { sub } from "../arithmetic/add-subtract.js";
import { isZero } from "../compare/identity-compare.js";
import { compareDecimals } from "../compare/relational-compare.js";
import { getPi } from "./get-pi.js";
import { getDecimalState } from '../../DecimalState.js';

//
// Return the absolute value of `x` reduced to less than or equal to half pi.
//
export type ReducedAngle = {
	readonly quadrant: 1 | 2 | 3 | 4;
	readonly value: Decimal;
};

export function toLessThanHalfPi(x : Decimal, context : CalculationContext) : ReducedAngle
{
	let t,
		isNeg = getDecimalState(x).s < 0,
		pi = getPi(context.precision, ROUND_DOWN, context),
		halfPi = mul(pi, 0.5, context);

	x = abs(x, context);

	if (compareDecimals(x, halfPi) < 1)
	{
		return { quadrant: isNeg ? 4 : 1, value: x };
	}

	t = divToInt(x, pi, context);

	if (isZero(t))
	{
		return {
			quadrant: isNeg ? 3 : 2,
			value: abs(sub(x, pi, context), context)
		};
	}
	else
	{
		x = sub(x, mul(t, pi, context), context);

		// 0 <= x < pi
		if (compareDecimals(x, halfPi) < 1)
		{
			return {
				quadrant: isOdd(t) ? (isNeg ? 2 : 3) : (isNeg ? 4 : 1),
				value: x
			};
		}

		return {
			quadrant: isOdd(t) ? (isNeg ? 1 : 4) : (isNeg ? 3 : 2),
			value: abs(sub(x, pi, context), context)
		};
	}
}
