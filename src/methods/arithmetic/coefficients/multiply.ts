import { digitsToBigInt } from '../../utils/coefficients/to-bigint.js';
import { DecimalConstants } from '../../../InternalConstants.js';

export const BIGINT_MULTIPLICATION_WORDS = 256;

/**
 * Multiply finite, nonzero base-1e7 coefficients. Inputs are never mutated.
 * The newly allocated result has exactly a.length + b.length words, including
 * a possible leading zero; the caller handles exponent adjustment and rounding.
 */
export function multiplyCoefficients(a : readonly number[], b : readonly number[]) : number[]
{
	return a.length + b.length >= BIGINT_MULTIPLICATION_WORDS
		? multiplyDigitsWithBigInt(a, b)
		: a === b ? squareDigits(a) : multiplyDigits(a, b);
}

/** Use the runtime's sub-quadratic BigInt kernel once it is faster than word convolution. */
function multiplyDigitsWithBigInt(a : readonly number[], b : readonly number[]) : number[]
{
	const x = digitsToBigInt(a);
	const y = a === b ? x : digitsToBigInt(b);

	const coefficient = (x * y).toString();
	const expectedLength = a.length + b.length;
	const result = new Array<number>(expectedLength);
	const actualLength = Math.ceil(coefficient.length / DecimalConstants.LOG_BASE);
	const offset = expectedLength - actualLength;
	let sourceIndex = coefficient.length % DecimalConstants.LOG_BASE || DecimalConstants.LOG_BASE;
	let targetIndex = offset;

	if (offset)
	{
		result[0] = 0;
	}

	result[targetIndex++] = Number(coefficient.slice(0, sourceIndex));

	while (sourceIndex < coefficient.length)
	{
		const end = sourceIndex + DecimalConstants.LOG_BASE;
		result[targetIndex++] = Number(coefficient.slice(sourceIndex, end));
		sourceIndex = end;
	}

	return result;
}

function multiplyDigits(a : readonly number[], b : readonly number[]) : number[]
{
	if (a.length < b.length)
	{
		[a, b] = [b, a];
	}

	const base = DecimalConstants.BASE;
	const result : number[] = [];

	for (let i = a.length + b.length; i--;)
	{
		result.push(0);
	}

	for (let i = b.length; i--;)
	{
		let carry = 0;
		let k = a.length + i;

		for (; k > i; k--)
		{
			const product = result[k]! + b[i]! * a[k - i - 1]! + carry;
			// product < base² < 2^53: derive the exact remainder from the quotient.
			carry = product / base | 0;
			result[k] = product - carry * base;
		}

		result[k] = carry;
	}
	return result;
}

/** Square using each off-diagonal product once, doubling it for its symmetric partner. */
function squareDigits(digits : readonly number[]) : number[]
{
	const base = DecimalConstants.BASE;
	const result : number[] = [];
	for (let i = digits.length * 2; i--;) result.push(0);

	for (let i = digits.length; i--;)
	{
		const word = digits[i]!;
		let k = i * 2 + 1;
		let product = result[k]! + word * word;
		let carry = product / base | 0;
		result[k] = product - carry * base;

		for (let j = i; j--;)
		{
			k--;
			product = result[k]! + 2 * word * digits[j]! + carry;
			carry = product / base | 0;
			result[k] = product - carry * base;
		}

		// This carry slot may temporarily exceed base; the next row normalizes it.
		// Even doubled products plus carry remain below 2 * base² + 2 * base < 2^53.
		result[i] = carry;
	}
	return result;
}
