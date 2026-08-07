import { describe, expect, it } from "vitest";
import { defineUsers, isUser } from "../src/index";
import { defineProvider } from "../src/kit";

describe("crucible", () => {
  it("exposes the consumer surface at the root", () => {
    expect(defineUsers).toBeTypeOf("function");
    expect(isUser).toBeTypeOf("function");
  });

  it("exposes the provider-author surface at ./kit", () => {
    expect(defineProvider).toBeTypeOf("function");
  });

  it("wires a provider through the service end to end", async () => {
    const provider = defineProvider({
      login: async () => null,
      logout: async () => {},
      resolve: async () => ({
        id: "user-1",
        scopes: ["docs:read"],
        roles: ["editor"],
        meta: { name: "Ada" },
      }),
    });
    const users = defineUsers({ provider });

    await users.resolve();
    expect(users.can("docs:read")).toBe(true);
    expect(users.can("docs:write")).toBe(false);
    expect(users.is("editor")).toBe(true);
    expect(users.is("admin")).toBe(false);
  });
});
