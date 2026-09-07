import { Decimal } from '@neutrium/decimal/arithmetic';

const result = new Decimal('1.25').mul(2).toString();
if (result !== '2.5') throw new Error('Unexpected arithmetic browser result');
Object.assign(globalThis, { decimalPackageSmokeResult: result });
