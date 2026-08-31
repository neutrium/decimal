import { Decimal } from '../Decimal.ts';
import { digits, state } from '../methods/utils/specs/decimal-state.js';
import { ROUNDING_MODES } from '../config/RoundingModes.ts';

describe('Shift representation and arithmetic composition', () => {
	const coefficients = ['1', '1.2', '-1234567.890123456789', '9999999.9999999', '10000000.0000001', '0.0000001'];
	const exponents = [-8, -7, -1, 0, 1, 6, 7, 8];

	it.each(Array.from({ length: 31 }, (_, i) => i - 15))(
		'matches freshly parsed values after shifting %i places', places => {
			const D = Decimal.clone({ precision: 100, toExpNeg: -7, toExpPos: 21 });
			for (const coefficient of coefficients) {
				for (const exponent of exponents) {
					const original = new D(`${coefficient}e${exponent}`);
					const shifted = original.shift(places);
					// Independent oracle: do not calculate the expected value using shift().
					const expected = new D(`${coefficient}e${exponent + places}`);
					expect(state(shifted)).toEqual(state(expected));
					expect(shifted.cmp(expected)).toBe(0);
					for (const predicate of ['isInt', 'isOdd', 'isEven', 'dp', 'precision']) {
						expect(shifted[predicate]()).toBe(expected[predicate]());
					}
					for (const method of ['add', 'sub', 'mul', 'div', 'mod', 'pow']) {
						expect(shifted[method](2).toValue()).toBe(expected[method](2).toValue());
					}
					expect(digits(shifted.shift(-places))).toEqual(digits(original));
					expect(shifted.shift(-places).toValue()).toBe(original.toValue());
				}
			}
		}
	);

	it.each(ROUNDING_MODES)('does not round during shifts under %s', rounding => {
		const D = Decimal.clone({ precision: 2, rounding, toExpNeg: -7, toExpPos: 21 });
		for (const places of [-8, -1, 0, 1, 8]) {
			const shifted = new D('-1.234567890123456789').shift(places);
			const expected = new D(`-1.234567890123456789e${places}`);
			expect(digits(shifted)).toEqual(digits(expected));
			expect(shifted.toValue()).toBe(expected.toValue());
			// Arithmetic still applies the configured rounding, after the exact shift.
			expect(shifted.mul(1).toValue()).toBe(expected.toSD(2).toValue());
		}
	});

	it('handles huge shifts and exponent limits without expanding the coefficient', () => {
		const D = Decimal.clone({ maxE: 9e15, minE: -9e15, toExpNeg: -7, toExpPos: 21 });
		for (const [exponent, places] of [
			[0, 9e15], [0, -9e15], [-9e15, 9e15], [9e15, -9e15],
			[-9e15, Number.MAX_SAFE_INTEGER], [9e15, -Number.MAX_SAFE_INTEGER]
		]) {
			const shifted = new D(`1.23456789e${exponent}`).shift(places);
			const expected = new D(`1.23456789e${exponent + places}`);
			expect(digits(shifted)).toEqual(digits(expected));
			expect(shifted.toValue()).toBe(expected.toValue());
			expect(shifted.mul(1).toValue()).toBe(expected.toValue());
			expect(digits(shifted).length).toBeLessThanOrEqual(3);
		}
		expect(new D(1).shift(Number.MAX_SAFE_INTEGER).toValue()).toBe('Infinity');
		expect(new D(-1).shift(-Number.MAX_SAFE_INTEGER).toValue()).toBe('-0');
		expect(new D('1e9000000000000000').shift(1).toValue()).toBe('Infinity');
		expect(new D('-1e-9000000000000000').shift(-1).toValue()).toBe('-0');
	});

	it('preserves frozen inputs without invoking subclass construction', () => {
		let constructions = 0;
		class Tagged extends Decimal {
			constructor(value) {
				super(value);
				constructions++;
			}
		}
		Tagged.config = { precision: 30 };
		const original = new Tagged('9999999.123456789');
		const originalDigits = digits(original).slice();
		Object.freeze(original);
		constructions = 0;
		for (const places of [-8, -7, -1, 0, 1, 7, 8]) {
			const shifted = original.shift(places);
			expect(shifted).toBeInstanceOf(Decimal);
			expect(shifted).not.toBeInstanceOf(Tagged);
			expect(shifted).not.toBe(original);
			expect(digits(shifted)).not.toBe(digits(original));
			expect(shifted.mul(1).toValue()).toBe(new Decimal(`9999999.123456789e${places}`).toValue());
		}
		expect(constructions).toBe(0);
		expect(digits(original)).toEqual(originalDigits);
		expect(original.toValue()).toBe('9999999.123456789');
	});

	it.each(['0', '-0', 'Infinity', '-Infinity', 'NaN'])('preserves %s and result identity', value => {
		const original = new Decimal(value);
		for (const places of [-Number.MAX_SAFE_INTEGER, -1, 0, 1, Number.MAX_SAFE_INTEGER]) {
			const shifted = original.shift(places);
			expect(shifted.toValue()).toBe(value);
			expect(shifted).not.toBe(original);
		}
	});
});
