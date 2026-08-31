import type { CalculationContext } from '../../CalculationContext.js';
import type { Decimal } from '../../Decimal.js';
import { getDecimalState } from '../../DecimalState.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { mul } from '../arithmetic/mul.js';
import { sub } from "../arithmetic/add-subtract.js";
import { isFinite, isZero } from '../compare/identity-compare.js';
import { finalise } from '../utils/finalise.js';
import { precision } from '../utils/precision.js';
import { taylorSeries } from './taylor-series.js';

// Return the hyperbolic cosine of x.
export function cosh(x: Decimal, context: CalculationContext): Decimal
{
	const one = context.create(1);

	if (!isFinite(x))
	{
		return context.create(getDecimalState(x).s ? Infinity : NaN);
	}

	if (isZero(x))
	{
		return one;
	}

	const resultPrecision = context.precision;
	const rounding = context.roundingCode;
	const workingContext = context.with({
		precision: resultPrecision + Math.max(getDecimalState(x).e, precision(x)) + 4,
		roundingCode: ROUND_DOWN
	});
	const length = getDecimalState(x).d!.length;
	const reductions = length < 32 ? Math.ceil(length / 3) : 16;
	const scale = length < 32
		? Math.pow(4, -reductions).toString()
		: '2.3283064365386962890625e-10';

	x = taylorSeries(1, mul(x, scale, workingContext), workingContext.create(1), true, workingContext);

	const eight = workingContext.create(8);

	for (let remaining = reductions; remaining--;)
	{
		const square = mul(x, x, workingContext);
		const scaledSquare = mul(square, eight, workingContext);
		const innerPolynomial = sub(eight, scaledSquare, workingContext);
		const correction = mul(square, innerPolynomial, workingContext);
		x = sub(one, correction, workingContext);
	}

	return finalise(x, resultPrecision, rounding, true, context);
}
