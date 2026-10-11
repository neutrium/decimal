import { Decimal as RootDecimal } from '@neutrium/decimal';
import { Decimal as CoreDecimal } from '@neutrium/decimal/core';
import { Decimal as ArithmeticDecimal } from '@neutrium/decimal/arithmetic';
import { Decimal as ScientificDecimal, ScientificDecimal as ScientificDecimalBase } from '@neutrium/decimal/scientific';
import type { DecimalValue as CoreValue } from '@neutrium/decimal/core';
const input: CoreValue = '1.25';
const core: CoreDecimal = new CoreDecimal(input);
const arithmetic: ArithmeticDecimal = new ArithmeticDecimal(core).mul(2);
const scientific: ScientificDecimal = new ScientificDecimal(arithmetic).sin();
if (core.toString() !== '1.25') throw new Error('Unexpected core result');
if (arithmetic.toString() !== '2.5') throw new Error('Unexpected arithmetic result');
if (scientific.toString() !== '0.59847214410395649405') throw new Error('Unexpected scientific result');
if ('add' in core || 'sin' in arithmetic) throw new Error('A smaller tier exposes a richer method');
if (ScientificDecimal !== RootDecimal) throw new Error('Root and scientific entry points expose different constructors');
if (RootDecimal !== ScientificDecimalBase) throw new Error('Scientific implementation is not the canonical constructor');
if (Object.getPrototypeOf(ScientificDecimalBase.prototype) !== ArithmeticDecimal.prototype) throw new Error('Arithmetic inheritance boundary is missing');
if (Object.getPrototypeOf(ArithmeticDecimal.prototype) !== CoreDecimal.prototype) throw new Error('Core inheritance boundary is missing');

if (new ArithmeticDecimal(2).powInteger(-3).toString() !== '0.125') throw new Error('Arithmetic integer powers failed');
if (new ScientificDecimal(2).powInteger(10).toString() !== '1024') throw new Error('Inherited integer powers failed');
if ('powInteger' in core) throw new Error('Core exposes integer powers');

const third = { numerator: 1n, denominator: 3n, exponent: 0n };
if (ArithmeticDecimal.fromRationalSum([third, third, third]).toString() !== '1') throw new Error('Arithmetic rational sum failed');
if (ScientificDecimal.fromRationalSum([{ ...third, numerator: 12n }]).sqrt().toString() !== '2') throw new Error('Scientific rational sum failed');
if ('fromRationalSum' in CoreDecimal) throw new Error('Core exposes rational sum');

const exactTerm = core.toRationalTerm();
if (exactTerm.numerator !== 125n || exactTerm.exponent !== -2n || exactTerm.denominator !== 1n) throw new Error('Core rational extraction failed');
if (!ArithmeticDecimal.fromRationalSum([exactTerm]).eq(core)) throw new Error('Rational round trip failed');

const residual = [{ ...third, numerator: -1n, exponent: -100000000000000000000n }];
if (ArithmeticDecimal.compareRationalSum(residual) !== -1) throw new Error('Exact rational comparison failed');
if (ScientificDecimal.clone().compareRationalSum(residual) !== -1) throw new Error('Inherited rational comparison failed');
if ('compareRationalSum' in CoreDecimal) throw new Error('Core exposes rational comparison');
