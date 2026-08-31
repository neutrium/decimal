/** Return a new digit array with one word added at its most-significant end. */
export function prependDigit(digits: readonly number[], digit: number): number[]
{
	const length = digits.length;
	const result = new Array<number>(length + 1);

	result[0] = digit;
	for (let i = 0; i < length; i++) result[i + 1] = digits[i]!;

	return result;
}

/**
 * Remove leading zero words with a single bulk compaction.
 * Returns the number of removed words so callers can adjust their exponent.
 */
export function removeLeadingZeros(digits: number[], keepOne = true): number
{
	const limit = keepOne ? digits.length - 1 : digits.length;
	let first = 0;

	while (first < limit && digits[first] === 0) first++;

	if (first)
	{
		digits.copyWithin(0, first);
		digits.length -= first;
	}

	return first;
}
