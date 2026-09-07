import { resolve } from 'node:path';
import { buildSourceGraph } from './lib/module-graph.mjs';
import { validateArchitecture } from './lib/architecture.mjs';

const graph = buildSourceGraph(resolve(import.meta.dirname, '..'));
const violations = validateArchitecture(graph);
if (violations.length) throw new Error('Architecture boundary violations:\n' + violations.map(item => '  - ' + item).join('\n'));
console.log(`Architecture graph passed: ${graph.size} modules; exhaustive tier classification, facade and coefficient isolation, tier reachability, inheritance, and runtime cycles checked.`);
