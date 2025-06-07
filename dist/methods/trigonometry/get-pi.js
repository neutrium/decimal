import { Decimal } from "../../Decimal.js";
import { DecimalParams } from "../../DecimalParameters.js";
import { finalise } from "../utils/finalise.js";
export function getPi(sd, rm) {
    if (sd > DecimalParams.PI_PRECISION) {
        throw Error('[DecimalError] Precision limit exceeded');
    }
    return finalise(Decimal.PI, sd, rm, true);
}
