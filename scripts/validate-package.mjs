import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { buildSync } from 'esbuild';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'neutrium-decimal-package-'));
const consumerRoot = join(temporaryRoot, 'consumer');
const npmCache = join(temporaryRoot, 'npm-cache');
const browserBundleBudget = {
	bytes: 50 * 1024,
	reachablePackageModules: 80
};

function getBundleStats(buildResult)
{
	const outputs = Object.values(buildResult.metafile.outputs);
	if (outputs.length !== 1) throw new Error('Expected exactly one browser bundle output');

	const output = outputs[0];
	const packageModules = Object.keys(output.inputs).filter(input =>
		input.replaceAll('\\', '/').includes('node_modules/@neutrium/decimal/dist/')
	);

	return { bytes: output.bytes, packageModules };
}

try
{
	const packOutput = execFileSync(
		'npm',
		['pack', '--ignore-scripts', '--json', '--pack-destination', temporaryRoot, '--cache', npmCache],
		{ cwd: repositoryRoot, encoding: 'utf8' }
	);
	const [{ filename }] = JSON.parse(packOutput);
	const archive = join(temporaryRoot, filename);

	mkdirSync(consumerRoot);
	writeFileSync(join(consumerRoot, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
	execFileSync(
		'npm',
		['install', archive, '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', '--cache', npmCache],
		{ cwd: consumerRoot, stdio: 'inherit' }
	);

	const consumerSource = [
		"import { Decimal } from '@neutrium/decimal';",
		"import type { DecimalValue, RoundingMode } from '@neutrium/decimal';",
		"const input: DecimalValue = '1.25';",
		"const mode: RoundingMode = 'half-even';",
		"const result: Decimal = new Decimal(input).mul(2).toDP(1, mode);",
		"if (result.toString() !== '2.5') throw new Error('Unexpected packed-package result');",
		"if ('d' in result || 'e' in result || 's' in result) throw new Error('Decimal state is publicly exposed');",
		"if (!Object.isFrozen(Decimal.config)) throw new Error('Decimal config snapshot is mutable');",
		"if ('precision' in Decimal || 'rounding' in Decimal) throw new Error('Legacy configuration aliases are exposed');",
		"for (const name of ['createForCalculation', 'createResultForCalculation', 'getCalculationConstructor']) {",
		"  if (Object.hasOwn(Decimal, name)) throw new Error('Internal allocation hook is publicly exposed: ' + name);",
		"}"
	].join('\n');

	writeFileSync(join(consumerRoot, 'index.ts'), consumerSource);

	writeFileSync(
		join(consumerRoot, 'index.mjs'),
		consumerSource.replace(/^import type .*;$/m, '').replace(/: (DecimalValue|RoundingMode|Decimal)/g, '')
	);

	writeFileSync(
		join(consumerRoot, 'browser-entry.mjs'),
		[
			"import { Decimal } from '@neutrium/decimal';",
			"const result = new Decimal('1.25').mul(2).toDP(1, 'half-even');",
			"if (result.toString() !== '2.5') throw new Error('Unexpected browser-bundle result');",
			"globalThis.decimalBrowserSmokeResult = result.toString();"
		].join('\n')
	);

	writeFileSync(
		join(consumerRoot, 'browser-tree-shaking-entry.mjs'),
		[
			"import '@neutrium/decimal';",
			"globalThis.decimalTreeShakingSmokeResult = 'ok';"
		].join('\n')
	);

	const typeScriptCli = join(repositoryRoot, 'node_modules', 'typescript', 'bin', 'tsc');

	execFileSync(
		process.execPath,
		[
			typeScriptCli,
			'--noEmit',
			'--strict',
			'--module', 'Node16',
			'--moduleResolution', 'Node16',
			'--target', 'ES2022',
			join(consumerRoot, 'index.ts')
		],
		{ cwd: consumerRoot, stdio: 'inherit' }
	);

	execFileSync(process.execPath, [join(consumerRoot, 'index.mjs')], {
		cwd: consumerRoot,
		stdio: 'inherit'
	});

	const browserBundle = join(consumerRoot, 'browser-bundle.js');
	const browserBuild = buildSync({
		absWorkingDir: consumerRoot,
		entryPoints: ['browser-entry.mjs'],
		outfile: browserBundle,
		bundle: true,
		platform: 'browser',
		format: 'iife',
		target: 'es2022',
		minify: true,
		treeShaking: true,
		metafile: true,
		logLevel: 'silent'
	});

	const browserBundleStats = getBundleStats(browserBuild);

	if (browserBundleStats.bytes > browserBundleBudget.bytes)
	{
		throw new Error(
			`Browser bundle is ${browserBundleStats.bytes} bytes; budget is ${browserBundleBudget.bytes} bytes`
		);
	}

	if (browserBundleStats.packageModules.length > browserBundleBudget.reachablePackageModules)
	{
		throw new Error(
			`Browser bundle reaches ${browserBundleStats.packageModules.length} package modules; ` +
			`budget is ${browserBundleBudget.reachablePackageModules}`
		);
	}

	const browserContext = Object.create(null);

	runInNewContext(readFileSync(browserBundle, 'utf8'), browserContext, {
		filename: browserBundle
	});

	if (browserContext.decimalBrowserSmokeResult !== '2.5')
	{
		throw new Error('Browser bundle did not expose the expected result');
	}

	const treeShakenBundle = join(consumerRoot, 'browser-tree-shaken-bundle.js');
	const treeShakenBuild = buildSync({
		absWorkingDir: consumerRoot,
		entryPoints: ['browser-tree-shaking-entry.mjs'],
		outfile: treeShakenBundle,
		bundle: true,
		platform: 'browser',
		format: 'iife',
		target: 'es2022',
		minify: true,
		treeShaking: true,
		metafile: true,
		logLevel: 'silent'
	});
	const treeShakenBundleStats = getBundleStats(treeShakenBuild);

	if (treeShakenBundleStats.packageModules.length !== 0)
	{
		throw new Error(
			`Unused package import left ${treeShakenBundleStats.packageModules.length} reachable package modules`
		);
	}

	if (treeShakenBundleStats.bytes > 128)
	{
		throw new Error(`Tree-shaken browser bundle is unexpectedly large: ${treeShakenBundleStats.bytes} bytes`);
	}

	const treeShakingContext = Object.create(null);

	runInNewContext(readFileSync(treeShakenBundle, 'utf8'), treeShakingContext, {
		filename: treeShakenBundle
	});

	if (treeShakingContext.decimalTreeShakingSmokeResult !== 'ok')
	{
		throw new Error('Tree-shaken browser bundle did not execute correctly');
	}

	const installedManifest = JSON.parse(readFileSync(
		join(consumerRoot, 'node_modules', '@neutrium', 'decimal', 'package.json'),
		'utf8'
	));

	if (installedManifest.types !== './dist/index.d.ts')
	{
		throw new Error('Packed package does not expose the expected declaration entry point');
	}

	if (installedManifest.sideEffects !== false)
	{
		throw new Error('Packed package must declare that it has no side effects');
	}

	const installedRoot = join(consumerRoot, 'node_modules', '@neutrium', 'decimal');
	const declarationMapPath = join(installedRoot, 'dist', 'Decimal.d.ts.map');
	const declarationMap = JSON.parse(readFileSync(declarationMapPath, 'utf8'));

	if (Object.hasOwn(declarationMap, 'sourcesContent'))
	{
		throw new Error('Declaration maps duplicate source content already included in the package');
	}

	const mappedSource = resolve(dirname(declarationMapPath), declarationMap.sources[0]);

	if (!existsSync(mappedSource))
	{
		throw new Error('Declaration map source is missing from the packed package');
	}

	if (existsSync(join(installedRoot, 'scripts', 'benchmark.mjs')))
	{
		throw new Error('Development benchmark script should not be published');
	}

}
finally
{
	rmSync(temporaryRoot, { recursive: true, force: true });
}
