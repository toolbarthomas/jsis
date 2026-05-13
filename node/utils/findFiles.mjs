import path from 'node:path'
import { readdirSync, statSync } from 'node:fs'

export const findFiles = (dir, pattern = /\.ts$/, onError = null) => {
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
    if (onError) {
      onError(err, dir)
    }
  }
  return files
}

export const findTestFiles = (dir) => {
  return findFiles(dir, /\.test\.ts$/, (err, dir) => {
    console.error(`Error reading directory ${dir}:`, err.message)
  })
}

export const findTypeDefinitions = (dir) => {
  return findFiles(dir, /\.d\.ts$/)
}
