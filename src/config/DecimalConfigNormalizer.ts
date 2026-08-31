import { DecimalConstants } from '../InternalConstants.js';
import { configurationObjectExpectedError, invalidConfigurationError, unknownConfigurationKeyError } from '../errors.js';
import type { DecimalConfig, DecimalConfigInput } from './DecimalConfig.js';
import { validateModuloMode, validateRoundingMode } from './RoundingModes.js';

type NumericConfigKey = Exclude<keyof DecimalConfig, 'rounding' | 'modulo'>;

const numericRanges = {
	precision: [1, DecimalConstants.MAX_DIGITS],
	maxPrefixedDigits: [1, DecimalConstants.MAX_DIGITS],
	maxOutputDigits: [1, DecimalConstants.MAX_DIGITS],
	toExpNeg: [-DecimalConstants.EXP_LIMIT, 0],
	toExpPos: [0, DecimalConstants.EXP_LIMIT],
	maxE: [0, DecimalConstants.EXP_LIMIT],
	minE: [-DecimalConstants.EXP_LIMIT, 0]
} as const satisfies Record<NumericConfigKey, readonly [number, number]>;

const configKeys = new Set<PropertyKey>([
	...Object.keys(numericRanges),
	'rounding',
	'modulo'
]);

/** @internal Validate, merge, and freeze a constructor configuration update. */
export function normaliseDecimalConfig(current : Readonly<DecimalConfig>, input : DecimalConfigInput) : Readonly<DecimalConfig>
{
	if (!input || typeof input !== 'object')
	{
		throw configurationObjectExpectedError();
	}

	for (const key of Reflect.ownKeys(input))
	{
		if (!configKeys.has(key)) throw unknownConfigurationKeyError(key);
	}

	const updates : Partial<DecimalConfig> = {};

	for (const key of Object.keys(numericRanges) as NumericConfigKey[])
	{
		const value = input[key];
		if (value === void 0) continue;

		const [minimum, maximum] = numericRanges[key];

		if (typeof value !== 'number' || !Number.isInteger(value) || value < minimum || value > maximum)
		{
			throw invalidConfigurationError(key, value);
		}

		updates[key] = value;
	}

	if (input.rounding !== void 0)
	{
		try
		{
			updates.rounding = validateRoundingMode(input.rounding);
		}
		catch
		{
			throw invalidConfigurationError('rounding', input.rounding);
		}
	}

	if (input.modulo !== void 0)
	{
		try
		{
			updates.modulo = validateModuloMode(input.modulo);
		}
		catch
		{
			throw invalidConfigurationError('modulo', input.modulo);
		}
	}

	return Object.freeze({ ...current, ...updates });
}
