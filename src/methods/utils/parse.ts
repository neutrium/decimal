import { DecimalConstants } from "../../InternalConstants.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { invalidArgumentError, prefixedExpansionLimitError } from "../../errors.js";
import { checkOverflow } from "./check-overflow.js";
import { binaryExponentRange, decodePrefixedCoefficient, expandBinaryCoefficient } from './coefficients/prefixed.js';
import { getMutableDecimalState, type InternalDecimal } from '../../DecimalState.js';

const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i;
const isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
const isHexadecimal = /^0x([\da-f]+(\.[\da-f]*)?|\.[\da-f]+)(p[+-]?\d+)?$/i;
const isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i;

/** @internal Parse a validated decimal, prefixed number, special value, or underscored numeric string. */
export function parseNumericString<T extends InternalDecimal>(x : T, str : string, context : CalculationContext) : T
{
	return isDecimal.test(str)
		? parseDecimal(x, str, context)
		: parseOther(x, str, context);
}

/** @internal Parse the value of a new Decimal `x` from string `str`. */
export function parseDecimal<T extends InternalDecimal>(x: T, str: string, context: CalculationContext): T
{
	const state = getMutableDecimalState(x);
	let e : number,
		i : number,
		len : number,
		LOG_BASE = DecimalConstants.LOG_BASE;

	// Decimal point?
	if ((e = str.indexOf('.')) > -1) str = str.replace('.', '');

	// Exponential form?
	if ((i = str.search(/e/i)) > 0)
	{
		// Determine exponent.
		if (e < 0) e = i;
		e += +str.slice(i + 1);
		str = str.substring(0, i);
	}
	else if (e < 0)
	{
		// Integer.
		e = str.length;
	}

	// Determine leading zeros.
	for (i = 0; str.charCodeAt(i) === 48; i++);

	// Determine trailing zeros.
	for (len = str.length; str.charCodeAt(len - 1) === 48; --len);
	str = str.slice(i, len);

	if (str)
	{
		len -= i;
		state.e = e = e - i - 1;
		state.d = [];

		// Transform base

		// e is the base 10 exponent.
		// i is where to slice str to get the first word of the digits array.
		i = (e + 1) % LOG_BASE;
		if (e < 0) i += LOG_BASE;

		if (i < len)
		{
			if (i) state.d.push(+str.slice(0, i));
			for (len -= LOG_BASE; i < len;) state.d.push(+str.slice(i, i += LOG_BASE));
			str = str.slice(i);
			i = LOG_BASE - str.length;
		}
		else
		{
			i -= len;
		}

		for (; i--;) str += '0';
		state.d.push(+str);

		x = checkOverflow(x, context);
	}
	else
	{
		// Zero.
		state.e = 0;
		state.d = [0];
	}

	return x;
}

//
// Parse the value of a new Decimal `x` from a string `str`, which is not a decimal value.
//
function parseOther<T extends InternalDecimal>(x : T, str : string, context : CalculationContext) : T
{
	const state = getMutableDecimalState(x);
	if (str.indexOf('_') > -1)
	{
		const prefix = str.slice(0, 2).toLowerCase();
		const prefixed = prefix === '0x' || prefix === '0b' || prefix === '0o';
		const exponentIndex = str.search(prefixed ? /p/i : /e/i);
		const significandDigit = prefix === '0x'
			? /[\da-f]/i
			: prefix === '0b'
				? /[01]/
				: prefix === '0o'
					? /[0-7]/
					: /\d/;

		for (let i = str.indexOf('_'); i > -1; i = str.indexOf('_', i + 1))
		{
			// A p exponent is written in decimal, regardless of the significand's radix.
			const digit = exponentIndex >= 0 && i > exponentIndex ? /\d/ : significandDigit;
			if (!digit.test(str.charAt(i - 1)) || !digit.test(str.charAt(i + 1)))
			{
				throw invalidArgumentError(str);
			}
		}

		str = str.replace(/_/g, '');

		if (isDecimal.test(str)) return parseDecimal(x, str, context);
	}

	if (str === 'Infinity' || str === 'NaN')
	{
		if (!+str) state.s = NaN;
		state.e = NaN;
		state.d = null;
		return x;
	}

	let base : 2 | 8 | 16;

	if (isHexadecimal.test(str))
	{
		base = 16;
		str = str.toLowerCase();
	}
	else if (isBinary.test(str))
	{
		base = 2;
	}
	else if (isOctal.test(str))
	{
		base = 8;
	}
	else
	{
		throw invalidArgumentError(str);
	}

	const sign = state.s;
	const coefficient = decodePrefixedCoefficient(str, base);
	if (!coefficient) return context.create(sign * 0) as unknown as T;

	if ((context.boundary === 'public'))
	{
		const range = binaryExponentRange(coefficient.bitExponent, context.config.minE, context.config.maxE);
		if (range) return context.create(range > 0 ? sign / 0 : sign * 0) as unknown as T;
	}

	// A shift this large cannot be represented by an in-memory JavaScript string.
	// External values normally reach their configured exponent limit first.
	const { binaryShift } = coefficient;
	if (binaryShift > MAX_SAFE_BIGINT || binaryShift < -MAX_SAFE_BIGINT)
	{
		return context.create(binaryShift > 0 ? sign / 0 : sign * 0) as unknown as T;
	}

	const decimal = expandBinaryCoefficient(coefficient, context.config.maxPrefixedDigits);
	if (decimal === undefined) throw prefixedExpansionLimitError(context.config.maxPrefixedDigits);

	return parseDecimal(x, decimal, context);
}
