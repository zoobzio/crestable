/**
 * The route prefix the browser dials and the server handlers mount under.
 * The client transport calls `${PREFIX}/session`, `${PREFIX}/login`, etc.;
 * the user's `defineCrestHandlers` route file lives at
 * `server/api/_crestable/[action].ts` so these paths resolve to it.
 */
export const PREFIX = "/api/_crestable";

/** The `useState` key the user service's state is held under. */
export const STATE_KEY = "crestable:user";
