import { Decimal } from "../../Decimal.js";

//
// Check 5 rounding digits if `repeating` is null, 4 otherwise.
// `repeating == null` if caller is `log` or `pow`,
// `repeating != null` if caller is `naturalLogarithm` or `naturalExponential`.
//
export function checkRoundingDigits(d : number[], i : number, rm : number, repeating ?: number)
{
	let di, k, r, rd,
		LOG_BASE = Decimal.params.LOG_BASE;

	// Get the length of the first word of the array d.
	for (k = d[0]; k >= 10; k /= 10) --i;

	// Is the rounding digit in the first word of d?
	if (--i < 0)
	{
		i += LOG_BASE;
		di = 0;
	}
	else
	{
		di = Math.ceil((i + 1) / LOG_BASE);
		i %= LOG_BASE;
	}

	// i is the index (0 - 6) of the rounding digit.
	// E.g. if within the word 3487563 the first rounding digit is 5,
	// then i = 4, k = 1000, rd = 3487563 % 1000 = 563
	k = Math.pow(10, LOG_BASE - i);
	rd = d[di] % k | 0;

	if (repeating == null)
	{
		if (i < 3)
		{
			if (i == 0) rd = rd / 100 | 0;
			else if (i == 1) rd = rd / 10 | 0;
			r = rm < 4 && rd == 99999 || rm > 3 && rd == 49999 || rd == 50000 || rd == 0;
		}
		else
		{
			r = (rm < 4 && rd + 1 == k || rm > 3 && rd + 1 == k / 2) &&
			(d[di + 1] / k / 100 | 0) == Math.pow(10, i - 2) - 1 ||
			(rd == k / 2 || rd == 0) && (d[di + 1] / k / 100 | 0) == 0;
		}
	}
	else
	{
		if (i < 4)
		{
			if (i == 0) rd = rd / 1000 | 0;
			else if (i == 1) rd = rd / 100 | 0;
			else if (i == 2) rd = rd / 10 | 0;
			r = (repeating || rm < 4) && rd == 9999 || !repeating && rm > 3 && rd == 4999;
		}
		else
		{
			r = ((repeating || rm < 4) && rd + 1 == k ||
			(!repeating && rm > 3) && rd + 1 == k / 2) &&
			(d[di + 1] / k / 1000 | 0) == Math.pow(10, i - 3) - 1;
		}
	}

	return r;
}