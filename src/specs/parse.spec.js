import { Decimal } from '../Decimal.ts';
import { digits } from '../methods/utils/specs/decimal-state.js';

describe('Decimal string parsing', () => {
	beforeAll(() => {
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
		['-0b10110100.1', '-180.5'],
		['0B10110100.1', '180.5'],
		['0o0.03', '0.046875'],
		['0O377.4', '255.5'],
		['0x0.0c', '0.046875'],
		['0Xff.8', '255.5'],
		['0xffffffffffffffffffff', '1208925819614629174706175']
	])('parses %s', (value, expected) => {
		expect(new Decimal(value).toString()).toBe(expected);
	});

	it.each([
		['0b1.1p-5', '0.046875'],
		['0o1.4P-5', '0.046875'],
		['0x1.8p-5', '0.046875'],
		['0x1.fffffffffffffp+52', '9007199254740991'],
		['0b1p10', '1024']
	])('applies the power-of-two exponent in %s', (value, expected) => {
		expect(new Decimal(value).toString()).toBe(expected);
	});

	it.each([
		['0.046_875_000_000', '0.046875'],
		['1_234_567.89_01e+2', '123456789.01'],
		['0b1010_0101.1_1', '165.75'],
		['0o7_777.4', '4095.5'],
		['0xff_ff.8_0p+1_0', '67108352']
	])('accepts separators in %s', (value, expected) => {
		expect(new Decimal(value).toString()).toBe(expected);
	});

	it.each(['0b1', '0o1', '0x1'])('accepts decimal exponent separators independently of the radix in %s', prefix => {
		for (const marker of ['p', 'P']) {
			for (const exponent of ['2_0', '+2_0', '-2_0', '8_0', '-8_0', '1_2_3', '0_0']) {
				const input = `${prefix}${marker}${exponent}`;
				const value = new Decimal(input);
				const expected = new Decimal(input.replaceAll('_', ''));
				expect(value.toValue()).toBe(expected.toValue());
				expect(digits(value)).toEqual(digits(expected));
				expect(value.mul(1).toValue()).toBe(expected.mul(1).toValue());
			}
		}
	});

	it.each(['0b1', '0o1', '0x1'])('rejects malformed exponent separators in %s', prefix => {
		for (const exponent of ['_20', '20_', '2__0', '+_20', '-_20', '2_.0', '2_a', 'a_2']) {
			expect(() => new Decimal(`${prefix}p${exponent}`)).toThrowError('Invalid argument:');
		}
	});

	it.each([
		'1__0',
		'_10',
		'10_',
		'1_.0',
		'1._0',
		'0b_1',
		'0b1_2',
		'0o8',
		'0xg',
		'0x1p_2',
		'0x1_p2',
		'1p2'
	])('rejects invalid literal %s', value => {
		expect(() => new Decimal(value)).toThrowError('Invalid argument:');
	});

	it('respects exponent limits on cloned constructors', () => {
		const Limited = Decimal.clone({ maxE: 2, minE: -2 });

		expect(new Limited('0x1p10').toString()).toBe('Infinity');
		expect(new Limited('0x1p-10').toString()).toBe('0');
		expect(new Decimal('0x1p10').toString()).toBe('1024');
	});

	it.each([
		['binary', '0b', '1011010010110101'.repeat(128)],
		['octal', '0o', '76543210'.repeat(256)],
		['hexadecimal', '0x', 'fedcba9876543210'.repeat(128)]
	])('parses large %s integers exactly', (_name, prefix, digits) => {
		const expected = BigInt(prefix + digits).toString();

		expect(new Decimal(prefix + digits).toString()).toBe(expected);
	});

	it('parses long power-of-two fractions exactly', () => {
		const digits = 'f'.repeat(1024);
		const binaryPlaces = 4 * digits.length;
		const coefficient = BigInt('0x' + digits) * 5n ** BigInt(binaryPlaces);
		const expected = new Decimal(coefficient + 'e-' + binaryPlaces).toString();

		expect(new Decimal('0x0.' + digits).toString()).toBe(expected);
	});

	it('handles power-of-two exponents without converting them to Number', () => {
		const coefficient = 5n ** 1074n;

		expect(new Decimal('0x1p-1074').toString()).toBe(
			new Decimal(coefficient + 'e-1074').toString()
		);
		expect(new Decimal('0x1p+999999999999999999999').toString()).toBe('Infinity');
		expect(new Decimal('-0x1p-999999999999999999999').toValue()).toBe('-0');
	});

	it('limits the decimal coefficient generated from prefixed inputs', () => {
		const Limited = Decimal.clone({ maxPrefixedDigits: 10 });

		expect(new Limited('0x1p32').toString()).toBe('4294967296');
		expect(new Limited('0x1p-14').toString()).toBe('0.00006103515625');
		expect(() => new Limited('0x1p34')).toThrowError(
			'Prefixed number expansion limit exceeded: 10'
		);
		expect(() => new Limited('0x1p-15')).toThrowError(
			'Prefixed number expansion limit exceeded: 10'
		);
	});

	it('removes binary factors before applying the prefixed expansion limit', () => {
		const Limited = Decimal.clone({ maxPrefixedDigits: 1 });

		expect(new Limited('0x10000p-16').toString()).toBe('1');
		expect(new Limited('123456').toString()).toBe('123456');
	});

	it('rejects unsafe prefixed expansions before allocating their coefficients', () => {
		expect(() => new Decimal('0x1p-2000000')).toThrowError(
			'Prefixed number expansion limit exceeded: 1000000'
		);
		expect(() => new Decimal('0x1p4000000')).toThrowError(
			'Prefixed number expansion limit exceeded: 1000000'
		);
	});

	it('resolves exponent overflow and underflow before checking expansion size', () => {
		const Limited = Decimal.clone({ maxPrefixedDigits: 1, maxE: 2, minE: -2 });

		expect(new Limited('0x1p100').toString()).toBe('Infinity');
		expect(new Limited('0x1p-100').toString()).toBe('0');
	});
});

describe('Decimal bigint parsing', () => {
	it.each([
		[0n, '0'],
		[9007199254740993n, '9007199254740993'],
		[-9007199254740993n, '-9007199254740993'],
		[10n ** 100n + 123456789n, '1' + '0'.repeat(91) + '123456789']
	])('parses %s exactly', (value, expected) => {
		expect(new Decimal(value).toString()).toBe(expected);
	});

	it('accepts bigint operands without losing precision', () => {
		expect(new Decimal(1).add(9007199254740993n).toString()).toBe('9007199254740994');
		expect(new Decimal(9007199254740995n).sub(2n).toString()).toBe('9007199254740993');
		expect(new Decimal(3).mul(3002399751580331n).toString()).toBe('9007199254740993');
	});
});
