import { describe, expect, it, vi } from "vitest";
import type { Provider, User } from "@crucible/schema";
import { defineUsers } from "../src/index";

interface Meta {
  name: string;
}

type Credentials = { token: string };

const ada: User<Meta> = {
  id: "user-1",
  scopes: ["docs:read", "docs:write"],
  roles: ["editor"],
  meta: { name: "Ada" },
};

function fakeProvider(
  overrides: Partial<Provider<Meta, Credentials>> = {},
): Provider<Meta, Credentials> {
  return {
    login: vi.fn(async () => ada),
    logout: vi.fn(async () => {}),
    resolve: vi.fn(async () => ada),
    ...overrides,
  };
}

describe("resolve", () => {
  it("establishes state from the provider and emits change", async () => {
    const users = defineUsers({ provider: fakeProvider() });
    const onChange = vi.fn();
    users.on("change", onChange);

    await expect(users.resolve()).resolves.toEqual(ada);
    expect(users.current).toEqual(ada);
    expect(users.authenticated).toBe(true);
    expect(onChange).toHaveBeenCalledWith(ada);
  });

  it("clears state when the provider resolves no user", async () => {
    const provider = fakeProvider();
    const users = defineUsers({ provider });
    await users.resolve();

    vi.mocked(provider.resolve).mockResolvedValueOnce(null);
    await expect(users.resolve()).resolves.toBeNull();
    expect(users.current).toBeNull();
    expect(users.authenticated).toBe(false);
  });

  it("passes ambient context through to the provider", async () => {
    const provider = fakeProvider();
    const users = defineUsers({ provider });
    const ctx = { request: "req-1" };

    await users.resolve(ctx);
    expect(provider.resolve).toHaveBeenCalledWith(ctx);
  });

  it("rejects a provider result that violates the User contract", async () => {
    const provider = fakeProvider({
      resolve: vi.fn(async () => ({ id: "" }) as unknown as User<Meta>),
    });
    const users = defineUsers({ provider });

    await expect(users.resolve()).rejects.toThrow(TypeError);
    expect(users.current).toBeNull();
  });
});

describe("login", () => {
  it("delegates credentials and establishes the returned user", async () => {
    const provider = fakeProvider();
    const users = defineUsers({ provider });

    await expect(users.login({ token: "t" })).resolves.toEqual(ada);
    expect(provider.login).toHaveBeenCalledWith({ token: "t" });
    expect(users.current).toEqual(ada);
  });

  it("leaves state untouched when the flow continues out-of-band", async () => {
    const provider = fakeProvider({ login: vi.fn(async () => null) });
    const users = defineUsers({ provider });
    await users.resolve();
    const onChange = vi.fn();
    users.on("change", onChange);

    await expect(users.login({ token: "t" })).resolves.toBeNull();
    expect(users.current).toEqual(ada);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("tears down via the provider and clears state", async () => {
    const provider = fakeProvider();
    const users = defineUsers({ provider });
    await users.resolve();
    const onChange = vi.fn();
    users.on("change", onChange);

    await users.logout();
    expect(provider.logout).toHaveBeenCalledWith(ada);
    expect(users.current).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("skips the provider when already unauthenticated", async () => {
    const provider = fakeProvider();
    const users = defineUsers({ provider });

    await users.logout();
    expect(provider.logout).not.toHaveBeenCalled();
  });
});

describe("refresh", () => {
  it("replaces state with the revalidated user", async () => {
    const renewed = { ...ada, expiresAt: 2000 };
    const provider = fakeProvider({ refresh: vi.fn(async () => renewed) });
    const users = defineUsers({ provider });
    await users.resolve();

    await expect(users.refresh()).resolves.toEqual(renewed);
    expect(provider.refresh).toHaveBeenCalledWith(ada);
    expect(users.current).toEqual(renewed);
  });

  it("clears state when the session is gone", async () => {
    const provider = fakeProvider({ refresh: vi.fn(async () => null) });
    const users = defineUsers({ provider });
    await users.resolve();

    await expect(users.refresh()).resolves.toBeNull();
    expect(users.current).toBeNull();
  });

  it("is a no-op without a provider refresh or a current user", async () => {
    const users = defineUsers({ provider: fakeProvider() });
    await users.resolve();
    await expect(users.refresh()).resolves.toEqual(ada);

    const withRefresh = defineUsers({
      provider: fakeProvider({ refresh: vi.fn(async () => ada) }),
    });
    await expect(withRefresh.refresh()).resolves.toBeNull();
  });
});

describe("can", () => {
  it("grants when the user holds every scope", async () => {
    const users = defineUsers({ provider: fakeProvider() });
    await users.resolve();

    expect(users.can("docs:read")).toBe(true);
    expect(users.can("docs:read", "docs:write")).toBe(true);
  });

  it("denies on a missing scope and emits the denial", async () => {
    const users = defineUsers({ provider: fakeProvider() });
    await users.resolve();
    const onDenied = vi.fn();
    users.on("denied", onDenied);

    expect(users.can("docs:read", "admin")).toBe(false);
    expect(onDenied).toHaveBeenCalledWith({
      check: "scope",
      required: ["docs:read", "admin"],
      user: ada,
    });
  });

  it("denies when unauthenticated", () => {
    const users = defineUsers({ provider: fakeProvider() });
    const onDenied = vi.fn();
    users.on("denied", onDenied);

    expect(users.can("docs:read")).toBe(false);
    expect(onDenied).toHaveBeenCalledWith({
      check: "scope",
      required: ["docs:read"],
      user: null,
    });
  });
});

describe("is", () => {
  it("grants when the user holds any of the roles", async () => {
    const users = defineUsers({ provider: fakeProvider() });
    await users.resolve();

    expect(users.is("editor")).toBe(true);
    expect(users.is("admin", "editor")).toBe(true);
  });

  it("denies when the user holds none and emits the denial", async () => {
    const users = defineUsers({ provider: fakeProvider() });
    await users.resolve();
    const onDenied = vi.fn();
    users.on("denied", onDenied);

    expect(users.is("admin", "owner")).toBe(false);
    expect(onDenied).toHaveBeenCalledWith({
      check: "role",
      required: ["admin", "owner"],
      user: ada,
    });
  });

  it("denies when unauthenticated", () => {
    const users = defineUsers({ provider: fakeProvider() });
    const onDenied = vi.fn();
    users.on("denied", onDenied);

    expect(users.is("editor")).toBe(false);
    expect(onDenied).toHaveBeenCalledWith({
      check: "role",
      required: ["editor"],
      user: null,
    });
  });
});

describe("stale", () => {
  it("reports false without a user or an expiry", async () => {
    const users = defineUsers({ provider: fakeProvider() });
    expect(users.stale).toBe(false);

    await users.resolve();
    expect(users.stale).toBe(false);
  });

  it("reports staleness from expiresAt without acting on it", async () => {
    const expired = { ...ada, expiresAt: Date.now() - 1000 };
    const provider = fakeProvider({ resolve: vi.fn(async () => expired) });
    const users = defineUsers({ provider });
    await users.resolve();

    expect(users.stale).toBe(true);
    expect(users.current).toEqual(expired);
    expect(users.authenticated).toBe(true);
  });
});

describe("on", () => {
  it("stops delivering after unsubscribe", async () => {
    const users = defineUsers({ provider: fakeProvider() });
    const onChange = vi.fn();
    const off = users.on("change", onChange);

    off();
    await users.resolve();
    expect(onChange).not.toHaveBeenCalled();
  });
});
