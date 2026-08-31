import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { invalidArgumentError, prefixedExpansionLimitError } from "../../errors.js";
import { checkOverflow } from "./check-overflow.js";
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';

const NUMERALS = '0123456789abcdef';
const LOG10_2_NUMERATOR = 3010299956639812n;
const LOG10_2_SCALE = 10000000000000000n;
const LOG10_2 = Number(LOG10_2_NUMERATOR) / Number(LOG10_2_SCALE);
const LOG10_5 = 1 - LOG10_2;
const MAX_SAFE_BIGINT = BigInt(Number.MAX_SAFE_INTEGER);
const isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i;
const isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
const isHexadecimal = /^0x([\da-f]+(\.[\da-f]*)?|\.[\da-f]+)(p[+-]?\d+)?$/i;
const isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i;

/** Parse a validated decimal, prefixed number, special value, or underscored numeric string. */
export function parseNumericString(x : Decimal, str : string, context : CalculationContext) : Decimal
{
	return isDecimal.test(str)
		? parseDecimal(x, str, context)
		: parseOther(x, str, context);
}

//
// Parse the value of a new Decimal `x` from string `str`.
//
export function parseDecimal(x: Decimal, str: string, context: CalculationContext): Decimal
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
function parseOther(x : Decimal, str : string, context : CalculationContext) : Decimal
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

	let base : number;

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

	let binaryExponent = 0n;
	let i = str.search(/p/i);

	if (i > 0)
	{
		binaryExponent = BigInt(str.slice(i + 1));
		str = str.substring(2, i);
	}
	else
	{
		str = str.slice(2);
	}

	const pointIndex = str.indexOf('.');
	const fractionDigits = pointIndex < 0 ? 0 : str.length - pointIndex - 1;

	if (pointIndex >= 0) str = str.replace('.', '');

	let significand = BigInt((base === 16 ? '0x' : base === 8 ? '0o' : '0b') + str);

	const sign = getDecimalState(x).s;
	if (significand === 0n) return context.create(sign * 0);

	const bitsPerDigit = base === 16 ? 4 : base === 8 ? 3 : 1;
	let significandBitLength = getBitLength(str, bitsPerDigit);
	let binaryShift = binaryExponent - BigInt(fractionDigits * bitsPerDigit);
	const bitExponent = BigInt(significandBitLength - 1) + binaryShift;

	// Remove factors of two which would otherwise become unnecessary factors of five below.
	if (binaryShift < 0)
	{
		const trailingZeroBits = BigInt(getTrailingZeroBits(str, bitsPerDigit));
		const removableBits = trailingZeroBits < -binaryShift ? trailingZeroBits : -binaryShift;

		if (removableBits)
		{
			significand >>= removableBits;
			binaryShift += removableBits;
			significandBitLength -= Number(removableBits);
		}
	}

	if (context.external)
	{
		const range = getExponentRange(bitExponent, context);

		if (range) return context.create(range > 0 ? sign / 0 : sign * 0);
	}

	// A shift this large cannot be represented by an in-memory JavaScript string. In practice the
	// exponent-range check above handles all externally constructed values before this point.
	if (binaryShift > MAX_SAFE_BIGINT || binaryShift < -MAX_SAFE_BIGINT)
	{
		return context.create(binaryShift > 0 ? sign / 0 : sign * 0);
	}

	assertExpansionWithinLimit(significandBitLength, binaryShift, context);

	const coefficient = binaryShift < 0
		? (significand * 5n ** -binaryShift).toString()
		: (significand << binaryShift).toString();

	if (coefficient.length > context.config.maxPrefixedDigits)
	{
		throw prefixedExpansionLimitError(context.config.maxPrefixedDigits);
	}

	const decimal = binaryShift < 0 ? coefficient + 'e' + binaryShift : coefficient;

	return parseDecimal(x, decimal, context);
}

function assertExpansionWithinLimit(
	significandBitLength : number,
	binaryShift : bigint,
	context : CalculationContext
) : void
{
	const shift = Number(binaryShift < 0 ? -binaryShift : binaryShift);
	const estimatedDigits = Math.ceil(
		significandBitLength * LOG10_2 + shift * (binaryShift < 0 ? LOG10_5 : LOG10_2)
	);

	// One digit of slack avoids rejecting a boundary value because the logarithmic estimate is an
	// upper bound. Values near the boundary are checked exactly after expansion.
	if (estimatedDigits > context.config.maxPrefixedDigits + 1)
	{
		throw prefixedExpansionLimitError(context.config.maxPrefixedDigits);
	}
}

function getBitLength(str : string, bitsPerDigit : number) : number
{
	let i = 0;

	while (str.charCodeAt(i) === 48) i++;

	const firstDigit = NUMERALS.indexOf(str.charAt(i));

	return (str.length - i - 1) * bitsPerDigit + 32 - Math.clz32(firstDigit);
}

function getTrailingZeroBits(str : string, bitsPerDigit : number) : number
{
	let i = str.length - 1;
	let bits = 0;

	while (str.charCodeAt(i) === 48)
	{
		bits += bitsPerDigit;
		i--;
	}

	let digit = NUMERALS.indexOf(str.charAt(i));

	while ((digit & 1) === 0)
	{
		bits++;
		digit /= 2;
	}

	return bits;
}

function getExponentRange(bitExponent : bigint, context : CalculationContext) : -1 | 0 | 1
{
	const estimate = bitExponent * LOG10_2_NUMERATOR;
	const maximum = (BigInt(context.config.maxE) + 2n) * LOG10_2_SCALE;
	const minimum = (BigInt(context.config.minE) - 2n) * LOG10_2_SCALE;

	return estimate > maximum ? 1 : estimate < minimum ? -1 : 0;
}
