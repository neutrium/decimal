import { Decimal, DecimalError } from '../index.ts';

describe('Decimal public errors', () => {
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

	function expectDecimalError(action, code, message) {
		let error;

		try {
			action();
		} catch (caught) {
			error = caught;
		}

		expect(error).toBeInstanceOf(DecimalError);
		expect(error).toMatchObject({ name: 'DecimalError', code, message });
		expect(String(error)).toBe(`DecimalError: ${message}`);
	}

	it('standardizes invalid argument errors', () => {
		expectDecimalError(
			() => new Decimal(Symbol('value')),
			'INVALID_ARGUMENT',
			'Invalid argument: Symbol(value)'
		);
		expectDecimalError(
			() => new Decimal(1).toDP(-1),
			'INVALID_ARGUMENT',
			'Invalid integer argument: -1'
		);
		expectDecimalError(
			() => { Decimal.config = { rounding: 'bankers' }; },
			'INVALID_CONFIGURATION',
			'Invalid configuration parameter: rounding: bankers'
		);
	});

	it('standardizes configuration errors and applies updates atomically', () => {
		expectDecimalError(
			() => { Decimal.config = null; },
			'INVALID_CONFIGURATION',
			'Invalid configuration: object expected'
		);
		expectDecimalError(
			() => { Decimal.config = { precision: 0 }; },
			'INVALID_CONFIGURATION',
			'Invalid configuration parameter: precision: 0'
		);
		expectDecimalError(
			() => { Decimal.config = { precision: 7, typo: true }; },
			'UNKNOWN_CONFIGURATION_KEY',
			'Unknown configuration parameter: typo'
		);

		expect(Decimal.config.precision).toBe(20);
	});

	it('rejects unknown symbol configuration keys consistently', () => {
		const key = Symbol('typo');

		expectDecimalError(
			() => { Decimal.config = { [key]: true }; },
			'UNKNOWN_CONFIGURATION_KEY',
			'Unknown configuration parameter: Symbol(typo)'
		);
	});

	it('assigns stable codes to configured limit errors', () => {
		const SmallExpansion = Decimal.clone({ maxPrefixedDigits: 2 });
		const ExcessivePrecision = Decimal.clone({ precision: 1020 });

		expectDecimalError(
			() => new SmallExpansion('0x1p10'),
			'PREFIXED_EXPANSION_LIMIT_EXCEEDED',
			'Prefixed number expansion limit exceeded: 2'
		);
		expectDecimalError(
			() => new ExcessivePrecision(1).cos(),
			'PRECISION_LIMIT_EXCEEDED',
			'Precision limit exceeded'
		);
	});
});
