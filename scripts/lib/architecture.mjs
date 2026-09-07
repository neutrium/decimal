import { basename } from 'node:path';
import { tiers, entryPoints, compatibilityModules, moduleTier } from '../tier-metadata.mjs';
import { findDependencyPath, runtimeCycles } from './module-graph.mjs';

/** Validate infrastructure ownership against the same graph used for dependency checks. */
export function validateInfrastructure(graph, catalogue = tiers)
{
	const violations = [];
	const owners = new Map();
	for (const tier of catalogue)
	{
		for (const file of tier.infrastructure)
		{
			if (owners.has(file))
				violations.push(`Duplicate infrastructure classification: ${file} (${owners.get(file)}, ${tier.id})`);
			else owners.set(file, tier.id);
			if (!graph.has(file)) violations.push(`Stale infrastructure classification: ${file}`);
		}
	}
	return violations;
}

export function validateArchitecture(graph)
{
	const violations = [...graph.values()].flatMap(node => node.problems).concat(validateInfrastructure(graph));
	const publicModules = new Set([...tiers.map(tier => tier.facade), ...entryPoints.map(entry => entry.source), ...compatibilityModules]);
	const rank = file => moduleTier(file)?.rank;
	const circularOperations = new Set(['acos', 'acosh', 'asin', 'asinh', 'atan', 'atan2', 'atanh', 'cos', 'cosh', 'sin', 'sinh', 'tan', 'tanh']);
	const isCoefficientModule = file => /^src\/methods\/(arithmetic|utils)\/coefficients\//.test(file);
	const coefficientSupport = new Set(['src/InternalConstants.ts', 'src/config/RoundingCodes.ts', 'src/methods/utils/digit-array.ts', 'src/methods/utils/get-base-10-exponent.ts']);

	for (const [file, node] of graph)
	{
		if (isCoefficientModule(file))
		{
			const path = findDependencyPath(graph, file, target => !isCoefficientModule(target) && !coefficientSupport.has(target));
			if (path) violations.push(`Pure coefficient module reaches a non-coefficient dependency (including types): ${path.join(' -> ')}`);
		}

		if (!publicModules.has(file))
		{
			const path = findDependencyPath(graph, file, target => publicModules.has(target));
			if (path) violations.push(`Internal module reaches a public facade (including types): ${path.join(' -> ')}`);
		}

		const sourceRank = rank(file);

		if (sourceRank === undefined)
		{
			violations.push(`Unclassified source module: ${file}; assign a tier in scripts/tier-metadata.mjs`);
		}
		else
		{
			const path = findDependencyPath(graph, file, target => rank(target) > sourceRank, true);
			if (path) violations.push(`Feature tier reaches a richer runtime dependency: ${path.join(' -> ')}`);
		}

		if (file.startsWith('src/methods/trigonometry/'))
		{
			for (const name of node.exportedFunctions)
			{
				if (circularOperations.has(name) && name !== basename(file, '.ts'))
				{
					violations.push(`${file} exports ${name}; operations require focused modules`);
				}
			}
		}
	}

	for (const tier of tiers)
	{
		if (graph.get(tier.facade)?.parents.get(tier.className) !== tier.parentFile)
		{
			violations.push(`${tier.facade}: ${tier.className} must extend ${tier.parent} from ${tier.parentFile}`);
		}
	}

	for (const cycle of runtimeCycles(graph))
	{
		violations.push(`Runtime dependency cycle: ${cycle.join(' -> ')}`);
	}

	return violations;
}
