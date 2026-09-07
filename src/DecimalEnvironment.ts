import { CalculationContext } from './CalculationContext.js';
import { DecimalLike, type DecimalValue } from './DecimalBase.js';
import type { KernelDecimal, KernelDecimalConstructor } from './KernelDecimal.js';
import type { DecimalState } from './DecimalState.js';
import type { DecimalConfig, DecimalConfigInput } from './config/DecimalConfig.js';
import { normaliseDecimalConfig } from './config/DecimalConfigNormalizer.js';

/** @internal Construction capability used only by the environment and core constructor. */
export const calculationConstruction : unique symbol = Symbol('Decimal calculation construction');
/** @internal Construction capability for adopting exclusively owned result state. */
export const resultStateConstruction : unique symbol = Symbol('Decimal result-state construction');
const calculationConstructor = Symbol('Decimal calculation constructor');

type InternalConstructor = new (
	value : DecimalValue | DecimalState,
	token : symbol,
	context ?: CalculationContext
) => KernelDecimal;

/** Configuration, context caching, branding, and allocation for one Decimal class family. */
export class DecimalEnvironment
{
	readonly #configs = new WeakMap<KernelDecimalConstructor, Readonly<DecimalConfig>>();
	readonly #contexts = new WeakMap<KernelDecimalConstructor, CalculationContext>();

	constructor(Base : KernelDecimalConstructor, config : Readonly<DecimalConfig>)
	{
		this.#configs.set(Base, Object.freeze({ ...config }));
		this.registerCalculationConstructor(Base);
		Object.freeze(this);
	}

	getConfig(Constructor : KernelDecimalConstructor) : Readonly<DecimalConfig>
	{
		let current : KernelDecimalConstructor | null = Constructor;

		while (current)
		{
			const config = this.#configs.get(current);
			if (config)
			{
				return config;
			}

			current = Object.getPrototypeOf(current) as KernelDecimalConstructor | null;
		}

		throw new TypeError('Decimal configuration is not initialized');
	}

	setConfig(Constructor : KernelDecimalConstructor, input : DecimalConfigInput) : void
	{
		// An explicit update isolates a subclass even when its settings are unchanged.
		this.#configs.set(Constructor, normaliseDecimalConfig(this.getConfig(Constructor), input));
	}

	registerClone(Constructor : KernelDecimalConstructor, Source : KernelDecimalConstructor, input : DecimalConfigInput) : void
	{
		const config = normaliseDecimalConfig(this.getConfig(Source), input);
		this.registerCalculationConstructor(Constructor);
		this.#configs.set(Constructor, config);
	}

	private registerCalculationConstructor(Constructor : KernelDecimalConstructor) : void
	{
		// Ordinary static inheritance resolves arbitrary subclasses to the nearest safe tier or clone.
		Object.defineProperty(Constructor, calculationConstructor, { value: Constructor });
	}

	getCalculationConstructor(Constructor : KernelDecimalConstructor) : KernelDecimalConstructor
	{
		const result = (Constructor as KernelDecimalConstructor & {
			[calculationConstructor]?: KernelDecimalConstructor
		})[calculationConstructor];

		if (!result || !this.#configs.has(result))
		{
			throw new TypeError('Decimal calculation constructor is not initialized');
		}

		return result;
	}

	getDefaultContext(Constructor : KernelDecimalConstructor) : CalculationContext
	{
		let context = this.#contexts.get(Constructor);
		const config = this.getConfig(Constructor);

		// Snapshot identity handles both direct and inherited configuration changes.
		if (!context || context.config !== config)
		{
			context = new CalculationContext(Constructor, config);
			this.#contexts.set(Constructor, context);
		}

		return context;
	}

	isDecimal(value : unknown) : value is KernelDecimal
	{
		return value instanceof DecimalLike;
	}

	createForCalculation(Constructor : KernelDecimalConstructor, value : DecimalValue, context : CalculationContext) : KernelDecimal
	{
		return new (Constructor as unknown as InternalConstructor)(value, calculationConstruction, context);
	}

	createResultForCalculation(Constructor : KernelDecimalConstructor, state : DecimalState) : KernelDecimal
	{
		return new (Constructor as unknown as InternalConstructor)(state, resultStateConstruction);
	}
}
