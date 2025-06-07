import { Decimal } from "../../Decimal.js";
import { checkInt32 } from "../utils/check-int.js";
import { finalise } from "../utils/finalise.js";

//
// Return a new Decimal whose value is the value of this Decimal rounded to a maximum of `sd`
// significant digits using rounding mode `rm`, or to `precision` and `rounding` respectively if
// omitted.
//
// [sd] {number} Significant digits. Integer, 1 to MAX_DIGITS inclusive.
// [rm] {number} Rounding mode. Integer, 0 to 8 inclusive.
//
// 'toSD() digits out of range: {sd}'
// 'toSD() digits not an integer: {sd}'
// 'toSD() rounding mode not an integer: {rm}'
// 'toSD() rounding mode out of range: {rm}'
//
export function toSignificantDigits(x: Decimal, sd : number = Decimal.precision, rm : number = Decimal.rounding) : Decimal
{
	checkInt32(sd, 1, Decimal.params.MAX_DIGITS);
	checkInt32(rm, 0, 8);

	return finalise(new Decimal(x), sd, rm);
}