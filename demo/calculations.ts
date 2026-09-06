import {
	Decimal,
	type DecimalConstructor,
	type ModuloMode,
	type RoundingMode
} from '../src/index.ts';

export const ROUNDING_MODES = [
	'up',
	'down',
	'ceil',
	'floor',
	'half-up',
	'half-down',
	'half-even',
	'half-ceil',
	'half-floor'
] as const satisfies readonly RoundingMode[];

export const MODULO_MODES = [
	...ROUNDING_MODES,
	'euclid'
] as const satisfies readonly ModuloMode[];

export const OPERATION_IDS = [
	'add',
	'sub',
	'mul',
	'div',
	'mod',
	'pow',
	'sqrt',
	'cbrt'
] as const;

export type OperationId = typeof OPERATION_IDS[number];

export type CalculationSettings = {
	left: string;
	operation: OperationId;
	right: string;
	precision: number;
	rounding: RoundingMode;
	modulo: ModuloMode;
};

export type ComparisonResult = {
	decimal: string;
	native: string;
	equivalent: boolean;
	significantDigits: number | null;
};

export type RoundingResult = {
	mode: RoundingMode;
	value: string;
};

function calculateDecimal(Constructor: DecimalConstructor, settings: CalculationSettings): Decimal
{
	const left = new Constructor(settings.left);

	switch (settings.operation)
	{
		case 'add': return left.add(settings.right);
		case 'sub': return left.sub(settings.right);
		case 'mul': return left.mul(settings.right);
		case 'div': return left.div(settings.right);
		case 'mod': return left.mod(settings.right);
		case 'pow': return left.pow(settings.right);
		case 'sqrt': return left.sqrt();
		case 'cbrt': return left.cbrt();
	}
}

function calculateNative(settings: CalculationSettings): number
{
	const left = Number(settings.left);
	const right = Number(settings.right);

	switch (settings.operation)
	{
		case 'add': return left + right;
		case 'sub': return left - right;
		case 'mul': return left * right;
		case 'div': return left / right;
		case 'mod': return left % right;
		case 'pow': return left ** right;
		case 'sqrt': return Math.sqrt(left);
		case 'cbrt': return Math.cbrt(left);
	}
}

function formatNative(value: number): string
{
	return Object.is(value, -0) ? '-0' : String(value);
}

export function compareCalculation(settings: CalculationSettings): ComparisonResult {
	const Constructor = Decimal.clone({
		precision: settings.precision,
		rounding: settings.rounding,
		modulo: settings.modulo
	});
	const decimalResult = calculateDecimal(Constructor, settings);
	const nativeResult = calculateNative(settings);
	const native = formatNative(nativeResult);
	const significantDigits = decimalResult.precision(true);
	let equivalent = false;

	if (decimalResult.isNaN() && Number.isNaN(nativeResult))
	{
		equivalent = true;
	}
	else if (!decimalResult.isNaN())
	{
		equivalent = decimalResult.eq(native);
	}

	return {
		decimal: decimalResult.toValue(),
		native,
		equivalent,
		significantDigits: Number.isNaN(significantDigits) ? null : significantDigits
	};
}

export function calculateRoundingTable(value: string, decimalPlaces: number): RoundingResult[]
{
	const Constructor = Decimal.clone({ precision: 100 });
	const decimal = new Constructor(value);

	return ROUNDING_MODES.map(mode => ({
		mode,
		value: decimal.toFixed(decimalPlaces, mode)
	}));
}
