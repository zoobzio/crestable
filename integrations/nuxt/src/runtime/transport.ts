import type { Provider, User } from "crucible";

import { useRequestFetch } from "#imports";

import { PREFIX } from "../constant";

/**
 * The browser-side provider the module ships. It implements the same
 * `Provider` contract as the user's server provider, but its "backend" is the
 * Nuxt server: every method calls the matching `${PREFIX}/…` route, which runs
 * the user's real provider via `defineCrucibleHandlers`.
 *
 * `useRequestFetch` returns a fetch that forwards the incoming request's
 * cookies during SSR, so a server-side `resolve()` reaches the session route
 * with the user's cookie attached; in the browser it is a plain same-origin
 * fetch. Either way the auth host stays server-side — the browser only ever
 * sees `${PREFIX}`.
 */
export const transport = <Meta, Credentials = void>(): Provider<
  Meta,
  Credentials
> => {
  const call = async <T>(
    action: string,
    options?: { method: "POST"; body?: unknown },
  ): Promise<T> => {
    const request = useRequestFetch();
    return (await request(`${PREFIX}/${action}`, options)) as T;
  };

  return {
    resolve: () => call<User<Meta> | null>("session"),
    login: (credentials) =>
      call<User<Meta> | null>("login", { method: "POST", body: credentials }),
    logout: async () => {
      await call("logout", { method: "POST" });
    },
    refresh: () => call<User<Meta> | null>("refresh", { method: "POST" }),
  };
};
