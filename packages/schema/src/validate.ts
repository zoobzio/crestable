import type { User } from "./types";

/** Check that a value satisfies the {@link User} contract. */
export function isUser(value: unknown): value is User<unknown> {
  if (typeof value !== "object" || value === null) return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    user.id.length > 0 &&
    Array.isArray(user.scopes) &&
    user.scopes.every((scope) => typeof scope === "string") &&
    (user.expiresAt === undefined || typeof user.expiresAt === "number") &&
    "meta" in user
  );
}

/** Assert that a value satisfies the {@link User} contract. */
export function assertUser(value: unknown): asserts value is User<unknown> {
  if (!isUser(value)) {
    throw new TypeError(
      "Value does not satisfy the User contract: expected { id: string (non-empty), scopes: string[], meta } with an optional numeric expiresAt.",
    );
  }
}
