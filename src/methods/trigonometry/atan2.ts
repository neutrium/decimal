import type { CalculationContext } from '../../CalculationContext.js';
import type { Decimal, DecimalValue } from '../../Decimal.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { add, sub } from "../arithmetic/add-subtract.js";
import { divideSignificant } from '../arithmetic/div.js';
import { mul } from '../arithmetic/mul.js';
import { isZero } from '../compare/identity-compare.js';
import { atan } from './atan.js';
import { getPi } from './get-pi.js';

// Return atan(y / x) in radians, preserving the quadrant in the range [-pi, pi].
export function atan2(yValue: DecimalValue, xValue: DecimalValue, context: CalculationContext): Decimal
{
	let x = context.createExact(xValue);
	const y = context.createExact(yValue);
	const precision = context.precision;
	const rounding = context.roundingCode;
	const workingPrecision = precision + 4;
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);
	let result: Decimal;

	if (!yState.s || !xState.s)
	{
		result = context.create(NaN);
	}
	else if (!yState.d && !xState.d)
	{
		result = mul(getPi(workingPrecision, ROUND_DOWN, context), xState.s > 0 ? 0.25 : 0.75, context);
		getMutableDecimalState(result).s = yState.s;
	}
	else if (!xState.d || isZero(y))
	{
		result = xState.s < 0 ? getPi(precision, rounding, context) : context.create(0);
		getMutableDecimalState(result).s = yState.s;
	}
	else if (!yState.d || isZero(x))
	{
		result = mul(getPi(workingPrecision, ROUND_DOWN, context), 0.5, context);
		getMutableDecimalState(result).s = yState.s;
	}
	else if (xState.s < 0)
	{
		const workingContext = context.with({ precision: workingPrecision, roundingCode: ROUND_DOWN });
		result = atan(
			divideSignificant(y, x, workingContext, workingPrecision, ROUND_DOWN),
			workingContext
		);
		x = getPi(workingPrecision, ROUND_DOWN, workingContext);
		result = yState.s < 0 ? sub(result, x, context) : add(result, x, context);
	}
	else
	{
		result = atan(divideSignificant(y, x, context, workingPrecision, ROUND_DOWN), context);
	}

	return result;
}
