/** An exact finite value: numerator / denominator multiplied by ten to exponent. */
export interface DecimalRationalTerm
{
	/** Signed integer numerator; zero carries no negative-zero sign. */
	readonly numerator: bigint;
	/** Strictly positive integer denominator. */
	readonly denominator: bigint;
	/** Decimal exponent retained separately, without expansion. */
	readonly exponent: bigint;
}
