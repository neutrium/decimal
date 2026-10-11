import { DecimalConstants } from '../../../InternalConstants.js';

/** Convert base-1e7 coefficient words to an exact BigInt in one native parse. */
export function digitsToBigInt(digits : readonly number[]) : bigint
{
	const chunks = new Array<string>(digits.length);
	chunks[0] = String(digits[0]!);

	for (let i = 1; i < digits.length; i++)
	{
		chunks[i] = String(digits[i]!).padStart(DecimalConstants.LOG_BASE, '0');
	}

	return BigInt(chunks.join(''));
}

/** Convert the first length base-1e7 coefficient words to an exact BigInt. */
export function digitsPrefixToBigInt(digits : readonly number[], length : number) : bigint
{
	const base = BigInt(DecimalConstants.BASE);
	let coefficient = 0n;

	for (let i = 0; i < length; i++)
	{
		coefficient = coefficient * base + BigInt(digits[i]!);
	}

	return coefficient;
}

/** Convert a non-negative BigInt to base-1e7 coefficient words and its decimal digit count. */
export function bigIntToDigits(value : bigint) : readonly [number[], number]
{
	const text = value.toString();
	const digits : number[] = [];
	let end = text.length % DecimalConstants.LOG_BASE || DecimalConstants.LOG_BASE;
	digits.push(Number(text.slice(0, end)));

	for (; end < text.length; end += DecimalConstants.LOG_BASE)
	{
		digits.push(Number(text.slice(end, end + DecimalConstants.LOG_BASE)));
	}

	return [digits, text.length];
}
