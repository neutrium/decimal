/**
 * Stable machine-readable categories for errors raised by Decimal's public API.
 *
 * - `INVALID_ARGUMENT`: a constructor or method argument is invalid.
 * - `INVALID_CONFIGURATION`: a configuration value or object is invalid.
 * - `UNKNOWN_CONFIGURATION_KEY`: a configuration property is unsupported.
 * - `PRECISION_LIMIT_EXCEEDED`: a calculation exceeds a bundled constant's precision.
 * - `PREFIXED_EXPANSION_LIMIT_EXCEEDED`: prefixed parsing exceeds `maxPrefixedDigits`.
 * - `OUTPUT_DIGIT_LIMIT_EXCEEDED`: formatting exceeds `maxOutputDigits`.
 */
export type DecimalErrorCode =
	| 'INVALID_ARGUMENT'
	| 'INVALID_CONFIGURATION'
	| 'UNKNOWN_CONFIGURATION_KEY'
	| 'PRECISION_LIMIT_EXCEEDED'
	| 'PREFIXED_EXPANSION_LIMIT_EXCEEDED'
	| 'OUTPUT_DIGIT_LIMIT_EXCEEDED';

/** An error raised when Decimal rejects public input or cannot satisfy configured limits. */
export class DecimalError extends Error
{
	/** Stable machine-readable category for the failure. */
	readonly code : DecimalErrorCode;

	/**
	 * Create a Decimal API error.
	 * @param code - Stable machine-readable failure category.
	 * @param message - Human-readable failure description.
	 */
	constructor(code : DecimalErrorCode, message : string)
	{
		super(message);
		this.name = 'DecimalError';
		this.code = code;
	}
}

function formatValue(value : unknown) : string
{
	try
	{
		return String(value);
	}
	catch
	{
		return '<unprintable>';
	}
}

/** @internal */
export function invalidArgumentError(value : unknown, kind : string = 'argument') : DecimalError
{
	return new DecimalError('INVALID_ARGUMENT', 'Invalid ' + kind + ': ' + formatValue(value));
}

/** @internal */
export function invalidConfigurationError(parameter : string, value : unknown) : DecimalError
{
	return new DecimalError(
		'INVALID_CONFIGURATION',
		'Invalid configuration parameter: ' + parameter + ': ' + formatValue(value)
	);
}

/** @internal */
export function configurationObjectExpectedError() : DecimalError
{
	return new DecimalError('INVALID_CONFIGURATION', 'Invalid configuration: object expected');
}

/** @internal */
export function unknownConfigurationKeyError(key : PropertyKey) : DecimalError
{
	return new DecimalError(
		'UNKNOWN_CONFIGURATION_KEY',
		'Unknown configuration parameter: ' + formatValue(key)
	);
}

/** @internal */
export function precisionLimitExceededError() : DecimalError
{
	return new DecimalError('PRECISION_LIMIT_EXCEEDED', 'Precision limit exceeded');
}

/** @internal */
export function prefixedExpansionLimitError(limit : number) : DecimalError
{
	return new DecimalError(
		'PREFIXED_EXPANSION_LIMIT_EXCEEDED',
		'Prefixed number expansion limit exceeded: ' + limit
	);
}

/** @internal */
export function outputDigitLimitError(limit : number) : DecimalError
{
	return new DecimalError('OUTPUT_DIGIT_LIMIT_EXCEEDED', 'Output digit limit exceeded: ' + limit);
}
