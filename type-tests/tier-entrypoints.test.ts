import {
	Decimal as CoreDecimal,
	type DecimalConstructor as CoreDecimalConstructor,
	type DecimalValue
} from '@neutrium/decimal/core';
import {
	Decimal as ArithmeticDecimal,
	type DecimalConstructor as ArithmeticDecimalConstructor,
	type DecimalFraction as ArithmeticDecimalFraction
} from '@neutrium/decimal/arithmetic';
import {
	Decimal as ScientificDecimal,
	ScientificDecimal as ScientificDecimalBase,
	type DecimalConstructor as ScientificDecimalConstructor
} from '@neutrium/decimal/scientific';

const input : DecimalValue = '1.25';
const core = new CoreDecimal(input);
const arithmetic = new ArithmeticDecimal(core);
const scientific = new ScientificDecimal(arithmetic);
const scientificBase = new ScientificDecimalBase(arithmetic);

const CoreClone : CoreDecimalConstructor = CoreDecimal.clone({ precision: 12 });
const ArithmeticClone : ArithmeticDecimalConstructor = ArithmeticDecimal.clone({ precision: 12 });
const ScientificClone : ScientificDecimalConstructor = ScientificDecimal.clone({ precision: 12 });
const compared : number = core.cmp(scientific);
const sum : ArithmeticDecimal = arithmetic.add(core);
const fraction : ArithmeticDecimalFraction = sum.toFraction(100);
const sine : ScientificDecimal = scientific.sin();
const baseSine : ScientificDecimalBase = scientificBase.sin();
const inheritedScientificChain : ScientificDecimal = scientific.add(1).sqrt().sin();
const arithmeticMinimum : ArithmeticDecimal = ArithmeticDecimal.min([core, arithmetic, scientific]);
const scientificMinimum : ScientificDecimal = ScientificDecimal.min(core, arithmetic).sin();
const scientificMaximum : ScientificDecimal = ScientificDecimal.max([core, arithmetic]).sqrt();
const nestedClone : ScientificDecimalConstructor = ScientificClone.clone().clone();
const clonedAngle : ScientificDecimal = nestedClone.atan2(1, 1);
const clonedPi : ScientificDecimal = nestedClone.PI;

class TaggedArithmetic extends ArithmeticDecimal {
	declare private arithmeticTag : void;
}
class TaggedScientific extends ScientificDecimal {
	declare private scientificTag : void;
}

const taggedArithmeticResult : ArithmeticDecimal = new TaggedArithmetic(1).add(2);
const taggedScientificResult : ScientificDecimal = new TaggedScientific(1).mul(2).sin();

// @ts-expect-error Arbitrary subclasses resolve to the registered arithmetic tier.
const invalidTaggedArithmeticResult : TaggedArithmetic = new TaggedArithmetic(1).add(2);
// @ts-expect-error Arbitrary subclasses resolve to the registered scientific tier.
const invalidTaggedScientificResult : TaggedScientific = new TaggedScientific(1).sin();
// @ts-expect-error Inherited static methods also return the registered arithmetic tier.
const invalidTaggedMinimum : TaggedArithmetic = TaggedArithmetic.min(1, 2);
// @ts-expect-error Inherited clone signatures do not claim to preserve application subclass state.
const invalidTaggedClone : TaggedScientific = new (TaggedScientific.clone())(1);

// @ts-expect-error Core deliberately excludes arithmetic methods.
core.add(1);
// @ts-expect-error Core deliberately excludes scientific methods.
core.sin();
// @ts-expect-error Arithmetic deliberately excludes scientific methods.
arithmetic.sin();
// @ts-expect-error Core clones deliberately exclude arithmetic methods.
new CoreClone(1).mul(2);

void ArithmeticClone;
void ScientificClone;
void compared;
void fraction;
void sine;
void baseSine;
void inheritedScientificChain;
void arithmeticMinimum;
void scientificMinimum;
void scientificMaximum;
void clonedAngle;
void clonedPi;
void invalidTaggedMinimum;
void invalidTaggedClone;
void taggedArithmeticResult;
void taggedScientificResult;
void invalidTaggedArithmeticResult;
void invalidTaggedScientificResult;
