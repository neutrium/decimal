import { Decimal } from '../scientific.js';

const modes = ['up', 'down', 'ceil', 'floor', 'half-up', 'half-down', 'half-even', 'half-ceil', 'half-floor'];

describe('prefix arithmetic sign and ownership independence', () => {
	for (const rounding of modes)
	{
		it(`matches exact integer arithmetic across the prefix threshold (${rounding})`, () => {
			for (const precision of [1, 20, 950])
			{
				const D = Decimal.clone({ precision, rounding });
				// 127, 128, and 129 coefficient words per operand: below, at, and above 256 total.
				for (const length of [889, 896, 903])
				{
					const xMagnitude = BigInt('9'.repeat(length));
					const yMagnitude = BigInt('1' + '2'.repeat(length - 1));
					for (const xSign of [-1n, 1n]) for (const ySign of [-1n, 1n])
					{
						const xInteger = xSign * xMagnitude, yInteger = ySign * yMagnitude;
						const x = new D(xInteger), y = new D(yInteger);
						const xBefore = x.toValue(), yBefore = y.toValue();
						for (const method of ['add', 'sub'])
						{
							const exact = method === 'add' ? xInteger + yInteger : xInteger - yInteger;
							const expected = new D(exact).toSD(precision).toValue();
							for (const operand of [y, yInteger, yInteger.toString()])
								expect(x[method](operand).toValue()).toBe(expected);
						}
						expect(x.toValue()).toBe(xBefore);
						expect(y.toValue()).toBe(yBefore);
					}
				}
			}
		});
	}

	it('regresses subtraction of an equal negative magnitude as a Decimal operand', () => {
		const D = Decimal.clone({ precision: 20 });
		const source = '1' + '2'.repeat(900);
		const x = new D(source), y = new D('-' + source);
		expect(x.sub(y).toValue()).toBe('2.4444444444444444444e+900');
		expect(x.sub(y).toValue()).toBe(x.sub('-' + source).toValue());
	});
});
