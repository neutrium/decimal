import { Decimal } from '#dist/Decimal.js';

function test(cases)
{
	for(var i = 0; i < cases.length; i++)
	{
		var testCase = cases[i];

		it('should toValue ' + testCase[1] + ' equal ' + testCase[0], function() {
			expect(new Decimal(testCase[1]).toValue()).toEqual(testCase[0]);
		});
	}
	return true;
}

describe("Neutrium Decimal toValue() Tests", function() {
	beforeEach(function() {
		Decimal.config = {
			precision: 20,
			rounding: 4,
			toExpNeg: -9e15,
			toExpPos: 9e15,
			minE: -9e15,
			maxE: 9e15
		};
	});

	describe("base tests", function() {

		var cases = [
			['0', 0],
			['0', '0'],
			['NaN', NaN],
			['NaN', 'NaN'],
			['Infinity', 1/0],
			['Infinity', 'Infinity'],
			['1', 1],
			['9', 9],
			['90', 90],
			['90.12', 90.12],
			['0.1', 0.1],
			['0.01', 0.01],
			['0.0123', 0.0123],
			['111111111111111111111',   '111111111111111111111'],
			['0.00001', 0.00001],

			['-0', -0],
			['-0', '-0'],
			['-Infinity', -1/0],
			['-Infinity', '-Infinity'],
			['-1', -1],
			['-9', -9],
			['-90', -90],
			['-90.12', -90.12],
			['-0.1', -0.1],
			['-0.01', -0.01],
			['-0.0123', -0.0123],
			['-111111111111111111111',  '-111111111111111111111'],
			['-0.00001', -0.00001]
		];

		test(cases);
	});

	describe("scientific notation", function() {
		beforeEach(function() {
			Decimal.config = {
				'toExpNeg' : 0,
				'toExpPos' : 0
			};
		});

		var cases = [
			['1e-7', 0.0000001],
			['1.23e-7', 0.000000123],
			['1.2e-8', 0.000000012],
			['-1e-7', -0.0000001],
			['-1.23e-7', -0.000000123],
			['-1.2e-8', -0.000000012],

			['5.73447902457635174479825134e+14', '573447902457635.174479825134'],
			['1.07688e+1', '10.7688'],
			['3.171194102379077141557759899307946350455841e+27', '3171194102379077141557759899.307946350455841'],
			['4.924353466898191177698653319742594890634579e+37', '49243534668981911776986533197425948906.34579'],
			['6.85558243926569397328633907445409866949445343654692955e+18', '6855582439265693973.28633907445409866949445343654692955'],
			['1e+0', '1']
		];

		test(cases);
	});
});
