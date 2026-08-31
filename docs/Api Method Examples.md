# API Method Examples

### Overview

Decimal instances have several categories of methods that can be used utilised to performing calculations while maintaining precision. These categories are listed below and the invidual methods detailed in each corresponding section.

- [Arithmetic](#arithmetic)
- [Power](#power)
- [Exponential](#exponential)
- [Trigonometry](#trigonometry)
- [Relational Comparison](#relational-comparison)
- [Identiy Comparison](#identify-comparison)
- [Rounding](#rounding)
- [Conversion](#conversion)

Unless explicitly specified as a function parameter the Decimal instance returned by each of these functions will be rounded to the significant digits specified in the `Decimal.config.precision` and rounded in accordance to the `Decimal.config.rounding`  setting.

### Arithmetic

#### .add(x: DecimalValue) : Decimal

Returns a new decimal whose value is the value of the subject plus x.

	// In Decimal y = '0.3'
	// Standard javascript floats 0.1 + 0.2 = 0.30000000000000004

	let x = new Decimal(0.1),
		y = x.add(0.2);

#### .sub(x: DecimalValue) : Decimal

Returns a new decimal whose value is the value of the subject minus x.

	// In Decimal y = '0.2'
	// Standard javascript floats 0.3 - 0.1 =  0.19999999999999998

	let x = new Decimal(0.3),
		y = x.sub(0.1)


#### .mul(x: DecimalValue) : Decimal

Returns a new Decimal whose value is the value of this Decimal times x.

	// In Decimal y = '1.8'
	// Standard javascript float 0.6 * 3 = 1.7999999999999998

	let x = new Decimal(0.6)
		y = x.sub(3)


#### .div(x: DecimalValue) : Decimal

Returns a new Decimal whose value is the value of this Decimal divided by x.

	// In Decimal y = '33.09'
	// Standard javascript float 99.27 / 3 = 33.089999999999996

	let x = new Decimal(99.27)
		y = x.div(3)

#### .divToInt(x : DecimalValue) : Decimal

Return a new Decimal whose value is the integer part of dividing this Decimal by x.

	// In Decimal y = '1'

	let x = new Decimal(5),
		y = x.divToInt(3)


#### .abs() : Decimal

Returns a new Decimal whose value is the absolute value, i.e. non-negative value of the same magnitude.

The return value is not affected by the value of the precision setting.

	let x = new Decimal(-0.8),
		y = x.abs()								// '0.8'

#### .neg() : Decimal

Returns a new Decimal whose value is the value of this Decimal negated, i.e. multiplied by -1.

The return value is not affected by the value of the precision setting.

	let x = new Decimal(1.8)
	x.neg()										// '-1.8'

	let y = new Decimal(-1.3)
	y.neg()										// '1.3'

#### .mod(x : DecimalValue) : Decimal

Returns a new Decimal whose value is the value of this Decimal modulo x.

The value returned, and in particular its sign, is dependent on the value of the modulo config value. If it is 'down' (default value), the result will have the same sign as this Decimal, and it will match that of Javascript's % operator (within the limits of double precision).

	// In Decimal y = '0.1'
	// Standard javascript floats 1 % 0.9 =  0.09999999999999998

	let x = new Decimal(1),
		y = x.mod(0.9)								// 0.1

	let y = new Decimal(8),
		z = new Decimal(-3);

	Decimal.config = { modulo : 'down' }
	y.mod(z)									// '2'

	Decimal.config = { modulo : 'floor' }
	y.mod(z)									// '-1'


### Power

#### .pow(x : DecimalValue) : Decimal

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
	// the correct return value should be x = 839756321.64088510999 with rounding mode = 'down'

	Decimal.config = { precision: 20, rounding: 'down' }
	x = new Decimal(28).pow('6.166675020000903537297764507632802193308677149')

#### .sqrt() : Decimal

Returns a new Decimal whose value is the square root of this Decimal.

The return value will be correctly rounded, i.e. rounded as if the result was first calculated to an infinite number of correct digits before rounding.

This method is much faster than using the toPower method with an exponent of 0.5.

	let x = new Decimal(16)
		y = x.sqrt()                                       // 4


#### .cbrt() : Decimal

Returns a new Decimal whose value is the cube root of this Decimal.

The return value will be correctly rounded, i.e. rounded as if the result was first calculated to an infinite number of correct digits before rounding.

	let x = new Decimal(125),
		y = x.cbrt()                                       // 5

### Exponential

#### .exp() : Decimal

Returns a new Decimal whose value is the base e (Euler's number, the base of the natural logarithm) exponential of the value of this Decimal.

	let x = new Decimal(1)
	x.exp()                                               // '2.7182818284590452354'

The return value will be correctly rounded, i.e. rounded as if the result was first calculated to an infinite number of correct digits before rounding. (The mathematical result of the exponential function is non-terminating, unless its argument is 0).

The performance of this method degrades exponentially with increasing digits.

#### ln() : Decimal

Returns a new Decimal whose value is the natural logarithm of the value of this Decimal.

	let x = new Decimal(10)
	x.ln()                                                 // '2.3026'

The return value will be correctly rounded, i.e. rounded as if the result was first calculated to an infinite number of correct digits before rounding. (The mathematical result of the natural logarithm function is non-terminating, unless its argument is 1).

Internally, this method is dependent on a constant whose value is the natural logarithm of 10. This LN10 variable in the source code currently has a precision of 1025 digits, meaning that this method can accurately calculate up to 1000 digits.

If more than 1000 digits is required then the precision of LN10 will need to be increased to 25 digits more than is required - though, as the time-taken by this method increases exponentially with increasing digits, it is unlikely to be viable to calculate over 1000 digits anyway.

#### .log(x: DecimalValue): Decimal

Returns a new Decimal whose value is the base x logarithm of the value of this Decimal.

If x is omitted, the base 10 logarithm of the value of this Decimal will be returned.

	let x = new Decimal(1000)
	x.log(10)                                              // '3'

	let y = new Decimal(256)
	y.log(2)                                               // '8'

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
| [Decimal.atan2()](#decimal_._atan2y-decimal)	| [-&infin;, &infin;]	| [-&pi;, &pi;]			|


The maximum precision of the trigonometric methods is dependent on the internal value of the constant pi, which is defined in the source with a precision of 1025 digits. This means the trigonometric methods can calculate up to just over 1000 digits, but the actual figure depends on the precision of the argument passed to them. To calculate the actual result precision use:

	maximum_result_precision = 1000 - argument_precision

For example, the following both work fine:

	Decimal.config = {precision: 991}
	new Decimal(123456789).tan()

	Decimal.config = {precision: 9}
	new Decimal(991_digit_number).tan()

For each, the result precision plus the argument precision, i.e. 991 + 9 and 9 + 991, is less than or equal to 1000.

If greater precision is required then the value of PI will need to be extended to about 25 digits more than the precision required. The time taken by the methods will then be the limiting factor.

#### .sin(): Decimal

Returns a new Decimal whose value is the sine of the value in radians of this Decimal.

	let x = new Decimal(0.5),
		y = x.sin()								// y = '0.47942553860420300027'

#### .asin() : Decimal

Returns a new Decimal whose value is the inverse sine in radians of the value of this Decimal.

	let x = new Decimal(0.5),
		y = x.asin()								// y = '0.52359877559829887308'

#### .sinh() : Decimal

Returns a new Decimal whose value is the hyperbolic sine of the value in radians of this Decimal.


	let x = new Decimal(1),
		y = x.sinh()								// y = '1.1752011936438014569'

#### .asinh() : Decimal

Returns a new Decimal whose value is the inverse hyperbolic sine in radians of the value of this Decimal.

	let x = new Decimal(5),
		y = x.asinh()								// y = '2.3124383412727526203'

#### .cos() : Decimal

Returns a new Decimal whose value is the cosine of the value in radians of this Decimal.

	let x = new Decimal(0.25),
		y = x.cos()								// y = '0.96891242171064478414'

#### .acos() : Decimal

Returns a new Decimal whose value is the inverse cosine in radians of the value of this Decimal.

	let x = new Decimal(0),
		y = x.acos()								// y = '1.5707963267948966192'

#### .cosh() : Decimal

Returns a new Decimal whose value is the hyperbolic cosine of the value in radians of this Decimal.

	let x = new Decimal(1),
		y = x.cosh()								// y = '1.5430806348152437785'

#### .acosh() : Decimal

Returns a new Decimal whose value is the inverse hyperbolic cosine in radians of the value of this Decimal.

	let x = new Decimal(5),
		y = x.acosh()								// y = '2.2924316695611776878'

#### .tan() : Decimal

Returns a new Decimal whose value is the tangent of the value in radians of this Decimal.

	let x = new Decimal(0.5),
		y = x.tan()								// y = '0.54630248984379051326'

#### .atan() : Decimal

Returns a new Decimal whose value is the inverse tangent in radians of the value of this Decimal.

	let x = new Decimal(0.5),
		y = x.atan()								// y = '0.46364760900080611621'

#### .tanh() : Decimal

Returns a new Decimal whose value is the hyperbolic tangent of the value in radians of this Decimal.

	let x = new Decimal(1),
		y = x.tanh()                                       // y = '0.76159415595576488812'

#### .atanh() : Decimal

Returns a new Decimal whose value is the inverse hyperbolic tangent in radians of the value of this Decimal.


	let x = new Decimal(0.5),
		y = x.atanh()                                      // y = '0.5493061443340548457'


#### Decimal.atan2(y: DecimalValue, x: DecimalValue) : Decimal

A static method that returns a new Decimal whose value is the inverse tangent in radians of the quotient of y and x.

The signs of y and x are used to determine the quadrant of the result.


### Relational Comparison

#### .min((number|string|Decimal)[]) : Decimal

Returns a new Decimal whose value is the minimum of the arguments.


	let x = Decimal.min(-1, 6, 64)                         // x = '-1'

#### .max((number|string|Decimal)[]) : Decimal

Returns a new Decimal whose value is the maximum of the arguments.

	let x = Decimal.max(-1, 6, 64)                         // x = '64'

#### .cmp(x : DecimalValue) : number

Returns an integer indicating x's value relative to this Decimal;

| Return value | Condition                                                   |
| ------------ | ----------------------------------------------------------- |
| 1            | If the value of this Decimal is greater than the value of x |
| -1           | If the value of this Decimal is less than the value of x    |
| 0            | If this Decimal and x have the same value                   |
| NaN          | If the value of either this Decimal or x is NaN             |

	let x = new Decimal(Infinity),
		y = new Decimal(5)

	x.cmp(y)                                               // 1
	x.cmp(x.sub(1))                                        // 0
	y.cmp(NaN)                                             // NaN


#### .eq(x : DecimalValue) : boolean

Returns true if the value of this Decimal equals the value of x, otherwise returns false.
As with JavaScript, NaN does not equal NaN.

	// In Javascript 0 === 1e-324 is true
	let x = new Decimal(0)
	x.eq('1e-324')								// false
	new Decimal(-0).eq(x)								// true  ( -0 === 0 )

	let y = new Decimal(NaN)
	y.eq(NaN)                                              // false

#### .gt(y : DecimalValue) : boolean

Returns true if the value of this Decimal is greater than the value of x, otherwise returns false.

	// In Javascript 0.1 > (0.3 - 0.2) is true
	let x = new Decimal(0.1)

	x.gt(new Decimal(0.3).sub(0.2))                            // false
	new Decimal(0).gt(x)                                   // false

#### .gte(y : DecimalValue) : boolean

Returns true if the value of this Decimal is greater than or equal to the value of x, otherwise returns false.

	// In Javascript (0.3 - 0.2) >= 0.1  is false
	let x = new Decimal(0.3).sub(0.2)

	x.gte(0.1)                                             // true
	new Decimal(1).gte(x)                                  // true

#### .lt(y : DecimalValue) : boolean

Returns true if the value of this Decimal is less than the value of x, otherwise returns false.

	// In Javascript (0.3 - 0.2) < 0.1  is true
	let x = new Decimal(0.3).sub(0.2)

	x.lt(0.1)                                              // false
	new Decimal(0).lt(x)                                   // true

#### .lte(y : DecimalValue) : boolean

Returns true if the value of this Decimal is less than or equal to the value of x, otherwise returns false.

	// In Javascript 0.1 <= (0.3 - 0.2) is false
	let x = new Decimal(0.1)

	x.lte(new Decimal(0.3).sub(0.2))                       // true
	new Decimal(-1).lte(x)                                 // true

### Identify Comparison

#### .isFinite() : boolean

Returns true if the value of this Decimal is a finite number, otherwise returns false.
The only possible non-finite values of a Decimal are NaN, Infinity and -Infinity.

	let x = new Decimal(1)

	x.isFinite()									// true

	let y = new Decimal(Infinity)
	y.isFinite()									// false

#### .isInt() : boolean

Returns true if the value of this Decimal is a whole number, otherwise returns false.

	let x = new Decimal(1)
	x.isInt()									// true

	let y = new Decimal(123.456)
	y.isInt()									// false

#### .isNaN() : boolean

Returns true if the value of this Decimal is NaN, otherwise returns false.

	let x = new Decimal(NaN)
	x.isNaN()									// true

	let y = new Decimal('Infinity')
	y.isNaN()									// false

#### .isNeg() : boolean

Returns true if the value of this Decimal is negative, otherwise returns false.

	let x = new Decimal(-0)
	x.isNeg()									// true

	let y = new Decimal(2)
	y.isNeg()									// false

Note that zero is signed.

	new Decimal(0).valueOf()							// '0'
	new Decimal(0).isNeg()								// false
	new Decimal(0).neg().valueOf()						// '-0'
	new Decimal(0).neg().isNeg()						// true
	new Decimal(-0).isNeg()								// true

#### .isPos() : boolean

Returns true if the value of this Decimal is positive, otherwise returns false.

	let x = new Decimal(0)
	x.isPos()									// true

	let y = new Decimal(-2)
	y.isPos()									// false

#### .isZero() : boolean

Returns true if the value of this Decimal is zero or minus zero, otherwise returns false.

	let x = new Decimal(-0)
	x.isZero() && x.isNeg()								// true

	let y = new Decimal(Infinity)
	y.isZero()									// false

#### .isOdd() : boolean

Returns true if the value of this Decimal is odd, otherwise returns false.

	let x = new Decimal(3)
	x.isOdd()									// true

	let y = new Decimal(2)
	y.isOdd()									// false


#### .isEven() : boolean

Returns true if the value of this Decimal is even, otherwise returns false.

	let x = new Decimal(3)
	x.isEven()									// false

	let y = new Decimal(2)
	y.isEven()									// true

### Rounding

#### .ceil() : Decimal

Returns a new Decimal whose value is the value of this Decimal rounded to a whole number in the direction of positive Infinity.

	x = new Decimal(1.3)
	x.ceil()                                               // '2'
	y = new Decimal(-1.8)
	y.ceil()                                               // '-1'

#### .floor() : Decimal

Returns a new Decimal whose value is the value of this Decimal rounded to a whole number in the direction of negative Infinity.

	let x = new Decimal(1.8)
	x.floor()                                              // '1'

	let y = new Decimal(-1.3)
	y.floor()                                              // '-2'

#### .round() : Decimal

Returns a new Decimal whose value is the value of this Decimal rounded to a whole number using rounding mode rounding.

	Decimal.config = { rounding: 'down' }
	x = new Decimal(1234.5)
	x.round()                                              // '1234'

To emulate Math.round, set rounding to `'half-ceil'`.

#### .trunc() : Decimal

Returns a new Decimal whose value is the value of this Decimal truncated to a whole number.

	x = new Decimal(123.456)
	x.trunc()                                              // '123'

	y = new Decimal(-12.3)
	y.trunc()                                              // '-12'

#### toNearest(x : DecimalValue, rm ?: RoundingMode) : Decimal

Returns a new Decimal whose value is the nearest multiple of x in the direction of rounding mode rm, or Decimal.rounding if rm is omitted, to the value of this Decimal.

The return value will always have the same sign as this Decimal, unless either this Decimal or x is NaN, in which case the return value will be also be NaN.

The return value is not affected by the value of the precision setting.

	x = new Decimal(1.39)
	x.toNearest(0.25)                                      // '1.5'

	y = new Decimal(9.499)
	y.toNearest(0.5, 'up')                                 // '9.5'
	y.toNearest(0.5, 'down')                               // '9'

### Conversion

#### toDP(dp ?: number, rm ?: RoundingMode) : Decimal

Returns a new Decimal whose value is the value of this Decimal rounded to dp decimal places using rounding mode rm.

If dp is omitted, the return value will have the same value as this Decimal.

If rm is omitted, rounding mode rounding is used.

Throws an Error on an invalid dp or rm value.

	let x = new Decimal(12.34567)
	x.toDP(0)                                              // '12'
	x.toDp(1, 'up')                                        // '12.4'

#### toExponential(dp ?: number, rm ?: number) : string

Returns a string representing the value of this Decimal in exponential notation rounded using rounding mode `rm` to `dp` decimal places, i.e with one digit before the decimal point and dp digits after it.

If the value of this Decimal in exponential notation has fewer than dp fraction digits, the return value will be appended with zeros accordingly.

If dp is omitted, the number of digits after the decimal point defaults to the minimum number of digits necessary to represent the value exactly.

If `rm` is omitted, rounding mode rounding is used.

Throws an Error on an invalid dp or rm value.

	x = 45.6
	y = new Decimal(x)
	x.toExponential()								// '4.56e+1'
	y.toExponential()								// '4.56e+1'
	x.toExponential(0)								// '5e+1'
	y.toExponential(0)								// '5e+1'
	x.toExponential(1)								// '4.6e+1'
	y.toExponential(1)								// '4.6e+1'
	y.toExponential(1, 'down')							// '4.5e+1'
	x.toExponential(3)								// '4.560e+1'
	y.toExponential(3)								// '4.560e+1'

#### toFixed(dp ?: number, rm ?: number) : string

Returns a string representing the value of this Decimal in normal (fixed-point) notation rounded to `dp` decimal places using [rounding mode](#rounding) `rm`.

If the value of this Decimal in normal notation has fewer than `dp` fraction digits, the return value will be appended with zeros accordingly.

Unlike `Number.prototype.toFixed`, which returns exponential notation if a number is greater or equal to 1021, this method will always return normal notation.

If `dp` is omitted, the return value will be unrounded and in normal notation. This is unlike `Number.prototype.toFixed`, which returns the value to zero decimal places, but is useful when because of the current toExpNeg or toExpNeg values, toString returns exponential notation.

If rm is omitted, `Decimal.rounding` mode rounding is used.

Throws an Error on an invalid dp or rm value.

	let x = 3.456,
		y = new Decimal(x)

	x.toFixed()									// '3'
	y.toFixed()									// '3.456'
	y.toFixed(0)									// '3'
	x.toFixed(2)									// '3.46'
	y.toFixed(2)									// '3.46'
	y.toFixed(2, 'down')							// '3.45'
	x.toFixed(5)									// '3.45600'
	y.toFixed(5)									// '3.45600'

#### toFraction(max_denominator : DecimalValue) : Decimal[2]

Returns an array of two Decimals representing the value of this Decimal as a simple fraction with an integer numerator and an integer denominator. The denominator will be a positive non-zero value less than or equal to `max_denominator`.

If a maximum denominator is omitted, the denominator will be the lowest value necessary to represent the number exactly.

Throws on an invalid `max_denominator` value.

	let x = new Decimal(1.75)
	x.toFraction()									// '7, 4'

	let pi = new Decimal('3.14159265358')
	pi.toFraction()									// '157079632679,50000000000'
	pi.toFraction(100000)								// '312689, 99532'
	pi.toFraction(10000)								// '355, 113'
	pi.toFraction(100)								// '311, 99'
	pi.toFraction(10)								// '22, 7'
	pi.toFraction(1)								// '3, 1'

#### toNumber() : number

Returns the value of this Decimal converted to a primitive number.

Type coercion (e.g. JavaScript's unary plus operator) will also work, except that a Decimal with the value minus zero will convert to positive zero.

	let x = new Decimal(456.789)
	x.toNumber()									// 456.789
	+x										// 456.789

	let y = new Decimal('45987349857634085409857349856430985')
	y.toNumber()									// 4.598734985763409e+34

	let z = new Decimal(-0)
	1 / +z										// Infinity
	1 / z.toNumber()								// -Infinity

#### toSD(sd ?: number, rm ?: number) : Decimal

Returns a new Decimal whose value is the value of this Decimal rounded to `sd` significant digits using rounding mode `rm`.

If `sd` is omitted, the return value will be rounded to precision significant digits.

If `rm` is omitted, [rounding mode](#rounding) rounding will be used.

Throws and Error on an invalid sd or rm value.

	Decimal.config = { precision: 5, rounding: 'half-up' }
	let x = new Decimal(9876.54321)

	x.toSD()									// '9876.5'
	x.toSD(6)									// '9876.54'
	x.toSD(6, 'up')								// '9876.55'
	x.toSD(2)									// '9900'
	x.toSD(2, 'down')								// '9800'
	x 										// '9876.54321'

#### toPrecision(sd ?: number, rm ?: number) : string

Returns a string representing the value of this Decimal rounded to `sd` significant digits using rounding mode `rm`.

If `sd` is less than the number of digits necessary to represent the integer part of the value in normal (fixed-point) notation, then exponential notation is used.

If `sd` is omitted, the return value is the same as toString.

If `rm` is omitted, rounding mode rounding is used.

Throws an Error on an invalid sd or rm value.

	let x = 45.6,
		y = new Decimal(x)

	x.toPrecision()									// '45.6'
	y.toPrecision()									// '45.6'
	x.toPrecision(1)								// '5e+1'
	y.toPrecision(1)								// '5e+1'
	y.toPrecision(2, 'up')							// '46'
	y.toPrecision(2, 'down')							// '45'
	x.toPrecision(5)								// '45.600'
	y.toPrecision(5)								// '45.600'

#### toString() : string

Returns a string representing the value of this Decimal.

If this Decimal has a positive exponent that is equal to or greater than toExpPos, or a negative exponent equal to or less than toExpNeg, then exponential notation will be returned.

	let x = new Decimal(750000)

	x.toString()									// '750000'
	Decimal.config = { toExpPos: 5 }
	x.toString()									// '7.5e+5'

	Decimal.config = { precision: 4 }
	let y = new Decimal('1.23456789')
	y.toString()									// '1.23456789'

#### toValue() : string

As [toString](#tostring--string), but zero is signed.

	x = new Decimal(-0)
	x.valueOf()									// '-0'
