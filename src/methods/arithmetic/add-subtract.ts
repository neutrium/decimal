import type { KernelDecimal } from '../../KernelDecimal.js';
import type { DecimalValue } from '../../DecimalBase.js';
import type { CalculationContext } from '../../CalculationContext.js';
import { DecimalConstants } from '../../InternalConstants.js';
import { ROUND_FLOOR } from '../../config/RoundingModes.js';
import { finalise } from '../utils/finalise.js';
import { refineRoundedBounds } from '../utils/verified-rounding.js';
import { normaliseOperand } from '../utils/normalise-operand.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';
import { addMagnitudes, subtractMagnitudes, magnitudePrefix } from './coefficients/add-subtract.js';
import { compareMagnitudes } from '../utils/coefficients/compare.js';

/** Add two values, rounding only at a public calculation boundary. */
export function add(x: KernelDecimal, y: DecimalValue, context: CalculationContext): KernelDecimal
{
	return addSubtract(x, y, false, context);
}

/** Subtract two values, rounding only at a public calculation boundary. */
export function sub(x: KernelDecimal, y: DecimalValue, context: CalculationContext): KernelDecimal
{
	return addSubtract(x, y, true, context);
}

/** Normalize the operand once, then dispatch by sign without cloning or negating it. */
function addSubtract(x: KernelDecimal, input: DecimalValue, subtract: boolean, context: CalculationContext): KernelDecimal
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

		if ((context.boundary === 'public') && xd.length + yd.length >= 256)
		{
			const rounded = addRoundedPrefixes(xd, xState.e, yd, yState.e, xState.s, context);
			if (rounded) return rounded;
		}

		const sum = addMagnitudes(xd, xState.e, yd, yState.e, context.precision);
		resultState.d = sum.digits;
		resultState.e = sum.exponent;
	}
	else
	{
		const comparison = compareMagnitudes(xd, xState.e, yd, yState.e);

		if (comparison === 0)
		{
			resultState.s = zeroSign;
			resultState.e = 0;
			resultState.d = [0];
		}
		else
		{
			resultState.s = comparison > 0 ? xState.s : ySign;

			const difference = subtractMagnitudes(
				comparison > 0 ? xd : yd, comparison > 0 ? xState.e : yState.e,
				comparison > 0 ? yd : xd, comparison > 0 ? yState.e : xState.e,
				context.precision
			);
			resultState.d = difference.digits;
			resultState.e = difference.exponent;
		}
	}

	return (context.boundary === 'public') ? finalise(result, context.precision, context.roundingCode, undefined, context) : result;
}

/** Refine unsigned magnitude bounds, applying the effective result sign only at allocation. */
function addRoundedPrefixes(
	xd : readonly number[], xe : number,
	yd : readonly number[], ye : number,
	sign : number,
	context : CalculationContext
) : KernelDecimal | undefined
{
	return refineRoundedBounds(
		context,
		Math.ceil(context.precision / DecimalConstants.LOG_BASE) + 3,
		keep => keep < xd.length || keep < yd.length,
		keep => {
			const xTruncated = keep < xd.length;
			const yTruncated = keep < yd.length;
			const sumBound = (upper : boolean) : KernelDecimal => {
				const x = magnitudePrefix(xd, xe, Math.min(keep, xd.length), upper && xTruncated);
				const y = magnitudePrefix(yd, ye, Math.min(keep, yd.length), upper && yTruncated);
				const sum = addMagnitudes(x.digits, x.exponent, y.digits, y.exponent, context.precision);
				return context.createResult({ d: sum.digits, e: sum.exponent, s: sign });
			};
			return { lower: sumBound(false), upper: sumBound(true), lowerHasMore: xTruncated || yTruncated };
		}
	);
}
