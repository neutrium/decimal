import { Decimal } from "../../Decimal.js";
import { finalise } from "../utils/finalise.js";

//
// Return a new Decimal whose value is the value of `x` rounded to a whole number in the
// direction of positive Infinity.
//
export function ceil(x: Decimal) : Decimal
{
	return finalise(new Decimal(x), x.e + 1, 2);
}

//
// Return a new Decimal whose value is the value of `x` rounded to a whole number in the
// direction of negative Infinity.
//
export function floor(x: Decimal) : Decimal
{
	return finalise(new Decimal(x), x.e + 1, 3);
}

//
// Return a new Decimal whose value is the value of `x` rounded to a whole number using rounding mode `rounding`.
//
export function round(xx: Decimal) : Decimal
{
	let x = new Decimal(xx);

	return finalise(x, x.e + 1, Decimal.config.rounding);
}

