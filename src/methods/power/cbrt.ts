import type { Decimal } from '../../Decimal.js';
import type { CalculationContext } from '../../CalculationContext.js';
import { ROUND_DOWN, ROUND_UP } from '../../config/RoundingModes.js';
import { finalise } from '../utils/finalise.js';
import { divideSignificant } from '../arithmetic/div.js';
import { digitsToString } from "../utils/digits-to-string.js";
import { equalDigitPrefixes } from '../utils/equal-digit-prefixes.js';
import { add } from "../arithmetic/add-subtract.js";
import { mul } from "../arithmetic/mul.js";
import { isFinite, isZero } from "../compare/identity-compare.js";
import { compareDecimals } from "../compare/relational-compare.js";
import { toNumber } from "../to/to-number.js";
import { rootArgument } from './root-argument.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the cube root of the value of `x`, rounded to
// `precision` significant digits using rounding mode `rounding`.
//
//  cbrt(0)  =  0
//  cbrt(-0) = -0
//  cbrt(1)  =  1
//  cbrt(-1) = -1
//  cbrt(N)  =  N
//  cbrt(-I) = -I
//  cbrt(I)  =  I
//
// Math.cbrt(x) = (x < 0 ? -Math.pow(-x, 1/3) : Math.pow(x, 1/3))
//
export function cbrt(x: Decimal, context: CalculationContext) : Decimal
{
	const xState = getDecimalState(x);
	var e, m, n, r, rep, s, sd, t, t3, t3plusx;

	if (!isFinite(x) || isZero(x))
	{
		return context.create(x);
	}

	const precision = context.precision;
	let workingContext = context.withoutLimits();

	// Initial estimate.
	s = xState.s * Math.pow(xState.s * toNumber(x), 1 / 3);

	// Math.cbrt underflow/overflow?
	// Pass x to Math.pow as integer, then adjust the exponent of the result.
	if (!s || Math.abs(s) == 1 / 0)
	{
		n = digitsToString(xState.d);
		e = xState.e;

		// Adjust n exponent so it is a multiple of 3 away from x exponent.
		if (s = (e - n.length + 1) % 3) n += (s == 1 || s == -2 ? '0' : '00');
		s = Math.pow(Number(n), 1 / 3);

		// Rarely, e may be one less than the result exponent value.
		e = Math.floor((e + 1) / 3) - Number((e % 3) == (e < 0 ? -1 : 2));

		if (s == 1 / 0)
		{
			n = '5e' + e;
		}
		else
		{
			n = s.toExponential();
			n = n.slice(0, n.indexOf('e') + 1) + e;
		}

		r = workingContext.create(n);
		getMutableDecimalState(r).s = xState.s;
	}
	else
	{
		r = workingContext.create(s.toString());
	}

	const targetPrecision = (e = precision) + 3;
	sd = Math.min(targetPrecision, 32);
	workingContext = workingContext.with({ precision: Math.min(precision, sd + 6) });
	let argument = sd < targetPrecision ? rootArgument(x, sd + 6, workingContext) : x;

	// Halley's method.
	// TODO? Compare Newton's method.
	for (;;)
	{
		t = r;
		const squared = mul(t, t, workingContext);
		t3 = mul(squared, t, workingContext);
		t3plusx = add(t3, argument, workingContext);
		const numeratorFactor = add(t3plusx, argument, workingContext);
		const numerator = mul(numeratorFactor, t, workingContext);
		const denominator = add(t3plusx, t3, workingContext);
		r = divideSignificant(
			numerator,
			denominator,
			workingContext,
			sd + 2,
			ROUND_DOWN
		);

		if (sd < targetPrecision)
		{
			// Halley roughly triples the correct digits; poor fallback estimates stay at
			// the cheaper stage until their leading digits have stabilized.
			const tState = getDecimalState(t);
			const rState = getDecimalState(r);

			if (tState.e === rState.e && equalDigitPrefixes(tState.d, rState.d, Math.floor(sd / 3) - 3))
			{
				sd = Math.min(targetPrecision, sd * 3);
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

			// The 4th rounding digit may be in error by -1 so if the 4 rounding digits are 9999 or 4999
			// , i.e. approaching a rounding boundary, continue the iteration.
			if (n == '9999' || !rep && n == '4999')
			{
				// On the first iteration only, check to see if rounding up gives the exact result as the
				// nines may infinitely repeat.
				if (!rep)
				{
					t = finalise(t, e + 1, ROUND_UP, undefined, workingContext);

					if (compareDecimals(mul(mul(t, t, workingContext), t, workingContext), x) === 0)
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
					r = finalise(r, e + 1, ROUND_DOWN, undefined, workingContext);
					m = compareDecimals(mul(mul(r, r, workingContext), r, workingContext), x) !== 0;
				}

				break;
			}
		}
	}

	return finalise(r, e, context.roundingCode, Boolean(m), context);
}
