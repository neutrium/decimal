import type { CalculationContext } from '../../CalculationContext.js';
import type { Decimal } from '../../Decimal.js';
import { getDecimalState } from '../../DecimalState.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { add } from "../arithmetic/add-subtract.js";
import { mul } from '../arithmetic/mul.js';
import { isFinite, isZero } from '../compare/identity-compare.js';
import { finalise } from '../utils/finalise.js';
import { precision } from '../utils/precision.js';
import { taylorSeries } from './taylor-series.js';

// Return the hyperbolic sine of x.
export function sinh(x: Decimal, context: CalculationContext): Decimal
{
	if (!isFinite(x) || isZero(x)) return context.create(x);

	const resultPrecision = context.precision;
	const rounding = context.roundingCode;
	const workingContext = context.with({
		precision: resultPrecision + Math.max(getDecimalState(x).e, precision(x)) + 4,
		roundingCode: ROUND_DOWN
	});
	const length = getDecimalState(x).d!.length;

	if (length < 3)
	{
		x = taylorSeries(2, x, x, true, workingContext);
	}
	else
	{
		let reductions = Math.min(16, 1.4 * Math.sqrt(length) | 0);
		x = mul(x, Math.pow(5, -reductions), workingContext);
		x = taylorSeries(2, x, x, true, workingContext);

		const five = workingContext.create(5);
		const sixteen = workingContext.create(16);
		const twenty = workingContext.create(20);

		for (; reductions--;)
		{
			const square = mul(x, x, workingContext);
			const scaledSquare = mul(sixteen, square, workingContext);
			const innerPolynomial = add(scaledSquare, twenty, workingContext);
			const correction = mul(square, innerPolynomial, workingContext);
			x = mul(x, add(five, correction, workingContext), workingContext);
		}
	}

	return finalise(x, resultPrecision, rounding, true, context);
}
