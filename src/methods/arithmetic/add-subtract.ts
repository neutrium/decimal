import type { Decimal, DecimalValue } from '../../Decimal.js';
import type { CalculationContext } from '../../CalculationContext.js';
import { DecimalConstants } from '../../InternalConstants.js';
import { ROUND_FLOOR } from '../../config/RoundingModes.js';
import { getBase10Exponent } from '../utils/get-base-10-exponent.js';
import { prependDigit, removeLeadingZeros } from '../utils/digit-array.js';
import { finalise } from '../utils/finalise.js';
import { refineRoundedBounds } from '../utils/verified-rounding.js';
import { normaliseOperand } from '../utils/normalise-operand.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';
import type { DecimalState, ReadonlyDecimalState } from '../../DecimalState.js';

/** Add two values, rounding only at an external calculation boundary. */
export function add(x: Decimal, y: DecimalValue, context: CalculationContext): Decimal
{
	return addSubtract(x, y, false, context);
}

/** Subtract two values, rounding only at an external calculation boundary. */
export function sub(x: Decimal, y: DecimalValue, context: CalculationContext): Decimal
{
	return addSubtract(x, y, true, context);
}

/** Normalize the operand once, then dispatch by sign without cloning or negating it. */
function addSubtract(x: Decimal, input: DecimalValue, subtract: boolean, context: CalculationContext): Decimal
{
	const y = normaliseOperand(input, context);
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);
	const ySign = subtract ? -yState.s : yState.s;
	const result = y === input ? context.createResult({ d: null, e: NaN, s: NaN }) : y;
	const resultState = getMutableDecimalState(result);
	const xd = xState.d;
	const yd = yState.d;
	const zeroSign = context.roundingCode === ROUND_FLOOR ? -1 : 1;

	if (!xd || !yd)
	{
		resultState.s = !xState.s || !ySign || (!xd && !yd && xState.s !== ySign)
			? NaN : !xd ? xState.s : ySign;
		resultState.e = NaN;
		resultState.d = null;
		return result;
	}

	if (!xd[0] || !yd[0])
	{
		const source = xd[0] ? x : y;
		const sourceState = getDecimalState(source);
		resultState.s = xd[0] ? xState.s : yd[0] ? ySign : xState.s === ySign ? xState.s : zeroSign;
		resultState.e = sourceState.e;
		resultState.d = sourceState.d!.slice();
	}
	else if (xState.s === ySign)
	{
		resultState.s = xState.s;

		if (context.external && xd.length + yd.length >= 256)
		{
			const rounded = addRoundedPrefixes(x, y, context);
			if (rounded) return rounded;
		}

		addMagnitudes(xState, yState, resultState, context.precision);
	}
	else
	{
		const comparison = compareMagnitudes(xState, yState);

		if (comparison === 0)
		{
			resultState.s = zeroSign;
			resultState.e = 0;
			resultState.d = [0];
		}
		else
		{
			resultState.s = comparison > 0 ? xState.s : ySign;

			subtractMagnitudes(
				comparison > 0 ? xState : yState,
				comparison > 0 ? yState : xState,
				resultState,
				context.precision
			);
		}
	}

	return context.external ? finalise(result, context.precision, context.roundingCode, undefined, context) : result;
}

function compareMagnitudes(x: ReadonlyDecimalState, y: ReadonlyDecimalState): number
{
	if (x.e !== y.e)
	{
		return x.e > y.e ? 1 : -1;
	}

	const xd = x.d!;
	const yd = y.d!;
	const length = Math.min(xd.length, yd.length);

	for (let i = 0; i < length; i++)
	{
		if (xd[i] !== yd[i]) return xd[i]! > yd[i]! ? 1 : -1;
	}

	return xd.length === yd.length ? 0 : xd.length > yd.length ? 1 : -1;
}

function addMagnitudes(
	x: ReadonlyDecimalState,
	y: ReadonlyDecimalState,
	result: DecimalState,
	precision: number
): void
{
	const { BASE, LOG_BASE } = DecimalConstants;
	const xe = Math.floor(x.e / LOG_BASE);
	const ye = Math.floor(y.e / LOG_BASE);
	const leading = (xe >= ye ? x.d : y.d)!;
	const trailing = (xe >= ye ? y.d : x.d)!;
	const gap = Math.abs(xe - ye);
	const limit = Math.max(Math.ceil(precision / LOG_BASE), leading.length) + 1;
	const offset = Math.min(gap, limit);
	const trailingLength = gap > limit ? 1 : trailing.length;
	const length = Math.max(leading.length, offset + trailingLength);

	let digits = new Array<number>(length);
	let carry = 0;
	let exponent = Math.max(xe, ye);

	// The exponent gap is a logical offset, never a padded copy of either input.
	for (let i = length - 1; i >= 0; i--)
	{
		const j = i - offset;
		const sum = (leading[i] || 0) + (j >= 0 && j < trailingLength ? trailing[j]! : 0) + carry;
		carry = sum >= BASE ? 1 : 0;
		digits[i] = sum - carry * BASE;
	}

	if (carry)
	{
		digits = prependDigit(digits, carry);
		exponent++;
	}

	while (digits[digits.length - 1] === 0)
	{
		digits.pop();
	}

	result.d = digits;
	result.e = getBase10Exponent(digits, exponent);
}

/** Subtract a strictly smaller non-zero magnitude from a larger one. */
function subtractMagnitudes(
	larger: ReadonlyDecimalState,
	smaller: ReadonlyDecimalState,
	result: DecimalState,
	precision: number
): void
{
	const { BASE, LOG_BASE } = DecimalConstants;
	const leading = larger.d!;
	const trailing = smaller.d!;
	let exponent = Math.floor(larger.e / LOG_BASE);
	const gap = exponent - Math.floor(smaller.e / LOG_BASE);
	const limit = Math.max(Math.ceil(precision / LOG_BASE), leading.length) + 2;
	const offset = Math.min(gap, limit);
	const trailingLength = gap > limit ? 1 : trailing.length;
	const length = Math.max(leading.length, offset + trailingLength);
	const digits = new Array<number>(length);
	let borrow = 0;

	for (let i = length - 1; i >= 0; i--)
	{
		const j = i - offset;
		const difference = (leading[i] || 0) - (j >= 0 && j < trailingLength ? trailing[j]! : 0) - borrow;
		borrow = difference < 0 ? 1 : 0;
		digits[i] = difference + borrow * BASE;
	}

	while (digits[digits.length - 1] === 0)
	{
		digits.pop();
	}

	exponent -= removeLeadingZeros(digits, false);
	result.d = digits;
	result.e = getBase10Exponent(digits, exponent);
}

/** Round a same-sign sum from conservative high-prefix bounds. */
function addRoundedPrefixes(
	x : Decimal,
	y : Decimal,
	context : CalculationContext
) : Decimal | undefined
{
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);
	const xd = xState.d!;
	const yd = yState.d!;
	const workingContext = context.withoutLimits();

	return refineRoundedBounds(
		context,
		Math.ceil(context.precision / DecimalConstants.LOG_BASE) + 3,
		keep => keep < xd.length || keep < yd.length,
		keep => {
			const xTruncated = keep < xd.length;
			const yTruncated = keep < yd.length;
			const lowerX = decimalFromPrefix(xState, Math.min(keep, xd.length), false, workingContext);
			const lowerY = decimalFromPrefix(yState, Math.min(keep, yd.length), false, workingContext);
			const upperX = decimalFromPrefix(xState, Math.min(keep, xd.length), xTruncated, workingContext);
			const upperY = decimalFromPrefix(yState, Math.min(keep, yd.length), yTruncated, workingContext);
			const lower = addSubtract(lowerX, lowerY, false, workingContext);
			const upper = addSubtract(upperX, upperY, false, workingContext);

			return { lower, upper, lowerHasMore: xTruncated || yTruncated };
		}
	);
}

function decimalFromPrefix(
	source : ReadonlyDecimalState,
	length : number,
	increment : boolean,
	context : CalculationContext
) : Decimal
{
	let digits = source.d!.slice(0, length);
	let wordExponent = Math.floor(source.e / DecimalConstants.LOG_BASE);

	if (increment)
	{
		let index = digits.length - 1;

		for (; index >= 0; index--)
		{
			const next = digits[index]! + 1;

			if (next < DecimalConstants.BASE)
			{
				digits[index] = next;
				break;
			}

			digits[index] = 0;
		}

		if (index < 0)
		{
			digits = [1];
			wordExponent++;
		}
		else
		{
			while (digits[digits.length - 1] === 0) digits.pop();
		}
	}

	return context.createResult({
		d: digits,
		e: increment ? getBase10Exponent(digits, wordExponent) : source.e,
		s: source.s
	});
}