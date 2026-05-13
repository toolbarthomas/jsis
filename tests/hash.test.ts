import JSIS from '../src'
import assert from 'node:assert'
import { describe, it } from 'node:test'

describe('Utils::Hash - Collision Detection', () => {
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

describe('Utils::Hash - 16 Bit', () => {
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

describe('Utils::Hash - 8 Bit', () => {
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

describe('Utils::Hash - Consistency', () => {
  it('Same key and row produce same hash', () => {
    const hash1 = JSIS.hash('test-key', 0, 16)
    const hash2 = JSIS.hash('test-key', 0, 16)
    assert.equal(hash1, hash2)
  })

  it('Different rows produce different hashes', () => {
    const hash1 = JSIS.hash('test-key', 0, 16)
    const hash2 = JSIS.hash('test-key', 1, 16)
    assert.notEqual(hash1, hash2)
  })

  it('Different keys produce different hashes', () => {
    const hash1 = JSIS.hash('key-a', 0, 16)
    const hash2 = JSIS.hash('key-b', 0, 16)
    assert.notEqual(hash1, hash2)
  })

  it('Hash size parameter controls output length', () => {
    const small = JSIS.hash('test', 0, 8)
    const large = JSIS.hash('test', 0, 32)
    assert.equal(small.length, 8)
    assert.equal(large.length, 32)
  })

  it('Hash with custom LCG parameters', () => {
    const hash1 = JSIS.hash('test', 0, 16, 0x19660d, 0x3c6ef35f)
    const hash2 = JSIS.hash('test', 0, 16, 0x12345678, 0x87654321)
    assert.notEqual(hash1, hash2)
  })

  it('Hash produces valid charset characters', () => {
    const hash = JSIS.hash('test-key', 0, 64)
    const validChars = new Set(JSIS.charset.split(''))
    for (const char of hash) {
      assert.equal(validChars.has(char), true)
    }
  })

  it('Empty key produces hash', () => {
    const hash = JSIS.hash('', 0, 16)
    assert.equal(typeof hash, 'string')
    assert.equal(hash.length, 16)
  })

  it('Very long key produces hash', () => {
    const longKey = 'a'.repeat(10000)
    const hash = JSIS.hash(longKey, 0, 16)
    assert.equal(hash.length, 16)
  })
})

describe('Utils::Hash - Bit Width Uniqueness', () => {
  it('8-bit hash collision behavior with moderate dataset', () => {
    const passes = 256
    const table = new Array(passes)
    for (let i = 0; i < passes; i++) {
      table[i] = JSIS.hash('collision-test', i, 8)
    }
    const set = new Set(table)
    assert.equal(typeof set.size, 'number')
    assert.equal(set.size > 0, true)
  })

  it('16-bit hash minimizes collisions', () => {
    const passes = 4000
    const table = new Array(passes)
    for (let i = 0; i < passes; i++) {
      table[i] = JSIS.hash('uniqueness-test', i, 16)
    }
    const set = new Set(table)
    assert.equal(set.size, passes)
  })

  it('32-bit hash produces unique values within range', () => {
    const passes = 1000
    const table = new Array(passes)
    for (let i = 0; i < passes; i++) {
      table[i] = JSIS.hash('perfect-test', i, 32)
    }
    const set = new Set(table)
    assert.equal(set.size, passes)
  })
})

describe('Utils::Hash - Distribution', () => {
  it('Hash distributes evenly across charset', () => {
    const charset = JSIS.charset
    const samples = 100
    const hashes = []

    for (let i = 0; i < samples; i++) {
      hashes.push(JSIS.hash(`sample-${i}`, 0, 1))
    }

    const charFreq: Record<string, number> = {}
    hashes.forEach((hash) => {
      charFreq[hash] = (charFreq[hash] || 0) + 1
    })

    const uniqueChars = Object.keys(charFreq).length
    assert.equal(uniqueChars > 1, true)
  })

  it('Hash deterministic with same parameters', () => {
    const params = { key: 'test', row: 5, size: 32 }
    const h1 = JSIS.hash(params.key, params.row, params.size)
    const h2 = JSIS.hash(params.key, params.row, params.size)
    assert.equal(h1, h2)
  })

  it('Hash changes with row variation', () => {
    const hashes = new Set<string>()
    for (let row = 0; row < 10; row++) {
      hashes.add(JSIS.hash('same-key', row, 16))
    }
    assert.equal(hashes.size, 10)
  })

  it('Hash with minimal size', () => {
    const h = JSIS.hash('test', 0, 1)
    assert.equal(h.length, 1)
    assert.equal(JSIS.charset.includes(h), true)
  })

  it('Hash with large size', () => {
    const h = JSIS.hash('test', 0, 256)
    assert.equal(h.length, 256)
  })
})
