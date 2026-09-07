/** Compare canonical finite, nonzero unsigned coefficients and their base-10 exponents. */
export function compareMagnitudes(
	xd: readonly number[], xExponent: number,
	yd: readonly number[], yExponent: number
): number
{
	if (xExponent !== yExponent)
	{
		return xExponent > yExponent ? 1 : -1;
	}

	const length = Math.min(xd.length, yd.length);

	for (let i = 0; i < length; i++)
	{
		if (xd[i] !== yd[i]) return xd[i]! > yd[i]! ? 1 : -1;
	}

	return xd.length === yd.length ? 0 : xd.length > yd.length ? 1 : -1;
}
