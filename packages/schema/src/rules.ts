import type { Contract, Enum, Rules } from "./types";

import { entries } from "objectively";

import { CONTRACT_KEYS, REQUIRED_USER_KEYS } from "./constant";
import {
  at,
  container,
  each,
  field,
  filled,
  flag,
  list,
  member,
  numeric,
  optional,
  spec,
  subset,
  superset,
  text,
  unique,
} from "./util";

/**
 * Composes a contract's runtime {@link Rules}: a list per kind, with
 * membership read off the contract's sets and the meta struct read off its
 * field declarations. The composite kinds reuse the scalar lists, so every
 * issue carries the path down to the member that failed. The contract kind
 * alone is static — a contract's shape does not depend on a contract — and
 * is what {@link defineSchema} proves its own base against.
 */
export const defineRules = <C extends Contract>(
  base: C,
  enums: Enum<C>,
): Rules => {
  const contract = [
    container("Contract"),
    superset("Contract", CONTRACT_KEYS),
    at("scopes", [
      list("Scopes", [text("Scope"), filled("Scope")]),
      unique("Scopes"),
    ]),
    at("roles", [
      list("Roles", [text("Role"), filled("Role")]),
      unique("Roles"),
    ]),
    at("meta", [container("Meta"), each([spec("Meta field")])]),
  ];

  const scope = [text("Scope"), member("Scope", enums.scopes)];
  const role = [text("Role"), member("Role", enums.roles)];

  const identity = [
    container("User"),
    superset("User", REQUIRED_USER_KEYS),
    at("id", [text("Identifier"), filled("Identifier")]),
    at("email", optional([text("Email")])),
    at("name", optional([text("Name")])),
    at("username", optional([text("Username")])),
    at("avatar", optional([text("Avatar")])),
    at("status", optional([text("Status")])),
    at("issued", optional([numeric("Issued")])),
    at("expires", optional([numeric("Expiry")])),
    at("verified", optional([flag("Verified")])),
  ];

  const required = entries(base.meta)
    .filter(
      ([, declared]) =>
        !(typeof declared === "string" && declared.endsWith("?")),
    )
    .map(([key]) => key);

  const meta = [
    container("Meta"),
    subset("Meta", enums.meta),
    superset("Meta", required),
    ...entries(base.meta).map(([key, declared]) =>
      at(key, [field(key, declared)]),
    ),
  ];

  return {
    contract,
    scope,
    role,
    scopes: [list("Scopes", scope)],
    roles: [list("Roles", role)],
    meta,
    user: [
      ...identity,
      at("scopes", [list("Scopes", scope)]),
      at("roles", [list("Roles", role)]),
      at("meta", meta),
    ],
  };
};
