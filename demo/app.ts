import {
	MODULO_MODES,
	OPERATION_IDS,
	ROUNDING_MODES,
	calculateRoundingTable,
	compareCalculation,
	type CalculationSettings,
	type OperationId
} from './calculations.ts';
import type { ModuloMode, RoundingMode } from '../src/index.ts';

type Preset = CalculationSettings & {
	id: string;
	label: string;
	note: string;
};

const OPERATION_LABELS: Record<OperationId, string> = {
	add: 'Add  +',
	sub: 'Subtract  −',
	mul: 'Multiply  ×',
	div: 'Divide  ÷',
	mod: 'Modulo  %',
	pow: 'Power  xʸ',
	sqrt: 'Square root  √',
	cbrt: 'Cube root  ∛'
};

const METHOD_NAMES: Record<OperationId, string> = {
	add: 'add',
	sub: 'sub',
	mul: 'mul',
	div: 'div',
	mod: 'mod',
	pow: 'pow',
	sqrt: 'sqrt',
	cbrt: 'cbrt'
};

const ROUNDING_DESCRIPTIONS: Record<RoundingMode, string> = {
	up: 'Away from zero',
	down: 'Toward zero',
	ceil: 'Toward +Infinity',
	floor: 'Toward −Infinity',
	'half-up': 'Ties away from zero',
	'half-down': 'Ties toward zero',
	'half-even': 'Ties to even',
	'half-ceil': 'Ties toward +Infinity',
	'half-floor': 'Ties toward −Infinity'
};

const PRESETS: Preset[] = [
	{
		id: 'floating-point',
		label: '0.1 + 0.2',
		note: 'The classic binary floating-point surprise.',
		left: '0.1',
		operation: 'add',
		right: '0.2',
		precision: 20,
		rounding: 'half-up',
		modulo: 'down'
	},
	{
		id: 'ledger',
		label: 'Invoice tax',
		note: 'String inputs keep currency calculations decimal from end to end.',
		left: '19.99',
		operation: 'mul',
		right: '1.1',
		precision: 20,
		rounding: 'half-even',
		modulo: 'down'
	},
	{
		id: 'large-integer',
		label: 'Beyond safe integer',
		note: 'JavaScript Number has already rounded the left operand before adding.',
		left: '9007199254740993',
		operation: 'add',
		right: '1',
		precision: 24,
		rounding: 'half-up',
		modulo: 'down'
	},
	{
		id: 'one-third',
		label: '1 ÷ 3',
		note: 'Raise or lower precision and watch the controlled result change.',
		left: '1',
		operation: 'div',
		right: '3',
		precision: 40,
		rounding: 'half-up',
		modulo: 'down'
	},
	{
		id: 'compound',
		label: 'Compounding',
		note: 'High-precision powers retain small changes across many periods.',
		left: '1.0000000000000000001',
		operation: 'pow',
		right: '20',
		precision: 40,
		rounding: 'half-even',
		modulo: 'down'
	},
	{
		id: 'euclidean',
		label: 'Euclidean modulo',
		note: 'Modulo configuration determines the sign and range of a remainder.',
		left: '-17',
		operation: 'mod',
		right: '5',
		precision: 20,
		rounding: 'half-up',
		modulo: 'euclid'
	}
];

function getElement<T extends HTMLElement>(id: string): T
{
	const element = document.getElementById(id);

	if (!element)
	{
		throw new Error(`Missing demo element: ${id}`);
	}

	return element as T;
}

const form = getElement<HTMLFormElement>('calculator-form');
const leftInput = getElement<HTMLInputElement>('left-value');
const rightInput = getElement<HTMLInputElement>('right-value');
const rightField = getElement<HTMLDivElement>('right-field');
const operationSelect = getElement<HTMLSelectElement>('operation');
const precisionInput = getElement<HTMLInputElement>('precision');
const precisionOutput = getElement<HTMLOutputElement>('precision-output');
const roundingSelect = getElement<HTMLSelectElement>('rounding');
const moduloSelect = getElement<HTMLSelectElement>('modulo');
const moduloField = getElement<HTMLLabelElement>('modulo-field');
const decimalOutput = getElement<HTMLOutputElement>('decimal-result');
const nativeOutput = getElement<HTMLOutputElement>('native-result');
const digitOutput = getElement<HTMLSpanElement>('digit-count');
const comparisonStatus = getElement<HTMLDivElement>('comparison-status');
const comparisonText = getElement<HTMLSpanElement>('comparison-text');
const insightText = getElement<HTMLParagraphElement>('insight-text');
const errorMessage = getElement<HTMLParagraphElement>('calculation-error');
const codeOutput = getElement<HTMLElement>('code-output');
const copyButton = getElement<HTMLButtonElement>('copy-code');
const roundingValue = getElement<HTMLInputElement>('rounding-value');
const roundingPlaces = getElement<HTMLInputElement>('rounding-places');
const roundingBody = getElement<HTMLTableSectionElement>('rounding-body');
const presetContainer = getElement<HTMLDivElement>('presets');

for (const operation of OPERATION_IDS)
{
	operationSelect.add(new Option(OPERATION_LABELS[operation], operation));
}

for (const mode of ROUNDING_MODES)
{
	roundingSelect.add(new Option(mode, mode));
}

for (const mode of MODULO_MODES)
{
	moduloSelect.add(new Option(mode, mode));
}

for (const preset of PRESETS)
{
	const button = document.createElement('button');
	button.className = 'preset-chip';
	button.type = 'button';
	button.dataset.preset = preset.id;
	button.textContent = preset.label;
	button.addEventListener('click', () => applyPreset(preset));
	presetContainer.append(button);
}

function currentSettings(): CalculationSettings
{
	return {
		left: leftInput.value.trim(),
		operation: operationSelect.value as OperationId,
		right: rightInput.value.trim(),
		precision: Number(precisionInput.value),
		rounding: roundingSelect.value as RoundingMode,
		modulo: moduloSelect.value as ModuloMode
	};
}

function isUnary(operation: OperationId): boolean
{
	return operation === 'sqrt' || operation === 'cbrt';
}

function buildCode(settings: CalculationSettings): string
{
	const config = [
		`precision: ${settings.precision}`,
		`rounding: '${settings.rounding}'`,
		...(settings.operation === 'mod' ? [`modulo: '${settings.modulo}'`] : [])
	].join(', ');
	const rightArgument = isUnary(settings.operation)
		? ''
		: JSON.stringify(settings.right);

	return `import { Decimal } from '@neutrium/decimal';\n\n` +
		`const LabDecimal = Decimal.clone({ ${config} });\n` +
		`const result = new LabDecimal(${JSON.stringify(settings.left)})\n` +
		`  .${METHOD_NAMES[settings.operation]}(${rightArgument});\n\n` +
		`result.toString(); // ${JSON.stringify(decimalOutput.value)}`;
}

function setActivePreset(activeId: string | null): void
{
	for (const button of presetContainer.querySelectorAll<HTMLButtonElement>('button'))
	{
		button.classList.toggle('is-active', button.dataset.preset === activeId);
	}
}

function applyPreset(preset: Preset): void
{
	leftInput.value = preset.left;
	operationSelect.value = preset.operation;
	rightInput.value = preset.right;
	precisionInput.value = String(preset.precision);
	roundingSelect.value = preset.rounding;
	moduloSelect.value = preset.modulo;
	insightText.textContent = preset.note;
	setActivePreset(preset.id);
	updateCalculation();
}

function updateOperationState(operation: OperationId): void
{
	const unary = isUnary(operation);
	rightField.hidden = unary;
	moduloField.classList.toggle('is-relevant', operation === 'mod');
	moduloSelect.disabled = operation !== 'mod';
}

function updateCalculation(): void
{
	const settings = currentSettings();
	precisionOutput.value = settings.precision.toString();
	updateOperationState(settings.operation);

	try
	{
		const result = compareCalculation(settings);
		decimalOutput.value = result.decimal;
		nativeOutput.value = result.native;
		digitOutput.textContent = result.significantDigits === null
			? 'Non-finite result'
			: `${result.significantDigits} significant digit${result.significantDigits === 1 ? '' : 's'}`;
		comparisonStatus.dataset.state = result.equivalent ? 'same' : 'different';
		comparisonText.textContent = result.equivalent
			? 'Both paths agree for these inputs'
			: 'The calculation paths produce different values';
		errorMessage.hidden = true;
		codeOutput.textContent = buildCode(settings);
	}
	catch (error)
	{
		const message = error instanceof Error ? error.message : String(error);
		decimalOutput.value = '—';
		nativeOutput.value = '—';
		digitOutput.textContent = 'Check the inputs';
		comparisonStatus.dataset.state = 'error';
		comparisonText.textContent = 'Unable to calculate';
		errorMessage.textContent = message;
		errorMessage.hidden = false;
		codeOutput.textContent = '// Enter valid decimal values to generate an example.';
	}
}

function updateRoundingTable(): void
{
	try
	{
		const places = Math.max(0, Math.min(20, Number(roundingPlaces.value)));
		roundingPlaces.value = String(places);
		const rows = calculateRoundingTable(roundingValue.value.trim(), places);
		roundingBody.replaceChildren(...rows.map(row => {
			const tr = document.createElement('tr');
			if (row.mode === roundingSelect.value) tr.className = 'selected-mode';

			const mode = document.createElement('th');
			mode.scope = 'row';
			mode.textContent = row.mode;

			const result = document.createElement('td');
			result.textContent = row.value;

			const description = document.createElement('td');
			description.textContent = ROUNDING_DESCRIPTIONS[row.mode];

			tr.append(mode, result, description);
			return tr;
		}));
	}
	catch
	{
		roundingBody.replaceChildren();
		const row = document.createElement('tr');
		const cell = document.createElement('td');
		cell.colSpan = 3;
		cell.className = 'table-error';
		cell.textContent = 'Enter a valid decimal value to compare rounding modes.';
		row.append(cell);
		roundingBody.append(row);
	}
}

form.addEventListener('input', event => {
	setActivePreset(null);
	insightText.textContent = 'Custom calculation using the selected constructor configuration.';
	updateCalculation();

	if (event.target === roundingSelect)
	{
		updateRoundingTable();
	}
});

form.addEventListener('submit', event => event.preventDefault());
roundingValue.addEventListener('input', updateRoundingTable);
roundingPlaces.addEventListener('input', updateRoundingTable);

copyButton.addEventListener('click', async () => {
	try {
		await navigator.clipboard.writeText(codeOutput.textContent ?? '');
		copyButton.textContent = 'Copied';
		setTimeout(() => { copyButton.textContent = 'Copy code'; }, 1400);
	} catch {
		copyButton.textContent = 'Select code to copy';
	}
});

applyPreset(PRESETS[0]!);
updateRoundingTable();
