import { Decimal as Arithmetic } from '../../../arithmetic.ts';
import { Decimal as Scientific } from '../../../scientific.ts';
import { Decimal as Core } from '../../../core.ts';

const modes = ['up', 'down', 'ceil', 'floor', 'half-up', 'half-down', 'half-even', 'half-ceil', 'half-floor'];

describe('Decimal powInteger', () => {
	it('is an arithmetic capability inherited by scientific and cloned constructors', () => {
		expect(Core.prototype.powInteger).toBeUndefined();
		expect(Scientific.prototype.powInteger).toBe(Arithmetic.prototype.powInteger);
		for (const Source of [Arithmetic, Scientific]) {
			const D = Source.clone({ precision: 20 });
			const result = new D('1.25').powInteger(-3);
			expect(result.toValue()).toBe('0.512');
			expect(result).toBeInstanceOf(D);
		}
	});

	it('rejects invalid exponents before inspecting special bases or coercing input', () => {
		for (const exponent of [1.5, -0.5, NaN, Infinity, -Infinity, 2 ** 53, -(2 ** 53), '2', 2n, null, undefined, new Arithmetic(2)]) {
			for (const base of [0, 1, NaN, Infinity]) {
				expect(() => new Arithmetic(base).powInteger(exponent)).toThrow(expect.objectContaining({ code: 'INVALID_ARGUMENT' }));
			}
		}
	});

	it('preserves signed zero, infinity and NaN semantics', () => {
		for (const base of [0, -0, Infinity, -Infinity, NaN, 1, -1]) {
			for (const exponent of [-3, -2, -1, -0, 0, 1, 2, 3, Number.MAX_SAFE_INTEGER, -Number.MAX_SAFE_INTEGER]) {
				expect(Object.is(new Arithmetic(base).powInteger(exponent).toNumber(), base ** exponent)).toBe(true);
			}
		}
	});

	it.each(modes)('matches an exact BigInt power oracle with %s rounding', rounding => {
		for (const precision of [1, 3, 12, 20]) {
			const D = Arithmetic.clone({ precision, rounding });
			for (const coefficient of [125n, -205n, 9999999n, -10000001n, 314159265358979n]) {
				for (const scale of [-2, -7]) for (const exponent of [-37, -3, -1, 0, 1, 2, 3, 31]) {
					const count = Math.abs(exponent);
					const exact = `${coefficient ** BigInt(count)}e${scale * count}`;
					const expected = exponent < 0 ? new D(1).div(exact) : new D(exact).toSD(precision);
					const input = new D(`${coefficient}e${scale}`), before = input.toValue();
					expect(input.powInteger(exponent).toValue()).toBe(expected.toValue());
					expect(input.toValue()).toBe(before);
				}
			}
		}
	});

	it.each(modes)('resolves exact reciprocal ties with %s rounding', rounding => {
		const D = Arithmetic.clone({ precision: 2, rounding });
		for (const base of ['2', '-2', '0.5', '-0.5']) {
			for (const exponent of [-3, 3]) {
				const exact = new Arithmetic(base).powInteger(exponent).toValue();
				expect(new D(base).powInteger(exponent).toValue()).toBe(new D(exact).toSD(2).toValue());
			}
		}
	});

	it('refines long input tails beyond the initial working precision', () => {
		const input = '1.' + '0'.repeat(299) + '1';
		const Up = Arithmetic.clone({ precision: 10, rounding: 'up' });
		const Down = Arithmetic.clone({ precision: 10, rounding: 'down' });
		expect(new Up(input).powInteger(2).toValue()).toBe('1.000000001');
		expect(new Down(input).powInteger(2).toValue()).toBe('1');
		expect(new Up(input).powInteger(-2).toValue()).toBe('1');
		expect(new Down(input).powInteger(-2).toValue()).toBe('0.9999999999');
	});

	it('applies range limits only after reciprocal evaluation and final rounding', () => {
		const D = Arithmetic.clone({ precision: 2, minE: -10, maxE: 2 });
		expect(new D('10').powInteger(-4).toValue()).toBe('0.0001');
		expect(new D('0.01').powInteger(-2).toValue()).toBe('Infinity');
		expect(new D('-10').powInteger(-11).toValue()).toBe('-0');
		const Boundary = Arithmetic.clone({ precision: 1, minE: -2, maxE: 2 });
		expect(new Boundary('0.099').powInteger(2).toValue()).toBe('0.01');
		expect(new Boundary('31').powInteger(2).toValue()).toBe('Infinity');
	});

	it('keeps enormous exponent products exact and does not expand enormous coefficients', () => {
		const D = Arithmetic.clone({ precision: 20 });
		const maximum = Number.MAX_SAFE_INTEGER;
		expect(new D('1e9000000000000000').powInteger(maximum).toValue()).toBe('Infinity');
		expect(new D('-1e9000000000000000').powInteger(-maximum).toValue()).toBe('-0');
		expect(new D('1e-9000000000000000').powInteger(-maximum).toValue()).toBe('Infinity');
		expect(new D(2).powInteger(1000000).toValue()).toBe('9.9006562292958982507e+301029');
		expect(new D(2).powInteger(-1000000).toValue()).toBe('1.0100340591980302247e-301030');
	});

	it('does not call public formatting or arithmetic methods or mutate frozen inputs', () => {
		const D = Arithmetic.clone({ precision: 8, maxOutputDigits: 1 });
		const input = new D('1.23456789');
		for (const name of ['toString', 'toValue', 'mul', 'div']) Object.defineProperty(input, name, { value: () => { throw Error('public reentry'); } });
		Object.freeze(input);
		expect(input.powInteger(3).eq('1.8816764')).toBe(true);
	});

	it('shares integer results with scientific pow while retaining fractional and large exponents', () => {
		const D = Scientific.clone({ precision: 12 });
		for (const exponent of [-100, -3, 0, 1, 3, 100]) {
			const input = new D('1.23456789');
			expect(input.pow(String(exponent)).toValue()).toBe(input.powInteger(exponent).toValue());
		}
		expect(new D(4).pow('0.5').toValue()).toBe('2');
		expect(new D(1).pow('9007199254740992').toValue()).toBe('1');
	});
});
