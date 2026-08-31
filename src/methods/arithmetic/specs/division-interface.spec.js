import { Decimal } from '../../../Decimal.ts';
import { CalculationContext } from '../../../CalculationContext.ts';
import { getRoundingModeCode, ROUND_DOWN } from '../../../config/RoundingModes.ts';
import { divideInteger, divideSignificant } from '../div.ts';

describe('Internal division precision policies', () => {
	it('matches exact bigint rounding for large integer quotients', () => {
		const modes = ['up', 'down', 'ceil', 'floor', 'half-up', 'half-down', 'half-even', 'half-ceil', 'half-floor'];
		let seed = 123456789n;
		const next = () => seed = (seed * 1103515245n + 12345n) & 0x7fffffffn;
		const round = (quotient, precision, mode) => {
			const sign = quotient < 0n ? -1n : 1n;
			const magnitude = quotient * sign;
			const digits = magnitude.toString();
			if (digits.length <= precision) return quotient.toString();
			const unit = 10n ** BigInt(digits.length - precision);
			const leading = magnitude / unit;
			const remainder = magnitude % unit;
			const comparison = remainder * 2n - unit;
			const increment = mode === 'up' ? remainder > 0n
				: mode === 'ceil' ? sign > 0n && remainder > 0n
					: mode === 'floor' ? sign < 0n && remainder > 0n
						: mode.startsWith('half') && (comparison > 0n || comparison === 0n && (
							mode === 'half-up' || mode === 'half-even' && leading % 2n === 1n ||
							mode === 'half-ceil' && sign > 0n || mode === 'half-floor' && sign < 0n
						));
			return ((leading + BigInt(increment)) * unit * sign).toString();
		};

		for (const mode of modes)
		{
			for (const precision of [1, 2, 7, 20])
			{
				const D = Decimal.clone({ precision, rounding: mode });

				for (let i = 0; i < 25; i++)
				{
					const length = 10 + Number(next() % 50n);
					let quotient = 10n ** BigInt(length - 1) + next() * next() * next() % (9n * 10n ** BigInt(length - 1));
					if (next() % 2n) quotient = -quotient;
					const divisorMagnitude = 1n + next() % 100000n;
					const remainder = next() % divisorMagnitude;
					const dividend = quotient * divisorMagnitude + (quotient < 0n ? -remainder : remainder);
					const divisor = next() % 2n ? -divisorMagnitude : divisorMagnitude;
					const exactQuotient = divisor < 0n ? -quotient : quotient;
					expect(new D(dividend).divToInt(divisor).toFixed()).toBe(round(exactQuotient, precision, mode));
				}
			}
		}
	});

	it.each([
		['up', '1.3e+22', '-1.3e+22'],
		['down', '1.2e+22', '-1.2e+22'],
		['ceil', '1.3e+22', '-1.2e+22'],
		['floor', '1.2e+22', '-1.3e+22'],
		['half-up', '1.3e+22', '-1.3e+22'],
		['half-down', '1.2e+22', '-1.2e+22'],
		['half-even', '1.2e+22', '-1.2e+22'],
		['half-ceil', '1.3e+22', '-1.2e+22'],
		['half-floor', '1.2e+22', '-1.3e+22']
	])('rounds large integer quotients without losing exact ties for %s', (rounding, positive, negative) => {
		const D = Decimal.clone({ precision: 2, rounding });
		const Wide = Decimal.clone({ precision: 80 });
		const exactTie = new Wide('12500000000000000000000.1');
		for (const [sign, expected] of [[1, positive], [-1, negative]]) {
			const value = new D(`${sign < 0 ? '-' : ''}${exactTie}`);
			expect(value.divToInt(1).toValue()).toBe(expected);
		}
	});

	it('bounds public integer division work for very large exponents', () => {
		const D = Decimal.clone({ precision: 20 });
		const value = new D('1e30064771058');
		expect(value.divToInt(3).toValue()).toBe('3.3333333333333333333e+30064771057');
		expect(value.neg().divToInt(3).toValue()).toBe('-3.3333333333333333333e+30064771057');
		expect(new D('1e9000000000000000').divToInt('1e-9000000000000000').toValue()).toBe('Infinity');
	});

	it('uses the supplied context snapshot and supports explicit significant-digit overrides', () => {
		const D = Decimal.clone({ precision: 3, rounding: 'up' });
		const context = new CalculationContext(D, D.config);
		const x = new D(1);
		const y = new D(7);
		D.config = { precision: 1, rounding: 'down' };

		expect(divideSignificant(x, y, context).toValue()).toBe('0.143');
		expect(divideSignificant(x, y, context, 6).toValue()).toBe('0.142858');
		expect(divideSignificant(x, y, context, 6, ROUND_DOWN).toValue()).toBe('0.142857');
		expect(context.config.precision).toBe(3);
		expect(context.config.rounding).toBe('up');
	});

	it('does not apply significant-digit precision to internal integer quotients', () => {
		const D = Decimal.clone({ precision: 3, rounding: 'up' });
		const context = new CalculationContext(D, D.config);
		const x = new D(123456789);
		const y = new D(10);

		// Integer division defaults to truncation, independently of the context's rounding mode.
		expect(divideInteger(x, y, context).toValue()).toBe('12345678');
		expect(divideInteger(new D(-123456789), y, context).toValue()).toBe('-12345678');
		expect(divideSignificant(x, y, context).toValue()).toBe('12400000');
		// The public method still applies its documented significant-digit rounding afterward.
		expect(x.divToInt(y).toValue()).toBe('12400000');
	});

	it.each([
		['up', '3', '-3', '1', '-1'],
		['down', '2', '-2', '0', '-0'],
		['ceil', '3', '-2', '1', '-0'],
		['floor', '2', '-3', '0', '-1'],
		['half-up', '3', '-3', '0', '-0'],
		['half-down', '2', '-2', '0', '-0'],
		['half-even', '2', '-2', '0', '-0'],
		['half-ceil', '3', '-2', '0', '-0'],
		['half-floor', '2', '-3', '0', '-0']
	])('honors %s for scalar and multiword divisors and tiny integer quotients', (mode, positive, negative, tiny, negativeTiny) => {
		const D = Decimal.clone({ precision: 20 });
		const context = new CalculationContext(D, D.config);
		const rounding = getRoundingModeCode(mode);

		for (const [a, b] of [['5', '2'], ['250000025', '100000010']])
		{
			for (const [sign, expected] of [['', positive], ['-', negative]])
			{
				const x = new D(sign + a);
				const y = new D(b);
				expect(divideInteger(x, y, context, rounding).toValue()).toBe(expected);
				expect(divideSignificant(x, y, context, 1, rounding).toValue()).toBe(expected);
			}
		}

		expect(divideInteger(new D('1e-30'), new D(1), context, rounding).toValue()).toBe(tiny);
		expect(divideInteger(new D('-1e-30'), new D(1), context, rounding).toValue()).toBe(negativeTiny);
	});

	it.each([divideInteger, divideSignificant])('%s preserves operand ownership, special values and result constructors', divide => {
		const D = Decimal.clone({ precision: 20 });
		const context = new CalculationContext(D, D.config);
		const operands = [0, -0, 1, -1, Infinity, -Infinity, NaN].map(value => new D(value));

		for (const value of operands)
		{
			Object.freeze(value);
		}

		for (const x of operands)
		{
			for (const y of operands)
			{
				const result = divide(x, y, context);
				expect(result.toNumber()).toBe(x.toNumber() / y.toNumber());
				expect(result).toBeInstanceOf(D);
				expect(result).not.toBe(x);
				expect(result).not.toBe(y);
			}
		}
	});
});
