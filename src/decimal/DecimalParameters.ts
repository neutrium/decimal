import { PI_STR, LN10_STR } from "./constants.js"

/** Numeric limits and storage parameters used by Decimal. */
export interface DecimalParameters {
	readonly BASE: number;
	readonly LOG_BASE: number;
	readonly MAX_SAFE_INTEGER: number;
	readonly MAX_DIGITS: number;
	readonly EXP_LIMIT: number;
	readonly PI_PRECISION: number;
	readonly LN10_PRECISION: number;
}

export const DecimalParams: DecimalParameters = Object.freeze({
	BASE: 1e7,
	LOG_BASE: 7,
	MAX_SAFE_INTEGER: 9007199254740991,
	MAX_DIGITS: 1e9,

	// The maximum exponent magnitude.
	// The limit on the value of `toExpNeg`, `toExpPos`.
	// Values: 0 to 9e15
	EXP_LIMIT: 9e15,


	PI_PRECISION: (PI_STR.length - 1),

	LN10_PRECISION: (LN10_STR.length - 1)
});
