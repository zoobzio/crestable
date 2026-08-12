// Runtime twin of the typecheck stub: the fixture contract tests build
// their schema from.
export const contract = {
  scopes: ["docs:read", "docs:write"],
  roles: ["editor", "admin"],
  meta: { plan: ["free", "pro"] },
};
