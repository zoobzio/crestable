import { describe, expect, expectTypeOf, it } from "vitest";
import type { Provider } from "../src/kit";
import { defineCrest, defineSchema } from "../src/index";
import { defineCrestableConfig } from "../src/config";
import { defineProvider, defineState } from "../src/kit";

describe("crestable", () => {
  it("exposes the consumer surface at the root", () => {
    expect(defineCrest).toBeTypeOf("function");
    expect(defineSchema).toBeTypeOf("function");
  });

  it("exposes the declaration helper at ./config", () => {
    expect(defineCrestableConfig).toBeTypeOf("function");
  });

  it("declares a contract with its literals pinned", () => {
    const contract = {
      scopes: ["docs:read"],
      roles: ["editor"],
      meta: { plan: ["free", "pro"] },
    } as const;

    // Identity at runtime: the contract stays plain, serializable data.
    expect(defineCrestableConfig(contract)).toBe(contract);

    // No `as const` needed: the const type parameter pins the literals.
    const declared = defineCrestableConfig({
      scopes: ["docs:read"],
      roles: ["editor"],
      meta: { plan: ["free", "pro"] },
    });
    expectTypeOf(declared.scopes).toEqualTypeOf<readonly ["docs:read"]>();
    expectTypeOf(declared.roles).toEqualTypeOf<readonly ["editor"]>();
    expectTypeOf(declared.meta.plan).toEqualTypeOf<readonly ["free", "pro"]>();
  });

  it("exposes the provider surface at ./kit", () => {
    expect(defineProvider).toBeTypeOf("function");
    expect(defineState).toBeTypeOf("function");
  });

  it("wires a provider through the service end to end", async () => {
    const schema = defineSchema({
      scopes: ["docs:read", "docs:write"],
      roles: ["editor", "admin"],
      meta: {},
    });

    const provider: Provider<(typeof schema)["base"]> = {
      login: async () => {},
      logout: async () => {},
      resolve: async (state) => {
        state.current = {
          id: "user-1",
          scopes: ["docs:read"],
          roles: ["editor"],
          meta: {},
        };
      },
    };

    const crestable = defineCrest(schema, provider);

    await crestable.resolve();
    expect(crestable.can("docs:read")).toBe(true);
    expect(crestable.can("docs:write")).toBe(false);
    expect(crestable.is("editor")).toBe(true);
    expect(crestable.is("admin")).toBe(false);
  });
});
