// Typecheck-only stub for the Nuxt `#app` virtual module.
import type { AppUsers } from "../runtime/types";

/** The Nuxt app instance. `$users` is added by the crucible runtime. */
export interface NuxtApp {
  $users: AppUsers;
}

interface NuxtPluginDef {
  name: string;
  dependsOn?: string[];
  setup: (
    nuxtApp: NuxtApp,
  ) =>
    | void
    | { provide?: Record<string, unknown> }
    | Promise<void | { provide?: Record<string, unknown> }>;
}

export declare function defineNuxtPlugin(plugin: NuxtPluginDef): NuxtPluginDef;

export declare function useNuxtApp(): NuxtApp;
