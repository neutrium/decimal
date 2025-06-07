import { Decimal } from "../../Decimal.js";
import { divide } from "../arithmetic/div.js";
import { finalise } from "../utils/finalise.js";
import { digitsToString } from "../utils/digits-to-string.js";
import { checkRoundingDigits } from "../rounding/check-rounding-digits.js"


//
// Return a new Decimal whose value is the natural exponential of `x` rounded to `sd` significant digits.
// i.e. the base e raised to the power the value of this Decimal, rounded to `precision`
// significant digits using rounding mode `rounding`.
//
// Taylor/Maclaurin series.
//
// exp(x) = x^0/0! + x^1/1! + x^2/2! + x^3/3! + ...
//
// Argument reduction:
//   Repeat x = x / 32, k += 5, until |x| < 0.1
//   exp(x) = exp(x / 2^k)^(2^k)
//
// Previously, the argument was initially reduced by
// exp(x) = exp(r) * 10^k  where r = x - k * ln10, k = floor(x / ln10)
// to first put r in the range [0, ln10], before dividing by 32 until |x| < 0.1, but this was
// found to be slower than just dividing repeatedly by 32 as above.
//
// Max integer argument: exp('20723265836946413') = 6.3e+9000000000000000
// Min integer argument: exp('-20723265836946411') = 1.2e-9000000000000000
// (Math object integer min/max: Math.exp(709) = 8.2e+307, Math.exp(-745) = 5e-324)
//
//  exp(Infinity)  = Infinity
//  exp(-Infinity) = 0
//  exp(NaN)       = NaN
//  exp(±0)        = 1
//
//  exp(x) is non-terminating for any finite, non-zero x.
//
//  The result will always be correctly rounded.
//
export function naturalExponential(x : Decimal, sd? : number) : Decimal
{
	let denominator, guard, j, pow, sum, t, wpr,
		rep = 0,
		i = 0,
		k = 0,
		rm = Decimal.rounding,
		pr = Decimal.precision;

	// 0/NaN/Infinity?
	if (!x.d || !x.d[0] || x.e > 17)
	{
		return new Decimal(x.d ? !x.d[0] ? 1 : x.s < 0 ? 0 : 1 / 0 : x.s ? x.s < 0 ? 0 : x : 0 / 0);
	}

	if (sd == null)
	{
		Decimal.external = false;
		wpr = pr;
	}
	else
	{
		wpr = sd;
	}

	t = new Decimal(0.03125);

	// while abs(x) >= 0.1
	while (x.e > -2)
	{
		// x = x / 2^5
		x = x.mul(t);
		k += 5;
	}
	// Use 2 * log10(2^k) + 5 (empirically derived) to estimate the increase in precision
	// necessary to ensure the first 4 rounding digits are correct.
	guard = Math.log(Math.pow(2, k)) / Math.LN10 * 2 + 5 | 0;

	denominator = pow = sum = new Decimal(1);
	Decimal.precision = wpr += guard;

	for(;;)
	{
		pow = finalise(pow.mul(x), wpr, 1);
		denominator = denominator.mul(++i);
		t = sum.add(divide(pow, denominator, wpr, 1));

		if (digitsToString(t.d).slice(0, wpr) === digitsToString(sum.d).slice(0, wpr))
		{
			j = k;
			while (j--)
			{
				sum = finalise(sum.mul(sum), wpr, 1);
			}

			// Check to see if the first 4 rounding digits are [49]999.
			// If so, repeat the summation with a higher precision, otherwise
			// e.g. with precision: 18, rounding: 1
			// exp(18.404272462595034083567793919843761) = 98372560.1229999999 (should be 98372560.123)
			// `wpr - guard` is the index of first rounding digit.
			if (sd == null)
			{

				if (rep < 3 && checkRoundingDigits(sum.d, wpr - guard, rm, rep))
				{
					Decimal.precision = wpr += 10
					denominator = pow = t = new Decimal(1);
					i = 0;
					rep++;
				}
				else
				{
					Decimal.precision = pr;
					return finalise(sum, pr, rm, Decimal.external = true);
				}
			}
			else
			{
				Decimal.precision = pr;
				return sum;
			}
		}

		sum = t;
	}
}

