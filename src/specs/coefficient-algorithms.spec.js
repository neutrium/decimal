import { divideCoefficients } from '../methods/arithmetic/coefficients/divide.js';
import { addMagnitudes, subtractMagnitudes } from '../methods/arithmetic/coefficients/add-subtract.js';
import { compareMagnitudes } from '../methods/utils/coefficients/compare.js';
import { digitsPrefixToBigInt, multiplyCoefficients } from '../methods/arithmetic/coefficients/multiply.js';
import { binaryExponentRange, decodePrefixedCoefficient, expandBinaryCoefficient } from '../methods/utils/coefficients/prefixed.js';

const BASE = 10000000n;

describe('pure magnitude arithmetic', () => {
	it('matches BigInt sums, differences, and ordering with frozen operands', () => {
		const next = generator(123456);
		const cases = [[99999999999999n, 1n], [100000000000000n, 1n], [12345n, 12345n], [10000001n, 10000000n]];
		for (let i = 0; i < 160; i++) cases.push([
			integerOf(randomWords(next, 1 + next() % 5)) * BASE ** BigInt(next() % 5),
			integerOf(randomWords(next, 1 + next() % 5)) * BASE ** BigInt(next() % 5)
		]);
		function check(result, expected, shift)
		{
			const scale = Math.floor((result.exponent - shift) / 7) - result.digits.length + 1;
			expect(integerOf(result.digits) * BASE ** BigInt(scale)).toBe(expected);
			expect(result.digits[0]).toBeGreaterThan(0);
			expect(result.digits.at(-1)).not.toBe(0);
		}
		for (const [x, y] of cases)
		{
			for (const shift of [0, -70])
			{
				const a = integerOperand(x, shift), b = integerOperand(y, shift);
				expect(compareMagnitudes(a.digits, a.exponent, b.digits, b.exponent)).toBe(x === y ? 0 : x > y ? 1 : -1);
				const sum = addMagnitudes(a.digits, a.exponent, b.digits, b.exponent, 200);
				check(sum, x + y, shift);
				expect(sum.digits).not.toBe(a.digits);
				expect(sum.digits).not.toBe(b.digits);
				if (x !== y)
				{
					const [large, small] = x > y ? [a, b] : [b, a];
					check(subtractMagnitudes(large.digits, large.exponent, small.digits, small.exponent, 200), x > y ? x - y : y - x, shift);
				}
			}
		}
	});

	it('bounds exponent-gap allocation with guard words rather than padding the full gap', () => {
		const digits = Object.freeze([1]);
		const sum = addMagnitudes(digits, 7000000, digits, 0, 7);
		expect(sum).toEqual({ digits: [1, 0, 1], exponent: 7000000 });
		const difference = subtractMagnitudes(digits, 7000000, digits, 0, 7);
		expect(difference).toEqual({ digits: [9999999, 9999999, 9999999], exponent: 6999999 });
	});
});

// Independent integer oracles: no Decimal, context, or private representation access.
function integerOf(words)
{
	return words.reduce((value, word) => value * BASE + BigInt(word), 0n);
}

function integerOperand(value, shift = 0)
{
	const words = [];
	for (let remaining = value; remaining; remaining /= BASE) words.unshift(Number(remaining % BASE));
	while (words.length > 1 && words.at(-1) === 0) words.pop();
	return { digits: Object.freeze(words), exponent: value.toString().length - 1 + shift };
}

function generator(seed)
{
	return () => {
		seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
		return seed;
	};
}

function randomWords(next, length)
{
	return Object.freeze(Array.from({ length }, () => 1 + next() % 9999999));
}

describe('pure coefficient multiplication', () => {
	it('preserves fixed-width products and never mutates or aliases inputs', () => {
		const next = generator(0xabcdef);
		// Exercise convolution, symmetric squaring, the BigInt crossover, and unequal lengths.
		for (const [aLength, bLength] of [[1, 1], [2, 3], [7, 4], [127, 128], [128, 128], [1, 255], [257, 193]])
		{
			const a = randomWords(next, aLength);
			const b = randomWords(next, bLength);
			for (const right of [b, a, Object.freeze([...a])])
			{
				const result = multiplyCoefficients(a, right);
				expect(result).toHaveLength(a.length + right.length);
				expect(integerOf(result)).toBe(integerOf(a) * integerOf(right));
				expect(result.every(word => Number.isInteger(word) && word >= 0 && word < Number(BASE))).toBe(true);
				expect(result).not.toBe(a);
				expect(result).not.toBe(right);
			}
		}
	});

	it('handles long carry chains and leading product padding on both multiplication paths', () => {
		for (const length of [1, 3, 127, 128, 200])
		{
			for (const word of [1, 9999999])
			{
				const digits = Object.freeze(Array(length).fill(word));
				const result = multiplyCoefficients(digits, digits);
				expect(result).toHaveLength(length * 2);
				expect(integerOf(result)).toBe(integerOf(digits) ** 2n);
				expect(result[0] === 0).toBe(word === 1);
			}
		}
	});

	it('converts only the requested prefix, including interior zero words', () => {
		const digits = Object.freeze([12, 0, 9999999, 42]);
		for (let length = 0; length <= digits.length; length++)
		{
			expect(digitsPrefixToBigInt(digits, length)).toBe(integerOf(digits.slice(0, length)));
		}
	});
});

describe('pure coefficient division', () => {
	function checkDivision(x, y, precision, xShift = 0, yShift = 0)
	{
		const a = integerOperand(x, xShift);
		const b = integerOperand(y, yShift);
		const result = divideCoefficients(a.digits, a.exponent, b.digits, b.exponent, precision);
		const wordScale = Math.floor(result.exponent / 7) - result.digits.length + 1;
		const scale = (xShift - yShift) / 7 - wordScale;
		const numerator = x * BASE ** BigInt(Math.max(scale, 0));
		const denominator = y * BASE ** BigInt(Math.max(-scale, 0));
		expect(integerOf(result.digits)).toBe(numerator / denominator);
		expect(result.more).toBe(numerator % denominator !== 0n);
		expect(result.digits[0]).toBeGreaterThan(0);
		expect(result.digits.every(word => Number.isInteger(word) && word >= 0 && word < Number(BASE))).toBe(true);
		expect(result.digits).not.toBe(a.digits);
		expect(result.digits).not.toBe(b.digits);
	}

	it('matches exact rational truncation and sticky remainders across word boundaries', () => {
		const next = generator(0x123456);
		const cases = [
			[1n, 2n], [1n, 3n], [9999999n, 1n], [10000000n, 9999999n],
			[10000001n, 10000001n], [100000000000001n, 10000001n],
			[999999999999999999999n, 50000009999999n],
			[999999999999999999999n, 19999999n],
			[123456789n * 987654321n, 987654321n]
		];
		for (let i = 0; i < 160; i++)
		{
			cases.push([integerOf(randomWords(next, 1 + next() % 15)), integerOf(randomWords(next, 1 + next() % 9))]);
		}
		for (const [x, y] of cases)
		{
			for (const precision of [0, 1, 7, 21, 70])
			{
				checkDivision(x, y, precision);
				checkDivision(x, y, precision, -14, 21);
			}
		}
	});

	it('returns the sticky sentinel used to round a quotient below integer precision', () => {
		const a = Object.freeze([1]);
		const b = Object.freeze([2]);
		expect(divideCoefficients(a, -7, b, 0, -6)).toEqual({ digits: [1], exponent: -14, more: true });
	});
});

describe('pure prefixed coefficient conversion', () => {
	it('cancels redundant powers of two before expansion', () => {
		expect(decodePrefixedCoefficient('0x1000p-12', 16)).toEqual({
			significand: 1n, significandBitLength: 1, binaryShift: 0n, bitExponent: 0n
		});
		expect(expandBinaryCoefficient(decodePrefixedCoefficient('0x1000p-12', 16), 1)).toBe('1');
		for (const [literal, base] of [['0b0.00p999999999999999999999', 2], ['0o000', 8], ['0x0.0', 16]])
		{
			expect(decodePrefixedCoefficient(literal, base)).toBeUndefined();
		}
	});

	it('matches exact rational values for binary, octal, and hexadecimal fractions', () => {
		const next = generator(0x654321);
		for (const [base, prefix, bits] of [[2, '0b', 1], [8, '0o', 3], [16, '0x', 4]])
		{
			for (let i = 0; i < 80; i++)
			{
				const significand = BigInt(1 + next());
				const source = significand.toString(base);
				const fractionLength = next() % source.length;
				const point = source.length - fractionLength;
				const exponent = Number(next() % 101) - 50;
				const literal = `${prefix}00${source.slice(0, point)}.${source.slice(point)}p${exponent}`;
				const decoded = Object.freeze(decodePrefixedCoefficient(literal, base));
				const decimal = expandBinaryCoefficient(decoded, 200);
				const [coefficient, decimalExponent = '0'] = decimal.split('e');
				const shift = exponent - fractionLength * bits;
				const expectedNumerator = significand * 2n ** BigInt(Math.max(shift, 0));
				const expectedDenominator = 2n ** BigInt(Math.max(-shift, 0));
				const actualDenominator = 10n ** -BigInt(decimalExponent);
				expect(BigInt(coefficient) * expectedDenominator).toBe(expectedNumerator * actualDenominator);
			}
		}
	});

	it('checks expansion budgets before huge shifts and at exact digit boundaries', () => {
		for (const literal of ['0b1p100000000000000000000', '0b1p-100000000000000000000'])
		{
			expect(expandBinaryCoefficient(decodePrefixedCoefficient(literal, 2), 100)).toBeUndefined();
		}
		const coefficient = decodePrefixedCoefficient('0xff', 16);
		expect(expandBinaryCoefficient(coefficient, 3)).toBe('255');
		expect(expandBinaryCoefficient(coefficient, 2)).toBeUndefined();
		expect(expandBinaryCoefficient(decodePrefixedCoefficient('0b11', 2), 1)).toBe('3');
	});

	it('classifies distant exponent limits conservatively and leaves boundaries for exact expansion', () => {
		expect(binaryExponentRange(100n, -10, 10)).toBe(1);
		expect(binaryExponentRange(-100n, -10, 10)).toBe(-1);
		for (const exponent of [-35n, 0n, 35n]) expect(binaryExponentRange(exponent, -10, 10)).toBe(0);
	});
});
