import type { CalculationContext } from '../../CalculationContext.js';
import type { KernelDecimal } from '../../KernelDecimal.js';
import type { DecimalValue } from '../../DecimalBase.js';

/** Reuse a Decimal operand, or parse another accepted value without applying output limits. */
export function normaliseOperand(
	value : DecimalValue,
	context : CalculationContext
) : KernelDecimal
{
	return context.isDecimal(value)
		? value
		: context.createExact(value);
}
