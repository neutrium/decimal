import type { Decimal, DecimalValue } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { compareDecimals } from "./relational-compare.js";
import { getDecimalState } from '../../DecimalState.js';
import { normaliseOperand } from '../utils/normalise-operand.js';

//
// Return a new Decimal whose value is the maximum of the arguments and the value of this Decimal.
// arguments {DecimalValue}
//
export function max(value: DecimalValue, context: CalculationContext, ...values: DecimalValue[]) : Decimal
{
	return maxOrMin(value, values, -1, context);
}

//
// Return a new Decimal whose value is the minimum of the arguments and the value of this Decimal.
// arguments {DecimalValue}
//
export function min(value: DecimalValue, context: CalculationContext, ...values: DecimalValue[]) : Decimal
{
	return maxOrMin(value, values, 1, context);
}

//
// Handle `max` and `min` using `n` as the comparison direction.
//
function maxOrMin(value : DecimalValue, values : readonly DecimalValue[], n : number, context : CalculationContext) : Decimal
{
	let x = normaliseOperand(value, context);

	if (!getDecimalState(x).s)
	{
		return context.create(x);
	}

	for (const candidate of values)
	{
		const y = normaliseOperand(candidate, context);

		if (!getDecimalState(y).s)
		{
			return context.create(y);
		}

		x = select(x, y, n);
	}

	// Return an independent value belonging to the active constructor, even when the winner was
	// an existing Decimal from another constructor.
	return context.create(x);
}

function select(x : Decimal, y : Decimal, direction : number) : Decimal
{
	const comparison = compareDecimals(x, y);

	return comparison === direction || comparison === 0 && getDecimalState(x).s === direction ? y : x;
}
