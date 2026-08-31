import type { CalculationContext } from '../../CalculationContext.js';
import type { Decimal, DecimalValue } from '../../Decimal.js';

/** Reuse a Decimal operand, or parse another accepted value without applying output limits. */
export function normaliseOperand(
	value : DecimalValue,
	context : CalculationContext
) : Decimal
{
	return context.isDecimal(value)
		? value
		: context.createExact(value);
}
