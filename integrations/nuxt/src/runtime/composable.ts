import type { AppCrest } from "./types";

import { useNuxtApp } from "#app";

/**
 * The service, typed by the app's contract: `current`, `can`/`is`, the
 * lifecycle, and events.
 */
export const useCrest = (): AppCrest => useNuxtApp().$crestable;
