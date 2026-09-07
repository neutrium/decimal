import type { KernelDecimal } from "../../KernelDecimal.js";
import type { DecimalValue, DecimalValueIterable } from "../../DecimalBase.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { compareDecimals } from "./relational-compare.js";
import { getDecimalState } from '../../DecimalState.js';
import { normaliseOperand } from '../utils/normalise-operand.js';
import { invalidArgumentError } from '../../errors.js';

//
// Return a new Decimal whose value is the maximum of the arguments and the value of this Decimal.
// arguments {DecimalValue}
//
export function max(
	value : DecimalValue | DecimalValueIterable,
	context : CalculationContext,
	...values : DecimalValue[]
) : KernelDecimal
{
	return dispatchMaxOrMin(value, values, -1, context);
}

//
// Return a new Decimal whose value is the minimum of the arguments and the value of this Decimal.
// arguments {DecimalValue}
//
export function min(
	value : DecimalValue | DecimalValueIterable,
	context : CalculationContext,
	...values : DecimalValue[]
) : KernelDecimal
{
	return dispatchMaxOrMin(value, values, 1, context);
}

function dispatchMaxOrMin(
	value : DecimalValue | DecimalValueIterable,
	values : readonly DecimalValue[],
	direction : number,
	context : CalculationContext
) : KernelDecimal
{
	if (isDecimalValueIterable(value))
	{
		if (values.length)
		{
			throw invalidArgumentError(values, 'additional arguments with iterable');
		}

		return maxOrMinIterable(value, direction, context);
	}

	return maxOrMin(value as DecimalValue, values, direction, context);
}

//
// Handle `max` and `min` using `n` as the comparison direction.
//
function maxOrMin(value : DecimalValue, values : readonly DecimalValue[], n : number, context : CalculationContext) : KernelDecimal
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

function maxOrMinIterable(
	values : DecimalValueIterable,
	direction : number,
	context : CalculationContext
) : KernelDecimal
{
	let selected : KernelDecimal | undefined;

	for (const candidate of values)
	{
		const value = normaliseOperand(candidate, context);

		if (!getDecimalState(value).s)
		{
			return context.create(value);
		}

		selected = selected === void 0
			? value
			: select(selected, value, direction);
	}

	if (selected === void 0)
	{
		throw invalidArgumentError(values, 'non-empty iterable');
	}

	return context.create(selected);
}

function isDecimalValueIterable(value : unknown) : value is DecimalValueIterable
{
	return value !== null &&
		typeof value !== 'string' &&
		!(value instanceof String) &&
		(typeof value === 'object' || typeof value === 'function') &&
		typeof (value as { [Symbol.iterator]?: unknown })[Symbol.iterator] === 'function';
}

function select(x : KernelDecimal, y : KernelDecimal, direction : number) : KernelDecimal
{
	const comparison = compareDecimals(x, y);

	return comparison === direction || comparison === 0 && getDecimalState(x).s === direction ? y : x;
}
