import { tiers, canonicalTier } from '../tier-metadata.mjs';

/** Replace only the generated README table; all measurements must be present. */
export function updateTierSizeTable(text, sizes)
{
	const start = '<!-- tier-table:start -->';
	const end = '<!-- tier-table:end -->';
	const first = text.indexOf(start), last = text.indexOf(end);
	if (first < 0 || last < first || text.indexOf(start, first + start.length) !== -1 ||
		text.indexOf(end, last + end.length) !== -1)
		throw new Error('README must contain exactly one ordered pair of tier-table markers');
	const row = (id, entry, description, budget) => {
		const bytes = sizes[id];
		if (!Number.isSafeInteger(bytes) || bytes <= 0) throw new Error(`Missing or invalid bundle size: ${id}`);
		return `| \`${entry}\` | ${description} | ${(bytes / 1024).toFixed(2)} KiB | ${budget / 1024} KiB |`;
	};
	const rows = tiers.map(tier => row(tier.id, `@neutrium/decimal/${tier.id}`, tier.description, tier.budget.bytes));
	rows.push(row('root', '@neutrium/decimal', `Alias for the ${canonicalTier.id} tier; retained for compatibility`, canonicalTier.budget.bytes));
	const table = [start, '| Entry point | Includes | Minified size | Budget |', '| --- | --- | ---: | ---: |', ...rows, end].join('\n');
	return text.slice(0, first) + table + text.slice(last + end.length);
}
