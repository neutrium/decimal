import type { Decimal } from "../../Decimal.js";
import { finiteToString } from "./finite-to-string.js";
import { getDecimalState } from '../../DecimalState.js';

//
// Return the value of this Decimal converted to a number primitive.
// Zero keeps its sign.
//
export function toNumber(x: Decimal) : number
{
	const { d, e, s } = getDecimalState(x);
	// Avoid serializing coefficients when the exponent alone determines the binary64 result.
	if (d)
	{
		if (!d[0]) return s < 0 ? -0 : 0;
		if (e > 308) return s < 0 ? -Infinity : Infinity;
		if (e < -324) return s < 0 ? -0 : 0;
	}

	const value = finiteToString(x, true);

	return Number(s < 0 ? '-' + value : value);
}
