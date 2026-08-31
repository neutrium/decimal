import { Decimal } from '../../../Decimal.ts';
import { digits } from '../../utils/specs/decimal-state.js';
import { ROUNDING_MODES } from '../../../config/RoundingModes.ts';

describe('Shared signed arithmetic', () => {
	it.each(ROUNDING_MODES)('matches exact scaled bigint addition and subtraction for %s', rounding => {
		let seed = 0x3492af;

		const next = () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return seed >>> 0; };

		for (const precision of [1, 7, 20, 80])
		{
			const D = Decimal.clone({ precision, rounding });

			for (let i = 0; i < 100; i++)
			{
				const a = BigInt(next()) * BigInt(next()) * (i % 2 ? -1n : 1n);
				const b = BigInt(next()) * BigInt(next()) * (i % 3 ? -1n : 1n);
				const ae = i % 37 - 18;
				const be = i % 29 - 14;
				const exponent = Math.min(ae, be);
				const alignedA = a * 10n ** BigInt(ae - exponent);
				const alignedB = b * 10n ** BigInt(be - exponent);
				const x = new D(`${a}e${ae}`);
				const y = new D(`${b}e${be}`);
				Object.freeze(x); Object.freeze(y);

				for (const [method, exact] of [['add', alignedA + alignedB], ['sub', alignedA - alignedB]])
				{
					const expected = new D(`${exact}e${exponent}`).toSD(precision);
					const result = x[method](y);
					expect(result.toValue()).toBe(expected.toValue());
					expect(digits(result)).toEqual(digits(expected));
					expect(digits(result)).not.toBe(digits(x));
					expect(digits(result)).not.toBe(digits(y));
				}
			}
		}
	});

	it('does not invoke subclass constructors for signed arithmetic results', () => {
		let constructions = 0;
		class Tagged extends Decimal
		{
			constructor(value)
			{
				super(value);
				constructions++;
			}
		}

		for (const a of ['12.5', '-12.5'])
		{
			for (const b of ['2.5', '-2.5'])
			{
				const x = new Tagged(a), y = new Tagged(b);

				for (const method of ['add', 'sub'])
				{
					constructions = 0;
					const result = x[method](y);
					expect(constructions).toBe(0);
					expect(result).toBeInstanceOf(Decimal);
					expect(result).not.toBeInstanceOf(Tagged);
					expect(result.toNumber()).toBe(method === 'add' ? Number(a) + Number(b) : Number(a) - Number(b));
				}
			}
		}
	});

	it.each(ROUNDING_MODES)('preserves cancellation and signed zero under %s', rounding => {
		const D = Decimal.clone({ rounding });
		const cancelled = rounding === 'floor' ? '-0' : '0';
		expect(new D(10).sub(10).toValue()).toBe(cancelled);
		expect(new D(10).add(-10).toValue()).toBe(cancelled);
		expect(new D('-0').add('-0').toValue()).toBe('-0');
		expect(new D('-0').sub('0').toValue()).toBe('-0');
		expect(new D('0').add('-0').toValue()).toBe(cancelled);
		expect(new D('-0').sub('-0').toValue()).toBe(cancelled);
	});

	it('keeps exponent gaps bounded and retains the sticky remainder for directed rounding', () => {
		const D = Decimal.clone({ precision: 3, rounding: 'up' });
		const large = new D('1e1000000000');
		expect(large.add(1).toString()).toBe('1.01e+1000000000');
		expect(large.sub(1).toString()).toBe('1e+1000000000');
		expect(new D(1).sub(large).toString()).toBe('-1e+1000000000');
	});
});
