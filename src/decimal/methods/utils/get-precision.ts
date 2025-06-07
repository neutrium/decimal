import { Decimal } from "../../Decimal.js";

export function getPrecision(digits : number[]) : number
{
	let w = digits.length - 1,
	len = w * Decimal.params.LOG_BASE + 1;

	w = digits[w];

	// If non-zero...
	if (w)
	{
		// Subtract the number of trailing zeros of the last word.
		for (; w % 10 == 0; w /= 10) len--;

		// Add the number of digits of the first word.
		for (w = digits[0]; w >= 10; w /= 10) len++;
	}

	return len;
}