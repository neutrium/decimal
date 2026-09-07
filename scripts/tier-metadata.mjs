// Authoritative feature tiers. Paths are repository-relative; kernel paths are relative to src/.
export const tiers = [
	{
		id: 'core', className: 'CoreDecimal', parent: 'DecimalLike', parentFile: 'src/DecimalBase.ts',
		description: 'Representation, parsing, comparison, predicates, and string/number formatting',
		kernelPaths: ['methods/compare/', 'methods/utils/', 'methods/to/'],
		infrastructure: [
			'src/CalculationContext.ts', 'src/DecimalBase.ts', 'src/DecimalEnvironment.ts',
			'src/DecimalLimits.ts', 'src/DecimalState.ts', 'src/InternalConstants.ts',
			'src/KernelDecimal.ts', 'src/config/DecimalConfig.ts',
			'src/config/DecimalConfigNormalizer.ts', 'src/config/DefaultConfig.ts',
			'src/config/RoundingModes.ts', 'src/config/RoundingCodes.ts', 'src/errors.ts', 'src/initialise-decimal.ts'
		],
		budget: { bytes: 20 * 1024 }
	},
	{
		id: 'arithmetic', className: 'ArithmeticDecimal', parent: 'CoreDecimal', parentFile: 'src/CoreDecimal.ts',
		description: 'Core plus arithmetic, rounding, shifting, and fractions',
		kernelPaths: ['methods/arithmetic/', 'methods/rounding/', 'methods/to/to-dp.ts', 'methods/to/to-significant-digits.ts', 'methods/to/to-fraction.ts'],
		infrastructure: [],
		budget: { bytes: 32 * 1024 }
	},
	{
		id: 'scientific', className: 'ScientificDecimal', parent: 'ArithmeticDecimal', parentFile: 'src/ArithmeticDecimal.ts',
		description: 'Arithmetic plus powers, logarithms, trigonometry, `PI`, and `atan2` (the complete API)',
		kernelPaths: ['methods/power/', 'methods/exponential/', 'methods/trigonometry/'],
		infrastructure: ['src/ConstantCache.ts', 'src/constants.ts'],
		budget: { bytes: 50 * 1024 }
	}
].map((tier, rank) => ({ ...tier, rank, source: `src/${tier.id}.ts`, facade: `src/${tier.className}.ts` }));

export const canonicalTier = tiers.at(-1);
export const entryPoints = [
	{ id: 'root', source: 'src/index.ts', exportPath: '.', tier: canonicalTier },
	...tiers.map(tier => ({ id: tier.id, source: tier.source, exportPath: `./${tier.id}`, tier }))
];
export const compatibilityModules = ['src/Decimal.ts'];

export const packageExports = Object.fromEntries(entryPoints.map(entry => {
	const name = entry.source.slice(4, -3);
	return [entry.exportPath, { types: `./dist/${name}.d.ts`, import: `./dist/${name}.js`, default: `./dist/${name}.js` }];
}));

export function kernelTier(sourcePath)
{
	// More specific paths take precedence over a directory default.
	const matches = tiers.flatMap(tier => tier.kernelPaths
		.filter(path => path.endsWith('/') ? sourcePath.startsWith(path) : sourcePath === path)
		.map(path => ({ tier, length: path.length })));
	return matches.sort((a, b) => b.length - a.length)[0]?.tier;
}

/** Classify every source module, including shared infrastructure, by its minimum feature tier. */
export function moduleTier(file)
{
	return tiers.find(tier => tier.facade === file || tier.infrastructure.includes(file)) ??
		entryPoints.find(entry => entry.source === file)?.tier ??
		(compatibilityModules.includes(file) ? canonicalTier :
			file.startsWith('src/') ? kernelTier(file.slice(4)) : undefined);
}
