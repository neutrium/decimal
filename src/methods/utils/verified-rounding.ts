import type { CalculationContext } from '../../CalculationContext.js';
import type { Decimal } from '../../Decimal.js';
import { getDecimalState } from '../../DecimalState.js';
import { finalise } from './finalise.js';

export type DecimalBounds = {
	readonly lower: Decimal;
	readonly upper: Decimal;
	readonly lowerHasMore: boolean;
};

/** Refine conservative bounds until both endpoints round to the same public result. */
export function refineRoundedBounds(
	context : CalculationContext,
	initialLength : number,
	hasUnrefinedDigits : (length : number) => boolean,
	createBounds : (length : number) => DecimalBounds
) : Decimal | undefined
{
	let length = initialLength;

	while (hasUnrefinedDigits(length))
	{
		const { lower, upper, lowerHasMore } = createBounds(length);
		const roundedLower = finalise(
			lower,
			context.precision,
			context.roundingCode,
			lowerHasMore,
			context
		);
		const roundedUpper = finalise(
			upper,
			context.precision,
			context.roundingCode,
			undefined,
			context
		);

		if (sameDecimal(roundedLower, roundedUpper)) return roundedLower;
		length *= 2;
	}

	return undefined;
}

function sameDecimal(a : Decimal, b : Decimal) : boolean
{
	const x = getDecimalState(a);
	const y = getDecimalState(b);

	if (!x.d || !y.d)
	{
		return x.d === y.d && (x.s === y.s || Number.isNaN(x.s) && Number.isNaN(y.s));
	}
	if (x.s !== y.s || x.e !== y.e || x.d.length !== y.d.length) return false;
	for (let i = 0; i < x.d.length; i++) if (x.d[i] !== y.d[i]) return false;
	return true;
}
