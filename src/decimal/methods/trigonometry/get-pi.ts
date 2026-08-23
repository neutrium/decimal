import { Decimal } from "../../Decimal.js";
import type { RoundingCode } from "../../config/RoundingModes.js";
import { DecimalParams } from "../../DecimalParameters.js";
import { finalise } from "../utils/finalise.js";

export function getPi(sd : number, rm : RoundingCode) : Decimal
{
	if (sd > DecimalParams.PI_PRECISION)
	{
		throw Error('[DecimalError] Precision limit exceeded');
	}

	return finalise(Decimal.PI, sd, rm, true);
}
