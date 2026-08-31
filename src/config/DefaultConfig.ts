import type { DecimalConfig } from "./DecimalConfig.js"
import { DecimalConstants } from "../InternalConstants.js";

export const DefaultDecimalConfig: Readonly<DecimalConfig> = Object.freeze({
	'precision': 20,
	'maxPrefixedDigits': 1_000_000,
	'maxOutputDigits': 1_000_000,
	'rounding': 'half-up',
	'toExpNeg': -7,
	'toExpPos': 21,
	'maxE':  DecimalConstants.EXP_LIMIT,
	'minE':  -DecimalConstants.EXP_LIMIT,
	'modulo': 'down'
});
