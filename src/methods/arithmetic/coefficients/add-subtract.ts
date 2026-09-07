import { DecimalConstants } from '../../../InternalConstants.js';
import { prependDigit, removeLeadingZeros } from '../../utils/digit-array.js';
import { getBase10Exponent } from '../../utils/get-base-10-exponent.js';

/**
 * Add canonical finite, nonzero unsigned coefficients without mutating inputs.
 * Exponents are base-10 leading-digit exponents. Precision limits exponent-gap
 * alignment (with guard words); this is not unlimited exact arithmetic for huge gaps.
 * Returned arrays are newly owned; signs and final rounding belong to the caller.
 */
export function addMagnitudes(
	xd: readonly number[],
	xExponent: number,
	yd: readonly number[],
	yExponent: number,
	precision: number
): { digits: number[]; exponent: number }
{
	const { BASE, LOG_BASE } = DecimalConstants;
	const xe = Math.floor(xExponent / LOG_BASE);
	const ye = Math.floor(yExponent / LOG_BASE);
	const leading = xe >= ye ? xd : yd;
	const trailing = xe >= ye ? yd : xd;
	const gap = Math.abs(xe - ye);
	const limit = Math.max(Math.ceil(precision / LOG_BASE), leading.length) + 1;
	const offset = Math.min(gap, limit);
	const trailingLength = gap > limit ? 1 : trailing.length;
	const length = Math.max(leading.length, offset + trailingLength);

	let digits = new Array<number>(length);
	let carry = 0;
	let exponent = Math.max(xe, ye);

	// The exponent gap is a logical offset, never a padded copy of either input.
	for (let i = length - 1; i >= 0; i--)
	{
		const j = i - offset;
		const sum = (leading[i] || 0) + (j >= 0 && j < trailingLength ? trailing[j]! : 0) + carry;
		carry = sum >= BASE ? 1 : 0;
		digits[i] = sum - carry * BASE;
	}

	if (carry)
	{
		digits = prependDigit(digits, carry);
		exponent++;
	}

	while (digits[digits.length - 1] === 0)
	{
		digits.pop();
	}

	return { digits, exponent: getBase10Exponent(digits, exponent) };
}

/** Subtract a strictly smaller non-zero magnitude from a larger one. */
export function subtractMagnitudes(
	leading: readonly number[],
	largerExponent: number,
	trailing: readonly number[],
	smallerExponent: number,
	precision: number
): { digits: number[]; exponent: number }
{
	const { BASE, LOG_BASE } = DecimalConstants;
	let exponent = Math.floor(largerExponent / LOG_BASE);
	const gap = exponent - Math.floor(smallerExponent / LOG_BASE);
	const limit = Math.max(Math.ceil(precision / LOG_BASE), leading.length) + 2;
	const offset = Math.min(gap, limit);
	const trailingLength = gap > limit ? 1 : trailing.length;
	const length = Math.max(leading.length, offset + trailingLength);
	const digits = new Array<number>(length);
	let borrow = 0;

	for (let i = length - 1; i >= 0; i--)
	{
		const j = i - offset;
		const difference = (leading[i] || 0) - (j >= 0 && j < trailingLength ? trailing[j]! : 0) - borrow;
		borrow = difference < 0 ? 1 : 0;
		digits[i] = difference + borrow * BASE;
	}

	while (digits[digits.length - 1] === 0)
	{
		digits.pop();
	}

	exponent -= removeLeadingZeros(digits, false);
	return { digits, exponent: getBase10Exponent(digits, exponent) };
}

/** Copy a magnitude prefix and optionally increment its last retained word. */
export function magnitudePrefix(
	source : readonly number[],
	exponent : number,
	length : number,
	increment : boolean
) : { digits: number[]; exponent: number }
{
	let digits = source.slice(0, length);
	let wordExponent = Math.floor(exponent / DecimalConstants.LOG_BASE);

	if (increment)
	{
		let index = digits.length - 1;

		for (; index >= 0; index--)
		{
			const next = digits[index]! + 1;

			if (next < DecimalConstants.BASE)
			{
				digits[index] = next;
				break;
			}

			digits[index] = 0;
		}

		if (index < 0)
		{
			digits = [1];
			wordExponent++;
		}
		else
		{
			while (digits[digits.length - 1] === 0) digits.pop();
		}
	}

	return { digits, exponent: increment ? getBase10Exponent(digits, wordExponent) : exponent };
}
