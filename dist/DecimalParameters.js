import { PI_STR, LN10_STR } from "./constants.js";
export const DecimalParams = {
    BASE: 1e7,
    LOG_BASE: 7,
    MAX_SAFE_INTEGER: 9007199254740991,
    MAX_DIGITS: 1e9,
    // The maximum exponent magnitude.
    // The limit on the value of `toExpNeg`, `toExpPos`.
    // Values: 0 to 9e15
    EXP_LIMIT: 9e15,
    PI_PRECISION: (PI_STR.length - 1),
    LN10_PRECISION: (LN10_STR.length - 1)
};
