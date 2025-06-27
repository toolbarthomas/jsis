import esbuild from "esbuild";

/**
 * Compiles the required modules.
 */
(async () => {
  const defaults = {
    bundle: true,
    entryPoints: ["./src/index.ts"],
    external: [],
    keepNames: true,
    metafile: false,
    outdir: "dist",
    platform: "browser",
  };

  esbuild.build({ ...defaults, format: "esm" }).then(() => {
    console.info(`Package compiled.`);
  });
})();
