import { Decimal } from '@neutrium/decimal/core';

const result = new Decimal('1.25').toFixed(2);
if (result !== '1.25') throw new Error('Unexpected core browser result');
Object.assign(globalThis, { decimalPackageSmokeResult: result });
