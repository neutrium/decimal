import { Decimal } from '@neutrium/decimal';

const result = new Decimal('1.25').mul(2).toDP(1, 'half-even').toString();
if (result !== '2.5') throw new Error('Unexpected root browser result');
Object.assign(globalThis, { decimalPackageSmokeResult: result });
