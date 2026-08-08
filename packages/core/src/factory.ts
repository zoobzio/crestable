import type { UsersOptions, UsersState, UserEvents, Users } from "./types";
import type { User } from "@crucible/schema";

import { assertUser } from "@crucible/schema";

export const defineUsers = <Meta, Credentials = void, Context = unknown>(
  options: UsersOptions<Meta, Credentials, Context>,
  state: UsersState<Meta> = { current: null },
): Users<Meta, Credentials, Context> => {
  const { provider } = options;

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
    const changed = user !== state.current;
    state.current = user;
    if (changed) emit("change", state.current);
    return state.current;
  }

  return {
    get current() {
      return state.current;
    },
    get authenticated() {
      return state.current !== null;
    },
    get stale() {
      return (
        state.current?.expiresAt !== undefined &&
        state.current.expiresAt <= Date.now()
      );
    },
    can(...scopes) {
      const user = state.current;
      const granted =
        user !== null && scopes.every((scope) => user.scopes.includes(scope));
      if (!granted) emit("denied", { check: "scope", required: scopes, user });
      return granted;
    },
    is(...roles) {
      const user = state.current;
      const granted =
        user !== null && roles.some((role) => user.roles.includes(role));
      if (!granted) emit("denied", { check: "role", required: roles, user });
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
      if (state.current !== null) await provider.logout(state.current);
      set(null);
    },
    async refresh() {
      if (state.current === null || provider.refresh === undefined) {
        return state.current;
      }
      return set(await provider.refresh(state.current));
    },
    on(event, handler) {
      handlers[event].add(handler);
      return () => {
        handlers[event].delete(handler);
      };
    },
  };
};
