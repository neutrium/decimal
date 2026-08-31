import { Decimal } from '../Decimal.ts';
import { digits } from '../methods/utils/specs/decimal-state.js';

describe('Decimal representation immutability', () => {
	it('keeps representation unreachable from public values', () => {
		const value = new Decimal('12.5');

		expect(Object.keys(value)).toEqual([]);
		expect(Object.isExtensible(value)).toBe(true);
		expect('d' in value).toBe(false);
		expect('e' in value).toBe(false);
		expect('s' in value).toBe(false);
		expect(Object.isFrozen(digits(value))).toBe(false);
		expect(value.toValue()).toBe('12.5');
	});

	it('ignores shadow properties and freezes public tuple conversions', () => {
		const value = new Decimal('1.25').mul(2);
		Object.defineProperties(value, {
			d: { value: [9] },
			e: { value: 99 },
			s: { value: -1 }
		});
		const fraction = value.toFraction();

		expect(value.toValue()).toBe('2.5');
		expect(value.add(1).toValue()).toBe('3.5');
		expect(Object.isFrozen(fraction)).toBe(true);
		expect(fraction.map(item => item.toValue())).toEqual(['5', '2']);
	});

	it('allows derived classes to initialize fields without affecting numeric state', () => {
		class Money extends Decimal {
			currency = 'AUD';
			d = [7];
			e = 10;
			s = -1;
		}

		const value = new Money('12.5');
		expect(value.currency).toBe('AUD');
		expect(value.toValue()).toBe('12.5');
		expect(value.add(1).toValue()).toBe('13.5');
	});

	it('does not expose named mutable allocation hooks on the public constructor', () => {
		for (const name of [
			'createForCalculation',
			'createResultForCalculation',
			'getCalculationConstructor',
			'getDefaultCalculationContext'
		]) {
			expect(Object.hasOwn(Decimal, name)).toBe(false);
		}
	});
});
