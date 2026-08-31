import { CalculationContext } from '../CalculationContext.ts';
import { Decimal } from '../Decimal.ts';
import { add, sub } from "../methods/arithmetic/add-subtract.ts";
import { mod } from '../methods/arithmetic/mod.js'
import { naturalLogarithm } from '../methods/exponential/ln.ts';
import { cbrt } from '../methods/power/cbrt.ts';
import { pow } from '../methods/power/pow.ts';
import { sqrt } from '../methods/power/sqrt.ts';
import { toFraction } from '../methods/to/to-fraction.ts';
import { toString } from '../methods/to/to-string.ts';
import { sin } from '../methods/trigonometry/sin.ts';

describe('Decimal internal method dispatch', () => {
	it('does not re-enter public methods during internal calculations', () => {
		class ReentryTrapDecimal extends Decimal {}

		ReentryTrapDecimal.config = { precision: 30 };

		for (const method of [
			'add', 'sub', 'mul', 'div', 'abs', 'neg', 'cmp', 'eq', 'gt', 'gte', 'lt', 'lte',
			'isFinite', 'isInt', 'isZero', 'isNeg', 'precision', 'toNumber', 'toValue', 'ln',
			'sqrt', 'asin'
		]) {
			Object.defineProperty(ReentryTrapDecimal.prototype, method, {
				configurable: true,
				value() {
					throw new Error(`public method re-entered: ${method}`);
				}
			});
		}

		const context = new CalculationContext(ReentryTrapDecimal, ReentryTrapDecimal.config);
		const create = value => context.create(value);
		const render = value => toString(value, context);

		expect(render(add(create(5), -2, context))).toBe('3');
		expect(render(sub(create(5), -2, context))).toBe('7');
		expect(render(mod(create(10), 3, context))).toBe('1');
		expect(render(pow(create(2), 10, context))).toBe('1024');
		expect(render(sqrt(create(4), context))).toBe('2');
		expect(render(cbrt(create(8), context))).toBe('2');
		expect(render(naturalLogarithm(create(2), undefined, context))).toBe('0.693147180559945309417232121458');
		expect(render(sin(create('0.5'), context))).toBe('0.479425538604203000273287935216');

		const fraction = toFraction(create('1.25'), undefined, context);
		expect(fraction.map(render)).toEqual(['5', '4']);
	});
});
