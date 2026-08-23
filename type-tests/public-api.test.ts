import {
	Decimal,
	type DecimalConfig,
	type DecimalConstructor,
	type DecimalFraction,
	type DecimalParameters,
	type DecimalValue,
	type DecimalValueCollection,
	type ModuloMode,
	type PrecisionTrailingZeros,
	type RoundingMode
} from '@neutrium/decimal';

const input: DecimalValue = '1.25';
const collection: DecimalValueCollection = [input, 2, new Decimal(3)] as const;
const value = new Decimal(input);
const rounding: RoundingMode = 'half-even';
const modulo: ModuloMode = 'euclid';
const trailingZeroes: PrecisionTrailingZeros = 1;

Decimal.config = { precision: 24, rounding, modulo };
Decimal.precision = 30;
Decimal.rounding = 'down';

const config: Readonly<DecimalConfig> = Decimal.config;
const parameters: DecimalParameters = Decimal.params;
const rounded: Decimal = value.add(2).mul('3').toDP(2, 'half-up');
const precision: number = rounded.precision(trailingZeroes);
const fraction: DecimalFraction = rounded.toFraction(100);
const minimum: Decimal = value.min(collection, -4);
const maximum: Decimal = value.max([1, '4'] as const, 3);
const [numerator, denominator] = fraction;
const maybeDenominator: Decimal | undefined = denominator;

void config;
void parameters;
void precision;
void minimum;
void maximum;
void numerator;
void maybeDenominator;

class Money extends Decimal {
	declare private currencyBrand: void;
}

const money: Money = new Money(10).add(5).sqrt().toSD(8);
const minimumMoney: Money = new Money(10).min([20, '5'] as const, 7);
const MoneyClone: DecimalConstructor<Money> = Money.clone();
const clonedMoney: Money = MoneyClone.PI;
const angle: Money = MoneyClone.atan2(1, 1);
const subclassAngle: Money = Money.atan2(1, 1);

void money;
void minimumMoney;
void clonedMoney;
void angle;
void subclassAngle;

// @ts-expect-error Invalid rounding modes are rejected by the public API.
Decimal.rounding = 'bankers';
// @ts-expect-error Invalid modulo modes are rejected by the public API.
Decimal.config = { modulo: 'javascript' };
// @ts-expect-error Decimal configuration snapshots are readonly.
Decimal.config.precision = 10;
// @ts-expect-error Arbitrary numbers are not valid trailing-zero flags.
value.precision(2);
// @ts-expect-error Unsupported constructor input.
new Decimal({ value: 1 });
// @ts-expect-error Collections are flattened by one level only.
value.min([[1, 2]]);
// @ts-expect-error Internal representation is not part of the package declaration.
value.d;
// @ts-expect-error Public numeric parameters are immutable.
Decimal.params.BASE = 10;
