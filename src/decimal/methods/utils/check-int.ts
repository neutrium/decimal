
export function checkInt32(i : number, min : number, max : number) : void
{
	if (i !== ~~i || i < min || i > max)
	{
		throw Error("DecimalError] Invalid integer argument: " + i);
	}
}