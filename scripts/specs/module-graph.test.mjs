import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dirname, posix } from 'node:path';
import { parseModule, findDependencyPath, runtimeCycles } from '../lib/module-graph.mjs';
import { validateArchitecture, validateInfrastructure } from '../lib/architecture.mjs';
import { moduleTier } from '../tier-metadata.mjs';

function graphOf(sources)
{
	return new Map(Object.entries(sources).map(([file, text]) => [file, parseModule(file, text, (importer, specifier) => {
		const resolved = posix.normalize(`${dirname(importer)}/${specifier.replace(/\.js$/, '.ts')}`);
		return Object.hasOwn(sources, resolved) ? resolved : undefined;
	})]));
}

test('reports the complete path through a barrel to a richer tier', () => {
	const graph = graphOf({
		'src/core.ts': "export * from './helper.js';",
		'src/helper.ts': "export { sin } from './methods/trigonometry/sin.js';",
		'src/methods/trigonometry/sin.ts': 'export function sin() {}'
	});
	assert.deepEqual(findDependencyPath(graph, 'src/core.ts', file => file.endsWith('/sin.ts'), true),
		['src/core.ts', 'src/helper.ts', 'src/methods/trigonometry/sin.ts']);
	assert.ok(validateArchitecture(graph).some(message => message.includes('richer runtime dependency: src/core.ts -> src/helper.ts ->')));
});

test('distinguishes type-only imports and re-exports from runtime dependencies', () => {
	const graph = graphOf({
		'a.ts': "import type { A } from './b.js'; export type { B } from './c.js'; type C = import('./c.js').C;",
		'b.ts': '', 'c.ts': ''
	});
	assert.equal(findDependencyPath(graph, 'a.ts', file => file === 'c.ts', true), undefined);
	assert.deepEqual(findDependencyPath(graph, 'a.ts', file => file === 'c.ts'), ['a.ts', 'c.ts']);
});

test('runtime graph includes mixed imports, namespace re-exports, and dynamic imports', () => {
	const graph = graphOf({
		'a.ts': "import { type A, b } from './b.js'; export * as c from './c.js'; import('./d.js');",
		'b.ts': '', 'c.ts': '', 'd.ts': ''
	});
	assert.deepEqual(graph.get('a.ts').edges, ['b.ts', 'c.ts', 'd.ts'].map(target => ({ target, runtime: true })));
});

test('keeps side-effect imports and empty bindings in the runtime graph', () => {
	const graph = graphOf({ 'a.ts': "import './b.js'; import {} from './c.js';", 'b.ts': '', 'c.ts': '' });
	assert.ok(graph.get('a.ts').edges.every(edge => edge.runtime));
});

test('retains inline type bindings as runtime edges under verbatimModuleSyntax', () => {
	const graph = graphOf({ 'a.ts': "import { type B } from './b.js'; export { type C } from './c.js';", 'b.ts': '', 'c.ts': '' });
	assert.deepEqual(graph.get('a.ts').edges, ['b.ts', 'c.ts'].map(target => ({ target, runtime: true })));
});

test('internal modules cannot reach facade types through helpers', () => {
	const graph = graphOf({
		'src/methods/utils/helper.ts': "import type { Value } from '../../bridge.js';",
		'src/bridge.ts': "export type { Decimal as Value } from './scientific.js';",
		'src/scientific.ts': ''
	});
	assert.ok(validateArchitecture(graph).some(message => message.includes('src/methods/utils/helper.ts -> src/bridge.ts -> src/scientific.ts')));
});

test('finds runtime cycles but permits recursive type relationships', () => {
	const graph = graphOf({ 'a.ts': "export * from './b.js';", 'b.ts': "import './a.js';" });
	assert.deepEqual(runtimeCycles(graph), [['a.ts', 'b.ts', 'a.ts']]);
	const types = graphOf({ 'a.ts': "export type * from './b.js';", 'b.ts': "import './a.js';" });
	assert.deepEqual(runtimeCycles(types), []);
});

test('pure coefficient modules cannot reach context or state, even through type-only helpers', () => {
	for (const dependency of ['CalculationContext', 'DecimalState', 'KernelDecimal'])
	{
		const graph = graphOf({
			'src/methods/arithmetic/coefficients/divide.ts': "import type { Value } from '../../utils/coefficients/helper.js';",
			'src/methods/utils/coefficients/helper.ts': `export type { Value } from '../../../${dependency}.js';`,
			[`src/${dependency}.ts`]: ''
		});
		assert.ok(validateArchitecture(graph).some(message => message.includes(
			`Pure coefficient module reaches a non-coefficient dependency (including types): src/methods/arithmetic/coefficients/divide.ts -> src/methods/utils/coefficients/helper.ts -> src/${dependency}.ts`
		)));
	}
});

test('pure coefficient modules may share constants and digit-array primitives', () => {
	const graph = graphOf({
		'src/methods/arithmetic/coefficients/divide.ts': "import '../../../InternalConstants.js'; import '../../utils/digit-array.js';",
		'src/InternalConstants.ts': '',
		'src/methods/utils/digit-array.ts': ''
	});
	assert.ok(!validateArchitecture(graph).some(message => message.startsWith('Pure coefficient module')));
});

test('unclassified modules fail even when no entry point reaches them', () => {
	const graph = graphOf({ 'src/NewInfrastructure.ts': '', 'src/methods/new-feature/value.ts': '' });
	for (const file of graph.keys())
		assert.ok(validateArchitecture(graph).some(message => message.startsWith(`Unclassified source module: ${file};`)));
});

test('classifies infrastructure, compatibility entries, and specific kernel overrides', () => {
	for (const file of ['src/CalculationContext.ts', 'src/InternalConstants.ts', 'src/DecimalEnvironment.ts', 'src/core.ts'])
		assert.equal(moduleTier(file)?.id, 'core');
	assert.equal(moduleTier('src/methods/to/to-fraction.ts')?.id, 'arithmetic');
	assert.equal(moduleTier('src/methods/to/to-string.ts')?.id, 'core');
	for (const file of ['src/constants.ts', 'src/ConstantCache.ts', 'src/Decimal.ts', 'src/index.ts'])
		assert.equal(moduleTier(file)?.id, 'scientific');
	assert.equal(moduleTier('src/new.ts'), undefined);
});

test('lower tiers cannot reach scientific infrastructure through shared helpers', () => {
	for (const entry of ['core', 'arithmetic'])
	{
		const graph = graphOf({
			[`src/${entry}.ts`]: "import './InternalConstants.js';",
			'src/InternalConstants.ts': "import './ConstantCache.js';",
			'src/ConstantCache.ts': "import './constants.js';",
			'src/constants.ts': ''
		});
		assert.ok(validateArchitecture(graph).some(message => message.includes(
			`richer runtime dependency: src/${entry}.ts -> src/InternalConstants.ts -> src/ConstantCache.ts`
		)));
	}
});

test('scientific tables are forbidden even through coefficient support modules', () => {
	const graph = graphOf({
		'src/methods/arithmetic/coefficients/divide.ts': "import '../../../InternalConstants.js';",
		'src/InternalConstants.ts': "import './constants.js';",
		'src/constants.ts': ''
	});
	assert.ok(validateArchitecture(graph).some(message => message.startsWith('Pure coefficient module') &&
		message.endsWith('src/InternalConstants.ts -> src/constants.ts')));
});

test('coefficient rounding may depend on numeric codes but not public mode validation', () => {
	for (const module of ['RoundingCodes', 'RoundingModes'])
	{
		const graph = graphOf({
			'src/methods/utils/coefficients/round.ts': `import '../../../config/${module}.js';`,
			[`src/config/${module}.ts`]: ''
		});
		const forbidden = validateArchitecture(graph).some(message => message.startsWith('Pure coefficient module'));
		assert.equal(forbidden, module === 'RoundingModes');
	}
});

test('infrastructure checks reject duplicate ownership and stale paths using a supplied graph', () => {
	const graph = graphOf({ 'src/shared.ts': '' });
	const core = { id: 'core', infrastructure: ['src/shared.ts'] };
	assert.deepEqual(validateInfrastructure(graph, [core]), []);
	assert.deepEqual(validateInfrastructure(graph, [core, { id: 'scientific', infrastructure: ['src/shared.ts', 'src/missing.ts'] }]), [
		'Duplicate infrastructure classification: src/shared.ts (core, scientific)',
		'Stale infrastructure classification: src/missing.ts'
	]);
	assert.deepEqual(validateInfrastructure(graph, [{ ...core, infrastructure: ['src/shared.ts', 'src/shared.ts'] }]), [
		'Duplicate infrastructure classification: src/shared.ts (core, core)'
	]);
});

test('architecture validation includes infrastructure checks', () => {
	assert.ok(validateArchitecture(graphOf({})).includes('Stale infrastructure classification: src/InternalConstants.ts'));
});

test('missing and computed dependencies fail closed', () => {
	const graph = graphOf({ 'a.ts': "import './missing.js'; import(name);" });
	assert.equal(graph.get('a.ts').problems.length, 2);
});

test('resolves inheritance by imported file, including local aliases', () => {
	const graph = graphOf({ 'a.ts': "import { Base as Renamed } from './b.js'; export class Child extends Renamed {}", 'b.ts': '' });
	assert.equal(graph.get('a.ts').parents.get('Child'), 'b.ts');
});
