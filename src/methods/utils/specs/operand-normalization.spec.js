import { CalculationContext } from '../../../CalculationContext.ts';
import { Decimal } from '../../../Decimal.ts';
import { normaliseOperand } from '../normalise-operand.ts';

describe('shared operand normalization', () => {
	it('reuses an existing Decimal without cloning or applying another constructor\'s limits', () => {
		const Limited = Decimal.clone({ minE: -2, maxE: 2 });
		const context = new CalculationContext(Limited, Limited.config);
		const operand = new Decimal('1000');

		expect(normaliseOperand(operand, context)).toBe(operand);
	});

	it('parses primitive operands exactly with the active calculation constructor', () => {
		const Limited = Decimal.clone({ minE: -2, maxE: 2 });
		const context = new CalculationContext(Limited, Limited.config);
		const operand = normaliseOperand('1000', context);

		expect(operand).toBeInstanceOf(Limited);
		expect(operand.toValue()).toBe('1000');
	});
});
