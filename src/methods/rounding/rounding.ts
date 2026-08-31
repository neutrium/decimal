import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_CEIL, ROUND_FLOOR } from "../../config/RoundingModes.js";
import { finalise } from "../utils/finalise.js";
import { getDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the value of `x` rounded to a whole number in the
// direction of positive Infinity.
//
export function ceil(x: Decimal, context: CalculationContext) : Decimal
{
	return finalise(context.createExact(x), getDecimalState(x).e + 1, ROUND_CEIL, undefined, context);
}

//
// Return a new Decimal whose value is the value of `x` rounded to a whole number in the
// direction of negative Infinity.
//
export function floor(x: Decimal, context: CalculationContext) : Decimal
{
	return finalise(context.createExact(x), getDecimalState(x).e + 1, ROUND_FLOOR, undefined, context);
}

//
// Return a new Decimal whose value is the value of `x` rounded to a whole number using rounding mode `rounding`.
//
export function round(xx: Decimal, context: CalculationContext) : Decimal
{
	const x = context.createExact(xx);

	return finalise(x, getDecimalState(x).e + 1, context.roundingCode, undefined, context);
}
