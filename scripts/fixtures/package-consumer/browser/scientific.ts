import { Decimal } from '@neutrium/decimal/scientific';

const result = new Decimal('1.25').mul(2).sin().toString();
if (result !== '0.59847214410395649405') throw new Error('Unexpected scientific browser result');
Object.assign(globalThis, { decimalPackageSmokeResult: result });
