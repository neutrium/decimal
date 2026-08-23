import { Decimal } from "../../Decimal.js";
import { errors } from "../../errors.js";
import { divide } from "../arithmetic/div.js";
import { checkOverflow } from "./check-overflow.js";

const NUMERALS = '0123456789abcdef';
const isBinary = /^0b([01]+(\.[01]*)?|\.[01]+)(p[+-]?\d+)?$/i;
const isDecimal = /^(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
const isHexadecimal = /^0x([\da-f]+(\.[\da-f]*)?|\.[\da-f]+)(p[+-]?\d+)?$/i;
const isOctal = /^0o([0-7]+(\.[0-7]*)?|\.[0-7]+)(p[+-]?\d+)?$/i;
//
// Parse the value of a new Decimal `x` from string `str`.
//
export function parseDecimal(x: Decimal, str: string): Decimal
{
	let e : number,
		i : number,
		len : number,
		LOG_BASE = Decimal.params.LOG_BASE;

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
		x.e = e = e - i - 1;
		x.d = [];

		// Transform base

		// e is the base 10 exponent.
		// i is where to slice str to get the first word of the digits array.
		i = (e + 1) % LOG_BASE;
		if (e < 0) i += LOG_BASE;

		if (i < len)
		{
			if (i) x.d.push(+str.slice(0, i));
			for (len -= LOG_BASE; i < len;) x.d.push(+str.slice(i, i += LOG_BASE));
			str = str.slice(i);
			i = LOG_BASE - str.length;
		}
		else
		{
			i -= len;
		}

		for (; i--;) str += '0';
		x.d.push(+str);

		x = checkOverflow(x);
	}
	else
	{
		// Zero.
		x.e = 0;
		x.d = [0];
	}

	return x;
}

//
// Parse the value of a new Decimal `x` from a string `str`, which is not a decimal value.
//
export function parseOther(x : Decimal, str : string) : Decimal
{
	if (str.indexOf('_') > -1)
	{
		const digit = str.slice(0, 2).toLowerCase() === '0x'
			? /[\da-f]/i
			: str.slice(0, 2).toLowerCase() === '0b'
				? /[01]/
				: str.slice(0, 2).toLowerCase() === '0o'
					? /[0-7]/
					: /\d/;

		for (let i = str.indexOf('_'); i > -1; i = str.indexOf('_', i + 1))
		{
			if (!digit.test(str.charAt(i - 1)) || !digit.test(str.charAt(i + 1)))
			{
				throw Error(errors.INVAILD_ARG_ERROR_STR + str);
			}
		}

		str = str.replace(/_/g, '');

		if (isDecimal.test(str)) return parseDecimal(x, str);
	}

	if (str === 'Infinity' || str === 'NaN')
	{
		if (!+str) x.s = NaN;
		x.e = NaN;
		x.d = null;
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
		throw Error(errors.INVAILD_ARG_ERROR_STR + str);
	}

	let binaryExponent = 0;
	let i = str.search(/p/i);

	if (i > 0)
	{
		binaryExponent = +str.slice(i + 1);
		str = str.substring(2, i);
	}
	else
	{
		str = str.slice(2);
	}

	const pointIndex = str.indexOf('.');
	const isFloat = pointIndex >= 0;
	let divisor : Decimal | undefined;

	if (isFloat)
	{
		str = str.replace('.', '');
		divisor = integerPower(base, str.length - pointIndex);
	}

	const digits = convertBase(str, base, Decimal.params.BASE);
	const exponent = digits.length - 1;

	for (i = exponent; digits[i] === 0; --i) digits.pop();

	const Constructor = x.constructor as typeof Decimal;

	if (i < 0) return new Constructor(x.s * 0);

	x.e = getBase10Exponent(digits, exponent);
	x.d = digits;

	const previousExternal = Decimal.external;
	Decimal.external = false;

	try
	{
		if (divisor) x = divide(x, divisor, str.length * 4);

		if (binaryExponent)
		{
			x = x.mul(Math.abs(binaryExponent) < 54
				? Math.pow(2, binaryExponent)
				: new Constructor(2).pow(binaryExponent));
		}
	}
	finally
	{
		Decimal.external = previousExternal;
	}

	return previousExternal ? checkOverflow(x) : x;
}

// Convert a string in `baseIn` to an array of words in `baseOut`.
function convertBase(str : string, baseIn : number, baseOut : number) : number[]
{
	const result = [0];

	for (let i = 0; i < str.length; i++)
	{
		for (let j = result.length; j--;) result[j] = result[j]! * baseIn;

		result[0] = result[0]! + NUMERALS.indexOf(str.charAt(i));

		for (let j = 0; j < result.length; j++)
		{
			if (result[j]! > baseOut - 1)
			{
				if (result[j + 1] === undefined) result[j + 1] = 0;
				result[j + 1] = result[j + 1]! + (result[j]! / baseOut | 0);
				result[j] = result[j]! % baseOut;
			}
		}
	}

	return result.reverse();
}

function getBase10Exponent(digits : number[], exponent : number) : number
{
	let length = 1;

	for (let word = digits[0]!; word >= 10; word /= 10) length++;

	return length + exponent * Decimal.params.LOG_BASE - 1;
}

function integerPower(base : number, exponent : number) : Decimal
{
	let result = new Decimal(1);
	let factor = new Decimal(base);
	const previousExternal = Decimal.external;

	Decimal.external = false;

	try
	{
		while (exponent > 0)
		{
			if (exponent % 2) result = result.mul(factor);
			exponent = Math.floor(exponent / 2);
			if (exponent) factor = factor.mul(factor);
		}
	}
	finally
	{
		Decimal.external = previousExternal;
	}

	return result;
}
