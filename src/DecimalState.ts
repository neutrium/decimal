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

/** @internal Module-private capability used to adopt calculation-owned Decimal state. */
export const decimalStateSetAccess : unique symbol = Symbol('Decimal state replacement');

/** @internal Minimal state capability shared internally by every Decimal feature tier. */
export type InternalDecimal = {
	readonly [decimalStateAccess]: () => DecimalState;
	readonly [decimalStateSetAccess]: (state : DecimalState) => void;
};

/** @internal */
export function createDecimalState() : DecimalState
{
	return { d: null, e: NaN, s: NaN };
}

/** @internal */
export function getDecimalState(value : InternalDecimal) : ReadonlyDecimalState
{
	return getStateProvider(value)[decimalStateAccess]();
}

/** @internal Obtain mutable state only for a value exclusively owned by the active calculation. */
export function getMutableDecimalState(value : InternalDecimal) : DecimalState
{
	return getStateProvider(value)[decimalStateAccess]();
}

/** @internal Transfer calculation-owned state into a freshly allocated Decimal. */
export function setDecimalState(value : InternalDecimal, state : DecimalState) : void
{
	getStateProvider(value)[decimalStateSetAccess](state);
}

function getStateProvider(value : InternalDecimal) : InternalDecimal
{
	const provider = value as Partial<InternalDecimal>;
	if (!provider[decimalStateAccess] || !provider[decimalStateSetAccess])
	{
		throw new TypeError('Invalid Decimal value');
	}
	return provider as InternalDecimal;
}
