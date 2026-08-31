import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_DOWN, ROUND_UP } from "../../config/RoundingModes.js";
import { finalise } from "../utils/finalise.js";
import { divideSignificant } from "../arithmetic/div.js";
import { digitsToString } from "../utils/digits-to-string.js";
import { equalDigitPrefixes } from '../utils/equal-digit-prefixes.js';
import { add } from "../arithmetic/add-subtract.js";
import { mul } from "../arithmetic/mul.js";
import { compareDecimals } from "../compare/relational-compare.js";
import { toNumber } from "../to/to-number.js";
import { rootArgument } from './root-argument.js';
import { getDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the square root of `x`, rounded to `precision`
// significant digits using rounding mode `rounding`.
//
//  sqrt(-n) =  N
//  sqrt(N)  =  N
//  sqrt(-I) =  N
//  sqrt(I)  =  I
//  sqrt(0)  =  0
//  sqrt(-0) = -0
//
export function sqrt(x: Decimal, context: CalculationContext) : Decimal
{
	const xState = getDecimalState(x);
	let m, n, sd, r, rep, t,
		d = xState.d,
		e = xState.e,
		s = xState.s;

	// Negative/NaN/Infinity/zero?
	if (s !== 1 || !d || !d[0])
	{
		return context.create(!s || s < 0 && (!d || d[0]) ? NaN : d ? x : 1 / 0);
	}

	const precision = context.precision;
	let workingContext = context.withoutLimits();

	// Initial estimate.
	s = Math.sqrt(toNumber(x));

	// Math.sqrt underflow/overflow?
	// Pass x to Math.sqrt as integer, then adjust the exponent of the result.
	if (s == 0 || s == 1 / 0)
	{
		n = digitsToString(d);

		if ((n.length + e) % 2 == 0) n += '0';

		s = Math.sqrt(Number(n));
		e = Math.floor((e + 1) / 2) - Number(e < 0 || e % 2 !== 0);

		if (s == 1 / 0)
		{
			n = '1e' + e;
		}
		else
		{
			n = s.toExponential();
			n = n.slice(0, n.indexOf('e') + 1) + e;
		}

		r = workingContext.create(n);
	}
	else
	{
		r = workingContext.create(s.toString());
	}

	const targetPrecision = (e = precision) + 3;
	sd = Math.min(targetPrecision, 32);
	workingContext = workingContext.with({ precision: Math.min(precision, sd + 6) });
	let argument = sd < targetPrecision ? rootArgument(x, sd + 6, workingContext) : x;

	// Newton-Raphson iteration.
	for (;;)
	{
		t = r;
		const quotient = divideSignificant(argument, t, workingContext, sd + 2, ROUND_DOWN);
		const sum = add(t, quotient, workingContext);
		r = mul(sum, 0.5, workingContext);

		if (sd < targetPrecision)
		{
			// Newton roughly doubles the correct digits. Wait for a reliable seed even when
			// the machine-number estimate overflowed, then grow the working precision.
			const tState = getDecimalState(t);
			const rState = getDecimalState(r);
			if (tState.e === rState.e && equalDigitPrefixes(tState.d, rState.d, Math.floor(sd / 2) - 3))
			{
				sd = Math.min(targetPrecision, sd * 2);
				workingContext = workingContext.with({ precision: Math.min(precision, sd + 6) });
				argument = sd < targetPrecision ? rootArgument(x, sd + 6, workingContext) : x;
			}
			continue;
		}

		// Final convergence and rounding always use the exact, untruncated argument.
		const tState = getDecimalState(t);
		const rState = getDecimalState(r);
		if (tState.e === rState.e && equalDigitPrefixes(tState.d, rState.d, sd))
		{
			// Only format after convergence, to retain the existing rounding-boundary checks.
			n = digitsToString(rState.d).slice(sd - 3, sd + 1);

			// The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or
			// 4999, i.e. approaching a rounding boundary, continue the iteration.
			if (n == '9999' || !rep && n == '4999')
			{

				// On the first iteration only, check to see if rounding up gives the exact result as the
				// nines may infinitely repeat.
				if (!rep)
				{
					finalise(t, e + 1, ROUND_UP, undefined, workingContext);

					if (compareDecimals(mul(t, t, workingContext), x) === 0)
					{
						r = t;
						break;
					}
				}

				sd += 4;
				rep = 1;
			}
			else
			{
				// If the rounding digits are null, 0{0,4} or 50{0,3}, check for an exact result.
				// If not, then there are further digits and m will be truthy.
				if (!+n || !+n.slice(1) && n.charAt(0) == '5')
				{
					// Truncate to the first rounding digit.
					finalise(r, e + 1, ROUND_DOWN, undefined, workingContext);
					m = compareDecimals(mul(r, r, workingContext), x) !== 0;
				}

				break;
			}
		}
	}

	return finalise(r, e, context.roundingCode, Boolean(m), context);
}
