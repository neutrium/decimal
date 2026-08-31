import { Decimal } from '../Decimal.ts';

const conversions = [
	['toDP', 1, result => result.toValue()],
	['toSD', 2, result => result.toValue()],
	['toFixed', 1, result => result],
	['toPrecision', 2, result => result],
	['toExponential', 1, result => result.replace('e+0', '')],
	['toNearest', '0.1', result => result.toValue()]
];

describe('Public rounding boundary', () => {
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
	])('uses names and defaults for %s', (name, positive, negative) => {
		const Clone = Decimal.clone({ precision: 20, rounding: name });
		for (const [method, digits, render] of conversions) {
			for (const [input, expected] of [['1.25', positive], ['-1.25', negative]]) {
				const value = new Clone(input);
				for (const mode of [name, undefined]) {
					expect(render(value[method](digits, mode))).toBe(expected);
				}
			}
		}
	});

	it.each(conversions)('%s rejects invalid modes even for no-op or non-finite conversions', (method, digits) => {
		for (const input of ['1.25', '-0', Infinity, -Infinity, NaN]) {
			const value = new Decimal(input);
			for (const mode of ['bankers', '4', -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0.5, NaN, null, {}]) {
				expect(() => value[method](digits, mode)).toThrow('Invalid rounding mode:');
				expect(() => value[method](undefined, mode)).toThrow('Invalid rounding mode:');
			}
		}
	});

	it.each([0, 1, -1, 2, 'true', 'false', null, {}])('precision rejects non-boolean flag %s', flag => {
		for (const input of [100, '-0', Infinity, NaN]) {
			expect(() => new Decimal(input).precision(flag)).toThrow('Invalid argument:');
		}
	});

	it('precision accepts booleans and defaults to ignoring integer trailing zeros', () => {
		const value = new Decimal(100);
		expect(value.precision()).toBe(1);
		expect(value.precision(false)).toBe(1);
		expect(value.precision(true)).toBe(3);
	});
});
