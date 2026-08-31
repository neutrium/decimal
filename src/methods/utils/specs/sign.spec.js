import { Decimal } from '../../../Decimal.ts';

describe("Neutrium Decimal sign Tests", () => {

	describe("base tests", () => {

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

		it.each(cases)('case %#', (input, expected) => {
			expect(new Decimal(input).sign()).toEqual(expected);
		});

		it('should preserve the sign of zero', () => {
			expect(1 / new Decimal('0').sign()).toEqual(Infinity);
			expect(1 / new Decimal(new Decimal('0')).sign()).toEqual(Infinity);
			expect(1 / new Decimal('-0').sign()).toEqual(-Infinity);
			expect(1 / new Decimal(new Decimal('-0')).sign()).toEqual(-Infinity);
		});
	});

});
