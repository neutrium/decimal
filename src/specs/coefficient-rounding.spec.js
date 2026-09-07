import { roundCoefficient } from '../methods/utils/coefficients/round.js';
import { magnitudePrefix } from '../methods/arithmetic/coefficients/add-subtract.js';
import { Decimal } from '../scientific.js';
import { CalculationContext } from '../CalculationContext.js';
import { finalise } from '../methods/utils/finalise.js';

const base = 10000000n;
function digitsOf(value)
{
	const digits = [];
	for (let n = value; n; n /= base) digits.unshift(Number(n % base));
	while (digits.length > 1 && digits.at(-1) === 0) digits.pop();
	return digits;
}

describe('coefficient rounding', () => {
	it('matches an independent integer quotient/remainder oracle for every rounding mode', () => {
		const cases = [1n, 5n, 15n, 25n, 149n, 150n, 151n, 9999999n, 99999999n, 100000050n, 100000150n, 999999999999999n, 123456700000001n];
		for (const value of cases) for (const sd of [-2, 0, 1, 2, 7, 8, 14, 30])
		for (const sign of [-1, 1]) for (let mode = 0; mode < 9; mode++)
		{
			const unit = 10n ** BigInt(Math.max(0, value.toString().length - sd));
			const q = value / unit, remainder = value % unit;
			const tieUp = [true, false, sign > 0, sign < 0, true, false, q % 2n === 1n, sign > 0, sign < 0][mode];
			const up = remainder !== 0n && (mode < 4 ? tieUp : remainder * 2n > unit || remainder * 2n === unit && tieUp);
			const expected = (q + (up ? 1n : 0n)) * unit;
			const digits = digitsOf(value);
			const exponent = roundCoefficient(digits, value.toString().length - 1, sign, sd, mode);
			const coefficient = digits.reduce((n, word) => n * base + BigInt(word), 0n);
			const actual = coefficient * base ** BigInt(Math.floor(exponent / 7) - digits.length + 1);
			expect(actual).toBe(expected);
		}
	});

	it('distinguishes exact ties from sticky discarded digits and supports guard-word extension', () => {
		for (const sticky of [false, true])
		{
			const digits = [25];
			expect(roundCoefficient(digits, 1, 1, 1, 6, sticky)).toBe(1);
			expect(digits).toEqual([sticky ? 30 : 20]);
		}
		const digits = [1];
		expect(roundCoefficient(digits, 0, 1, 3, 0, true)).toBe(0);
		expect(digits).toEqual([1, 100000]);
	});

	it('copies prefixes without mutating inputs and propagates carry across the prefix', () => {
		const digits = Object.freeze([9999999, 9999999, 42]);
		expect(magnitudePrefix(digits, 20, 2, false)).toEqual({ digits: [9999999, 9999999], exponent: 20 });
		expect(magnitudePrefix(digits, 20, 2, true)).toEqual({ digits: [1], exponent: 21 });
	});

	it('keeps exponent limits in finalization, including the sub-unit rounding path', () => {
		const D = Decimal.clone({ maxE: 0, minE: 0 });
		const context = new CalculationContext(D, D.config);
		const working = context.forIntermediate();
		for (const [source, sd] of [['9', 0], ['9.9', 1]])
		{
			expect(finalise(working.create(source), sd, 0, false, context).toValue()).toBe('Infinity');
			expect(finalise(working.create(source), sd, 0, false, working).toValue()).toBe('10');
		}
		expect(finalise(working.create('0.1'), null, 1, false, context).toValue()).toBe('0');
		expect(finalise(working.create('-0'), 1, 1, false, context).toValue()).toBe('-0');
		for (const value of ['NaN', 'Infinity', '-Infinity'])
			expect(finalise(working.create(value), 1, 1, false, context).toValue()).toBe(value);
	});
});
