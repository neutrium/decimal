import type { KernelDecimal } from "../../KernelDecimal.js";
import type { DecimalValue } from "../../DecimalBase.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { getDecimalState } from '../../DecimalState.js';
import { normaliseOperand } from '../utils/normalise-operand.js';
import { compareMagnitudes } from '../utils/coefficients/compare.js';

//
// Return
//   1    if the value of `x` is greater than the value of `y`,
//  -1    if the value of `x` is less than the value of `y`,
//   0    if they have the same value,
//   NaN  if the value of either Decimal is NaN.
//
export function cmp(x: KernelDecimal, w : DecimalValue, context : CalculationContext) : number
{
	return compareDecimals(x, normaliseOperand(w, context));
}

/** Compare two already-normalized Decimal values without cloning either operand. */
export function compareDecimals(x : KernelDecimal, y : KernelDecimal) : number
{
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);
	const xd = xState.d,
		yd = yState.d,
		xs = xState.s,
		ys = yState.s;

	// Either NaN or ±Infinity?
	if (!xd || !yd)
	{
		return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd !== xs < 0 ? 1 : -1;
	}

	// Either zero?
	if (!xd[0] || !yd[0])
	{
		return xd[0] ? xs : yd[0] ? -ys : 0;
	}

	// Signs differ?
	if (xs !== ys)
	{
		return xs;
	}

	const magnitude = compareMagnitudes(xd, xState.e, yd, yState.e);
	// Preserve positive zero for equality, including two negative operands.
	return magnitude === 0 ? 0 : magnitude * xs;
}
