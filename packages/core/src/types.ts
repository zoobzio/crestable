import type { Provider, User } from "@crucible/schema";

/** Events a user service emits. Subscribe with {@link Users.on}. */
export interface UserEvents<Meta> {
  /** User state was established, replaced, or cleared. */
  change: User<Meta> | null;

  /**
   * An authorization check failed. `check` says which kind: a `can()` scope
   * check (the user was missing at least one) or an `is()` role check (the
   * user held none of them). `required` is what was asked; `user` is `null`
   * when unauthenticated.
   */
  denied: {
    check: "scope" | "role";
    required: string[];
    user: User<Meta> | null;
  };
}

export interface UsersOptions<Meta, Credentials, Context> {
  provider: Provider<Meta, Credentials, Context>;
}

/**
 * The service's mutable state. `defineUsers` mutates this object in place and
 * never reads it any other way, so a caller that owns the object controls the
 * state — pass a reactive one (e.g. a Nuxt `useState` value) and the mutations
 * are tracked. Omit it and the service creates its own plain object.
 */
export interface UsersState<Meta> {
  current: User<Meta> | null;
}

/**
 * The user service: holds current user state, answers authorization checks,
 * and delegates every authentication touchpoint to its provider.
 */
export interface Users<Meta, Credentials = void, Context = unknown> {
  /** The current user, or `null` when unauthenticated. */
  readonly current: User<Meta> | null;

  /** The current authenticated state. */
  readonly authenticated: boolean;

  /**
   * Whether the current session's `expiresAt` has passed. Crucible only
   * reports staleness — reacting to it (via `refresh` or `logout`) is the
   * consumer's call.
   */
  readonly stale: boolean;

  /**
   * Whether the current user holds every given scope (conjunctive — all are
   * required). Emits `denied` when the answer is no.
   */
  can(...scopes: string[]): boolean;

  /**
   * Whether the current user holds any of the given roles (disjunctive —
   * any one suffices). Emits `denied` when the answer is no.
   */
  is(...roles: string[]): boolean;

  /**
   * Establish the current user from ambient context via the provider. The
   * single authoritative path by which user state is discovered.
   */
  resolve(ctx?: Context): Promise<User<Meta> | null>;

  /**
   * Initiate authentication via the provider. Resolves to the user for
   * direct flows, or `null` when the flow continues out-of-band — call
   * `resolve()` when it returns.
   */
  login(credentials: Credentials): Promise<User<Meta> | null>;

  /** Tear down the session via the provider and clear user state. */
  logout(): Promise<void>;

  /**
   * Revalidate the session via the provider. A `null` result means the
   * session is gone and clears user state. A no-op when unauthenticated or
   * when the provider does not implement `refresh`.
   */
  refresh(): Promise<User<Meta> | null>;

  /** Subscribe to a service event. Returns an unsubscribe function. */
  on<Event extends keyof UserEvents<Meta>>(
    event: Event,
    handler: (payload: UserEvents<Meta>[Event]) => void,
  ): () => void;
}
