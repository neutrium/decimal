import { Decimal as Core } from '../core.ts';
import { Decimal as Arithmetic } from '../arithmetic.ts';
import { Decimal as Scientific } from '../scientific.ts';

describe('Decimal.toRationalTerm', () => {
	it.each([
		['0', 0n, 0n], ['-0', 0n, 0n], ['1', 1n, 0n], ['-123.45', -12345n, -2n],
		['123.45000', 12345n, -2n], ['10000000', 1n, 7n], ['0.00000001', 1n, -8n],
		['123456780000000', 12345678n, 7n], ['100000000000000000001', 100000000000000000001n, 0n],
		['-0.000123456789012345678900', -1234567890123456789n, -22n],
		['0xff', 255n, 0n], ['0b1.01p+3', 1n, 1n],
	])('extracts normalized exact terms from %s', (input, numerator, exponent) => {
		expect(new Core(input).toRationalTerm()).toEqual({ numerator, denominator: 1n, exponent });
	});

	it('is inherited unchanged by every tier and clone', () => {
		for (const Source of [Core, Arithmetic, Scientific]) {
			expect(Source.prototype.toRationalTerm).toBe(Core.prototype.toRationalTerm);
			const D = Source.clone({ precision: 1, maxOutputDigits: 1 });
			expect(new D('1.23456789').toRationalTerm()).toEqual({ numerator: 123456789n, denominator: 1n, exponent: -8n });
		}
	});

	it('keeps enormous positive and negative exponents separate from the coefficient', () => {
		for (const exponent of [-9000000000000000n, -1000000000n, 1000000000n, 8999999999999994n]) {
			for (let offset = 0n; offset < 7n; offset++) {
				const e = exponent + offset;
				expect(new Core(`-1.2345e${e}`).toRationalTerm()).toEqual({ numerator: -12345n, denominator: 1n, exponent: e - 4n });
			}
		}
	});

	it('round trips all coefficient word alignments and signs through rational construction', () => {
		const D = Arithmetic.clone({ precision: 60 });
		for (const coefficient of [1n, -125n, 10000001n, -123456789012345678901234567891n]) {
			for (let exponent = -25n; exponent <= 25n; exponent++) {
				const input = new D(`${coefficient}e${exponent}`), term = input.toRationalTerm();
				expect(term).toEqual({ numerator: coefficient, denominator: 1n, exponent });
				expect(D.fromRationalSum([term]).eq(input)).toBe(true);
			}
		}
	});

	it('converts a large coefficient without rounding to configured precision', () => {
		const digits = '1234567890'.repeat(1000) + '123';
		const D = Core.clone({ precision: 1, maxOutputDigits: 1 });
		const value = new D(`${digits}e-99999`);
		expect(value.toRationalTerm()).toEqual({ numerator: BigInt(digits), denominator: 1n, exponent: -99999n });
	});

	it('returns independent immutable records without modifying the receiver', () => {
		const value = Object.freeze(new Core('123.4500'));
		const a = value.toRationalTerm(), b = value.toRationalTerm();
		expect(a).not.toBe(b);
		expect(Object.isFrozen(a)).toBe(true);
		expect(() => { a.numerator = 0n; }).toThrow(TypeError);
		expect(value.toValue()).toBe('123.45');
		expect(value.toRationalTerm()).toEqual(b);
	});

	it('ignores later configuration changes and overridden public formatting methods', () => {
		const D = Core.clone({ precision: 20 });
		const value = new D('12345.6789');
		D.config = { precision: 1, minE: 0, maxE: 0, maxOutputDigits: 1 };
		for (const name of ['toString', 'toValue', 'toNumber', 'precision', 'isFinite', 'sign']) {
			Object.defineProperty(value, name, { value: () => { throw Error('public reentry'); } });
		}
		Object.defineProperty(value, 'constructor', { get() { throw Error('context resolved'); } });
		expect(value.toRationalTerm()).toEqual({ numerator: 123456789n, denominator: 1n, exponent: -4n });
	});

	it('rejects nonfinite values without trying to serialize them', () => {
		for (const input of ['NaN', 'Infinity', '-Infinity']) {
			const value = new Core(input);
			Object.defineProperty(value, 'toString', { value: () => { throw Error('formatting attempted'); } });
			expect(() => value.toRationalTerm()).toThrow(expect.objectContaining({ code: 'INVALID_ARGUMENT' }));
		}
	});

	it('documents the loss of negative-zero sign in the rational representation', () => {
		const negativeZero = new Arithmetic(-0);
		expect(Object.is(negativeZero.sign(), -0)).toBe(true);
		const result = Arithmetic.fromRationalSum([negativeZero.toRationalTerm()]);
		expect(Object.is(result.sign(), 0)).toBe(true);
	});
});
