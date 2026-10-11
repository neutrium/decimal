import { Decimal as CoreDecimal } from '../core.ts';
import { Decimal as ArithmeticDecimal } from '../arithmetic.ts';
import { Decimal as ScientificDecimal } from '../scientific.ts';

describe('toBytes', () => {
	it('estimates the stored numeric state from coefficient words', () => {
		expect(new CoreDecimal('NaN').toBytes()).toBe(24);
		expect(new CoreDecimal('Infinity').toBytes()).toBe(24);
		expect(new CoreDecimal('-Infinity').toBytes()).toBe(24);
		expect(new CoreDecimal(0).toBytes()).toBe(32);
		expect(new CoreDecimal(1).toBytes()).toBe(32);
		expect(new CoreDecimal('12345678').toBytes()).toBe(40);
		expect(new CoreDecimal('123456789012345678901234567890').toBytes()).toBe(64);
	});

	it('depends on stored precision rather than exponent magnitude', () => {
		expect(new CoreDecimal('1e+1000000').toBytes()).toBe(32);
		expect(new CoreDecimal('1e-1000000').toBytes()).toBe(32);
	});

	it('is inherited by every public feature tier', () => {
		for (const Constructor of [CoreDecimal, ArithmeticDecimal, ScientificDecimal]) {
			expect(new Constructor('12345678').toBytes()).toBe(40);
			expect(Object.hasOwn(Constructor.prototype, 'toBytes')).toBe(Constructor === CoreDecimal);
		}
	});
});
