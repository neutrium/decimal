# Architecture

The library is divided into five internal layers:

1. `Decimal` is the public facade and delegates calculations to numerical kernels.
2. `ConstructorEnvironment` owns constructor configuration, safe calculation constructors, and cached default contexts.
3. `CalculationContext` is an immutable calculation policy and carries the runtime capabilities used to brand operands and allocate intermediate or result values.
4. Files under `methods/` implement numerical kernels. They may import `Decimal` as a TypeScript type, but must not import the facade at runtime.
5. `DecimalState` provides token-controlled access to native private representation state.

## Dependency boundary

Numerical kernels depend on `CalculationContext`, state helpers, configuration types, constants, and other kernels. Runtime allocation and `Decimal` identity checks are performed through the context's `DecimalRuntime` capability. This keeps the public facade out of the kernel runtime graph.

Arithmetic and comparison kernels share `normaliseOperand` as their input boundary. It preserves
existing Decimal identity and parses primitive operands through an unlimited derived context, leaving
configured exponent limits as result policy rather than input normalization.

`pnpm run test:architecture` enforces this boundary.

## Trigonometric responsibilities

Each public trigonometric operation has its own kernel module. Direct circular functions retain only
their private series kernels, while inverse, hyperbolic, and inverse-hyperbolic operations compose
those focused modules. Shared angle reduction, Taylor series, and pi access remain separate helpers.
This keeps the dependency graph acyclic and allows future feature entry points to include individual
operations without importing an entire sine, cosine, or tangent family.

## Constructor configuration

`ConstructorEnvironment` stores immutable configuration snapshots per constructor. Arbitrary subclasses inherit their nearest registered configuration, while `Decimal.clone()` registers a safe calculation constructor with an independent snapshot.

`normaliseDecimalConfig` is the single validation and merge boundary for constructor updates. Its numeric range table is exhaustively typed against the numeric fields of `DecimalConfig`.

The readonly `Constructor.config` snapshot and its partial-object setter form the only public
configuration path. Individual fields, including precision and rounding, do not expose separate
static mutation properties, so every update has the same validation, atomicity, and context-cache
invalidation behavior.

## Private capabilities

Internal runtime and state access use module-private symbols rather than named public hooks or a module-global registration service. The symbols and corresponding class members are stripped from published declarations.
