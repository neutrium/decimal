import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_DOWN } from "../../config/RoundingModes.js";
import { divideSignificant } from "../arithmetic/div.js";
import { add, sub } from "../arithmetic/add-subtract.js";
import { mul } from "../arithmetic/mul.js";
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';

//
// Calculate Taylor series for `cos`, `cosh`, `sin` and `sinh`.
//
export function taylorSeries(
	n : number,
	x : Decimal,
	y : Decimal,
	isHyperbolic : boolean | undefined,
	context : CalculationContext
) : Decimal
{
	let j, t, u, x2,
		pr = context.precision,
		k = Math.ceil(pr / DecimalConstants.LOG_BASE);

	const workingContext = context.withoutLimits();
	x2 = mul(x, x, workingContext);
	u = workingContext.create(y);

	for (;;)
	{
		t = divideSignificant(mul(u, x2, workingContext), workingContext.create(n++ * n++), workingContext, pr, ROUND_DOWN);
		u = isHyperbolic ? add(y, t, workingContext) : sub(y, t, workingContext);
		y = divideSignificant(mul(t, x2, workingContext), workingContext.create(n++ * n++), workingContext, pr, ROUND_DOWN);
		t = add(u, y, workingContext);

		const td = getDecimalState(t).d!;
		const ud = getDecimalState(u).d!;

		if (td[k] !== void 0)
		{
			for (j = k; td[j] === ud[j] && j--;);

			if (j == -1)
			{
				break;
			}
		}

		u = y;
		y = t;
	}

	getMutableDecimalState(t).d!.length = k + 1;

	return t;
}
