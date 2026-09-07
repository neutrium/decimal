import { DecimalConstants } from "../../InternalConstants.js";
import type { KernelDecimal } from "../../KernelDecimal.js";
import { getDecimalState } from '../../DecimalState.js';


//
// Return true if the value of x Decimal is a finite number, otherwise return false.
//
export function isFinite(x: KernelDecimal) : boolean
{
	return !!getDecimalState(x).d;
}

//
// Return true if the value of x Decimal is an integer, otherwise return false.
//
export function isInt(x: KernelDecimal) : boolean
{
	const { d, e } = getDecimalState(x);
	return !!d && Math.floor(e / DecimalConstants.LOG_BASE) > d.length - 2;
}

//
// Return true if the value of x Decimal is NaN, otherwise return false.
//
export function isNaN(x: KernelDecimal) : boolean
{
	return !getDecimalState(x).s;
}

//
// Return true if the value of x Decimal is negative, otherwise return false.
//
export function isNeg(x: KernelDecimal) : boolean
{
	return getDecimalState(x).s < 0;
}

//
// Return true if the value of x Decimal is positive, otherwise return false.
//
export function isPos(x: KernelDecimal) : boolean
{
	return getDecimalState(x).s > 0;
}

//
// Return true if the value of x Decimal is 0 or -0, otherwise return false.
//
export function isZero(x: KernelDecimal) : boolean
{
	const d = getDecimalState(x).d;
	return !!d && d[0] === 0;
}

export function isOdd(n : KernelDecimal) : boolean
{
	const { d, e } = getDecimalState(n);

	return !!d && isInt(n) && Math.floor(e / DecimalConstants.LOG_BASE) === d.length - 1 &&
		(d[d.length - 1]! & 1) === 1;
}

export function isEven(n : KernelDecimal) : boolean
{
	const { d, e } = getDecimalState(n);

	return !!d && isInt(n) && (Math.floor(e / DecimalConstants.LOG_BASE) > d.length - 1 ||
		(d[d.length - 1]! & 1) === 0);
}
