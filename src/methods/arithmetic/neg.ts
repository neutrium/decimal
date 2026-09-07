import type { KernelDecimal } from "../../KernelDecimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { finalise } from "../utils/finalise.js";
import { getMutableDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the value of `x` negated, i.e. as if multiplied by -1
//
export function neg(xx: KernelDecimal, context: CalculationContext) : KernelDecimal
{
	const x = context.createExact(xx);
	const state = getMutableDecimalState(x);
	state.s = -state.s;

	return finalise(x, null, context.roundingCode, undefined, context);
}
