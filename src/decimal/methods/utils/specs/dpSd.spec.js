import { Decimal } from '#dist/Decimal.js';


function test(cases)
{
	for(var i = 0; i < cases.length; i++)
	{
		var testCase = cases[i];

		if(testCase.length >= 3)
		{
			it('should significant figures of' + testCase[0] + ' to be  ' + testCase[1], function() {
				expect(new Decimal(testCase[0]).dp()).toEqual(testCase[1]);
				expect(new Decimal(testCase[0]).precision(testCase[3])).toEqual(testCase[2]);
			});
		}
		else
		{
			throw Error("Invalid cases");
		}
	}

	return true;
}

function testException(func, msg)
{
	it('should throw exception for ' + msg, function() {
		expect( func ).toThrow();
	});
}

describe("Neutrium Decimal Significant Digits", function() {

	beforeEach(function() {
		Decimal.config = {
			precision: 20,
			rounding: 4,
			toExpNeg: -7,
			toExpPos: 21,
			minE: -9e15,
			maxE: 9e15
		};
	});

	describe("Decimal base dp and precision", function() {

		var cases = [
			[0, 0, 1],
			[-0, 0, 1],
			[NaN, NaN, NaN],
			[Infinity, NaN, NaN],
			[-Infinity, NaN, NaN],
			[1, 0, 1],
			[-1, 0, 1],

			[100, 0, 1],
			[100, 0, 1, 0],
			[100, 0, 1, false],
			[100, 0, 3, 1],
			[100, 0, 3, true],

			['0.0012345689', 10, 8],
			['0.0012345689', 10, 8, 0],
			['0.0012345689', 10, 8, false],
			['0.0012345689', 10, 8, 1],
			['0.0012345689', 10, 8, true],

			['987654321000000.0012345689000001', 16, 31, 0],
			['987654321000000.0012345689000001', 16, 31, 1],

			['1e+123', 0, 1],
			['1e+123', 0, 124, 1],
			['1e-123', 123, 1],
			['1e-123', 123, 1, 1],

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

		test(cases);
	});

	describe("Decimal base dp and precision exceptions", function() {

		testException(function () {new Decimal(1).precision(null)}, "new Decimal(1).precision(null)");
		testException(function () {new Decimal(1).sd(null)}, "new Decimal(1).sd(null)");
		testException(function () {new Decimal(1).sd(2)}, "new Decimal(1).sd(2)");
		testException(function () {new Decimal(1).sd('3')}, "new Decimal(1).sd('3')");
		testException(function () {new Decimal(1).sd({})}, "new Decimal(1).sd({})");
	});
});