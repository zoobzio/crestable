import type { Users } from "crucible";

/**
 * The user service provided on the Nuxt app as `$users`. `Meta` is `unknown`
 * for now; deriving it from the app's provider (so `current.meta` is typed)
 * is a follow-up that needs a build-time type manifest.
 */
export type AppUsers = Users<unknown>;

declare module "#app" {
  interface NuxtApp {
    $users: AppUsers;
  }
}
