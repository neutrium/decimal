import type { CalculationContext } from '../../CalculationContext.js';
import type { Decimal } from '../../Decimal.js';
import { getDecimalState } from '../../DecimalState.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { add, sub } from "../arithmetic/add-subtract.js";
import { mul } from '../arithmetic/mul.js';
import { isFinite } from '../compare/identity-compare.js';
import { compareDecimals } from '../compare/relational-compare.js';
import { naturalLogarithm } from '../exponential/ln.js';
import { sqrt } from '../power/sqrt.js';
import { precision } from '../utils/precision.js';

// Return the inverse hyperbolic cosine of x.
export function acosh(x: Decimal, context: CalculationContext): Decimal
{
	const one = context.create(1);
	const comparison = compareDecimals(x, one);

	if (comparison < 1)
	{
		return context.create(comparison === 0 ? 0 : NaN);
	}

	if (!isFinite(x))
	{
		return context.create(x);
	}

	const workingContext = context.with({
		external: false,
		precision: context.precision + Math.max(Math.abs(getDecimalState(x).e), precision(x)) + 4,
		roundingCode: ROUND_DOWN
	});
	const squared = mul(x, x, workingContext);
	const radicand = sub(squared, 1, workingContext);
	const root = sqrt(radicand, workingContext);
	const logarithmArgument = add(root, x, workingContext);

	return naturalLogarithm(logarithmArgument, undefined, context);
}
