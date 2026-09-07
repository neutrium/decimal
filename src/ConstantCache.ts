import type { CalculationContext } from './CalculationContext.js';
import type { KernelDecimal, KernelDecimalConstructor } from './KernelDecimal.js';
import { LN10_STR, PI_STR } from './constants.js';

const ln10Templates = new WeakMap<KernelDecimalConstructor, KernelDecimal>();
const piTemplates = new WeakMap<KernelDecimalConstructor, KernelDecimal>();

/** @internal Return an independent LN10 value cloned from a lazily parsed template. */
export function getCachedLn10(context : CalculationContext) : KernelDecimal
{
	return cloneCachedConstant(context, LN10_STR, ln10Templates);
}

/** @internal Return an independent PI value cloned from a lazily parsed template. */
export function getCachedPi(context : CalculationContext) : KernelDecimal
{
	return cloneCachedConstant(context, PI_STR, piTemplates);
}

function cloneCachedConstant(
	context : CalculationContext,
	source : string,
	cache : WeakMap<KernelDecimalConstructor, KernelDecimal>
) : KernelDecimal
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
