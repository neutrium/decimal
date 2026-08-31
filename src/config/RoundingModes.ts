import { invalidArgumentError } from '../errors.js';


/**
 * Human-readable rounding rules accepted by Decimal operations.
 *
 * The `half-*` modes apply only when the discarded digits are exactly halfway
 * between two candidates; otherwise the nearest candidate is used.
 */
export type RoundingMode =
	| 'up'
	| 'down'
	| 'ceil'
	| 'floor'
	| 'half-up'
	| 'half-down'
	| 'half-even'
	| 'half-ceil'
	| 'half-floor';

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

/** @internal */
export const ROUNDING_MODES = [
	'up',
	'down',
	'ceil',
	'floor',
	'half-up',
	'half-down',
	'half-even',
	'half-ceil',
	'half-floor'
] as const;

/** Rounding rules accepted by modulo, including always-nonnegative Euclidean remainders. */
export type ModuloMode = RoundingMode | 'euclid';

/** @internal */
export function getRoundingModeCode(mode : unknown) : RoundingCode
{
	const code = ROUNDING_MODES.indexOf(mode as RoundingMode);

	if (code < 0)
	{
		throw invalidArgumentError(mode, 'rounding mode');
	}

	return code as RoundingCode;
}

/** @internal */
export function getModuloModeCode(mode : unknown) : ModuloCode
{
	if (mode === 'euclid')
	{
		return MODULO_EUCLID;
	}

	return getRoundingModeCode(mode);
}

export function validateRoundingMode(mode : unknown) : RoundingMode
{
	return ROUNDING_MODES[getRoundingModeCode(mode)];
}

export function validateModuloMode(mode : unknown) : ModuloMode
{
	const code = getModuloModeCode(mode);

	return code === MODULO_EUCLID ? 'euclid' : ROUNDING_MODES[code];
}
