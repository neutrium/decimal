import { Decimal } from '../Decimal.ts';

describe('Decimal string parsing', () => {
	beforeEach(() => {
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
		expect(() => new Decimal(value)).toThrowError('[DecimalError] Invalid argument:');
	});

	it('respects exponent limits on cloned constructors', () => {
		const Limited = Decimal.clone({ maxE: 2, minE: -2 });

		expect(new Limited('0x1p10').toString()).toBe('Infinity');
		expect(new Limited('0x1p-10').toString()).toBe('0');
		expect(new Decimal('0x1p10').toString()).toBe('1024');
	});
});
