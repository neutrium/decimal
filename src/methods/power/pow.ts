import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal, DecimalValue } from '../../Decimal.js';
import type { CalculationContext } from '../../CalculationContext.js';
import { ROUND_DOWN, ROUND_UP } from '../../config/RoundingModes.js';
import { finalise } from '../utils/finalise.js'
import { naturalExponential } from '../exponential/exponential.js'
import { naturalLogarithm } from '../exponential/ln.js'
import { digitsToString } from "../utils/digits-to-string.js";
import { checkRoundingDigits } from '../rounding/check-rounding-digits.js'
import { truncate } from '../rounding/truncate.js'
import { divideSignificant } from '../arithmetic/div.js';
import { mul } from '../arithmetic/mul.js';
import { compareDecimals } from '../compare/relational-compare.js';
import { toNumber } from '../to/to-number.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the value of `x` raised to the power `y`, rounded
// to `precision` significant digits using rounding mode `rounding`.
//
// ECMAScript compliant.
//
//  pow(x, NaN)                           = NaN
//   pow(x, ±0)                            = 1
//   pow(NaN, non-zero)                    = NaN
//   pow(abs(x) > 1, +Infinity)            = +Infinity
//   pow(abs(x) > 1, -Infinity)            = +0
//   pow(abs(x) == 1, ±Infinity)           = NaN
//   pow(abs(x) < 1, +Infinity)            = +0
//   pow(abs(x) < 1, -Infinity)            = +Infinity
//   pow(+Infinity, y > 0)                 = +Infinity
//   pow(+Infinity, y < 0)                 = +0
//   pow(-Infinity, odd integer > 0)       = -Infinity
//   pow(-Infinity, even integer > 0)      = +Infinity
//   pow(-Infinity, odd integer < 0)       = -0
//   pow(-Infinity, even integer < 0)      = +0
//   pow(+0, y > 0)                        = +0
//   pow(+0, y < 0)                        = +Infinity
//   pow(-0, odd integer > 0)              = -0
//   pow(-0, even integer > 0)             = +0
//   pow(-0, odd integer < 0)              = -Infinity
//   pow(-0, even integer < 0)             = +Infinity
//   pow(finite x < 0, finite non-integer) = NaN
//
// For non-integer or very large exponents pow(x, y) is calculated using
//
//   x^y = exp(y*ln(x))
//
// Assuming the first 15 rounding digits are each equally likely to be any digit 0-9, the
// probability of an incorrectly rounded result
// P([49]9{14} | [50]0{14}) = 2 * 0.2 * 10^-14 = 4e-15 = 1/2.5e+14
// i.e. 1 in 250,000,000,000,000
//
// If a result is incorrectly rounded the maximum error will be 1 ulp (unit in last place).
//
export function pow(x: Decimal, yy : DecimalValue, context : CalculationContext) : Decimal
{
	let e, k, pr, r, rm, sign, yIsInt,
		y = context.createExact(yy),
		yn = toNumber(y);
	let xState = getDecimalState(x);
	const yState = getDecimalState(y);

	// Either ±Infinity, NaN or ±0?
	if (!xState.d || !yState.d || !xState.d[0] || !yState.d[0])
	{
		return context.create(Math.pow(toNumber(x), yn));
	}

	x = context.createExact(x);
	xState = getDecimalState(x);

	if (compareDecimals(x, context.create(1)) === 0) return x;

	pr = context.precision;
	rm = context.roundingCode;

	if (compareDecimals(y, context.create(1)) === 0)
	{
		return finalise(x, pr, rm, undefined, context);
	}

	e = Math.floor(yState.e / DecimalConstants.LOG_BASE);
	k = yState.d.length - 1;
	yIsInt = e >= k;
	sign = xState.s;

	if (!yIsInt)
	{
		if (sign < 0) return context.create(NaN);

	// If y is a small integer use the 'exponentiation by squaring' algorithm.
	}
	else if ((k = yn < 0 ? -yn : yn) <= DecimalConstants.MAX_SAFE_INTEGER)
	{
		r = intPow(x, k, pr, context);
		return yState.s < 0
			? divideSignificant(context.create(1), r, context)
			: finalise(r, pr, rm, undefined, context);
	}

	// Result is negative if x is negative and the last digit of integer y is odd.
	sign = sign < 0 && yState.d[Math.max(e, k)]! & 1 ? -1 : 1;

	// Estimate result exponent.
	// x^y = 10^e,  where e = y * log10(x)
	// log10(x) = log10(x_significand) + x_exponent
	// log10(x_significand) = ln(x_significand) / ln(10)
	k = Math.pow(toNumber(x), yn);
	e = k == 0 || !isFinite(k)
	? Math.floor(yn * (Math.log(+('0.' + digitsToString(xState.d))) / Math.LN10 + xState.e + 1))
	: getDecimalState(context.createExact(k + '')).e;

	// Estimate may be incorrect e.g. x: 0.999999999999999999, y: 2.29, e: 0, r.e: -1.

	// Overflow/underflow?
	if (e > DecimalConstants.EXP_LIMIT + 1 || e < -DecimalConstants.EXP_LIMIT - 1)
	{
		return context.create(e > 0 ? sign / 0 : 0);
	}

	let workingContext = context.with({ external: false, roundingCode: ROUND_DOWN });
	// x is already an independent copy; changing its sign cannot affect the caller.
	getMutableDecimalState(x).s = 1;

	// Estimate the extra guard digits needed to ensure five correct rounding digits from
	// naturalLogarithm(x). Example of failure without these extra digits (precision: 10):
	// new Decimal(2.32456).pow('2087987436534566.46411')
	// should be 1.162377823e+764914905173815, but is 1.162355823e+764914905173815
	k = Math.min(12, (e + '').length);

	// r = x^y = exp(y*ln(x))
	const logarithm = naturalLogarithm(x, pr + k, workingContext);
	const exponent = mul(y, logarithm, workingContext);
	r = naturalExponential(exponent, pr, workingContext);

	// Truncate to the required precision plus five rounding digits.
	r = finalise(r, pr + 5, ROUND_DOWN, undefined, workingContext);

	// If the rounding digits are [49]9999 or [50]0000 increase the precision by 10 and recalculate
	// the result.
	if (checkRoundingDigits(getDecimalState(r).d!, pr, rm))
	{
		e = pr + 10;

		// Truncate to the increased precision plus five rounding digits.
		workingContext = workingContext.with({ precision: e });
		const refinedLogarithm = naturalLogarithm(x, e + k, workingContext);
		const refinedExponent = mul(y, refinedLogarithm, workingContext);
		const refinedPower = naturalExponential(refinedExponent, e, workingContext);
		r = finalise(
			refinedPower,
			e + 5,
			ROUND_DOWN,
			undefined,
			workingContext
		);

		// Check for 14 nines from the 2nd rounding digit (the first rounding digit may be 4 or 9).
		if (+digitsToString(getDecimalState(r).d).slice(pr + 1, pr + 15) + 1 == 1e14)
		{
			r = finalise(r, pr + 1, ROUND_UP, undefined, workingContext);
		}
	}

	getMutableDecimalState(r).s = sign;

	return finalise(r, pr, rm, undefined, context);
}

//
// Return a new Decimal whose value is the value of Decimal `x` to the power `n`, where `n` is an
// integer of type number.
//
// Implements 'exponentiation by squaring'. Called by `pow` and `parseOther`.
//
function intPow(x : Decimal, n : number, pr : number, context : CalculationContext) : Decimal
{
	const workingContext = context.withoutLimits();
	let isTruncated,
		r = workingContext.create(1),
		// Max n of 9007199254740991 takes 53 loop iterations.
		// Maximum digits array length; leaves [28, 34] guard digits.
		k = Math.ceil(pr / DecimalConstants.LOG_BASE + 4);

	for (;;)
	{
		if (n % 2)
		{
			r = mul(r, x, workingContext);
			if (truncate(getMutableDecimalState(r).d!, k))
			{
				isTruncated = true;
			}
		}

		n = Math.floor(n / 2);
		if (n === 0)
		{
			// To ensure correct rounding when r.d is truncated, increment the last word if it is zero.
			const rd = getMutableDecimalState(r).d!;
			n = rd.length - 1;
			if (isTruncated && rd[n] === 0) rd[n] = rd[n]! + 1;
			break;
		}

		x = mul(x, x, workingContext);
		truncate(getMutableDecimalState(x).d!, k);
	}

	return r;
}
