import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { installConsumer, validateNodeConsumer, validateBrowserConsumers, validateInstalledPackage } from './lib/package-validation.mjs';

const repositoryRoot = resolve(import.meta.dirname, '..');
const temporaryRoot = mkdtempSync(join(tmpdir(), 'neutrium-decimal-package-'));
try
{
	const consumerRoot = installConsumer(repositoryRoot, temporaryRoot);
	validateInstalledPackage(consumerRoot);
	validateNodeConsumer(repositoryRoot, consumerRoot);
	await validateBrowserConsumers(consumerRoot);
}
finally
{
	rmSync(temporaryRoot, { recursive: true, force: true });
}
