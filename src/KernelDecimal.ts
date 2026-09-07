import type { DecimalLike, DecimalValue } from './DecimalBase.js';

/** Representation capability used by numerical kernels, without public facade methods. */
export type KernelDecimal = DecimalLike;

/** Minimal constructor identity accepted by allocation and configuration infrastructure. */
export type KernelDecimalConstructor = new (value : DecimalValue) => KernelDecimal;

/** Fraction representation produced by a kernel before the facade binds its result tier. */
export type KernelDecimalFraction = readonly [KernelDecimal] | readonly [KernelDecimal, KernelDecimal];
