# @neutrium/decimal

Arbitrary-precision decimal arithmetic for JavaScript and TypeScript.

`@neutrium/decimal` provides immutable-style decimal calculations, configurable precision and
rounding, scientific functions, comparisons, and formatting without the binary floating-point
surprises of JavaScript numbers.

```js
import { Decimal } from '@neutrium/decimal';

const result = new Decimal('0.1').add('0.2');

result.toString(); // '0.3'
0.1 + 0.2;         // 0.30000000000000004
```

## Requirements

- Node.js 20.19 or newer
- An ESM project, or a build tool that consumes ESM
- TypeScript 5.9 or newer when using the bundled declarations

## Installation

```sh
npm install @neutrium/decimal
```

The package includes JavaScript source maps, TypeScript declarations, and declaration maps.

## Quick start

```js
import { Decimal } from '@neutrium/decimal';

Decimal.config = {
  precision: 30,
  rounding: 'half-even'
};

const unitPrice = new Decimal('19.995');
const total = unitPrice.mul(3).toDP(2);

total.toFixed(2); // '59.98'
```

Pass decimal values as strings when their exact value cannot be represented by a JavaScript
`number`, particularly for long values and decimal fractions.

For browser applications, import the package through an ESM-aware bundler such as
[Vite](https://vite.dev/) or [webpack](https://webpack.js.org/).

## Creating decimals

Create a decimal with `new Decimal(value)`, where `value` is a `string`, `number`, or another
`Decimal`.

```js
new Decimal(42).toString();                         // '42'
new Decimal('5032485723458348569331745.334').toString();
new Decimal('4.321e+4').toString();                 // '43210'
new Decimal('.5').toString();                       // '0.5'
new Decimal(Infinity).toString();                   // 'Infinity'
new Decimal(NaN).toString();                        // 'NaN'
```

Decimal strings may use fixed-point or exponential notation. Numeric separators are accepted
between digits, and prefixed binary, octal, and hexadecimal strings are also supported. A `p`
exponent on a prefixed value is a power of two.

```js
new Decimal('0.046_875').toString(); // '0.046875'
new Decimal('0b101.1').toString();   // '5.5'
new Decimal('0o10').toString();      // '8'
new Decimal('0xff.8').toString();    // '255.5'
new Decimal('0x1.8p-5').toString();  // '0.046875'
```

Invalid values, including `bigint`, objects other than `Decimal`, and malformed numeric strings,
throw an error.

## Configuration

Configuration is scoped to a Decimal constructor. Assign any subset of the following properties
to `Decimal.config`; unspecified properties keep their current values.

| Property | Type | Valid values | Default |
| --- | --- | --- | --- |
| `precision` | integer | `1` to `1e9` | `20` |
| `rounding` | `RoundingMode` | See [rounding modes](#rounding-modes) | `'half-up'` |
| `modulo` | `ModuloMode` | See [modulo modes](#modulo-modes) | `'down'` |
| `toExpNeg` | integer | `-9e15` to `0` | `-7` |
| `toExpPos` | integer | `0` to `9e15` | `21` |
| `minE` | integer | `-9e15` to `0` | `-9e15` |
| `maxE` | integer | `0` to `9e15` | `9e15` |

```js
Decimal.config = {
  precision: 40,
  rounding: 'half-even',
  modulo: 'euclid',
  toExpNeg: -9,
  toExpPos: 30,
  minE: -1e6,
  maxE: 1e6
};
```

`Decimal.config` returns a readonly snapshot. Assign a partial object to change configuration;
mutating the returned object does not update the constructor. `precision` and `rounding` also have
direct accessors:

```js
Decimal.precision = 24;
Decimal.rounding = 'down';
```

Calculation results are rounded to the configured number of significant digits where the
operation requires rounding. `minE` and `maxE` control underflow to zero and overflow to Infinity.
`toExpNeg` and `toExpPos` control when `toString()` uses exponential notation.

### Rounding modes

| Value | Behavior |
| --- | --- |
| `'up'` | Away from zero |
| `'down'` | Toward zero |
| `'ceil'` | Toward positive Infinity |
| `'floor'` | Toward negative Infinity |
| `'half-up'` | To nearest; ties away from zero |
| `'half-down'` | To nearest; ties toward zero |
| `'half-even'` | To nearest; ties toward the even neighbor |
| `'half-ceil'` | To nearest; ties toward positive Infinity |
| `'half-floor'` | To nearest; ties toward negative Infinity |

Methods that accept an optional rounding mode use the constructor's configured mode when it is
omitted.

### Modulo modes

The modulo mode determines how the quotient is rounded before calculating
`remainder = dividend - divisor * quotient`. It accepts every `RoundingMode` plus `'euclid'`.
Common choices are:

| Value | Remainder behavior |
| --- | --- |
| `'down'` | Same sign as the dividend; equivalent to JavaScript `%` |
| `'floor'` | Same sign as the divisor; equivalent to Python `%` |
| `'half-even'` | IEEE 754 remainder |
| `'euclid'` | Always non-negative |

### Independent constructors

Use `Decimal.clone()` to create a constructor with isolated configuration. A clone starts with the
calling constructor's current settings and then applies the supplied overrides.

```js
const Money = Decimal.clone({
  precision: 20,
  rounding: 'half-even'
});

const Measurements = Decimal.clone({ precision: 50 });

Money.precision = 12;

Money.precision;        // 12
Measurements.precision; // 50
Decimal.precision;      // unchanged
```

Decimal-returning operations, `Decimal.PI`, `Decimal.LN10`, `Decimal.atan2()`, and `toFraction()`
preserve the runtime constructor. This also applies to subclasses.

## API

The `DecimalValue` type used below is `string | number | Decimal`. Unless noted otherwise,
methods that return a Decimal return the same runtime type as the receiver and do not change the
receiver.

### Static API

| Member | Description |
| --- | --- |
| `Decimal.config` | Get a readonly configuration snapshot or assign partial configuration. |
| `Decimal.precision` | Get or set the calculation precision. |
| `Decimal.rounding` | Get or set the calculation rounding mode. |
| `Decimal.clone(config?)` | Create an independently configured Decimal constructor. |
| `Decimal.atan2(y, x)` | Return the angle in radians from the positive x-axis to `(x, y)`. |
| `Decimal.PI` | Pi as a Decimal from the receiving constructor. |
| `Decimal.LN10` | The natural logarithm of 10 as a Decimal from the receiving constructor. |
| `Decimal.params` | Readonly storage and numerical limits described by `DecimalParameters`. |

### Inspection

| Method | Returns | Description |
| --- | --- | --- |
| `dp()` | `number` | Number of decimal places, or `NaN` for a non-finite value. |
| `precision(includeTrailingZeros?)` | `number` | Number of significant digits. Pass `true` or `1` to count trailing integer zeroes. |
| `sign()` | `number` | `-1`, `-0`, `0`, `1`, or `NaN`, preserving the sign of zero. |

```js
new Decimal('12.3400').dp();         // 2
new Decimal('1000').precision();     // 1
new Decimal('1000').precision(true); // 4
Object.is(new Decimal('-0').sign(), -0); // true
```

### Arithmetic and powers

| Method | Description |
| --- | --- |
| `add(value)` | Add `value`. |
| `sub(value)` | Subtract `value`. |
| `mul(value)` | Multiply by `value`. |
| `div(value)` | Divide by `value`. |
| `divToInt(value)` | Divide by `value` and truncate the quotient to an integer. |
| `mod(value)` | Return the remainder using the configured modulo mode. |
| `abs()` | Return the absolute value. |
| `neg()` | Invert the sign. |
| `shift(places)` | Shift the decimal point by a safe integer number of places. |
| `pow(value)` | Raise the value to a power. |
| `sqrt()` | Return the square root. |
| `cbrt()` | Return the cube root. |

```js
new Decimal('0.3').sub('0.1').toString(); // '0.2'
new Decimal('0.6').mul(3).toString();     // '1.8'
new Decimal(5).divToInt(3).toString();    // '1'
new Decimal('123.45').shift(-3).toString(); // '0.12345'
new Decimal(16).sqrt().toString();        // '4'
```

`shift()` changes the base-10 exponent without rounding the significand, but the configured
underflow and overflow limits still apply. It throws if `places` is not a safe integer.

### Exponential and trigonometric methods

All angles are in radians.

| Method | Description |
| --- | --- |
| `exp()` | Return `e` raised to this value. |
| `ln()` | Return the natural logarithm. |
| `log(base)` | Return the logarithm in the supplied base. |
| `sin()`, `cos()`, `tan()` | Trigonometric functions. |
| `asin()`, `acos()`, `atan()` | Inverse trigonometric functions. |
| `sinh()`, `cosh()`, `tanh()` | Hyperbolic functions. |
| `asinh()`, `acosh()`, `atanh()` | Inverse hyperbolic functions. |

```js
new Decimal(1).exp().toString();         // '2.7182818284590452354'
new Decimal(1000).log(10).toString();    // '3'
new Decimal('0.5').sin().toString();     // '0.47942553860420300027'
Decimal.atan2(1, 1).toString();          // '0.78539816339744830962'
```

The bundled `PI` and `LN10` constants contain about 1,000 decimal places. That limits the maximum
useful precision of trigonometric and logarithmic calculations.

### Minimum, maximum, and comparison

`min()` and `max()` include the receiver. Each argument may be a `DecimalValue` or a readonly,
one-level array of values.

| Method | Returns | Description |
| --- | --- | --- |
| `min(...values)` | `Decimal` | Minimum of the receiver and supplied values. |
| `max(...values)` | `Decimal` | Maximum of the receiver and supplied values. |
| `cmp(value)` | `number` | `-1`, `0`, `1`, or `NaN`. |
| `eq(value)` | `boolean` | Equal to. |
| `gt(value)` | `boolean` | Greater than. |
| `gte(value)` | `boolean` | Greater than or equal to. |
| `lt(value)` | `boolean` | Less than. |
| `lte(value)` | `boolean` | Less than or equal to. |

```js
new Decimal(6).min(-1, 64).toString();    // '-1'
new Decimal(6).max([-1, 64]).toString();  // '64'
new Decimal('0.3').eq(new Decimal('0.1').add('0.2')); // true
```

### Predicates

| Method | Description |
| --- | --- |
| `isFinite()` | Whether the value is finite. |
| `isInt()` | Whether the value is an integer. |
| `isNaN()` | Whether the value is NaN. |
| `isNeg()` | Whether the value is negative, including negative zero. |
| `isPos()` | Whether the value is positive, including positive zero. |
| `isZero()` | Whether the value is positive or negative zero. |
| `isOdd()` | Whether the value is an odd integer. |
| `isEven()` | Whether the value is an even integer. |

### Rounding

| Method | Description |
| --- | --- |
| `ceil()` | Round toward positive Infinity. |
| `floor()` | Round toward negative Infinity. |
| `round()` | Round to an integer using the configured rounding mode. |
| `trunc()` | Truncate to an integer toward zero. |
| `toNearest(value, rounding?)` | Round to the nearest multiple of `value`. |

```js
new Decimal('1.3').ceil().toString();          // '2'
new Decimal('-1.3').floor().toString();        // '-2'
new Decimal('123.456').trunc().toString();     // '123'
new Decimal('9.499').toNearest('0.5', 'down').toString(); // '9.5'
```

### Conversion and formatting

| Method | Returns | Description |
| --- | --- | --- |
| `toDP(dp?, rounding?)` | `Decimal` | Round to at most `dp` decimal places. With no `dp`, retain the value. |
| `toSD(sd?, rounding?)` | `Decimal` | Round to at most `sd` significant digits. Defaults to configured precision. |
| `toExponential(dp?, rounding?)` | `string` | Exponential notation with optional decimal-place count. |
| `toFixed(dp?, rounding?)` | `string` | Fixed-point notation with optional decimal-place count. |
| `toPrecision(sd?, rounding?)` | `string` | Precision notation with optional significant-digit count. |
| `toFraction(maxDenominator?)` | `[Decimal, Decimal] \| [Decimal]` | Numerator and denominator, or a one-item tuple for a non-finite value. |
| `toNumber()` | `number` | Convert to a JavaScript number, preserving negative zero. |
| `toString()` | `string` | Canonical string using the configured exponential thresholds. |
| `toValue()` | `string` | Primitive string representation that preserves negative zero. |

```js
const value = new Decimal('12.34567');

value.toDP(2).toString();            // '12.35'
value.toSD(4, 'down').toString();    // '12.34'
value.toExponential(2);              // '1.23e+1'
value.toFixed(3);                    // '12.346'
value.toPrecision(4);                // '12.35'

new Decimal('1.75').toFraction().map(String); // ['7', '4']
new Decimal('-0').toString();                 // '0'
new Decimal('-0').toValue();                  // '-0'
Object.is(new Decimal('-0').toNumber(), -0);  // true
```

The optional `dp` arguments accept integers from `0` through `1e9`. Optional `sd` arguments accept
integers from `1` through `1e9`. `toFraction(maxDenominator)` requires a positive integer maximum.

## TypeScript

The package exports these public types:

```ts
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
```

Decimal-returning instance methods use TypeScript's polymorphic `this` type, so subclasses retain
their type through calculations. `Decimal.clone()` returns a `DecimalConstructor`.

```ts
class Money extends Decimal {
  declare private readonly moneyBrand: void;
}

const amount: Money = new Money('10.00').mul(3).toDP(2);
const MoneyClone: DecimalConstructor<Money> = Money.clone({ precision: 24 });
const angle: Money = MoneyClone.atan2(1, 1);
```

The internal coefficient, exponent, sign, and calculation-state fields are not part of the public
declaration contract.

## Development

```sh
npm test          # Run the Vitest suite
npm run typecheck # Check the TypeScript source
npm run verify    # Run all source, declaration, package, and runtime checks
```

## License

[MIT](LICENSE)
