import { describe, expect, it } from "vitest";
import type { User } from "@crucible/schema";
import { defineProvider } from "../src/index";

interface Meta {
  plan: "free" | "pro";
}

const ada: User<Meta> = {
  id: "user-1",
  scopes: ["docs:read"],
  roles: ["editor"],
  meta: { plan: "pro" },
};

describe("defineProvider", () => {
  it("returns the provider unchanged", () => {
    const provider = defineProvider({
      login: async (_credentials: { token: string }) => ada,
      logout: async () => {},
      resolve: async () => ada,
    });

    expect(provider.resolve()).resolves.toEqual(ada);
    expect(provider.refresh).toBeUndefined();
  });

  it("preserves credential typing through inference", async () => {
    const provider = defineProvider({
      login: async (credentials: { token: string }) =>
        credentials.token === "valid" ? ada : null,
      logout: async () => {},
      resolve: async () => null,
    });

    await expect(provider.login({ token: "valid" })).resolves.toEqual(ada);
    await expect(provider.login({ token: "nope" })).resolves.toBeNull();
  });
});
