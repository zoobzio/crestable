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
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === "string") &&
    (user.email === undefined || typeof user.email === "string") &&
    (user.displayName === undefined || typeof user.displayName === "string") &&
    (user.status === undefined || typeof user.status === "string") &&
    (user.expiresAt === undefined || typeof user.expiresAt === "number") &&
    "meta" in user
  );
}

/** Assert that a value satisfies the {@link User} contract. */
export function assertUser(value: unknown): asserts value is User<unknown> {
  if (!isUser(value)) {
    throw new TypeError(
      "Value does not satisfy the User contract: expected { id: string (non-empty), scopes: string[], roles: string[], meta } with optional string email/displayName/status and a numeric expiresAt.",
    );
  }
}
