import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal, DecimalValue } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_DOWN, type RoundingCode } from "../../config/RoundingModes.js";
import { finalise } from "../utils/finalise.js";
import { prependDigit, removeLeadingZeros } from "../utils/digit-array.js";
import { abs } from './abs.js';
import { add, sub } from './add-subtract.js';
import { mul } from './mul.js';
import { shift } from './shift.js';
import { compareDecimals } from '../compare/relational-compare.js';
import { normaliseOperand } from '../utils/normalise-operand.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';

const { BASE: base, LOG_BASE: logBase } = DecimalConstants;

//
// Return a new Decimal whose value is the value of `x` divided by `y`, rounded to
// `precision` significant digits using rounding mode `rounding`.
//
export function div(x: Decimal, y : DecimalValue, context : CalculationContext) : Decimal
{
	return divideSignificant(x, normaliseOperand(y, context), context);
}

//
// Return a new Decimal whose value is the integer part of dividing the value of x
// by the value of `y`, rounded to `precision` significant digits using rounding mode `rounding`.
//
export function divToInt(x: Decimal, y : DecimalValue, context : CalculationContext) : Decimal
{
	return divideIntegerToPrecision(
		x,
		normaliseOperand(y, context),
		context,
		context.precision,
		context.roundingCode
	);
}

//
// Divide to a significant-digit precision, defaulting to the calculation context.
//
export function divideSignificant(
	x : Decimal,
	y : Decimal,
	context : CalculationContext,
	precision : number = context.precision,
	rounding : RoundingCode = context.roundingCode
) : Decimal
{
	return divide(x, y, context, precision, rounding, false);
}

// Return the rounded integer quotient without limiting its significant digits.
export function divideInteger(
	x : Decimal,
	y : Decimal,
	context : CalculationContext,
	rounding : RoundingCode = ROUND_DOWN
) : Decimal
{
	return divide(x, y, context, 0, rounding, true);
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

function divideIntegerToPrecision(
	x : Decimal,
	y : Decimal,
	context : CalculationContext,
	precision : number,
	rounding : RoundingCode
) : Decimal
{
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);

	// Handle zero and non-finite operands in the ordinary kernel.
	if (!xState.d || !xState.d[0] || !yState.d || !yState.d[0])
	{
		return finalise(divideInteger(x, y, context), precision, rounding, undefined, context);
	}

	const workingContext = context.withoutLimits();
	const maximumShiftPlaces = xState.e - yState.e - precision + 1;

	// The quotient exponent is at most x.e - y.e, so no estimate is needed in this case.
	if (maximumShiftPlaces <= DecimalConstants.LOG_BASE)
	{
		return finalise(divideInteger(x, y, workingContext), precision, rounding, undefined, context);
	}

	const estimate = divideSignificant(x, y, workingContext, precision + 2, ROUND_DOWN);
	const estimateState = getDecimalState(estimate);
	if (estimateState.e > context.config.maxE) return context.create(estimateState.s / 0);
	const shiftPlaces = estimateState.e - precision + 1;

	// Computing the full integer is cheap when it is close to the requested precision.
	if (shiftPlaces <= DecimalConstants.LOG_BASE)
	{
		return finalise(divideInteger(x, y, workingContext), precision, rounding, undefined, context);
	}

	const magnitudeX = abs(x, workingContext);
	const magnitudeY = abs(y, workingContext);
	const scaledDivisor = shift(magnitudeY, shiftPlaces, workingContext);
	const leadingInteger = divideInteger(magnitudeX, scaledDivisor, workingContext);
	const remainder = sub(
		magnitudeX,
		mul(leadingInteger, scaledDivisor, workingContext),
		workingContext
	);
	const halfUnit = mul(scaledDivisor, 0.5, workingContext);
	const halfUnitUpperBound = add(halfUnit, magnitudeY, workingContext);
	const integerTie = compareDecimals(remainder, halfUnit) >= 0 &&
		compareDecimals(remainder, halfUnitUpperBound) < 0;
	const sign = xState.s === yState.s ? 1 : -1;
	let rounded;

	if (integerTie)
	{
		rounded = add(leadingInteger, 0.5, workingContext);
		getMutableDecimalState(rounded).s = sign;
		rounded = finalise(rounded, precision, rounding, false, workingContext);
	}
	else
	{
		getMutableDecimalState(magnitudeX).s = sign;
		rounded = divideSignificant(magnitudeX, scaledDivisor, workingContext, precision, rounding);
	}

	return shift(rounded, shiftPlaces, context);
}

// Shared base-1e7 division kernel. Only the final precision policy varies.
function divide(
	x : Decimal,
	y : Decimal,
	context : CalculationContext,
	precision : number,
	rounding : RoundingCode,
	integerQuotient : boolean
) : Decimal
{
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);
	let cmp, e, i, k, more, prodL, prodStart, q, remL, rem0, remStart, sd,
		t, xi, xL, yd0, yL,
		sign = xState.s == yState.s ? 1 : -1,
		xd = xState.d,
		yd = yState.d;
	let prod: readonly number[];
	let prodScratch: number[] | undefined;
	let qd: number[];
	let rem: (number | undefined)[];

	// Either NaN, Infinity or 0?
	if (!xd || !xd[0] || !yd || !yd[0])
	{
		return context.create(// Return NaN if either NaN, or both Infinity or 0.
		!xState.s || !yState.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN :

		// Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
		xd && xd[0] == 0 || !yd ? sign * 0 : sign / 0);
	}

	e = Math.floor(xState.e / logBase) - Math.floor(yState.e / logBase);

	yL = yd.length;
	xL = xd.length;
	qd = [];
	q = context.createResult({ d: qd, e: NaN, s: sign });

	// Result exponent may be one less than e.
	for (i = 0; yd[i] == (xd[i] || 0); i++);

	if (yd[i]! > (xd[i] || 0)) e--;

	sd = integerQuotient ? xState.e - yState.e + 1 : precision;

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

	getMutableDecimalState(q).e = i + e * logBase - 1;

	return finalise(q, integerQuotient ? getDecimalState(q).e + 1 : precision, rounding, Boolean(more), context);
}
