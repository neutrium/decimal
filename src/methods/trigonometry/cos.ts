import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_DOWN, type RoundingCode } from "../../config/RoundingModes.js";
import { finalise } from "../utils/finalise.js";
import { taylorSeries } from "./taylor-series.js";
import { toLessThanHalfPi } from "./to-lte-pi.js";
import { add, sub } from "../arithmetic/add-subtract.js";
import { mul } from "../arithmetic/mul.js";
import { neg } from "../arithmetic/neg.js";
import { precision } from "../utils/precision.js";
import { getDecimalState } from '../../DecimalState.js';
import { reciprocalPowerOfFour } from "./argument-reduction-scale.js";

//
// Return a new Decimal whose value is the cosine of the value in radians of `x`
//
// Domain: [-Infinity, Infinity]
// Range: [-1, 1]
//
// cos(0)         = 1
// cos(-0)        = 1
// cos(Infinity)  = NaN
// cos(-Infinity) = NaN
// cos(NaN)       = NaN
//
export function cos(x: Decimal, context : CalculationContext) : Decimal
{
	const xState = getDecimalState(x);
	let pr : number,
		rm : RoundingCode;

	if (!xState.d)
	{
		return context.create(NaN);
	}

	// cos(0) = cos(-0) = 1
	if (!xState.d[0])
	{
		return context.create(1);
	}

	pr = context.precision;
	rm = context.roundingCode;
	const workingContext = context.with({
		precision: pr + Math.max(xState.e, precision(x)) + DecimalConstants.LOG_BASE,
		roundingCode: ROUND_DOWN
	});
	const reduced = toLessThanHalfPi(x, workingContext);
	x = cosine(reduced.value, workingContext);

	return finalise(
		reduced.quadrant == 2 || reduced.quadrant == 3 ? neg(x, workingContext) : x,
		pr,
		rm,
		true,
		context
	);
}

//
// cos(x) = 1 - x^2/2! + x^4/4! - ...
// |x| < pi/2
//
function cosine(x : Decimal, context : CalculationContext) : Decimal
{
	let k,
		len = getDecimalState(x).d!.length;

	// Argument reduction: cos(4x) = 8*(cos^4(x) - cos^2(x)) + 1
	// i.e. cos(x) = 8*(cos^4(x/4) - cos^2(x/4)) + 1

	// Estimate the optimum number of times to use the argument reduction.
	if (len < 32)
	{
		k = Math.ceil(len / 3);
	}
	else
	{
		k = 16;
	}

	const seriesContext = context.with({ precision: context.precision + k });
	x = taylorSeries(
		1,
		mul(x, reciprocalPowerOfFour(k), seriesContext),
		seriesContext.create(1),
		undefined,
		seriesContext
	);

	// Reverse argument reduction
	for (var i = k; i--;)
	{
		var cos2x = mul(x, x, seriesContext);
		const fourthPower = mul(cos2x, cos2x, seriesContext);
		const difference = sub(fourthPower, cos2x, seriesContext);
		const scaledDifference = mul(difference, 8, seriesContext);
		x = add(scaledDifference, 1, seriesContext);
	}

	return x;
}
