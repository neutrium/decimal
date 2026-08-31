import type { Decimal } from '../../Decimal.js';
import type { CalculationContext } from '../../CalculationContext.js';
import { DecimalConstants } from '../../InternalConstants.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { finalise } from '../utils/finalise.js';
import { getDecimalState } from '../../DecimalState.js';

/** Bound preliminary root work without ever modifying the exact original argument. */
export function rootArgument(x: Decimal, precision: number, context: CalculationContext): Decimal
{
	return getDecimalState(x).d!.length * DecimalConstants.LOG_BASE <= precision ? x
		: finalise(context.create(x), precision, ROUND_DOWN, undefined, context);
}
