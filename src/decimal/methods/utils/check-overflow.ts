import { Decimal } from "../../Decimal.js";

export function checkOverflow(x: Decimal) : Decimal
{
	if (Decimal.external)
	{
		const config = Decimal.config;

		// Overflow?
		if (x.e > config.maxE)	// Should be the config
		{
			// Infinity.
			x.d = null;
			x.e = NaN;
		}
		else if (x.e < config.minE)    // Underflow?
		{
			// Zero.
			x.e = 0;
			x.d = [0];
		}
	}

	return x;
}