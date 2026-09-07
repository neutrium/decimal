import { PI_PRECISION } from '../../constants.js';
import type { KernelDecimal } from "../../KernelDecimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { precisionLimitExceededError } from "../../errors.js";
import type { RoundingCode } from "../../config/RoundingModes.js";
import { getCachedPi } from "../../ConstantCache.js";
import { finalise } from "../utils/finalise.js";

export function getPi(sd : number, rm : RoundingCode, context : CalculationContext) : KernelDecimal
{
	if (sd > PI_PRECISION)
	{
		throw precisionLimitExceededError();
	}

	return finalise(getCachedPi(context), sd, rm, true, context);
}
