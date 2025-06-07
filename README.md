# @neutrium/decimal

An engineering math library by neutrium


## Getting Started

### Node

First add the `@neutrium/decimal` package to your project:

	npm install @neutrium/decimal --save

Then import Decimal where you want to use it:

	import { Decimal } from '@neutrium/decimal'

[Configure](#configuration) the Decimal library as required:

	Decimal.config = Decimal.config = {
		precision: 20,
		rounding: 4
	};

[Create](#creation) a decimal:

	let x = new Decimal(1.61803398875);

Then put [it to work](#usage):

	let y = x.mul(10);

### Browsers

To use this library in a browser environment you will need to use a bundler like [vite](https://vite.dev) or [webpack](https://webpack.js.org) to convert it to a web bunble and expose the Decimal object.

## Creation

Decimals can be created using the construction `Decimal(value: number|string|Decimal) : Decimal` with `value` being any of the following:

- Values stored in a number primitive type
- A legitimate integer or float stored in a string. This may use exponential or fixed point notation
- A Decimal object
- Special numerical values ±[Infinity](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Infinity), or [NaN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/NaN)
- Binary, hexadecimal or octal values if the appropriate prefix is included (0x or 0X for hexadecimal, 0b or 0B for binary, and 0o or 0O for octal).

The number of digits of value is not limited, except by JavaScript's maximum array size and, in practice, the processing time required.

The allowable range of value is defined in terms of a [maximum exponent](#maxe) and a [minimum exponent](#mine).

In exponential notation, e or E defines a power-of-ten exponent for decimal values, and p or P defines a power-of-two exponent for non-decimal values, i.e. binary, hexadecimal or octal.

Throws an Error on an invalid `value` parameter.

	x = new Decimal(9)										// '9'
	y = new Decimal(x)										// '9'

	new Decimal('5032485723458348569331745.33434346346912144534543')
	new Decimal('4.321e+4')									// '43210'
	new Decimal('-735.0918e-430')							// '-7.350918e-428'
	new Decimal('5.6700000')								// '5.67'
	new Decimal(Infinity)									// 'Infinity'
	new Decimal(NaN)										// 'NaN'
	new Decimal('.5')										// '0.5'
	new Decimal('-0b10110100.1')							// '-180.5'
	new Decimal('0xff.8')									// '255.5'

	new Decimal(0.046875)									// '0.046875'
	new Decimal('0.046875000000')							// '0.046875'
	new Decimal('0.046_875_000_000')						// '0.046875'

	new Decimal(4.6875e-2)									// '0.046875'
	new Decimal('468.75e-4')								// '0.046875'

	new Decimal('0b0.000011')								// '0.046875'
	new Decimal('0o0.03')									// '0.046875'
	new Decimal('0x0.0c') 									// '0.046875'

	new Decimal('0b1.1p-5')									// '0.046875'
	new Decimal('0o1.4p-5')									// '0.046875'
	new Decimal('0x1.8p-5')									// '0.046875'


## Configuration

### Overview

Decimal has several configuration parameters which can be set to change the behaviour of its methods. These parameters are sumarised in the table below along with their acceptable ranges.


| Parameter | Type 		| Range				| Default 			|
| --------- | --------- | ----------------- | ----------------- |
| precision	| Integer	| 1 - 1 x 10^9		| 20				|
| rounding	| Integer	| 0 - 8				| 4 (i.e. ROUND_HALF_UP)	|
| minE		| Integer	| -9 x 10^15 - 0	| -9 x 10^15		|
| maxE		| Integer	| 0 - 9 x 10^15		| 9 x 10^15			|
| toExpNeg	| Integer	| -9 x 10^15 - 0	| -7				|
| toExpPos	| Integer	| 0 - 9 x 10^15		| 20				|
| modulo	| Integer	| 0 - 9				| 1 (i.e. ROUND_DOWN)	|

One or more configuration parameters can be set through the config setter as shown below.

	Decimal.config = {
		precision: 20,
		rounding: 4,
		toExpNeg: -7,
		toExpPos: 21,
		minE: -9e15,
		maxE: 9e15
	};

Addtionally, for simplicity you get set and get the `precision` and `rounding` parameters directly as follows:

	Decimal.precision = 20;
	Decimal.rounding = 4;

Each configuration parameter is described in the subsequent sections.

### precision

The maximum number of significant digits of the result of an operation.

All functions which return a Decimal will round the return value to `precision` significant digits except Decimal, absoluteValue, ceil, floor, negated, round, toDecimalPlaces, toNearest and truncated.

	Decimal.config = { precision: 5 }
	Decimal.precision										// 5

### rounding

The default rounding mode used when rounding the result of an operation to `precision` significant digits.

The rounding modes are available as enumerated properties of the constructor.

	Decimal.config = { rounding: Decimal.ROUND_UP }
	Decimal.config = { rounding: 0 } 						// equivalent
	Decimal.rounding										// 0

The enumerated rounding modes are stored as properties of the Decimal constructor.

Rounding modes 0 to 6 (inclusive) are the same as those of Java's BigDecimal class.

| Property			| Value	| Description |
| ----------------- | :---: | ----------- |
| ROUND_UP			| 0		| Rounds away from zero |
| ROUND_DOWN		| 1		| Rounds towards zero |
| ROUND_CEIL		| 2		| Rounds towards Infinity |
| ROUND_FLOOR		| 3		| Rounds towards -Infinity |
| ROUND_HALF_UP		| 4		| Rounds towards nearest neighbour. If equidistant, rounds away from zero |
| ROUND_HALF_DOWN	| 5		| Rounds towards nearest neighbour. If equidistant, rounds towards zero |
| ROUND_HALF_EVEN	| 6		| Rounds towards nearest neighbour. If equidistant, rounds towards even neighbour |
| ROUND_HALF_CEIL	| 7		| Rounds towards nearest neighbour. If equidistant, rounds towards Infinity |
| ROUND_HALF_FLOOR	| 8		| Rounds towards nearest neighbour. If equidistant, rounds towards -Infinity |
| EUCLID			| 9		| Not a rounding mode, see modulo |

### minE

The negative exponent limit, i.e. the exponent value below which underflow to zero occurs.

If the Decimal to be returned by a calculation would have an exponent lower than minE then the value of that Decimal becomes zero.

	Decimal.config = { minE: -500 }
	Decimal.config.minE										// -500
	new Decimal('1e-500')									// '1e-500'
	new Decimal('9.9e-501')									// '0'

	Decimal.config = { minE: -3 }
	new Decimal(0.001)										// '0.01' e is -3
	new Decimal(0.0001)										// '0'    e is -4


JavaScript numbers underflow to zero for exponents below -324. The smallest possible magnitude of a non-zero Decimal is 1e-9000000000000000

### maxE

The positive exponent limit, i.e. the exponent value above which overflow to Infinity occurs.

If the Decimal to be returned by a calculation would have an exponent higher than maxE then the value of that Decimal becomes Infinity.

	Decimal.config = { maxE: 500 }
	Decimal.config.maxE										// 500
	new Decimal('9.999e500')								// '9.999e+500'
	new Decimal('1e501')									// 'Infinity'

	Decimal.config = { maxE: 4 }
	new Decimal(99999)										// '99999' e is 4
	new Decimal(100000)										// 'Infinity'

JavaScript numbers overflow to Infinity for exponents above 308. The largest possible magnitude of a finite Decimal is 9.999...e+9000000000000000

### toExpNeg

The negative exponent value at and below which toString returns exponential notation.

	Decimal.config = { toExpNeg: -7 }
	Decimal.config.toExpNeg									// -7
	new Decimal(0.00000123)									// '0.00000123'  e is -6
	new Decimal(0.000000123)								// '1.23e-7'

	Decimal.config = { toExpNeg: 0 }						// Always returns exponential notation

JavaScript numbers use exponential notation for negative exponents of -7 and below.

Regardless of the value of toExpNeg, the toFixed method will always return a value in normal notation and the toExponential method will always return a value in exponential form.

### toExpPos

The positive exponent value at and above which toString returns exponential notation.

	Decimal.config = { toExpPos: 2 }
	Decimal.config.toExpPos									// 2
	new Decimal(12.3)										// '12.3' e is 1
	new Decimal(123)										// '1.23e+2'

	Decimal.config = { toExpPos: 0 }						// Always returns exponential notation

JavaScript numbers use exponential notation for positive exponents of 20 and above.

Regardless of the value of toExpPos, the toFixed method will always return a value in normal notation and the toExponential method will always return a value in exponential form.

### modulo

The modulo mode used when calculating the modulus: a mod n.

The quotient, q = a / n, is calculated according to the rounding mode that corresponds to the chosen modulo mode.

The remainder, r, is calculated as: r = a - n * q.

The modes that are most commonly used for the modulus/remainder operation are shown in the following table. Although the other rounding modes can be used, they may not give useful results.

| Property			|	Value	|	Description	|
| ----------------- | :-------: | ------------- |
| ROUND_UP			| 0			| The remainder is positive if the dividend is negative, else is negative  |
| ROUND_DOWN		| 1			| The remainder has the same sign as the dividend. This uses truncating division and matches the behaviour of JavaScript's remainder operator %. |
| ROUND_FLOOR		| 3			| The remainder has the same sign as the divisor. (This matches Python's % operator) |
| ROUND_HALF_EVEN	| 6			| The IEEE 754 remainder function |
| EUCLID			| 9			| The remainder is always positive. Euclidian division: q = sign(x) * floor(a / abs(x)). |

The rounding/modulo modes are available as enumerated properties of the Decimal constructor:

	Decimal.config = { modulo: Decimal.EUCLID }
	Decimal.config = { modulo: 9 }							// equivalent
	Decimal.config.modulo									// 9

## Usage

### Overview

Decimal instances have several categories of methods that can be used utilised to performing calculations while maintaining precision. These categories are listed below and the invidual methods detailed in each corresponding section.

- [Arithmetic](#arithmetic)
- [Power](#power)
- [Exponential](#exponential)
- [Trigonometry](#trigonometry)
- [Relational Comparison](#relational-comparison)
- [Identiy Comparison](#identiy-comparison)
- [Rounding](#rounding)
- [Conversion](#conversion)

Unless explicitly specified as a function parameter the Decimal instance returned by each of these functions will be rounded to the significant digits specified in the `Decimal.config.precision` and rounded in accordance to the `Decimal.config.rounding`  setting.

### Arithmetic

#### .add(x: number | string | Decimal) : Decimal

Returns a new decimal whose value is the value of the subject plus x.

	// In Decimal y = '0.3'
	// Standard javascript floats 0.1 + 0.2 = 0.30000000000000004

	let x = new Decimal(0.1),
		y = x.add(0.2);

#### .sub(x: number | string | Decimal) : Decimal

Returns a new decimal whose value is the value of the subject minus x.

	// In Decimal y = '0.2'
	// Standard javascript floats 0.3 - 0.1 =  0.19999999999999998

	let x = new Decimal(0.3),
		y = x.minus(0.1)


#### .mul(x: number | string | Decimal) : Decimal

Returns a new Decimal whose value is the value of this Decimal times x.

	// In Decimal y = '1.8'
	// Standard javascript float 0.6 * 3 = 1.7999999999999998

	let x = new Decimal(0.6)
		y = x.times(3)


#### .div(x: number | string | Decimal) : Decimal

Returns a new Decimal whose value is the value of this Decimal divided by x.

	// In Decimal y = '33.09'
	// Standard javascript float 99.27 / 3 = 33.089999999999996

	let x = new Decimal(99.27)
		y = x.div(3)

#### .divToInt(x : string | number | Decimal) : Decimal

Return a new Decimal whose value is the integer part of dividing this Decimal by x.

	// In Decimal y = '1'

	let x = new Decimal(5),
		y = x.divToInt(3)


#### .abs() : boolean

Returns a new Decimal whose value is the absolute value, i.e. non-negative value of the same magnitude.

The return value is not affected by the value of the precision setting.

	let x = new Decimal(-0.8),
		y = x.abs()											// '0.8'

#### .neg() : Decimal

Returns a new Decimal whose value is the value of this Decimal negated, i.e. multiplied by -1.

The return value is not affected by the value of the precision setting.

	let x = new Decimal(1.8)
	x.neg()													// '-1.8'

	let y = new Decimal(-1.3)
	y.neg()													// '1.3'

#### .mod(x : number | string | Decimal) : Decimal

Returns a new Decimal whose value is the value of this Decimal modulo x.

The value returned, and in particular its sign, is dependent on the value of the modulo config value. If it is 1 (default value), the result will have the same sign as this Decimal, and it will match that of Javascript's % operator (within the limits of double precision).

See [modulo](#modulo) for a description of the other modulo modes.

	// In Decimal y = '0.1'
	// Standard javascript floats 1 % 0.9 =  0.09999999999999998

	let x = new Decimal(1),
		y = x.mod(0.9)										// 0.1

	let y = new Decimal(8),
		z = new Decimal(-3);

	Decimal.config = { modulo : 1 }
	y.mod(z)												// '2'

	Decimal.config = { modulo : 3 }
	y.mod(z)												// '-1'


### Power

#### .pow(x : number | string | Decimal) : Decimal

Returns a new Decimal whose value is the value of this Decimal raised to the power x.

The performance of this method degrades exponentially with increasing digits. For non-integer exponents in particular, the performance of this method may not be adequate.

	// In standard javascript y = 0.7^2 =  0.48999999999999994
	y = Math.pow(0.7, 2)

	// Using Decimal y = 0.7^2 = '0.49'
	x = new Decimal(0.7)
	y = x.pow(2)

The return value will almost always be correctly rounded, i.e. rounded as if the result was first calculated to an infinite number of correct digits before rounding. If a result is incorrectly rounded the maximum error will be 1 ulp (unit in the last place).

For non-integer and larger exponents this method uses the formula

	x^y = exp(y*ln(x))

As the mathematical return values of the exp and ln functions are both non-terminating (excluding arguments of 0 or 1), the values of the Decimals returned by the functions as implemented by this library will necessarily be rounded approximations, which means that there can be no guarantee of correct rounding when they are combined in the above formula.

The return value may, depending on the rounding mode, be incorrectly rounded only if the first 15 rounding digits are 15 zeros (and there are non-zero digits following at some point), or 15 nines, or a 5 or 4 followed by 14 nines.

Therefore, assuming the first 15 rounding digits are each equally likely to be any digit, 0-9, the probability of an incorrectly rounded result is less than 1 in 250,000,000,000,000.

An example of incorrect rounding:

	// Exact value is 839756321.6408851099999999999999999999999999998969466049426031167...
	// x = '839756321.64088511'
	// the correct return value should be x = 839756321.64088510999 with rounding mode = ROUND_DOWN

	Decimal.config = { precision: 20, rounding: 1 }
	x = new Decimal(28).pow('6.166675020000903537297764507632802193308677149')

#### .sqrt() : Decimal

Returns a new Decimal whose value is the square root of this Decimal.

The return value will be correctly rounded, i.e. rounded as if the result was first calculated to an infinite number of correct digits before rounding.

This method is much faster than using the toPower method with an exponent of 0.5.

	let x = new Decimal(16)
		y = x.sqrt()										// 4


#### .cbrt() : Decimal

Returns a new Decimal whose value is the cube root of this Decimal.

The return value will be correctly rounded, i.e. rounded as if the result was first calculated to an infinite number of correct digits before rounding.

	let x = new Decimal(125),
		y = x.cbrt()										// 5

### Exponential

#### .exp() : Decimal

Returns a new Decimal whose value is the base e (Euler's number, the base of the natural logarithm) exponential of the value of this Decimal.

	let x = new Decimal(1)
	x.exp()													// '2.7182818284590452354'

The return value will be correctly rounded, i.e. rounded as if the result was first calculated to an infinite number of correct digits before rounding. (The mathematical result of the exponential function is non-terminating, unless its argument is 0).

The performance of this method degrades exponentially with increasing digits.

#### ln() : Decimal

Returns a new Decimal whose value is the natural logarithm of the value of this Decimal.

	let x = new Decimal(10)
	x.ln()													// '2.3026'

The return value will be correctly rounded, i.e. rounded as if the result was first calculated to an infinite number of correct digits before rounding. (The mathematical result of the natural logarithm function is non-terminating, unless its argument is 1).

Internally, this method is dependent on a constant whose value is the natural logarithm of 10. This LN10 variable in the source code currently has a precision of 1025 digits, meaning that this method can accurately calculate up to 1000 digits.

If more than 1000 digits is required then the precision of LN10 will need to be increased to 25 digits more than is required - though, as the time-taken by this method increases exponentially with increasing digits, it is unlikely to be viable to calculate over 1000 digits anyway.

#### .log(x: number|string|Decimal): Decimal

Returns a new Decimal whose value is the base x logarithm of the value of this Decimal.

If x is omitted, the base 10 logarithm of the value of this Decimal will be returned.

	let x = new Decimal(1000)
	x.log()													// '3'

	let y = new Decimal(256)
	y.log(2)												// '8'

The return value will almost always be correctly rounded, i.e. rounded as if the result was first calculated to an infinite number of correct digits before rounding. If a result is incorrectly rounded the maximum error will be 1 ulp (unit in the last place).

Logarithms to base 2 or 10 will always be correctly rounded.

See [pow()](#powx--number--string--decimal--decimal) for the circumstances in which this method may return an incorrectly rounded result, and see naturalLogarithm for the precision limit.

The performance of this method degrades exponentially with increasing digits.

### Trigonometry

Decimal has a range of trignometric function, which are listed below with their domain (vaild input value range) and range (expected output value range).

| Function							| Domain				| Range					|
| --------------------------------- | --------------------- | --------------------- |
| [sin()](#sin-decimal)				| [-&infin;, &infin;]	| [-1, 1]				|
| [asin()](#asin--decimal)			| [-1, 1]				| [-&pi;/2, &pi;/2]		|
| [sinh()](#sinh--decimal)			| [-&infin;, &infin;]	| [-&infin;, &infin;]	|
| [asinh()](#asinh--decimal)		| [-&infin;, &infin;]	| [-&infin;, &infin;]	|
| [cos()](#cos--decimal)			| [-&infin;, &infin;]	| [-1, 1]				|
| [acos()](#acos--decimal)			| [-1, 1]				| [0, &pi;]				|
| [cosh()](#cosh--decimal)			| [-&infin;, &infin;]	| [1, &infin;]			|
| [acosh()](#acosh--decimal)		| [1, &infin;]			| [0, &infin;]			|
| [tan()](#tan--decimal)			| [-&infin;, &infin;]	| [-&infin;, &infin;]	|
| [atan()](#atan--decimal)			| [-&infin;, &infin;]	| [-&pi;/2, &pi;/2]		|
| [tanh()](#tanh--decimal)			| [-&infin;, &infin;]	| [-1, 1]				|
| [atanh()](#atanh--decimal)		| [-1, 1]				| [-&infin;, &infin;]	|
| [Decimal.tan2()](#decimalatan2y-number--string--decimal-x-number--string--decimal--decimal)	| [-&infin;, &infin;]	| [-&pi;, &pi;]			|


The maximum precision of the trigonometric methods is dependent on the internal value of the constant pi, which is defined in the source with a precision of 1025 digits. This means the trigonometric methods can calculate up to just over 1000 digits, but the actual figure depends on the precision of the argument passed to them. To calculate the actual result precision use:

	maximum_result_precision = 1000 - argument_precision

For example, the following both work fine:

	Decimal.config = {precision: 991}
	Decimal(123456789).tan()

	Decimal.config = {precision: 9}
	new Decimal(991_digit_number).tan()

For each, the result precision plus the argument precision, i.e. 991 + 9 and 9 + 991, is less than or equal to 1000.

If greater precision is required then the value of PI will need to be extended to about 25 digits more than the precision required. The time taken by the methods will then be the limiting factor.

#### .sin(): Decimal

Returns a new Decimal whose value is the sine of the value in radians of this Decimal.

	let x = new Decimal(0.5),
		y = x.sin()											// y = '0.47942553860420300027'

#### .asin() : Decimal

Returns a new Decimal whose value is the inverse sine in radians of the value of this Decimal.

	let x = new Decimal(0.5),
		y = x.asin()										// y = '0.52359877559829887308'

#### .sinh() : Decimal

Returns a new Decimal whose value is the hyperbolic sine of the value in radians of this Decimal.


	let x = new Decimal(1),
		y = x.sinh()										// y = '1.1752011936438014569'

#### .asinh() : Decimal

Returns a new Decimal whose value is the inverse hyperbolic sine in radians of the value of this Decimal.

	let x = new Decimal(5),
		y = x.asinh()										// y = '2.3124383412727526203'

#### .cos() : Decimal

Returns a new Decimal whose value is the cosine of the value in radians of this Decimal.

	let x = new Decimal(0.25),
		y = x.cos()											// y = '0.96891242171064478414'

#### .acos() : Decimal

Returns a new Decimal whose value is the inverse cosine in radians of the value of this Decimal.

	let x = new Decimal(0),
		y = x.acos()										// y = '1.5707963267948966192'

#### .cosh() : Decimal

Returns a new Decimal whose value is the hyperbolic cosine of the value in radians of this Decimal.

	let x = new Decimal(1),
		y = x.cosh()										// y = '1.5430806348152437785'

#### .acosh() : Decimal

Returns a new Decimal whose value is the inverse hyperbolic cosine in radians of the value of this Decimal.

	let x = new Decimal(5),
		y = x.acosh()										// y = '2.2924316695611776878'

#### .tan() : Decimal

Returns a new Decimal whose value is the tangent of the value in radians of this Decimal.

	let x = new Decimal(0.5),
		y = x.tan()											// y = '0.54630248984379051326'

#### .atan() : Decimal

Returns a new Decimal whose value is the inverse tangent in radians of the value of this Decimal.

	let x = new Decimal(0.5),
		y = x.atan()										// y = '0.46364760900080611621'

#### .tanh() : Decimal

Returns a new Decimal whose value is the hyperbolic tangent of the value in radians of this Decimal.

	let x = new Decimal(1),
		y = x.tanh()										// y = '0.76159415595576488812'

#### .atanh() : Decimal

Returns a new Decimal whose value is the inverse hyperbolic tangent in radians of the value of this Decimal.


	let x = new Decimal(0.5),
		y = x.atanh()										// y = '0.5493061443340548457'


#### Decimal.atan2(y: number | string | Decimal, x: number | string | Decimal) : Decimal

A static method that returns a new Decimal whose value is the inverse tangent in radians of the quotient of y and x.

The signs of y and x are used to determine the quadrant of the result.


### Relational Comparison

#### .min((number|string|Decimal)[]) : Decimal

Returns a new Decimal whose value is the minimum of the arguments.


	let x = Decimal.min(-1, 6, 64)							// x = '-1'

#### .max((number|string|Decimal)[]) : Decimal

Returns a new Decimal whose value is the maximum of the arguments.

	let x = Decimal.min(-1, 6, 64)							// x = '64'

#### .cmp(x : string | number | Decimal) : number

Returns an integer indicating x's value relative to this Decima;

| Return value	| Condition														|
| ------------- | ------------------------------------------------------------- |
| 1				| If the value of this Decimal is greater than the value of x	|
| -1			| If the value of this Decimal is less than the value of x		|
| 0				| If this Decimal and x have the same value						|
| NaN			| If the value of either this Decimal or x is NaN				|

	let x = new Decimal(Infinity),
		y = new Decimal(5)

	x.cmp(y)												// 1
	x.cmp(x.minus(1))										// 0
	y.cmp(NaN)												// NaN


#### .eq(x : string | number | Decimal) : boolean

Returns true if the value of this Decimal equals the value of x, otherwise returns false.
As with JavaScript, NaN does not equal NaN.

	// In Javascript 0 === 1e-324 is true
	let x = new Decimal(0)
	x.equals('1e-324')										// false
	new Decimal(-0).eq(x)									// true  ( -0 === 0 )

	let y = new Decimal(NaN)
	y.eq(NaN)												// false

#### .gt(y : string | number | Decimal) : boolean

Returns true if the value of this Decimal is greater than the value of x, otherwise returns false.

	// In Javascript 0.1 > (0.3 - 0.2) is true
	let x = new Decimal(0.1)

	x.gt(Decimal(0.3).minus(0.2))							// false
	new Decimal(0).gt(x)									// false

#### .gte(y : string | number | Decimal) : boolean

Returns true if the value of this Decimal is greater than or equal to the value of x, otherwise returns false.

	// In Javascript (0.3 - 0.2) >= 0.1  is false
	let x = new Decimal(0.3).minus(0.2)

	x.gte(0.1)												// true
	new Decimal(1).gte(x)									// true

#### .lt(y : string | number | Decimal) : boolean

Returns true if the value of this Decimal is less than the value of x, otherwise returns false.

	// In Javascript (0.3 - 0.2) < 0.1  is true
	let x = new Decimal(0.3).minus(0.2)

	x.lt(0.1)												// false
	new Decimal(0).lt(x)									// true

#### .lte(y : string | number | Decimal) : boolean

Returns true if the value of this Decimal is less than or equal to the value of x, otherwise returns false.

	// In Javascript 0.1 <= (0.3 - 0.2) is false
	let x = new Decimal(0.1)

	x.lte(Decimal(0.3).minus(0.2))							// true
	new Decimal(-1).lte(x)									// true

### Identiy Comparison

#### .isFinite() : boolean

Returns true if the value of this Decimal is a finite number, otherwise returns false.
The only possible non-finite values of a Decimal are NaN, Infinity and -Infinity.

	let x = new Decimal(1)

	x.isFinite()											// true

	let y = new Decimal(Infinity)
	y.isFinite()											// false

#### .isInt() : boolean

Returns true if the value of this Decimal is a whole number, otherwise returns false.

	let x = new Decimal(1)
	x.isInt()												// true

	let y = new Decimal(123.456)
	y.isInt()												// false

#### .isNaN() : boolean

Returns true if the value of this Decimal is NaN, otherwise returns false.

	let x = new Decimal(NaN)
	x.isNaN()												// true

	let y = new Decimal('Infinity')
	y.isNaN()												// false

#### .isNeg() : boolean

Returns true if the value of this Decimal is negative, otherwise returns false.

	let x = new Decimal(-0)
	x.isNeg()												// true

	let y = new Decimal(2)
	y.isNeg()												// false

Note that zero is signed.

	new Decimal(0).valueOf()								// '0'
	new Decimal(0).isNeg()									// false
	new Decimal(0).negated().valueOf()						// '-0'
	new Decimal(0).negated().isNeg()						// true
	new Decimal(-0).isNeg()									// true

#### .isPos() : boolean

Returns true if the value of this Decimal is positive, otherwise returns false.

	let x = new Decimal(0)
	x.isPos()												// true

	let y = new Decimal(-2)
	y.isPos()												// false

#### .isZero() : boolean

Returns true if the value of this Decimal is zero or minus zero, otherwise returns false.

	let x = new Decimal(-0)
	x.isZero() && x.isNeg()									// true

	let y = new Decimal(Infinity)
	y.isZero()												// false

#### .isOdd() : boolean

Returns true if the value of this Decimal is odd, otherwise returns false.

	let x = new Decimal(3)
	x.isOdd()												// true

	let y = new Decimal(2)
	y.isOdd()												// false


#### .isEven() : boolean

Returns true if the value of this Decimal is even, otherwise returns false.

	let x = new Decimal(3)
	x.isEven()												// false

	let y = new Decimal(2)
	y.isEven()												// true

### Rounding

#### .ceil() : Decimal

Returns a new Decimal whose value is the value of this Decimal rounded to a whole number in the direction of positive Infinity.

	x = new Decimal(1.3)
	x.ceil()												// '2'
	y = new Decimal(-1.8)
	y.ceil()												// '-1'

#### .floor() : Decimal

Returns a new Decimal whose value is the value of this Decimal rounded to a whole number in the direction of negative Infinity.

	let x = new Decimal(1.8)
	x.floor()												// '1'

	let y = new Decimal(-1.3)
	y.floor()												// '-2'

#### .round() : Decimal

Returns a new Decimal whose value is the value of this Decimal rounded to a whole number using rounding mode rounding.

	Decimal.rounding = Decimal.ROUND_DOWN
	x = new Decimal(1234.5)
	x.round()												// '1234'

To emulate Math.round, set rounding to 7, i.e. ROUND_HALF_CEIL.

#### .trunc() : Decimal

Returns a new Decimal whose value is the value of this Decimal truncated to a whole number.

	x = new Decimal(123.456)
	x.truncated()											// '123'

	y = new Decimal(-12.3)
	y.trunc()												// '-12'

#### toNearest(x : number | string | Decimal, rm ?: number) : Decimal

Returns a new Decimal whose value is the nearest multiple of x in the direction of rounding mode rm, or Decimal.rounding if rm is omitted, to the value of this Decimal.

The return value will always have the same sign as this Decimal, unless either this Decimal or x is NaN, in which case the return value will be also be NaN.

The return value is not affected by the value of the precision setting.

	x = new Decimal(1.39)
	x.toNearest(0.25)										// '1.5'

	y = new Decimal(9.499)
	y.toNearest(0.5, Decimal.ROUND_UP)						// '9.5'
	y.toNearest(0.5, Decimal.ROUND_DOWN)					// '9'

### Conversion

#### toDP(dp ?: number, rm ?: number) : Decimal

Returns a new Decimal whose value is the value of this Decimal rounded to dp decimal places using rounding mode rm.

If dp is omitted, the return value will have the same value as this Decimal.

If rm is omitted, rounding mode rounding is used.

Throws an Error on an invalid dp or rm value.

	let x = new Decimal(12.34567)
	x.toDP(0)												// '12'
	x.toDecimalPlaces(1, Decimal.ROUND_UP)					// '12.4'

#### toExponential(dp ?: number, rm ?: number) : string

Returns a string representing the value of this Decimal in exponential notation rounded using rounding mode `rm` to `dp` decimal places, i.e with one digit before the decimal point and dp digits after it.

If the value of this Decimal in exponential notation has fewer than dp fraction digits, the return value will be appended with zeros accordingly.

If dp is omitted, the number of digits after the decimal point defaults to the minimum number of digits necessary to represent the value exactly.

If `rm` is omitted, rounding mode rounding is used.

Throws an Error on an invalid dp or rm value.

	x = 45.6
	y = new Decimal(x)
	x.toExponential()										// '4.56e+1'
	y.toExponential()										// '4.56e+1'
	x.toExponential(0)										// '5e+1'
	y.toExponential(0)										// '5e+1'
	x.toExponential(1)										// '4.6e+1'
	y.toExponential(1)										// '4.6e+1'
	y.toExponential(1, Decimal.ROUND_DOWN)					// '4.5e+1'
	x.toExponential(3)										// '4.560e+1'
	y.toExponential(3)										// '4.560e+1'

#### toFixed(dp ?: number, rm ?: number) : string

Returns a string representing the value of this Decimal in normal (fixed-point) notation rounded to `dp` decimal places using [rounding mode](#rounding) `rm`.

If the value of this Decimal in normal notation has fewer than `dp` fraction digits, the return value will be appended with zeros accordingly.

Unlike `Number.prototype.toFixed`, which returns exponential notation if a number is greater or equal to 1021, this method will always return normal notation.

If `dp` is omitted, the return value will be unrounded and in normal notation. This is unlike `Number.prototype.toFixed`, which returns the value to zero decimal places, but is useful when because of the current toExpNeg or toExpNeg values, toString returns exponential notation.

If rm is omitted, `Decimal.rounding` mode rounding is used.

Throws an Error on an invalid dp or rm value.

	let x = 3.456,
		y = new Decimal(x)

	x.toFixed()												// '3'
	y.toFixed()												// '3.456'
	y.toFixed(0)											// '3'
	x.toFixed(2)											// '3.46'
	y.toFixed(2)											// '3.46'
	y.toFixed(2, Decimal.ROUND_DOWN)						// '3.45'
	x.toFixed(5)											// '3.45600'
	y.toFixed(5)											// '3.45600'

#### toFraction(max_denominator : number | string | Decimal) : Decimal[2]

Returns an array of two Decimals representing the value of this Decimal as a simple fraction with an integer numerator and an integer denominator. The denominator will be a positive non-zero value less than or equal to `max_denominator`.

If a maximum denominator is omitted, the denominator will be the lowest value necessary to represent the number exactly.

Throws on an invalid `max_denominator` value.

	let x = new Decimal(1.75)
	x.toFraction()												// '7, 4'

	let pi = new Decimal('3.14159265358')
	pi.toFraction()												// '157079632679,50000000000'
	pi.toFraction(100000)										// '312689, 99532'
	pi.toFraction(10000)										// '355, 113'
	pi.toFraction(100)											// '311, 99'
	pi.toFraction(10)											// '22, 7'
	pi.toFraction(1)											// '3, 1'

#### toNumber() : number

Returns the value of this Decimal converted to a primitive number.

Type coercion (e.g. JavaScript's unary plus operator) will also work, except that a Decimal with the value minus zero will convert to positive zero.

	let x = new Decimal(456.789)
	x.toNumber()												// 456.789
	+x															// 456.789

	let y = new Decimal('45987349857634085409857349856430985')
	y.toNumber()												// 4.598734985763409e+34

	let z = new Decimal(-0)
	1 / +z														// Infinity
	1 / z.toNumber()											// -Infinity

#### toSD(sd ?: number, rm ?: number) : Decimal

Returns a new Decimal whose value is the value of this Decimal rounded to `sd` significant digits using rounding mode `rm`.

If `sd` is omitted, the return value will be rounded to [precision](#precision) significant digits.

If `rm` is omitted, [rounding mode](#rounding) rounding will be used.

Throws and Error on an invalid sd or rm value.

	Decimal.config = { precision: 5, rounding: 4 }
	let x = new Decimal(9876.54321)

	x.toSD()													// '9876.5'
	x.toSD(6)													// '9876.54'
	x.toSD(6, Decimal.ROUND_UP)									// '9876.55'
	x.toSD(2)													// '9900'
	x.toSD(2, 1)												// '9800'
	x 															// '9876.54321'

#### toPrecision(sd ?: number, rm ?: number) : string

Returns a string representing the value of this Decimal rounded to `sd` significant digits using rounding mode `rm`.

If `sd` is less than the number of digits necessary to represent the integer part of the value in normal (fixed-point) notation, then exponential notation is used.

If `sd` is omitted, the return value is the same as toString.

If `rm` is omitted, rounding mode rounding is used.

Throws an Error on an invalid sd or rm value.

	let x = 45.6,
		y = new Decimal(x)

	x.toPrecision()												// '45.6'
	y.toPrecision()												// '45.6'
	x.toPrecision(1)											// '5e+1'
	y.toPrecision(1)											// '5e+1'
	y.toPrecision(2, Decimal.ROUND_UP)							// '46'
	y.toPrecision(2, Decimal.ROUND_DOWN)						// '45'
	x.toPrecision(5)											// '45.600'
	y.toPrecision(5)											// '45.600'

#### toString() : string

Returns a string representing the value of this Decimal.

If this Decimal has a positive exponent that is equal to or greater than toExpPos, or a negative exponent equal to or less than toExpNeg, then exponential notation will be returned.

	let x = new Decimal(750000)

	x.toString()												// '750000'
	Decimal.config = { toExpPos: 5 }
	x.toString()												// '7.5e+5'

	Decimal.config = { precision: 4 }
	let y = new Decimal('1.23456789')
	y.toString()												// '1.23456789'

#### toValue() : string

As [toString](#tostring--string), but zero is signed.

	x = new Decimal(-0)
	x.valueOf()													// '-0'

