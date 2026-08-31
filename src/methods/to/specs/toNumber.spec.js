import { Decimal } from '../../../Decimal.ts';

describe("Neutrium Decimal toNearest Tests", () => {
	beforeAll(() => {
		Decimal.config = {
			precision: 20,
			rounding: 'half-up',
			toExpNeg: -7,
			toExpPos: 21,
			minE: -9e15,
			maxE: 9e15
		};
	});

	describe("Divide by 0 tests", () => {

		var cases = [
			'0', '0.0', '0.000000000000', '0e+0', '0e-0', '1e-9000000000000000'
		];

		it.each(cases)('should toNumber of 1/%s equal Infinity', testCase => {
			expect(1 / new Decimal(testCase).toNumber()).toEqual(Infinity);
		});
	});

	describe("Divide by -0 tests", () => {

		var cases = [
			'-0', '-0.0', '-0.000000000000', '-0e+0', '-0e-0', '-1e-9000000000000000'
		];

		it.each(cases)('should toNumber of 1/%s equal -Infinity', testCase => {
			expect(1 / new Decimal(testCase).toNumber()).toEqual(-Infinity);
		});
	});

	describe("Basic tests", () => {
		var cases = [
			[Infinity, 1 / 0],
			['Infinity', 1 / 0],
			[-Infinity, -1 / 0],
			['-Infinity', -1 / 0],
			[NaN, NaN],
			['NaN', NaN],

			[1, 1],
			['1', 1],
			['1.0', 1],
			['1e+0', 1],
			['1e-0', 1],

			[-1, -1],
			['-1', -1],
			['-1.0', -1],
			['-1e+0', -1],
			['-1e-0', -1],

			['123.456789876543', 123.456789876543],
			['-123.456789876543', -123.456789876543],

			['1.1102230246251565e-16', 1.1102230246251565e-16],
			['-1.1102230246251565e-16', -1.1102230246251565e-16],

			['9007199254740991', 9007199254740991],
			['-9007199254740991', -9007199254740991],

			['5e-324', 5e-324],
			['1.7976931348623157e+308', 1.7976931348623157e+308],

			['9.999999e+9000000000000000', 1 / 0],
			['-9.999999e+9000000000000000', -1 / 0],
			['1e-9000000000000000', 0],
			['-1e-9000000000000000', -0]
		]

		it.each(cases)('case %#', (input, expected) => {
			expect(new Decimal(input).toNumber()).toEqual(expected);
		});
	});

	it('short-circuits toNumber when the exponent guarantees overflow or underflow', () => {
		for (const [value, expected] of [
			['1e1000000', Infinity], ['-1e1000000', -Infinity],
			['1e-1000000', 0], ['-1e-1000000', -0],
			['4e-324', 5e-324], ['-4e-324', -5e-324]
		]) {
			expect(new Decimal(value).toNumber()).toBe(expected);
		}
	});
});
