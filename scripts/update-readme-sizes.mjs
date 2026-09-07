import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { entryPoints } from './tier-metadata.mjs';
import { buildBrowserBundle, assertBundleTier } from './lib/bundle-measurement.mjs';
import { updateTierSizeTable } from './lib/readme-tier-sizes.mjs';

const root = resolve(import.meta.dirname, '..');
const fixtures = resolve(root, 'scripts/fixtures/package-consumer');
const sizes = {};
// Finish every measurement before updating the README. Vite writes no bundle files.
for (const entry of entryPoints)
{
	const { bytes, packageModules } = await buildBrowserBundle(fixtures, entry.id, root);
	assertBundleTier(packageModules, entry.tier, entry.id);
	sizes[entry.id] = bytes;
	console.log(`${entry.id}: ${bytes} bytes (${(bytes / 1024).toFixed(2)} KiB)`);
}
const path = resolve(root, 'README.md');
const current = readFileSync(path, 'utf8');
const expected = updateTierSizeTable(current, sizes);
if (current !== expected)
{
	if (process.argv.includes('--check')) throw new Error('README sizes are stale. Run pnpm run build.');
	writeFileSync(path, expected);
}
console.log('README tier sizes are synchronized.');
