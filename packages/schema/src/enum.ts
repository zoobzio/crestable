import type { Contract, Enum } from "./types";

import { keys } from "objectively";

/**
 * Materializes the {@link Enum} for a contract: the scope and role sets are
 * read off its vocabularies, the meta key set off its field declarations.
 *
 * @param base - The contract whose members define the vocabulary.
 */
export const defineEnum = <C extends Contract>(base: C): Enum<C> => ({
  scopes: new Set(base.scopes),
  roles: new Set(base.roles),
  meta: new Set(keys(base.meta)),
});
