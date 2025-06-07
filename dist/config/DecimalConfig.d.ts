import { DecimalRoundingModes } from "./RoundingModes.js";
export type DecimalConfig = {
    'precision': number;
    'rounding': DecimalRoundingModes;
    'modulo': DecimalRoundingModes;
    'toExpNeg': number;
    'toExpPos': number;
    'maxE': number;
    'minE': number;
};
