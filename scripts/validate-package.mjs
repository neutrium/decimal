import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'neutrium-decimal-package-'));
const consumerRoot = join(temporaryRoot, 'consumer');
const npmCache = join(temporaryRoot, 'npm-cache');

try {
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
		"if (result.toString() !== '2.5') throw new Error('Unexpected packed-package result');"
	].join('\n');

	writeFileSync(join(consumerRoot, 'index.ts'), consumerSource);
	writeFileSync(
		join(consumerRoot, 'index.mjs'),
		consumerSource.replace(/^import type .*;$/m, '').replace(/: (DecimalValue|RoundingMode|Decimal)/g, '')
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

	const installedManifest = JSON.parse(readFileSync(
		join(consumerRoot, 'node_modules', '@neutrium', 'decimal', 'package.json'),
		'utf8'
	));
	if (installedManifest.types !== './dist/index.d.ts') {
		throw new Error('Packed package does not expose the expected declaration entry point');
	}

	const installedRoot = join(consumerRoot, 'node_modules', '@neutrium', 'decimal');
	const declarationMapPath = join(installedRoot, 'dist', 'Decimal.d.ts.map');
	const declarationMap = JSON.parse(readFileSync(declarationMapPath, 'utf8'));
	const mappedSource = resolve(dirname(declarationMapPath), declarationMap.sources[0]);
	if (!existsSync(mappedSource)) {
		throw new Error('Declaration map source is missing from the packed package');
	}
} finally {
	rmSync(temporaryRoot, { recursive: true, force: true });
}
