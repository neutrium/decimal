# Development

`pnpm run verify` cleans and builds the library once, then reuses that artifact for
type/declaration checks, benchmark smoke tests, and packed-package validation. The build
also type-checks the source. Standalone validation commands still prepare their own builds;
their `:built` variants require an existing current `dist` and are used by full verification.

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
pnpm run build        # Compile the library and refresh README bundle sizes
pnpm run typecheck    # Check all TypeScript source, including unused locals and parameters
pnpm run demo         # Start the interactive demo development server
pnpm run docs         # Build the TypeDoc API reference and production demo in docs/api
pnpm run docs:check   # Validate public API documentation without writing output
pnpm run verify       # Run all source, declaration, package, and runtime checks
pnpm run benchmark    # Run deterministic performance benchmarks
```

For everyday changes, use `test`, `typecheck`, and `build`; run `verify` before handing
off a change. `tsc` and the `:built` commands are lower-level building blocks—you normally
do not need to run them directly.

## Documentation and demo

Run `pnpm run demo` to serve the interactive demo locally at
`http://127.0.0.1:4173/demo/`. The development server watches the demo and library
source files for changes.

Run `pnpm run docs` to create the complete production documentation site in
`docs/api`. This generates the TypeDoc API reference and builds the demo into
`docs/api/demo`, using relative asset and API links suitable for GitHub Pages.

The `Documentation` GitHub Actions workflow runs this production build automatically
after every push to `master`. It uploads `docs/api` as the Pages artifact and deploys
it to the `github-pages` environment. The workflow can also be started manually with
`workflow_dispatch` from the repository's Actions page.

## Benchmarking

Benchmark runs use fixed fixtures and report the median, minimum, and maximum time across seven samples. Set `BENCH_ITERATIONS`, `BENCH_SAMPLES`, or `BENCH_WARMUP` to control the run, and use `BENCH_FILTER=division` to select matching cases. `pnpm run --silent benchmark:json` emits clean, machine-readable results for before-and-after comparisons. Filters are applied before fixture setup, so a focused run does not construct or retain unrelated large-number and collection fixtures.

Cases cover construction, parsing, formatting, comparisons, multiplication and squaring, division, signed addition/subtraction, long zero padding, roots at 20/200/800 digits, logarithms, exponentials, sine, cached constants, and large min/max collections. Keep the runtime version, fixtures, iteration count, warmup, and sample count identical when comparing builds.

See the [architecture notes](Architecture.md) for the internal dependency boundaries enforced by `pnpm run test:architecture`.

## Tier metadata and package fixtures

Edit `scripts/tier-metadata.mjs` to change tier descriptions, entry points, kernel ownership,
or bundle budgets, then run `pnpm run sync:tiers`. This regenerates the public entry modules,
package export map and TypeDoc entry points. `pnpm run build` also refreshes the README table
with measured browser-fixture sizes and metadata budgets. `pnpm run sizes:readme` can refresh
sizes against an already-current `dist`; `node scripts/update-readme-sizes.mjs --check` checks
for stale sizes without writing. Measurements use in-memory bundles and need no package
installation or network access. `pnpm run test:metadata` verifies
that generated files match; builds and documentation builds run this check automatically.

`pnpm run test:architecture` first runs synthetic tooling tests, then builds and validates the
real source graph once. Infrastructure uniqueness and stale-path checks are part of that same
validation pass. Violations include a dependency path, including intermediate barrel modules.

`scripts/fixtures/package-consumer` is a standalone TypeScript consumer application.
`pnpm run test:package` copies it into a temporary directory, installs the local packed tarball,
compiles its TypeScript, runs the emitted Node entry points, and bundles each browser fixture.
Each fixture contains assertions for its expected numerical result. Byte budgets come from the
tier catalogue. Bundled modules must belong to the selected tier or a lower tier; unknown modules
fail validation. Module counts are informational, except unused imports must retain zero modules.
The shared `scripts/lib/bundle-measurement.mjs` normalizes local and installed `dist` paths to
source paths, including real package paths behind symlinks. It is used by README size generation
and packed-package validation; only local measurement aliases exact entry-point specifiers
(independent of alias order), while installed
validation exercises package exports normally. Development
scripts and fixtures are checked to be absent from the published package.

### Releases

The `Release` GitHub Actions workflow publishes npm and GitHub releases from version tags:

1. Update `package.json` to the intended version.
2. Run `pnpm install --frozen-lockfile` and `pnpm run verify`, then commit the release changes.
3. Tag that commit with the same version prefixed by `v`, for example `git tag v2.0.0`.
4. Push the tag, for example `git push origin v2.0.0`. The workflow verifies and publishes the package to npm, then creates a GitHub release with generated release notes.

Before the first automated publish, configure an npm [trusted publisher](https://docs.npmjs.com/trusted-publishers/) for GitHub Actions and `@neutrium/decimal`. Set its repository to `neutrium/decimal`, its workflow filename to `release.yml`, and its allowed action to `npm publish`.
