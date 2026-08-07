/**
 * The fixed top-level shape every crucible user satisfies. `Meta` is the
 * consumer-defined portion, typed per service instance.
 */
export interface User<Meta> {
  /**
   * Stable unique identifier, as issued by the authentication provider.
   */
  id: string;

  /**
   * Email address, when the provider supplies one.
   */
  email?: string;

  /**
   * Human-readable display name, when the provider supplies one.
   */
  displayName?: string;

  /**
   * Account status as reported by the provider (e.g. "active",
   * "suspended"). Crucible does not interpret it.
   */
  status?: string;

  /**
   * Granted scopes — the fine-grained authorization surface `can()` checks
   * against. Effective for the context the user was resolved in.
   */
  scopes: string[];

  /**
   * Assigned roles — coarse-grained authorization, a peer of scopes.
   * Effective for the context the user was resolved in.
   */
  roles: string[];

  /**
   * Epoch-milliseconds timestamp after which the session is considered
   * stale. Crucible never acts on staleness itself; it only reports it.
   */
  expiresAt?: number;

  /**
   * Consumer-defined fields.
   */
  meta: Meta;
}

/**
 * The interaction contract between crucible and an authentication service.
 * Crucible never implements authentication — a provider wraps a particular
 * auth API (Auth0, a homegrown JWT backend, …) and the service delegates
 * every vendor touchpoint to it.
 */
export interface Provider<Meta, Credentials = void, Context = unknown> {
  /**
   * Initiate authentication. May resolve to a user directly (password
   * grant, magic-link verify) or to `null` when the flow continues
   * out-of-band (redirect-based login) — in that case `resolve` picks the
   * session up when the flow returns.
   */
  login(credentials: Credentials): Promise<User<Meta> | null>;

  /**
   * Tear down the session on the authentication side.
   */
  logout(user: User<Meta>): Promise<void>;

  /**
   * Establish the current user from ambient context — cookie, header,
   * token. The single authoritative way user state is discovered: called on
   * boot, per request, or after an out-of-band login flow returns.
   */
  resolve(ctx?: Context): Promise<User<Meta> | null>;

  /**
   * Revalidate or extend the session. Resolving to `null` means the
   * session is gone.
   */
  refresh?(user: User<Meta>): Promise<User<Meta> | null>;
}
