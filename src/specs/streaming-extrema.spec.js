import { Decimal } from '../Decimal.ts';
import { digits } from '../methods/utils/specs/decimal-state.js';

describe('Static min/max', () => {
	it('accepts scalar values and requires callers to spread collections', () => {
		expect(Decimal.min(1, '7', '-2', '3', '-4').toString()).toBe('-4');
		expect(Decimal.max(1, '7', '-2', '3', '-4').toString()).toBe('7');
		expect(() => Decimal.min()).toThrow();
		expect(() => Decimal.max([1, 2])).toThrow();
	});

	it('stops normalizing values once an operand is NaN', () => {
		expect(Decimal.min(1, NaN, 'invalid').isNaN()).toBe(true);
		expect(Decimal.max(NaN, 'invalid').isNaN()).toBe(true);
	});

	it('preserves signed-zero selection and creates the result with the receiving constructor', () => {
		const D = Decimal.clone();
		const foreign = new Decimal(-5);
		const minimum = D.min(1, foreign);
		expect(minimum).toBeInstanceOf(D);
		expect(minimum).not.toBe(foreign);
		expect(digits(minimum)).not.toBe(digits(foreign));
		expect(D.min(0, -0, 0).toValue()).toBe('-0');
		expect(D.max(-0, 0, -0).toValue()).toBe('0');
		expect(D.min(foreign)).not.toBe(foreign);
		expect(D.max(foreign)).not.toBe(foreign);
	});
});
