import { Decimal } from "../../Decimal.js";


//
// Return true if the value of x Decimal is a finite number, otherwise return false.
//
export function isFinite(x: Decimal) : boolean
{
	return !!x.d;
}

//
// Return true if the value of x Decimal is an integer, otherwise return false.
//
export function isInt(x: Decimal) : boolean
{
	return !!x.d && Math.floor(x.e / Decimal.params.LOG_BASE) > x.d.length - 2;
}

//
// Return true if the value of x Decimal is NaN, otherwise return false.
//
export function isNaN(x: Decimal) : boolean
{
	return !x.s;
}

//
// Return true if the value of x Decimal is negative, otherwise return false.
//
export function isNeg(x: Decimal) : boolean
{
	return x.s < 0;
}

//
// Return true if the value of x Decimal is positive, otherwise return false.
//
export function isPos(x: Decimal) : boolean
{
	return x.s > 0;
}

//
// Return true if the value of x Decimal is 0 or -0, otherwise return false.
//
export function isZero(x: Decimal) : boolean
{
	return !!x.d && x.d[0] === 0;
}

export function isOdd(n : Decimal) : boolean
{
	return (n.d[n.d.length - 1] & 1) === 1;
}

export function isEven(n : Decimal) : boolean
{
	return (n.d[n.d.length - 1] & 1) === 0;
}