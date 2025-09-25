import JSIS from '../src'
import assert, { equal } from 'assert'
import { describe, it } from 'mocha'

describe('Utils::Hash 32', () => {
  const passes = 0x50000
  let currentPass = passes
  const table = new Array(passes)
  const key = 'example.table.32'

  while (currentPass) {
    currentPass--

    table[currentPass] = JSIS.hash(key, currentPass, 0x20)
  }

  const set = new Set(table)

  it(`32 Bit hash ${key} => ${passes}`, () => assert.equal(set.size, table.length))
})

describe('Utils::Hash 16', () => {
  const passes = 0x4000
  let currentPass = passes
  const table = new Array(passes)
  const key = 'example.table.16'

  while (currentPass) {
    currentPass--

    table[currentPass] = JSIS.hash(key, currentPass)
  }

  const set = new Set(table)

  it(`16 Bit hash ${key} => ${passes}`, () => assert.equal(set.size, table.length))
})

describe('Utils::Hash 8 Bit', () => {
  const passes = 0x1000
  let currentPass = passes
  const table = new Array(passes)
  const key = 'example.table.8'

  while (currentPass) {
    currentPass--

    table[currentPass] = JSIS.hash(key, currentPass, 0x08)
  }

  const set = new Set(table)

  it(`8 Bit hash ${key} => ${passes}`, () => assert.equal(set.size, table.length))
})
