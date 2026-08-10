import {
  addImports,
  addPlugin,
  addServerImports,
  createResolver,
  defineNuxtModule,
} from "@nuxt/kit";
import type { NuxtModule } from "@nuxt/schema";

/** The module accepts no options yet. */
export type ModuleOptions = Record<string, never>;

/**
 * Nuxt module for crucible.
 *
 * It registers the runtime plugin (which builds the `$users` service and
 * resolves the user during SSR), auto-imports `useUsers` in the app, and
 * auto-imports `defineCrucibleHandlers` in the Nitro server so the user's
 * route file can call it without an import. The user still writes two things:
 * their provider, and the one route file that hands it to
 * `defineCrucibleHandlers`.
 */
const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: "crucible",
    configKey: "crucible",
  },
  setup: (_options, _nuxt) => {
    const resolver = createResolver(import.meta.url);

    addPlugin(resolver.resolve("./runtime/plugin"));

    addImports({
      name: "useUsers",
      from: resolver.resolve("./runtime/composable"),
    });

    addServerImports([
      {
        name: "defineCrucibleHandlers",
        from: resolver.resolve("./server/handlers"),
      },
    ]);
  },
});

export default module;
