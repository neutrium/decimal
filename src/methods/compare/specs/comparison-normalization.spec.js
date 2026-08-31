import { Decimal } from '../../../Decimal.ts';

describe('Decimal comparison operand normalization', () => {
	class CountingDecimal extends Decimal
	{
		static constructions = 0;

		constructor(...args)
		{
			super(...args);
			CountingDecimal.constructions++;
		}
	}

	it('does not clone existing Decimal operands for direct comparisons', () => {
		const left = new CountingDecimal('12345678901234567890');
		const right = new CountingDecimal('12345678901234567889');
		CountingDecimal.constructions = 0;

		expect(left.cmp(right)).toBe(1);
		expect(left.gt(right)).toBe(true);
		expect(left.gte(right)).toBe(true);
		expect(right.lt(left)).toBe(true);
		expect(right.lte(left)).toBe(true);
		expect(left.eq(right)).toBe(false);
		expect(CountingDecimal.constructions).toBe(0);
	});

	it('normalizes non-Decimal comparison operands without invoking a subclass', () => {
		const left = new CountingDecimal(10);
		CountingDecimal.constructions = 0;

		expect(left.cmp('9')).toBe(1);
		expect(CountingDecimal.constructions).toBe(0);
	});

	it('allocates only the final min or max result without invoking a subclass', () => {
		const middle = new CountingDecimal(10);
		const low = new CountingDecimal(5);
		const high = new CountingDecimal(15);
		CountingDecimal.constructions = 0;

		const minimum = CountingDecimal.min(middle, low, high);
		const maximum = CountingDecimal.max(middle, low, high);

		expect(minimum.toString()).toBe('5');
		expect(maximum.toString()).toBe('15');
		expect(minimum).toBeInstanceOf(Decimal);
		expect(maximum).toBeInstanceOf(Decimal);
		expect(minimum).not.toBeInstanceOf(CountingDecimal);
		expect(maximum).not.toBeInstanceOf(CountingDecimal);
		expect(minimum).not.toBe(low);
		expect(maximum).not.toBe(high);
		expect(CountingDecimal.constructions).toBe(0);
	});
});
