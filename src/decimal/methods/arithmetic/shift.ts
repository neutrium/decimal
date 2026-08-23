import { Decimal } from '../../Decimal.js';
import { errors } from '../../errors.js';
import { checkOverflow } from '../utils/check-overflow.js';

// Return a new Decimal with its decimal point shifted by `places` positions.
export function shift(x : Decimal, places : number) : Decimal
{
	if (!Number.isSafeInteger(places))
	{
		throw Error(errors.INVAILD_ARG_ERROR_STR + places);
	}

	const result = new Decimal(x);

	// Zero, Infinity, and NaN are unchanged by a decimal-point shift.
	if (result.d && result.d[0])
	{
		result.e += places;
		checkOverflow(result);
	}

	return result;
}
