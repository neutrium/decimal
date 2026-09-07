import assert from 'node:assert/strict';
import { realpathSync } from 'node:fs';
import { join, resolve, posix } from 'node:path';
import { build } from 'vite';
import { entryPoints, packageExports, moduleTier } from '../tier-metadata.mjs';

/** Map local and installed emitted modules to the source paths used by tier metadata. */
export function normalizePackageModules(moduleIds, packageRoots)
{
	const normalize = value => posix.normalize(value.replaceAll('\\', '/'));
	const prefixes = packageRoots.map(root => normalize(root).replace(/\/$/, '') + '/');
	const modules = new Set();
	for (const id of moduleIds)
	{
		const file = normalize(id.split(/[?#]/, 1)[0]);
		const prefix = prefixes.find(root => file.startsWith(root));
		if (!prefix) continue;
		const relative = file.slice(prefix.length);
		// Local consumer fixtures live under the repository but are not library output.
		if (!relative.startsWith('dist/')) continue;
		// Keep unexpected emitted files visible so classification fails closed.
		modules.add(relative.endsWith('.js')
			? `src/${relative.slice(5, -3)}.ts` : relative);
	}
	return [...modules].sort();
}

/** Undefined tier denotes the unused-import fixture, which must retain no package code. */
export function assertBundleTier(packageModules, tier, label)
{
	if (!tier)
	{
		assert.equal(packageModules.length, 0, `${label}: unused imports retain package modules`);
		return;
	}
	assert.ok(packageModules.length > 0, `${label}: no package modules detected`);
	for (const file of packageModules)
	{
		const owner = moduleTier(file);
		assert.ok(owner, `${label}: unclassified bundled package module: ${file}`);
		assert.ok(owner.rank <= tier.rank, `${label}: ${tier.id} bundle includes ${owner.id} module: ${file}`);
	}
}

/** Exact aliases cannot capture sibling entry points or unexported package subpaths. */
export function localPackageAliases(packageRoot)
{
	return entryPoints.map(entry => {
		const specifier = '@neutrium/decimal' + (entry.exportPath === '.' ? '' : entry.exportPath.slice(1));
		const escaped = specifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return {
			find: new RegExp(`^${escaped}$`),
			replacement: resolve(packageRoot, packageExports[entry.exportPath].import)
		};
	});
}

// A local package root measures freshly compiled output without packing/installing it.
// Packed-consumer validation leaves this unset so package export resolution is still tested.
export async function buildBrowserBundle(consumerRoot, fixture, localPackageRoot)
{
	const packageRoot = localPackageRoot ?? join(consumerRoot, 'node_modules/@neutrium/decimal');
	const result = await build({
		configFile: false, root: consumerRoot, publicDir: false, logLevel: 'silent',
		...(localPackageRoot ? { resolve: { alias: localPackageAliases(localPackageRoot) } } : {}),
		build: {
			write: false, target: 'es2022', minify: true, modulePreload: false,
			copyPublicDir: false, reportCompressedSize: false,
			rolldownOptions: { input: join(consumerRoot, 'browser', `${fixture}.ts`), output: { format: 'iife', name: 'DecimalPackageValidation' } }
		}
	});
	const outputs = (Array.isArray(result) ? result : [result]).flatMap(item => item.output)
		.filter(output => output.type === 'chunk' && output.isEntry);
	assert.equal(outputs.length, 1, 'Expected exactly one browser bundle');
	const { code, modules } = outputs[0];
	return { code, bytes: Buffer.byteLength(code), packageModules: normalizePackageModules(Object.keys(modules), [resolve(packageRoot), realpathSync(packageRoot)]) };
}
