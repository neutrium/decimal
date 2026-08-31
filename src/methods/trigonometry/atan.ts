import type { CalculationContext } from '../../CalculationContext.js';
import type { Decimal } from '../../Decimal.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';
import { DecimalConstants } from '../../InternalConstants.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { abs } from '../arithmetic/abs.js';
import { add, sub } from "../arithmetic/add-subtract.js";
import { divideSignificant } from '../arithmetic/div.js';
import { mul } from '../arithmetic/mul.js';
import { isFinite, isZero } from '../compare/identity-compare.js';
import { compareDecimals } from '../compare/relational-compare.js';
import { sqrt } from '../power/sqrt.js';
import { finalise } from '../utils/finalise.js';
import { getPi } from './get-pi.js';

// Return the arctangent of x in radians, in the range [-pi/2, pi/2].
export function atan(x: Decimal, context: CalculationContext): Decimal
{
	let index, termIndex, reductions, denominator = 1, previous, intermediate, result, squared;
	const precision = context.precision;
	const rounding = context.roundingCode;

	if (!isFinite(x))
	{
		const state = getDecimalState(x);
		if (!state.s) return context.create(NaN);

		if (precision + 4 <= DecimalConstants.PI_PRECISION)
		{
			result = mul(getPi(precision + 4, rounding, context), 0.5, context);
			getMutableDecimalState(result).s = state.s;
			return result;
		}
	}
	else if (isZero(x))
	{
		return context.create(x);
	}
	else if (
		compareDecimals(abs(x, context), context.create(1)) === 0 &&
		precision + 4 <= DecimalConstants.PI_PRECISION
	)
	{
		result = mul(getPi(precision + 4, rounding, context), 0.25, context);
		getMutableDecimalState(result).s = getDecimalState(x).s;
		return result;
	}

	const workingPrecision = precision + 10;
	const argumentContext = context.with({ precision: workingPrecision, roundingCode: ROUND_DOWN });
	reductions = Math.min(28, workingPrecision / DecimalConstants.LOG_BASE + 2 | 0);

	for (index = reductions; index; --index)
	{
		const xSquared = mul(x, x, argumentContext);
		const radicand = add(xSquared, 1, argumentContext);
		const root = sqrt(radicand, argumentContext);
		x = divideSignificant(x, add(root, 1, argumentContext), argumentContext);
	}

	const seriesContext = argumentContext.with({ external: false });
	termIndex = Math.ceil(workingPrecision / DecimalConstants.LOG_BASE);
	squared = mul(x, x, seriesContext);
	result = seriesContext.create(x);
	previous = x;

	for (; index !== -1;)
	{
		previous = mul(previous, squared, seriesContext);
		intermediate = sub(
			result,
			divideSignificant(previous, seriesContext.create(denominator += 2), seriesContext),
			seriesContext
		);

		previous = mul(previous, squared, seriesContext);
		result = add(
			intermediate,
			divideSignificant(previous, seriesContext.create(denominator += 2), seriesContext),
			seriesContext
		);

		const resultDigits = getDecimalState(result).d!;
		const intermediateDigits = getDecimalState(intermediate).d!;

		if (resultDigits[termIndex] !== undefined)
		{
			for (index = termIndex; resultDigits[index] === intermediateDigits[index] && index--;);
		}
	}

	if (reductions)
	{
		result = mul(result, 2 << (reductions - 1), seriesContext);
	}

	return finalise(result, precision, rounding, true, context);
}
