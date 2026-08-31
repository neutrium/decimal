# Development

### Requirements

- Node.js 20.19 or newer
- An ESM project, or a build tool that consumes ESM
- TypeScript 5.9 or newer when using the bundled declarations

## Quickstart

Install the locked dependencies before running the project commands:

```sh
pnpm install --frozen-lockfile
```

```sh
pnpm test             # Run the Vitest suite
pnpm run typecheck    # Check all TypeScript source, including unused locals and parameters
pnpm run docs         # Generate the TypeDoc API reference in docs/api
pnpm run docs:check   # Validate public API documentation without writing output
pnpm run verify       # Run all source, declaration, package, and runtime checks
pnpm run benchmark    # Run deterministic performance benchmarks
```

## Benchmarking

Benchmark runs use fixed fixtures and report the median, minimum, and maximum time across seven samples. Set `BENCH_ITERATIONS`, `BENCH_SAMPLES`, or `BENCH_WARMUP` to control the run, and use `BENCH_FILTER=division` to select matching cases. `pnpm run --silent benchmark:json` emits clean, machine-readable results for before-and-after comparisons. Filters are applied before fixture setup, so a focused run does not construct or retain unrelated large-number and collection fixtures.

Cases cover construction, parsing, formatting, comparisons, multiplication and squaring, division, signed addition/subtraction, long zero padding, roots at 20/200/800 digits, logarithms, exponentials, sine, cached constants, and large min/max collections. Keep the runtime version, fixtures, iteration count, warmup, and sample count identical when comparing builds.

See the [architecture notes](Architecture.md) for the internal dependency boundaries enforced by `pnpm run test:architecture`.

### Releases

The `Release` GitHub Actions workflow publishes npm and GitHub releases from version tags:

1. Update `package.json` to the intended version.
2. Run `pnpm install --frozen-lockfile` and `pnpm run verify`, then commit the release changes.
3. Tag that commit with the same version prefixed by `v`, for example `git tag v2.0.0`.
4. Push the tag, for example `git push origin v2.0.0`. The workflow verifies and publishes the package to npm, then creates a GitHub release with generated release notes.

Before the first automated publish, configure an npm [trusted publisher](https://docs.npmjs.com/trusted-publishers/) for GitHub Actions and `@neutrium/decimal`. Set its repository to `neutrium/decimal`, its workflow filename to `release.yml`, and its allowed action to `npm publish`.