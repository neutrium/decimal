import { Decimal } from "../../Decimal.js";

//
// Return
//   1    if the value of `x` is greater than the value of `y`,
//  -1    if the value of `x` is less than the value of `y`,
//   0    if they have the same value,
//   NaN  if the value of either Decimal is NaN.
//
export function cmp(x: Decimal, w : string | number | Decimal) : number
{
	let xdL, ydL,
		xd = x.d,
		y = new Decimal(w),
		yd = y.d,
		xs = x.s,
		ys = y.s;

	// Either NaN or ±Infinity?
	if (!xd || !yd)
	{
		return !xs || !ys ? NaN : xs !== ys ? xs : xd === yd ? 0 : !xd !== xs < 0 ? 1 : -1;
	}

	// Either zero?
	if (!xd[0] || !yd[0]) return xd[0] ? xs : yd[0] ? -ys : 0;

	// Signs differ?
	if (xs !== ys) return xs;

	// Compare exponents.
	if (x.e !== y.e)
	{
		// Toto - remove ref return x.e > y.e ^ xs < 0 ? 1 : -1;
		return x.e > y.e !== xs < 0 ? 1 : -1;
	}

	xdL = xd.length;
	ydL = yd.length;

	// Compare digit by digit.
	for (let i = 0, j = xdL < ydL ? xdL : ydL; i < j; ++i)
	{
		if (xd[i] !== yd[i]) return xd[i] > yd[i] !== xs < 0 ? 1 : -1;
	}

	// Compare lengths.
	return xdL === ydL ? 0 : xdL > ydL !== xs < 0 ? 1 : -1;
}

//
// Return true if the value of `x` is equal to the value of `y`, otherwise return false.
//
export function eq(x: Decimal, y : string | number | Decimal) : boolean
{
	return x.cmp(y) === 0;
}

//
// Return true if the value of `x` is greater than the value of `y`, otherwise return false.
//
export function gt(x: Decimal, y : string | number | Decimal) : boolean
{
	return x.cmp(y) > 0;
}

//
// Return true if the value of `x` is greater than or equal to the value of `y`,
// otherwise return false.
//
export function gte(x: Decimal, y : string | number | Decimal) : boolean
{
	let k = x.cmp(y);

	return k == 1 || k === 0;
}

//
// Return true if the value of `x` is less than `y`, otherwise return false.
//
export function lt(x: Decimal, y : string | number | Decimal) : boolean
{
	return x.cmp(y) < 0;
}

//
// Return true if the value of `x` is less than or equal to `y`, otherwise return false.
//
export function lte(x: Decimal, y : string | number | Decimal) : boolean
{
	return x.cmp(y) < 1;
}