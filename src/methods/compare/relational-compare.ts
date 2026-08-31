import type { Decimal, DecimalValue } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { getDecimalState } from '../../DecimalState.js';
import { normaliseOperand } from '../utils/normalise-operand.js';

//
// Return
//   1    if the value of `x` is greater than the value of `y`,
//  -1    if the value of `x` is less than the value of `y`,
//   0    if they have the same value,
//   NaN  if the value of either Decimal is NaN.
//
export function cmp(x: Decimal, w : DecimalValue, context : CalculationContext) : number
{
	return compareDecimals(x, normaliseOperand(w, context));
}

/** Compare two already-normalized Decimal values without cloning either operand. */
export function compareDecimals(x : Decimal, y : Decimal) : number
{
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);
	let xdL, ydL,
		xd = xState.d,
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

	// Compare exponents.
	if (xState.e !== yState.e)
	{
		return xState.e > yState.e !== xs < 0 ? 1 : -1;
	}

	xdL = xd.length;
	ydL = yd.length;

	// Compare digit by digit.
	for (let i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i)
	{
		if (xd[i] !== yd[i]) return xd[i]! > yd[i]! !== xs < 0 ? 1 : -1;
	}

	// Compare lengths.
	return xdL === ydL ? 0 : xdL > ydL !== xs < 0 ? 1 : -1;
}
