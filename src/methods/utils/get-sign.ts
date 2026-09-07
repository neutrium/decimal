import type { KernelDecimal } from "../../KernelDecimal.js";
import { getDecimalState } from '../../DecimalState.js';

export function getSign(x: KernelDecimal) : number
{
	const { d, s } = getDecimalState(x);
	return d ? (d[0] ? s : 0 * s) : s || NaN;
}
