// Typecheck-only stub for the Nuxt `#app` virtual module.
import type { AppCrest } from "../runtime/types";

/** The Nuxt app instance. `$crestable` is added by the crestable runtime. */
export interface NuxtApp {
  $crestable: AppCrest;
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
