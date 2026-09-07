import { DecimalConstants } from "../../InternalConstants.js";
import type { KernelDecimal } from "../../KernelDecimal.js";
import type { DecimalValue } from "../../DecimalBase.js";
import type { CalculationContext } from "../../CalculationContext.js";
import { ROUND_DOWN, type RoundingCode } from "../../config/RoundingModes.js";
import { finalise } from "../utils/finalise.js";
import { divideCoefficients } from "./coefficients/divide.js";
import { abs } from './abs.js';
import { add, sub } from './add-subtract.js';
import { mul } from './mul.js';
import { shift } from './shift.js';
import { compareDecimals } from '../compare/relational-compare.js';
import { normaliseOperand } from '../utils/normalise-operand.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';

//
// Return a new Decimal whose value is the value of `x` divided by `y`, rounded to
// `precision` significant digits using rounding mode `rounding`.
//
export function div(x: KernelDecimal, y : DecimalValue, context : CalculationContext) : KernelDecimal
{
	return divideSignificant(x, normaliseOperand(y, context), context);
}

//
// Return a new Decimal whose value is the integer part of dividing the value of x
// by the value of `y`, rounded to `precision` significant digits using rounding mode `rounding`.
//
export function divToInt(x: KernelDecimal, y : DecimalValue, context : CalculationContext) : KernelDecimal
{
	return divideIntegerToPrecision(
		x,
		normaliseOperand(y, context),
		context,
		context.precision,
		context.roundingCode
	);
}

//
// Divide to a significant-digit precision, defaulting to the calculation context.
//
export function divideSignificant(
	x : KernelDecimal,
	y : KernelDecimal,
	context : CalculationContext,
	precision : number = context.precision,
	rounding : RoundingCode = context.roundingCode
) : KernelDecimal
{
	return divide(x, y, context, precision, rounding, false);
}

// Return the rounded integer quotient without limiting its significant digits.
export function divideInteger(
	x : KernelDecimal,
	y : KernelDecimal,
	context : CalculationContext,
	rounding : RoundingCode = ROUND_DOWN
) : KernelDecimal
{
	return divide(x, y, context, 0, rounding, true);
}

function divideIntegerToPrecision(
	x : KernelDecimal,
	y : KernelDecimal,
	context : CalculationContext,
	precision : number,
	rounding : RoundingCode
) : KernelDecimal
{
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);

	// Handle zero and non-finite operands in the ordinary kernel.
	if (!xState.d || !xState.d[0] || !yState.d || !yState.d[0])
	{
		return finalise(divideInteger(x, y, context), precision, rounding, undefined, context);
	}

	const workingContext = context.forIntermediate();
	const maximumShiftPlaces = xState.e - yState.e - precision + 1;

	// The quotient exponent is at most x.e - y.e, so no estimate is needed in this case.
	if (maximumShiftPlaces <= DecimalConstants.LOG_BASE)
	{
		return finalise(divideInteger(x, y, workingContext), precision, rounding, undefined, context);
	}

	const estimate = divideSignificant(x, y, workingContext, precision + 2, ROUND_DOWN);
	const estimateState = getDecimalState(estimate);
	if (estimateState.e > context.config.maxE) return context.create(estimateState.s / 0);
	const shiftPlaces = estimateState.e - precision + 1;

	// Computing the full integer is cheap when it is close to the requested precision.
	if (shiftPlaces <= DecimalConstants.LOG_BASE)
	{
		return finalise(divideInteger(x, y, workingContext), precision, rounding, undefined, context);
	}

	const magnitudeX = abs(x, workingContext);
	const magnitudeY = abs(y, workingContext);
	const scaledDivisor = shift(magnitudeY, shiftPlaces, workingContext);
	const leadingInteger = divideInteger(magnitudeX, scaledDivisor, workingContext);
	const remainder = sub(
		magnitudeX,
		mul(leadingInteger, scaledDivisor, workingContext),
		workingContext
	);
	const halfUnit = mul(scaledDivisor, 0.5, workingContext);
	const halfUnitUpperBound = add(halfUnit, magnitudeY, workingContext);
	const integerTie = compareDecimals(remainder, halfUnit) >= 0 &&
		compareDecimals(remainder, halfUnitUpperBound) < 0;
	const sign = xState.s === yState.s ? 1 : -1;
	let rounded;

	if (integerTie)
	{
		rounded = add(leadingInteger, 0.5, workingContext);
		getMutableDecimalState(rounded).s = sign;
		rounded = finalise(rounded, precision, rounding, false, workingContext);
	}
	else
	{
		getMutableDecimalState(magnitudeX).s = sign;
		rounded = divideSignificant(magnitudeX, scaledDivisor, workingContext, precision, rounding);
	}

	return shift(rounded, shiftPlaces, context);
}

// Shared base-1e7 division kernel. Only the final precision policy varies.
function divide(
	x : KernelDecimal,
	y : KernelDecimal,
	context : CalculationContext,
	precision : number,
	rounding : RoundingCode,
	integerQuotient : boolean
) : KernelDecimal
{
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);
	const sign = xState.s == yState.s ? 1 : -1;
	const xd = xState.d;
	const yd = yState.d;

	// Either NaN, Infinity or 0?
	if (!xd || !xd[0] || !yd || !yd[0])
	{
		return context.create(// Return NaN if either NaN, or both Infinity or 0.
		!xState.s || !yState.s || (xd ? yd && xd[0] == yd[0] : !yd) ? NaN :

		// Return ±0 if x is 0 or y is ±Infinity, or return ±Infinity as y is 0.
		xd && xd[0] == 0 || !yd ? sign * 0 : sign / 0);
	}

	const quotient = divideCoefficients(
		xd, xState.e, yd, yState.e,
		integerQuotient ? xState.e - yState.e + 1 : precision
	);
	const q = context.createResult({ d: quotient.digits, e: quotient.exponent, s: sign });

	return finalise(q, integerQuotient ? quotient.exponent + 1 : precision, rounding, quotient.more, context);
}
