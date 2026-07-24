import JSIS from '../src'
import assert from 'node:assert'
import { describe, it } from 'node:test'

describe('Features::Multiple Row Operations', () => {
  const { rom, schema } = JSIS.create(5,
    { key: 'id', type: 'integer' },
    { key: 'name', type: 'string', size: 32 },
    { key: 'score', type: 'float' }
  )

  it('Write and read different values across rows', () => {
    const data = [
      { id: 1, name: 'Alice', score: 95.5 },
      { id: 2, name: 'Bob', score: 87.3 },
      { id: 3, name: 'Charlie', score: 92.1 },
      { id: 4, name: 'Diana', score: 88.9 },
      { id: 5, name: 'Eve', score: 99.2 }
    ]

    data.forEach((item, idx) => {
      JSIS.write('id', item.id, schema, rom, idx)
      JSIS.write('name', item.name, schema, rom, idx)
      JSIS.write('score', item.score, schema, rom, idx)
    })

    data.forEach((item, idx) => {
      assert.equal(JSIS.read('id', schema, rom, idx), item.id)
      assert.equal(JSIS.read('name', schema, rom, idx), item.name)
      assert.equal(Math.abs((JSIS.read('score', schema, rom, idx) as number) - item.score) < 0.01, true)
    })
  })

  it('Update single field across all rows', () => {
    const newName = 'Updated'
    for (let i = 0; i < 5; i++) {
      JSIS.write('name', newName, schema, rom, i)
    }

    for (let i = 0; i < 5; i++) {
      assert.equal(JSIS.read('name', schema, rom, i), newName)
    }
  })

  it('Rows are independent', () => {
    const { rom: rom2, schema: schema2 } = JSIS.create(3, { key: 'value', type: 'integer' })

    JSIS.write('value', 10, schema2, rom2, 0)
    JSIS.write('value', 20, schema2, rom2, 1)
    JSIS.write('value', 30, schema2, rom2, 2)

    assert.equal(JSIS.read('value', schema2, rom2, 0), 10)
    assert.equal(JSIS.read('value', schema2, rom2, 1), 20)
    assert.equal(JSIS.read('value', schema2, rom2, 2), 30)

    JSIS.write('value', 99, schema2, rom2, 1)

    assert.equal(JSIS.read('value', schema2, rom2, 0), 10)
    assert.equal(JSIS.read('value', schema2, rom2, 1), 99)
    assert.equal(JSIS.read('value', schema2, rom2, 2), 30)
  })
})

describe('Features::Storage Provider', () => {
  it('defineStorageProvider creates dual storage', () => {
    const { provider, database } = JSIS.defineStorageProvider(256, 512, 'test')

    assert.equal(provider.rom instanceof Int16Array, true)
    assert.equal(database.rom instanceof Int16Array, true)
    assert.equal(provider.schema !== undefined, true)
    assert.equal(database.schema !== undefined, true)
  })

  it('Storage provider with default parameters', () => {
    const { provider, database } = JSIS.defineStorageProvider()

    assert.equal(provider.rom instanceof Int16Array, true)
    assert.equal(database.rom instanceof Int16Array, true)
  })

  it('Provider and database use different keys', () => {
    const { provider, database } = JSIS.defineStorageProvider(2, 64, 'test')

    const providerFieldKey = 'test.data'
    const databaseFieldKey = 'test.file'

    assert.equal(provider.schema?.fields[providerFieldKey] !== undefined, true)
    assert.equal(database.schema?.fields[databaseFieldKey] !== undefined, true)
  })

  it('Provider can store and retrieve data', () => {
    const { provider } = JSIS.defineStorageProvider(1, 128, 'storage')

    const key = 'storage.data'
    const testData = 'Provider Test Data'

    JSIS.write(key, testData, provider.schema!, provider.rom, 0)
    const result = JSIS.read(key, provider.schema!, provider.rom, 0)

    assert.equal(result, testData)
  })
})

describe('Features::Clamp Functionality', () => {
  it('Clamp adjusts float values', () => {
    const original = 3.14159
    const clamped = JSIS.clamp(original, 'float') as number
    assert.equal(Math.abs(clamped - (original - JSIS.CLAMP)) < 0.0001, true)
  })

  it('Clamp preserves non-float values', () => {
    assert.equal(JSIS.clamp(42, 'integer'), 42)
    assert.equal(JSIS.clamp('test', 'string'), 'test')
    assert.equal(JSIS.clamp(true, 'boolean'), true)
  })

  it('Clamp handles undefined', () => {
    assert.equal(JSIS.clamp(undefined), undefined)
  })
})

describe('Features::Normalize', () => {
  const { schema } = JSIS.create(1,
    { key: 'intVal', type: 'integer' },
    { key: 'floatVal', type: 'float' },
    { key: 'strVal', type: 'string' },
    { key: 'boolVal', type: 'boolean' }
  )

  it('Normalize string to integer', () => {
    const result = JSIS.normalize('intval', '42', schema)
    assert.equal(result, 42)
  })

  it('Normalize number to float', () => {
    const result = JSIS.normalize('floatval', 3.14159, schema) as number
    assert.equal(typeof result, 'number')
    assert.equal(result > 0, true)
  })

  it('Normalize number to integer returns undefined (type mismatch)', () => {
    const result = JSIS.normalize('intval', 42, schema)
    assert.equal(result, undefined)
  })

  it('Normalize coerces number to string', () => {
    const result = JSIS.normalize('strval', 12345, schema)
    assert.equal(result, '12345')
  })

  it('Normalize boolean coercion from truthy/falsy', () => {
    assert.equal(JSIS.normalize('boolval', 1, schema), true)
    assert.equal(JSIS.normalize('boolval', 0, schema), false)
    assert.equal(JSIS.normalize('boolval', '', schema), false)
  })

  it('Normalize with object returns undefined', () => {
    const result = JSIS.normalize('intval', { a: 1 } as any, schema)
    assert.equal(result, undefined)
  })

  it('Normalize string value stays string', () => {
    const result = JSIS.normalize('strval', 'test', schema)
    assert.equal(result, 'test')
  })
})

describe('Features::Complex Schemas', () => {
  it('Schema with all field types', () => {
    const { rom, schema } = JSIS.create(1,
      { key: 'boolField', type: 'boolean' },
      { key: 'intField', type: 'integer' },
      { key: 'floatField', type: 'float' },
      { key: 'stringField', type: 'string', size: 50 }
    )

    JSIS.write('boolField', true, schema, rom)
    JSIS.write('intField', 42, schema, rom)
    JSIS.write('floatField', 3.14, schema, rom)
    JSIS.write('stringField', 'mixed types', schema, rom)

    assert.equal(JSIS.read('boolField', schema, rom), true)
    assert.equal(JSIS.read('intField', schema, rom), 42)
    assert.equal(typeof JSIS.read('floatField', schema, rom), 'number')
    assert.equal(JSIS.read('stringField', schema, rom), 'mixed types')
  })

  it('Large string field handling', () => {
    const { rom, schema } = JSIS.create(1,
      { key: 'content', type: 'string', size: 1000 }
    )

    const largeText = 'Lorem ipsum '.repeat(50)
    JSIS.write('content', largeText, schema, rom)
    const result = JSIS.read('content', schema, rom) as string | undefined

    assert.equal(result?.startsWith('Lorem ipsum'), true)
  })

  it('Multiple string fields in schema', () => {
    const { rom, schema } = JSIS.create(1,
      { key: 'firstName', type: 'string', size: 32 },
      { key: 'lastName', type: 'string', size: 32 },
      { key: 'email', type: 'string', size: 64 }
    )

    JSIS.write('firstName', 'John', schema, rom)
    JSIS.write('lastName', 'Doe', schema, rom)
    JSIS.write('email', 'john@example.com', schema, rom)

    assert.equal(JSIS.read('firstName', schema, rom), 'John')
    assert.equal(JSIS.read('lastName', schema, rom), 'Doe')
    assert.equal(JSIS.read('email', schema, rom), 'john@example.com')
  })
})
