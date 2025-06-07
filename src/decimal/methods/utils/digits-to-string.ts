import { Decimal } from '../../Decimal.js'
import { getZeroString } from '../utils/get-zero-string.js';

export function digitsToString(d : number[] | null) : string
{
	if(d === null)
	{
		return '';
	}

	let i, k, ws,
		indexOfLastWord = d.length - 1,
		str = '',
		w = d[0];

	if (indexOfLastWord > 0)
	{
		str += w;
		for (i = 1; i < indexOfLastWord; i++)
		{
			ws = d[i] + '';
			k = Decimal.params.LOG_BASE - ws.length;
			if (k) str += getZeroString(k);
			str += ws;
		}

		w = d[i];
		ws = w + '';
		k = Decimal.params.LOG_BASE - ws.length;

		if (k) str += getZeroString(k);
	}
	else if (w === 0)
	{
		return '0';
	}

	// Remove trailing zeros of last w.
	for (; w % 10 === 0;) w /= 10;

	return str + w;
}