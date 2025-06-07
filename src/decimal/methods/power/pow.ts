import { Decimal } from '../../Decimal.js'
import { finalise } from '../utils/finalise.js'
import { naturalExponential } from '../exponential/exponential.js'
import { naturalLogarithm } from '../exponential/ln.js'
import { digitsToString } from "../utils/digits-to-string.js";
import { checkRoundingDigits } from '../rounding/check-rounding-digits.js'
import { truncate } from '../rounding/truncate.js'

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
export function pow(x: Decimal, yy : number | string | Decimal) : Decimal
{
	let e, k, pr, r, rm, sign, yIsInt,
		y = new Decimal(yy),
		yn = +y;

	// Either ±Infinity, NaN or ±0?
	if (!x.d || !y.d || !x.d[0] || !y.d[0])
	{
		return  new Decimal(Math.pow(+x, yn));
	}

	x = new Decimal(x);

	if (x.eq(1)) return x;

	pr = Decimal.precision;
	rm = Decimal.rounding;

	if (y.eq(1))
	{
		return finalise(x, pr, rm);
	}

	e = Math.floor(y.e / Decimal.params.LOG_BASE);
	k = y.d.length - 1;
	yIsInt = e >= k;
	sign = x.s;

	if (!yIsInt)
	{
		if (sign < 0) return new Decimal(NaN);

	// If y is a small integer use the 'exponentiation by squaring' algorithm.
	}
	else if ((k = yn < 0 ? -yn : yn) <= Decimal.params.MAX_SAFE_INTEGER)
	{
		r = intPow(x, k, pr);
		return y.s < 0 ? new Decimal(1).div(r) : finalise(r, pr, rm);
	}

	// Result is negative if x is negative and the last digit of integer y is odd.
	sign = sign < 0 && y.d[Math.max(e, k)] & 1 ? -1 : 1;

	// Estimate result exponent.
	// x^y = 10^e,  where e = y * log10(x)
	// log10(x) = log10(x_significand) + x_exponent
	// log10(x_significand) = ln(x_significand) / ln(10)
	k = Math.pow(+x, yn);
	e = k == 0 || !isFinite(k)
	? Math.floor(yn * (Math.log(+('0.' + digitsToString(x.d))) / Math.LN10 + x.e + 1))
	: new Decimal(k + '').e;

	// Estimate may be incorrect e.g. x: 0.999999999999999999, y: 2.29, e: 0, r.e: -1.

	// Overflow/underflow?
	if (e > Decimal.params.EXP_LIMIT + 1 || e < -Decimal.params.EXP_LIMIT - 1) return new Decimal(e > 0 ? sign / 0 : 0);

	Decimal.external = false;
	Decimal.rounding = x.s = 1;

	// Estimate the extra guard digits needed to ensure five correct rounding digits from
	// naturalLogarithm(x). Example of failure without these extra digits (precision: 10):
	// new Decimal(2.32456).pow('2087987436534566.46411')
	// should be 1.162377823e+764914905173815, but is 1.162355823e+764914905173815
	k = Math.min(12, (e + '').length);

	// r = x^y = exp(y*ln(x))
	r = naturalExponential(y.mul(naturalLogarithm(x, pr + k)), pr);

	// Truncate to the required precision plus five rounding digits.
	r = finalise(r, pr + 5, 1);

	// If the rounding digits are [49]9999 or [50]0000 increase the precision by 10 and recalculate
	// the result.
	if (checkRoundingDigits(r.d, pr, rm))
	{
		e = pr + 10;

		// Truncate to the increased precision plus five rounding digits.
		r = finalise(naturalExponential(y.mul(naturalLogarithm(x, e + k)), e), e + 5, 1);

		// Check for 14 nines from the 2nd rounding digit (the first rounding digit may be 4 or 9).
		if (+digitsToString(r.d).slice(pr + 1, pr + 15) + 1 == 1e14)
		{
			r = finalise(r, pr + 1, 0);
		}
	}

	r.s = sign;

	Decimal.external = true;
	Decimal.rounding = rm;

	return finalise(r, pr, rm);
}

//
// Return a new Decimal whose value is the value of Decimal `x` to the power `n`, where `n` is an
// integer of type number.
//
// Implements 'exponentiation by squaring'. Called by `pow` and `parseOther`.
//
function intPow(x : Decimal, n : number, pr : number) : Decimal
{
	let isTruncated,
		r = new Decimal(1),
		// Max n of 9007199254740991 takes 53 loop iterations.
		// Maximum digits array length; leaves [28, 34] guard digits.
		k = Math.ceil(pr / Decimal.params.LOG_BASE + 4);

	Decimal.external = false;

	for (;;)
	{
		if (n % 2)
		{
			r = r.mul(x);
			if (truncate(r.d!, k))
			{
				isTruncated = true;
			}
		}

		n = Math.floor(n / 2);
		if (n === 0)
		{
			// To ensure correct rounding when r.d is truncated, increment the last word if it is zero.
			n = r.d!.length - 1;
			if (isTruncated && r.d![n] === 0) ++r.d![n];
			break;
		}

		x = x.mul(x);
		truncate(x.d!, k);
	}

	Decimal.external = true;

	return r;
}