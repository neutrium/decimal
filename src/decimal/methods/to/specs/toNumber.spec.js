import { Decimal } from '#dist/Decimal.js';

function test(cases)
{
	for(var i = 0; i < cases.length; i++)
	{
		var testCase = cases[i];

		it('should toNumber of ' + testCase[0] + ' equal ' + testCase[1], function() {
			expect(new Decimal(testCase[0]).toNumber()).toEqual(testCase[1]);
		});
	}
	return true;
}

describe("Neutrium Decimal toNearest Tests", function() {
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

	describe("Divide by 0 tests", function() {

		var cases = [
			'0', '0.0', '0.000000000000', '0e+0', '0e-0', '1e-9000000000000000'
		];

		for(var i = 0; i < cases.length; i++)
		{
			var testCase = cases[i];

			it('should toNumber of 1/' + testCase + ' equal Infinity', function() {
				expect(1/ new Decimal(testCase).toNumber()).toEqual(Infinity);
			});
		}
	});

	describe("Divide by -0 tests", function() {

		var cases = [
			'-0', '-0.0', '-0.000000000000', '-0e+0', '-0e-0', '-1e-9000000000000000'
		];

		for(var i = 0; i < cases.length; i++)
		{
			var testCase = cases[i];
			it('should to Number of 1/' + testCase + ' equal -Infinity', function() {
				expect(1/ new Decimal(testCase).toNumber()).toEqual(-Infinity);
			});
		}
	});

	describe("Basic tests", function() {
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

		test(cases);
	});
});
