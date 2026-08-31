import { Decimal } from '../../../Decimal.ts';
import { digits } from './decimal-state.js';
import { equalDigitPrefixes } from '../equal-digit-prefixes.ts';
import { digitsToString } from '../digits-to-string.ts';

describe('Significant-digit prefix comparisons', () => {
	const coefficients = [null, [0], [1], [10], [1000000], [123], [1230000], [1, 1], [123, 4567890], [9999999, 9999999], [1, 0, 1]];

	it('matches string prefixes across word boundaries, short coefficients, zero and null', () => {
		for (const a of coefficients) {
			for (const b of coefficients) {
				for (let count = 0; count <= 25; count++) {
					expect(equalDigitPrefixes(a, b, count)).toBe(digitsToString(a).slice(0, count) === digitsToString(b).slice(0, count));
				}
			}
		}
	});

	it('compares identical significant digits even when decimal shifts change word alignment', () => {
		let seed = 4321;
		const D = Decimal.clone({ precision: 100 });
		for (let sample = 0; sample < 300; sample++) {
			seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
			const x = new D(String(seed >>> 0) + '0123456789000012345000');
			const y = new D(`${x.toFixed()}e${sample % 21 - 10}`);
			const z = y.add('1e-30');
			for (const candidate of [y, z]) {
				for (const count of [1, 2, 6, 7, 8, 13, 14, 15, 30, 60]) {
					const xd = digits(x), candidateDigits = digits(candidate);
					expect(equalDigitPrefixes(xd, candidateDigits, count)).toBe(digitsToString(xd).slice(0, count) === digitsToString(candidateDigits).slice(0, count));
				}
			}
		}
	});
});
