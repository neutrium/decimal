/** Return an exact decimal representation of `1 / 4 ** exponent`. */
export function reciprocalPowerOfFour(exponent: number): string
{
	return `${5n ** BigInt(2 * exponent)}e-${2 * exponent}`;
}

/** Return an exact decimal representation of `1 / 5 ** exponent`. */
export function reciprocalPowerOfFive(exponent: number): string
{
	return `${2n ** BigInt(exponent)}e-${exponent}`;
}
