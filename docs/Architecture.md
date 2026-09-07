# Architecture

The library is divided into five internal layers:

1. The public facades form the inheritance chain `DecimalLike` → `CoreDecimal` →
   `ArithmeticDecimal` → `ScientificDecimal`. Each tier adds only its
   own operations and delegates calculations to numerical kernels.
2. `DecimalEnvironment` owns constructor configuration, safe calculation constructors, cached default contexts, operand branding, and allocation.
3. `CalculationContext` is an immutable calculation policy. It resolves its environment through an inherited, internal symbol and delegates allocation to that environment.
4. Files under `methods/` implement numerical kernels. They use the minimal `KernelDecimal` representation contract and must not import public facades, even as TypeScript types.
5. `DecimalState` provides token-controlled access to native private representation state.

## Dependency boundary

Numerical kernels depend on `CalculationContext`, state helpers, configuration types, constants, and other kernels. `KernelDecimal` is a type alias for the shared `DecimalLike` representation; `KernelDecimalConstructor` describes only construction. Neither exposes public calculation methods. Runtime allocation and Decimal identity checks are delegated to `DecimalEnvironment`. The context imports the environment as a type only, so environment → context → representation remains acyclic at runtime. Result narrowing is confined to facade boundaries where the allocation tier is known.

Arithmetic and comparison kernels share `normaliseOperand` as their input boundary. It preserves
existing Decimal identity and parses primitive operands through an intermediate context, leaving
configured exponent limits as result policy rather than input normalization.

Calculation policy names its boundary as `public` or `intermediate`. `forIntermediate()`
reuses a cached context which skips configured exponent limits and automatic add/multiply
rounding. It preserves working precision and rounding mode: explicit rounding, division
precision, and resource budgets still apply. This is not unlimited exact arithmetic.

`pnpm run test:architecture` builds separate runtime and complete dependency views using the
TypeScript resolver. Imports, re-exports, inline import types, and literal dynamic imports
are included. It checks transitive facade isolation (including types), runtime tier reachability,
runtime cycles, and the resolved inheritance chain. Diagnostics show the full offending path.
Computed or unresolved module dependencies fail validation rather than silently escaping the graph.

`scripts/tier-metadata.mjs` defines tier ordering, facades, kernel ownership, entry points,
descriptions, and bundle budgets. More specific kernel paths override directory ownership.
Every source module must resolve to a tier; unclassified modules fail validation even if
unreachable from an entry point. Shared infrastructure is explicitly listed in the core tier,
and scientific infrastructure is listed in the scientific tier. The same runtime dependency
rules apply to infrastructure and kernels, including indirect imports through shared helpers.
Graph checks and package validation consume it directly. `pnpm run sync:tiers` updates generated
entry modules, package exports, and TypeDoc entry points; builds check for drift.
After compilation, `scripts/update-readme-sizes.mjs` measures the browser fixtures against
local `dist` using the same bundler configuration as packed-package validation. It refreshes
the marked README table with measured minified sizes, descriptions, and separate budgets.

`InternalConstants.ts` contains only representation parameters and numeric validation limits.
Scientific constant strings and their derived precision limits live in `constants.ts`, with
their parsed templates in `ConstantCache.ts`. Neither scientific module is reachable at runtime
from the core or arithmetic entry points, or permitted as a pure coefficient dependency.

## Pure coefficient algorithms

`methods/arithmetic/coefficients/` owns unsigned base-1e7 addition, subtraction, division, and multiplication
(word convolution, symmetric squaring, and large BigInt products). Division returns
guard words, a base-10 exponent, and a sticky remainder flag; multiplication returns
the full fixed-width product. Both accept readonly arrays and return newly owned arrays.
The surrounding kernels retain signs, special values, allocation, rounding, and precision policy.
Magnitude addition/subtraction return owned digits and an exponent, limiting exponent-gap
alignment using explicit working precision and guard words. A core coefficient comparator
is shared by signed relational comparison and arithmetic sign dispatch.

Prefix bounds are constructed from unsigned coefficient arrays and exponents. The effective
result sign is applied only when allocating each bound, so subtraction cannot depend on an
operand's original sign or whether a freshly parsed operand is reused. Prefix-copy and carry
logic lives alongside magnitude arithmetic.

`methods/utils/coefficients/round.ts` rounds an exclusively owned finite coefficient array
in place and returns its exponent. Sign, precision, rounding code, and sticky discarded digits
are explicit inputs. `finalise.ts` handles Decimal state and applies public exponent limits
after rounding, including sub-unit results. Numeric rounding codes live in the dependency-free
`config/RoundingCodes.ts`; public mode-name validation remains in `RoundingModes.ts`.

`methods/utils/coefficients/prefixed.ts` decodes validated binary/octal/hexadecimal
significands, cancels redundant powers of two, and performs bounded exact decimal expansion.
Syntax validation, configured limits, errors, and Decimal allocation remain in `parse.ts`.
The expansion budget is an explicit scalar input and is checked before expensive powers or shifts.

These modules have no Decimal or context dependency, even through types. Graph validation
restricts their transitive dependencies to other coefficient modules, numeric constants,
and digit-array primitives. Direct tests exercise them using frozen inputs and BigInt oracles
without constructing Decimal instances.

## Feature-tier inheritance

`DecimalLike` owns only the private representation state. `CoreDecimal` adds construction,
comparison, predicates, and formatting; `ArithmeticDecimal` adds arithmetic and rounding;
`ScientificDecimal` adds powers, logarithms, and trigonometry. The scientific entry point
exports that class as both `Decimal` and `ScientificDecimal`; the root entry point re-exports
the scientific entry point. `Decimal.ts` is a source-compatibility re-export with no class or registration.

`min`, `max`, and `clone` have a single runtime implementation on `CoreDecimal`. Richer tiers
use declaration-only static members referencing their constructor interfaces to narrow return
types without overriding the inherited functions. `PI` and `atan2` live only on `ScientificDecimal`.

Each library tier is registered as a safe calculation boundary. A hidden type-only result key
narrows inherited operations to the appropriate library tier without using polymorphic `this`.
Consequently, a scientific calculation can inherit `mul()` and still return the complete
scientific type, while a calculation invoked through an arbitrary application subclass returns
the nearest registered library type rather than incorrectly claiming to retain subclass state.

## Trigonometric responsibilities

Each public trigonometric operation has its own kernel module. Direct circular functions retain only
their private series kernels, while inverse, hyperbolic, and inverse-hyperbolic operations compose
those focused modules. Shared angle reduction, Taylor series, and pi access remain separate helpers.
This keeps the dependency graph acyclic and allows future feature entry points to include individual
operations without importing an entire sine, cosine, or tangent family.

## Constructor configuration

`DecimalEnvironment` stores immutable configuration snapshots per constructor. Arbitrary subclasses inherit their nearest registered configuration, while `Decimal.clone()` registers a safe calculation constructor with an independent snapshot.

Each registered tier or clone has an own, non-enumerable calculation-constructor symbol.
Application subclasses inherit that symbol, so allocation resolves to the nearest safe constructor
without a separate registry or prototype walk. Configuration resolution remains independent:
application subclasses may override configuration without becoming safe allocation constructors.
Cached contexts are refreshed when the resolved configuration snapshot changes identity.

`normaliseDecimalConfig` is the single validation and merge boundary for constructor updates. Its numeric range table is exhaustively typed against the numeric fields of `DecimalConfig`.

The readonly `Constructor.config` snapshot and its partial-object setter form the only public
configuration path. Individual fields, including precision and rounding, do not expose separate
static mutation properties, so every update has the same validation, atomicity, and context-cache
invalidation behavior.

## Private capabilities

Internal runtime and state access use module-private symbols rather than named public hooks or a module-global registration service. The symbols and corresponding class members are stripped from published declarations.
