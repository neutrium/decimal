import type { ModuloMode, RoundingMode } from "./RoundingModes.js";

//
// Configure global settings for a Decimal constructor.
//

/**
 * Complete configuration attached independently to each Decimal constructor.
 * Read the current frozen snapshot through `Decimal.config`; assign a
 * {@link DecimalConfigInput} to update selected settings.
 */
export type DecimalConfig = {

	// The maximum number of significant digits of the result of a calculation or base conversion.
	// E.g. `Decimal.config = { precision: 20 };`
	/** Maximum significant digits in calculation and base-conversion results. Integer from `1` to `Decimal.limits.maxDigits`; defaults to `20`. */
	'precision': number;

	/** Maximum decimal coefficient digits generated while parsing a prefixed number. Integer from `1` to `Decimal.limits.maxDigits`; defaults to `1_000_000`. */
	'maxPrefixedDigits': number;

	/** Maximum mantissa digits emitted by a public string-formatting operation. Integer from `1` to `Decimal.limits.maxDigits`; defaults to `1_000_000`. */
	'maxOutputDigits': number;

	//
	// The rounding mode used when rounding to `precision`.
	// E.g. `Decimal.config = { rounding: 'half-up' };`
	/** Rounding mode used when a method does not receive an explicit mode. Defaults to `'half-up'`. */
	'rounding': RoundingMode;

	// The modulo mode used when calculating the modulus: a mod n.
	// The quotient (q = a / n) is calculated according to the corresponding rounding mode.
	// The remainder (r) is calculated as: r = a - n * q.
	//
	// up        The remainder is positive if the dividend is negative, else is negative.
	// down      The remainder has the same sign as the dividend (JavaScript %).
	// floor     The remainder has the same sign as the divisor (Python %).
	// half-even The IEEE 754 remainder function.
	// euclid    Euclidian division. q = sign(n) * floor(a / abs(n)). Always positive.
	//
	// Truncated, floored, IEEE 754, and Euclidian division are commonly used for the modulus
	// operation. The other rounding modes can also be used, but they may not give useful results.
	/** Quotient rounding rule used by the modulo operation. Defaults to `'down'`, matching JavaScript remainder semantics. */
	'modulo': ModuloMode;

	// The exponent value at and beneath which `toString` returns exponential notation.
	// JavaScript numbers: -7
	// Values: 0 to -EXP_LIMIT
	/** Exponent at or below which `toString` uses exponential notation. Integer from `-Decimal.limits.maxExponent` to `0`; defaults to `-7`. */
	'toExpNeg': number;

	// The exponent value at and above which `toString` returns exponential notation.
	// JavaScript numbers: 21
	// Values: 0 to EXP_LIMIT
	/** Exponent at or above which `toString` uses exponential notation. Integer from `0` to `Decimal.limits.maxExponent`; defaults to `21`. */
	'toExpPos': number;

	// The maximum exponent value, above which overflow to Infinity occurs.
	// JavaScript numbers: 308  (1.7976931348623157e+308)
	// Values: 1 to EXP_LIMIT
	/** Maximum exponent before overflow to Infinity. Integer from `0` to `Decimal.limits.maxExponent`; defaults to that maximum. */
	'maxE': number;

	// The minimum exponent value, beneath which underflow to zero occurs.
	// JavaScript numbers: -324  (5e-324)
	// Values: -1 to -EXP_LIMIT
	/** Minimum exponent before underflow to zero. Integer from `-Decimal.limits.maxExponent` to `0`; defaults to the negative maximum. */
	'minE': number;
}

/** A partial, validated constructor-configuration update accepted by `Decimal.config` and `Decimal.clone`. */
export type DecimalConfigInput = Partial<DecimalConfig>;
