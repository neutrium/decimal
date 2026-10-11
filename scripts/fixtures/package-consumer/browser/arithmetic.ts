import { Decimal } from '@neutrium/decimal/arithmetic';

const result = new Decimal('1.25').mul(2).toString();
if (result !== '2.5') throw new Error('Unexpected arithmetic browser result');
if (new Decimal('1.25').powInteger(-3).toString() !== '0.512') throw new Error('Unexpected integer power browser result');
if (Decimal.fromRationalSum([{ numerator: 1n, denominator: 3n, exponent: 0n }, { numerator: 2n, denominator: 3n, exponent: 0n }]).toString() !== '1') throw new Error('Unexpected rational sum browser result');
Object.assign(globalThis, { decimalPackageSmokeResult: result });

if (Decimal.compareRationalSum([{ numerator: -1n, denominator: 3n, exponent: -100000000000000000000n }]) !== -1) throw new Error('Unexpected rational comparison browser result');
