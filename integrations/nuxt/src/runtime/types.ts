import type { AppContract } from "#build/types/crucible.d.ts";
import type { Crucible } from "crucible";

/**
 * The active contract, derived from the build-time template the module
 * writes from `crucible.contract` in nuxt.config.
 */
export type { AppContract };

/**
 * The service provided on the Nuxt app as `$crucible`, typed by the app's
 * own contract: scopes, roles, and meta all carry their declared literals.
 */
export type AppCrucible = Crucible<AppContract>;

declare module "#app" {
  interface NuxtApp {
    $crucible: AppCrucible;
  }
}
