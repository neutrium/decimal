import { DecimalConstants } from './InternalConstants.js'

/** Hard public validation limits shared by all Decimal constructors. */
export interface DecimalLimits
{
	/** Maximum accepted calculation precision and configured parsing/output digit limit (`1e9`). */
	readonly maxDigits: number;
	/** Maximum absolute exponent accepted by configuration (`9e15`). */
	readonly maxExponent: number;
}

export const DECIMAL_LIMITS: DecimalLimits = Object.freeze({
	maxDigits: DecimalConstants.MAX_DIGITS,
	maxExponent: DecimalConstants.EXP_LIMIT
});
