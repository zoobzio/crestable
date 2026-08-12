import { describe, expect, it } from "vitest";
import type { Contract } from "../src/index";
import { SchemaError, defineSchema } from "../src/index";

const schema = defineSchema({
  scopes: ["docs:read", "docs:write"],
  roles: ["admin", "editor"],
  meta: {
    plan: ["free", "pro"],
    org: "string",
    age: "number?",
    beta: "boolean?",
  },
});

const ada = {
  id: "user-1",
  scopes: ["docs:read"],
  roles: ["editor"],
  meta: { plan: "pro", org: "zoobz" },
};

describe("defineSchema", () => {
  it("rejects a malformed contract at construction", () => {
    // A structurally mangled cast fails derivation before the assert runs.
    expect(() =>
      defineSchema({ scopes: ["a"], roles: [] } as unknown as Contract),
    ).toThrow();
    expect(() =>
      defineSchema({
        scopes: ["a", "a"],
        roles: [],
        meta: {},
      }),
    ).toThrow(SchemaError);
    expect(() =>
      defineSchema({
        scopes: [],
        roles: [],
        meta: { plan: "text" as never },
      }),
    ).toThrow(SchemaError);
    expect(() =>
      defineSchema({
        scopes: [],
        roles: [],
        meta: { plan: [] as never },
      }),
    ).toThrow(SchemaError);
  });

  it("derives the vocabulary sets", () => {
    expect(schema.enums.scopes).toEqual(new Set(["docs:read", "docs:write"]));
    expect(schema.enums.roles).toEqual(new Set(["admin", "editor"]));
    expect(schema.enums.meta).toEqual(new Set(["plan", "org", "age", "beta"]));
    expect(schema.base.scopes).toEqual(["docs:read", "docs:write"]);
  });

  it("infers the vocabulary types from the contract", () => {
    // Compile-time proof: the parsed values are literal unions, not string.
    const scope: "docs:read" | "docs:write" = schema.parse.scope("docs:read");
    const role: "admin" | "editor" = schema.parse.role("editor");
    const meta = schema.parse.meta({ plan: "free", org: "zoobz" });
    const plan: "free" | "pro" = meta.plan;
    const age: number | undefined = meta.age;
    expect([scope, role, plan, age]).toEqual([
      "docs:read",
      "editor",
      "free",
      undefined,
    ]);
  });
});

describe("contract kind", () => {
  it("gates untrusted contract data", () => {
    expect(schema.check.contract(schema.base)).toBe(true);
    expect(schema.check.contract({ scopes: [], roles: [], meta: {} })).toBe(
      true,
    );
    expect(schema.check.contract({ scopes: [], roles: [] })).toBe(false);
    expect(schema.check.contract(null)).toBe(false);
  });

  it("reports declaration issues with their paths", () => {
    const result = schema.inspect.contract({
      scopes: ["a", "a"],
      roles: [7],
      meta: { plan: "text" },
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "duplicate", path: ["scopes", 1] }),
      expect.objectContaining({ code: "not_string", path: ["roles", 0] }),
      expect.objectContaining({ code: "not_field", path: ["meta", "plan"] }),
    ]);
  });
});

describe("scope and role kinds", () => {
  it("accepts declared members", () => {
    expect(schema.check.scope("docs:write")).toBe(true);
    expect(schema.check.role("admin")).toBe(true);
  });

  it("rejects undeclared members and non-strings", () => {
    expect(schema.check.scope("docs:delete")).toBe(false);
    expect(schema.check.role(42)).toBe(false);
    const result = schema.inspect.scope("docs:delete");
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "not_member",
        expected: ["docs:read", "docs:write"],
      }),
    ]);
  });
});

describe("scopes and roles kinds", () => {
  it("accepts lists drawn from the vocabulary", () => {
    expect(schema.check.scopes([])).toBe(true);
    expect(schema.check.scopes(["docs:read", "docs:write"])).toBe(true);
    expect(schema.check.roles(["editor"])).toBe(true);
  });

  it("points at the undeclared entry", () => {
    const result = schema.inspect.scopes(["docs:read", "docs:delete"]);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "not_member", path: [1] }),
    ]);
  });
});

describe("meta kind", () => {
  it("accepts a construction matching the declarations", () => {
    expect(schema.check.meta({ plan: "free", org: "zoobz" })).toBe(true);
    expect(
      schema.check.meta({ plan: "pro", org: "zoobz", age: 42, beta: true }),
    ).toBe(true);
  });

  it("treats ?-suffixed fields as optional", () => {
    expect(schema.check.meta({ plan: "free", org: "zoobz" })).toBe(true);
    expect(
      schema.check.meta({ plan: "free", org: "zoobz", age: undefined }),
    ).toBe(true);
  });

  it("requires plain and enum fields", () => {
    const result = schema.inspect.meta({ age: 42 });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "missing", expected: ["plan", "org"] }),
    ]);
  });

  it("rejects members outside the declarations", () => {
    const result = schema.inspect.meta({
      plan: "free",
      org: "zoobz",
      tier: "gold",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "unknown" }),
    ]);
  });

  it("rules each member by its declaration", () => {
    const result = schema.inspect.meta({ plan: "gold", org: 7, age: "old" });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "not_member", path: ["plan"] }),
      expect.objectContaining({ code: "not_string", path: ["org"] }),
      expect.objectContaining({ code: "not_number", path: ["age"] }),
    ]);
  });
});

describe("user kind", () => {
  it("accepts a user inside the contract", () => {
    expect(schema.check.user(ada)).toBe(true);
    expect(schema.parse.user(ada)).toBe(ada);
  });

  it("rejects grants outside the vocabulary, with the path", () => {
    const result = schema.inspect.user({
      ...ada,
      scopes: ["docs:read", "docs:delete"],
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "not_member", path: ["scopes", 1] }),
    ]);
  });

  it("rules the meta construction in place", () => {
    const result = schema.inspect.user({ ...ada, meta: { plan: "free" } });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.issues).toEqual([
      expect.objectContaining({
        code: "missing",
        path: ["meta"],
        expected: ["plan", "org"],
      }),
    ]);
  });

  it("accepts the optional identity members", () => {
    expect(
      schema.check.user({
        ...ada,
        email: "ada@example.com",
        name: "Ada",
        username: "ada",
        avatar: "https://example.com/ada.png",
        status: "active",
        issued: 1740000000000,
        expires: 1750000000000,
        verified: true,
      }),
    ).toBe(true);
  });

  it("rejects non-objects and missing members", () => {
    expect(schema.check.user(null)).toBe(false);
    expect(schema.check.user("user")).toBe(false);
    expect(schema.check.user({ id: "u", scopes: [], roles: [] })).toBe(false);
  });

  it("still rules the identity members", () => {
    expect(schema.check.user({ ...ada, id: "" })).toBe(false);
    expect(schema.check.user({ ...ada, id: "  " })).toBe(false);
    expect(schema.check.user({ ...ada, email: 42 })).toBe(false);
    expect(schema.check.user({ ...ada, name: {} })).toBe(false);
    expect(schema.check.user({ ...ada, username: 7 })).toBe(false);
    expect(schema.check.user({ ...ada, avatar: [] })).toBe(false);
    expect(schema.check.user({ ...ada, status: true })).toBe(false);
    expect(schema.check.user({ ...ada, issued: "yesterday" })).toBe(false);
    expect(schema.check.user({ ...ada, expires: "tomorrow" })).toBe(false);
    expect(schema.check.user({ ...ada, verified: "yes" })).toBe(false);
  });
});
