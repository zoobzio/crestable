import { describe, expect, it } from "vitest";
import { assertUser, isUser } from "../src/index";

const valid = {
  id: "user-1",
  scopes: ["docs:read"],
  roles: ["editor"],
  meta: { name: "Ada" },
};

describe("isUser", () => {
  it("accepts a minimal valid user", () => {
    expect(isUser(valid)).toBe(true);
  });

  it("accepts empty scopes/roles arrays and arbitrary meta", () => {
    expect(isUser({ id: "u", scopes: [], roles: [], meta: null })).toBe(true);
  });

  it("accepts the optional identity fields", () => {
    expect(
      isUser({
        ...valid,
        email: "ada@example.com",
        displayName: "Ada",
        status: "active",
      }),
    ).toBe(true);
  });

  it("accepts a numeric expiresAt", () => {
    expect(isUser({ ...valid, expiresAt: 1750000000000 })).toBe(true);
  });

  it("rejects non-objects", () => {
    expect(isUser(null)).toBe(false);
    expect(isUser(undefined)).toBe(false);
    expect(isUser("user")).toBe(false);
  });

  it("rejects a missing or empty id", () => {
    expect(isUser({ scopes: [], roles: [], meta: {} })).toBe(false);
    expect(isUser({ id: "", scopes: [], roles: [], meta: {} })).toBe(false);
  });

  it("rejects non-string scopes", () => {
    expect(isUser({ ...valid, scopes: ["ok", 42] })).toBe(false);
    expect(isUser({ ...valid, scopes: "docs:read" })).toBe(false);
  });

  it("rejects a missing or non-string roles array", () => {
    expect(isUser({ id: "u", scopes: [], meta: {} })).toBe(false);
    expect(isUser({ ...valid, roles: ["ok", 42] })).toBe(false);
    expect(isUser({ ...valid, roles: "admin" })).toBe(false);
  });

  it("rejects non-string identity fields", () => {
    expect(isUser({ ...valid, email: 42 })).toBe(false);
    expect(isUser({ ...valid, displayName: {} })).toBe(false);
    expect(isUser({ ...valid, status: true })).toBe(false);
  });

  it("rejects a non-numeric expiresAt", () => {
    expect(isUser({ ...valid, expiresAt: "tomorrow" })).toBe(false);
  });

  it("rejects a missing meta key", () => {
    expect(isUser({ id: "u", scopes: [], roles: [] })).toBe(false);
  });
});

describe("assertUser", () => {
  it("passes valid users through", () => {
    expect(() => assertUser(valid)).not.toThrow();
  });

  it("throws a TypeError for invalid values", () => {
    expect(() => assertUser({ id: "u" })).toThrow(TypeError);
  });
});
