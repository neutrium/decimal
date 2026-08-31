/**
 * Immutable arbitrary-precision decimal arithmetic.
 *
 * @packageDocumentation
 */
export {
	Decimal,
	type DecimalConstructor,
	type DecimalFraction,
	type DecimalValue
} from './Decimal.js'
export type { DecimalConfig, DecimalConfigInput } from './config/DecimalConfig.js'
export type { ModuloMode, RoundingMode } from './config/RoundingModes.js'
export type { DecimalLimits } from './DecimalLimits.js'
export { DecimalError, type DecimalErrorCode } from './errors.js'
