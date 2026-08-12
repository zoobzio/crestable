import type { Assert, Contract, Schema } from "./types";

import { defineAssert } from "./assert";
import { defineCheck } from "./check";
import { defineEnum } from "./enum";
import { defineInspect } from "./inspect";
import { defineParse } from "./parse";
import { defineRules } from "./rules";

/**
 * Builds the runtime validation {@link Schema} for a contract.
 *
 * `enums` derives the vocabulary sets and `rules` composes the list per kind
 * from them; `check` runs those lists as boolean type predicates; `assert`
 * runs them too, collecting every {@link Issue} and throwing a
 * {@link SchemaError}; `parse` asserts and returns the value narrowed;
 * `inspect` captures the outcome as a {@link Result} instead of throwing.
 *
 * The base is validated against the schema's own `contract` kind before the
 * schema is returned, so a malformed contract fails fast at construction.
 *
 * @param base - The contract whose members define the vocabulary; declared
 *   inline, its literals become the `Scope`, `Role`, and `Meta` types every
 *   family narrows to.
 * @returns A schema of derived sets, rule lists, and check/assert/parse/
 *   inspect bundles, all narrowed to the contract's vocabulary.
 */
export const defineSchema = <const C extends Contract>(base: C): Schema<C> => {
  const enums = defineEnum<C>(base);
  const rules = defineRules<C>(base, enums);
  const check = defineCheck<C>(rules);
  const assert: Assert<C> = defineAssert<C>(rules);
  const parse = defineParse<C>(assert);
  const inspect = defineInspect<C>(parse);

  assert.contract(base);

  return { base, enums, rules, check, assert, parse, inspect };
};
