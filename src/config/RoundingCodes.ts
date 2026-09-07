/** Numeric code used by calculation hot paths. */
export type RoundingCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
/** Numeric modulo code used by calculation hot paths. */
export type ModuloCode = RoundingCode | 9;

/** @internal Numeric codes used by calculation hot paths. */
export const ROUND_UP = 0 satisfies RoundingCode;
/** @internal */
export const ROUND_DOWN = 1 satisfies RoundingCode;
/** @internal */
export const ROUND_CEIL = 2 satisfies RoundingCode;
/** @internal */
export const ROUND_FLOOR = 3 satisfies RoundingCode;
/** @internal */
export const ROUND_HALF_UP = 4 satisfies RoundingCode;
/** @internal */
export const ROUND_HALF_DOWN = 5 satisfies RoundingCode;
/** @internal */
export const ROUND_HALF_EVEN = 6 satisfies RoundingCode;
/** @internal */
export const ROUND_HALF_CEIL = 7 satisfies RoundingCode;
/** @internal */
export const ROUND_HALF_FLOOR = 8 satisfies RoundingCode;
/** @internal */
export const MODULO_EUCLID = 9 satisfies ModuloCode;
