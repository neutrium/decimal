import type { CalculationContext } from '../../CalculationContext.js';
import type { KernelDecimal } from '../../KernelDecimal.js';
import { getDecimalState } from '../../DecimalState.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { add } from "../arithmetic/add-subtract.js";
import { mul } from '../arithmetic/mul.js';
import { isFinite, isZero } from '../compare/identity-compare.js';
import { naturalLogarithm } from '../exponential/ln.js';
import { sqrt } from '../power/sqrt.js';
import { precision } from '../utils/precision.js';

// Return the inverse hyperbolic sine of x.
export function asinh(x: KernelDecimal, context: CalculationContext): KernelDecimal
{
	if (!isFinite(x) || isZero(x))
	{
		return context.create(x);
	}

	const workingContext = context.with({
		boundary: 'intermediate',
		precision: context.precision + 2 * Math.max(Math.abs(getDecimalState(x).e), precision(x)) + 6,
		roundingCode: ROUND_DOWN
	});
	const squared = mul(x, x, workingContext);
	const radicand = add(squared, 1, workingContext);
	const root = sqrt(radicand, workingContext);
	const logarithmArgument = add(root, x, workingContext);

	return naturalLogarithm(logarithmArgument, undefined, context);
}
