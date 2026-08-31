import type { Decimal } from "../../Decimal.js";
import { getDecimalState } from '../../DecimalState.js';

export function getSign(x: Decimal) : number
{
	const { d, s } = getDecimalState(x);
	return d ? (d[0] ? s : 0 * s) : s || NaN;
}
