import type { ComputedRef } from "vue";
import type { AppAuth } from "./types";

import { useNuxtApp } from "#app";
import { computed } from "#imports";

/**
 * The auth service, typed by the app's contract: `current`, `can`/`is`,
 * the lifecycle, and events.
 */
export const useAuth = (): AppAuth => useNuxtApp().$auth;

/**
 * The current user as a reactive ref — a convenience over
 * `useAuth().current` for templates and watchers that only care who is
 * signed in, not the wider service.
 */
export const useUser = (): ComputedRef<AppAuth["current"]> => {
  const auth = useAuth();
  return computed(() => auth.current);
};
