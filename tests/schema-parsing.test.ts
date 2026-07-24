import JSIS from '../src'
import assert from 'node:assert'
import { describe, it } from 'node:test'

const mockSchema = [
  { key: 'Firstname', type: 'string' },
  { key: 'score', type: 'float' },
  { key: 'Lastname', type: 'string', size: 13 },
  { key: 'Age', type: 'integer' },
  { key: 'Subscribed', type: 'boolean' },
  { key: 'Followers', type: 'integer' },
  { key: 'Description', type: 'string', size: 256 }
] as const

describe('Schema::Parsing', () => {
  const { rom, schema } = JSIS.create(8, ...mockSchema)
  const runtime = JSIS.parse(rom)

  it('Has fields', () => assert.equal(Object.keys(schema?.fields).length > 0, true))
  it('Matches fields', () =>
    assert.deepEqual(
      Object.keys(schema?.fields)
        .map((e) => e.toLowerCase())
        .sort(),
      Object.keys(runtime.fields).sort()
    ))

  it('Parsed fields', () => assert.equal(runtime.fields && runtime.fields instanceof Object, true))
  it('Parsed header', () =>
    assert.equal(
      (Array.isArray(runtime.header) && runtime.header.length) ||
        runtime.header instanceof Int16Array,
      true
    ))
  it('Defined Storage context', () => assert.equal(runtime.rom instanceof Int16Array, true))
  it('Defined stackPointer', () => assert.equal(typeof runtime.stackPointer, 'number'))

  it('Decouples Storage', () => {
    assert.notEqual(runtime.rom, rom)
    assert.equal(runtime.rom.length < rom?.length, true)
  })

  it('Matches range', () => assert.equal(schema?.range, runtime.range))
})

describe('Schema::Parsing - Edge Cases', () => {
  it('Parse with empty ROM', () => {
    const rom = new Int16Array([])
    const runtime = JSIS.parse(rom)
    assert.equal(runtime.stackPointer, 0)
  })

  it('Parse with only header (no data)', () => {
    const { rom, schema } = JSIS.create(1, { key: 'test', type: 'string' })
    const runtime = JSIS.parse(rom)
    assert.equal(runtime.fields !== undefined, true)
    assert.equal(runtime.rom.length > 0, true)
  })
})

describe('Schema::Reconstruction', () => {
  it('Parse and reconstructed schema matches original', () => {
    const { rom, schema } = JSIS.create(2,
      { key: 'name', type: 'string', size: 32 },
      { key: 'age', type: 'integer' },
      { key: 'active', type: 'boolean' }
    )

    const runtime = JSIS.parse(rom)

    assert.deepEqual(
      Object.keys(schema.fields).sort(),
      Object.keys(runtime.fields).sort()
    )

    Object.keys(schema.fields).forEach((key) => {
      assert.equal(schema.fields[key].type, runtime.fields[key].type)
      assert.equal(schema.fields[key].blocks, runtime.fields[key].blocks)
    })
  })

  it('Parsed schema with no header data', () => {
    const emptyRom = new Int16Array(10)
    const runtime = JSIS.parse(emptyRom)

    assert.equal(runtime.stackPointer, 0)
    assert.equal(Object.keys(runtime.fields).length, 0)
  })
})
