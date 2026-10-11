import { Decimal, type DecimalRationalTerm } from '@neutrium/decimal';
import { Decimal as Arithmetic, type DecimalRationalTerm as ArithmeticTerm } from '@neutrium/decimal/arithmetic';
import { Decimal as Scientific, type DecimalRationalTerm as ScientificTerm } from '@neutrium/decimal/scientific';
import { Decimal as Core } from '@neutrium/decimal/core';

const terms: readonly DecimalRationalTerm[] = [{ numerator: 1n, denominator: 3n, exponent: 0n }];
const arithmetic: Arithmetic = Arithmetic.fromRationalSum(terms);
const scientific: Scientific = Scientific.fromRationalSum(terms).sqrt();
const root: Decimal = Decimal.fromRationalSum(terms);
const arithmeticClone: Arithmetic = Arithmetic.clone({ precision: 4 }).fromRationalSum(terms);
const scientificClone: Scientific = Scientific.clone({ precision: 4 }).fromRationalSum(terms).sqrt();
const structural: ArithmeticTerm & ScientificTerm = terms[0]!;
const iterable: Decimal = Decimal.fromRationalSum(new Set(terms));
// @ts-expect-error Core does not expose arithmetic factories.
Core.fromRationalSum(terms);
// @ts-expect-error Term components must be BigInts.
Decimal.fromRationalSum([{ numerator: 1, denominator: 3n, exponent: 0n }]);
// @ts-expect-error Exponent is required.
Decimal.fromRationalSum([{ numerator: 1n, denominator: 3n }]);
// @ts-expect-error Terms must be iterable.
Decimal.fromRationalSum(structural);
// @ts-expect-error The term's fields are readonly.
structural.numerator = 2n;
class Custom extends Arithmetic { private brand = true; isCustom(): boolean { return this.brand; } }
// @ts-expect-error Results retain their registered Decimal tier, not arbitrary subclass members.
const custom: Custom = Custom.fromRationalSum(terms);
void [arithmetic, scientific, root, arithmeticClone, scientificClone, structural, iterable, custom];

const comparison: -1 | 0 | 1 = Arithmetic.compareRationalSum(terms);
const clonedComparison: -1 | 0 | 1 = Scientific.clone().compareRationalSum(new Set(terms));
const rootComparison: -1 | 0 | 1 = Decimal.compareRationalSum(terms);
// @ts-expect-error Core does not expose rational-sum arithmetic.
Core.compareRationalSum(terms);
// @ts-expect-error Rational components must be BigInts.
Arithmetic.compareRationalSum([{ numerator: 1, denominator: 1n, exponent: 0n }]);
void [comparison, clonedComparison, rootComparison];
