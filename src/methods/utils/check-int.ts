import { invalidArgumentError } from '../../errors.js';

export function checkInt32(i : number, min : number, max : number) : void
{
	if (typeof i !== 'number' || !Number.isInteger(i) || i < min || i > max)
	{
		throw invalidArgumentError(i, 'integer argument');
	}
}
