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

describe('Schema::Create', () => {
  const { rom, schema } = JSIS.create(8, ...mockSchema)

  it('Create Fields', () => assert.equal(schema?.fields && schema?.fields instanceof Object, true))
  it('Create Header', () => assert.equal(schema?.header && schema?.header.length > 0, true))
  it('Create Rom', () => assert.equal(rom instanceof Int16Array, true))
  it('Created range', () => assert.equal(typeof schema?.range, 'number'))
})

describe('Schema::Create - Edge Cases', () => {
  it('Create with zero rows (defaults to ROWS minimum)', () => {
    const { rom, schema } = JSIS.create(0, ...mockSchema)
    assert.equal(schema?.range > 0, true)
    assert.equal(rom?.length, (schema?.header?.length || 0) + schema!.range * JSIS.ROWS)
  })

  it('Create with single row', () => {
    const { rom, schema } = JSIS.create(1, ...mockSchema)
    const expectedLength = (schema?.header?.length || 0) + schema?.range
    assert.equal(rom?.length, expectedLength)
  })

  it('Create with no fields', () => {
    const { rom, schema } = JSIS.create(8)
    assert.equal(Object.keys(schema?.fields || {}).length, 0)
    assert.equal(schema?.range, 0)
  })

  it('Create with duplicate field keys (case insensitive)', () => {
    const { schema } = JSIS.create(8,
      { key: 'Name', type: 'string' },
      { key: 'name', type: 'string' }
    )
    assert.equal(Object.keys(schema?.fields || {}).length, 1)
  })
})

describe('Schema::Memory Layout', () => {
  it('Schema range matches allocated space', () => {
    const { rom, schema } = JSIS.create(10,
      { key: 'a', type: 'integer' },
      { key: 'b', type: 'float' },
      { key: 'c', type: 'boolean' }
    )

    const expectedLength = (schema?.header?.length || 0) + schema!.range * 10
    assert.equal(rom?.length, expectedLength)
  })

  it('Field block allocation is consistent', () => {
    const { schema } = JSIS.create(1,
      { key: 'int', type: 'integer' },
      { key: 'float', type: 'float' },
      { key: 'bool', type: 'boolean' },
      { key: 'str10', type: 'string', size: 10 }
    )

    assert.equal(schema?.fields['int'].blocks, 2)
    assert.equal(schema?.fields['float'].blocks, 4)
    assert.equal(schema?.fields['bool'].blocks, 1)
    assert.equal(schema?.fields['str10'].blocks, 20)
  })

  it('Header overhead calculation', () => {
    const { schema } = JSIS.create(1, { key: 'test', type: 'string' })
    const headerLength = schema?.header?.length || 0

    assert.equal(headerLength > 0, true)
    assert.equal(headerLength === 'test'.length + 3, true)
  })
})
