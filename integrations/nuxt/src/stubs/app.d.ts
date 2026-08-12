// Typecheck-only stub for the Nuxt `#app` virtual module.
import type { AppCrucible } from "../runtime/types";

/** The Nuxt app instance. `$crucible` is added by the crucible runtime. */
export interface NuxtApp {
  $crucible: AppCrucible;
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
