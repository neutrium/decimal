import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_DOWN } from "../../config/RoundingModes.js";
import { divideSignificant } from '../arithmetic/div.js'
import { finalise } from "../utils/finalise.js";
import { digitsToString } from "../utils/digits-to-string.js";
import { equalDigitPrefixes } from '../utils/equal-digit-prefixes.js';
import { checkRoundingDigits } from "../rounding/check-rounding-digits.js"
import { getLn10 } from "./get-ln-10.js";
import { add, sub } from '../arithmetic/add-subtract.js';
import { mul } from "../arithmetic/mul.js";
import { getDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the natural logarithm of `x` rounded to `sd` significant digits.
//
//  ln(-n)        = NaN
//  ln(0)         = -Infinity
//  ln(-0)        = -Infinity
//  ln(1)         = 0
//  ln(Infinity)  = Infinity
//  ln(-Infinity) = NaN
//  ln(NaN)       = NaN
//
//  ln(n) (n != 1) is non-terminating.
//
export function naturalLogarithm(y : Decimal, sd : number | undefined, context : CalculationContext) : Decimal
{
	const yState = getDecimalState(y);
	let c, c0, denominator, e, numerator, rep, sum, t, wpr, x1, x2,
		n = 1,
		guard = 10,
		x = y,
		xd = yState.d,
		rm = context.roundingCode,
		pr = context.precision;

	// Is x negative or Infinity, NaN, 0 or 1?
	if (yState.s < 0 || !xd || !xd[0] || !yState.e && xd[0] == 1 && xd.length == 1)
	{
		return context.create(xd && !xd[0] ? -1 / 0 : yState.s != 1 ? NaN : xd ? 0 : x);
	}

	if (sd == null)
	{
		wpr = pr;
	}
	else
	{
		wpr = sd;
	}

	wpr += guard;
	let workingContext = context.with({ external: false, precision: wpr });

	c = digitsToString(xd);
	c0 = c.charAt(0);

	if (Math.abs(e = yState.e) < 1.5e15)
	{
		// Argument reduction.
		// The series converges faster the closer the argument is to 1, so using
		// ln(a^b) = b * ln(a),   ln(a) = ln(a^b) / b
		// multiply the argument by itself until the leading digits of the significand are 7, 8, 9,
		// 10, 11, 12 or 13, recording the number of multiplications so the sum of the series can
		// later be divided by this number, then separate out the power of 10 using
		// ln(a*10^b) = ln(a) + b*ln(10).

		// max n is 6 (gives 0.7 - 1.3)
		while (+c0 < 7 && +c0 != 1 || +c0 == 1 && +c.charAt(1) > 3)
		{
			x = mul(x, y, workingContext);
			c = digitsToString(getDecimalState(x).d);
			c0 = c.charAt(0);
			n++;
		}

		e = getDecimalState(x).e;

		if (+c0 > 1)
		{
			x = workingContext.create('0.' + c);
			e++;
		}
		else
		{
			x = workingContext.create(c0 + '.' + c.slice(1));
		}
	}
	else
	{
		// The argument reduction method above may result in overflow if the argument y is a massive
		// number with exponent >= 1500000000000000 (9e15 / 6 = 1.5e15), so instead recall this
		// function using ln(x*10^e) = ln(x) + e*ln(10).
		t = mul(getLn10(wpr + 2, workingContext), e + '', workingContext);
		x = add(naturalLogarithm(workingContext.create(c0 + '.' + c.slice(1)), wpr - guard, workingContext), t, workingContext);

		return sd == null
			? finalise(x, pr, rm, true, context)
			: x;
	}

	// x1 is x reduced to a value near 1.
	x1 = x;

	// Taylor series.
	// ln(y) = ln((1 + x)/(1 - x)) = 2(x + x^3/3 + x^5/5 + x^7/7 + ...)
	// where x = (y - 1)/(y + 1)    (|x| < 1)
	const ratioNumerator = sub(x, 1, workingContext);
	const ratioDenominator = add(x, 1, workingContext);
	sum = numerator = x = divideSignificant(ratioNumerator, ratioDenominator, workingContext, wpr, ROUND_DOWN);
	x2 = finalise(mul(x, x, workingContext), wpr, ROUND_DOWN, undefined, workingContext);
	denominator = 3;

	for (;;)
	{
		numerator = finalise(mul(numerator, x2, workingContext), wpr, ROUND_DOWN, undefined, workingContext);
		const term = divideSignificant(
			numerator,
			workingContext.create(denominator),
			workingContext,
			wpr,
			ROUND_DOWN
		);
		t = add(sum, term, workingContext);

		if (equalDigitPrefixes(getDecimalState(t).d, getDecimalState(sum).d, wpr))
		{
			sum = mul(sum, 2, workingContext);

			// Reverse the argument reduction. Check that e is not 0 because, besides preventing an
			// unnecessary calculation, -0 + 0 = +0 and to ensure correct rounding -0 needs to stay -0.
			if (e !== 0)
			{
				sum = add(sum, mul(getLn10(wpr + 2, workingContext), e + '', workingContext), workingContext);
			}

			sum = divideSignificant(sum, workingContext.create(n), workingContext, wpr, ROUND_DOWN);


			// For a nearest mode, are the first 4 rounding digits 4999, or for a directed mode
			// (or when the summation has been repeated previously), are they 9999?
			// If so, restart the summation with a higher precision, otherwise
			// e.g. with precision: 12, rounding: 'down'
			// ln(135520028.6126091714265381533) = 18.7246299999 when it should be 18.72463.
			// `wpr - guard` is the index of first rounding digit.
			if (sd == null)
			{
				if (checkRoundingDigits(getDecimalState(sum).d!, wpr - guard, rm, rep))
				{
					wpr += guard;
					workingContext = workingContext.with({ precision: wpr });
					const ratioNumerator = sub(x1, 1, workingContext);
					const ratioDenominator = add(x1, 1, workingContext);
					t = numerator = x = divideSignificant(ratioNumerator, ratioDenominator, workingContext, wpr, ROUND_DOWN);
					x2 = finalise(mul(x, x, workingContext), wpr, ROUND_DOWN, undefined, workingContext);
					denominator = rep = 1;
				}
				else
				{
					return finalise(sum, pr, rm, true, context);
				}
			}
			else
			{
				return sum;
			}
		}

		sum = t;
		denominator += 2;
	}
}
