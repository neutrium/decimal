import { Decimal } from '../../../Decimal.ts';

describe('Decimal shift', () => {
	beforeEach(() => {
		Decimal.config = {
			precision: 20,
			rounding: 'half-up',
			toExpNeg: -9e15,
			toExpPos: 9e15,
			minE: -9e15,
			maxE: 9e15
		};
	});

	it.each([
		['12345', '123.45', 2],
		['0.12345', '123.45', -3],
		['123.45', '123.45', 0],
		['1000000000000000000000000000000', '1', 30],
		['0.000000000000000000000000000001', '1', -30],
		['1', '1e+9000000000000000', -9000000000000000]
	])('shifts %s by %i places', (expected, value, places) => {
		expect(new Decimal(value).shift(places).toString()).toBe(expected);
	});

	it('does not round the significand', () => {
		const LowPrecision = Decimal.clone({ precision: 2 });

		expect(new LowPrecision('1.23456789').shift(4).toString()).toBe('12345.6789');
	});

	it('preserves special values and the sign of zero', () => {
		expect(new Decimal('Infinity').shift(2).toString()).toBe('Infinity');
		expect(new Decimal('-Infinity').shift(-2).toString()).toBe('-Infinity');
		expect(new Decimal('NaN').shift(2).toString()).toBe('NaN');
		expect(new Decimal('-0').shift(2).toValue()).toBe('-0');
	});

	it('uses the active constructor exponent limits', () => {
		const Limited = Decimal.clone({ maxE: 2, minE: -2 });

		expect(new Limited('9.99').shift(2).toString()).toBe('999');
		expect(new Limited('9.99').shift(3).toString()).toBe('Infinity');
		expect(new Limited(1).shift(-2).toString()).toBe('0.01');
		expect(new Limited(1).shift(-3).toString()).toBe('0');
		expect(new Limited(1).shift(1)).toBeInstanceOf(Limited);
	});

	it.each([1.5, NaN, Infinity, -Infinity, '2', Number.MAX_SAFE_INTEGER + 1])(
		'rejects invalid shift count %s',
		places => {
			expect(() => new Decimal(1).shift(places)).toThrowError('[DecimalError] Invalid argument:');
		}
	);
});
