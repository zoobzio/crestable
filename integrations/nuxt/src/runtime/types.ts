import type { AppContract } from "#build/types/crestable.d.ts";
import type { AuthRequirements } from "./guard";
import type { Crest } from "crestable";

/**
 * The active contract, derived from the build-time template the module
 * writes from `crestable.contract` in nuxt.config.
 */
export type { AppContract };

/**
 * The auth service provided on the Nuxt app as `$auth`, typed by the app's
 * own contract: scopes, roles, and meta all carry their declared literals.
 */
export type AppAuth = Crest<AppContract>;

/**
 * The `auth` page-meta entry the middleware reads, typed by the app's own
 * contract: an undeclared scope or role fails to compile.
 */
export type AppAuthRequirements = AuthRequirements<AppContract>;

declare module "#app" {
  interface NuxtApp {
    $auth: AppAuth;
  }

  interface PageMeta {
    auth?: AppAuthRequirements;
  }
}
