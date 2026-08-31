import { Decimal } from '../../../Decimal.ts';
import { digits } from '../../utils/specs/decimal-state.js';
import { ROUNDING_MODES } from '../../../config/RoundingModes.ts';

function integerGenerator()
{
	let seed = 0x12345678;

	return words => {
		let result = 1n;

		for (let i = 0; i < words; i++)
		{
			seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
			result = result * 10000000n + BigInt((seed >>> 0) % 10000000);
		}

		return result;
	};
}

describe('Optimized arithmetic kernels', () => {
	it('matches exact bigint multiplication and squaring, including long carry chains', () => {
		const D = Decimal.clone({ precision: 2000 });
		const next = integerGenerator();

		for (const words of [1, 2, 3, 8, 29, 115, 130])
		{
			const boundary = 10000000n ** BigInt(words) - 1n;
			const values = [boundary, boundary + 1n, boundary + 2n, ...Array.from({ length: 25 }, () => next(words))];

			for (const a of values)
			{
				const b = next(words);
				const x = new D(a);
				expect(x.mul(new D(b)).toFixed()).toBe((a * b).toString());
				expect(x.mul(x).toFixed()).toBe((a * a).toString());
				expect(new D(-a).mul(new D(b)).toFixed()).toBe((-a * b).toString());
			}
		}
	});

	it.each(ROUNDING_MODES)('keeps general and square rounding exact for %s', rounding => {
		const a = 999999999999999999999999999999999999999999999n;

		for (const precision of [1, 7, 20, 80])
		{
			const D = Decimal.clone({ precision, rounding });

			for (const shift of [-30, 0, 30])
			{
				for (const sign of [1n, -1n])
				{
					const x = new D(sign * a).shift(shift);
					const expectedSquare = new D(`${a * a}e${shift * 2}`).toSD(precision);
					expect(x.mul(x).toValue()).toBe(expectedSquare.toValue());
					const y = new D(a + 2n).shift(-shift);
					const expectedProduct = new D(sign * a * (a + 2n)).toSD(precision);
					expect(x.mul(y).toValue()).toBe(expectedProduct.toValue());
				}
			}
		}
	});

	it.each(ROUNDING_MODES)('rounds truncated high products exactly for %s', rounding => {
		const words = 180;
		const a = 10000000n ** BigInt(words) - 1n;
		const b = a - 2n;
		const D = Decimal.clone({ precision: 20, rounding });

		for (const sign of [1n, -1n])
		{
			const expected = new D(sign * a * b).toSD(20).toValue();
			expect(new D(sign * a).mul(new D(b)).toValue()).toBe(expected);
		}
	});

	it.each(ROUNDING_MODES)('rounds truncated same-sign sums exactly for %s', rounding => {
		const words = 180;
		const a = 10000000n ** BigInt(words) - 1n;
		const b = a - 23456789n;
		const Wide = Decimal.clone({ precision: 3000 });

		for (const precision of [1, 20])
		{
			const D = Decimal.clone({ precision, rounding });

			for (const sign of [1n, -1n])
			{
				const expected = new D(sign * (a + b)).toSD(precision).toValue();
				expect(new D(sign * a).add(new D(sign * b)).toValue()).toBe(expected);

				const exactShifted = new Wide(sign * a).add(new Wide(sign * b).shift(-13));
				const expectedShifted = new D(exactShifted).toSD(precision).toValue();
				expect(new D(sign * a).add(new D(sign * b).shift(-13)).toValue()).toBe(expectedShifted);
			}
		}
	});

	it('does not construct a complete million-digit square when only 20 digits survive', () => {
		const D = Decimal.clone({ precision: 20, rounding: 'half-up' });
		const value = new D('9'.repeat(1_000_000));
		expect(value.mul(value).toValue()).toBe('1e+2000000');
	});

	it('matches exact integer division across scalar and normalized multiword divisors', () => {
		const D = Decimal.clone({ precision: 2000 });
		const next = integerGenerator();
		const divisors = [1n, 2n, 3n, 9999999n, 10000000n, 10000001n, 99999999999999n, next(29)];

		for (let i = 0; i < 100; i++)
		{
			const a = next(1 + i % 50);

			for (const b of divisors)
			{
				const x = new D(a);
				const y = new D(b);
				const negativeQuotient = new D(-a).divToInt(y);
				expect(x.divToInt(y).toFixed()).toBe((a / b).toString());
				expect(negativeQuotient.toFixed()).toBe(a < b ? '-0' : (-a / b).toString());
				if (a < b) expect(negativeQuotient.toValue()).toBe('-0');
				expect(new D(a * b).div(y).toFixed()).toBe(a.toString());
			}
		}
	});

	it('keeps caller-owned operands read-only without re-entering subclass constructors', () => {
		let constructions = 0;

		class TaggedDecimal extends Decimal {
			constructor(value) {
				super(value);
				constructions++;
			}
		}

		TaggedDecimal.config = { precision: 50 };
		const Foreign = Decimal.clone({ precision: 5 });
		const x = new TaggedDecimal('12.5');
		const y = new Foreign('2.5');

		for (const value of [x, y])
		{
			Object.freeze(value);
		}

		constructions = 0;
		const results = [x.mul(y), x.div(y), x.divToInt(y), x.mul(x)];
		expect(results.map(value => value.toString())).toEqual(['31.25', '5', '5', '156.25']);
		expect(constructions).toBe(0);

		for (const result of results)
		{
			expect(result).toBeInstanceOf(Decimal);
			expect(result).not.toBeInstanceOf(TaggedDecimal);
			expect(digits(result)).not.toBe(digits(x));
			expect(digits(result)).not.toBe(digits(y));
		}
	});

	it('preserves special values, signed zero, and distinct result identity', () => {
		for (const a of [0, -0, 1, -1, Infinity, -Infinity, NaN])
		{
			for (const b of [0, -0, 1, -1, Infinity, -Infinity, NaN])
			{
				const x = new Decimal(a);
				const y = new Decimal(b);

				for (const [method, expected] of [['mul', a * b], ['div', a / b]])
				{
					const result = x[method](y);
					expect(result.toNumber()).toBe(expected);
					expect(result).not.toBe(x);
					expect(result).not.toBe(y);
				}
			}
		}
	});

	it('normalizes primitive and existing Decimal arithmetic operands identically', () => {
		const D = Decimal.clone({ minE: -2, maxE: 2 });

		for (const [left, right] of [[0, 1000], [100, 1000], [1, '0.001']])
		{
			for (const method of ['add', 'sub', 'mul', 'div', 'divToInt'])
			{
				const primitive = new D(left)[method](right);
				const existing = new D(left)[method](new Decimal(right));
				expect(existing.toValue()).toBe(primitive.toValue());
			}
		}
	});
});
