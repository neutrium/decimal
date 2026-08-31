import { Decimal } from '../Decimal.ts';

describe('Decimal conversion identity', () => {
	it('returns distinct values when Decimal conversions are no-ops', () => {
		const Clone = Decimal.clone({ precision: 20 });
		const finite = new Clone('1.25');
		const infinity = new Clone(Infinity);

		const results = [
			finite.toDP(),
			finite.toDP(10),
			finite.toSD(10),
			infinity.toNearest(),
			infinity.toNearest(1)
		];

		for (const result of results) {
			expect(result).toBeInstanceOf(Clone);
		}

		expect(results[0]).not.toBe(finite);
		expect(results[1]).not.toBe(finite);
		expect(results[2]).not.toBe(finite);
		expect(results[3]).not.toBe(infinity);
		expect(results[4]).not.toBe(infinity);

		expect('d' in results[0]).toBe(false);
		expect(finite.toString()).toBe('1.25');
	});
});
