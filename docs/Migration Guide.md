# Migration Guide

This guide covers the breaking changes when upgrading `@neutrium/decimal`. See the
[README](../README.md) for the complete current API.

## Migrating from 1.x to 2.0

Install the new major version, then address the breaking changes below:

```sh
npm install @neutrium/decimal@^2.0.0
```

### Replace numeric rounding and modulo codes

Version 2 accepts only named public modes. Numeric codes now throw a `DecimalError`, whether they
are supplied through configuration, `Decimal.clone()`, or a method argument.

```js
// 1.x
Decimal.config = { rounding: 4, modulo: 9 };
new Decimal('1.25').toFixed(1, 6);

// 2.0
Decimal.config = { rounding: 'half-up', modulo: 'euclid' };
new Decimal('1.25').toFixed(1, 'half-even');
```

| 1.x code | 2.0 name                     |
| -------: | ---------------------------- |
|      `0` | `'up'`                       |
|      `1` | `'down'`                     |
|      `2` | `'ceil'`                     |
|      `3` | `'floor'`                    |
|      `4` | `'half-up'`                  |
|      `5` | `'half-down'`                |
|      `6` | `'half-even'`                |
|      `7` | `'half-ceil'`                |
|      `8` | `'half-floor'`               |
|      `9` | `'euclid'` for `modulo` only |

### Update constructor settings through `config`

All constructor configuration now uses the same validated, atomic partial assignment. The separate
static `precision` and `rounding` properties were removed.

```js
// Before
Decimal.precision = 24;
Decimal.rounding = 'down';

// 2.0
Decimal.config = { precision: 24, rounding: 'down' };
```

Read active values from the readonly snapshot, for example `Decimal.config.precision`. The same API applies to constructors returned by `Decimal.clone()`.

### Move `min` and `max` calls to the constructor

Instance `min()` and `max()` and the `DecimalValueCollection` type were removed. Call the static methods with at least one scalar value and spread collections explicitly. Use the cloned constructor when its configuration and result type should be retained.

```js
const values = [3, 1, 7];
const current = new Decimal(5);

// 1.x
current.min(values);
current.max(...values);

// 2.0
Decimal.min(current, ...values);
Decimal.max(current, ...values);

const Money = Decimal.clone({ precision: 24 });
Money.min(new Money(5), ...values); // result is a Money clone value
```

### Use clones instead of subclass result propagation

In 1.x, Decimal-returning methods used polymorphic `this` and attempted to construct intermediate
subclass instances. In 2.0, arbitrary subclass constructors are never executed by calculations;
their results are typed as `Decimal` and use the nearest base or generated clone constructor.
`DecimalConstructor` is consequently no longer generic.

```ts
// 1.x
class Money extends Decimal {}
const amount: Money = new Money('10').mul(3);
const MoneyClone: DecimalConstructor<Money> = Money.clone();

// 2.0
const Money: DecimalConstructor = Decimal.clone({
  precision: 24,
  rounding: 'half-even'
});
const amount: Decimal = new Money('10').mul(3);
```

You can still construct an arbitrary subclass for use as an input, but subclass fields and
constructor side effects are not copied to calculation results. Prefer composition when attaching
domain data or behavior to a Decimal value.

### Calculate `ln(10)` instead of reading `Decimal.LN10`

The public `Decimal.LN10` property was removed. Calculate the value through the normal arithmetic
API so it is rounded using the receiving constructor's configuration:

```js
// 1.x
const ln10 = Decimal.LN10;

// 2.0
const ln10 = new Decimal(10).ln();

const HighPrecision = Decimal.clone({ precision: 80 });
const highPrecisionLn10 = new HighPrecision(10).ln();
```

The bundled constant remains an internal implementation detail used by logarithmic calculations.

### Update renamed and removed public types

The public limit API now exposes validation limits without revealing coefficient-storage details.

| 1.x                         | 2.0                                           |
| --------------------------- | --------------------------------------------- |
| `Decimal.params.MAX_DIGITS` | `Decimal.limits.maxDigits`                    |
| `Decimal.params.EXP_LIMIT`  | `Decimal.limits.maxExponent`                  |
| `DecimalParameters`         | `DecimalLimits`                               |
| `Partial<DecimalConfig>`    | `DecimalConfigInput`                          |
| `DecimalConstructor<T>`     | `DecimalConstructor`                          |
| `PrecisionTrailingZeros`    | `boolean`                                     |
| `DecimalValueCollection`    | A non-empty `DecimalValue` tuple or explicit first/rest split |

The storage-specific `BASE`, `LOG_BASE`, `MAX_SAFE_INTEGER`, `PI_PRECISION`, and `LN10_PRECISION`
members have no public replacements. Code should not depend on the internal coefficient layout.
`DecimalValue` now also includes `bigint`.

```ts
import {
  Decimal,
  type DecimalConfigInput,
  type DecimalLimits,
  type DecimalValue
} from '@neutrium/decimal';

const update: DecimalConfigInput = { precision: 40 };
const limits: DecimalLimits = Decimal.limits;
const values: readonly [DecimalValue, ...DecimalValue[]] = [
  1n,
  '2',
  new Decimal(3)
];

Decimal.config = update;
Decimal.max(...values);
new Decimal('1000').precision(true); // numeric 0 and 1 flags are no longer accepted
```

### Do not mutate Decimal internals or fraction tuples

Version 2 keeps the coefficient, exponent, and sign in native private state and returns frozen,
readonly tuples from `toFraction()`. The former `d`, `e`, and `s` properties are no longer exposed.
Create a new value instead of attempting to modify a representation. Copy a fraction if
application code needs a mutable array.

```js
const value = new Decimal('1.25');

// 1.x code that is no longer supported
value.d[0] = 9;

// 2.0
const next = new Decimal('9.25');
const mutableFraction = [...value.toFraction()];
```

All Decimal-returning conversions now return a distinct instance, including `toDP()` without a
decimal-place argument.

### Keep a receiver when passing methods as callbacks

Instance methods are now shared prototype methods instead of per-instance arrow functions. This
reduces allocation, but a detached method no longer retains its receiver automatically.

```js
const value = new Decimal(10);

// 1.x
const add = value.add;
add(5);

// 2.0
const add = value.add.bind(value);
add(5);
```

Methods also no longer appear as enumerable own properties on Decimal instances.

### Handle structured errors and strict configuration

Public validation failures now throw `DecimalError` with a stable `code`. Configuration rejects
unknown string and symbol keys instead of ignoring them, and updates remain atomic if validation
fails.

```js
import { Decimal, DecimalError } from '@neutrium/decimal';

try
{
    Decimal.config = { precision: 0 };
}
catch (error)
{
    if (error instanceof DecimalError)
	{
        console.error(error.code); // 'INVALID_CONFIGURATION'
    }
}
```

If code matched the old `[DecimalError]` message prefix, switch to
`error instanceof DecimalError` and `error.code`.

### Review output, parsing, coercion, and JSON boundaries

Version 2 adds two resource limits, both defaulting to one million digits:

- `maxPrefixedDigits` bounds decimal expansion while parsing binary, octal, and hexadecimal input.
- `maxOutputDigits` bounds mantissa digits produced by string formatting, coercion, and JSON.

Raise these limits explicitly on a clone if an application intentionally processes larger values.
Limit failures use `PREFIXED_EXPANSION_LIMIT_EXCEEDED` or `OUTPUT_DIGIT_LIMIT_EXCEEDED`.

```js
const Large = Decimal.clone({
  maxPrefixedDigits: 2_000_000,
  maxOutputDigits: 2_000_000
});
```

`JSON.stringify(decimal)` now emits the exact Decimal value as a JSON string, including `'-0'`,
`'NaN'`, and infinities. Consumers expecting the old object representation must read a string; use
`decimal.toNumber()` explicitly only when precision loss is acceptable. Default coercion also now
preserves negative zero through `valueOf()`.

```js
JSON.stringify(new Decimal('9007199254740993'));
// 2.0: '"9007199254740993"'
```

Finally, `toNearest()` now defaults its step to `1`, and a negative step is treated as a magnitude.
