import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { buildBrowserBundle, assertBundleTier } from './bundle-measurement.mjs';
import { entryPoints, packageExports } from '../tier-metadata.mjs';

export function installConsumer(repositoryRoot, temporaryRoot)
{
	const consumerRoot = join(temporaryRoot, 'consumer');
	const npmCache = join(temporaryRoot, 'npm-cache');
	const packOutput = execFileSync('npm',
		['pack', '--ignore-scripts', '--json', '--pack-destination', temporaryRoot, '--cache', npmCache],
		{ cwd: repositoryRoot, encoding: 'utf8' });
	const [{ filename }] = JSON.parse(packOutput);
	cpSync(join(repositoryRoot, 'scripts/fixtures/package-consumer'), consumerRoot, { recursive: true });
	execFileSync('npm', ['install', join(temporaryRoot, filename), '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', '--cache', npmCache],
		{ cwd: consumerRoot, stdio: 'inherit' });
	return consumerRoot;
}

export function validateNodeConsumer(repositoryRoot, consumerRoot)
{
	const compiler = join(repositoryRoot, 'node_modules/typescript/bin/tsc');
	execFileSync(process.execPath, [compiler, '-p', join(consumerRoot, 'tsconfig.json')], { cwd: consumerRoot, stdio: 'inherit' });
	for (const entry of ['index', 'tiers'])
		execFileSync(process.execPath, [join(consumerRoot, 'compiled', `${entry}.js`)], { cwd: consumerRoot, stdio: 'inherit' });
}

export async function validateBrowserConsumers(consumerRoot)
{
	for (const { id, tier } of [...entryPoints, { id: 'unused', tier: undefined }])
	{
		const stats = await buildBrowserBundle(consumerRoot, id);
		const budget = tier?.budget.bytes ?? 128;
		assert.ok(stats.bytes <= budget, `${id}: ${stats.bytes} bytes exceeds ${budget}-byte budget`);
		assertBundleTier(stats.packageModules, tier, id);
		const context = Object.create(null);
		runInNewContext(stats.code, context, { filename: `browser-${id}.js` });
		assert.ok(context.decimalPackageSmokeResult, `${id}: browser fixture did not execute its assertions`);
		if (id === 'unused') assert.equal(context.decimalPackageSmokeResult, 'ok');
		console.log(`${id}: ${stats.bytes} bytes, ${stats.packageModules.length} package modules`);
	}
}

export function validateInstalledPackage(consumerRoot)
{
	const installedRoot = join(consumerRoot, 'node_modules/@neutrium/decimal');
	const manifest = JSON.parse(readFileSync(join(installedRoot, 'package.json'), 'utf8'));
	assert.deepEqual(manifest.exports, packageExports, 'Packed exports differ from tier metadata');
	assert.equal(manifest.types, packageExports['.'].types);
	assert.equal(manifest.sideEffects, false);
	for (const entry of entryPoints)
	{
		const declaration = resolve(installedRoot, packageExports[entry.exportPath].types);
		const map = JSON.parse(readFileSync(`${declaration}.map`, 'utf8'));
		assert.equal(Object.hasOwn(map, 'sourcesContent'), false, 'Declaration maps duplicate packaged sources');
		for (const source of map.sources) assert.ok(existsSync(resolve(dirname(declaration), source)), 'Declaration-map source missing');
	}
	assert.equal(existsSync(join(installedRoot, 'scripts')), false, 'Development scripts and fixtures must not be published');
}
