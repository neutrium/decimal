import {
	MODULO_MODES,
	calculateRoundingTable,
	compareCalculation
} from '../../demo/calculations.ts';

const defaults = {
	precision: 20,
	rounding: 'half-up',
	modulo: 'down'
};

describe('interactive demo calculations', () => {
	it('exposes every supported modulo mode', () => {
		expect(MODULO_MODES).toEqual([
			'up',
			'down',
			'ceil',
			'floor',
			'half-up',
			'half-down',
			'half-even',
			'half-ceil',
			'half-floor',
			'euclid'
		]);
	});

	it('exposes the native floating-point difference', () => {
		const result = compareCalculation({
			...defaults,
			left: '0.1',
			operation: 'add',
			right: '0.2'
		});

		expect(result.decimal).toBe('0.3');
		expect(result.native).toBe('0.30000000000000004');
		expect(result.equivalent).toBe(false);
	});

	it('preserves integers beyond Number safe precision', () => {
		const result = compareCalculation({
			...defaults,
			left: '9007199254740993',
			operation: 'add',
			right: '1'
		});

		expect(result.decimal).toBe('9007199254740994');
		expect(result.native).toBe('9007199254740992');
	});

	it('demonstrates Euclidean modulo independently of JavaScript remainder', () => {
		const result = compareCalculation({
			...defaults,
			left: '-17',
			operation: 'mod',
			right: '5',
			modulo: 'euclid'
		});

		expect(result.decimal).toBe('3');
		expect(result.native).toBe('-2');
	});

	it('produces all documented rounding modes', () => {
		const rows = calculateRoundingTable('2.5', 0);
		const results = Object.fromEntries(rows.map(row => [row.mode, row.value]));

		expect(rows).toHaveLength(9);
		expect(results['half-up']).toBe('3');
		expect(results['half-down']).toBe('2');
		expect(results['half-even']).toBe('2');
	});
});
