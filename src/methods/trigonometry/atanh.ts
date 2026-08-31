import type { CalculationContext } from '../../CalculationContext.js';
import type { Decimal } from '../../Decimal.js';
import { getDecimalState } from '../../DecimalState.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { abs } from '../arithmetic/abs.js';
import { add, sub } from "../arithmetic/add-subtract.js";
import { divideSignificant } from '../arithmetic/div.js';
import { mul } from '../arithmetic/mul.js';
import { isFinite, isZero } from '../compare/identity-compare.js';
import { compareDecimals } from '../compare/relational-compare.js';
import { naturalLogarithm } from '../exponential/ln.js';
import { finalise } from '../utils/finalise.js';
import { precision } from '../utils/precision.js';

// Return the inverse hyperbolic tangent of x.
export function atanh(x: Decimal, context: CalculationContext): Decimal
{
	const state = getDecimalState(x);
	if (!isFinite(x)) return context.create(NaN);

	if (state.e >= 0)
	{
		return context.create(
			compareDecimals(abs(x, context), context.create(1)) === 0
				? state.s / 0
				: isZero(x) ? x : NaN
		);
	}

	const resultPrecision = context.precision;
	const rounding = context.roundingCode;
	const significantDigits = precision(x);

	if (Math.max(significantDigits, resultPrecision) < 2 * -state.e - 1)
	{
		return finalise(context.create(x), resultPrecision, rounding, true, context);
	}

	const workingPrecision = significantDigits - state.e;
	const divisionContext = context.with({ precision: workingPrecision });
	const numerator = add(x, 1, divisionContext);
	const denominator = sub(divisionContext.create(1), x, divisionContext);
	x = divideSignificant(
		numerator,
		denominator,
		divisionContext,
		workingPrecision + resultPrecision,
		ROUND_DOWN
	);

	const logarithmContext = context.with({ precision: resultPrecision + 4, roundingCode: ROUND_DOWN });
	x = naturalLogarithm(x, undefined, logarithmContext);

	return mul(x, 0.5, context);
}
