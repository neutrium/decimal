import type { Decimal } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { DecimalConstants } from "../../InternalConstants.js";
import { ROUND_DOWN } from "../../config/RoundingModes.js";
import { finalise } from "../utils/finalise.js";
import { taylorSeries } from "./taylor-series.js";
import { toLessThanHalfPi } from "./to-lte-pi.js";
import { add, sub } from "../arithmetic/add-subtract.js";
import { mul } from "../arithmetic/mul.js";
import { neg } from "../arithmetic/neg.js";
import { isFinite, isZero } from "../compare/identity-compare.js";
import { precision } from "../utils/precision.js";
import { getDecimalState } from '../../DecimalState.js';
import { reciprocalPowerOfFive } from "./argument-reduction-scale.js";

//
// Return a new Decimal whose value is the sine of the value in radians of `x`.
//
// Domain: [-Infinity, Infinity]
// Range: [-1, 1]
//
// sin(x) = x - x^3/3! + x^5/5! - ...
//
// sin(0)         = 0
// sin(-0)        = -0
// sin(Infinity)  = NaN
// sin(-Infinity) = NaN
// sin(NaN)       = NaN
//
export function sin(x: Decimal, context : CalculationContext) : Decimal
{
	let pr, rm;

	if (!isFinite(x))
	{
		return context.create(NaN);
	}

	if (isZero(x))
	{
		return context.create(x);
	}

	pr = context.precision;
	rm = context.roundingCode;
	const xState = getDecimalState(x);
	const workingContext = context.with({
		precision: pr + Math.max(xState.e, precision(x)) + DecimalConstants.LOG_BASE,
		roundingCode: ROUND_DOWN
	});
	const reduced = toLessThanHalfPi(x, workingContext);
	x = sine(reduced.value, workingContext);

	return finalise(
		reduced.quadrant > 2 ? neg(x, workingContext) : x,
		pr,
		rm,
		true,
		context
	);
}

//
// sin(x) = x - x^3/3! + x^5/5! - ...
// |x| < pi/2
//
export function sine(x : Decimal, context : CalculationContext) : Decimal
{
	if(isFinite(x))
	{
		let k,
		len = getDecimalState(x).d!.length;

		if (len < 3)
		{
			return taylorSeries(2, x, x, undefined, context);
		}

		// Argument reduction: sin(5x) = 16*sin^5(x) - 20*sin^3(x) + 5*sin(x)
		// i.e. sin(x) = 16*sin^5(x/5) - 20*sin^3(x/5) + 5*sin(x/5)
		// and  sin(x) = sin(x/5)(5 + sin^2(x/5)(16sin^2(x/5) - 20))

		// Estimate the optimum number of times to use the argument reduction.
		k = 1.4 * Math.sqrt(len);
		k = k > 16 ? 16 : k | 0;

		x = mul(x, reciprocalPowerOfFive(k), context);
		x = taylorSeries(2, x, x, undefined, context);

		// Reverse argument reduction
		var sin2_x,
			d5 = context.create(5),
			d16 = context.create(16),
			d20 = context.create(20);

		for (; k--;)
		{
			sin2_x = mul(x, x, context);
			const scaledSquare = mul(d16, sin2_x, context);
			const innerPolynomial = sub(scaledSquare, d20, context);
			const correction = mul(sin2_x, innerPolynomial, context);
			const factor = add(d5, correction, context);
			x = mul(x, factor, context);
		}
	}

	return x;
}
