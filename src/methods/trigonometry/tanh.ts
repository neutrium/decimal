import type { CalculationContext } from '../../CalculationContext.js';
import type { Decimal } from '../../Decimal.js';
import { getDecimalState } from '../../DecimalState.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { divideSignificant } from '../arithmetic/div.js';
import { isFinite, isZero } from '../compare/identity-compare.js';
import { cosh } from './cosh.js';
import { sinh } from './sinh.js';

// Return the hyperbolic tangent of x.
export function tanh(x: Decimal, context: CalculationContext): Decimal
{
	if (!isFinite(x))
	{
		return context.create(getDecimalState(x).s);
	}

	if (isZero(x))
	{
		return context.create(x);
	}

	const precision = context.precision;
	const rounding = context.roundingCode;
	const workingContext = context.with({ precision: precision + 7, roundingCode: ROUND_DOWN });

	return divideSignificant(
		sinh(x, workingContext),
		cosh(x, workingContext),
		context,
		precision,
		rounding
	);
}
