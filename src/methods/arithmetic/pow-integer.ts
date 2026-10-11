import type { CalculationContext } from '../../CalculationContext.js';
import type { KernelDecimal } from '../../KernelDecimal.js';
import { getDecimalState } from '../../DecimalState.js';
import { DecimalConstants } from '../../InternalConstants.js';
import { invalidArgumentError, precisionLimitExceededError } from '../../errors.js';
import { bigIntToDigits, digitsPrefixToBigInt } from '../utils/coefficients/to-bigint.js';
import { divideSignificant } from './div.js';
import { compareDecimals } from '../compare/relational-compare.js';
import { finalise } from '../utils/finalise.js';

// Positive coefficient times BASE ** exponent. BigInt exponents keep even
// MAX_SAFE_INTEGER powers exact before the final public range decision.
interface Scaled { coefficient: bigint; exponent: bigint; }
const BASE = BigInt(DecimalConstants.BASE);
const WORD_DIGITS = BigInt(DecimalConstants.LOG_BASE);

/** Integer powers with exact small products and adaptively refined directed bounds. */
export function powInteger(x : KernelDecimal, exponent : number, context : CalculationContext) : KernelDecimal
{
	if (!Number.isSafeInteger(exponent))
	{
		throw invalidArgumentError(exponent, 'integer exponent');
	}

	if (exponent === 0)
	{
		return context.create(1);
	}

	const state = getDecimalState(x);
	const sign = state.s < 0 && Math.abs(exponent) % 2 ? -1 : 1;
	if (!state.d)
	{
		return context.create(Number.isNaN(state.s) ? NaN : exponent < 0 ? sign * 0 : sign * Infinity);
	}

	if (!state.d[0])
	{
		return context.create(exponent < 0 ? sign * Infinity : sign * 0);
	}

	if (exponent === 1)
	{
		return finalise(context.createExact(x), context.precision, context.roundingCode, undefined, context);
	}

	if (exponent === -1)
	{
		return divideSignificant(context.createExact(1), x, context);
	}

	const maximumWords = Math.ceil(DecimalConstants.MAX_DIGITS / DecimalConstants.LOG_BASE) + 8;
	let words = Math.min(maximumWords, Math.ceil(context.precision / DecimalConstants.LOG_BASE) + 4);

	for (;;)
	{
		const length = Math.min(state.d.length, words);
		const coefficient = digitsPrefixToBigInt(state.d, length);
		const shift = BigInt(Math.floor(state.e / DecimalConstants.LOG_BASE)) - BigInt(length - 1);
		const lower = { coefficient, exponent: shift };
		const upper = { coefficient: coefficient + (length < state.d.length ? 1n : 0n), exponent: shift };
		let low = power(lower, Math.abs(exponent), words, false);
		let high = power(upper, Math.abs(exponent), words, true);

		if (exponent < 0)
		{
			[low, high] = [reciprocal(high, words, false), reciprocal(low, words, true)];
		}

		const a = rounded(low, sign, context), b = rounded(high, sign, context);

		if (compareDecimals(a, b) === 0)
		{
			return a;
		}

		// Exact ties resolve once their finite coefficients are retained in full.
		// Never return an unverified approximation when the refinement budget ends.
		if (words === maximumWords)
		{
			throw precisionLimitExceededError();
		}

		words = Math.min(maximumWords, words * 2);
	}
}

function wordLength(coefficient : bigint) : number
{
	return Math.ceil(coefficient.toString().length / DecimalConstants.LOG_BASE);
}

function multiply(a : Scaled, b : Scaled, words : number, up : boolean) : Scaled
{
	let coefficient = a.coefficient * b.coefficient, exponent = a.exponent + b.exponent;
	const drop = wordLength(coefficient) - words;

	if (drop > 0)
	{
		const divisor = BASE ** BigInt(drop);
		coefficient = coefficient / divisor + (up && coefficient % divisor !== 0n ? 1n : 0n);
		exponent += BigInt(drop);
	}

	return { coefficient, exponent };
}

function power(value : Scaled, count : number, words : number, up : boolean) : Scaled
{
	let result = { coefficient: 1n, exponent: 0n };

	while (count)
	{
		if (count % 2)
		{
			result = multiply(result, value, words, up);
		}

		count = Math.floor(count / 2);
		if (count)
		{
			value = multiply(value, value, words, up);
		}
	}

	return result;
}

function reciprocal(value : Scaled, words : number, up : boolean) : Scaled
{
	const shift = BigInt(words + wordLength(value.coefficient));
	const numerator = BASE ** shift;

	return {
		coefficient: numerator / value.coefficient + (up && numerator % value.coefficient !== 0n ? 1n : 0n),
		exponent: -value.exponent - shift
	};
}

function rounded(value : Scaled, sign : number, context : CalculationContext) : KernelDecimal
{
	const [digits, digitCount] = bigIntToDigits(value.coefficient);
	const exponent = value.exponent * WORD_DIGITS + BigInt(digitCount - 1);

	if (context.boundary === 'public')
	{
		if (exponent > BigInt(context.config.maxE))
		{
			return context.create(sign * Infinity);
		}

		// Keep the adjacent decade: rounding can carry a value back into range.
		if (exponent < BigInt(context.config.minE) - 1n)
		{
			return context.create(sign * 0);
		}
	}

	if (exponent > BigInt(Number.MAX_SAFE_INTEGER) || exponent < BigInt(Number.MIN_SAFE_INTEGER))
	{
		throw precisionLimitExceededError();
	}

	while (digits.length > 1 && digits[digits.length - 1] === 0)
	{
		digits.pop();
	}

	return finalise(
		context.createResult({
			d: digits,
			e: Number(exponent),
			s: sign
		}),
		context.precision,
		context.roundingCode,
		undefined,
		context
	);
}
