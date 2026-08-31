import type { CalculationContext } from '../../CalculationContext.js';
import type { Decimal } from '../../Decimal.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { abs } from '../arithmetic/abs.js';
import { mul } from '../arithmetic/mul.js';
import { sub } from "../arithmetic/add-subtract.js";
import { isNeg, isZero } from '../compare/identity-compare.js';
import { compareDecimals } from '../compare/relational-compare.js';
import { asin } from './asin.js';
import { getPi } from './get-pi.js';

// Return the arccosine of x in radians, in the range [0, pi].
export function acos(x: Decimal, context: CalculationContext): Decimal
{
	const comparison = compareDecimals(abs(x, context), context.create(1));
	const precision = context.precision;
	const rounding = context.roundingCode;

	if (comparison !== -1)
	{
		return comparison === 0
			? isNeg(x) ? getPi(precision, rounding, context) : context.create(0)
			: context.create(NaN);
	}

	if (isZero(x))
	{
		return mul(getPi(precision + 4, rounding, context), 0.5, context);
	}

	const workingContext = context.with({ precision: precision + 6, roundingCode: ROUND_DOWN });
	const inverseSine = asin(x, workingContext);
	const halfPi = mul(getPi(precision + 4, rounding, workingContext), 0.5, workingContext);

	return sub(halfPi, inverseSine, context);
}
