import type { AppContract } from "#build/types/warded.d.ts";
import type { Ward } from "warded";

/**
 * The active contract, derived from the build-time template the module
 * writes from `warded.contract` in nuxt.config.
 */
export type { AppContract };

/**
 * The service provided on the Nuxt app as `$warded`, typed by the app's
 * own contract: scopes, roles, and meta all carry their declared literals.
 */
export type AppWard = Ward<AppContract>;

declare module "#app" {
  interface NuxtApp {
    $warded: AppWard;
  }
}
