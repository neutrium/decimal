import { Decimal } from '../../../Decimal.ts';

describe("Neutrium Decimal toNearest Tests", () => {

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


	describe("base tests", () => {

		var cases = [
			['Infinity', Infinity],
			['-Infinity', -Infinity],
			['NaN', NaN],
			['NaN', NaN, NaN],
			['NaN', NaN, Infinity],
			['NaN', NaN, -Infinity],
			['NaN', NaN, 0],
			['NaN', NaN, -0],

			['Infinity', '9.999e+9000000000000000', '1e+9000000000000001'],
			['Infinity', '9.999e+9000000000000000', '-1e+9000000000000001'],
			['-Infinity', '-9.999e+9000000000000000', '1e+9000000000000001'],
			['-Infinity', '-9.999e+9000000000000000', '-1e+9000000000000001'],
			['9.999e+9000000000000000', '9.999e+9000000000000000'],
			['-9.999e+9000000000000000', '-9.999e+9000000000000000'],

			['NaN', 123.456, NaN],
			['Infinity', 123.456, Infinity],
			['Infinity', 123.456, -Infinity],
			['0', 123.456, 0],
			['0', 123.456, '-0'],

			['NaN', -123.456, NaN],
			['-Infinity', -123.456, Infinity],
			['-Infinity', -123.456, -Infinity],
			['-0', -123.456, '-0'],

			['0', 0, 0],
			['Infinity', 0, Infinity],
			['Infinity', 0, -Infinity],
			['-Infinity', -0, Infinity],
			['-Infinity', -0, -Infinity],

			['0', 1, -3],
			['-0', -1, -3],
			['3', 1.5, -3, 20, 'up'],
			['-0', -1.5, -3, 20, 'down'],
			['-0', -1.5, -3, 20, 'ceil'],

			['123', 123.456],
			['123', 123.456, 1],
			['123.5', 123.456, 0.1],
			['123.46', 123.456, 0.01],
			['123.456', 123.456, 0.001],

			['123', 123.456, -1],
			['123.5', 123.456, -0.1],
			['123.46', 123.456, -0.01],
			['123.456', 123.456, -0.001],

			['124', 123.456, '-2'],
			['123.4', 123.456, '-0.2'],
			['123.46', 123.456, '-0.02'],
			['123.456', 123.456, '-0.002'],

			['83105511540', '83105511539.5', 1, 11, 'half-up'],
			['83105511539', '83105511539.499999999999999999999999999999', 1, 11, 'half-up'],
			['83105511539', '83105511539.5', '1', 11, 'half-down'],
		   ['83105511540', '83105511539.5000000000000000000001', 1, 11, 'half-down'],

			['83105511540', '83105511539.5', new Decimal(1), 3, 'half-up'],
			['83105511539', '83105511539.499999999999999999999999999999', 1, 3, 'half-up'],
			['83105511539', '83105511539.5', new Decimal('1'), 3, 'half-down'],
			['83105511540', '83105511539.5000000000000000000001', 1, 3, 'half-down'],

				['83105511540', '83105511539.5', 1, 30, 'half-up'],
			['83105511539', '83105511539.499999999999999999999999999999', 1, 30, 'half-up'],
			['83105511539', '83105511539.5', 1, 30, 'half-down'],
			['83105511540', '83105511539.5000000000000000000001', 1, 30, 'half-down'],

			['83105511540', '83105511539.5', -1, 11, 'half-up'],
			['83105511539', '83105511539.499999999999999999999999999999', -1, 11, 'half-up'],
			['83105511539', '83105511539.5', '-1', 11, 'half-down'],
			['83105511540', '83105511539.5000000000000000000001', -1, 11, 'half-down'],

			['83105511540', '83105511539.5', new Decimal(-1), 3, 'half-up'],
			['83105511539', '83105511539.499999999999999999999999999999', 1, 3, 'half-up'],
			['83105511539', '83105511539.5', new Decimal('-1'), 3, 'half-down'],
			['83105511540', '83105511539.5000000000000000000001', -1, 3, 'half-down'],

			['83105511540', '83105511539.5', 1, 30, 'up'],
			['83105511539', '83105511539.5', 1, 30, 'down'],
			['83105511540', '83105511539.5', 1, 30, 'ceil'],
			['83105511539', '83105511539.5', 1, 30, 'floor'],
			['83105511540', '83105511539.5', 1, 30, 'half-up'],
			['83105511539', '83105511539.5', 1, 30, 'half-down'],
			['83105511540', '83105511539.5', 1, 30, 'half-even'],
			['83105511540', '83105511539.5', 1, 30, 'half-ceil'],
			['83105511539', '83105511539.5', 1, 30, 'half-floor'],
			['83105511539', '83105511539.499999999999999999999999999999', void 0, 30, 'up'],
			['83105511539', '83105511539.499999999999999999999999999999', 1, 30, 'down'],
			['83105511539', '83105511539.499999999999999999999999999999', void 0, 30, 'ceil'],
			['83105511539', '83105511539.499999999999999999999999999999', 1, 30, 'floor'],
			['83105511539', '83105511539.499999999999999999999999999999', void 0, 30, 'half-up'],
			['83105511539', '83105511539.499999999999999999999999999999', 1, 30, 'half-down'],
			['83105511539', '83105511539.499999999999999999999999999999', void 0, 30, 'half-even'],
			['83105511539', '83105511539.499999999999999999999999999999', 1, 30, 'half-ceil'],
			['83105511539', '83105511539.499999999999999999999999999999', void 0, 30, 'half-floor'],
			['83105511540', '83105511539.5000000000000000000001', void 0, 30, 'up'],
			['83105511540', '83105511539.5000000000000000000001', 1, 30, 'down'],
			['83105511540', '83105511539.5000000000000000000001', void 0, 30, 'ceil'],
			['83105511540', '83105511539.5000000000000000000001', 1, 30, 'floor'],
			['83105511540', '83105511539.5000000000000000000001', void 0, 30, 'half-up'],
			['83105511540', '83105511539.5000000000000000000001', 1, 30, 'half-down'],
			['83105511540', '83105511539.5000000000000000000001', void 0, 30, 'half-even'],
			['83105511540', '83105511539.5000000000000000000001', 1, 30, 'half-ceil'],
			['83105511540', '83105511539.5000000000000000000001', void 0, 30, 'half-floor']
		]

		it.each(cases)('case %#', (expected, input, nearest, precision, rounding) => {
			if (precision !== undefined) Decimal.config = { precision };
			expect(new Decimal(input).toNearest(nearest, rounding).toValue()).toEqual(expected);
		});
	});

	describe("rounding = up", () => {
		beforeAll(() => {
			Decimal.config = { rounding: 'up' };
		});

		var cases = [
			['83105511540', '83105511539.5', void 0, 11]
		];

		it.each(cases)('case %#', (expected, input, nearest, precision, rounding) => {
			if (precision !== undefined) Decimal.config = { precision };
			expect(new Decimal(input).toNearest(nearest, rounding).toValue()).toEqual(expected);
		});
	});

	describe("rounding = down", () => {
		beforeAll(() => {
			Decimal.config = { rounding: 'down' };
		});

		var cases = [
			['83105511539', '83105511539.5', void 0, 11],

			['3847560', '3847561.00000749', 10, 11, 'up'],
			['42840000000000000', '42835000000000001', '1e+13', 2, 'up'],
			['42840000000000000', '42835000000000001', '1e+13', 2, 'down'],
			['42840000000000000', '42835000000000000.0002', '1e+13', 200, 'up'],
			['42840000000000000', '42835000000000000.0002', '1e+13', 200, 'down']
		];

		it.each(cases)('case %#', (expected, input, nearest, precision, rounding) => {
			if (precision !== undefined) Decimal.config = { precision };
			expect(new Decimal(input).toNearest(nearest, rounding).toValue()).toEqual(expected);
		});
	});

	describe("Minus zero tests", () => {

		function isMinusZero(n)
		{
			return n.isZero() && n.isNeg();
		}

		var cases = [
			!isMinusZero(new Decimal(0).toNearest(0)),
			isMinusZero(new Decimal(-1).toNearest(0)),
			isMinusZero(new Decimal(-0).toNearest(0)),
			!isMinusZero(new Decimal(1).toNearest(0)),
			!isMinusZero(new Decimal(1).toNearest(-0)),
			!isMinusZero(new Decimal(1).toNearest(-3)),
			isMinusZero(new Decimal(-1).toNearest(-3))
		];

		it.each(cases)('should preserve the expected zero sign for case %#', testCase => {
			expect(testCase).toEqual(true);
		});
	});

	it.each([
		['up', '1.3', '-1.3'],
		['down', '1.2', '-1.2'],
		['ceil', '1.3', '-1.2'],
		['floor', '1.2', '-1.3'],
		['half-up', '1.3', '-1.3'],
		['half-down', '1.2', '-1.2'],
		['half-even', '1.2', '-1.2'],
		['half-ceil', '1.3', '-1.2'],
		['half-floor', '1.2', '-1.3']
	])('treats a negative toNearest step as a magnitude for %s', (rounding, positive, negative) => {
		for (const step of ['0.1', '-0.1'])
		{
			expect(new Decimal('1.25').toNearest(step, rounding).toValue()).toBe(positive);
			expect(new Decimal('-1.25').toNearest(step, rounding).toValue()).toBe(negative);
		}
	});
});
