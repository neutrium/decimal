import { Decimal } from '../Decimal.ts';
import { digits } from '../methods/utils/specs/decimal-state.js';

describe('Calculation input ownership', () => {
	it.each([
		['mod', '-10.25', [3]],
		['toNearest', '1.25', ['0.1']],
		['sqrt', '2', []],
		['cbrt', '-2', []],
		['pow', '-2', [3]],
		['pow', '2', ['0.5']],
		['ln', '2', []],
		['exp', '1', []],
		['log', '8', [2]],
		['sin', '0.1234567890123456789012345', []],
		['cos', '0.1234567890123456789012345', []],
		['tan', '0.1234567890123456789012345', []],
		['asin', '-0.5', []],
		['acos', '-0.5', []],
		['atan', '-0.5', []],
		['sinh', '0.1234567890123456789012345', []],
		['cosh', '0.1234567890123456789012345', []],
		['tanh', '-0.5', []],
		['asinh', '-0.5', []],
		['acosh', '2', []],
		['atanh', '-0.5', []],
		['sin', '-0', []],
		['sinh', 'Infinity', []]
	])('%s preserves caller-owned digits for %s', (method, input, args) => {
		const Clone = Decimal.clone({ precision: 30, rounding: 'half-even' });
		const value = new Clone(input);
		const operands = args.map(arg => new Clone(arg));
		const expected = value[method](...operands).toValue();

		const snapshots = [value, ...operands].map(operand => digits(operand)?.slice() ?? null);

		for (const operand of [value, ...operands])
		{
			Object.freeze(operand);
		}

		const result = value[method](...operands);
		expect(result.toValue()).toBe(expected);
		expect(result).toBeInstanceOf(Clone);
		expect(result).not.toBe(value);
		if (digits(result)) expect(digits(result)).not.toBe(digits(value));
		[value, ...operands].forEach((operand, index) => expect(digits(operand)).toEqual(snapshots[index]));
	});
});
