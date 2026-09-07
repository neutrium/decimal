import { DecimalConstants } from "../../InternalConstants.js";
import type { KernelDecimal } from "../../KernelDecimal.js";
import type { DecimalValue } from "../../DecimalBase.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { finalise } from "../utils/finalise.js";
import { getBase10Exponent } from "../utils/get-base-10-exponent.js"
import { removeLeadingZeros } from "../utils/digit-array.js";
import { normaliseOperand } from '../utils/normalise-operand.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';
import { refineRoundedBounds } from '../utils/verified-rounding.js';
import { BIGINT_MULTIPLICATION_WORDS, digitsPrefixToBigInt, multiplyCoefficients } from './coefficients/multiply.js';

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
export function mul(x: KernelDecimal, yy : DecimalValue, context : CalculationContext) : KernelDecimal
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

	if ((context.boundary === 'public') && xd.length + yd.length >= BIGINT_MULTIPLICATION_WORDS)
	{
		const rounded = multiplyRoundedPrefixes(x, y, sign, context);
		if (rounded) return rounded;
	}

	r = multiplyCoefficients(xd, yd);

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

	return (context.boundary === 'public')
		? finalise(result, context.precision, context.roundingCode, undefined, context)
		: result;
}

/**
 * Round a product from successively tighter coefficient intervals. This avoids constructing
 * complete million-word BigInts when a public calculation retains only a short prefix. The
 * result is accepted only when both conservative endpoints round identically.
 */
function multiplyRoundedPrefixes(
	x : KernelDecimal,
	y : KernelDecimal,
	sign : number,
	context : CalculationContext
) : KernelDecimal | undefined
{
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);
	const xd = xState.d!;
	const yd = yState.d!;

	return refineRoundedBounds(
		context,
		Math.ceil(context.precision / DecimalConstants.LOG_BASE) + 3,
		keep => keep < xd.length || keep < yd.length,
		keep => {
			const xLength = Math.min(keep, xd.length);
			const yLength = Math.min(keep, yd.length);
			const xPrefix = digitsPrefixToBigInt(xd, xLength);
			const yPrefix = xd === yd && xLength === yLength
				? xPrefix
				: digitsPrefixToBigInt(yd, yLength);
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

function decimalFromScaledCoefficient(
	coefficient : bigint,
	scale : number,
	sign : number,
	context : CalculationContext
) : KernelDecimal
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
