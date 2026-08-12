import type { Contract } from "crestable";
import type { NuxtModule } from "@nuxt/schema";

import { defineSchema } from "crestable";

import {
  addImports,
  addPlugin,
  addServerImports,
  addTemplate,
  addTypeTemplate,
  createResolver,
  defineNuxtModule,
} from "@nuxt/kit";

/**
 * The module's configuration: the app's contract, the one declaration both
 * sides of the wire derive their schema from.
 */
export interface ModuleOptions {
  contract?: Contract;
}

/**
 * A string literal rendered into the type template.
 */
const literal = (value: string): string => JSON.stringify(value);

/**
 * A readonly tuple of literals rendered into the type template.
 */
const tuple = (values: readonly string[]): string =>
  `readonly [${values.map(literal).join(", ")}]`;

/**
 * Nuxt module for crestable.
 *
 * At build time it validates the configured contract by deriving a schema
 * from it, writes the contract to the `crestable.mjs` build template, and
 * derives the `AppContract` literal type into the `types/crestable.d.ts`
 * type template — so the runtime service, the composable, and the server
 * handlers all speak the app's own vocabulary. It registers the runtime
 * plugin (which builds the `$crestable` service and resolves the user during
 * SSR), auto-imports `useCrest` in the app, and auto-imports
 * `defineCrestHandlers` in the Nitro server. The user writes two things:
 * their provider, and the one route file that hands it to
 * `defineCrestHandlers`.
 */
const module: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: "crestable",
    configKey: "crestable",
  },
  setup: (options, _nuxt) => {
    const resolver = createResolver(import.meta.url);

    const contract = options.contract;
    if (!contract) {
      throw new Error(
        "crestable: no contract configured — set `crestable.contract` in nuxt.config.",
      );
    }

    // Fail fast on a malformed contract: deriving the schema proves it.
    defineSchema(contract);

    addTemplate({
      filename: "crestable.mjs",
      write: true,
      getContents: () => `export const contract = ${JSON.stringify(contract)};`,
    });

    addTemplate({
      filename: "crestable.d.mts",
      write: true,
      getContents: () =>
        [
          `import type { AppContract } from "./types/crestable";`,
          `export declare const contract: AppContract;`,
        ].join("\n"),
    });

    addTypeTemplate({
      filename: "types/crestable.d.ts",
      write: true,
      getContents: () => {
        const meta = Object.entries(contract.meta)
          .map(
            ([key, field]) =>
              `${literal(key)}: ${
                typeof field === "string" ? literal(field) : tuple(field)
              }`,
          )
          .join("; ");
        return [
          `export type AppContract = {`,
          `  scopes: ${tuple(contract.scopes)};`,
          `  roles: ${tuple(contract.roles)};`,
          `  meta: { ${meta} };`,
          `};`,
        ].join("\n");
      },
    });

    addPlugin(resolver.resolve("./runtime/plugin"));

    addImports({
      name: "useCrest",
      from: resolver.resolve("./runtime/composable"),
    });

    addServerImports([
      {
        name: "defineCrestHandlers",
        from: resolver.resolve("./server/handlers"),
      },
    ]);
  },
});

export default module;
