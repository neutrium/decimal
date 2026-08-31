import type { Decimal } from '../../Decimal.js';
import type { CalculationContext } from '../../CalculationContext.js';
import { DecimalConstants } from '../../InternalConstants.js';
import { invalidArgumentError } from '../../errors.js';
import { checkOverflow } from '../utils/check-overflow.js';
import { prependDigit } from '../utils/digit-array.js';
import { getMutableDecimalState } from '../../DecimalState.js';

// Return a new Decimal with its decimal point shifted by `places` positions.
export function shift(x : Decimal, places : number, context : CalculationContext) : Decimal
{
	if (!Number.isSafeInteger(places))
	{
		throw invalidArgumentError(places);
	}

	const result = context.createExact(x);
	const state = getMutableDecimalState(result);

	// Zero, Infinity, and NaN are unchanged by a decimal-point shift.
	if (state.d && state.d[0])
	{
		state.e += places;
		checkOverflow(result, context);

		const digits = state.d;
		if (!digits || !digits[0])
		{
			return result;
		}

		// Arithmetic groups digits into base-10^7 words aligned to the decimal exponent.
		// Whole-word shifts only change e; other shifts must realign the coefficient too.
		// Use the positive remainder for negative shifts, so at most six digits move.
		const { BASE, LOG_BASE } = DecimalConstants;
		const remainder = (places % LOG_BASE + LOG_BASE) % LOG_BASE;

		if (remainder)
		{
			const multiplier = 10 ** remainder;
			let carry = 0;

			for (let i = digits.length; i--;)
			{
				// All intermediates are integers below BASE * multiplier < 2^53.
				const product = digits[i]! * multiplier + carry;
				carry = Math.floor(product / BASE);
				digits[i] = product - carry * BASE;
			}

			const aligned = carry ? prependDigit(digits, carry) : digits;

			// Realignment can leave a zero word at the least-significant end.
			while (aligned[aligned.length - 1] === 0)
			{
				aligned.pop();
			}

			state.d = aligned;
		}
	}

	return result;
}
