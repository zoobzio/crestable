import { describe, expect, it } from "vitest";
import type { Provider } from "../src/kit";
import { defineWard, defineSchema } from "../src/index";
import { defineProvider, defineState } from "../src/kit";

describe("warded", () => {
  it("exposes the consumer surface at the root", () => {
    expect(defineWard).toBeTypeOf("function");
    expect(defineSchema).toBeTypeOf("function");
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

    const warded = defineWard(schema, provider);

    await warded.resolve();
    expect(warded.can("docs:read")).toBe(true);
    expect(warded.can("docs:write")).toBe(false);
    expect(warded.is("editor")).toBe(true);
    expect(warded.is("admin")).toBe(false);
  });
});
