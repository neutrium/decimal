import type { Decimal } from "../../Decimal.js";
import { getZeroString } from "../utils/get-zero-string.js";
import { digitsToString } from "../utils/digits-to-string.js";
import { isFinite } from "../compare/identity-compare.js";
import { getPrecision } from '../utils/get-precision.js';
import { outputDigitLimitError } from '../../errors.js';
import { DecimalConstants } from '../../InternalConstants.js';
import { getDecimalState } from '../../DecimalState.js';

/** Public formatting policy, kept off the context-free numeric-conversion path. */
export function formatFinite(x: Decimal, isExp: boolean | undefined, sd: number | undefined, maxDigits: number): string
{
	const { d, e } = getDecimalState(x);

	// Count mantissa digits before formatting the coefficient or allocating any padding.
	// Sign, decimal point, and the compact scientific exponent do not count toward the limit.
	if (d)
	{
		// The cheap word-count bound avoids counting individual digits on ordinary output.
		const upper = Math.max(d.length * DecimalConstants.LOG_BASE, sd || 0);
		const bound = isExp ? upper : e < 0 ? upper - e : Math.max(upper, e + 1);

		if (bound > maxDigits)
		{
			const significantDigits = Math.max(getPrecision(d), sd || 0);
			const outputDigits = isExp ? significantDigits
				: e < 0 ? significantDigits - e
				: Math.max(significantDigits, e + 1);
			if (outputDigits > maxDigits) throw outputDigitLimitError(maxDigits);
		}
	}

	return finiteToString(x, isExp, sd);
}

export function finiteToString(x : Decimal, isExp? : boolean, sd? : number) : string
{
	const state = getDecimalState(x);

	if (!isFinite(x))
	{
		return nonFiniteToString(x);
	}

	let k,
		e = state.e,
		str = digitsToString(state.d),
		len = str.length;

	if (isExp)
	{
		if (sd && (k = sd - len) > 0)
		{
			str = str.charAt(0) + '.' + str.slice(1) + getZeroString(k);
		}
		else if (len > 1)
		{
			str = str.charAt(0) + '.' + str.slice(1);
		}

		str = str + (state.e < 0 ? 'e' : 'e+') + state.e;
	}
	else if (e < 0)
	{
		str = '0.' + getZeroString(-e - 1) + str;

		if (sd && (k = sd - len) > 0)
		{
			str += getZeroString(k);
		}
	}
	else if (e >= len)
	{
		str += getZeroString(e + 1 - len);

		if (sd && (k = sd - e - 1) > 0)
		{
			str = str + '.' + getZeroString(k);
		}
	}
	else
	{
		if ((k = e + 1) < len)
		{
			str = str.slice(0, k) + '.' + str.slice(k);
		}

		if (sd && (k = sd - len) > 0)
		{
			if (e + 1 === len) str += '.';
			str += getZeroString(k);
		}
	}

	return str;
}

//
// ±Infinity, NaN.
//
function nonFiniteToString(x : Decimal) : string
{
	// Unsigned.
	const s = getDecimalState(x).s;
	return String(s * s / 0);
}
