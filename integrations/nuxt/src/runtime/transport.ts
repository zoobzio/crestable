import type { Contract, Schema } from "warded";
import type { Provider } from "warded/kit";

import { useRequestFetch } from "#imports";

import { PREFIX } from "../constant";

/**
 * Dials a warded route. `useRequestFetch` returns a fetch that forwards
 * the incoming request's cookies during SSR, so a server-side `resolve()`
 * reaches the session route with the user's cookie attached; in the browser
 * it is a plain same-origin fetch.
 */
const call = async (
  action: string,
  options?: { method: "POST" },
): Promise<unknown> => {
  const request = useRequestFetch();
  return await request(`${PREFIX}/${action}`, options);
};

/**
 * A wire payload proven and narrowed, or `null` for an empty answer.
 */
const settle = <C extends Contract>(schema: Schema<C>, payload: unknown) =>
  payload === null || payload === undefined ? null : schema.parse.user(payload);

/**
 * The browser-side provider the module ships. Its vendor is the app's own
 * warded routes: every callback dials `${PREFIX}/…`, the wire answers
 * with the session state after the action, and the payload is proven
 * against the schema before it lands in state. The auth host never reaches
 * the browser — the user's real provider runs only inside the server
 * handlers.
 */
export const transport = <C extends Contract>(): Provider<C> => ({
  login: async (state, schema) => {
    const payload = await call("login", { method: "POST" });
    // An empty answer means the flow continues out-of-band; state stays
    // untouched until resolve() runs on return.
    const user = settle(schema, payload);
    if (user !== null) {
      state.current = user;
    }
  },
  logout: async (state) => {
    await call("logout", { method: "POST" });
    state.current = null;
  },
  resolve: async (state, schema) => {
    const payload = await call("session");
    state.current = settle(schema, payload);
  },
  refresh: async (state, schema) => {
    const payload = await call("refresh", { method: "POST" });
    state.current = settle(schema, payload);
  },
});
