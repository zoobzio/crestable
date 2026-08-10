import type { Provider } from "crucible";
import type { EventHandler, H3Event } from "h3";

import { createError, defineEventHandler, getRouterParam, readBody } from "h3";

/**
 * Turn a provider into the server endpoints the browser talks to. The user
 * drops one file into their Nitro server — `server/api/_crucible/[action].ts`
 * — whose default export is `defineCrucibleHandlers(provider)`; that single
 * event handler dispatches on the `action` route param to the matching
 * provider method:
 *
 * - `session` → `resolve(event)` — read the current user from the request
 * - `login`   → `login(body)`    — begin authentication
 * - `logout`  → `logout(user)`   — tear the session down
 * - `refresh` → `refresh(user)`  — revalidate the session
 *
 * The provider's context is the h3 event, so it owns all cookie/session
 * reading and writing — crucible never touches the token. This is the only
 * piece the user must wire up; the browser-side transport that calls these
 * routes ships with the module.
 */
export const defineCrucibleHandlers = <Meta, Credentials = void>(
  provider: Provider<Meta, Credentials, H3Event>,
): EventHandler => {
  return defineEventHandler(async (event) => {
    const action = getRouterParam(event, "action");

    switch (action) {
      case "session":
        return await provider.resolve(event);

      case "login": {
        const credentials = (await readBody(event)) as Credentials;
        return await provider.login(credentials);
      }

      case "logout": {
        const user = await provider.resolve(event);
        if (user !== null) await provider.logout(user);
        return { ok: true };
      }

      case "refresh": {
        const user = await provider.resolve(event);
        if (user === null || provider.refresh === undefined) return user;
        return await provider.refresh(user);
      }

      default:
        throw createError({
          statusCode: 404,
          statusMessage: `Unknown crucible action "${action ?? ""}"`,
        });
    }
  });
};
