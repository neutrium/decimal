import { Decimal } from '../../../Decimal.ts';


function testException(func, msg)
{
	it('should throw exception for ' + msg, () => {
		expect( func ).toThrow();
	});
}

describe("Neutrium Decimal Significant Digits", () => {

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

	describe("Decimal base dp and precision", () => {

		var cases = [
			[0, 0, 1],
			[-0, 0, 1],
			[NaN, NaN, NaN],
			[Infinity, NaN, NaN],
			[-Infinity, NaN, NaN],
			[1, 0, 1],
			[-1, 0, 1],

			[100, 0, 1],
			[100, 0, 1, false],
			[100, 0, 1, false],
			[100, 0, 3, true],
			[100, 0, 3, true],

			['0.0012345689', 10, 8],
			['0.0012345689', 10, 8, false],
			['0.0012345689', 10, 8, false],
			['0.0012345689', 10, 8, true],
			['0.0012345689', 10, 8, true],

			['987654321000000.0012345689000001', 16, 31, false],
			['987654321000000.0012345689000001', 16, 31, true],

			['1e+123', 0, 1],
			['1e+123', 0, 124, true],
			['1e-123', 123, 1],
			['1e-123', 123, 1, true],

			['9.9999e+9000000000000000', 0, 5, false],
			['9.9999e+9000000000000000', 0, 9000000000000001, true],
			['-9.9999e+9000000000000000', 0, 5, false],
			['-9.9999e+9000000000000000', 0, 9000000000000001, true],

			['1e-9000000000000000', 9e15, 1, false],
			['1e-9000000000000000', 9e15, 1, true],
			['-1e-9000000000000000', 9e15, 1, false],
			['-1e-9000000000000000', 9e15, 1, true],

			['55325252050000000000000000000000.000000004534500000001', 21, 53],
		]

		it.each(cases)('case %#', (input, decimalPlaces, significantDigits, trailingZeroes) => {
			expect(new Decimal(input).dp()).toEqual(decimalPlaces);
			expect(new Decimal(input).precision(trailingZeroes)).toEqual(significantDigits);
		});
	});

	describe("Decimal base dp and precision exceptions", () => {

		testException(() => {new Decimal(1).precision(null)}, "new Decimal(1).precision(null)");
		testException(() => {new Decimal(1).precision(0)}, "new Decimal(1).precision(0)");
		testException(() => {new Decimal(1).precision(1)}, "new Decimal(1).precision(1)");
		testException(() => {new Decimal(1).precision('true')}, "new Decimal(1).precision('true')");
		testException(() => {new Decimal(1).precision({})}, "new Decimal(1).precision({})");
	});
});
