import type { CalculationContext } from './CalculationContext.js';
import { DecimalLike as DecimalBase, type DecimalValue } from './DecimalBase.js';
import {
	getDecimalState,
	getMutableDecimalState,
	type InternalDecimal
} from './DecimalState.js';
import { invalidArgumentError } from './errors.js';
import { checkOverflow } from './methods/utils/check-overflow.js';
import { parseDecimal, parseNumericString } from './methods/utils/parse.js';

/** @internal Initialise a value shared by every Decimal feature tier. */
export function initialiseDecimal<T extends InternalDecimal>(
	x : T,
	v : DecimalValue,
	context : CalculationContext
) : T
{
	let e : number;
	let i : number;
	const state = getMutableDecimalState(x);

	if (v instanceof DecimalBase)
	{
		let digits : readonly number[] | null;
		const source = getDecimalState(v);

		state.s = source.s;
		state.e = source.e;
		state.d = (digits = source.d) ? digits.slice() : digits;

		return checkOverflow(x, context);
	}

	if (typeof v === 'number')
	{
		let value : number;

		if (v === 0)
		{
			state.s = 1 / v < 0 ? -1 : 1;
			state.e = 0;
			state.d = [0];
			return x;
		}

		if (v < 0)
		{
			value = -v;
			state.s = -1;
		}
		else
		{
			value = v;
			state.s = 1;
		}

		if (value === ~~value && value < 1e7)
		{
			for (e = 0, i = value; i >= 10; i /= 10) e++;
			state.e = e;
			state.d = [value];
			return checkOverflow(x, context);
		}

		if (value * 0 !== 0)
		{
			if (!value) state.s = NaN;
			state.e = NaN;
			state.d = null;
			return x;
		}

		return parseDecimal(x, value.toString(), context);
	}

	if (typeof v === 'bigint')
	{
		const negative = v < 0n;
		state.s = negative ? -1 : 1;
		return parseDecimal(x, (negative ? -v : v).toString(), context);
	}

	if (typeof v === 'string')
	{
		let value : string;

		if (v.charCodeAt(0) === 45)
		{
			value = v.slice(1);
			state.s = -1;
		}
		else
		{
			value = v;
			state.s = 1;
		}

		return parseNumericString(x, value, context);
	}

	throw invalidArgumentError(v);
}
