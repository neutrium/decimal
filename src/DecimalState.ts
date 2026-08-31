import type { Decimal } from './Decimal.js';

/** Read-only view used for receivers and caller-owned operands. */
export interface ReadonlyDecimalState
{
	readonly d : readonly number[] | null;
	readonly e : number;
	readonly s : number;
}

/** Mutable representation owned by one construction or calculation. */
export interface DecimalState
{
	d : number[] | null;
	e : number;
	s : number;
}

/** @internal Module-private capability used to access native private Decimal state. */
export const decimalStateAccess : unique symbol = Symbol('Decimal state access');

type DecimalStateProvider = {
	readonly [decimalStateAccess]: () => DecimalState;
};

export function createDecimalState() : DecimalState
{
	return { d: null, e: NaN, s: NaN };
}

export function getDecimalState(value : Decimal) : ReadonlyDecimalState
{
	return getStateProvider(value)[decimalStateAccess]();
}

/** Obtain mutable state only for a value exclusively owned by the active calculation. */
export function getMutableDecimalState(value : Decimal) : DecimalState
{
	return getStateProvider(value)[decimalStateAccess]();
}

function getStateProvider(value : Decimal) : DecimalStateProvider
{
	const provider = value as Decimal & Partial<DecimalStateProvider>;
	if (!provider[decimalStateAccess]) throw new TypeError('Invalid Decimal value');
	return provider as Decimal & DecimalStateProvider;
}
