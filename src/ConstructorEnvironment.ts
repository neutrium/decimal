import { CalculationContext } from './CalculationContext.js';
import type { Decimal } from './Decimal.js';
import type { DecimalRuntime } from './DecimalRuntime.js';
import type { DecimalConfig, DecimalConfigInput } from './config/DecimalConfig.js';
import { normaliseDecimalConfig } from './config/DecimalConfigNormalizer.js';

/** @internal Constructor-scoped configuration, allocation eligibility, and context caching. */
export class ConstructorEnvironment
{
	readonly #runtime : DecimalRuntime;
	readonly #defaultContexts = new WeakMap<typeof Decimal, CalculationContext>();
	readonly #calculationConstructors = new WeakSet<typeof Decimal>();
	readonly #configs = new WeakMap<typeof Decimal, Readonly<DecimalConfig>>();

	constructor(
		BaseConstructor : typeof Decimal,
		runtime : DecimalRuntime,
		defaultConfig : Readonly<DecimalConfig>
	) {
		this.#runtime = runtime;
		this.#calculationConstructors.add(BaseConstructor);
		this.#configs.set(BaseConstructor, Object.freeze({ ...defaultConfig }));
	}

	getConfig(Constructor : typeof Decimal) : Readonly<DecimalConfig>
	{
		let current : typeof Decimal | null = Constructor;

		while (current)
		{
			const config = this.#configs.get(current);
			if (config) return config;
			current = Object.getPrototypeOf(current) as typeof Decimal | null;
		}

		throw new TypeError('Decimal configuration is not initialized');
	}

	setConfig(Constructor : typeof Decimal, input : DecimalConfigInput) : void
	{
		this.#configs.set(Constructor, normaliseDecimalConfig(this.getConfig(Constructor), input));
		this.#defaultContexts.delete(Constructor);
	}

	registerClone(
		Constructor : typeof Decimal,
		Source : typeof Decimal,
		input : DecimalConfigInput
	) : void
	{
		this.#calculationConstructors.add(Constructor);
		this.#configs.set(Constructor, Object.freeze({ ...this.getConfig(Source) }));
		this.setConfig(Constructor, input);
	}

	getCalculationConstructor(Constructor : typeof Decimal) : typeof Decimal
	{
		let current : typeof Decimal | null = Constructor;

		while (current && !this.#calculationConstructors.has(current))
		{
			current = Object.getPrototypeOf(current) as typeof Decimal | null;
		}

		if (!current)
		{
			throw new TypeError('Decimal calculation constructor is not initialized');
		}

		return current;
	}

	getDefaultContext(Constructor : typeof Decimal) : CalculationContext
	{
		let context = this.#defaultContexts.get(Constructor);
		const config = this.getConfig(Constructor);

		// Inherited configuration changes replace the snapshot identity and invalidate this cache.
		if (!context || context.config !== config)
		{
			context = new CalculationContext(Constructor, config, true, undefined, this.#runtime);
			this.#defaultContexts.set(Constructor, context);
		}

		return context;
	}
}
