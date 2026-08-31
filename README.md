# @neutrium/decimal

Arbitrary-precision decimal arithmetic for JavaScript and TypeScript.

`@neutrium/decimal` provides configurable precision and rounding, scientific functions, comparisons, and formatting without the floating-point surprises of JavaScript numbers.

## Installation

```sh
pnpm install @neutrium/decimal
```

The package has no runtime dependencies and includes JavaScript source maps, TypeScript declarations, and declaration maps.

Applications upgrading from 1.x should follow the
[2.0 migration guide](./docs/Migration%20Guide.md).

## Quick start

```js
import { Decimal } from '@neutrium/decimal';

// Decimal
const result = new Decimal('0.1').add('0.2');

result.toString();         // '0.3'

// Native Javascript
let x = 0.1 + 0.2;
console.log(x)             // 0.30000000000000004
```

Pass decimal values as strings when their exact value cannot be represented by a JavaScript `number`, particularly for long values and decimal fractions.

For browser applications, import the package through an ESM-aware bundler such as [Vite](https://vite.dev/) or [webpack](https://webpack.js.org/). The package is marked as side-effect-free, so compatible bundlers can remove unused imports.

## Creating decimals

Create a decimal with `new Decimal(value)`, where `value` is a `string`, `number`, `bigint`, or another `Decimal`.

```js
new Decimal(42).toString();                         // '42'
new Decimal(9007199254740993n).toString();          // '9007199254740993'
new Decimal('503248.334').toString();               // '503248.334'
new Decimal('4.321e+4').toString();                 // '43210'
new Decimal('.5').toString();                       // '0.5'
new Decimal(Infinity).toString();                   // 'Infinity'
new Decimal(NaN).toString();                        // 'NaN'
```

The number of digits of value is not limited, except by JavaScript's maximum array size and, in practice, the processing time required.

Decimal strings may use fixed-point or exponential notation. Numeric separators are accepted between digits, and prefixed binary, octal, and hexadecimal strings are also supported.

In exponential notation, e or E defines a power-of-ten exponent for decimal values, and p or P defines a power-of-two exponent for non-decimal values, i.e. binary, hexadecimal or octal.

```js
new Decimal('0.046_875').toString();                // '0.046875'
new Decimal('0b101.1').toString();                  // '5.5'
new Decimal('0o10').toString();                     // '8'
new Decimal('0xff.8').toString();                   // '255.5'
new Decimal('0x1.8p-5').toString();                 // '0.046875'
new Decimal('0b1p2_0').toString();                  // '1048576'
```

Invalid values, including objects other than `Decimal` and malformed numeric strings, throw a `DecimalError`.

### Independent constructors

A `Decimal` with an isolated configuration can be created using `Decimal.clone()`. A clone starts with the calling constructor's current settings and then applies the supplied overrides.

```js
const Money = Decimal.clone({
  precision: 20,
  rounding: 'half-even'
});

const Measurements = Decimal.clone({ precision: 50 });

Money.config = { precision: 12 };

Money.config.precision;        // 12
Measurements.config.precision; // 50
Decimal.config.precision;      // 20 (unchanged default)
```

Decimal-returning operations, `Decimal.PI`, `Decimal.atan2()`, and `toFraction()` preserve constructors produced by `Decimal.clone()`.

## Configuration

You can specify several parameters to change `Decimal` behaviour.

| Property | Description | Type | Valid values | Default |
| --- | --- | --- | --- | --- |
| `precision` | The maximum number of significant digits of the result of an operation  | integer | `1` to `1e9` | `20` |
| `maxPrefixedDigits` | Limits the number of decimal coefficient digits created while converting binary, octal, or hexadecimal strings | integer | `1` to `1e9` | `1e6` |
| `maxOutputDigits` | Limits the mantissa digits produced by string-formatting operations. It includes leading and padded zeros, but excludes the sign, decimal point, and scientific exponent suffix | integer | `1` to `1e9` | `1e6` |
| `rounding` | The default rounding mode used when rounding the result of an operation to precision significant digits | `RoundingMode` | See [rounding modes](#rounding-modes) | `'half-up'` |
| `modulo` | The modulo mode used when calculating the modulus | `ModuloMode` | See [modulo modes](#modulo-modes) | `'down'` |
| `toExpNeg` | The negative exponent value at and below which toString returns exponential notation | integer | `-9e15` to `0` | `-7` |
| `toExpPos` | The positive exponent value at and above which toString returns exponential notation | integer | `0` to `9e15` | `21` |
| `minE` | The negative exponent limit, i.e. the exponent value below which underflow to zero occurs  | integer | `-9e15` to `0` | `-9e15` |
| `maxE` | The positive exponent limit, i.e. the exponent value above which overflow to Infinity occurs  | integer | `0` to `9e15` | `9e15` |

Configuration is scoped to a Decimal constructor. Assign any subset of the properties to `Decimal.config`:

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

Calculation results are rounded to the configured number of significant digits where the operation requires rounding. `minE` and `maxE` control underflow to zero and overflow to Infinity.

### Rounding modes

A rounding mode may be specified using the constructor configuration and occasionally as a function parameter. Supported rounding modes are listed below:

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

The modulo mode determines how the quotient is rounded before calculating `remainder = dividend - divisor * quotient`. It accepts every `RoundingMode` plus `'euclid'`. Common Modulo modes are listed below:

| Value         | Remainder behavior                                      |
| ------------- | ------------------------------------------------------- |
| `'down'`      | Same sign as the dividend; equivalent to JavaScript `%` |
| `'floor'`     | Same sign as the divisor; equivalent to Python `%`      |
| `'half-even'` | IEEE 754 remainder                                      |
| `'euclid'`    | Always non-negative                                     |



## API

Decimal instances have several categories of methods that can be utilised to perform calculations while maintaining precision. These categories are listed in the following sections.

The `DecimalValue` type used below is `string | number | bigint | Decimal`. Unless noted otherwise, methods return a new Decimal and do not change the receiver.

Refer to the [API references](docs/api/index.html) for comprehensive documentation of exported classes, methods, properties, and types from the package entry point and the [API Usage document](‘docs/API%20Method%20Examples.md’) for further api documentation and examples.

### Static Methods

| Member | Description |
| --- | --- |
| `Decimal.config` | Get a readonly configuration snapshot or assign partial configuration. |
| `Decimal.clone(config?)` | Create an independently configured Decimal constructor. |
| `Decimal.atan2(y, x)` | Return the angle in radians from the positive x-axis to `(x, y)`. |
| `Decimal.min(value, ...values)` | Return the minimum using the receiving constructor. |
| `Decimal.max(value, ...values)` | Return the maximum using the receiving constructor. |
| `Decimal.PI` | Pi as a Decimal from the receiving constructor. |
| `Decimal.limits` | Readonly public validation limits: `maxDigits` and `maxExponent`. |

### Inspection Methods

| Method | Returns | Description |
| --- | --- | --- |
| `dp()` | `number` | Number of decimal places, or `NaN` for a non-finite value. |
| `precision(includeTrailingZeros?)` | `number` | Number of significant digits. Pass `true` to count trailing integer zeroes; only booleans are accepted. |
| `sign()` | `number` | `-1`, `-0`, `0`, `1`, or `NaN`, preserving the sign of zero. |

### Arithmetic and powers

| Method | Description |
| --- | --- |
| `add(value)` | Add `value` to the decimal value. |
| `sub(value)` | Subtract `value` from the decimal value. |
| `mul(value)` | Multiply the decimal by `value`. |
| `div(value)` | Divide the decimal by `value`. |
| `divToInt(value)` | Divide the decimal by `value` and truncate the quotient to an integer. |
| `mod(value)` | Return the remainder after dividing the decimal by `value` using the configured modulo mode. |
| `abs()` | Return the absolute value of the decimal. |
| `neg()` | Invert the sign of the decimal. |
| `shift(places)` | Shift the decimal point by a safe integer number of places. |
| `pow(value)` | Raise the decimal to the power of value. |
| `sqrt()` | Return the square root of the decimal. |
| `cbrt()` | Return the cube root of the decimal. |

### Exponential and trigonometric methods

Note: All angles are in radians.

| Method | Description |
| --- | --- |
| `exp()` | Return `e` raised to the value of the decimal. |
| `ln()` | Return the natural logarithm of the decimal. |
| `log(base)` | Return the logarithm of the decimal in the supplied base. |
| `sin()`, `cos()`, `tan()` | Trigonometric functions. |
| `asin()`, `acos()`, `atan()` | Inverse trigonometric functions. |
| `sinh()`, `cosh()`, `tanh()` | Hyperbolic functions. |
| `asinh()`, `acosh()`, `atanh()` | Inverse hyperbolic functions. |

The internal constant for PI contains about 1,000 decimal places. That limits the maximum useful precision of trigonometric and logarithmic calculations.

### Minimum, maximum, and comparison

| Method | Returns | Description |
| --- | --- | --- |
| `Decimal.min(value, ...values)` | `Decimal` | Minimum of the supplied values. |
| `Decimal.max(value, ...values)` | `Decimal` | Maximum of the supplied values. |
| `cmp(value)` | `number` | `-1`, `0`, `1`, or `NaN`. |
| `eq(value)` | `boolean` | Equal to. |
| `gt(value)` | `boolean` | Greater than. |
| `gte(value)` | `boolean` | Greater than or equal to. |
| `lt(value)` | `boolean` | Less than. |
| `lte(value)` | `boolean` | Less than or equal to. |

`Decimal.min()` and `Decimal.max()` require at least one scalar `DecimalValue`. Arrays and other
collections must be spread by the caller.

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
| `toNearest(value?, rounding?)` | Round to the nearest multiple of the magnitude of `value`; its sign is ignored and the value defaults to `1`. |

### Conversion and formatting

| Method | Returns | Description |
| --- | --- | --- |
| `toDP(dp?, rounding?)` | `Decimal` | Round to at most `dp` decimal places. With no `dp`, return an equal new Decimal. |
| `toSD(sd?, rounding?)` | `Decimal` | Round to at most `sd` significant digits. Defaults to configured precision. |
| `toExponential(dp?, rounding?)` | `string` | Exponential notation with optional decimal-place count. |
| `toFixed(dp?, rounding?)` | `string` | Fixed-point notation with optional decimal-place count; preserves negative zero. |
| `toPrecision(sd?, rounding?)` | `string` | Precision notation with optional significant-digit count. |
| `toFraction(maxDenominator?)` | `readonly [Decimal, Decimal] \| readonly [Decimal]` | Numerator and denominator, or a one-item tuple for a non-finite value. |
| `toNumber()` | `number` | Convert to a JavaScript number, preserving negative zero. |
| `toString()` | `string` | Canonical string using the configured exponential thresholds. |
| `toValue()` | `string` | Primitive string representation that preserves negative zero. |
| `valueOf()` | `string` | Exact value used for default coercion; preserves negative zero. |
| `toJSON()` | `string` | Exact JSON string value; preserves negative zero and non-finite values. |

### Coercion and JSON

String coercion uses `toString()`, so it follows the configured exponential thresholds and renders negative zero as `'0'`. Default coercion uses `valueOf()` and therefore preserves negative zero. Numeric coercion uses `toNumber()` and can lose precision or overflow like any conversion to a JavaScript `number`.

```js
const exact = new Decimal('9007199254740993');

String(exact);                      // '9007199254740993'
exact + '';                         // '9007199254740993'
Number(exact);                      // 9007199254740992 (precision is lost)
JSON.stringify({ exact });          // '{"exact":"9007199254740993"}'
JSON.stringify(new Decimal('-0'));  // '"-0"'
JSON.stringify(new Decimal(NaN));   // '"NaN"'
```

JSON serialisation intentionally produces strings rather than JSON numbers so that finite values retain all digits and `-0`, `NaN`, and infinities retain their Decimal representation.

The `+` operator uses default coercion and therefore concatenates Decimal values as strings. Other arithmetic operators and relational operators request numeric coercion and may lose precision. Use `add`, `sub`, `mul`, `div`, and the Decimal comparison methods for exact Decimal operations.

## Errors

All input validation and configured-limit failures throw `DecimalError`, which has a property `code` describing the error:

| Code | Meaning |
| --- | --- |
| `INVALID_ARGUMENT` | A constructor or method argument is invalid. |
| `INVALID_CONFIGURATION` | A configuration value or the configuration object is invalid. |
| `UNKNOWN_CONFIGURATION_KEY` | A configuration property is not supported. |
| `PRECISION_LIMIT_EXCEEDED` | A calculation requires more digits than a built-in constant provides. |
| `PREFIXED_EXPANSION_LIMIT_EXCEEDED` | A prefixed number would exceed `maxPrefixedDigits`. |
| `OUTPUT_DIGIT_LIMIT_EXCEEDED` | String output would exceed `maxOutputDigits`. |

For example:

```js
import { Decimal, DecimalError } from '@neutrium/decimal';

try
{
    new Decimal('not-a-number');
}
catch (error)
{
    if (error instanceof DecimalError)
    {
      console.error(error.code); // 'INVALID_ARGUMENT'
    }
}
```

## TypeScript

The package exports these public types:

```ts
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
```

Decimal-returning methods return `Decimal`. `Decimal.clone()` returns a `DecimalConstructor` whose instances retain the generated constructor at runtime without executing it for intermediate values.

```ts
const Money: DecimalConstructor = Decimal.clone({ precision: 24 });
const amount: Decimal = new Money('10.00').mul(3).toDP(2);
const angle: Decimal = Money.atan2(1, 1);
```

## License

This project is licensed under the MIT License (see the [LICENSE](./LICENSE) file for details).

### What this Means

You are free to:

- Use this plugin for personal or commercial purposes
- Modify and distribute the code
- Include it in other projects

Under the following conditions:

- You must include the original license and copyright notice

### Disclaimer

This plugin is provided "as is", without warranty of any kind. Use at your own risk.
