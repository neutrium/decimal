import { Decimal } from "../../Decimal.js";

//
// Calculate the base 10 exponent from the base 1e7 exponent.
//
export function getBase10Exponent(digits : number[], e : number) : number
{
	// First get the number of digits of the first word of the digits array.
	for (var i = 1, w = digits[0]; w >= 10; w /= 10) i++;

	return i + e * Decimal.params.LOG_BASE - 1;
}