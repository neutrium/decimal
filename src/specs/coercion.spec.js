import { Decimal } from '../Decimal.ts';

describe('Decimal coercion and JSON serialization', () => {
	beforeAll(() => {
		Decimal.config = {
			precision: 20,
			rounding: 'half-up',
			toExpNeg: -7,
			toExpPos: 21
		};
	});

	it('uses the canonical representation for string coercion', () => {
		const value = new Decimal('123.45');

		expect(String(value)).toBe('123.45');
		expect(`${value}`).toBe('123.45');
		expect(String(new Decimal('-0'))).toBe('0');
	});

	it('uses an exact string for default coercion', () => {
		const value = new Decimal('9007199254740993');

		expect(value.valueOf()).toBe('9007199254740993');
		expect(value + '').toBe('9007199254740993');
		expect(new Decimal(2) + new Decimal(3)).toBe('23');
		expect(new Decimal('-0') + '').toBe('-0');
	});

	it('converts to a JavaScript number for numeric coercion', () => {
		const value = new Decimal('12.5');

		expect(Number(value)).toBe(12.5);
		expect(+value).toBe(12.5);
		expect(new Decimal(5) - new Decimal(2)).toBe(3);
		expect(Object.is(Number(new Decimal('-0')), -0)).toBe(true);
	});

	it('serializes values as exact JSON strings', () => {
		const payload = {
			finite: new Decimal('9007199254740993.25'),
			negativeZero: new Decimal('-0'),
			infinity: new Decimal(Infinity),
			nan: new Decimal(NaN)
		};

		expect(JSON.stringify(payload)).toBe(
			'{"finite":"9007199254740993.25","negativeZero":"-0","infinity":"Infinity","nan":"NaN"}'
		);
		expect(payload.finite.toJSON()).toBe('9007199254740993.25');
	});
});
