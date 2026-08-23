import { Decimal, type DecimalValue, type DecimalValueCollection } from "../../Decimal.js";

//
// Return a new Decimal whose value is the maximum of the arguments and the value of this Decimal.
// arguments {DecimalValueCollection}
//
export function max(value: DecimalValue, ...values: DecimalValueCollection[]) : Decimal
{
	return maxOrMin(flattenValues(value, values), -1);
}

//
// Return a new Decimal whose value is the minimum of the arguments and the value of this Decimal.
// arguments {DecimalValueCollection}
//
export function min(value: DecimalValue, ...values: DecimalValueCollection[]) : Decimal
{
	return maxOrMin(flattenValues(value, values), 1);
}

function flattenValues(
	value: DecimalValue,
	values: readonly DecimalValueCollection[]
) : [DecimalValue, ...DecimalValue[]]
{
	const flattened: [DecimalValue, ...DecimalValue[]] = [value];

	for (const candidate of values)
	{
		// Array.prototype.flat skips holes; forEach preserves that existing behaviour.
		if (isDecimalValueArray(candidate)) candidate.forEach(item => flattened.push(item));
		else flattened.push(candidate);
	}

	return flattened;
}

function isDecimalValueArray(value: DecimalValueCollection) : value is readonly DecimalValue[]
{
	return Array.isArray(value);
}

//
// Handle `max` and `min`. `ltgt` is 'lt' or 'gt'.
//
function maxOrMin(values : [DecimalValue, ...DecimalValue[]], n : number) : Decimal
{
	let y, k,
		x = new Decimal(values[0]),
		i = 0;

	for (; ++i < values.length;)
	{
		y = new Decimal(values[i]!);


		if (!y.s)
		{
			x = y;
			break;
		}

		k = x.cmp(y)

		if (k === n || k === 0 && x.s === n)
		{
			x = y;
		}
	}

	return x;
}
