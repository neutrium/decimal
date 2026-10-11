import { Decimal as Arithmetic } from '../../../arithmetic.ts';
import { Decimal as Scientific } from '../../../scientific.ts';
import { Decimal as Core } from '../../../core.ts';

const modes = ['up', 'down', 'ceil', 'floor', 'half-up', 'half-down', 'half-even', 'half-ceil', 'half-floor'];
const term = (numerator, denominator = 1n, exponent = 0n) => ({ numerator, denominator, exponent });
const huge = 10n ** 100n;

// Independent small-input oracle: expand the complete rational expression before
// delegating its one exact quotient to the existing Decimal division implementation.
function oracle(D, terms) {
	const exponent = terms.reduce((e, t) => t.exponent < e ? t.exponent : e, 0n);
	const denominator = terms.reduce((d, t) => d * t.denominator, 1n);
	const numerator = terms.reduce((n, t) => n + t.numerator * (denominator / t.denominator) * 10n ** (t.exponent - exponent), 0n);
	if (!numerator) return new D(D.config.rounding === 'floor' && terms.some(t => t.numerator) ? -0 : 0);
	return new D(`${numerator}e${exponent}`).div(denominator);
}

describe('Decimal.fromRationalSum', () => {
	it('is available only in arithmetic and richer tiers and preserves cloned constructors', () => {
		expect(Core.fromRationalSum).toBeUndefined();
		expect(Scientific.fromRationalSum).toBe(Arithmetic.fromRationalSum);
		for (const Source of [Arithmetic, Scientific]) {
			const D = Source.clone({ precision: 10 });
			const result = D.fromRationalSum([term(1n, 3n), term(2n, 3n)]);
			expect(result.toValue()).toBe('1');
			expect(result).toBeInstanceOf(D);
		}
		expect(Scientific.fromRationalSum([term(4n)]).sqrt().toValue()).toBe('2');
	});

	it('does not invoke application subclass constructors', () => {
		class Custom extends Arithmetic { constructor() { throw Error('custom constructor'); } }
		Custom.config = { precision: 2 };
		const result = Custom.fromRationalSum([term(1n, 3n)]);
		expect(result.toValue()).toBe('0.33');
		expect(result).toBeInstanceOf(Arithmetic);
		expect(result).not.toBeInstanceOf(Custom);
	});

	it('consumes an iterable once and captures configuration before consumption', () => {
		const D = Arithmetic.clone({ precision: 3 });
		function* terms() { yield term(1n, 3n); D.config = { precision: 8 }; yield term(1n, 3n); }
		expect(D.fromRationalSum(terms()).toValue()).toBe('0.667');
		expect(D.fromRationalSum(new Set([term(1n, 3n)])).toValue()).toBe('0.33333333');
	});

	it.each(modes)('matches exact rational oracles using %s rounding', rounding => {
		let seed = 98765;
		const random = max => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max; };
		for (const precision of [1, 2, 7, 20, 60]) {
			const D = Arithmetic.clone({ precision, rounding });
			for (let i = 0; i < 70; i++) {
				const terms = Array.from({ length: 1 + random(7) }, () => term(BigInt(random(2001) - 1000), BigInt(1 + random(99)), BigInt(random(25) - 12)));
				expect(D.fromRationalSum(terms).toValue()).toBe(oracle(D, terms).toValue());
			}
		}
	});

	it.each(modes)('resolves exact half ties and arbitrarily distant residuals with %s rounding', rounding => {
		const D = Arithmetic.clone({ precision: 2, rounding });
		for (const sign of [-1n, 1n]) for (const tail of [-1n, 0n, 1n]) {
			const actual = D.fromRationalSum([term(sign * 5n, 4n), term(sign * tail, 3n, -huge)]);
			const reference = oracle(D, [term(sign * 5n, 4n), term(sign * tail, 3n, -10n)]);
			expect(actual.toValue()).toBe(reference.toValue());
		}
	});

	it.each(modes)('handles tails across decimal boundaries with %s rounding', rounding => {
		const D = Arithmetic.clone({ precision: 12, rounding });
		for (const sign of [-1n, 1n]) for (const tail of [-1n, 1n]) {
			const actual = D.fromRationalSum([term(sign), term(sign * tail, 1n, -huge)]);
			expect(actual.toValue()).toBe(oracle(D, [term(sign), term(sign * tail, 1n, -30n)]).toValue());
		}
	});

	it('cancels huge exponents before enforcing narrow output limits', () => {
		const D = Arithmetic.clone({ precision: 5, minE: -2, maxE: 2 });
		expect(D.fromRationalSum([term(1n, 3n, huge), term(-2n, 6n, huge), term(7n, 2n)]).toValue()).toBe('3.5');
		expect(D.fromRationalSum([term(1n, 3n, -huge), term(2n, 6n, -huge)]).toValue()).toBe('0');
		expect(D.fromRationalSum([term(-1n, 3n, -huge)]).toValue()).toBe('-0');
		expect(D.fromRationalSum([term(1n, 3n, huge)]).toValue()).toBe('Infinity');
		expect(D.fromRationalSum([term(-1n, 3n, huge)]).toValue()).toBe('-Infinity');
		expect(D.fromRationalSum([term(1n, 1n, 3n), term(-999n)]).toValue()).toBe('1');
	});

	it('applies exponent limits after rounding carries and summing sub-boundary terms', () => {
		const D = Arithmetic.clone({ precision: 2, minE: -2, maxE: 2 });
		expect(D.fromRationalSum([term(995n, 1n, -5n)]).toValue()).toBe('0.01');
		expect(D.fromRationalSum([term(994n, 1n, -5n)]).toValue()).toBe('0');
		expect(D.fromRationalSum([term(-995n, 1n, -5n)]).toValue()).toBe('-0.01');
		expect(D.fromRationalSum([term(995n)]).toValue()).toBe('Infinity');
		expect(D.fromRationalSum([term(5n, 1n, -3n), term(5n, 1n, -3n)]).toValue()).toBe('0.01');
	});

	it('preserves exponent alignment and exact digits at the supported range edges', () => {
		const D = Arithmetic.clone({ precision: 20 });
		for (const exponent of [-9000000000000000n, -8999999999999999n, 8999999999999999n, 9000000000000000n]) {
			const result = D.fromRationalSum([term(12345n, 10000n, exponent)]);
			const expected = new D(`1.2345e${exponent}`);
			expect(result.eq(expected)).toBe(true);
			expect(result.mul(1).eq(expected)).toBe(true);
		}
	});

	it.each(modes)('defines zero signs consistently with %s rounding', rounding => {
		const D = Arithmetic.clone({ rounding });
		expect(D.fromRationalSum([]).toValue()).toBe('0');
		expect(D.fromRationalSum([term(0n, 3n, huge)]).toValue()).toBe('0');
		expect(D.fromRationalSum([term(1n), term(-1n)]).toValue()).toBe(new D(1).sub(1).toValue());
	});

	it('does not mutate retained input or depend on output formatting limits', () => {
		const D = Arithmetic.clone({ precision: 30, maxOutputDigits: 1, maxPrefixedDigits: 1 });
		const terms = Object.freeze([Object.freeze(term(1n, 7n)), Object.freeze(term(6n, 7n))]);
		expect(D.fromRationalSum(terms).eq(1)).toBe(true);
		expect(D.fromRationalSum(terms).eq(1)).toBe(true);
		expect(D.fromRationalSum([term(12345678901234567890123456789n)]).eq('12345678901234567890123456789')).toBe(true);
	});

	it('copies each yielded record before advancing a generator that reuses it', () => {
		const value = term(1n, 3n);
		function* input() { yield value; value.numerator = 2n; yield value; value.numerator = 999n; }
		expect(Arithmetic.fromRationalSum(input()).toValue()).toBe('1');
	});

	it('rejects invalid input, including later invalid terms after apparent overflow', () => {
		for (const input of [null, undefined, 1, 1n, '', 'abc', {}, { [Symbol.iterator]: 1 }])
			expect(() => Arithmetic.fromRationalSum(input)).toThrow(expect.objectContaining({ code: 'INVALID_ARGUMENT' }));
		for (const value of [null, undefined, 1, {}, term(1), term(1n, 1), term(1n, 0n), term(1n, -2n), term(1n, 1n, 0), term(0n, 0n)]) {
			expect(() => Arithmetic.fromRationalSum([value])).toThrow(expect.objectContaining({ code: 'INVALID_ARGUMENT' }));
			expect(() => Arithmetic.fromRationalSum([term(1n, 1n, huge), value])).toThrow(expect.objectContaining({ code: 'INVALID_ARGUMENT' }));
		}
	});
});
