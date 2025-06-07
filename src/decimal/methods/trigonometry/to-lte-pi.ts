import { Decimal } from "../../Decimal.js";
import { isOdd } from "../compare/identity-compare.js";
import { divToInt } from "../arithmetic/div.js";
import { getPi } from "./get-pi.js";

//
// Return the absolute value of `x` reduced to less than or equal to half pi.
//
export function toLessThanHalfPi(x : Decimal) : Decimal
{
	let t,
		isNeg = x.s < 0,
		pi = getPi(Decimal.precision, 1),
		halfPi = pi.mul(0.5);

	x = x.abs();

	if (x.lte(halfPi))
	{
		Decimal.quadrant = isNeg ? 4 : 1;
		return x;
	}

	t = divToInt(x, pi);

	if (t.isZero())
	{
		Decimal.quadrant = isNeg ? 3 : 2;
	}
	else
	{
		x = x.sub(t.mul(pi));

		// 0 <= x < pi
		if (x.lte(halfPi))
		{
			Decimal.quadrant = isOdd(t) ? (isNeg ? 2 : 3) : (isNeg ? 4 : 1);
			return x;
		}

		Decimal.quadrant = isOdd(t) ? (isNeg ? 1 : 4) : (isNeg ? 3 : 2);
	}

	return x.mul(pi).abs();
}