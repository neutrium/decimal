import { Decimal } from '../Decimal.ts';
import { digits } from '../methods/utils/specs/decimal-state.js';

describe('Static min/max', () => {
	it('accepts scalar values and provides explicit iterable variants', () => {
		expect(Decimal.min(1, '7', '-2', '3', '-4').toString()).toBe('-4');
		expect(Decimal.max(1, '7', '-2', '3', '-4').toString()).toBe('7');
		expect(Decimal.min([1, '7', '-2', '3', '-4']).toString()).toBe('-4');
		expect(Decimal.max(new Set([1, 7, -2, 3, -4])).toString()).toBe('7');
		expect(() => Decimal.min()).toThrow();
		expect(Decimal.max([1, 2]).toString()).toBe('2');
		expect(() => Decimal.min([])).toThrow('Invalid non-empty iterable');
		expect(Decimal.max('123').toString()).toBe('123');
		expect(() => Decimal.min(new String('123'))).toThrow('Invalid argument');
		expect(() => Decimal.max({})).toThrow('Invalid argument');
		expect(() => Decimal.min([1, 2], 3)).toThrow('Invalid additional arguments with iterable');
	});

	it('stops normalizing values once an operand is NaN', () => {
		expect(Decimal.min(1, NaN, 'invalid').isNaN()).toBe(true);
		expect(Decimal.max(NaN, 'invalid').isNaN()).toBe(true);
	});

	it('streams generators and closes them after encountering NaN', () => {
		let visited = 0;
		let closed = false;

		function* values() {
			try {
				visited++;
				yield 1;
				visited++;
				yield NaN;
				visited++;
				yield 'invalid';
			} finally {
				closed = true;
			}
		}

		expect(Decimal.min(values()).isNaN()).toBe(true);
		expect(visited).toBe(2);
		expect(closed).toBe(true);
	});

	it('processes collections too large to safely spread as arguments', () => {
		function* values() {
			for (let i = 0; i < 200_000; i++) yield i - 100_000;
		}

		expect(Decimal.min(values()).toString()).toBe('-100000');
		expect(Decimal.max(values()).toString()).toBe('99999');
	});

	it('preserves signed-zero selection and creates the result with the receiving constructor', () => {
		const D = Decimal.clone();
		const foreign = new Decimal(-5);
		const minimum = D.min(1, foreign);
		expect(minimum).toBeInstanceOf(D);
		expect(minimum).not.toBe(foreign);
		expect(digits(minimum)).not.toBe(digits(foreign));
		expect(D.min(0, -0, 0).toValue()).toBe('-0');
		expect(D.max(-0, 0, -0).toValue()).toBe('0');
		expect(D.min([0, -0, 0]).toValue()).toBe('-0');
		expect(D.max([-0, 0, -0]).toValue()).toBe('0');
		expect(D.min(foreign)).not.toBe(foreign);
		expect(D.max(foreign)).not.toBe(foreign);
		expect(D.min([foreign])).toBeInstanceOf(D);
		expect(D.max([foreign])).toBeInstanceOf(D);
		expect(D.min([foreign])).not.toBe(foreign);
		expect(D.max([foreign])).not.toBe(foreign);
	});
});
