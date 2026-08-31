import { Decimal } from '../Decimal.ts';

describe('Decimal context-free methods', () => {
	it('does not resolve a calculation context for representation-only operations', () => {
		class ContextTrapDecimal extends Decimal {}
		Object.defineProperty(ContextTrapDecimal.prototype, 'constructor', {
			get() {
				throw new Error('calculation context resolved');
			}
		});
		const value = new ContextTrapDecimal('-123.5');
		const smaller = new Decimal('-124');

		expect(value.dp()).toBe(1);
		expect(value.precision()).toBe(4);
		expect(value.sign()).toBe(-1);
		expect(value.isFinite()).toBe(true);
		expect(value.isInt()).toBe(false);
		expect(value.isNaN()).toBe(false);
		expect(value.isNeg()).toBe(true);
		expect(value.isPos()).toBe(false);
		expect(value.isZero()).toBe(false);
		expect(value.isOdd()).toBe(false);
		expect(value.isEven()).toBe(false);
		expect(value.toNumber()).toBe(-123.5);
		expect(value.cmp(smaller)).toBe(1);
		expect(value.eq(smaller)).toBe(false);
		expect(value.gt(smaller)).toBe(true);
		expect(value.gte(smaller)).toBe(true);
		expect(value.lt(smaller)).toBe(false);
		expect(value.lte(smaller)).toBe(false);
	});
});
