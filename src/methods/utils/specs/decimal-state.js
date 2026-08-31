import { getDecimalState } from '../../../DecimalState.js';

/** Test-only access to the representation that is unreachable through the public Decimal value. */
export function state(value) {
	return getDecimalState(value);
}

export function digits(value) {
	return getDecimalState(value).d;
}
