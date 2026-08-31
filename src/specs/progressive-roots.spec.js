import { Decimal } from '../Decimal.ts';
import { digits } from '../methods/utils/specs/decimal-state.js';
import { ROUNDING_MODES } from '../config/RoundingModes.ts';

// Independent exact-integer oracle: no Decimal arithmetic or floating-point roots.
function integerRoot(n, degree) {
	if (n < 2n) return n;
	const k = BigInt(degree);
	let root = 1n << BigInt(Math.ceil(n.toString(2).length / degree));
	for (;;) {
		const next = ((k - 1n) * root + n / root ** (k - 1n)) / k;
		if (next >= root) return root;
		root = next;
	}
}

function expectedRoot(coefficient, exponent, degree, precision, rounding) {
	const negative = coefficient < 0n;
	const magnitude = negative ? -coefficient : coefficient;
	const resultExponent = Math.floor((magnitude.toString().length - 1 + exponent) / degree);
	const scale = precision - 1 - resultExponent;
	const power = exponent + scale * degree;
	const numerator = magnitude * 10n ** BigInt(Math.max(0, power));
	const denominator = 10n ** BigInt(Math.max(0, -power));
	let root = integerRoot(numerator / denominator, degree);
	if (root ** BigInt(degree) * denominator !== numerator) {
		const midpoint = (2n * root + 1n) ** BigInt(degree) * denominator;
		const scaled = 2n ** BigInt(degree) * numerator;
		const tieUp = rounding === 'half-up' || rounding === 'half-even' && root % 2n === 1n ||
			rounding === 'half-ceil' && !negative || rounding === 'half-floor' && negative;
		const up = rounding === 'up' || rounding === 'ceil' && !negative || rounding === 'floor' && negative ||
			rounding.startsWith('half-') && (scaled > midpoint || scaled === midpoint && tieUp);
		if (up) root++;
	}
	return `${negative ? -root : root}e${-scale}`;
}

function checkRoot(coefficient, exponent, degree, precision, rounding) {
	const D = Decimal.clone({ precision, rounding });
	const value = new D(`${coefficient}e${exponent}`);
	const originalDigits = digits(value).slice(); Object.freeze(value);
	const result = degree === 2 ? value.sqrt() : value.cbrt();
	const expected = new D(expectedRoot(coefficient, exponent, degree, precision, rounding));
	const label = `${degree}th root of ${coefficient}e${exponent}, precision ${precision}, ${rounding}`;
		expect(result.toValue(), label).toBe(expected.toValue());
		expect(digits(result), label).toEqual(digits(expected));
		expect(digits(result)).not.toBe(digits(value));
		expect(digits(value)).toEqual(originalDigits);
}

describe('Progressive root precision', () => {
	it.each(ROUNDING_MODES)('matches exact integer-root rounding across precision stages for %s', rounding => {
		const fixtures = [
			[2n, 0], [125n, -2], [99900025n, -6], [1n, -801],
			[123456789012345678901234567890123456789012345678901234567890n, 300],
			[913456789012345678901234567890123456789012345678901234567891n, 801]
		];
		for (const precision of [1, 7, 20, 33, 65, 200]) {
			for (const [coefficient, exponent] of fixtures) {
				checkRoot(coefficient, exponent, 2, precision, rounding);
				checkRoot(coefficient, exponent, 3, precision, rounding);
				checkRoot(-coefficient, exponent, 3, precision, rounding);
			}
		}
	});

	it.each(ROUNDING_MODES)('keeps exact ties and their immediate neighbors correctly rounded for %s', rounding => {
		for (const precision of [2, 20, 65, 200]) {
			const midpoint = BigInt('9'.repeat(precision) + '5');
			for (const degree of [2, 3]) {
				const exactPower = midpoint ** BigInt(degree) * 10n ** 20n;
				for (const delta of [-1n, 0n, 1n]) {
					checkRoot(exactPower + delta, -precision * degree - 20, degree, precision, rounding);
					if (degree === 3) checkRoot(-exactPower - delta, -precision * degree - 20, degree, precision, rounding);
				}
			}
		}
	}, 10_000);

	it.each(ROUNDING_MODES)('restores the full 800-digit argument after preliminary truncation for %s', rounding => {
		const coefficient = BigInt('1234567890'.repeat(80) + '5');
		for (const exponent of [-800, 900]) {
			checkRoot(coefficient, exponent, 2, 800, rounding);
			checkRoot(coefficient, exponent, 3, 800, rounding);
			checkRoot(-coefficient, exponent, 3, 800, rounding);
		}
	});
});
