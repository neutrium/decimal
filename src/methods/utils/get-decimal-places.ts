import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal } from "../../Decimal.js";
import { getDecimalState } from '../../DecimalState.js';


//
// Return the number of decimal places of the value of Decimal `x`.
//
export function getDecimalPlaces(x: Decimal) : number
{
	const { d, e } = getDecimalState(x);
	let w,
		n = NaN;

	if (d)
	{
		w = d.length - 1;
		n = (w - Math.floor(e / DecimalConstants.LOG_BASE)) * DecimalConstants.LOG_BASE;

		// Subtract the number of trailing zeros of the last word.
		w = d[w];
		if (w) for (; w % 10 == 0; w /= 10) n--;
		if (n < 0) n = 0;
	}

	return n;
}
