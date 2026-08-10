import { describe, expect, it, vi } from "vitest";
import type { Provider, User } from "crucible";

// The handler only uses these four h3 helpers; stub them so the dispatcher can
// be driven with a plain fake event. `defineEventHandler` becomes identity, so
// the returned handler is the raw async function.
vi.mock("h3", () => ({
  defineEventHandler: (fn: unknown) => fn,
  getRouterParam: (event: FakeEvent, name: string) => event.params[name],
  readBody: async (event: FakeEvent) => event.body,
  createError: (opts: { statusCode: number; statusMessage: string }) =>
    Object.assign(new Error(opts.statusMessage), opts),
}));

import { defineCrucibleHandlers } from "../../src/server/handlers";

interface Meta {
  name: string;
}

type Credentials = { token: string };

interface FakeEvent {
  params: Record<string, string>;
  body?: unknown;
}

const ada: User<Meta> = {
  id: "user-1",
  scopes: ["docs:read"],
  roles: ["editor"],
  meta: { name: "Ada" },
};

function fakeProvider(
  overrides: Partial<Provider<Meta, Credentials, FakeEvent>> = {},
): Provider<Meta, Credentials, FakeEvent> {
  return {
    login: vi.fn(async () => ada),
    logout: vi.fn(async () => {}),
    resolve: vi.fn(async () => ada),
    ...overrides,
  };
}

function handlers(provider: Provider<Meta, Credentials, FakeEvent>) {
  // The h3 mock makes defineEventHandler identity, so the handler is callable
  // directly with a fake event.
  return defineCrucibleHandlers(
    provider as unknown as Provider<Meta, Credentials>,
  ) as unknown as (event: FakeEvent) => Promise<unknown>;
}

function event(action: string, body?: unknown): FakeEvent {
  return { params: { action }, body };
}

describe("defineCrucibleHandlers", () => {
  it("session resolves the current user from the event", async () => {
    const provider = fakeProvider();
    const handle = handlers(provider);

    await expect(handle(event("session"))).resolves.toEqual(ada);
    expect(provider.resolve).toHaveBeenCalledWith(event("session"));
  });

  it("session returns null when unauthenticated", async () => {
    const provider = fakeProvider({ resolve: vi.fn(async () => null) });
    await expect(handlers(provider)(event("session"))).resolves.toBeNull();
  });

  it("login forwards the request body to the provider", async () => {
    const provider = fakeProvider();
    const handle = handlers(provider);

    await expect(handle(event("login", { token: "t" }))).resolves.toEqual(ada);
    expect(provider.login).toHaveBeenCalledWith({ token: "t" });
  });

  it("logout tears down the resolved session", async () => {
    const provider = fakeProvider();
    const handle = handlers(provider);

    await expect(handle(event("logout"))).resolves.toEqual({ ok: true });
    expect(provider.logout).toHaveBeenCalledWith(ada);
  });

  it("logout skips the provider when there is no session", async () => {
    const provider = fakeProvider({ resolve: vi.fn(async () => null) });
    const handle = handlers(provider);

    await expect(handle(event("logout"))).resolves.toEqual({ ok: true });
    expect(provider.logout).not.toHaveBeenCalled();
  });

  it("refresh revalidates the resolved session", async () => {
    const renewed = { ...ada, expiresAt: 2000 };
    const provider = fakeProvider({ refresh: vi.fn(async () => renewed) });

    await expect(handlers(provider)(event("refresh"))).resolves.toEqual(
      renewed,
    );
  });

  it("refresh returns the user unchanged when the provider omits refresh", async () => {
    const provider = fakeProvider();
    await expect(handlers(provider)(event("refresh"))).resolves.toEqual(ada);
  });

  it("rejects an unknown action with a 404", async () => {
    const provider = fakeProvider();
    await expect(handlers(provider)(event("bogus"))).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
