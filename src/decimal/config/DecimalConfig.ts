import { DecimalRoundingModes } from "./RoundingModes.js";

//
// Configure global settings for a Decimal constructor.
//

export type DecimalConfig = {

	// The maximum number of significant digits of the result of a calculation or base conversion.
	// E.g. `Decimal.config({ precision: 20 });`
	'precision': number;

	//
	// The rounding mode used when rounding to `precision`.
	// E.g. `config.rounding = DecimalRoundingModes.ROUND_HALF_UP;`
	// Values: 0 to 8
	'rounding': DecimalRoundingModes;

	// The modulo mode used when calculating the modulus: a mod n.
	// The quotient (q = a / n) is calculated according to the corresponding rounding mode.
	// The remainder (r) is calculated as: r = a - n * q.
	//
	// UP         0 The remainder is positive if the dividend is negative, else is negative.
	// DOWN       1 The remainder has the same sign as the dividend (JavaScript %).
	// FLOOR      3 The remainder has the same sign as the divisor (Python %).
	// HALF_EVEN  6 The IEEE 754 remainder function.
	// EUCLID     9 Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
	//
	// Truncated division (1), floored division (3), the IEEE 754 remainder (6), and Euclidian
	// division (9) are commonly used for the modulus operation. The other rounding modes can also
	// be used, but they may not give useful results.
	// Values: 0 to 9
	'modulo': DecimalRoundingModes;

	// The exponent value at and beneath which `toString` returns exponential notation.
	// JavaScript numbers: -7
	// Values: 0 to -EXP_LIMIT
	'toExpNeg': number;

	// The exponent value at and above which `toString` returns exponential notation.
	// JavaScript numbers: 21
	// Values: 0 to EXP_LIMIT
	'toExpPos': number;

	// The maximum exponent value, above which overflow to Infinity occurs.
	// JavaScript numbers: 308  (1.7976931348623157e+308)
	// Values: 1 to EXP_LIMIT
	'maxE': number;

	// The minimum exponent value, beneath which underflow to zero occurs.
	// JavaScript numbers: -324  (5e-324)
	// Values: -1 to -EXP_LIMIT
	'minE': number;
}
