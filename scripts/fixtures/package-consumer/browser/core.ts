import { Decimal } from '@neutrium/decimal/core';

const result = new Decimal('1.25').toFixed(2);
if (result !== '1.25') throw new Error('Unexpected core browser result');
const term = new Decimal('-123.45').toRationalTerm();
if (term.numerator !== -12345n || term.denominator !== 1n || term.exponent !== -2n) throw new Error('Unexpected rational term browser result');
Object.assign(globalThis, { decimalPackageSmokeResult: result });
