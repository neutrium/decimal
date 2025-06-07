import { Decimal } from '#dist/Decimal.js';


function test(cases)
{
	for(var i = 0; i < cases.length; i++)
	{
		let testCase = cases[i];

		it('should min and max be identified', function() {
			var min = new Decimal(testCase[0]),
				max = new Decimal(testCase[1]);

			expect(min.toValue()).toEqual(min.min(testCase[2]).toValue());
			expect(max.toValue()).toEqual(min.max(testCase[2]).toValue());
		});
	}
	return true;
}


describe("Neutrium Decimal min/max Tests", function() {
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

	describe("base tests", function() {

		var cases = [
			[NaN, NaN, [NaN]],
			[NaN, NaN, [-2, 0, -1, NaN]],
			[NaN, NaN, [-2, NaN, 0, -1]],
			[NaN, NaN, [NaN, -2, 0, -1]],
			[NaN, NaN, [NaN, -2, 0, -1]],
			[NaN, NaN, [-2, 0, -1, new Decimal(NaN)]],
			[NaN, NaN, [-2, 0, -1, new Decimal(NaN)]],
			[NaN, NaN, [Infinity, -2, 'NaN', 0, -1, -Infinity]],
			[NaN, NaN, ['NaN', Infinity, -2, 0, -1, -Infinity]],
			[NaN, NaN, [Infinity, -2, NaN, 0, -1, -Infinity]],

			[0, 0, [0, 0, 0]],
			[-2, Infinity, [-2, 0, -1, Infinity]],
			[-Infinity, 0, [-2, 0, -1, -Infinity]],
			[-Infinity, Infinity, [-Infinity, -2, 0, -1, Infinity]],
			[-Infinity, Infinity, [Infinity, -2, 0, -1, -Infinity]],
			[-Infinity, Infinity, [-Infinity, -2, 0, new Decimal(Infinity)]],

			[-2, 0, [-2, 0, -1]],
			[-2, 0, [-2, -1, 0]],
			[-2, 0, [0, -2, -1]],
			[-2, 0, [0, -1, -2]],
			[-2, 0, [-1, -2, 0]],
			[-2, 0, [-1, 0, -2]],

			[-1, 1, [-1, 0, 1]],
			[-1, 1, [-1, 1, 0]],
			[-1, 1, [0, -1, 1]],
			[-1, 1, [0, 1, -1]],
			[-1, 1, [1, -1, 0]],
			[-1, 1, [1, 0, -1]],

			[0, 2, [0, 1, 2]],
			[0, 2, [0, 2, 1]],
			[0, 2, [1, 0, 2]],
			[0, 2, [1, 2, 0]],
			[0, 2, [2, 1, 0]],
			[0, 2, [2, 0, 1]],

			[-1, 1, ['-1', 0, new Decimal(1)]],
			[-1, 1, ['-1', new Decimal(1)]],
			[-1, 1, [0, '-1', new Decimal(1)]],
			[0, 1, [0, new Decimal(1)]],
			[1, 1, [new Decimal(1)]],
			[-1, -1, [new Decimal(-1)]],

			[0.0009999, 0.0010001, [0.001, 0.0009999, 0.0010001]],
			[-0.0010001, -0.0009999, [-0.001, -0.0009999, -0.0010001]],
			[-0.000001, 999.001, [2, -0, '1e-9000000000000000', 324.32423423, -0.000001, '999.001', 10]],
			['-9.99999e+9000000000000000', Infinity, [10, '-9.99999e+9000000000000000', new Decimal(Infinity), '9.99999e+9000000000000000', 0]],
			['-9.999999e+9000000000000000', '1.01e+9000000000000000', ['-9.99998e+9000000000000000', '-9.999999e+9000000000000000', '9e+8999999999999999', '1.01e+9000000000000000', 1e+300]],
			[1, Infinity, [1, '1e+9000000000000001', 1e200]],
			[-Infinity, 1, [1, '-1e+9000000000000001', -1e200]],
			[0, 1, [1, '1e-9000000000000001', 1e-200]],
			[-0, 1, [1, '-1e-9000000000000001', 1e-200]],
			[-3, 3, [1, '2', 3, '-1', -2, '-3']]
		];

		test(cases);
	});

});
