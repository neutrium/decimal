import { Decimal } from "../../Decimal.js";
import { errors } from "../../errors.js";
import { checkOverflow } from "./check-overflow.js";
//
// Parse the value of a new Decimal `x` from string `str`.
//
export function parseDecimal(x: Decimal, str: string)
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
	if (str === 'Infinity' || str === 'NaN')
	{
		if (!+str) x.s = NaN;
		x.e = NaN;
		x.d = null;
		return x;
	}
	else
	{
		throw Error(errors.INVAILD_ARG_ERROR_STR + str);
	}
}