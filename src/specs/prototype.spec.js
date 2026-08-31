import { Decimal } from '../Decimal.ts';

describe('Decimal instance methods', () => {
	it('shares methods through the prototype', () => {
		const first = new Decimal(1);
		const second = new Decimal(2);

		expect(Object.prototype.hasOwnProperty.call(first, 'add')).toBe(false);
		expect(Object.prototype.hasOwnProperty.call(first, 'toString')).toBe(false);
		expect(first.add).toBe(second.add);
		expect(first.toString).toBe(second.toString);
		expect(Object.values(first).filter(value => typeof value === 'function')).toEqual([]);
	});

	it('shares the base methods with cloned constructors', () => {
		const Clone = Decimal.clone();
		const decimal = new Decimal(1);
		const clone = new Clone(1);

		expect(clone.add).toBe(decimal.add);
		expect(clone.toString).toBe(decimal.toString);
	});
});
