import { describe, expect, it, vi } from "vitest";
import type { Meta, User } from "@warded/schema";
import { SchemaError, defineSchema } from "@warded/schema";
import type { Provider, State } from "@warded/kit";
import { defineWard } from "../src/index";

const schema = defineSchema({
  scopes: ["docs:read", "docs:write", "admin"],
  roles: ["editor", "admin", "owner"],
  meta: { name: "string" },
});

type C = (typeof schema)["base"];

const ada = (): User<Meta<C>> => ({
  id: "user-1",
  scopes: ["docs:read", "docs:write"],
  roles: ["editor"],
  meta: { name: "Ada" },
});

function fakeProvider(overrides: Partial<Provider<C>> = {}): Provider<C> {
  return {
    login: vi.fn(async (state) => {
      state.current = ada();
    }),
    logout: vi.fn(async () => {}),
    resolve: vi.fn(async (state) => {
      state.current = ada();
    }),
    ...overrides,
  };
}

describe("state", () => {
  it("mutates a caller-owned container in place", async () => {
    const target: State<C> = { current: null };
    const warded = defineWard(schema, fakeProvider(), target);

    await warded.resolve();
    // The owner of the object sees the change without going through the
    // service — this is what lets Nuxt back the container with useState.
    expect(target.current).toEqual(ada());

    await warded.logout();
    expect(target.current).toBeNull();
  });

  it("seeds the current user from the passed-in container", () => {
    const target: State<C> = { current: ada() };
    const warded = defineWard(schema, fakeProvider(), target);

    expect(warded.current).toEqual(ada());
    expect(warded.authenticated).toBe(true);
  });
});

describe("resolve", () => {
  it("establishes state through the provider and emits change", async () => {
    const provider = fakeProvider();
    const warded = defineWard(schema, provider);
    const onChange = vi.fn();
    warded.on("change", onChange);

    await expect(warded.resolve()).resolves.toEqual(ada());
    expect(provider.resolve).toHaveBeenCalledOnce();
    expect(warded.current).toEqual(ada());
    expect(warded.authenticated).toBe(true);
    expect(onChange).toHaveBeenCalledWith(ada());
  });

  it("hands the provider the guarded state and the schema", async () => {
    const provider = fakeProvider();
    const warded = defineWard(schema, provider);

    await warded.resolve();
    expect(provider.resolve).toHaveBeenCalledWith(
      expect.objectContaining({ current: ada() }),
      schema,
    );
  });

  it("clears state when the provider resolves no user", async () => {
    const provider = fakeProvider();
    const warded = defineWard(schema, provider);
    await warded.resolve();

    vi.mocked(provider.resolve).mockImplementationOnce(async (state) => {
      state.current = null;
    });
    await expect(warded.resolve()).resolves.toBeNull();
    expect(warded.current).toBeNull();
    expect(warded.authenticated).toBe(false);
  });

  it("rejects a provider write that violates the contract", async () => {
    const provider = fakeProvider({
      resolve: vi.fn(async (state) => {
        state.current = { id: "" } as unknown as User<Meta<C>>;
      }),
    });
    const warded = defineWard(schema, provider);

    await expect(warded.resolve()).rejects.toThrow(SchemaError);
    expect(warded.current).toBeNull();
  });
});

describe("login", () => {
  it("resolves to the user the provider establishes", async () => {
    const provider = fakeProvider();
    const warded = defineWard(schema, provider);

    await expect(warded.login()).resolves.toEqual(ada());
    expect(provider.login).toHaveBeenCalledOnce();
    expect(warded.current).toEqual(ada());
  });

  it("emits login with the established user", async () => {
    const warded = defineWard(schema, fakeProvider());
    const onLogin = vi.fn();
    warded.on("login", onLogin);

    await warded.login();
    expect(onLogin).toHaveBeenCalledExactlyOnceWith(ada());
  });

  it("does not emit login for an out-of-band flow", async () => {
    const provider = fakeProvider({ login: vi.fn(async () => {}) });
    const warded = defineWard(schema, provider);
    const onLogin = vi.fn();
    warded.on("login", onLogin);

    await warded.login();
    expect(onLogin).not.toHaveBeenCalled();
  });

  it("leaves state untouched when the flow continues out-of-band", async () => {
    const provider = fakeProvider({ login: vi.fn(async () => {}) });
    const warded = defineWard(schema, provider);
    await warded.resolve();
    const onChange = vi.fn();
    warded.on("change", onChange);

    await expect(warded.login()).resolves.toEqual(ada());
    expect(warded.current).toEqual(ada());
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("tears down via the provider and clears state", async () => {
    const provider = fakeProvider();
    const warded = defineWard(schema, provider);
    await warded.resolve();
    const onChange = vi.fn();
    warded.on("change", onChange);

    await warded.logout();
    expect(provider.logout).toHaveBeenCalledOnce();
    expect(warded.current).toBeNull();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("clears once when the provider clears state itself", async () => {
    const provider = fakeProvider({
      logout: vi.fn(async (state) => {
        state.current = null;
      }),
    });
    const warded = defineWard(schema, provider);
    await warded.resolve();
    const onChange = vi.fn();
    warded.on("change", onChange);

    await warded.logout();
    expect(warded.current).toBeNull();
    expect(onChange).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("emits logout with the user that left", async () => {
    const warded = defineWard(schema, fakeProvider());
    await warded.resolve();
    const onLogout = vi.fn();
    warded.on("logout", onLogout);

    await warded.logout();
    expect(onLogout).toHaveBeenCalledExactlyOnceWith(ada());
  });

  it("skips the provider when already unauthenticated", async () => {
    const provider = fakeProvider();
    const warded = defineWard(schema, provider);
    const onLogout = vi.fn();
    warded.on("logout", onLogout);

    await warded.logout();
    expect(provider.logout).not.toHaveBeenCalled();
    expect(onLogout).not.toHaveBeenCalled();
  });
});

describe("refresh", () => {
  it("lets the provider revalidate state in place", async () => {
    const provider = fakeProvider({
      refresh: vi.fn(async (state) => {
        state.current = { ...ada(), expires: 2000 };
      }),
    });
    const warded = defineWard(schema, provider);
    await warded.resolve();

    await expect(warded.refresh()).resolves.toEqual({
      ...ada(),
      expires: 2000,
    });
    expect(provider.refresh).toHaveBeenCalledOnce();
  });

  it("clears state when the session is gone", async () => {
    const provider = fakeProvider({
      refresh: vi.fn(async (state) => {
        state.current = null;
      }),
    });
    const warded = defineWard(schema, provider);
    await warded.resolve();

    await expect(warded.refresh()).resolves.toBeNull();
    expect(warded.current).toBeNull();
  });

  it("is a no-op without a provider refresh or a current user", async () => {
    const warded = defineWard(schema, fakeProvider());
    await warded.resolve();
    await expect(warded.refresh()).resolves.toEqual(ada());

    const refresh = vi.fn(async () => {});
    const anonymous = defineWard(schema, fakeProvider({ refresh }));
    await expect(anonymous.refresh()).resolves.toBeNull();
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("deep mutation", () => {
  it("tracks valid deep writes and emits change", async () => {
    const warded = defineWard(schema, fakeProvider());
    await warded.resolve();
    const onChange = vi.fn();
    warded.on("change", onChange);

    warded.current!.meta.name = "Grace";
    expect(warded.current?.meta.name).toBe("Grace");
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("rejects invalid deep writes without emitting", async () => {
    const warded = defineWard(schema, fakeProvider());
    await warded.resolve();
    const onChange = vi.fn();
    warded.on("change", onChange);

    expect(() => {
      warded.current!.scopes.push("docs:delete" as never);
    }).toThrow(SchemaError);
    expect(warded.current?.scopes).toEqual(ada().scopes);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("can", () => {
  it("grants when the user holds every scope", async () => {
    const warded = defineWard(schema, fakeProvider());
    await warded.resolve();

    expect(warded.can("docs:read")).toBe(true);
    expect(warded.can("docs:read", "docs:write")).toBe(true);
  });

  it("denies on a missing scope and emits the denial", async () => {
    const warded = defineWard(schema, fakeProvider());
    await warded.resolve();
    const onDenied = vi.fn();
    warded.on("denied", onDenied);

    expect(warded.can("docs:read", "admin")).toBe(false);
    expect(onDenied).toHaveBeenCalledWith({
      check: "scope",
      required: ["docs:read", "admin"],
      user: ada(),
    });
  });

  it("denies when unauthenticated", () => {
    const warded = defineWard(schema, fakeProvider());
    const onDenied = vi.fn();
    warded.on("denied", onDenied);

    expect(warded.can("docs:read")).toBe(false);
    expect(onDenied).toHaveBeenCalledWith({
      check: "scope",
      required: ["docs:read"],
      user: null,
    });
  });
});

describe("is", () => {
  it("grants when the user holds any of the roles", async () => {
    const warded = defineWard(schema, fakeProvider());
    await warded.resolve();

    expect(warded.is("editor")).toBe(true);
    expect(warded.is("admin", "editor")).toBe(true);
  });

  it("denies when the user holds none and emits the denial", async () => {
    const warded = defineWard(schema, fakeProvider());
    await warded.resolve();
    const onDenied = vi.fn();
    warded.on("denied", onDenied);

    expect(warded.is("admin", "owner")).toBe(false);
    expect(onDenied).toHaveBeenCalledWith({
      check: "role",
      required: ["admin", "owner"],
      user: ada(),
    });
  });
});

describe("vocabulary", () => {
  it("carries the contract's vocabulary in the check types", async () => {
    const warded = defineWard(schema, fakeProvider());
    await warded.resolve();

    // @ts-expect-error — a scope outside the contract fails to compile
    expect(warded.can("docs:delete")).toBe(false);
    // @ts-expect-error — a role outside the contract fails to compile
    expect(warded.is("viewer")).toBe(false);
  });
});

describe("stale", () => {
  it("reports false without a user or an expiry", async () => {
    const warded = defineWard(schema, fakeProvider());
    expect(warded.stale).toBe(false);

    await warded.resolve();
    expect(warded.stale).toBe(false);
  });

  it("reports staleness from expires without acting on it", async () => {
    const provider = fakeProvider({
      resolve: vi.fn(async (state) => {
        state.current = { ...ada(), expires: Date.now() - 1000 };
      }),
    });
    const warded = defineWard(schema, provider);
    await warded.resolve();

    expect(warded.stale).toBe(true);
    expect(warded.authenticated).toBe(true);
  });
});

describe("on", () => {
  it("stops delivering after unsubscribe", async () => {
    const warded = defineWard(schema, fakeProvider());
    const onChange = vi.fn();
    const off = warded.on("change", onChange);

    off();
    await warded.resolve();
    expect(onChange).not.toHaveBeenCalled();
  });
});
