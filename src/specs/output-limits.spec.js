import { Decimal, DecimalError } from '../index.ts';

describe('Bounded string output', () => {
	function expectLimit(operation) {
		expect(operation).toThrowError(DecimalError);
		try { operation(); } catch (error) {
			expect(error.code).toBe('OUTPUT_DIGIT_LIMIT_EXCEEDED');
		}
	}

	it.each([0, -1, 1.5, NaN, Infinity, 1_000_000_001, '10'])('rejects an invalid output limit: %s', maxOutputDigits => {
		expect(() => Decimal.clone({ maxOutputDigits })).toThrowError(DecimalError);
	});

	it('isolates output limits from parsing, arithmetic, and other constructors', () => {
		const Small = Decimal.clone({ maxOutputDigits: 3 });
		const Large = Small.clone({ maxOutputDigits: 20 });
		const value = new Small('12345');
		expect(value.eq('12345')).toBe(true);
		expect(value.add(1).eq('12346')).toBe(true);
		expect(value.toNumber()).toBe(12345);
		expectLimit(() => value.toString());
		expect(new Large(value).toString()).toBe('12345');
		expect(Small.config.maxOutputDigits).toBe(3);
	});

	it.each([
		['12345', 'toString', [], '12345'],
		['12345', 'toValue', [], '12345'],
		['-12345', 'toJSON', [], '-12345'],
		['1', 'toFixed', [4], '1.0000'],
		['0', 'toFixed', [4], '0.0000'],
		['-0.00001', 'toFixed', [4], '-0.0000'],
		['0.001', 'toFixed', [4], '0.0010'],
		['1e4', 'toFixed', [], '10000'],
		['1e100', 'toExponential', [4], '1.0000e+100'],
		['-1e-100', 'toPrecision', [5], '-1.0000e-100'],
		['9999.9', 'toFixed', [0], '10000']
	])('counts digits exactly at the boundary: %s.%s', (input, method, args, expected) => {
		const D = Decimal.clone({ maxOutputDigits: 5 });
		const value = new D(input);
		expect(value[method](...args)).toBe(expected);
		D.config = { maxOutputDigits: 4 };
		expectLimit(() => value[method](...args));
	});

	it('rejects extreme padding before calling repeat or serializing the coefficient', () => {
		const D = Decimal.clone({ maxOutputDigits: 10, toExpNeg: -9e15, toExpPos: 9e15 });
		const values = [new D('1e1000000000'), new D('1e-1000000000'), new D(1)];
		const repeat = vi.spyOn(String.prototype, 'repeat');
		try {
			expectLimit(() => values[0].toFixed());
			expectLimit(() => values[1].toString());
			expectLimit(() => values[2].toFixed(1e9));
			expectLimit(() => values[2].toExponential(1e9));
			expectLimit(() => values[2].toPrecision(1e9));
			expect(repeat).not.toHaveBeenCalled();
		} finally { repeat.mockRestore(); }
	});

	it('allows compact exponents and non-finite values under a one-digit limit', () => {
		const D = Decimal.clone({ maxOutputDigits: 1 });
		for (const input of ['1e1000000000', '1e-1000000000', '-0', 'Infinity', '-Infinity', 'NaN']) {
			expect(new D(input).toValue()).toBe(new Decimal(input).toValue());
		}
	});

	it('materializes long padding with the correct length and contents', () => {
		const result = new Decimal('1.25').toFixed(100000);
		expect(result.length).toBe(100002);
		expect(result.slice(0, 4)).toBe('1.25');
		expect(result.slice(4)).toBe('0'.repeat(99998));
	});
});

describe('Output exponent limits', () => {
	it('keeps existing receivers and new operands exact until result finalization', () => {
		const D = Decimal.clone({ maxE: 100, minE: -100, precision: 20 });
		const large = new D('1e50');
		const tiny = new D('1e-50');

		D.config = { maxE: 10, minE: -10 };

		expect(large.sub(large).toValue()).toBe('0');
		expect(large.sub('1e50').toValue()).toBe('0');
		expect(large.div(large).toValue()).toBe('1');
		expect(large.div('1e50').toValue()).toBe('1');
		expect(large.mul('1e-50').toValue()).toBe('1');
		expect(tiny.sub(tiny).toValue()).toBe('0');
		expect(tiny.div(tiny).toValue()).toBe('1');
		expect(tiny.mul('1e50').toValue()).toBe('1');
		expect(large.shift(-50).toValue()).toBe('1');
		expect(tiny.shift(50).toValue()).toBe('1');
		expect(tiny.ceil().toValue()).toBe('1');
		expect(large.cmp('1e50')).toBe(0);

		// Limits still apply to the finalized public result.
		expect(large.mul(1).toValue()).toBe('Infinity');
		expect(tiny.mul(1).toValue()).toBe('0');
	});

	it('uses exact existing values when an operation moves the result back into range', () => {
		const D = Decimal.clone({ maxE: 100, minE: -100, precision: 20 });
		const value = new D('1e50');
		D.config = { maxE: 10 };

		expect(value.pow(-1).toValue()).toBe('1e-50');
	});

	it('does not apply changed exponent limits while formatting an existing value', () => {
		const D = Decimal.clone({ maxE: 100, minE: -100, maxOutputDigits: 100 });
		const large = new D('1e50');
		const tiny = new D('1e-50');
		D.config = { maxE: 10, minE: -10 };

		expect(large.toFixed(2)).toBe(`1${'0'.repeat(50)}.00`);
		expect(large.toExponential(2)).toBe('1.00e+50');
		expect(large.toPrecision(3)).toBe('1.00e+50');
		expect(tiny.toExponential(2)).toBe('1.00e-50');
		expect(tiny.toPrecision(3)).toBe('1.00e-50');
	});
});
