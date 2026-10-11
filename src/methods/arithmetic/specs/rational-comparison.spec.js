import { Decimal as Arithmetic } from '../../../arithmetic.ts';
import { Decimal as Scientific } from '../../../scientific.ts';
import { Decimal as Core } from '../../../core.ts';

const term = (numerator, denominator = 1n, exponent = 0n) => ({ numerator, denominator, exponent });
const huge = 10n ** 100n;

describe('Decimal.compareRationalSum', () => {
	it('is inherited by scientific and cloned constructors, but absent from core', () => {
		expect(Core.compareRationalSum).toBeUndefined();
		expect(Scientific.compareRationalSum).toBe(Arithmetic.compareRationalSum);
		for (const D of [Arithmetic, Scientific, Arithmetic.clone(), Scientific.clone()]) {
			expect(D.compareRationalSum([term(1n, 3n), term(-1n, 2n)])).toBe(-1);
			expect(D.compareRationalSum([term(1n, 2n), term(-1n, 3n)])).toBe(1);
		}
	});

	it('returns positive zero for empty, all-zero and exactly cancelling inputs', () => {
		const D = Arithmetic.clone({ rounding: 'floor' });
		for (const terms of [[], [term(0n)], [term(1n, 3n), term(-2n, 6n)],
			[term(1n, 3n, huge), term(-2n, 6n, huge)]])
			expect(Object.is(D.compareRationalSum(terms), 0)).toBe(true);
	});

	it.each(['up', 'down', 'ceil', 'floor', 'half-up', 'half-down', 'half-even', 'half-ceil', 'half-floor'])
	('preserves residual signs beyond precision and range with %s rounding', rounding => {
		const D = Arithmetic.clone({ precision: 1, minE: -2, maxE: 2, maxOutputDigits: 1, rounding });
		for (const sign of [-1n, 1n]) {
			const terms = [term(1n, 3n, huge), term(-2n, 6n, huge), term(sign, 7n, -huge)];
			expect(D.compareRationalSum(terms)).toBe(Number(sign));
			expect(D.compareRationalSum([term(sign, 3n, huge)])).toBe(Number(sign));
			expect(D.compareRationalSum([term(1n), term(-1n), term(sign, 1n, -1000n)])).toBe(Number(sign));
		}
	});

	it('never reads configuration or invokes a constructor or formatter', () => {
		class Unusable extends Arithmetic {
			constructor() { throw Error('constructor'); }
			static context() { throw Error('context'); }
			static get config() { throw Error('config'); }
		}
		expect(Unusable.compareRationalSum([term(-1n, 3n, -huge)])).toBe(-1);
		const compare = Arithmetic.compareRationalSum;
		expect(compare([term(1n)])).toBe(1);
	});

	it('consumes single-use iterators once and snapshots reused term objects', () => {
		const shared = term(1n, 3n);
		function* input() { yield shared; shared.numerator = -2n; yield shared; }
		expect(Arithmetic.compareRationalSum(input())).toBe(-1);
		const terms = Object.freeze([Object.freeze(term(1n, 3n)), Object.freeze(term(-1n, 2n))]);
		expect(Arithmetic.compareRationalSum(new Set(terms))).toBe(-1);
		expect(terms[0]).toEqual(term(1n, 3n));
	});

	it('matches an independent expanded BigInt oracle for mixed signs, exponents and denominators', () => {
		let seed = 654321;
		const random = max => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max; };
		for (let i = 0; i < 2000; i++) {
			const terms = Array.from({ length: 1 + random(10) }, () =>
				term(BigInt(random(2001) - 1000), BigInt(1 + random(99)), BigInt(random(41) - 20)));
			const exponent = terms.reduce((a, t) => t.exponent < a ? t.exponent : a, 0n);
			const denominator = terms.reduce((a, t) => a * t.denominator, 1n);
			const numerator = terms.reduce((a, t) => a + t.numerator * (denominator / t.denominator) * 10n ** (t.exponent - exponent), 0n);
			expect(Arithmetic.compareRationalSum(terms)).toBe(numerator < 0n ? -1 : numerator > 0n ? 1 : 0);
		}
	});

	it.each([null, undefined, 1, '1', {}, [null], [term(1)], [term(1n, 0n)],
		[term(0n, -1n)], [term(1n, 1)], [term(1n, 1n, 0)], [{ numerator: 1n, denominator: 1n }]])
	('rejects invalid input %#', input => {
		expect(() => Arithmetic.compareRationalSum(input)).toThrow(expect.objectContaining({ code: 'INVALID_ARGUMENT' }));
	});
});
