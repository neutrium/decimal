import type { DecimalRationalTerm } from '../../DecimalRationalTerm.js';
import type { CalculationContext } from '../../CalculationContext.js';
import type { KernelDecimal } from '../../KernelDecimal.js';
import { DecimalConstants } from '../../InternalConstants.js';
import { invalidArgumentError, precisionLimitExceededError } from '../../errors.js';
import { ROUND_FLOOR } from '../../config/RoundingCodes.js';
import { roundCoefficient } from '../utils/coefficients/round.js';
import { bigIntToDigits } from '../utils/coefficients/to-bigint.js';
import { shift } from './shift.js';

interface Term { coefficient: bigint; exponent: bigint; }
type NormalizedTerm = readonly [numerator: bigint, denominator: bigint, exponent: bigint];
type PreparedSum = readonly [terms: Term[], denominator: bigint, sign: -1 | 1, hadNonzero: boolean];

/** @internal Exact sign without a Decimal rounding or range boundary. */
export function compareRationalSum(input: Iterable<DecimalRationalTerm>): -1 | 0 | 1
{
	const [terms, , sign] = prepare(input);

	return terms.length ? sign : 0;
}

/** @internal Exact rational accumulation followed by a single Decimal rounding boundary. */
export function fromRationalSum(input : Iterable<DecimalRationalTerm>, context : CalculationContext) : KernelDecimal
{
	const [terms, denominator, sign, hadNonzero] = prepare(input);

	if (!terms.length)
	{
		return context.create(hadNonzero && context.roundingCode === ROUND_FLOOR ? -0 : 0);
	}

	let exponent = order(terms[0]!) - digits(denominator);
	const comparePower = (power: bigint): number => sumSign([...terms, { coefficient: -denominator, exponent: power }]);

	while (comparePower(exponent) < 0)
	{
		exponent--;
	}

	while (comparePower(exponent + 1n) >= 0)
	{
		exponent++;
	}

	if (context.boundary === 'public')
	{
		if (exponent > BigInt(context.config.maxE))
		{
			return context.create(sign * Infinity);
		}

		// Rounding can carry the immediately preceding decade back into range.
		if (exponent < BigInt(context.config.minE) - 1n)
		{
			return context.create(sign * 0);
		}
	}

	// Retain one rounding digit, plus an exact sticky remainder. Decimal's shared
	// coefficient rounder then handles every mode and exact tie without duplication.
	const place = exponent - BigInt(context.precision);
	let integer = 0n;
	const fraction: Term[] = [];

	for (const term of terms)
	{
		const distance = term.exponent - place;
		if (distance >= 0n)
		{
			integer += term.coefficient * powerOfTen(distance);
		}
		else if (-distance >= digits(term.coefficient))
		{
			fraction.push({ ...term, exponent: distance });
		}
		else
		{
			const divisor = powerOfTen(-distance);
			integer += term.coefficient / divisor;
			fraction.push({ coefficient: term.coefficient % divisor, exponent: distance });
		}
	}

	let quotient = integer / denominator, remainder = integer % denominator;
	const residualSign = (offset = 0n): number => sumSign([...fraction, { coefficient: remainder + offset, exponent: 0n }]);

	while (residualSign() < 0)
	{
		quotient--; remainder += denominator;
	}

	while (residualSign(-denominator) >= 0)
	{
		quotient++; remainder -= denominator;
	}
	const sticky = residualSign() !== 0;

	// Convert only the bounded retained integer to coefficient words, never a
	// Decimal literal. Neither public parsing nor formatting limits participate.
	const [coefficient, digitCount] = bigIntToDigits(quotient);
	const roundedExponent = roundCoefficient(coefficient, digitCount - 1, sign,
		context.precision, context.roundingCode, sticky);
	const finalExponent = place + BigInt(roundedExponent);

	if (context.boundary === 'public')
	{
		if (finalExponent > BigInt(context.config.maxE)) return context.create(sign * Infinity);
		if (finalExponent < BigInt(context.config.minE)) return context.create(sign * 0);
	}

	if (place > BigInt(Number.MAX_SAFE_INTEGER) || place < BigInt(Number.MIN_SAFE_INTEGER))
	{
		throw precisionLimitExceededError();
	}

	// shift realigns base-1e7 words without rounding them a second time.
	return shift(context.createResult({ d: coefficient, e: roundedExponent, s: sign }), Number(place), context);
}

function gcd(a: bigint, b: bigint): bigint
{
	if (a < 0n)
	{
		a = -a;
	}

	while (b)
	{
		[a, b] = [b, a % b];
	}

	return a;
}

function prepare(input: Iterable<DecimalRationalTerm>): PreparedSum
{
	if (input === null || (typeof input !== 'object' && typeof input !== 'function')
		|| typeof input[Symbol.iterator] !== 'function')
	{
		throw invalidArgumentError(input, 'rational terms');
	}

	const normalized: NormalizedTerm[] = [];
	let denominator = 1n;

	for (const value of input)
	{
		if (value === null || typeof value !== 'object')
		{
			throw invalidArgumentError(value, 'rational term');
		}

		const { numerator, denominator: divisor, exponent } = value;

		if (typeof numerator !== 'bigint' || typeof divisor !== 'bigint' || divisor <= 0n || typeof exponent !== 'bigint')
		{
			throw invalidArgumentError(value, 'rational term');
		}

		if (!numerator) continue;

		const common = gcd(numerator, divisor), reduced = divisor / common;
		normalized.push([numerator / common, reduced, exponent]);
		denominator = denominator / gcd(denominator, reduced) * reduced;
	}

	const terms = compact(normalized.map(term => ({
		coefficient: term[0] * (denominator / term[1]), exponent: term[2]
	})));
	const sign = terms.length && terms[0]!.coefficient < 0n ? -1 : 1;

	if (sign < 0)
	{
		for (const term of terms)
		{
			term.coefficient = -term.coefficient;
		}
	}

	return [terms, denominator, sign, normalized.length > 0];
}

function digits(value: bigint): bigint
{
	return BigInt((value < 0n ? -value : value).toString().length);
}

function order(term: Term): bigint
{
	return term.exponent + digits(term.coefficient);
}

function powerOfTen(exponent: bigint): bigint
{
	if (exponent > BigInt(DecimalConstants.MAX_DIGITS))
	{
		throw precisionLimitExceededError();
	}

	return 10n ** exponent;
}

/** Merge only overlapping coefficients; distant tails cannot overturn the leading sign. */
function compact(input: readonly Term[]): Term[]
{
	const terms = input.filter(term => term.coefficient !== 0n).map(term => ({ ...term }));
	const gap = BigInt(String(terms.length + 1).length + 1);

	for (;;)
	{
		terms.sort((a, b) => order(a) > order(b) ? -1 : order(a) < order(b) ? 1 : 0);
		let merged = false;

		for (let i = 0; i + 1 < terms.length; i++)
		{
			const a = terms[i]!, b = terms[i + 1]!;

			if (order(b) < a.exponent - gap)
			{
				continue;
			}

			const exponent = a.exponent < b.exponent ? a.exponent : b.exponent;
			const coefficient = a.coefficient * powerOfTen(a.exponent - exponent)
				+ b.coefficient * powerOfTen(b.exponent - exponent);
			terms.splice(i, 2, ...(coefficient ? [{ coefficient, exponent }] : []));
			merged = true;
			break;
		}

		if (!merged)
		{
			return terms;
		}
	}
}

function sumSign(terms: readonly Term[]): number
{
	const first = compact(terms)[0];

	return first ? first.coefficient < 0n ? -1 : 1 : 0;
}
