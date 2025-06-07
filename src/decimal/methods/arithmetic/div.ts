import { Decimal } from "../../Decimal.js";
import { finalise } from "../utils/finalise.js";
//
// Return a new Decimal whose value is the value of `x` divided by `y`, rounded to
// `precision` significant digits using rounding mode `rounding`.
//
export function div(x: Decimal, y : string | number | Decimal) : Decimal
{
	return divide(x, new Decimal(y));
}

//
// Return a new Decimal whose value is the integer part of dividing the value of x
// by the value of `y`, rounded to `precision` significant digits using rounding mode `rounding`.
//
export function divToInt(x: Decimal, y : string | number | Decimal) : Decimal
{
	const config = Decimal.config;

	return finalise(divide(x, new Decimal(y), 0, 1, 1), config.precision, config.rounding);
}

//
// Perform division in the specified base.
//
export function divide(x : Decimal, y : Decimal, pr? : number, rm? : number, dp? : number, base? : number) : Decimal
{
	const config = Decimal.config;
	// Set defaults where optional parameters not provided

	// Assumes non-zero x and k, and hence non-zero result.
	function multiplyInteger(x : number[], k : number, base : number) : number[]
	{
		let temp,
			carry = 0,
			i = x.length;

		for (x = x.slice(); i--;)
		{
			temp = x[i] * k + carry;
			x[i] = temp % base | 0;
			carry = temp / base | 0;
		}

		if (carry) x.unshift(carry);

		return x;
	}

	function compare(a : number[], b : number[], aL : number, bL : number) : number
	{
		let i, r;

		if (aL != bL)
		{
			r = aL > bL ? 1 : -1;
		}
		else
		{
			for (i = r = 0; i < aL; i++)
			{
				if (a[i] != b[i])
				{
					r = a[i] > b[i] ? 1 : -1;
					break;
				}
			}
		}

		return r;
	}

	function subtract(a : number[], b : number[], aL : number, base : number) : void
	{
		let i = 0;

		// Subtract b from a.
		for (; aL--;)
		{
			a[aL] -= i;
			i = a[aL] < b[aL] ? 1 : 0;
			a[aL] = i * base + a[aL] - b[aL];
		}

		// Remove leading zeros.
		for (; !a[0] && a.length > 1;) a.shift();
	}

	let cmp, e, i, k, logBase, more, prod, prodL, q, qd, rem, remL, rem0, sd, t, xi, xL, yd0,
		yL, yz,
		sign = x.s == y.s ? 1 : -1,
		xd = x.d,
		yd = y.d;

	// Either NaN, Infinity or 0?
	if (!xd || !xd[0] || !yd || !yd[0])
	{
		return new Decimal(// Return NaN if either NaN, or both Infinity or 0.
		!x.s || !y.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN :

		// Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
		xd && xd[0] == 0 || !yd ? sign * 0 : sign / 0);
	}

	if (base)
	{
		logBase = 1;
		e = x.e - y.e;
	}
	else
	{
		base = Decimal.params.BASE;
		logBase = Decimal.params.LOG_BASE;
		e = Math.floor(x.e / logBase) - Math.floor(y.e / logBase);
	}

	yL = yd.length;
	xL = xd.length;
	q = new Decimal(sign);
	qd = q.d = [];

	// Result exponent may be one less than e.
	// The digit array of a Decimal from toStringBinary may have trailing zeros.
	for (i = 0; yd[i] == (xd[i] || 0); i++);

	if (yd[i] > (xd[i] || 0)) e--;

	if (pr == null)
	{
		sd = pr = config.precision;
		rm = config.rounding;
	}
	else if (dp)
	{
		sd = pr + (x.e - y.e) + 1;
	}
	else
	{
		sd = pr;
	}

	if (sd < 0)
	{
		qd.push(1);
		more = true;
	}
	else
	{
		// Convert precision in number of base 10 digits to base 1e7 digits.
		sd = sd / logBase + 2 | 0;
		i = 0;

		// divisor < 1e7
		if (yL == 1)
		{
			let yd0 = yd[0];
			k = 0;
			sd++;

			// k is the carry.
			for (; (i < xL || k) && sd--; i++)
			{
				t = k * base + (xd[i] || 0);
				qd[i] = t / yd0 | 0;
				k = t % yd0 | 0;
			}

			more = k || i < xL;

		// divisor >= 1e7
		}
		else
		{
			// Normalise xd and yd so highest order digit of yd is >= base/2
			k = base / (yd[0] + 1) | 0;

			if (k > 1)
			{
				yd = multiplyInteger(yd, k, base);
				xd = multiplyInteger(xd, k, base);
				yL = yd.length;
				xL = xd.length;
			}

			xi = yL;
			rem = xd.slice(0, yL);
			remL = rem.length;

			// Add zeros to make remainder as long as divisor.
			for (; remL < yL;) rem[remL++] = 0;

			yz = yd.slice();
			yz.unshift(0);
			yd0 = yd[0];

			if (yd[1] >= base / 2) ++yd0;

			do
			{
				k = 0;

				// Compare divisor and remainder.
				cmp = compare(yd, rem, yL, remL);

				// If divisor < remainder.
				if (cmp < 0)
				{
					// Calculate trial digit, k.
					rem0 = rem[0];
					if (yL != remL) rem0 = rem0 * base + (rem[1] || 0);

					// k will be how many times the divisor goes into the current remainder.
					k = rem0 / yd0 | 0;

					//  Algorithm:
					//  1. product = divisor * trial digit (k)
					//  2. if product > remainder: product -= divisor, k--
					//  3. remainder -= product
					//  4. if product was < remainder at 2:
					//    5. compare new remainder and divisor
					//    6. If remainder > divisor: remainder -= divisor, k++

					if (k > 1)
					{
						if (k >= base) k = base - 1;

						// product = divisor * trial digit.
						prod = multiplyInteger(yd, k, base);
						prodL = prod.length;
						remL = rem.length;

						// Compare product and remainder.
						cmp = compare(prod, rem, prodL, remL);

						// product > remainder.
						if (cmp == 1)
						{
							k--;

							// Subtract divisor from product.
							subtract(prod, yL < prodL ? yz : yd, prodL, base);
						}
					}
					else
					{
						// cmp is -1.
						// If k is 0, there is no need to compare yd and rem again below, so change cmp to 1
						// to avoid it. If k is 1 there is a need to compare yd and rem again below.
						if (k == 0) cmp = k = 1;
						prod = yd.slice();
					}

					prodL = prod.length;
					if (prodL < remL) prod.unshift(0);

					// Subtract product from remainder.
					subtract(rem, prod, remL, base);

					// If product was < previous remainder.
					if (cmp == -1)
					{
						remL = rem.length;

						// Compare divisor and new remainder.
						cmp = compare(yd, rem, yL, remL);

						// If divisor < new remainder, subtract divisor from remainder.
						if (cmp < 1)
						{
							k++;

							// Subtract divisor from remainder.
							subtract(rem, yL < remL ? yz : yd, remL, base);
						}
					}

					remL = rem.length;
				}
				else if (cmp === 0)
				{
					k++;
					rem = [0];
				}    // if cmp === 1, k will be 0

				// Add the next digit, k, to the result array.
				qd[i++] = k;

				// Update the remainder.
				if (cmp && rem[0])
				{
					rem[remL++] = xd[xi] || 0;
				}
				else
				{
					rem = [xd[xi]];
					remL = 1;
				}

			} while ((xi++ < xL || rem[0] !== void 0) && sd--);

			more = rem[0] !== void 0;
		}

		// Leading zero?
		if (!qd[0]) qd.shift();
	}

	// logBase is 1 when divide is being used for base conversion.
	if (logBase == 1)
	{
		q.e = e;
		//inexact = more;
	}
	else
	{
		// To calculate q.e, first get the number of digits of qd[0].
		for (i = 1, k = qd[0]; k >= 10; k /= 10) i++;
		q.e = i + e * logBase - 1;

		q = finalise(q, dp ? pr + q.e + 1 : pr, rm, more);
	}

	return q;
}