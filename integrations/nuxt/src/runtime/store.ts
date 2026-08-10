import type { UsersState } from "crucible";

import { useState } from "#imports";

import { STATE_KEY } from "../constant";

/**
 * The per-request state object the service is built over. Held in `useState`
 * so its `current` field survives the server→client transfer and Vue tracks
 * the in-place mutations `defineUsers` makes — the service itself stays
 * reactivity-agnostic.
 */
export const accessCrucible = <Meta>() =>
  useState<UsersState<Meta>>(STATE_KEY, () => ({ current: null }));
