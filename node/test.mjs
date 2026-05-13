import path, { extname } from 'node:path'
import { readdirSync, unlinkSync, statSync } from 'node:fs'

import esbuild from 'esbuild'

const findTestFiles = (dir, pattern = /\.test\.ts$/) => {
  const files = []
  try {
    const entries = readdirSync(dir)
    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isFile() && pattern.test(entry)) {
        files.push(fullPath)
      }
    })
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err.message)
  }
  return files
}

const findFiles = (dir, pattern = /\.d\.ts$/) => {
  const files = []
  try {
    const entries = readdirSync(dir)
    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry)
      const stat = statSync(fullPath)
      if (stat.isFile() && pattern.test(entry)) {
        files.push(fullPath)
      }
    })
  } catch (err) {
    // Directory may not exist yet
  }
  return files
}

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
  findFiles('dist/tests', /\.d\.ts$/).forEach((filePath) => {
    unlinkSync(filePath)
  })

  console.log(`Built ${testFiles.length} test files`)
})()

