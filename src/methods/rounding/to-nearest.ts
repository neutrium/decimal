import type { Decimal, DecimalValue } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import {
	ROUND_CEIL,
	ROUND_DOWN,
	ROUND_FLOOR,
	ROUND_HALF_CEIL,
	ROUND_HALF_DOWN,
	ROUND_HALF_FLOOR,
	ROUND_HALF_UP,
	ROUND_UP,
	type RoundingCode,
} from "../../config/RoundingModes.js";
import { divideInteger } from "../arithmetic/div.js";
import { finalise } from '../utils/finalise.js'
import { mul } from '../arithmetic/mul.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';

//
// Returns a new Decimal whose value is the nearest multiple of the magnitude of `y` to the value
// of this Decimal.
//
// If the value of this Decimal is equidistant from two multiples of `y`, the resolved rounding
// mode `rm` determines the direction of the nearest multiple.
//
// In the context of this method, rounding mode 4 (ROUND_HALF_UP) is the same as rounding mode 0
// (ROUND_UP), and so on.
//
// The return value will always have the same sign as this Decimal, unless either this Decimal
// or `y` is NaN, in which case the return value will be also be NaN.
//
// The return value is not affected by the value of `precision`.
//
	// y {DecimalValue} The magnitude to round to a multiple of. Defaults to 1.
// rm {RoundingCode} Validated and defaulted by the public method before dispatch.
//
export function toNearest(
	x: Decimal,
	yy : DecimalValue | undefined,
	rm : RoundingCode,
	context : CalculationContext
) : Decimal
{
	const xState = getDecimalState(x);
	let y : Decimal;

	if (yy == null)
	{
		// If x is not finite, return an independent copy.
		if (!xState.d) return context.create(x);

		y = context.create(1);
	}
	else
	{
		y = context.createExact(yy);
		const yState = getMutableDecimalState(y);

		// If x is not finite, return x if y is not NaN, else NaN.
		if (!xState.d) return yState.s ? context.create(x) : y;

		// If y is not finite, return Infinity with the sign of x if y is Infinity, else NaN.
		if (!yState.d)
		{
			if (yState.s) yState.s = xState.s;
			return y;
		}

		// The public argument is a magnitude; its sign must not reverse directed tie-breaking.
		if (yState.s < 0) yState.s = 1;
	}

	// If y is not zero, calculate the nearest multiple of y to x.
	const yState = getMutableDecimalState(y);

	if (yState.d !== null && yState.d[0])
	{
		const workingContext = context.withoutLimits();

		if (rm === ROUND_UP)
		{
			rm = ROUND_HALF_UP;
		}
		else if (rm === ROUND_DOWN)
		{
			rm = ROUND_HALF_DOWN;
		}
		else if (rm === ROUND_CEIL)
		{
			rm = ROUND_HALF_CEIL;
		}
		else if (rm === ROUND_FLOOR)
		{
			rm = ROUND_HALF_FLOOR;
		}

		x = mul(divideInteger(x, y, workingContext, rm), y, workingContext);
		finalise(x, null, context.roundingCode, undefined, context);

		// If y is zero, return zero with the sign of x.
	}
	else
	{
		yState.s = xState.s;
		x = y;
	}

	return x;
}
