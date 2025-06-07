import { DecimalConfig } from "./DecimalConfig.js"
import { DecimalParams } from "../DecimalParameters.js";

export const DefaultDecimalConfig:  DecimalConfig = {
	'precision': 20,
	'rounding': 4,
	'toExpNeg': -7,
	'toExpPos': 21,
	'maxE':  DecimalParams.EXP_LIMIT,
	'minE':  -DecimalParams.EXP_LIMIT,
	'modulo': 1
}
