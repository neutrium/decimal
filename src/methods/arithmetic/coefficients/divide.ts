import { DecimalConstants } from '../../../InternalConstants.js';
import { prependDigit, removeLeadingZeros } from '../../utils/digit-array.js';

const { BASE: base, LOG_BASE: logBase } = DecimalConstants;

/**
 * Divide finite, nonzero base-1e7 coefficients without mutating either operand.
 * Exponents are base-10 exponents of the leading digits. significantDigits is the
 * caller's requested working precision; guard words and a sticky remainder are
 * returned for subsequent rounding. A negative precision returns a sticky sentinel.
 * The returned digits are newly owned by the caller and have no leading zero words.
 */
export function divideCoefficients(
	xd : readonly number[],
	xExponent : number,
	yd : readonly number[],
	yExponent : number,
	significantDigits : number
) : { digits: number[]; exponent: number; more: boolean }
{
	let cmp, e, i, k, more, prodL, prodStart, remL, rem0, remStart, sd,
		t, xi, xL, yd0, yL;
	let prod: readonly number[];
	let prodScratch: number[] | undefined;
	let qd: number[];
	let rem: (number | undefined)[];

	e = Math.floor(xExponent / logBase) - Math.floor(yExponent / logBase);

	yL = yd.length;
	xL = xd.length;
	qd = [];

	// Result exponent may be one less than e.
	for (i = 0; yd[i] == (xd[i] || 0); i++);

	if (yd[i]! > (xd[i] || 0)) e--;

	sd = significantDigits;

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
			const yd0 = yd[0]!;
			k = 0;
			sd++;

			// k is the carry.
			for (; (i < xL || k) && sd--; i++)
			{
				t = k * base + (xd[i] || 0);
				qd[i] = t / yd0 | 0;
				k = t - qd[i]! * yd0;
			}

			more = k || i < xL;

		// divisor >= 1e7
		}
		else
		{
			// Normalise xd and yd so highest order digit of yd is >= base/2
			k = base / (yd[0]! + 1) | 0;

			if (k > 1)
			{
				yd = multiplyInteger(yd, k);
				xd = multiplyInteger(xd, k);
				yL = yd.length;
				xL = xd.length;
			}

			xi = yL;
			rem = xd.slice(0, yL);
			remStart = 0;
			remL = rem.length;

			// Add zeros to make remainder as long as divisor.
			for (; remL < yL;) rem[remL++] = 0;

			yd0 = yd[0]!;

			if (yd[1]! >= base / 2) ++yd0;

			do
			{
				k = 0;

				// Compare divisor and remainder.
				cmp = compareDigits(yd, 0, yL, rem, remStart, remL);

				// If divisor < remainder.
				if (cmp < 0)
				{
					// Calculate trial digit, k.
					rem0 = rem[remStart]!;
					if (yL != remL) rem0 = rem0 * base + (rem[remStart + 1] || 0);

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
						prod = prodScratch ??= [];
						prodStart = multiplyIntegerInto(yd, k, prodScratch);
						prodL = prod.length - prodStart;

						// Compare product and remainder.
						cmp = compareDigits(prod, prodStart, prodL, rem, remStart, remL);

						// product > remainder.
						if (cmp == 1)
						{
							k--;

							// Subtract divisor from product.
							const leadingZeros = subtractDigits(prodScratch, prodStart, prodL, yd, 0, yL);
							prodStart += leadingZeros;
							prodL -= leadingZeros;
						}
					}
					else
					{
						// cmp is -1.
						// If k is 0, there is no need to compare yd and rem again below, so change cmp to 1
						// to avoid it. If k is 1 there is a need to compare yd and rem again below.
						if (k == 0) cmp = k = 1;
						prod = yd;
						prodStart = 0;
						prodL = prod.length;
					}

					// Subtract product from remainder.
					let leadingZeros = subtractDigits(
						rem as number[], remStart, remL,
						prod, prodStart, prodL
					);
					remStart += leadingZeros;
					remL -= leadingZeros;

					// If product was < previous remainder.
					if (cmp == -1)
					{
						// Compare divisor and new remainder.
						cmp = compareDigits(yd, 0, yL, rem, remStart, remL);

						// If divisor < new remainder, subtract divisor from remainder.
						if (cmp < 1)
						{
							k++;

							// Subtract divisor from remainder.
							leadingZeros = subtractDigits(
								rem as number[], remStart, remL,
								yd, 0, yL
							);
							remStart += leadingZeros;
							remL -= leadingZeros;
						}
					}
				}
				else if (cmp === 0)
				{
					k++;
					rem.length = 1;
					rem[0] = 0;
					remStart = 0;
					remL = 1;
				}    // if cmp === 1, k will be 0

				// Add the next digit, k, to the result array.
				qd[i++] = k;

				// Update the remainder.
				if (cmp && rem[remStart])
				{
					rem[remStart + remL++] = xd[xi] || 0;
				}
				else
				{
					rem.length = 1;
					rem[0] = xd[xi];
					remStart = 0;
					remL = 1;
				}

			} while ((xi++ < xL || rem[remStart] !== void 0) && sd--);

			more = rem[remStart] !== void 0;
		}

		// Leading zero?
		if (!qd[0])
		{
			removeLeadingZeros(qd);
		}
	}

	// To calculate q.e, first get the number of digits of qd[0].
	for (i = 1, k = qd[0]!; k >= 10; k /= 10)
	{
		i++;
	}

	return { digits: qd, exponent: i + e * logBase - 1, more: Boolean(more) };
}

// Assumes non-zero source and multiplier, and hence a non-zero result.
function multiplyInteger(source : readonly number[], multiplier : number) : number[]
{
	let temp,
		carry = 0,
		i = source.length,
		result = source.slice();

	for (; i--;)
	{
		temp = result[i]! * multiplier + carry;
		// At the internal base (1e7), temp < base² < 2^53, so this remainder is exact.
		carry = temp / base | 0;
		result[i] = temp - carry * base;
	}

	if (carry)
	{
		result = prependDigit(result, carry);
	}

	return result;
}

// Multiply into a reusable right-aligned buffer and return its logical start offset.
function multiplyIntegerInto(
	source : readonly number[],
	multiplier : number,
	result : number[]
) : number
{
	let temp,
		carry = 0,
		i = source.length;

	result.length = i + 1;

	while (i--)
	{
		temp = source[i]! * multiplier + carry;
		carry = temp / base | 0;
		result[i + 1] = temp - carry * base;
	}

	result[0] = carry;

	return carry ? 0 : 1;
}

function compareDigits(
	a : readonly (number | undefined)[],
	aStart : number,
	aL : number,
	b : readonly (number | undefined)[],
	bStart : number,
	bL : number
) : number
{
	let i, result;

	if (aL != bL)
	{
		result = aL > bL ? 1 : -1;
	}
	else
	{
		for (i = result = 0; i < aL; i++)
		{
			if (a[aStart + i]! != b[bStart + i]!)
			{
				result = a[aStart + i]! > b[bStart + i]! ? 1 : -1;
				break;
			}
		}
	}

	return result;
}

function subtractDigits(
	a : number[],
	aStart : number,
	aL : number,
	b : readonly (number | undefined)[],
	bStart : number,
	bL : number
) : number
{
	let borrow = 0,
		aIndex = aStart + aL,
		bIndex = bStart + bL;

	// Subtract the right-aligned b from a.
	while (aIndex > aStart)
	{
		const aDigit = a[--aIndex]! - borrow;
		const bDigit = bIndex > bStart ? b[--bIndex]! : 0;

		borrow = aDigit < bDigit ? 1 : 0;
		a[aIndex] = borrow * base + aDigit - bDigit;
	}

	// Return a logical offset instead of compacting the array.
	let leadingZeros = 0;

	while (leadingZeros < aL - 1 && a[aStart + leadingZeros] === 0)
	{
		leadingZeros++;
	}

	return leadingZeros;
}
