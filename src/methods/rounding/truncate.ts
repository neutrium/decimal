//
// Truncate a coefficient array in place. Return whether any words were discarded.
//
export function truncate(arr : number[], len : number) : boolean
{
	if (arr.length > len)
	{
		arr.length = len;
		return true;
	}

	return false;
}
