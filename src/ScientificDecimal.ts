import {
	ArithmeticDecimal,
	type ArithmeticDecimalFraction,
	type ArithmeticDecimalConstructor
} from './ArithmeticDecimal.js';
import {
	decimalResultType,
	type DecimalValue,
	type DecimalValueIterable
} from './DecimalBase.js';
import { registerCoreTier } from './CoreDecimal.js';
import type { DecimalConfigInput } from './config/DecimalConfig.js';
import { naturalExponential } from './methods/exponential/exponential.js';
import { naturalLogarithm } from './methods/exponential/ln.js';
import { log } from './methods/exponential/log.js';
import { cbrt } from './methods/power/cbrt.js';
import { pow } from './methods/power/pow.js';
import { sqrt } from './methods/power/sqrt.js';
import { acos } from './methods/trigonometry/acos.js';
import { acosh } from './methods/trigonometry/acosh.js';
import { asin } from './methods/trigonometry/asin.js';
import { asinh } from './methods/trigonometry/asinh.js';
import { atan } from './methods/trigonometry/atan.js';
import { atan2 } from './methods/trigonometry/atan2.js';
import { atanh } from './methods/trigonometry/atanh.js';
import { cos } from './methods/trigonometry/cos.js';
import { cosh } from './methods/trigonometry/cosh.js';
import { getPi } from './methods/trigonometry/get-pi.js';
import { sin } from './methods/trigonometry/sin.js';
import { sinh } from './methods/trigonometry/sinh.js';
import { tan } from './methods/trigonometry/tan.js';
import { tanh } from './methods/trigonometry/tanh.js';

/** Immutable fraction returned by a scientific Decimal calculation. */
export type ScientificDecimalFraction<T extends ScientificDecimal = ScientificDecimal> = ArithmeticDecimalFraction<T>;

/** The independently configurable constructor returned by {@link ScientificDecimal.clone}. */
export interface ScientificDecimalConstructor extends ArithmeticDecimalConstructor
{
	/** Construct a scientific Decimal value. */
	new (value : DecimalValue): ScientificDecimal;
	/** Prototype shared by instances from this constructor. */
	readonly prototype : ScientificDecimal;
	/** Pi at the active precision. */
	readonly PI : ScientificDecimal;
	/** Create an independently configurable scientific constructor. */
	clone(config ?: DecimalConfigInput): ScientificDecimalConstructor;
	/** Calculate the angle from the positive x-axis to `(x, y)`. */
	atan2(y : DecimalValue, x : DecimalValue): ScientificDecimal;
	/** Select the least value from a non-empty iterable. */
	min(value : DecimalValueIterable): ScientificDecimal;
	/** Select the least of one or more scalar values. */
	min(value : DecimalValue, ...values : DecimalValue[]): ScientificDecimal;
	/** Select the greatest value from a non-empty iterable. */
	max(value : DecimalValueIterable): ScientificDecimal;
	/** Select the greatest of one or more scalar values. */
	max(value : DecimalValue, ...values : DecimalValue[]): ScientificDecimal;
}

export interface ScientificDecimal
{
	/** @hidden Bind inherited result-producing operations to the scientific tier. */
	readonly [decimalResultType] : ScientificDecimal;
}

/**
 * The arithmetic Decimal tier plus powers, logarithms, and trigonometry.
 * Exported as Decimal by both the root and scientific entry points.
 * Calculations preserve library clones and return this tier for application subclasses.
 */
export class ScientificDecimal extends ArithmeticDecimal
{
	static
	{
		registerCoreTier(ScientificDecimal, ArithmeticDecimal);
	}

	/** Pi at the active precision. */
	static get PI() : ScientificDecimal
	{
		const context = this.context();
		return getPi(context.precision, context.roundingCode, context) as ScientificDecimal;
	}

	// Declarations narrow inherited statics without creating runtime overrides.
	/** Select the least value from an iterable or scalar inputs. */
	declare static min : ScientificDecimalConstructor['min'];
	/** Select the greatest value from an iterable or scalar inputs. */
	declare static max : ScientificDecimalConstructor['max'];
	/** Create an independently configurable constructor for this tier. */
	declare static clone : ScientificDecimalConstructor['clone'];

	/** Calculate the angle from the positive x-axis to `(x, y)`. */
	static atan2(y : DecimalValue, x : DecimalValue) : ScientificDecimal
	{
		return atan2(y, x, this.context()) as ScientificDecimal;
	}

	/** Raise this value to a power. */
	pow(value : DecimalValue) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => pow(this, value, context));
	}

	/** Return the principal square root. */
	sqrt() : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => sqrt(this, context));
	}

	/** Return the real cube root. */
	cbrt() : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => cbrt(this, context));
	}

	/** Calculate a logarithm in an arbitrary base. */
	log(base : DecimalValue) : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => log(this, base, context));
	}

	/** Calculate the natural logarithm. */
	ln() : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => naturalLogarithm(this, undefined, context));
	}

	/** Raise Euler's number to this value. */
	exp() : this[typeof decimalResultType]
	{
		return this.executeCalculation(context => naturalExponential(this, undefined, context));
	}

	/** Calculate the sine of this radian value. */
	sin() : this[typeof decimalResultType] { return this.executeCalculation(context => sin(this, context)); }

	/** Calculate the inverse sine in radians. */
	asin() : this[typeof decimalResultType] { return this.executeCalculation(context => asin(this, context)); }

	/** Calculate the hyperbolic sine. */
	sinh() : this[typeof decimalResultType] { return this.executeCalculation(context => sinh(this, context)); }

	/** Calculate the inverse hyperbolic sine. */
	asinh() : this[typeof decimalResultType] { return this.executeCalculation(context => asinh(this, context)); }

	/** Calculate the cosine of this radian value. */
	cos() : this[typeof decimalResultType] { return this.executeCalculation(context => cos(this, context)); }

	/** Calculate the inverse cosine in radians. */
	acos() : this[typeof decimalResultType] { return this.executeCalculation(context => acos(this, context)); }

	/** Calculate the hyperbolic cosine. */
	cosh() : this[typeof decimalResultType] { return this.executeCalculation(context => cosh(this, context)); }

	/** Calculate the inverse hyperbolic cosine. */
	acosh() : this[typeof decimalResultType] { return this.executeCalculation(context => acosh(this, context)); }

	/** Calculate the tangent of this radian value. */
	tan() : this[typeof decimalResultType] { return this.executeCalculation(context => tan(this, context)); }

	/** Calculate the inverse tangent in radians. */
	atan() : this[typeof decimalResultType] { return this.executeCalculation(context => atan(this, context)); }

	/** Calculate the hyperbolic tangent. */
	tanh() : this[typeof decimalResultType] { return this.executeCalculation(context => tanh(this, context)); }

	/** Calculate the inverse hyperbolic tangent. */
	atanh() : this[typeof decimalResultType] { return this.executeCalculation(context => atanh(this, context)); }

}
