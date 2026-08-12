// Typecheck-only stub for the Nuxt `#app` virtual module.
import type { AppWard } from "../runtime/types";

/** The Nuxt app instance. `$warded` is added by the warded runtime. */
export interface NuxtApp {
  $warded: AppWard;
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
