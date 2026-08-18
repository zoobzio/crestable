import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: [
    "src/module",
    "src/constant",
    "src/server/handlers",
    // The runtime is shipped unbundled: Nuxt resolves these files by path and
    // compiles them in the app, where the #app/#imports virtuals exist.
    { input: "src/runtime/", outDir: ".dist/runtime", builder: "mkdist" },
  ],
  outDir: ".dist",
  declaration: true,
  externals: [
    "vue",
    "#app",
    "#imports",
    "#build/crestable.mjs",
    "#build/types/crestable.d.ts",
    "@nuxt/kit",
    "@nuxt/schema",
    "crestable",
    "crestable/kit",
    "h3",
  ],
  rollup: {
    emitCJS: false,
  },
});
