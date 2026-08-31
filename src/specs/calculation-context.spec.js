import { CalculationContext } from '../CalculationContext.ts';
import { Decimal } from '../Decimal.ts';
import { getDecimalState } from '../DecimalState.ts';
import { div } from '../methods/arithmetic/div.ts';

describe('CalculationContext', () => {
	it('captures an immutable constructor configuration snapshot', () => {
		const Clone = Decimal.clone({ precision: 7, rounding: 'down' });
		const context = new CalculationContext(Clone, Clone.config);

		Clone.config = { precision: 12, rounding: 'half-even' };

		expect(Object.isFrozen(context)).toBe(true);
		expect(Object.isFrozen(context.config)).toBe(true);
		expect(context.config.precision).toBe(7);
		expect(context.roundingCode).toBe(1);
	});

	it('derives a new context without modifying its parent', () => {
		const context = new CalculationContext(Decimal, Decimal.config);
		const working = context.with({ external: false, precision: 40, roundingCode: 1 });

		expect(working).not.toBe(context);
		expect(working.Constructor).toBe(context.Constructor);
		expect(working.external).toBe(false);
		expect(working.config).toBe(context.config);
		expect(working.precision).toBe(40);
		expect(working.roundingCode).toBe(1);
		expect(context.external).toBe(true);
		expect(context.precision).not.toBe(40);
	});

	it('reuses its unlimited context without changing calculation policy', () => {
		const context = new CalculationContext(Decimal, Decimal.config);
		const unlimited = context.withoutLimits();

		expect(context.withoutLimits()).toBe(unlimited);
		expect(unlimited.withoutLimits()).toBe(unlimited);
		expect(unlimited.config).toBe(context.config);
		expect(unlimited.precision).toBe(context.precision);
		expect(unlimited.roundingCode).toBe(context.roundingCode);
		expect(unlimited.external).toBe(false);
	});

	it('constructs intermediate values with the configured clone', () => {
		const Clone = Decimal.clone({ precision: 9 });
		const context = new CalculationContext(Clone, Clone.config);
		const value = context.create(1).div(3);

		expect(value).toBeInstanceOf(Clone);
		expect(value.toString()).toBe('0.333333333');
	});

	it('constructs owned result state without parsing a placeholder value', () => {
		const Clone = Decimal.clone({ precision: 9 });
		const context = new CalculationContext(Clone, Clone.config);
		const state = { d: [123, 4500000], e: 2, s: -1 };
		const value = context.createResult(state);

		expect(getDecimalState(value)).toBe(state);
		expect(value).toBeInstanceOf(Clone);
		expect(value.toValue()).toBe('-123.45');
	});

	it('uses explicit snapshots internally and current constructor configuration publicly', () => {
		const Clone = Decimal.clone({ precision: 9, rounding: 'down' });
		const snapshot = new CalculationContext(Clone, Clone.config);
		const working = snapshot.with({ precision: 17 });
		const value = working.create(1);

		Clone.config = { precision: 5, rounding: 'up' };

		expect(div(value, 3, snapshot).toString()).toBe('0.333333333');
		expect(div(value, 3, working).toString()).toBe('0.33333333333333333');
		expect(value.div(3).toString()).toBe('0.33334');
		expect(div(value, 3, working).div(1).toString()).toBe('0.33334');
	});

	it('uses transient parsing contexts without attaching them to values', () => {
		const Clone = Decimal.clone({ maxE: 2 });
		const context = new CalculationContext(Clone, Clone.config);
		const internal = context.with({ external: false });
		const value = internal.create('1e3');

		expect(context.create('1e3').isFinite()).toBe(false);
		expect(value.toString()).toBe('1000');
		expect(div(value, 1, internal).toString()).toBe('1000');
		expect(value.div(1).isFinite()).toBe(false);
	});

	it('allocates internal values without invoking arbitrary subclass constructors', () => {
		let constructions = 0;
		class TaggedDecimal extends Decimal {
			constructor(value) {
				super(value);
				constructions++;
			}
		}
		TaggedDecimal.config = { minE: -1, maxE: 2 };
		const external = new CalculationContext(TaggedDecimal, TaggedDecimal.config);
		const internal = external.with({ external: false });

		expect(external.Constructor).toBe(Decimal);
		for (const input of [0.03125, '0.03125', 1000, '1000', 1000n, new Decimal('1000')]) {
			const result = internal.create(input);
			expect(result.toValue()).toBe(new Decimal(input).toValue());
			expect(result).toBeInstanceOf(Decimal);
			expect(result).not.toBeInstanceOf(TaggedDecimal);
			expect(Object.keys(result)).toEqual([]);
			expect(Object.isFrozen(result)).toBe(false);
		}
		expect(constructions).toBe(0);

		expect(external.create(0.03125).toValue()).toBe('0');
		expect(external.create(1000).toValue()).toBe('Infinity');
		expect(constructions).toBe(0);
	});

	it('returns ordinary Decimal values from arbitrary subclasses without re-entering them', () => {
		let constructions = 0;
		class TaggedDecimal extends Decimal {
			constructor(value) {
				super(value);
				constructions++;
			}
		}
		TaggedDecimal.config = { minE: -1, maxE: 2 };
		const value = new TaggedDecimal(1);
		const expected = new Decimal(1).exp().toValue();
		const result = value.exp();

		expect(constructions).toBe(1);
		expect(result.toValue()).toBe(expected);
		expect(result).toBeInstanceOf(Decimal);
		expect(result).not.toBeInstanceOf(TaggedDecimal);
		expect(value.toValue()).toBe('1');
	});

	it('turns clones of arbitrary subclasses into safe generated Decimal clones', () => {
		let constructions = 0;
		class TaggedDecimal extends Decimal {
			constructor(value) {
				super(value);
				constructions++;
			}
		}
		TaggedDecimal.config = { precision: 7 };
		const Clone = TaggedDecimal.clone({ precision: 9 });
		const value = new Clone(1);
		const result = value.div(3);

		expect(constructions).toBe(0);
		expect(value).toBeInstanceOf(Clone);
		expect(result).toBeInstanceOf(Clone);
		expect(result.toString()).toBe('0.333333333');
	});
});
