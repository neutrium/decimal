import { Decimal as CoreDecimal } from '../core.ts';
import { Decimal as ArithmeticDecimal } from '../arithmetic.ts';
import { Decimal as ScientificDecimal } from '../scientific.ts';
import { Decimal as RootDecimal } from '../index.ts';
import { DecimalLike } from '../DecimalBase.ts';
import { ScientificDecimal as ScientificDecimalBase } from '../ScientificDecimal.ts';

describe('tiered package entry points', () => {
	it('uses one inheritance chain without duplicating feature implementations', () => {
		expect(Object.getPrototypeOf(CoreDecimal.prototype)).toBe(DecimalLike.prototype);
		expect(Object.getPrototypeOf(ArithmeticDecimal.prototype)).toBe(CoreDecimal.prototype);
		expect(Object.getPrototypeOf(ScientificDecimalBase.prototype)).toBe(ArithmeticDecimal.prototype);
		expect(RootDecimal).toBe(ScientificDecimalBase);
		expect(ScientificDecimal).toBe(RootDecimal);

		const value = new RootDecimal(1);
		expect(value).toBeInstanceOf(ScientificDecimalBase);
		expect(value).toBeInstanceOf(ArithmeticDecimal);
		expect(value).toBeInstanceOf(CoreDecimal);
		expect(value).toBeInstanceOf(DecimalLike);
	});

	it('inherits one runtime implementation of each shared static operation', () => {
		for (const Constructor of [ArithmeticDecimal, ScientificDecimal]) {
			for (const method of ['min', 'max', 'clone']) {
				expect(Object.hasOwn(Constructor, method)).toBe(false);
				expect(Constructor[method]).toBe(CoreDecimal[method]);
			}
		}
	});

	it.each([CoreDecimal, ArithmeticDecimal, ScientificDecimal])(
		'preserves the active tier and safe subclass allocation through inherited statics: %s',
		Constructor => {
			let constructions = 0;
			class Tagged extends Constructor {
				constructor(value) {
					super(value);
					constructions++;
				}
			}
			Tagged.config = { precision: 7 };
			const operand = new Tagged(2);
			const Clone = Tagged.clone({ precision: 9 });
			const NestedClone = Clone.clone();
			for (const Active of [Constructor, Tagged, Clone, NestedClone]) {
				const Expected = Active === Tagged ? Constructor : Active;
				const minimum = Active.min([operand, 1, 3]);
				const maximum = Active.max(operand, 1, 3);
				expect(minimum.constructor).toBe(Expected);
				expect(maximum.constructor).toBe(Expected);
				expect(minimum.toValue()).toBe('1');
				expect(maximum.toValue()).toBe('3');
			}
			expect(new Clone(1)).not.toBeInstanceOf(Tagged);
			expect(Clone.config.precision).toBe(9);
			expect(Tagged.config.precision).toBe(7);
			if (Constructor === ScientificDecimal) {
				expect(Clone.PI.constructor).toBe(Clone);
				expect(Clone.atan2(1, 1).constructor).toBe(Clone);
				expect(Tagged.PI.constructor).toBe(Constructor);
				expect(Tagged.atan2(1, 1).constructor).toBe(Constructor);
			}
			expect(constructions).toBe(1);
		}
	);

	it('exposes only the operations promised by each tier', () => {
		const core = new CoreDecimal('1.25');
		const arithmetic = new ArithmeticDecimal('1.25');
		const scientific = new ScientificDecimal('1.25');

		expect(core.toFixed(2)).toBe('1.25');
		expect(core.cmp('1.250')).toBe(0);
		expect(core.add).toBeUndefined();
		expect(core.sin).toBeUndefined();

		expect(arithmetic.mul(2).toString()).toBe('2.5');
		expect(arithmetic.sin).toBeUndefined();

		expect(scientific.mul(2).sin().toString()).toBe('0.59847214410395649405');
	});

	it('accepts Decimal values across tiers without losing precision', () => {
		const core = new CoreDecimal('9007199254740993.0000000000000000001');
		const arithmetic = new ArithmeticDecimal(core);
		const scientific = new ScientificDecimal(arithmetic);

		expect(arithmetic.toValue()).toBe(core.toValue());
		expect(scientific.toValue()).toBe(core.toValue());
		expect(new CoreDecimal(scientific).toValue()).toBe(core.toValue());
		expect(core.eq(arithmetic)).toBe(true);
	});

	it('shares constructor parsing semantics across every public tier', () => {
		for (const Constructor of [CoreDecimal, ArithmeticDecimal, ScientificDecimal])
		{
			expect(new Constructor('0x1p+999999999999999999999').toString()).toBe('Infinity');
			expect(new Constructor('-0x1p-999999999999999999999').toValue()).toBe('-0');
		}
	});

	it('allocates static and instance results from the active tier', () => {
		const minimum = ArithmeticDecimal.min([3, 1, 2]);
		const result = new ArithmeticDecimal(2).add(3);

		expect(minimum).toBeInstanceOf(ArithmeticDecimal);
		expect(result).toBeInstanceOf(ArithmeticDecimal);
		expect(typeof minimum.add).toBe('function');
	});

	it('preserves tier behavior and isolated configuration in clones', () => {
		const Core5 = CoreDecimal.clone({ precision: 5 });
		const Arithmetic7 = ArithmeticDecimal.clone({ precision: 7 });
		const arithmeticResult = new Arithmetic7(1).div(3);

		expect(Core5.config.precision).toBe(5);
		expect(Arithmetic7.config.precision).toBe(7);
		expect(CoreDecimal.config.precision).not.toBe(5);
		expect(ArithmeticDecimal.config.precision).not.toBe(7);
		expect(arithmeticResult).toBeInstanceOf(Arithmetic7);
		expect(arithmeticResult.toString()).toBe('0.3333333');
		expect(new Core5(1).add).toBeUndefined();
	});
});
