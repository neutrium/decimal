import type { CalculationContext } from "../../CalculationContext.js";
import { getMutableDecimalState, type InternalDecimal } from '../../DecimalState.js';

/** @internal */
export function checkOverflow<T extends InternalDecimal>(x: T, context: CalculationContext) : T
{
	if ((context.boundary === 'public'))
	{
		const config = context.config;
		const state = getMutableDecimalState(x);

		if (state.e > config.maxE)			// Overflow
		{
			// Infinity.
			state.d = null;
			state.e = NaN;
		}
		else if (state.e < config.minE)		// Underflow?
		{
			// Zero.
			state.e = 0;
			state.d = [0];
		}
	}

	return x;
}
