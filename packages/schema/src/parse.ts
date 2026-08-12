import type { Assert, Contract, Parse } from "./types";

/**
 * Builds the {@link Parse} bundle: each kind asserts the value and returns
 * it narrowed to the kind type, or lets the {@link SchemaError} from
 * {@link Assert} propagate.
 */
export const defineParse = <C extends Contract>(
  assert: Assert<C>,
): Parse<C> => {
  return {
    contract: (v: unknown) => {
      assert.contract(v);
      return v;
    },
    scope: (v: unknown) => {
      assert.scope(v);
      return v;
    },
    role: (v: unknown) => {
      assert.role(v);
      return v;
    },
    scopes: (v: unknown) => {
      assert.scopes(v);
      return v;
    },
    roles: (v: unknown) => {
      assert.roles(v);
      return v;
    },
    meta: (v: unknown) => {
      assert.meta(v);
      return v;
    },
    user: (v: unknown) => {
      assert.user(v);
      return v;
    },
  };
};
