import JSIS from '../src'
import assert from 'node:assert'
import { describe, it } from 'node:test'

describe('Utils::Encode/Decode - Basic', () => {
  it('Encode and decode boolean true', () => {
    const encoded = JSIS.encode(true)
    const decoded = JSIS.decode(encoded, 'boolean')
    assert.equal(decoded, true)
  })

  it('Encode and decode boolean false', () => {
    const encoded = JSIS.encode(false)
    const decoded = JSIS.decode(encoded, 'boolean')
    assert.equal(decoded, false)
  })

  it('Encode and decode integer', () => {
    const value = 42
    const encoded = JSIS.encode(value)
    const decoded = JSIS.decode(encoded, 'integer')
    assert.equal(decoded, value)
  })

  it('Encode and decode float', () => {
    const value = 3.14159
    const encoded = JSIS.encode(value)
    const decoded = JSIS.decode(encoded, 'float')
    assert.equal(Math.abs(decoded - value) < 0.0001, true)
  })

  it('Encode and decode string', () => {
    const value = 'Hello World'
    const encoded = JSIS.encode(value)
    const decoded = JSIS.decode(encoded, 'string')
    assert.equal(decoded, value)
  })

  it('Encode undefined returns undefined', () => {
    const encoded = JSIS.encode(undefined)
    assert.equal(encoded, undefined)
  })

  it('Decode undefined returns false (boolean)', () => {
    const decoded = JSIS.decode(undefined, 'boolean')
    assert.equal(decoded, false)
  })

  it('Encode negative integer', () => {
    const value = -12345
    const encoded = JSIS.encode(value)
    const decoded = JSIS.decode(encoded, 'integer')
    assert.equal(decoded, value)
  })

  it('Encode negative float', () => {
    const value = -99.99
    const encoded = JSIS.encode(value)
    const decoded = JSIS.decode(encoded, 'float')
    assert.equal(Math.abs(decoded - value) < 0.0001, true)
  })
})

describe('Utils::Encode/Decode - Extended Types', () => {
  it('Encode zero values', () => {
    const encoded = JSIS.encode(0)
    assert.equal(encoded instanceof Int16Array, true)
    assert.equal(encoded[0], 0)
  })

  it('Encode and decode multi-character strings', () => {
    const texts = ['A', 'AB', 'ABC', 'The quick brown fox']
    texts.forEach((text) => {
      const encoded = JSIS.encode(text)
      const decoded = JSIS.decode(encoded, 'string')
      assert.equal(decoded, text)
    })
  })

  it('Encode and decode numeric strings as text', () => {
    const value = '12345'
    const encoded = JSIS.encode(value)
    const decoded = JSIS.decode(encoded, 'string')
    assert.equal(decoded, value)
  })

  it('Encode booleans returns scalar', () => {
    assert.equal(JSIS.encode(true), 1)
    assert.equal(JSIS.encode(false), 0)
  })

  it('Encode integers returns Int16Array', () => {
    const encoded = JSIS.encode(1)
    assert.equal(encoded instanceof Int16Array, true)
  })

  it('Decode with explicit type override', () => {
    const value = 65
    const asChar = JSIS.decode(value, 'integer')
    assert.equal(asChar, 65)
  })
})

describe('Utils::Decode Type Inference', () => {
  it('Decode infers boolean from length', () => {
    const boolEncoded = JSIS.encode(true)
    const decoded = JSIS.decode(boolEncoded)
    assert.equal(typeof decoded, 'boolean')
  })

  it('Decode infers integer from 4-byte length', () => {
    const intEncoded = JSIS.encode(12345)
    const decoded = JSIS.decode(intEncoded)
    assert.equal(decoded, 12345)
  })

  it('Decode string null termination', () => {
    const encoded = JSIS.encode('Test')
    const decoded = JSIS.decode(encoded, 'string')
    assert.equal(decoded, 'Test')
    assert.equal(decoded?.includes('\0'), false)
  })
})

describe('Utils::Type Validation', () => {
  it('Encode rejects invalid types', () => {
    const invalid = { a: 1 } as any
    const result = JSIS.encode(invalid)
    assert.equal(result, undefined)
  })

  it('Decode works with Int16Array', () => {
    const encoded = JSIS.encode(42) as Int16Array
    const decoded = JSIS.decode(encoded, 'integer')
    assert.equal(decoded, 42)
  })

  it('Decode handles single values', () => {
    const decoded = JSIS.decode(1, 'boolean')
    assert.equal(decoded, true)
  })
})
