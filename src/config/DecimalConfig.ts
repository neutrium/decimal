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

	/** Maximum significant digits in calculation and base-conversion results. Integer from `1` to `Decimal.limits.maxDigits`; defaults to `20`.
	 *
	 * @example
	 * ```ts
	 * const TenDigits = Decimal.clone({ precision: 10 })
	 * TenDigits.config.precision                               // 10
	 * new TenDigits('1.12345678901234567890').add(0).toString() // '1.123456789'
	 * ```
	 */
	'precision': number;

	/** Maximum decimal coefficient digits generated while parsing a prefixed number. Integer from `1` to `Decimal.limits.maxDigits`; defaults to `1_000_000`.
	 *
	 * @example
	 * ```ts
	 * const LimitedPrefix = Decimal.clone({ maxPrefixedDigits: 10 })
	 * new LimitedPrefix('0xff').toString()   // '255'
	 * new LimitedPrefix('0x123456789abcdef') // throws PREFIXED_EXPANSION_LIMIT_EXCEEDED
	 * ```
	 */
	'maxPrefixedDigits': number;

	/** Maximum mantissa digits emitted by a public string-formatting operation. Integer from `1` to `Decimal.limits.maxDigits`; defaults to `1_000_000`.
	 *
	 * @example
	 * ```ts
	 * const LimitedOutput = Decimal.clone({ maxOutputDigits: 10 })
	 * new LimitedOutput('1e-10').toString()              // '1e-10'
	 * new LimitedOutput('9.999999999999999').toString() // throws OUTPUT_DIGIT_LIMIT_EXCEEDED
	 * ```
	 */
	'maxOutputDigits': number;

	/** Rounding mode used to round to `precision` when a method does not receive an explicit mode. Defaults to `'half-up'`. */
	'rounding': RoundingMode;

	/** Quotient rounding rule used by `mod()`. Defaults to `'down'`, matching JavaScript remainder semantics.
	 *
	 * For `a.mod(n)`, the quotient `q = a / n` is rounded according to the selected
	 * mode, then the remainder is calculated as `r = a - n * q`.
	 */
	'modulo': ModuloMode;

	/** Exponent at or below which `toString` uses exponential notation. Integer from `-Decimal.limits.maxExponent` to `0`; defaults to `-7`.
	 *
	 * @example
	 * ```ts
	 * const SmallExponent = Decimal.clone({ toExpNeg: -5 })
	 * SmallExponent.config.toExpNeg             // -5
	 * new SmallExponent('9.999e-4').toString()  // '0.0009999'
	 * new SmallExponent('1e-5').toString()      // '1e-5'
	 *
	 * const AlwaysExponential = Decimal.clone({ toExpNeg: 0 })
	 * new AlwaysExponential('0.5').toString()   // '5e-1'
	 * ```
	 */
	'toExpNeg': number;

	/** Exponent at or above which `toString` uses exponential notation. Integer from `0` to `Decimal.limits.maxExponent`; defaults to `21`.
	 *
	 * @example
	 * ```ts
	 * const LargeExponent = Decimal.clone({ toExpPos: 5 })
	 * LargeExponent.config.toExpPos             // 5
	 * new LargeExponent('9.999e4').toString()   // '99990'
	 * new LargeExponent('1e5').toString()       // '1e+5'
	 * ```
	 */
	'toExpPos': number;

	/** Maximum exponent before overflow to `Infinity`. Integer from `0` to `Decimal.limits.maxExponent`; defaults to `Decimal.limits.maxExponent`.
	 *
	 * @example
	 * ```ts
	 * const BoundedMaximum = Decimal.clone({ maxE: 500 })
	 * BoundedMaximum.config.maxE                  // 500
	 * new BoundedMaximum('9.999e500').toString() // '9.999e+500'
	 * new BoundedMaximum('1e501').toString()     // 'Infinity'
	 * ```
	 */
	'maxE': number;

	/** Minimum exponent before underflow to zero. Integer from `-Decimal.limits.maxExponent` to `0`; defaults to `-Decimal.limits.maxExponent`.
	 *
	 * @example
	 * ```ts
	 * const BoundedMinimum = Decimal.clone({ minE: -500 })
	 * BoundedMinimum.config.minE                   // -500
	 * new BoundedMinimum('9.999e-500').toString() // '9.999e-500'
	 * new BoundedMinimum('1e-501').toString()     // '0'
	 * ```
	 */
	'minE': number;
}

/** A partial, validated constructor-configuration update accepted by `Decimal.config` and `Decimal.clone`. */
export type DecimalConfigInput = Partial<DecimalConfig>;
