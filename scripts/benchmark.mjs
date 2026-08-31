import process from 'node:process';

import { Decimal } from '../dist/index.js';
import { CalculationContext } from '../dist/CalculationContext.js';
import { getDecimalState } from '../dist/DecimalState.js';

const args = new Set(process.argv.slice(2));

if (args.has('--help'))
{
	console.log(`Usage: pnpm run benchmark -- [--json] [--filter=<text>]

Environment variables:
  BENCH_ITERATIONS  Base iteration count (default: 50000)
  BENCH_SAMPLES     Timed samples per benchmark (default: 7)
  BENCH_WARMUP      Maximum warmup iterations (default: 5000)
  BENCH_FILTER      Additional case-name filter`);
	process.exit(0);
}

const baseIterations = readPositiveInteger('BENCH_ITERATIONS', 50_000);
const sampleCount = readPositiveInteger('BENCH_SAMPLES', 7);
const warmupLimit = readPositiveInteger('BENCH_WARMUP', 5_000);
const argumentFilter = process.argv.slice(2).find(value => value.startsWith('--filter='))?.slice(9);
const filter = argumentFilter ?? process.env.BENCH_FILTER ?? '';
const json = args.has('--json');
let sink = 0;

const D20 = lazy(() => Decimal.clone({ precision: 20 }));
const D200 = lazy(() => Decimal.clone({ precision: 200 }));
const D800 = lazy(() => Decimal.clone({ precision: 800 }));
const D20Context = lazy(() => new CalculationContext(D20(), D20().config));
const decimal1000 = lazy(() => '1234567890'.repeat(100));
const hexadecimal1024 = lazy(() => '0x' + 'fedcba9876543210'.repeat(64));
const addValues = lazy(() => {
	const D = D20();
	const left = new D('12345678901234567890.123456789');
	const right = new D('98765432109876543210.987654321');
	return { left, right, negativeRight: right.neg() };
});
const multiplyValues = lazy(() => {
	const D = D200();
	return {
		left: new D('1234567890'.repeat(20)),
		right: new D('9876543210'.repeat(20))
	};
});
const divide200Values = lazy(() => {
	const D = D200();
	return { left: new D('9'.repeat(200)), right: new D('7'.repeat(100)) };
});
const divide800Values = lazy(() => {
	const D = D800();
	return { left: new D('9'.repeat(800)), right: new D('7'.repeat(400)) };
});
const smallValues = lazy(() => {
	const D = D20();
	return { left: new D('1.234567890123456789'), right: new D('3.456789012345678901') };
});

const definitions = [
	benchmark('construct/small-integer', 1, () => { const D = D20(); return () => exponent(new D(123456)); }),
	benchmark('construct/internal-small-integer', 1, () => { const context = D20Context(); return () => exponent(context.create(123456)); }),
	benchmark('parse/decimal-1000-digits', 0.02, () => { const D = D20(), value = decimal1000(); return () => coefficientLength(new D(value)); }),
	benchmark('parse/hexadecimal-1024-digits', 0.01, () => { const D = D20(), value = hexadecimal1024(); return () => coefficientLength(new D(value)); }),
	benchmark('format/to-string', 1, () => { const value = new (D20())('12345678901234567890.123456789'); return () => value.toString().length; }),
	benchmark('format/to-fixed-1000-places', 0.02, () => { const value = new (D20())(1); return () => consumeString(value.toFixed(1000)); }),
	benchmark('format/to-fixed-100000-places', 0.001, () => { const value = new (D20())(1); return () => consumeString(value.toFixed(100000)); }),
	benchmark('convert/to-number', 1, () => { const value = new (D20())('12345678901234567890.123456789'); return () => value.toNumber(); }),
	benchmark('convert/to-number-known-overflow', 1, () => { const value = new (D20())('9'.repeat(100000)); return () => value.toNumber(); }),
	benchmark('inspect/is-finite', 1, () => { const value = new (D20())('12345678901234567890.123456789'); return () => value.isFinite(); }),
	benchmark('compare/existing-decimal', 1, () => { const D = D20(), left = new D('12345678901234567890.123456789'), right = new D('12345678901234567890.123456788'); return () => left.cmp(right); }),
	benchmark('arithmetic/add-20-digits', 1, () => { const { left, right } = addValues(); return () => firstWord(left.add(right)); }),
	benchmark('arithmetic/add-opposite-sign-20-digits', 1, () => { const { left, negativeRight } = addValues(); return () => firstWord(left.add(negativeRight)); }),
	benchmark('arithmetic/subtract-20-digits', 1, () => { const { left, right } = addValues(); return () => firstWord(left.sub(right)); }),
	benchmark('arithmetic/subtract-opposite-sign-20-digits', 1, () => { const { left, negativeRight } = addValues(); return () => firstWord(left.sub(negativeRight)); }),
	benchmark('arithmetic/add-200-digits', 0.1, () => { const { left, right } = multiplyValues(); return () => firstWord(left.add(right)); }),
	benchmark('arithmetic/subtract-200-digits', 0.1, () => { const { left, right } = multiplyValues(); return () => firstWord(left.sub(right)); }),
	benchmark('arithmetic/multiply-20-digits', 1, () => { const { left, right } = smallValues(); return () => firstWord(left.mul(right)); }),
	benchmark('arithmetic/division-20-digits', 1, () => { const { left, right } = smallValues(); return () => firstWord(left.div(right)); }),
	benchmark('arithmetic/multiply-200-digits', 0.02, () => { const { left, right } = multiplyValues(); return () => coefficientLength(left.mul(right)); }),
	benchmark('arithmetic/square-200-digits', 0.02, () => { const { left } = multiplyValues(); return () => coefficientLength(left.mul(left)); }),
	benchmark('arithmetic/square-800-digits', 0.001, () => { const { left } = divide800Values(); return () => coefficientLength(left.mul(left)); }),
	benchmark('arithmetic/division-200-digits', 0.01, () => { const { left, right } = divide200Values(); return () => firstWord(left.div(right)); }),
	benchmark('arithmetic/division-800-digits', 0.001, () => { const { left, right } = divide800Values(); return () => firstWord(left.div(right)); }),
	benchmark('arithmetic/integer-division-large-exponent', 0.01, () => { const value = new (D20())('1e1000000'); return () => firstWord(value.divToInt(3)); }),
	benchmark('arithmetic/multiply-2000-digits-at-20-digit-precision', 0.001, () => { const D = D20(), left = new D('1234567890'.repeat(200)), right = new D('9876543210'.repeat(200)); return () => firstWord(left.mul(right)); }),
	benchmark('arithmetic/add-1000000-digits-at-20-digit-precision', 0.000002, () => { const value = new (D20())('8'.repeat(1_000_000)); return () => firstWord(value.add(value)); }),
	benchmark('arithmetic/square-1000000-digits-at-20-digit-precision', 0.000002, () => { const value = new (D20())('9'.repeat(1_000_000)); return () => firstWord(value.mul(value)); }),
	benchmark('constant/pi-clone', 0.2, () => { const D = D20(); void D.PI; return () => coefficientLength(D.PI); }),
	benchmark('constant/ln10-clone', 0.2, () => { const D = D20(); void D.LN10; return () => coefficientLength(D.LN10); }),
	benchmark('transcendental/sin-200-digits', 0.0002, () => { const value = new (D200())('1.234567890123456789'); return () => firstWord(value.sin()); }),
	benchmark('transcendental/ln-200-digits', 0.0002, () => { const value = new (D200())('1.234567890123456789'); return () => firstWord(value.ln()); }),
	benchmark('transcendental/exp-200-digits', 0.0002, () => { const value = new (D200())('1.234567890123456789'); return () => firstWord(value.exp()); }),
	benchmark('roots/sqrt-200-digits', 0.001, () => { const value = new (D200())('1.234567890123456789'); return () => firstWord(value.sqrt()); }),
	benchmark('roots/cbrt-200-digits', 0.001, () => { const value = new (D200())('1.234567890123456789'); return () => firstWord(value.cbrt()); }),
	benchmark('roots/sqrt-20-digits', 0.01, () => { const { left } = smallValues(); return () => firstWord(left.sqrt()); }),
	benchmark('roots/cbrt-20-digits', 0.01, () => { const { left } = smallValues(); return () => firstWord(left.cbrt()); }),
	benchmark('roots/sqrt-800-digits', 0.0002, () => { const value = new (D800())('1.234567890123456789'); return () => firstWord(value.sqrt()); }),
	benchmark('roots/cbrt-800-digits', 0.0002, () => { const value = new (D800())('1.234567890123456789'); return () => firstWord(value.cbrt()); }),
	benchmark('collection/min-10000-decimals', 0.001, () => { const D = D20(), values = Array.from({ length: 10_000 }, (_, i) => new D(i)); return () => firstWord(D.min(...values)); }),
	benchmark('collection/max-10000-decimals', 0.001, () => { const D = D20(), values = Array.from({ length: 10_000 }, (_, i) => new D(i)); return () => firstWord(D.max(...values)); }),
];

function coefficientLength(value)
{
	return getDecimalState(value).d?.length ?? 0;
}

function exponent(value)
{
	return getDecimalState(value).e;
}

function firstWord(value)
{
	return getDecimalState(value).d?.[0] ?? 0;
}

const cases = definitions
	.filter(test => test.name.includes(filter))
	.map(({ name, iterationScale, setup }) => ({ name, iterationScale, operation: setup() }));

if (cases.length === 0)
{
	throw new Error(`No benchmarks matched filter: ${filter}`);
}

const results = cases.map(runBenchmark);
const report = {
	metadata: {
		node: process.version,
		platform: process.platform,
		arch: process.arch,
		baseIterations,
		sampleCount,
		warmupLimit,
		filter,
	},
	results,
};

if (json)
{
	console.log(JSON.stringify(report, null, 2));
}
else
{
	console.log(`@neutrium/decimal benchmarks (${process.version}, ${process.platform}/${process.arch})`);
	console.log(`samples=${sampleCount}, base iterations=${baseIterations}, warmup<=${warmupLimit}`);

	if (filter)
	{
		console.log(`filter=${filter}`);
	}

	console.log('');
	console.log('Benchmark'.padEnd(43) + 'median'.padStart(12) + 'min'.padStart(12) + 'max'.padStart(12) + 'ops/s'.padStart(14));

	for (const result of results)
	{
		console.log(
			result.name.padEnd(43) +
			formatDuration(result.medianNs).padStart(12) +
			formatDuration(result.minNs).padStart(12) +
			formatDuration(result.maxNs).padStart(12) +
			Math.round(result.opsPerSecond).toLocaleString('en-US').padStart(14)
		);
	}

	console.log(`\nsink=${sink}`);
}

function benchmark(name, iterationScale, setup)
{
	return { name, iterationScale, setup };
}

function lazy(create)
{
	let value;
	return () => value ??= create();
}

function runBenchmark(test)
{
	const iterations = Math.max(1, Math.round(baseIterations * test.iterationScale));
	const warmupIterations = Math.min(iterations, warmupLimit);

	for (let i = 0; i < warmupIterations; i++)
	{
		consume(test.operation());
	}

	const samples = [];

	for (let sample = 0; sample < sampleCount; sample++)
	{
		globalThis.gc?.();

		const start = process.hrtime.bigint();

		for (let i = 0; i < iterations; i++)
		{
			consume(test.operation());
		}

		const elapsed = process.hrtime.bigint() - start;

		samples.push(Number(elapsed) / iterations);
	}

	samples.sort((a, b) => a - b);
	const medianNs = samples[Math.floor(samples.length / 2)];

	return {
		name: test.name,
		iterations,
		medianNs,
		minNs: samples[0],
		maxNs: samples[samples.length - 1],
		opsPerSecond: 1e9 / medianNs,
	};
}

function consume(value)
{
	sink = (sink + Number(value ?? 0)) | 0;
}

// Force padded strings to be materialized instead of measuring only a lazy string's length.
function consumeString(value)
{
	return value.length + value.charCodeAt(value.length - 1);
}

function readPositiveInteger(name, fallback)
{
	const raw = process.env[name];

	if (raw === undefined)
	{
		return fallback;
	}

	const value = Number(raw);

	if (!Number.isSafeInteger(value) || value < 1)
	{
		throw new Error(`${name} must be a positive safe integer, received: ${raw}`);
	}

	return value;
}

function formatDuration(ns)
{
	if (ns < 1_000) return `${ns.toFixed(1)} ns`;
	if (ns < 1_000_000) return `${(ns / 1_000).toFixed(2)} us`;

	return `${(ns / 1_000_000).toFixed(2)} ms`;
}
