import { defineUsers } from "crucible";

import { defineNuxtPlugin } from "#app";

import { accessCrucible } from "./store";
import { transport } from "./transport";

/**
 * Builds the user service once per request over the `useState`-backed state
 * and provides it as `$users`. During SSR it resolves the user through the
 * transport (which forwards the request cookies to the session route), so the
 * state is populated before render and serializes to the client. On the
 * client the state is already hydrated, so it does not resolve again — no
 * refetch, no auth flash.
 */
export default defineNuxtPlugin({
  name: "crucible",
  setup: async () => {
    const state = accessCrucible();
    const users = defineUsers({ provider: transport() }, state.value);

    if (import.meta.server) {
      await users.resolve();
    }

    return {
      provide: { users },
    };
  },
});
