import type { DecimalRationalTerm } from '../../DecimalRationalTerm.js';
import type { KernelDecimal } from '../../KernelDecimal.js';
import { getDecimalState } from '../../DecimalState.js';
import { DecimalConstants } from '../../InternalConstants.js';
import { invalidArgumentError } from '../../errors.js';
import { digitsToBigInt } from '../utils/coefficients/to-bigint.js';

/** @internal Read the exact stored value without a calculation or formatting context. */
export function toRationalTerm(value : KernelDecimal) : DecimalRationalTerm
{
	const { d, e, s } = getDecimalState(value);

	if (!d)
	{
		throw invalidArgumentError('non-finite Decimal', 'rational term source');
	}

	if (!d[0])
	{
		return Object.freeze({ numerator: 0n, denominator: 1n, exponent: 0n });
	}

	// Storage has no trailing zero words, so only the last word can contribute
	// trailing decimal zeros. Remove them with one BigInt division, at most six digits.
	let last = d[d.length - 1]!, zeros = 0;

	while (last % 10 === 0)
	{
		last /= 10; zeros++;
	}

	const coefficient = digitsToBigInt(d) / 10n ** BigInt(zeros);
	const exponent = BigInt(DecimalConstants.LOG_BASE)
		* (BigInt(Math.floor(e / DecimalConstants.LOG_BASE)) - BigInt(d.length - 1)) + BigInt(zeros);

	return Object.freeze({ numerator: s < 0 ? -coefficient : coefficient, denominator: 1n, exponent });
}
