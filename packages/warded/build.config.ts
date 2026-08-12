import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  entries: ["src/index", "src/kit"],
  outDir: ".dist",
  declaration: true,
  rollup: {
    emitCJS: false,
  },
});
