import type { AppContract } from "#build/types/crestable.d.ts";

import { defineCrest, defineSchema } from "crestable";

import { defineNuxtPlugin } from "#app";
import { contract } from "#build/crestable.mjs";

import { accessCrest } from "./store";
import { transport } from "./transport";

/**
 * Builds the service once per request over the `useState`-backed container
 * and provides it as `$crestable`. The schema derives from the build-time
 * contract, so the same vocabulary rules both sides of the wire. During SSR
 * the service resolves through the transport (which forwards the request
 * cookies to the session route), so state is populated before render and
 * serializes to the client. On the client the state is already hydrated, so
 * it does not resolve again — no refetch, no auth flash.
 */
export default defineNuxtPlugin({
  name: "crestable",
  setup: async () => {
    const schema = defineSchema(contract);
    const state = accessCrest();
    const crestable = defineCrest(
      schema,
      transport<AppContract>(),
      state.value,
    );

    if (import.meta.server) {
      await crestable.resolve();
    }

    return {
      provide: { crestable },
    };
  },
});
