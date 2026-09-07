import type { KernelDecimal } from "../../KernelDecimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_CEIL, ROUND_FLOOR } from "../../config/RoundingModes.js";
import { finalise } from "../utils/finalise.js";
import { getDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the value of `x` rounded to a whole number in the
// direction of positive Infinity.
//
export function ceil(x: KernelDecimal, context: CalculationContext) : KernelDecimal
{
	return finalise(context.createExact(x), getDecimalState(x).e + 1, ROUND_CEIL, undefined, context);
}

//
// Return a new Decimal whose value is the value of `x` rounded to a whole number in the
// direction of negative Infinity.
//
export function floor(x: KernelDecimal, context: CalculationContext) : KernelDecimal
{
	return finalise(context.createExact(x), getDecimalState(x).e + 1, ROUND_FLOOR, undefined, context);
}

//
// Return a new Decimal whose value is the value of `x` rounded to a whole number using rounding mode `rounding`.
//
export function round(xx: KernelDecimal, context: CalculationContext) : KernelDecimal
{
	const x = context.createExact(xx);

	return finalise(x, getDecimalState(x).e + 1, context.roundingCode, undefined, context);
}
