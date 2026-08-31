import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_DOWN, ROUND_UP } from "../../config/RoundingModes.js";
import { finalise } from "../utils/finalise.js";
import { divideSignificant } from "../arithmetic/div.js"
import { sine } from "./sin.js";
import { toLessThanHalfPi } from "./to-lte-pi.js";
import { mul } from "../arithmetic/mul.js";
import { neg } from "../arithmetic/neg.js";
import { sub } from "../arithmetic/add-subtract.js";
import { isFinite, isZero } from "../compare/identity-compare.js";
import { sqrt } from "../power/sqrt.js";
import { precision } from "../utils/precision.js";
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the tangent of the value in radians of this Decimal.
//
// Domain: [-Infinity, Infinity]
// Range: [-Infinity, Infinity]
//
// tan(0)         = 0
// tan(-0)        = -0
// tan(Infinity)  = NaN
// tan(-Infinity) = NaN
// tan(NaN)       = NaN
//
export function tan(x: Decimal, context : CalculationContext) : Decimal
{
	if (!isFinite(x))
	{
		return context.create(NaN);
	}

	if (isZero(x))
	{
		return context.create(x);
	}

	const pr = context.precision;
	const rm = context.roundingCode;
	const workingContext = context.with({ precision: pr + 10, roundingCode: ROUND_DOWN });
	const sineContext = workingContext.with({
		precision: workingContext.precision + Math.max(getDecimalState(x).e, precision(x)) + DecimalConstants.LOG_BASE
	});
	const reduced = toLessThanHalfPi(x, sineContext);
	x = sine(reduced.value, sineContext);
	x = finalise(x, workingContext.precision, ROUND_DOWN, true, workingContext);
	getMutableDecimalState(x).s = 1;
	const sineSquared = mul(x, x, workingContext);
	const cosineSquared = sub(workingContext.create(1), sineSquared, workingContext);
	const cosine = sqrt(cosineSquared, workingContext);
	x = divideSignificant(
		x,
		cosine,
		workingContext,
		pr + 10,
		ROUND_UP
	);

	return finalise(
		reduced.quadrant == 2 || reduced.quadrant == 4 ? neg(x, workingContext) : x,
		pr,
		rm,
		true,
		context
	);
}
