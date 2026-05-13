import { unlinkSync } from 'node:fs'
import esbuild from 'esbuild'
import { findTestFiles, findTypeDefinitions } from './utils/findFiles.mjs'

;(async () => {
  const testFiles = findTestFiles('tests')

  const defaults = {
    bundle: true,
    entryPoints: testFiles,
    external: ['node:*'],
    minify: false,
    outdir: 'dist/tests',
    platform: 'node',
    format: 'esm',
    outExtension: { '.js': '.mjs' }
  }

  await esbuild.build(defaults)

  // Clean up type definitions
  findTypeDefinitions('dist/tests').forEach((filePath) => {
    unlinkSync(filePath)
  })

  console.log(`Built ${testFiles.length} test files`)
})()

