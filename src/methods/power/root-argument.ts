import type { KernelDecimal } from '../../KernelDecimal.js';
import type { CalculationContext } from '../../CalculationContext.js';
import { DecimalConstants } from '../../InternalConstants.js';
import { ROUND_DOWN } from '../../config/RoundingModes.js';
import { finalise } from '../utils/finalise.js';
import { getDecimalState } from '../../DecimalState.js';

/** Bound preliminary root work without ever modifying the exact original argument. */
export function rootArgument(x: KernelDecimal, precision: number, context: CalculationContext): KernelDecimal
{
	return getDecimalState(x).d!.length * DecimalConstants.LOG_BASE <= precision ? x
		: finalise(context.create(x), precision, ROUND_DOWN, undefined, context);
}
