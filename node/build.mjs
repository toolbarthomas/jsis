import esbuild from 'esbuild'

import { parse } from '@toolbarthomas/argumentje'

/**
 * Compiles the required modules.
 */
;(async () => {
  const { minify } = parse()
  const defaults = {
    bundle: true,
    entryPoints: ['./src/index.ts'],
    external: [],
    minify,
    keepNames: true,
    metafile: false,
    outdir: 'dist',
    platform: 'browser',
    outExtension: { '.js': minify ? '.min.js' : '.js' }
  }

  esbuild.build({ ...defaults, format: 'esm' }).then(() => {
    console.info(`Package compiled.`)
  })
})()
