import type { AppContract } from "#build/types/crestable.d.ts";
import type { Crest } from "crestable";

/**
 * The active contract, derived from the build-time template the module
 * writes from `crestable.contract` in nuxt.config.
 */
export type { AppContract };

/**
 * The service provided on the Nuxt app as `$crestable`, typed by the app's
 * own contract: scopes, roles, and meta all carry their declared literals.
 */
export type AppCrest = Crest<AppContract>;

declare module "#app" {
  interface NuxtApp {
    $crestable: AppCrest;
  }
}
