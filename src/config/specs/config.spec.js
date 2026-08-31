import { Decimal } from '../../Decimal.ts';
import { DecimalError } from '../../errors.ts';
import { digits } from '../../methods/utils/specs/decimal-state.js';

describe('constructor configuration', () => {
	const defaults = {
		maxE: Decimal.limits.maxExponent,
		maxPrefixedDigits: 1_000_000,
		maxOutputDigits: 1_000_000,
		minE: -Decimal.limits.maxExponent,
		modulo: 'down',
		precision: 20,
		rounding: 'half-up',
		toExpNeg: -7,
		toExpPos: 21
	};

	beforeAll(() => {
		Decimal.config = defaults;
	});

	afterEach(() => {
		Decimal.config = defaults;
	});

	it('isolates configuration between Decimal constructors', () => {
		const Short = Decimal.clone({ precision: 5 });
		const Long = Decimal.clone({ precision: 12 });

		expect(Decimal.config.precision).toBe(20);
		expect(Short.config.precision).toBe(5);
		expect(Long.config.precision).toBe(12);
		expect(new Decimal(1).div(3).toString()).toBe('0.33333333333333333333');
		expect(new Short(1).div(3).toString()).toBe('0.33333');
		expect(new Long(1).div(3).toString()).toBe('0.333333333333');
	});

	it('returns values belonging to the cloned constructor', () => {
		const Clone = Decimal.clone({ precision: 8 });
		const result = new Clone(2).sqrt().add(1);

		expect(result).toBeInstanceOf(Clone);
		expect(result).toBeInstanceOf(Decimal);
		expect(Clone.PI).toBeInstanceOf(Clone);
		expect(Clone.atan2(1, 1)).toBeInstanceOf(Clone);
	});

	it('returns independent generated-clone PI values without exposing internal constants', () => {
		const Clone = Decimal.clone();

		const firstPi = Clone.PI;
		const secondPi = Clone.PI;

		expect(firstPi).not.toBe(secondPi);
		expect(firstPi).toBeInstanceOf(Clone);
		expect('LN10' in Clone).toBe(false);

		expect('s' in firstPi).toBe(false);
		expect('d' in firstPi).toBe(false);

		expect(Clone.PI.toString().startsWith('3.1415926535')).toBe(true);
	});

	it('uses cloned exponent limits while constructing values', () => {
		const Limited = Decimal.clone({ maxE: 2, minE: -2 });

		expect(new Limited('1e3').toString()).toBe('Infinity');
		expect(new Limited('1e-3').toString()).toBe('0');
		expect(new Decimal('1e3').toString()).toBe('1000');
		expect(new Decimal('1e-3').toString()).toBe('0.001');
	});

	it.each([
		[1000, 'Infinity'], [-1000, '-Infinity'],
		[999, '999'], [-999, '-999'],
		[0.001, '0'], [-0.001, '-0'],
		[0.01, '0.01'], [-0.01, '-0.01'],
		[0, '0'], [-0, '-0'],
		[Infinity, 'Infinity'], [-Infinity, '-Infinity'], [NaN, 'NaN']
	])('applies constructor limits consistently to every representation of %s', (input, expected) => {
		const Limited = Decimal.clone({ maxE: 2, minE: -2 });
		const Foreign = Decimal.clone();
		class Subclass extends Limited {
			constructor(value) { super(value); }
		}
		const text = Object.is(input, -0) ? '-0' : String(input);
		const original = new Foreign(input);
		const values = [input, text, new Decimal(input), original];
		if (Number.isInteger(input) && !Object.is(input, -0)) values.push(BigInt(input));
		Object.freeze(original);

		for (const Constructor of [Limited, Limited.clone(), Subclass]) {
			for (const value of values) {
				const result = new Constructor(value);
				expect(result.toValue()).toBe(expected);
				expect(result).toBeInstanceOf(Constructor);
				if (value instanceof Decimal) {
					expect(result).not.toBe(value);
					if (digits(result)) expect(digits(result)).not.toBe(digits(value));
				}
			}
		}
		expect(original.toValue()).toBe(text);
	});

	it('reapplies current limits when publicly copying an existing value', () => {
		const Limited = Decimal.clone();
		const large = new Limited('1000');
		const small = new Limited('-0.001');
		Limited.config = { maxE: 2, minE: -2 };

		expect(new Limited(large).toValue()).toBe('Infinity');
		expect(new Limited(small).toValue()).toBe('-0');
		expect(large.toValue()).toBe('1000');
		expect(small.toValue()).toBe('-0.001');
	});

	it('copies the parent configuration when cloning a clone', () => {
		const Parent = Decimal.clone({ precision: 7, rounding: 'down' });
		const Child = Parent.clone({ precision: 9 });

		Parent.config = { precision: 6 };

		expect(Decimal.config).toEqual(defaults);
		expect(Parent.config).toEqual({ ...defaults, precision: 6, rounding: 'down' });
		expect(Child.config).toEqual({ ...defaults, precision: 9, rounding: 'down' });
	});

	it('copies an arbitrary subclass configuration while using a safe clone prototype', () => {
		class CustomDecimal extends Decimal {}
		CustomDecimal.config = { precision: 73, rounding: 'floor' };

		const Clone = CustomDecimal.clone();
		expect(Clone.config.precision).toBe(73);
		expect(Clone.config.rounding).toBe('floor');
		expect(new Clone(1).div(3).precision()).toBe(73);
	});

	it('invalidates a constructor context after its configuration changes', () => {
		const Clone = Decimal.clone({ precision: 3 });
		const value = new Clone(1);

		expect(value.div(3).toString()).toBe('0.333');

		Clone.config = { precision: 6 };

		expect(value.div(3).toString()).toBe('0.333333');
		expect(new Clone(1).div(3).toString()).toBe('0.333333');
	});

	it('refreshes an inherited constructor context after its parent configuration changes', () => {
		class Subclass extends Decimal {}

		const value = new Subclass(1);
		expect(value.div(3).toString()).toBe('0.33333333333333333333');

		Decimal.config = { precision: 6 };

		expect(value.div(3).toString()).toBe('0.333333');
	});

	it('returns the active frozen configuration snapshot', () => {
		const config = Decimal.config;

		expect(Object.isFrozen(config)).toBe(true);
		expect(Decimal.config).toBe(config);
		expect(() => { config.precision = 0; }).toThrow(TypeError);
		expect(() => { config.rounding = 99; }).toThrow(TypeError);

		expect(Decimal.config.precision).toBe(20);
		expect(Decimal.config.rounding).toBe('half-up');
	});

	it('keeps constructor configuration out of shadowable static properties', () => {
		expect(Object.hasOwn(Decimal, '_config')).toBe(false);
		Object.defineProperty(Decimal, '_config', { configurable: true, value: { precision: 1 } });

		expect(Decimal.config.precision).toBe(20);
		expect(new Decimal(1).div(3).toValue()).toBe('0.33333333333333333333');

		delete Decimal._config;
	});

	it('exposes validation limits without coefficient-storage details', () => {
		expect(Decimal.limits).toEqual({ maxDigits: 1e9, maxExponent: 9e15 });
		expect(Object.isFrozen(Decimal.limits)).toBe(true);
		expect(() => { Decimal.limits = { maxDigits: 1, maxExponent: 1 }; }).toThrow(TypeError);
		expect('BASE' in Decimal.limits).toBe(false);
		expect('LOG_BASE' in Decimal.limits).toBe(false);
		expect('params' in Decimal).toBe(false);
	});

	it('validates precision and rounding through the common configuration path', () => {
		expect(() => { Decimal.config = { precision: 0 }; }).toThrow();
		expect(() => { Decimal.config = { rounding: 99 }; }).toThrow();
		expect(() => { Decimal.config = { rounding: 'bankers' }; }).toThrow();
		expect(Decimal.config.precision).toBe(20);
		expect(Decimal.config.rounding).toBe('half-up');
	});

	it('does not expose separate precision or rounding configuration properties', () => {
		expect('precision' in Decimal).toBe(false);
		expect('rounding' in Decimal).toBe(false);
	});

	it('validates the prefixed expansion limit', () => {
		expect(() => { Decimal.config = { maxPrefixedDigits: 0 }; }).toThrowError(
			'Invalid configuration parameter: maxPrefixedDigits: 0'
		);
		expect(() => { Decimal.config = { maxPrefixedDigits: 1_000_000_001 }; }).toThrowError(
			'Invalid configuration parameter: maxPrefixedDigits: 1000000001'
		);
		expect(Decimal.config.maxPrefixedDigits).toBe(1_000_000);
	});

	it('applies configuration updates atomically', () => {
		expect(() => {
			Decimal.config = { precision: 7, rounding: 99 };
		}).toThrow();

		expect(Decimal.config.precision).toBe(20);
		expect(Decimal.config.rounding).toBe('half-up');
	});

	it('rejects unknown configuration keys without applying known keys', () => {
		expect(() => {
			Decimal.config = { precision: 7, precison: 8 };
		}).toThrowError('Unknown configuration parameter: precison');

		expect(Decimal.config.precision).toBe(20);
		expect(Decimal.config).not.toHaveProperty('precison');
	});

	it('does not mutate base constructor configuration when a calculation throws', () => {
		Decimal.config = { precision: 1020, rounding: 'half-up' };

		expect(() => new Decimal(1).cos()).toThrowError('Precision limit exceeded');
		expect(Decimal.config.precision).toBe(1020);
		expect(Decimal.config.rounding).toBe('half-up');
	});

	it('does not mutate clone or base configuration when a calculation throws', () => {
		const Clone = Decimal.clone({ precision: 1020, rounding: 'half-up' });

		expect(() => new Clone(1).cos()).toThrowError('Precision limit exceeded');
		expect(Clone.config.precision).toBe(1020);
		expect(Clone.config.rounding).toBe('half-up');
		expect(Decimal.config.precision).toBe(20);
		expect(Decimal.config.rounding).toBe('half-up');
	});

	it('does not expose mutable calculation scratch state', () => {
		expect(Object.prototype.hasOwnProperty.call(Decimal, 'external')).toBe(false);
		expect(Object.prototype.hasOwnProperty.call(Decimal, 'quadrant')).toBe(false);
	});

	it.each([
		['up', '1.3'],
		['down', '1.2'],
		['ceil', '1.3'],
		['floor', '1.2'],
		['half-up', '1.3'],
		['half-down', '1.2'],
		['half-even', '1.2'],
		['half-ceil', '1.3'],
		['half-floor', '1.2']
	])('uses the %s rounding mode', (rounding, expected) => {
		Decimal.config = { rounding };

		expect(Decimal.config.rounding).toBe(rounding);
		expect(new Decimal('1.25').toFixed(1)).toBe(expected);
		expect(new Decimal('1.25').toFixed(1, rounding)).toBe(expected);
	});

	it.each([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])('rejects numeric mode %s without changing configuration', mode => {
		const Clone = Decimal.clone({ precision: 17, rounding: 'half-even', modulo: 'euclid' });
		for (const Constructor of [Decimal, Clone]) {
			const original = Constructor.config;
			expect(() => { Constructor.config = { rounding: mode }; }).toThrow('Invalid configuration parameter: rounding:');
			expect(Constructor.config).toEqual(original);
			for (const key of ['rounding', 'modulo']) {
				const update = { precision: 31, [key]: mode };
				expect(() => { Constructor.config = update; }).toThrow(`Invalid configuration parameter: ${key}:`);
				expect(() => Constructor.clone(update)).toThrow(`Invalid configuration parameter: ${key}:`);
				expect(Constructor.config).toEqual(original);
			}
		}
	});

	it('accepts the human-readable euclid modulo mode', () => {
		Decimal.config = { modulo: 'euclid' };

		expect(Decimal.config.modulo).toBe('euclid');
		expect(new Decimal(-5).mod(3).toString()).toBe('1');
	});

	it('rejects invalid rounding-mode arguments', () => {
		expect(() => new Decimal('1.25').toFixed(1, 'bankers')).toThrowError(
			'Invalid rounding mode: bankers'
		);
	});

	it.each([
		['rounding', 'bankers'],
		['rounding', 4],
		['modulo', 'javascript'],
		['modulo', 9]
	])('reports invalid %s values as configuration errors', (key, value) => {
		for (const update of [() => { Decimal.config = { [key]: value }; }, () => Decimal.clone({ [key]: value })])
		{
			try
			{
				update();
				throw new Error('Expected configuration to fail');
			}
			catch (error)
			{
				expect(error).toBeInstanceOf(DecimalError);
				expect(error.code).toBe('INVALID_CONFIGURATION');
				expect(error.message).toBe(`Invalid configuration parameter: ${key}: ${value}`);
			}
		}
	});
});
