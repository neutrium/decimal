import type { Decimal, DecimalValue } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_DOWN, ROUND_UP } from "../../config/RoundingModes.js";
import { divideSignificant } from "../arithmetic/div.js";
import { finalise } from "../utils/finalise.js";
import { checkRoundingDigits } from "../rounding/check-rounding-digits.js"
import { getLn10 } from "./get-ln-10.js";
import { naturalLogarithm } from "./ln.js";
import { digitsToString } from "../utils/digits-to-string.js";
import { compareDecimals } from "../compare/relational-compare.js";
import { getDecimalState } from '../../DecimalState.js';

//
// Return the logarithm of the value of arg to the specified base, rounded to `precision`
// significant digits using rounding mode `rounding`.
//
// If no base is specified, return log[10](arg).
//
// log[base](arg) = ln(arg) / ln(base)
//
// The result will always be correctly rounded if the base of the log is 10, and 'almost always' otherwise:
//
// Depending on the rounding mode, the result may be incorrectly rounded if the first fifteen
// rounding digits are [49]99999999999999 or [50]00000000000000. In that case, the maximum error
// between the result and the correctly rounded result will be one ulp (unit in the last place).
//
// log[-b](a)       = NaN
// log[0](a)        = NaN
// log[1](a)        = NaN
// log[NaN](a)      = NaN
// log[Infinity](a) = NaN
// log[b](0)        = -Infinity
// log[b](-0)       = -Infinity
// log[b](-a)       = NaN
// log[b](1)        = 0
// log[b](Infinity) = Infinity
// log[b](NaN)      = NaN
//
export function log(arg: Decimal, baseN : DecimalValue, context : CalculationContext) : Decimal
{
	let baseBelowOne = false, isBase10, d, denominator, k, inf, num, sd, r,
		base : Decimal,
		pr = context.precision,
		rm = context.roundingCode,
		guard = 5;

	// Default base is 10.
	if (baseN == null)
	{
		base = context.create(10);
		isBase10 = true;
	}
	else
	{
		base = context.createExact(baseN);
		const baseState = getDecimalState(base);
		d = baseState.d;

		// Return NaN if base is negative, or non-finite, or is 0 or 1.
		const baseComparison = compareDecimals(base, context.create(1));

		if (baseState.s < 0 || !d || !d[0] || baseComparison === 0)
		{
			return context.create(NaN);
		}

		baseBelowOne = baseComparison < 0;
		isBase10 = compareDecimals(base, context.create(10)) === 0;
	}

	const argState = getDecimalState(arg);
	d = argState.d;

	// Is arg negative, non-finite, 0 or 1?
	if (argState.s < 0 || !d || !d[0] || compareDecimals(arg, context.create(1)) === 0)
	{
		return context.create(d && !d[0]
			? (baseBelowOne ? 1 : -1) / 0
			: argState.s != 1 ? NaN : d ? 0 : (baseBelowOne ? -1 : 1) / 0);
	}

	// The result will have a non-terminating decimal expansion if base is 10 and arg is not an
	// integer power of 10.
	if (isBase10)
	{
		if (d.length > 1)
		{
			inf = true;
		}
		else
		{
			for (k = d[0]; k % 10 === 0;) k /= 10;
			inf = k !== 1;
		}
	}

	const workingContext = context.withoutLimits();
	sd = pr + guard;
	num = naturalLogarithm(arg, sd, workingContext);
	denominator = isBase10
		? getLn10(sd + 10, workingContext)
		: naturalLogarithm(base, sd, workingContext);

	// The result will have 5 rounding digits.
	r = divideSignificant(num, denominator, workingContext, sd, ROUND_DOWN);

	// If at a rounding boundary, i.e. the result's rounding digits are [49]9999 or [50]0000,
	// calculate 10 further digits.
	//
	// If the result is known to have an infinite decimal expansion, repeat this until it is clear
	// that the result is above or below the boundary. Otherwise, if after calculating the 10
	// further digits, the last 14 are nines, round up and assume the result is exact.
	// Also assume the result is exact if the last 14 are zero.
	//
	// Example of a result that will be incorrectly rounded:
	// log[1048576](4503599627370502) = 2.60000000000000009610279511444746...
	// The above result correctly rounded using ROUND_CEIL to 1 decimal place should be 2.7, but it
	// will be given as 2.6 as there are 15 zeros immediately after the requested decimal place, so
	// the exact result would be assumed to be 2.6, which rounded using ROUND_CEIL to 1 decimal
	// place is still 2.6.
	if (checkRoundingDigits(getDecimalState(r).d!, k = pr, rm))
	{
		do
		{
			sd += 10;
			num = naturalLogarithm(arg, sd, workingContext);
			denominator = isBase10
				? getLn10(sd + 10, workingContext)
				: naturalLogarithm(base, sd, workingContext);
			r = divideSignificant(num, denominator, workingContext, sd, ROUND_DOWN);

			if (!inf)
			{
				// Check for 14 nines from the 2nd rounding digit, as the first may be 4.
				if (+digitsToString(getDecimalState(r).d).slice(k + 1, k + 15) + 1 == 1e14)
				{
					r = finalise(r, pr + 1, ROUND_UP, undefined, workingContext);
				}

				break;
			}

		} while (checkRoundingDigits(getDecimalState(r).d!, k += 10, rm));
	}

	return finalise(r, pr, rm, undefined, context);
}
