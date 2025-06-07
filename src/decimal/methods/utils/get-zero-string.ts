
export function getZeroString(k : number) : string
{
	let zs = '';
	for (; k--;) zs += '0';
	return zs;
}