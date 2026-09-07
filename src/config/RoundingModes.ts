import { MODULO_EUCLID } from './RoundingCodes.js';
import type { RoundingCode, ModuloCode } from './RoundingCodes.js';
export * from './RoundingCodes.js';
import { invalidArgumentError } from '../errors.js';


/**
 * Human-readable rounding rules accepted by Decimal operations.
 *
 * The `half-*` modes apply only when the discarded digits are exactly halfway
 * between two candidates; otherwise the nearest candidate is used.
 *
 * | Mode           | Description |
 * | -------------- | ----------- |
 * | `'up'`         | Rounds away from zero |
 * | `'down'`       | Rounds towards zero |
 * | `'ceil'`       | Rounds towards positive Infinity |
 * | `'floor'`      | Rounds towards negative Infinity |
 * | `'half-up'     | Rounds towards nearest neighbor. If equidistant, rounds away from zero |
 * | `'half-down'`  | Rounds towards nearest neighbor. If equidistant, rounds towards zero |
 * | `'half-even'`  | Rounds towards nearest neighbor. If equidistant, rounds towards even neighbor |
 * | `'half-ceil'`  | Rounds towards nearest neighbor. If equidistant, rounds towards positive Infinity |
 * | `'half-floor'` | Rounds towards nearest neighbor. If equidistant, rounds towards negative Infinity |
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

/** Rounding rules accepted by modulo, including always-nonnegative Euclidean remainders.
 *
 * These modes are most commonly useful for modulus and remainder operations:
 *
 * | Mode | Description |
 * | --- | --- |
 * | `'up'` | The remainder has the opposite sign to the dividend |
 * | `'down'` | The remainder has the same sign as the dividend, matching JavaScript `%` |
 * | `'floor'` | The remainder has the same sign as the divisor, matching Python `%` |
 * | `'half-even'` | IEEE 754 remainder |
 * | `'euclid'` | The remainder is always non-negative |
 */
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
