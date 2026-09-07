const NUMERALS = '0123456789abcdef';
const LOG10_2_NUMERATOR = 3010299956639812n;
const LOG10_2_SCALE = 10000000000000000n;
const LOG10_2 = Number(LOG10_2_NUMERATOR) / Number(LOG10_2_SCALE);
const LOG10_5 = 1 - LOG10_2;

/** Exact, unsigned significand * 2^binaryShift, with redundant factors of two removed. */
export interface BinaryCoefficient
{
	readonly significand: bigint;
	readonly significandBitLength: number;
	readonly binaryShift: bigint;
	readonly bitExponent: bigint;
}

/** Decode an already validated, lowercase radix literal; undefined denotes zero. */
export function decodePrefixedCoefficient(str : string, base : 2 | 8 | 16) : BinaryCoefficient | undefined
{
	let binaryExponent = 0n;
	let i = str.search(/p/i);

	if (i > 0)
	{
		binaryExponent = BigInt(str.slice(i + 1));
		str = str.substring(2, i);
	}
	else
	{
		str = str.slice(2);
	}

	const pointIndex = str.indexOf('.');
	const fractionDigits = pointIndex < 0 ? 0 : str.length - pointIndex - 1;

	if (pointIndex >= 0) str = str.replace('.', '');

	let significand = BigInt((base === 16 ? '0x' : base === 8 ? '0o' : '0b') + str);

	if (significand === 0n) return undefined;

	const bitsPerDigit = base === 16 ? 4 : base === 8 ? 3 : 1;
	let significandBitLength = getBitLength(str, bitsPerDigit);
	let binaryShift = binaryExponent - BigInt(fractionDigits * bitsPerDigit);
	const bitExponent = BigInt(significandBitLength - 1) + binaryShift;

	// Remove factors of two which would otherwise become unnecessary factors of five below.
	if (binaryShift < 0)
	{
		const trailingZeroBits = BigInt(getTrailingZeroBits(str, bitsPerDigit));
		const removableBits = trailingZeroBits < -binaryShift ? trailingZeroBits : -binaryShift;

		if (removableBits)
		{
			significand >>= removableBits;
			binaryShift += removableBits;
			significandBitLength -= Number(removableBits);
		}
	}

	return { significand, significandBitLength, binaryShift, bitExponent };
}

/**
 * Expand to an exact decimal string within the supplied digit budget. The caller
 * handles syntax, sign, exponent limits, and the error for an undefined result.
 * Check the estimate before constructing powers or shifting large BigInts.
 */
export function expandBinaryCoefficient(value : BinaryCoefficient, maxDigits : number) : string | undefined
{
	const { significand, significandBitLength, binaryShift } = value;
	const shift = Number(binaryShift < 0 ? -binaryShift : binaryShift);
	const estimatedDigits = Math.ceil(
		significandBitLength * LOG10_2 + shift * (binaryShift < 0 ? LOG10_5 : LOG10_2)
	);

	// One digit of slack avoids rejecting a boundary value because this estimate
	// is an upper bound. Check boundary cases exactly after expansion.
	if (estimatedDigits > maxDigits + 1) return undefined;

	const coefficient = binaryShift < 0
		? (significand * 5n ** -binaryShift).toString()
		: (significand << binaryShift).toString();

	if (coefficient.length > maxDigits) return undefined;

	return binaryShift < 0 ? coefficient + 'e' + binaryShift : coefficient;
}

function getBitLength(str : string, bitsPerDigit : number) : number
{
	let i = 0;

	while (str.charCodeAt(i) === 48) i++;

	const firstDigit = NUMERALS.indexOf(str.charAt(i));

	return (str.length - i - 1) * bitsPerDigit + 32 - Math.clz32(firstDigit);
}

function getTrailingZeroBits(str : string, bitsPerDigit : number) : number
{
	let i = str.length - 1;
	let bits = 0;

	while (str.charCodeAt(i) === 48)
	{
		bits += bitsPerDigit;
		i--;
	}

	let digit = NUMERALS.indexOf(str.charAt(i));

	while ((digit & 1) === 0)
	{
		bits++;
		digit /= 2;
	}

	return bits;
}

/** Conservative exponent-range classification; near-boundary values must be expanded. */
export function binaryExponentRange(bitExponent : bigint, minExponent : number, maxExponent : number) : -1 | 0 | 1
{
	const estimate = bitExponent * LOG10_2_NUMERATOR;
	const maximum = (BigInt(maxExponent) + 2n) * LOG10_2_SCALE;
	const minimum = (BigInt(minExponent) - 2n) * LOG10_2_SCALE;

	return estimate > maximum ? 1 : estimate < minimum ? -1 : 0;
}
