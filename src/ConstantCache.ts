import type { CalculationContext } from './CalculationContext.js';
import type { Decimal } from './Decimal.js';
import { LN10_STR, PI_STR } from './constants.js';

const ln10Templates = new WeakMap<typeof Decimal, Decimal>();
const piTemplates = new WeakMap<typeof Decimal, Decimal>();

/** @internal Return an independent LN10 value cloned from a lazily parsed template. */
export function getCachedLn10(context : CalculationContext) : Decimal
{
	return cloneCachedConstant(context, LN10_STR, ln10Templates);
}

/** @internal Return an independent PI value cloned from a lazily parsed template. */
export function getCachedPi(context : CalculationContext) : Decimal
{
	return cloneCachedConstant(context, PI_STR, piTemplates);
}

function cloneCachedConstant(
	context : CalculationContext,
	source : string,
	cache : WeakMap<typeof Decimal, Decimal>
) : Decimal
{
	const Constructor = context.Constructor;
	let template = cache.get(Constructor);

	if (!template)
	{
		template = context.create(source);
		cache.set(Constructor, template);
	}

	return context.create(template);
}
