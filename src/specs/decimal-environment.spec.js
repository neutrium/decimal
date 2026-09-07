import { Decimal } from '../scientific.ts';
import { Decimal as CoreDecimal } from '../core.ts';
import { Decimal as ArithmeticDecimal } from '../arithmetic.ts';
import { decimalEnvironmentAccess } from '../DecimalBase.ts';

describe('DecimalEnvironment', () => {
	it('shares one environment while resolving configuration and allocation independently', () => {
		const environment = Decimal[decimalEnvironmentAccess]();
		expect(CoreDecimal[decimalEnvironmentAccess]()).toBe(environment);
		expect(ArithmeticDecimal[decimalEnvironmentAccess]()).toBe(environment);
		const Parent = Decimal.clone({ precision: 7 });
		class Child extends Parent {}
		const first = environment.getDefaultContext(Child);
		expect(environment.getDefaultContext(Child)).toBe(first);
		expect(first.Constructor).toBe(Parent);

		Parent.config = { precision: 8 };
		const updated = environment.getDefaultContext(Child);
		expect(updated).not.toBe(first);
		expect(updated.precision).toBe(8);
		expect(first.precision).toBe(7);

		Child.config = {};
		Parent.config = { precision: 9 };
		expect(environment.getDefaultContext(Child)).toBe(updated);
		expect(environment.getDefaultContext(Child).Constructor).toBe(Parent);
		expect(() => { Child.config = { precision: 0 }; }).toThrow();
		expect(environment.getDefaultContext(Child)).toBe(updated);
	});

	it('does not register a new allocation boundary when configuration validation fails', () => {
		const environment = Decimal[decimalEnvironmentAccess]();
		const Parent = Decimal.clone();
		class Candidate extends Parent {}
		expect(() => environment.registerClone(Candidate, Parent, { precision: 0 })).toThrow();
		expect(environment.getCalculationConstructor(Candidate)).toBe(Parent);
		environment.registerClone(Candidate, Parent, { precision: 8 });
		expect(environment.getCalculationConstructor(Candidate)).toBe(Candidate);
		expect(environment.getDefaultContext(Candidate).create(1).constructor).toBe(Candidate);
	});
});
