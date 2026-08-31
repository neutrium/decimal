import type { Decimal } from "../../Decimal.js";
import { invalidArgumentError } from "../../errors.js";
import { getPrecision } from "./get-precision.js";
import { getDecimalState } from '../../DecimalState.js';

//
// Return the number of significant digits of the value of this Decimal.
// [z] {boolean} Whether to count integer-part trailing zeros.
//
export function precision(x: Decimal, z ?: boolean) : number
{
	const { d, e } = getDecimalState(x);
	let k;

	if (z !== void 0 && typeof z !== 'boolean')
	{
		throw invalidArgumentError(z);
	}

	if (d)
	{
		k = getPrecision(d);
		if (z && e + 1 > k) k = e + 1;
	}
	else
	{
		k = NaN;
	}

	return k;
}
