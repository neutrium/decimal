import { Decimal } from "../../Decimal.js";
import { DecimalParams } from "../../DecimalParameters.js";
import { finalise } from "../utils/finalise.js";
import { taylorSeries } from "./taylor-series.js";
import { toLessThanHalfPi } from "./to-lte-pi.js";
import { getPi } from "./get-pi.js";
import { atan } from "./tan.js";

//
// Return a new Decimal whose value is the sine of the value in radians of `x`.
//
// Domain: [-Infinity, Infinity]
// Range: [-1, 1]
//
// sin(x) = x - x^3/3! + x^5/5! - ...
//
// sin(0)         = 0
// sin(-0)        = -0
// sin(Infinity)  = NaN
// sin(-Infinity) = NaN
// sin(NaN)       = NaN
//
export function sin(x: Decimal) : Decimal
{
	let pr, rm;

	if (!x.isFinite())
	{
		return new Decimal(NaN);
	}

	if (x.isZero())
	{
		return new Decimal(x);
	}

	pr = Decimal.precision;
	rm = Decimal.rounding;
	Decimal.precision = pr + Math.max(x.e, x.precision()) + DecimalParams.LOG_BASE;
	Decimal.rounding = 1;

	x = sine(toLessThanHalfPi(x));

	Decimal.precision = pr;
	Decimal.rounding = rm;

	return finalise(Decimal.quadrant > 2 ? x.neg() : x, pr, rm, true);
}

//
// Return a new Decimal whose value is the arcsine (inverse sine) in radians of the value of `x`.
//
// Domain: [-Infinity, Infinity]
// Range: [-pi/2, pi/2]
//
// asin(x) = 2*atan(x/(1 + sqrt(1 - x^2)))
//
// asin(0)       = 0
// asin(-0)      = -0
// asin(1/2)     = pi/6
// asin(-1/2)    = -pi/6
// asin(1)       = pi/2
// asin(-1)      = -pi/2
// asin(|x| > 1) = NaN
// asin(NaN)     = NaN
//
// TODO? Compare performance of Taylor series.
//
export function asin(x: Decimal) : Decimal
{
	let halfPi, k,
		pr, rm;

	if (x.isZero()) return new Decimal(x);

	k = x.abs().cmp(1);
	pr = Decimal.precision;
	rm = Decimal.rounding;

	if (k !== -1)
	{
		// |x| is 1
		if (k === 0)
		{
			halfPi = getPi(pr + 4, rm).mul(0.5);
			halfPi.s = x.s;
			return halfPi;
		}

		// |x| > 1 or x is NaN
		return new Decimal(NaN);
	}

	// TODO? Special case asin(1/2) = pi/6 and asin(-1/2) = -pi/6

	Decimal.precision = pr + 6;
	Decimal.rounding = 1;

	x = atan(x.div(new Decimal(1).sub(x.mul(x)).sqrt().add(1)));

	Decimal.precision = pr;
	Decimal.rounding = rm;

	return x.mul(2);
}

//
// Return a new Decimal whose value is the hyperbolic sine of the value in radians of `x`.
//
// Domain: [-Infinity, Infinity]
// Range: [-Infinity, Infinity]
//
// sinh(x) = x + x^3/3! + x^5/5! + x^7/7! + ...
//
// sinh(0)         = 0
// sinh(-0)        = -0
// sinh(Infinity)  = Infinity
// sinh(-Infinity) = -Infinity
// sinh(NaN)       = NaN
//
// x        time taken (ms)
// 10       2 ms
// 100      5 ms
// 1000     14 ms
// 10000    82 ms
// 100000   886 ms            1.4033316802130615897e+43429
// 200000   2613 ms
// 300000   5407 ms
// 400000   8824 ms
// 500000   13026 ms          8.7080643612718084129e+217146
// 1000000  48543 ms
//
// TODO? Compare performance of sinh(x) = 0.5 * (exp(x) - exp(-x))
//
export function sinh(x: Decimal) : Decimal
{
	let k, pr, rm, len,
		config = Decimal.config;

	if (!x.isFinite() || x.isZero())
	{
		return new Decimal(x);
	}

	pr = config.precision;
	rm = config.rounding;
	Decimal.precision = pr + Math.max(x.e, x.precision()) + 4;
	Decimal.rounding = 1;

	len = x.d.length;

	if (len < 3)
	{
		x = taylorSeries(2, x, x, true);
	}
	else
	{
		// Alternative argument reduction: sinh(3x) = sinh(x)(3 + 4sinh^2(x))
		// i.e. sinh(x) = sinh(x/3)(3 + 4sinh^2(x/3))
		// 3 multiplications and 1 addition

		// Argument reduction: sinh(5x) = sinh(x)(5 + sinh^2(x)(20 + 16sinh^2(x)))
		// i.e. sinh(x) = sinh(x/5)(5 + sinh^2(x/5)(20 + 16sinh^2(x/5)))
		// 4 multiplications and 2 additions

		// Estimate the optimum number of times to use the argument reduction.
		k = 1.4 * Math.sqrt(len);
		k = k > 16 ? 16 : k | 0;

		x = x.mul(Math.pow(5, -k));

		x = taylorSeries(2, x, x, true);

		// Reverse argument reduction
		var sinh2_x,
		d5 = new Decimal(5),
		d16 = new Decimal(16),
		d20 = new Decimal(20);

		for (; k--;)
		{
			sinh2_x = x.mul(x);
			x = x.mul(d5.add(sinh2_x.mul(d16.mul(sinh2_x).add(d20))));
		}
	}

	Decimal.precision = pr;
	Decimal.rounding = rm;

	return finalise(x, pr, rm, true);
}

//
// Return a new Decimal whose value is the inverse of the hyperbolic sine in radians of the value of `x`.
//
// Domain: [-Infinity, Infinity]
// Range: [-Infinity, Infinity]
//
// asinh(x) = ln(x + sqrt(x^2 + 1))
//
// asinh(NaN)       = NaN
// asinh(Infinity)  = Infinity
// asinh(-Infinity) = -Infinity
// asinh(0)         = 0
// asinh(-0)        = -0
//
export function asinh(x: Decimal) : Decimal
{
	let pr, rm;

	if (!x.isFinite() || x.isZero()) return new Decimal(x);

	pr = Decimal.precision;
	rm = Decimal.rounding;
	Decimal.precision = pr + 2 * Math.max(Math.abs(x.e), x.precision()) + 6;
	Decimal.rounding = 1;
	Decimal.external = false;

	x = x.mul(x).add(1).sqrt().add(x);

	Decimal.external = true;
	Decimal.precision = pr;
	Decimal.rounding = rm;

	return x.ln();
}

//
// sin(x) = x - x^3/3! + x^5/5! - ...
// |x| < pi/2
//
export function sine(x : Decimal) : Decimal
{
	if(x.isFinite())
	{
		let k,
			len = x.d.length;

		if (len < 3)
		{
			return taylorSeries(2, x, x);
		}

		// Argument reduction: sin(5x) = 16*sin^5(x) - 20*sin^3(x) + 5*sin(x)
		// i.e. sin(x) = 16*sin^5(x/5) - 20*sin^3(x/5) + 5*sin(x/5)
		// and  sin(x) = sin(x/5)(5 + sin^2(x/5)(16sin^2(x/5) - 20))

		// Estimate the optimum number of times to use the argument reduction.
		k = 1.4 * Math.sqrt(len);
		k = k > 16 ? 16 : k | 0;

		// Max k before Math.pow precision loss is 22
		x = x.mul(Math.pow(5, -k));
		x = taylorSeries(2, x, x);

		// Reverse argument reduction
		var sin2_x,
		d5 = new Decimal(5),
		d16 = new Decimal(16),
		d20 = new Decimal(20);

		for (; k--;)
		{
			sin2_x = x.mul(x);
			x = x.mul(d5.add(sin2_x.mul(d16.mul(sin2_x).sub(d20))));
		}
	}

	return x;
}