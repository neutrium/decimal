import { Decimal } from '@neutrium/decimal';
import type { DecimalValue, RoundingMode } from '@neutrium/decimal';
const input: DecimalValue = '1.25';
const mode: RoundingMode = 'half-even';
const result: Decimal = new Decimal(input).mul(2).toDP(1, mode);
if (result.toString() !== '2.5') throw new Error('Unexpected packed-package result');
if (Decimal.min([3, 1, 2]).toString() !== '1') throw new Error('Unexpected iterable minimum');
if (Decimal.max(new Set([3, 1, 2])).toString() !== '3') throw new Error('Unexpected iterable maximum');
if ('d' in result || 'e' in result || 's' in result) throw new Error('Decimal state is publicly exposed');
if (!Object.isFrozen(Decimal.config)) throw new Error('Decimal config snapshot is mutable');
if ('precision' in Decimal || 'rounding' in Decimal) throw new Error('Legacy configuration aliases are exposed');
for (const name of ['createForCalculation', 'createResultForCalculation', 'getCalculationConstructor']) {
  if (Object.hasOwn(Decimal, name)) throw new Error('Internal allocation hook is publicly exposed: ' + name);
}
