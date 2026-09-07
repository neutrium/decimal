import type { KernelDecimal } from '../../KernelDecimal.js';
import type { CalculationContext } from '../../CalculationContext.js';
import type { RoundingCode } from '../../config/RoundingCodes.js';
import { checkOverflow } from './check-overflow.js';
import { getMutableDecimalState } from '../../DecimalState.js';
import { roundCoefficient } from './coefficients/round.js';

/** Round owned result state, then apply public exponent limits. */
export function finalise(
	x : KernelDecimal,
	sd : number | null = null,
	rm : RoundingCode,
	isTruncated : boolean | undefined,
	context : CalculationContext
) : KernelDecimal
{
	const state = getMutableDecimalState(x);
	if (sd != null && state.d)
	{
		state.e = roundCoefficient(state.d, state.e, state.s, sd, rm, isTruncated);
	}
	return checkOverflow(x, context);
}
