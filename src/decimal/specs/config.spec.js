import { Decimal } from '../Decimal.ts';

describe('constructor configuration', () => {
	const defaults = {
		maxE: Decimal.params.EXP_LIMIT,
		minE: -Decimal.params.EXP_LIMIT,
		modulo: 'down',
		precision: 20,
		rounding: 'half-up',
		toExpNeg: -7,
		toExpPos: 21
	};

	beforeEach(() => {
		Decimal.config = defaults;
		Decimal.external = true;
	});

	afterEach(() => {
		Decimal.config = defaults;
		Decimal.external = true;
	});

	it('isolates configuration between Decimal constructors', () => {
		const Short = Decimal.clone({ precision: 5 });
		const Long = Decimal.clone({ precision: 12 });

		expect(Decimal.precision).toBe(20);
		expect(Short.precision).toBe(5);
		expect(Long.precision).toBe(12);
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

	it('uses cloned exponent limits while constructing values', () => {
		const Limited = Decimal.clone({ maxE: 2, minE: -2 });

		expect(new Limited('1e3').toString()).toBe('Infinity');
		expect(new Limited('1e-3').toString()).toBe('0');
		expect(new Decimal('1e3').toString()).toBe('1000');
		expect(new Decimal('1e-3').toString()).toBe('0.001');
	});

	it('copies the parent configuration when cloning a clone', () => {
		const Parent = Decimal.clone({ precision: 7, rounding: 'down' });
		const Child = Parent.clone({ precision: 9 });

		Parent.precision = 6;

		expect(Decimal.config).toEqual(defaults);
		expect(Parent.config).toEqual({ ...defaults, precision: 6, rounding: 'down' });
		expect(Child.config).toEqual({ ...defaults, precision: 9, rounding: 'down' });
	});

	it('does not expose the mutable configuration object', () => {
		const config = Decimal.config;

		config.precision = 0;
		config.rounding = 99;

		expect(Decimal.precision).toBe(20);
		expect(Decimal.rounding).toBe('half-up');
	});

	it('validates direct precision and rounding assignments', () => {
		expect(() => { Decimal.precision = 0; }).toThrow();
		expect(() => { Decimal.rounding = 99; }).toThrow();
		expect(() => { Decimal.rounding = 'bankers'; }).toThrow();
		expect(Decimal.precision).toBe(20);
		expect(Decimal.rounding).toBe('half-up');
	});

	it('applies configuration updates atomically', () => {
		expect(() => {
			Decimal.config = { precision: 7, rounding: 99 };
		}).toThrow();

		expect(Decimal.precision).toBe(20);
		expect(Decimal.rounding).toBe('half-up');
	});

	it('restores base constructor state when a calculation throws', () => {
		Decimal.config = { precision: 1020, rounding: 'half-up' };

		expect(() => new Decimal(1).cos()).toThrowError('Precision limit exceeded');
		expect(Decimal.precision).toBe(1020);
		expect(Decimal.rounding).toBe('half-up');
		expect(Decimal.external).toBe(true);
	});

	it('restores clone state without changing the base constructor', () => {
		const Clone = Decimal.clone({ precision: 1020, rounding: 'half-up' });

		expect(() => new Clone(1).cos()).toThrowError('Precision limit exceeded');
		expect(Clone.precision).toBe(1020);
		expect(Clone.rounding).toBe('half-up');
		expect(Decimal.precision).toBe(20);
		expect(Decimal.rounding).toBe('half-up');
		expect(Decimal.external).toBe(true);
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
		Decimal.rounding = rounding;

		expect(Decimal.rounding).toBe(rounding);
		expect(new Decimal('1.25').toFixed(1)).toBe(expected);
		expect(new Decimal('1.25').toFixed(1, rounding)).toBe(expected);
	});

	it('accepts the human-readable euclid modulo mode', () => {
		Decimal.config = { modulo: 'euclid' };

		expect(Decimal.config.modulo).toBe('euclid');
		expect(new Decimal(-5).mod(3).toString()).toBe('1');
	});

	it('rejects invalid rounding-mode arguments', () => {
		expect(() => new Decimal('1.25').toFixed(1, 'bankers')).toThrowError(
			'[DecimalError] Invalid rounding mode: bankers'
		);
	});
});
