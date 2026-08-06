import type { UsersOptions, UserEvents, Users } from "./types";
import type { User } from "@crucible/schema";

import { assertUser } from "@crucible/schema";

export const defineUsers = <Meta, Credentials = void, Context = unknown>(
  options: UsersOptions<Meta, Credentials, Context>,
): Users<Meta, Credentials, Context> => {
  const { provider } = options;

  let current: User<Meta> | null = null;

  const handlers: {
    [Event in keyof UserEvents<Meta>]: Set<
      (payload: UserEvents<Meta>[Event]) => void
    >;
  } = {
    change: new Set(),
    denied: new Set(),
  };

  function emit<Event extends keyof UserEvents<Meta>>(
    event: Event,
    payload: UserEvents<Meta>[Event],
  ): void {
    for (const handler of handlers[event]) handler(payload);
  }

  function set(user: User<Meta> | null): User<Meta> | null {
    if (user !== null) assertUser(user);
    const changed = user !== current;
    current = user;
    if (changed) emit("change", current);
    return current;
  }

  return {
    get current() {
      return current;
    },
    get authenticated() {
      return current !== null;
    },
    get stale() {
      return (
        current?.expiresAt !== undefined && current.expiresAt <= Date.now()
      );
    },
    can(...scopes) {
      const user = current;
      const granted =
        user !== null && scopes.every((scope) => user.scopes.includes(scope));
      if (!granted) emit("denied", { scopes, user });
      return granted;
    },
    async resolve(ctx) {
      return set(await provider.resolve(ctx));
    },
    async login(credentials) {
      const user = await provider.login(credentials);
      // null means the flow continues out-of-band (e.g. a redirect); any
      // existing state stays untouched until resolve() runs on return.
      return user === null ? null : set(user);
    },
    async logout() {
      if (current !== null) await provider.logout(current);
      set(null);
    },
    async refresh() {
      if (current === null || provider.refresh === undefined) return current;
      return set(await provider.refresh(current));
    },
    on(event, handler) {
      handlers[event].add(handler);
      return () => {
        handlers[event].delete(handler);
      };
    },
  };
};
