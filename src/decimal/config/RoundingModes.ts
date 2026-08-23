

/** Human-readable rounding modes accepted by Decimal's public API. */
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

export type RoundingCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type ModuloCode = RoundingCode | 9;

export const ROUNDING_MODES: readonly [
	'up',
	'down',
	'ceil',
	'floor',
	'half-up',
	'half-down',
	'half-even',
	'half-ceil',
	'half-floor'
] = [
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
/** Rounding modes accepted for modulo, including Euclidean division. */
export type ModuloMode = RoundingMode | 'euclid';

/** @internal */
export function getRoundingModeCode(mode : unknown) : RoundingCode
{
	if (typeof mode === 'number' && Number.isInteger(mode) && mode >= 0 && mode < ROUNDING_MODES.length)
	{
		return mode as RoundingCode;
	}

	const code = ROUNDING_MODES.indexOf(mode as RoundingMode);

	if (code < 0) throw Error('[DecimalError] Invalid rounding mode: ' + mode);

	return code as RoundingCode;
}

/** @internal */
export function getModuloModeCode(mode : unknown) : ModuloCode
{
	if (mode === 'euclid' || mode === 9) return 9;

	return getRoundingModeCode(mode);
}

export function normaliseRoundingMode(mode : unknown) : RoundingMode
{
	return ROUNDING_MODES[getRoundingModeCode(mode)];
}

export function normaliseModuloMode(mode : unknown) : ModuloMode
{
	return getModuloModeCode(mode) === 9 ? 'euclid' : normaliseRoundingMode(mode);
}
