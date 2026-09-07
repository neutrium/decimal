import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizePackageModules, assertBundleTier, localPackageAliases } from '../lib/bundle-measurement.mjs';
import { resolve } from 'node:path';
import { tiers } from '../tier-metadata.mjs';

test('exactly one local alias matches each entry point', () => {
	const aliases = localPackageAliases('/package');
	for (const [specifier, file] of [
		['@neutrium/decimal', 'index'], ['@neutrium/decimal/core', 'core'],
		['@neutrium/decimal/arithmetic', 'arithmetic'], ['@neutrium/decimal/scientific', 'scientific']
	])
	{
		const matches = aliases.filter(alias => alias.find.test(specifier));
		assert.equal(matches.length, 1);
		assert.equal(specifier.replace(matches[0].find, matches[0].replacement), resolve('/package', `dist/${file}.js`));
	}
	for (const specifier of ['@neutrium/decimal/core/internal', '@neutrium/decimal/unknown', '@neutrium/decimal-other', 'other/@neutrium/decimal'])
		assert.ok(!aliases.some(alias => alias.find.test(specifier)));
});

test('local and installed modules normalize to identical source paths', () => {
	const outputs = ['dist/core.js', 'dist/CoreDecimal.js', 'dist/methods/utils/finalise.js'];
	const expected = ['src/CoreDecimal.ts', 'src/core.ts', 'src/methods/utils/finalise.ts'];
	for (const root of ['/repo/decimal', '/consumer/node_modules/@neutrium/decimal', 'C:/repo/decimal'])
	{
		const ids = outputs.map(file => `${root}/${file}`);
		ids.push(`${root}/scripts/fixtures/browser/core.ts`, `${root}-other/dist/core.js`);
		assert.deepEqual(normalizePackageModules(ids, [root]), expected);
		assert.deepEqual(normalizePackageModules(ids.map(id => id.replaceAll('/', '\\')), [root]), expected);
	}
});

test('resolves logical and real package roots, removes queries, and deduplicates modules', () => {
	assert.deepEqual(normalizePackageModules([
		'/link/dist/core.js', '/real/dist/core.js?query', '/real/dist/core.js#hash',
		'/real/dist/helper.wasm', '/real/dist/NewInfrastructure.js'
	], ['/link', '/real/']), ['dist/helper.wasm', 'src/NewInfrastructure.ts', 'src/core.ts']);
});

test('bundles accept only their tier or lower and reject unknown output', () => {
	const [core, arithmetic, scientific] = tiers;
	assert.doesNotThrow(() => assertBundleTier(['src/CoreDecimal.ts'], core, 'core'));
	assert.doesNotThrow(() => assertBundleTier(['src/CoreDecimal.ts', 'src/ArithmeticDecimal.ts'], arithmetic, 'arithmetic'));
	assert.doesNotThrow(() => assertBundleTier(['src/constants.ts', 'src/ArithmeticDecimal.ts'], scientific, 'scientific'));
	assert.throws(() => assertBundleTier(['src/ArithmeticDecimal.ts'], core, 'core'), /core bundle includes arithmetic/);
	assert.throws(() => assertBundleTier(['src/ConstantCache.ts'], arithmetic, 'arithmetic'), /arithmetic bundle includes scientific/);
	for (const file of ['src/NewInfrastructure.ts', 'dist/helper.wasm'])
		assert.throws(() => assertBundleTier([file], scientific, 'scientific'), /unclassified bundled/);
	assert.throws(() => assertBundleTier([], core, 'core'), /no package modules detected/);
});

test('unused imports retain zero package modules', () => {
	assert.doesNotThrow(() => assertBundleTier([], undefined, 'unused'));
	assert.throws(() => assertBundleTier(['src/core.ts'], undefined, 'unused'), /unused imports retain/);
});
