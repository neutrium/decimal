import type { Decimal, DecimalValue } from '../../Decimal.js';
import type { CalculationContext } from '../../CalculationContext.js';
import { MODULO_EUCLID, ROUND_FLOOR } from '../../config/RoundingModes.js';
import { finalise } from '../utils/finalise.js';
import { divideInteger } from './div.js';
import { abs } from './abs.js';
import { mul } from './mul.js';
import { sub } from './add-subtract.js';
import { getDecimalState, getMutableDecimalState } from '../../DecimalState.js';
import { normaliseOperand } from '../utils/normalise-operand.js';

//
// Return a new Decimal whose value is the value of `x` modulo `y`, rounded to
// `precision` significant digits using rounding mode `rounding`.
//
// The result depends on the modulo mode.
//   n % 0 =  N
//   n % N =  N
//   n % I =  n
//   0 % n =  0
//  -0 % n = -0
//   0 % 0 =  N
//   0 % N =  N
//   0 % I =  0
//   N % n =  N
//   N % 0 =  N
//   N % N =  N
//   N % I =  N
//   I % n =  N
//   I % 0 =  N
//   I % N =  N
//   I % I =  N
//
export function mod(x: Decimal, yy : DecimalValue, context : CalculationContext) : Decimal
{
	let q;
	let y = normaliseOperand(yy, context);
	const xState = getDecimalState(x);
	const yState = getDecimalState(y);

	// Return NaN if x is ±Infinity or NaN, or y is NaN or ±0.
	if (!xState.d || !yState.s || yState.d && !yState.d[0])
	{
		return context.create(NaN);
	}

	// Return x if y is ±Infinity or x is ±0.
	if (!yState.d || xState.d && !xState.d[0])
	{
		return finalise(context.create(x), context.precision, context.roundingCode, undefined, context);
	}

	// Prevent rounding of intermediate calculations.
	const workingContext = context.withoutLimits();
	const moduloCode = context.moduloCode;

	if (moduloCode === MODULO_EUCLID)
	{
		// Euclidian division: q = sign(y) * floor(x / abs(y))
		// result = x - q * y    where  0 <= result < abs(y)
		q = divideInteger(x, abs(y, workingContext), workingContext, ROUND_FLOOR);
		getMutableDecimalState(q).s *= yState.s;
	}
	else
	{
		q = divideInteger(x, y, workingContext, moduloCode);
	}

	q = mul(q, y, workingContext);

	return sub(x, q, context);
}
