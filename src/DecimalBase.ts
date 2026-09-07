import {
	createDecimalState,
	decimalStateAccess,
	decimalStateSetAccess,
	type DecimalState
} from './DecimalState.js';

/** @hidden Type-only key used to bind inherited operations to a library tier. */
export const decimalResultType : unique symbol = Symbol('Decimal result type');

/** @internal Inherited capability for resolving a constructor's DecimalEnvironment. */
export const decimalEnvironmentAccess : unique symbol = Symbol('Decimal environment access');

export interface DecimalLike
{
	/** @hidden Result type for operations inherited by richer library tiers. */
	readonly [decimalResultType] : DecimalLike;
}

/** A Decimal instance from any package feature tier. */
export abstract class DecimalLike
{
	#state : DecimalState = createDecimalState();

	/** @internal Provide module-private access to this value's native private state. */
	[decimalStateAccess]() : DecimalState { return this.#state; }

	/** @internal Adopt state exclusively owned by a new calculation result. */
	[decimalStateSetAccess](state : DecimalState) : void { this.#state = state; }
}

/** A scalar input accepted by Decimal constructors and operations in every tier. */
export type DecimalValue = string | number | bigint | DecimalLike;

/** A finite, non-string iterable of Decimal scalar inputs. */
export type DecimalValueIterable = Iterable<DecimalValue> & object;
