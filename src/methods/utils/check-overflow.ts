import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { getMutableDecimalState } from '../../DecimalState.js';

export function checkOverflow(x: Decimal, context: CalculationContext) : Decimal
{
	if (context.external)
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
