import { Decimal as Core, type DecimalRationalTerm as CoreTerm } from '@neutrium/decimal/core';
import { Decimal as Arithmetic, type DecimalRationalTerm as ArithmeticTerm } from '@neutrium/decimal/arithmetic';
import { Decimal as Scientific, type DecimalRationalTerm as ScientificTerm } from '@neutrium/decimal/scientific';
import { Decimal, type DecimalRationalTerm } from '@neutrium/decimal';

const core: CoreTerm = new Core('1.25').toRationalTerm();
const arithmetic: ArithmeticTerm = new Arithmetic(1).toRationalTerm();
const scientific: ScientificTerm = new Scientific(1).toRationalTerm();
const root: DecimalRationalTerm = new Decimal(1).toRationalTerm();
const numerator: bigint = core.numerator;
const denominator: bigint = core.denominator;
const exponent: bigint = core.exponent;
const restored: Arithmetic = Arithmetic.fromRationalSum([core, arithmetic, scientific, root]);
const cloned: CoreTerm = new (Core.clone({ precision: 1 }))(2).toRationalTerm();
// @ts-expect-error Rational term fields are readonly.
core.numerator = 2n;
// @ts-expect-error A core Decimal still has no rational-sum constructor.
Core.fromRationalSum([core]);
void [numerator, denominator, exponent, restored, cloned];
