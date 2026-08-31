import type { CalculationContext } from '../../CalculationContext.js';
import type { Decimal } from '../../Decimal.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { abs } from '../arithmetic/abs.js';
import { add, sub } from "../arithmetic/add-subtract.js";
import { divideSignificant } from '../arithmetic/div.js';
import { mul } from '../arithmetic/mul.js';
import { isZero } from '../compare/identity-compare.js';
import { compareDecimals } from '../compare/relational-compare.js';
import { sqrt } from '../power/sqrt.js';
import { atan } from './atan.js';
import { getPi } from './get-pi.js';

// Return the arcsine of x in radians, in the range [-pi/2, pi/2].
export function asin(x: Decimal, context: CalculationContext): Decimal
{
	if (isZero(x)) return context.create(x);

	const comparison = compareDecimals(abs(x, context), context.create(1));
	const precision = context.precision;
	const rounding = context.roundingCode;

	if (comparison !== -1)
	{
		if (comparison === 0)
		{
			const halfPi = mul(getPi(precision + 4, rounding, context), 0.5, context);
			getMutableDecimalState(halfPi).s = getDecimalState(x).s;
			return halfPi;
		}

		return context.create(NaN);
	}

	const workingContext = context.with({ precision: precision + 6, roundingCode: ROUND_DOWN });
	const squared = mul(x, x, workingContext);
	const radicand = sub(workingContext.create(1), squared, workingContext);
	const root = sqrt(radicand, workingContext);
	const denominator = add(root, 1, workingContext);
	const ratio = divideSignificant(x, denominator, workingContext);

	return mul(atan(ratio, workingContext), 2, context);
}
