/**
 * The scalar keywords a meta {@link Field} declaration may name, `?`-suffixed
 * forms included.
 */
export const KEYWORDS = new Set<string>([
  "string",
  "string?",
  "number",
  "number?",
  "boolean",
  "boolean?",
]);

/**
 * The members every {@link Contract} carries.
 */
export const CONTRACT_KEYS: readonly string[] = ["scopes", "roles", "meta"];

/**
 * The members every {@link User} carries; the rest of the shape is optional.
 */
export const REQUIRED_USER_KEYS: readonly string[] = [
  "id",
  "scopes",
  "roles",
  "meta",
];
