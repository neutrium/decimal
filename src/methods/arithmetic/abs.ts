import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { finalise } from "../utils/finalise.js";
import { getMutableDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the absolute value of this Decimal.
//
export function abs(xx: Decimal, context: CalculationContext) : Decimal
{
	const x = context.createExact(xx);

	if (getMutableDecimalState(x).s < 0)
	{
		getMutableDecimalState(x).s = 1;
	}

	return finalise(x, null, context.roundingCode, undefined, context);
}
