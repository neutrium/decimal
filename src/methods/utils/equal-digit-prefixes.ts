import { DecimalConstants } from '../../InternalConstants.js';
import { getPrecision } from './get-precision.js';

/**
 * Compare the significant-digit prefixes produced by digitsToString, without formatting.
 * Coefficients must be normalized: no leading/trailing zero words except the value [0].
 * Trailing decimal zeros are omitted, not implicitly padded, just as in digitsToString.
 */
export function equalDigitPrefixes(a : readonly number[] | null, b : readonly number[] | null, count : number) : boolean
{
	if (count <= 0 || a === b) return true;
	if (!a || !b) return false;
	const length = Math.min(count, getPrecision(a));
	if (length !== Math.min(count, getPrecision(b))) return false;

	const aWidth = wordWidth(a[0]!);
	const bWidth = wordWidth(b[0]!);

	if (aWidth !== bWidth)
	{
		// Different first-word widths mean the significant digits straddle different words.
		// This is uncommon during convergence, but must not change prefix semantics.
		for (let i = 0; i < length; i++)
		{
			if (digitAt(a, i, aWidth) !== digitAt(b, i, bWidth)) return false;
		}
		return true;
	}

	let remaining = length;
	let width = aWidth;

	for (let i = 0; remaining > 0; i++)
	{
		if (remaining < width)
		{
			const divisor = 10 ** (width - remaining);
			return Math.floor(a[i]! / divisor) === Math.floor(b[i]! / divisor);
		}

		if (a[i] !== b[i])
		{
			return false;
		}

		remaining -= width;
		width = DecimalConstants.LOG_BASE;
	}

	return true;
}

function wordWidth(word : number) : number
{
	let width = 1;
	for (; word >= 10; word /= 10) width++;

	return width;
}

function digitAt(digits : readonly number[], index : number, firstWidth : number) : number
{
	if (index < firstWidth)
	{
		return Math.floor(digits[0]! / 10 ** (firstWidth - index - 1)) % 10;
	}

	index -= firstWidth;
	const word = digits[1 + Math.floor(index / DecimalConstants.LOG_BASE)]!;

	return Math.floor(word / 10 ** (DecimalConstants.LOG_BASE - index % DecimalConstants.LOG_BASE - 1)) % 10;
}
