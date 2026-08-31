import type { CalculationContext } from './CalculationContext.js';
import type { Decimal, DecimalValue } from './Decimal.js';
import type { DecimalState } from './DecimalState.js';

/** @internal Module-private capability used by contexts to obtain the Decimal runtime. */
export const decimalRuntimeAccess : unique symbol = Symbol('Decimal runtime access');

type DecimalRuntimeProvider = {
	readonly [decimalRuntimeAccess]: () => DecimalRuntime;
};

/** Capabilities required by calculation contexts without importing the public facade. */
export interface DecimalRuntime
{
	readonly isDecimal: (value : unknown) => value is Decimal;
	readonly resolveCalculationConstructor: (Constructor : typeof Decimal) => typeof Decimal;
	readonly createForCalculation: (
		Constructor : typeof Decimal,
		value : DecimalValue,
		context : CalculationContext
	) => Decimal;
	readonly createResultForCalculation: (
		Constructor : typeof Decimal,
		state : DecimalState
	) => Decimal;
}

/** @internal Resolve the inherited runtime capability of a Decimal constructor. */
export function getDecimalRuntime(Constructor : typeof Decimal) : DecimalRuntime
{
	const provider = Constructor as typeof Decimal & Partial<DecimalRuntimeProvider>;
	const runtime = provider[decimalRuntimeAccess]?.();

	if (!runtime)
	{
		throw new TypeError('Decimal runtime is not initialized');
	}

	return runtime;
}
