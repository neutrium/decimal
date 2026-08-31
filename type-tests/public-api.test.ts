import {
	Decimal,
	DecimalError,
	type DecimalConfig,
	type DecimalConfigInput,
	type DecimalConstructor,
	type DecimalErrorCode,
	type DecimalFraction,
	type DecimalLimits,
	type DecimalValue,
	type ModuloMode,
	type RoundingMode
} from '@neutrium/decimal';

const input: DecimalValue = '1.25';
const bigintInput: DecimalValue = 9007199254740993n;
const value = new Decimal(input);
const coercedValue: string | number = value[Symbol.toPrimitive]('default');
const primitiveValue: string = value.valueOf();
const jsonValue: string = value.toJSON();
const decimalError = new DecimalError('INVALID_ARGUMENT', 'Invalid argument: value');
const errorCode: DecimalErrorCode = decimalError.code;
const rounding: RoundingMode = 'half-even';
const modulo: ModuloMode = 'euclid';
const configInput: DecimalConfigInput = { rounding, modulo };
const trailingZeroes: boolean = true;

Decimal.config = { precision: 24, maxPrefixedDigits: 1_000_000, maxOutputDigits: 1_000_000, rounding, modulo };
Decimal.config = { precision: 30, rounding: 'down' };
Decimal.config = configInput;

// @ts-expect-error Constructor settings are mutated only through Decimal.config.
Decimal.precision = 30;
// @ts-expect-error LN10 remains an implementation constant rather than public API.
Decimal.LN10;

const config: Readonly<DecimalConfig> = Decimal.config;
const limits: DecimalLimits = Decimal.limits;
const rounded: Decimal = value.add(2).mul('3').toDP(2, 'half-up');
const nearestInteger: Decimal = value.toNearest();
const precision: number = rounded.precision(trailingZeroes);
const fraction: DecimalFraction = rounded.toFraction(100);
const minimum: Decimal = Decimal.min(value, input, 2, new Decimal(3), -4);
const maximum: Decimal = Decimal.max(value, 1, '4', 3);
const [numerator, denominator] = fraction;
const maybeDenominator: Decimal | undefined = denominator;
// @ts-expect-error Fraction tuples are immutable at runtime and in the public type.
fraction[0] = value;

void config;
void limits;
void precision;
void nearestInteger;
void minimum;
void maximum;
void numerator;
void maybeDenominator;
void bigintInput;
void coercedValue;
void primitiveValue;
void jsonValue;
void decimalError;
void errorCode;

class Money extends Decimal {
	declare private currencyBrand: void;
	constructor(value: DecimalValue) {
		super(value);
	}
}

const money: Decimal = new Money(10).add(5).sqrt().toSD(8);
const minimumMoney: Decimal = Money.min(10, 20, '5', 7);
const MoneyClone: DecimalConstructor = Money.clone();
const clonedMoney: Decimal = MoneyClone.PI;
// @ts-expect-error Cloned constructors do not expose the internal LN10 constant.
MoneyClone.LN10;
const angle: Decimal = MoneyClone.atan2(1, 1);
const subclassAngle: Decimal = Money.atan2(1, 1);

// @ts-expect-error Calculation results do not retain arbitrary subclass types.
const invalidMoneyResult: Money = new Money(10).add(5);

void money;
void minimumMoney;
void clonedMoney;
void angle;
void subclassAngle;
void invalidMoneyResult;

// @ts-expect-error Invalid rounding modes are rejected by the public API.
Decimal.config = { rounding: 'bankers' };
// @ts-expect-error Invalid modulo modes are rejected by the public API.
Decimal.config = { modulo: 'javascript' };
// @ts-expect-error Decimal configuration snapshots are readonly.
Decimal.config.precision = 10;
// @ts-expect-error Arbitrary numbers are not valid trailing-zero flags.
value.precision(2);
// @ts-expect-error Numeric trailing-zero compatibility flags are not accepted.
value.precision(0);
// @ts-expect-error Numeric trailing-zero compatibility flags are not accepted.
value.precision(1);
// @ts-expect-error Public rounding configuration requires a mode name.
Decimal.config = { rounding: 6 };
// @ts-expect-error Public rounding configuration requires a mode name.
Decimal.config = { rounding: 4 };
// @ts-expect-error Public modulo configuration requires a mode name.
Decimal.config = { modulo: 9 };
// @ts-expect-error Clone configuration also requires mode names.
Decimal.clone({ rounding: 1 });
// @ts-expect-error Clone configuration also requires mode names.
Decimal.clone({ modulo: 1 });
// @ts-expect-error Cloned constructor settings are also mutated only through config.
MoneyClone.rounding = 'down';
// @ts-expect-error Cloned constructor configuration requires mode names.
MoneyClone.config = { modulo: 9 };
// @ts-expect-error Method rounding arguments require mode names.
value.toDP(2, 4);
// @ts-expect-error Method rounding arguments require mode names.
value.toSD(2, 4);
// @ts-expect-error Method rounding arguments require mode names.
value.toFixed(2, 4);
// @ts-expect-error Method rounding arguments require mode names.
value.toPrecision(2, 4);
// @ts-expect-error Method rounding arguments require mode names.
value.toExponential(2, 4);
// @ts-expect-error Method rounding arguments require mode names.
value.toNearest(2, 4);
// @ts-expect-error Unsupported constructor input.
new Decimal({ value: 1 });
// @ts-expect-error Minimum requires at least one value.
Decimal.min();
// @ts-expect-error Collections must be spread by the caller.
Decimal.max([1, 2]);
// @ts-expect-error Internal representation is not part of the package declaration.
value.d;
// @ts-expect-error Public limits are immutable.
Decimal.limits.maxDigits = 10;
// @ts-expect-error Coefficient-storage parameters are not public API.
Decimal.params;
