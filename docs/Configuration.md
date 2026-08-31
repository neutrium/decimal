## Configuration

### Overview

Decimal has several configuration parameters which can be set to change the behaviour of its methods. These parameters are summarised in the table below along with their acceptable ranges.


| Parameter | Type 		| Range				| Default 			|
| --------- | --------- | ----------------- | ----------------- |
| precision	| Integer	| 1 to 1 x 10^9		| 20				|
| maxPrefixedDigits | Integer | 1 to 1 x 10^9	| 1 x 10^6		|
| maxOutputDigits | Integer | 1 to 1 x 10^9	| 1 x 10^6		|
| rounding	| RoundingMode | See [rounding](#rounding) | `'half-up'`		|
| minE		| Integer	| -9 x 10^15 to 0	| -9 x 10^15		|
| maxE		| Integer	| 0 to 9 x 10^15	| 9 x 10^15			|
| toExpNeg	| Integer	| -9 x 10^15 to 0	| -7				|
| toExpPos	| Integer	| 0 to 9 x 10^15	| 21				|
| modulo	| ModuloMode | See [modulo](#modulo) | `'down'`			|

One or more configuration parameters can be set through the config setter as shown below.

	Decimal.config = {
		precision: 20,
		maxPrefixedDigits: 1e6,
		maxOutputDigits: 1e6,
		rounding: 'half-up',
		toExpNeg: -7,
		toExpPos: 21,
		minE: -9e15,
		maxE: 9e15,
		modulo: 'down'
	};

The active `precision` and `rounding` parameters can be read from the frozen configuration snapshot:

	Decimal.config.precision								// 20
	Decimal.config.rounding								// 'half-up'

Each configuration parameter is described in the subsequent sections.

### precision

The maximum number of significant digits of the result of an operation.

Calculation results are rounded to `precision` significant digits where the operation requires rounding.

	Decimal.config = { precision: 5 }
	Decimal.config.precision							// 5

### rounding

The default rounding mode used when rounding the result of an operation to `precision` significant digits.

Rounding modes are specified using string names.

	Decimal.config = { rounding: 'up' }
	Decimal.config.rounding								// 'up'

The supported rounding modes are listed below.

| Mode				| Description |
| ----------------- | ----------- |
| `'up'`			| Rounds away from zero |
| `'down'`			| Rounds towards zero |
| `'ceil'`			| Rounds towards positive Infinity |
| `'floor'`			| Rounds towards negative Infinity |
| `'half-up'`		| Rounds towards nearest neighbour. If equidistant, rounds away from zero |
| `'half-down'`		| Rounds towards nearest neighbour. If equidistant, rounds towards zero |
| `'half-even'`		| Rounds towards nearest neighbour. If equidistant, rounds towards even neighbour |
| `'half-ceil'`		| Rounds towards nearest neighbour. If equidistant, rounds towards positive Infinity |
| `'half-floor'`	| Rounds towards nearest neighbour. If equidistant, rounds towards negative Infinity |

### maxPrefixedDigits

The maximum number of decimal coefficient digits generated while parsing a binary, octal or hexadecimal string.

	Decimal.config = { maxPrefixedDigits: 1000000 }
	Decimal.config.maxPrefixedDigits						// 1000000

### maxOutputDigits

The maximum number of mantissa digits emitted by a public string-formatting operation. This includes leading and padded zeros, but excludes the sign, decimal point and scientific exponent suffix.

	Decimal.config = { maxOutputDigits: 1000000 }
	Decimal.config.maxOutputDigits							// 1000000

### minE

The negative exponent limit, i.e. the exponent value below which underflow to zero occurs.

If the Decimal to be returned by a calculation would have an exponent lower than minE then the value of that Decimal becomes zero.

	Decimal.config = { minE: -500 }
	Decimal.config.minE								// -500
	new Decimal('1e-500').toString()						// '1e-500'
	new Decimal('9.9e-501').toString()					// '0'

	Decimal.config = { minE: -3 }
	new Decimal(0.001).toString()							// '0.001' e is -3
	new Decimal(0.0001).toString()						// '0'     e is -4


JavaScript numbers underflow to zero for exponents below -324. The smallest possible magnitude of a non-zero Decimal is 1e-9000000000000000

### maxE

The positive exponent limit, i.e. the exponent value above which overflow to Infinity occurs.

If the Decimal to be returned by a calculation would have an exponent higher than maxE then the value of that Decimal becomes Infinity.

	Decimal.config = { maxE: 500 }
	Decimal.config.maxE								// 500
	new Decimal('9.999e500').toString()					// '9.999e+500'
	new Decimal('1e501').toString()						// 'Infinity'

	Decimal.config = { maxE: 4 }
	new Decimal(99999).toString()							// '99999'   e is 4
	new Decimal(100000).toString()						// 'Infinity'

JavaScript numbers overflow to Infinity for exponents above 308. The largest possible magnitude of a finite Decimal is 9.999...e+9000000000000000

### toExpNeg

The negative exponent value at and below which toString returns exponential notation.

	Decimal.config = { toExpNeg: -7 }
	Decimal.config.toExpNeg								// -7
	new Decimal(0.00000123).toString()						// '0.00000123' e is -6
	new Decimal(0.000000123).toString()					// '1.23e-7'

	Decimal.config = { toExpNeg: 0 }						// Always returns exponential notation

JavaScript numbers use exponential notation for negative exponents of -7 and below.

Regardless of the value of toExpNeg, the toFixed method will always return a value in normal notation and the toExponential method will always return a value in exponential form.

### toExpPos

The positive exponent value at and above which toString returns exponential notation.

	Decimal.config = { toExpPos: 2 }
	Decimal.config.toExpPos								// 2
	new Decimal(12.3).toString()							// '12.3' e is 1
	new Decimal(123).toString()							// '1.23e+2'

	Decimal.config = { toExpPos: 0 }						// Always returns exponential notation

JavaScript numbers use exponential notation for positive exponents of 21 and above.

Regardless of the value of toExpPos, the toFixed method will always return a value in normal notation and the toExponential method will always return a value in exponential form.

### modulo

The modulo mode used when calculating the modulus: a mod n.

The quotient, q = a / n, is calculated according to the rounding mode that corresponds to the chosen modulo mode.

The remainder, r, is calculated as: r = a - n * q.

The modes that are most commonly used for the modulus/remainder operation are shown in the following table. Although the other rounding modes can be used, they may not give useful results.

| Mode				|	Description	|
| ----------------- | ------------- |
| `'up'`			| The remainder is positive if the dividend is negative, else is negative  |
| `'down'`			| The remainder has the same sign as the dividend. This uses truncating division and matches the behaviour of JavaScript's remainder operator %. |
| `'floor'`			| The remainder has the same sign as the divisor. (This matches Python's % operator) |
| `'half-even'`		| The IEEE 754 remainder function |
| `'euclid'`		| The remainder is always non-negative. Euclidean division: q = sign(n) * floor(a / abs(n)). |

The modulo mode is specified using its string name:

	Decimal.config = { modulo: 'euclid' }
	Decimal.config.modulo								// 'euclid'
