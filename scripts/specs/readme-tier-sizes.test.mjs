import assert from 'node:assert/strict';
import { test } from 'node:test';
import { updateTierSizeTable } from '../lib/readme-tier-sizes.mjs';

const start = '<!-- tier-table:start -->', end = '<!-- tier-table:end -->';
const original = `Before\n\n${start}\nold table\n${end}\n\nAfter\n`;
const sizes = { core: 1024, arithmetic: 2560, scientific: 4096, root: 4097 };

test('renders measured sizes independently of metadata budgets and preserves surrounding text', () => {
	const result = updateTierSizeTable(original, sizes);
	assert.ok(result.startsWith('Before\n\n'));
	assert.ok(result.endsWith('\n\nAfter\n'));
	assert.ok(!result.includes('old table'));
	assert.ok(result.includes('| Entry point | Includes | Minified size | Budget |'));
	assert.ok(result.includes('| `@neutrium/decimal/core` | Representation, parsing, comparison, predicates, and string/number formatting | 1.00 KiB | 20 KiB |'));
	assert.ok(result.includes('| `@neutrium/decimal/arithmetic` | Core plus arithmetic, rounding, shifting, and fractions | 2.50 KiB | 32 KiB |'));
	assert.ok(result.includes('| `@neutrium/decimal/scientific` | Arithmetic plus powers, logarithms, trigonometry, `PI`, and `atan2` (the complete API) | 4.00 KiB | 50 KiB |'));
	assert.ok(result.includes('| `@neutrium/decimal` | Alias for the scientific tier; retained for compatibility | 4.00 KiB | 50 KiB |'));
	assert.equal(updateTierSizeTable(result, sizes), result);
});

test('requires unique, correctly ordered markers', () => {
	for (const text of ['', start, end, `${end}${start}`, `${start}${start}${end}`, `${start}${end}${end}`])
		assert.throws(() => updateTierSizeTable(text, sizes), /markers/);
});

test('rejects incomplete or invalid measurements instead of publishing a partial table', () => {
	for (const value of [undefined, NaN, Infinity, -1, 0, 1.5])
		assert.throws(() => updateTierSizeTable(original, { ...sizes, core: value }), /bundle size: core/);
	assert.throws(() => updateTierSizeTable(original, { ...sizes, root: undefined }), /bundle size: root/);
});
