import type { KernelDecimal } from "../../KernelDecimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { finalise } from "../utils/finalise.js";
import { getMutableDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the absolute value of this Decimal.
//
export function abs(xx: KernelDecimal, context: CalculationContext) : KernelDecimal
{
	const x = context.createExact(xx);

	if (getMutableDecimalState(x).s < 0)
	{
		getMutableDecimalState(x).s = 1;
	}

	return finalise(x, null, context.roundingCode, undefined, context);
}
