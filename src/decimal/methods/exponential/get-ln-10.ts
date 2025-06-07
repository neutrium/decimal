import { Decimal } from "../../Decimal.js";
import { DecimalParams } from "../../DecimalParameters.js";
import { finalise } from "../utils/finalise.js";

export function getLn10(sd : number, pr? : number) : Decimal
{
	if (sd > DecimalParams.LN10_PRECISION)
	{
		// Reset global state in case the exception is caught.
		Decimal.external = true;

		if (pr)
		{
			Decimal.precision = pr;
		}

		throw Error("[DecimalError] Precision limit exceeded getLn10");
	}

	return finalise(Decimal.LN10, sd, 1, true);
}