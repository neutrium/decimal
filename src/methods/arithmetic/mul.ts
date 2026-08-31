import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal, DecimalValue } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { finalise } from "../utils/finalise.js";
import { getBase10Exponent } from "../utils/get-base-10-exponent.js"
import { removeLeadingZeros } from "../utils/digit-array.js";
import { normaliseOperand } from '../utils/normalise-operand.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';
import { refineRoundedBounds } from '../utils/verified-rounding.js';

//
// Return a new Decimal whose value is `x` times `y`, rounded to `precision` significant
// digits using rounding mode `rounding`.
//
//  n * 0 = 0
//  n * N = N
//  n * I = I
//  0 * n = 0
//  0 * 0 = 0
//  0 * N = N
//  0 * I = N
//  N * n = N
//  N * 0 = N
//  N * N = N
//  N * I = N
//  I * n = I
//  I * 0 = N
//  I * N = N
//  I * I = I
//
export function mul(x: Decimal, yy : DecimalValue, context : CalculationContext) : Decimal
{
	const y = normaliseOperand(yy, context);
	const existingOperand = y === yy;
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);
	const sign = xState.s * yState.s;

	let e, r,
		xd = xState.d,
		yd = yState.d,
		LOG_BASE = DecimalConstants.LOG_BASE;

	// If either is NaN, ±Infinity or ±0...
	if (!xd || !xd[0] || !yd || !yd[0])
	{

		const value = !sign || xd && !xd[0] && !yd || yd && !yd[0] && !xd

		// Return NaN if either is NaN.
		// Return NaN if x is ±0 and y is ±Infinity, or y is ±0 and x is ±Infinity.
		? NaN

		// Return ±Infinity if either is ±Infinity.
		// Return ±0 if either is ±0.
		: !xd || !yd ? sign / 0 : sign * 0;

		return context.create(value);
	}

	e = Math.floor(xState.e / LOG_BASE) + Math.floor(yState.e / LOG_BASE);

	if (context.external && xd.length + yd.length >= 256)
	{
		const rounded = multiplyRoundedPrefixes(x, y, sign, context);
		if (rounded) return rounded;
	}

	r = xd.length + yd.length >= 256
		? multiplyDigitsWithBigInt(xd, yd)
		: xd === yd ? squareDigits(xd) : multiplyDigits(xd, yd);

	if (r[0])
	{
		++e;
	}
	else
	{
		removeLeadingZeros(r);
	}

	// Remove trailing zeros.
	while (r[r.length - 1] === 0)
	{
		r.pop();
	}

	const resultExponent = getBase10Exponent(r, e);

	// Reuse a freshly parsed operand, but never copy or mutate a caller-owned coefficient.
	const result = existingOperand
		? context.createResult({ d: r, e: resultExponent, s: sign })
		: y;

	if (!existingOperand)
	{
		const state = getMutableDecimalState(result);
		state.s = sign;
		state.d = r;
		state.e = resultExponent;
	}

	return context.external
		? finalise(result, context.precision, context.roundingCode, undefined, context)
		: result;
}

/**
 * Round a product from successively tighter coefficient intervals. This avoids constructing
 * complete million-word BigInts when a public calculation retains only a short prefix. The
 * result is accepted only when both conservative endpoints round identically.
 */
function multiplyRoundedPrefixes(
	x : Decimal,
	y : Decimal,
	sign : number,
	context : CalculationContext
) : Decimal | undefined
{
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);
	const xd = xState.d!;
	const yd = yState.d!;
	const base = BigInt(DecimalConstants.BASE);

	return refineRoundedBounds(
		context,
		Math.ceil(context.precision / DecimalConstants.LOG_BASE) + 3,
		keep => keep < xd.length || keep < yd.length,
		keep => {
			const xLength = Math.min(keep, xd.length);
			const yLength = Math.min(keep, yd.length);
			const xPrefix = digitsPrefixToBigInt(xd, xLength, base);
			const yPrefix = xd === yd && xLength === yLength
				? xPrefix
				: digitsPrefixToBigInt(yd, yLength, base);
			const xTruncated = xLength < xd.length;
			const yTruncated = yLength < yd.length;
			const scale = Math.floor(xState.e / DecimalConstants.LOG_BASE) - xLength + 1 +
				Math.floor(yState.e / DecimalConstants.LOG_BASE) - yLength + 1;
			const lowerCoefficient = xPrefix * yPrefix;
			const upperCoefficient = (xPrefix + (xTruncated ? 1n : 0n)) *
				(yPrefix + (yTruncated ? 1n : 0n));
			const lower = decimalFromScaledCoefficient(lowerCoefficient, scale, sign, context);
			const upper = decimalFromScaledCoefficient(upperCoefficient, scale, sign, context);
			return { lower, upper, lowerHasMore: xTruncated || yTruncated };
		}
	);
}

function digitsPrefixToBigInt(digits : readonly number[], length : number, base : bigint) : bigint
{
	let coefficient = 0n;

	for (let i = 0; i < length; i++)
	{
		coefficient = coefficient * base + BigInt(digits[i]!);
	}

	return coefficient;
}

function decimalFromScaledCoefficient(
	coefficient : bigint,
	scale : number,
	sign : number,
	context : CalculationContext
) : Decimal
{
	const source = coefficient.toString();
	const firstLength = source.length % DecimalConstants.LOG_BASE || DecimalConstants.LOG_BASE;
	const digits = [Number(source.slice(0, firstLength))];

	for (let i = firstLength; i < source.length; i += DecimalConstants.LOG_BASE)
	{
		digits.push(Number(source.slice(i, i + DecimalConstants.LOG_BASE)));
	}

	return context.createResult({
		d: digits,
		e: (scale + digits.length - 1) * DecimalConstants.LOG_BASE + firstLength - 1,
		s: sign
	});
}

/** Use the runtime's sub-quadratic BigInt kernel once it is faster than word convolution. */
function multiplyDigitsWithBigInt(a : readonly number[], b : readonly number[]) : number[]
{
	const base = BigInt(DecimalConstants.BASE);
	let x = 0n;

	for (const digit of a)
	{
		x = x * base + BigInt(digit);
	}

	let y = x;

	if (a !== b)
	{
		y = 0n;
		for (const digit of b) y = y * base + BigInt(digit);
	}

	const coefficient = (x * y).toString();
	const expectedLength = a.length + b.length;
	const result = new Array<number>(expectedLength);
	const actualLength = Math.ceil(coefficient.length / DecimalConstants.LOG_BASE);
	const offset = expectedLength - actualLength;
	let sourceIndex = coefficient.length % DecimalConstants.LOG_BASE || DecimalConstants.LOG_BASE;
	let targetIndex = offset;

	if (offset)
	{
		result[0] = 0;
	}

	result[targetIndex++] = Number(coefficient.slice(0, sourceIndex));

	while (sourceIndex < coefficient.length)
	{
		const end = sourceIndex + DecimalConstants.LOG_BASE;
		result[targetIndex++] = Number(coefficient.slice(sourceIndex, end));
		sourceIndex = end;
	}

	return result;
}

function multiplyDigits(a : readonly number[], b : readonly number[]) : number[]
{
	if (a.length < b.length)
	{
		[a, b] = [b, a];
	}

	const base = DecimalConstants.BASE;
	const result : number[] = [];

	for (let i = a.length + b.length; i--;)
	{
		result.push(0);
	}

	for (let i = b.length; i--;)
	{
		let carry = 0;
		let k = a.length + i;

		for (; k > i; k--)
		{
			const product = result[k]! + b[i]! * a[k - i - 1]! + carry;
			// product < base² < 2^53: derive the exact remainder from the quotient.
			carry = product / base | 0;
			result[k] = product - carry * base;
		}

		result[k] = carry;
	}
	return result;
}

/** Square using each off-diagonal product once, doubling it for its symmetric partner. */
function squareDigits(digits : readonly number[]) : number[]
{
	const base = DecimalConstants.BASE;
	const result : number[] = [];
	for (let i = digits.length * 2; i--;) result.push(0);

	for (let i = digits.length; i--;)
	{
		const word = digits[i]!;
		let k = i * 2 + 1;
		let product = result[k]! + word * word;
		let carry = product / base | 0;
		result[k] = product - carry * base;

		for (let j = i; j--;)
		{
			k--;
			product = result[k]! + 2 * word * digits[j]! + carry;
			carry = product / base | 0;
			result[k] = product - carry * base;
		}

		// This carry slot may temporarily exceed base; the next row normalizes it.
		// Even doubled products plus carry remain below 2 * base² + 2 * base < 2^53.
		result[i] = carry;
	}
	return result;
}
