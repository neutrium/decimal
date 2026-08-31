import { DecimalConstants } from "../../InternalConstants.js";
import type { Decimal, DecimalFraction, DecimalValue } from "../../Decimal.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_DOWN } from "../../config/RoundingModes.js";
import { invalidArgumentError } from "../../errors.js";
import { divideInteger, divideSignificant } from "../arithmetic/div.js";
import { abs } from "../arithmetic/abs.js";
import { add, sub } from "../arithmetic/add-subtract.js";
import { mul } from "../arithmetic/mul.js";
import { isInt } from "../compare/identity-compare.js";
import { compareDecimals } from "../compare/relational-compare.js";
import { digitsToString } from "../utils/digits-to-string.js";
import { getPrecision } from "../utils/get-precision.js"
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';

//
// Return an array representing the value of Decimal `x` as a simple fraction with an integer
// numerator and an integer denominator.
//
// The denominator will be a positive non-zero value less than or equal to the specified maximum
// denominator. If a maximum denominator is not specified, the denominator will be the lowest
// value necessary to represent the number exactly.
//
// [maxD] {DecimalValue} Maximum denominator. Integer >= 1 and < Infinity.
//
export function toFraction(x: Decimal, denominator : DecimalValue | undefined, context : CalculationContext) : DecimalFraction
{
	const xState = getDecimalState(x);
	let d0, d1, d2, k, n, n0, n1, q, r,
		xd = xState.d,
		maxD = denominator == null ? null : context.createExact(denominator);

	if (!xd)
	{
		return [context.create(x)];
	}

	n1 = d0 = context.create(1);
	d1 = n0 = context.create(0);

	let d = context.create(d1);
	let e: number = getPrecision(xd) - xState.e - 1;
	getMutableDecimalState(d).e = e;
	k = e % DecimalConstants.LOG_BASE;
	getMutableDecimalState(d).d![0] = Math.pow(10, k < 0 ? DecimalConstants.LOG_BASE + k : k);

	if (maxD == null)
	{
		// d is 10**e, the minimum max-denominator needed.
		maxD = e > 0 ? d : n1;
	}
	else
	{
		n = context.create(maxD);

		if (!isInt(n) || compareDecimals(n, n1) < 0)
		{
			throw invalidArgumentError(n);
		}

		maxD = compareDecimals(n, d) > 0 ? (e > 0 ? d : n1) : n;
	}

	e = xd.length * DecimalConstants.LOG_BASE * 2;
	const workingContext = context.with({ external: false, precision: e });
	n = workingContext.create(digitsToString(xd));
	d = workingContext.create(d);
	d0 = workingContext.create(d0);
	d1 = workingContext.create(d1);
	n0 = workingContext.create(n0);
	n1 = workingContext.create(n1);
	maxD = workingContext.create(maxD);

	for (;;)
	{
		// Exact cancellation can produce either +0 or -0 depending on the public rounding mode.
		// In both cases the continued fraction has reached its final convergent.
		const digits = getDecimalState(d).d;
		if (digits && !digits[0]) break;

		q = divideInteger(n, d, workingContext);
		d2 = add(d0, mul(q, d1, workingContext), workingContext);

		if (compareDecimals(d2, maxD) == 1)
		{
			break;
		}

		d0 = d1;
		d1 = d2;
		d2 = n1;
		n1 = add(n0, mul(q, d2, workingContext), workingContext);
		n0 = d2;
		d2 = d;
		d = sub(n, mul(q, d2, workingContext), workingContext);
		n = d2;
	}

	d2 = divideInteger(sub(maxD, d0, workingContext), d1, workingContext);
	n0 = add(n0, mul(d2, n1, workingContext), workingContext);
	d0 = add(d0, mul(d2, d1, workingContext), workingContext);
	getMutableDecimalState(n0).s = xState.s;
	getMutableDecimalState(n1).s = xState.s;

	// Determine which fraction is closer to x, n0/d0 or n1/d1?
	const convergent = divideSignificant(n1, d1, workingContext, e, ROUND_DOWN);
	const convergentError = abs(sub(convergent, x, workingContext), workingContext);
	const bounded = divideSignificant(n0, d0, workingContext, e, ROUND_DOWN);
	const boundedError = abs(sub(bounded, x, workingContext), workingContext);
	r = compareDecimals(convergentError, boundedError) < 1 ? [n1, d1] : [n0, d0];

	return [context.create(r[0]!), context.create(r[1]!)];
}
