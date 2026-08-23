import { Decimal } from '../../../Decimal.ts';

function test(cases)
{
	for(var i = 0; i < cases.length; i++)
	{
		let testCase = cases[i];

		it('should sign of ' + testCase[0] + ' equal ' + testCase[1], function() {
			expect(new Decimal(testCase[0]).sign()).toEqual(testCase[1]);
		});
	}
	return true;
}

describe("Neutrium Decimal sign Tests", function() {

	describe("base tests", function() {

		var cases = [
			[NaN, NaN],
			['NaN', NaN],
			[Infinity, 1],
			[-Infinity, -1],
			['Infinity', 1],
			['-Infinity', -1],

			['0', 0],
			['-0', -0],
			['1', 1],
			['-1', -1],
			['9.99', 1],
			['-9.99', -1]
		];

		test(cases);

		it('should preserve the sign of zero', function() {
			expect(1 / new Decimal('0').sign()).toEqual(Infinity);
			expect(1 / new Decimal(new Decimal('0')).sign()).toEqual(Infinity);
			expect(1 / new Decimal('-0').sign()).toEqual(-Infinity);
			expect(1 / new Decimal(new Decimal('-0')).sign()).toEqual(-Infinity);
		});
	});

});
