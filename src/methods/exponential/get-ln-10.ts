import { LN10_PRECISION } from '../../constants.js';
import type { KernelDecimal } from "../../KernelDecimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_DOWN } from "../../config/RoundingModes.js";
import { precisionLimitExceededError } from "../../errors.js";
import { getCachedLn10 } from "../../ConstantCache.js";
import { finalise } from "../utils/finalise.js";

export function getLn10(sd : number, context : CalculationContext) : KernelDecimal
{
	if (sd > LN10_PRECISION)
	{
		throw precisionLimitExceededError();
	}

	return finalise(getCachedLn10(context), sd, ROUND_DOWN, true, context);
}
