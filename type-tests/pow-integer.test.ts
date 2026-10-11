import { Decimal as Core } from '@neutrium/decimal/core';
import { Decimal as Arithmetic } from '@neutrium/decimal/arithmetic';
import { Decimal as Scientific } from '@neutrium/decimal/scientific';

const arithmetic: Arithmetic = new Arithmetic('1.25').powInteger(-3);
const scientific: Scientific = new Scientific('1.25').powInteger(-3).sqrt();
const clone: Arithmetic = new (Arithmetic.clone({ precision: 10 }))(2).powInteger(3);
// @ts-expect-error Integer powers are not part of the core tier.
new Core(2).powInteger(3);
// @ts-expect-error Exponents must be native Numbers.
arithmetic.powInteger('3');
// @ts-expect-error Exponents must be native Numbers.
arithmetic.powInteger(3n);
// @ts-expect-error Exponents must be native Numbers.
arithmetic.powInteger(scientific);
class Custom extends Arithmetic { private brand = true; isCustom(): boolean { return this.brand; } }
// @ts-expect-error Results retain the Decimal tier, not arbitrary subclass extensions.
const custom: Custom = new Custom(2).powInteger(3);
void [arithmetic, scientific, clone, custom];
