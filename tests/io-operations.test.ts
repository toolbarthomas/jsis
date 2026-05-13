import JSIS from '../src'
import assert from 'node:assert'
import { describe, it } from 'node:test'

const mockRow = {
  firstname: 'John',
  score: 4.2,
  lastname: 'Doe',
  description: `
    Qui dolor velit irure officia eu deserunt exercitation non minim.
    Yummy 🍔
  `,
  age: 66,
  subscribed: true,
  followers: 4
}

const mockSchema = [
  { key: 'Firstname', type: 'string' },
  { key: 'score', type: 'float' },
  { key: 'Lastname', type: 'string', size: 13 },
  { key: 'Age', type: 'integer' },
  { key: 'Subscribed', type: 'boolean' },
  { key: 'Followers', type: 'integer' },
  { key: 'Description', type: 'string', size: 256 }
]

describe('IO::Basic Read/Write', () => {
  const { rom, schema } = JSIS.create(8, ...mockSchema)
  const runtime = JSIS.parse(rom)

  JSIS.write('age', mockRow.age, schema, runtime.rom)
  JSIS.write('firstname', mockRow.firstname, schema, runtime.rom)
  JSIS.write('followers', mockRow.followers, schema, runtime.rom)
  JSIS.write('lastname', mockRow.lastname, schema, runtime.rom)
  JSIS.write('score', mockRow.score, schema, runtime.rom)
  JSIS.write('subscribed', mockRow.subscribed, schema, runtime.rom)
  JSIS.write('description', mockRow.description, schema, runtime.rom)

  const age = JSIS.read('age', schema, runtime.rom)
  const firstname = JSIS.read('firstname', schema, runtime.rom)
  const followers = JSIS.read('followers', schema, runtime.rom)
  const lastname = JSIS.read('lastname', schema, runtime.rom)
  const score = JSIS.read('score', schema, runtime.rom)
  const subscribed = JSIS.read('subscribed', schema, runtime.rom)
  const description = JSIS.read('description', schema, runtime.rom)

  it('Read/Write age', () => assert.equal(age, mockRow.age))
  it('Read/Write firstname', () => assert.equal(firstname, mockRow.firstname))
  it('Read/Write lastname', () => assert.equal(lastname, mockRow.lastname))
  it('Read/Write followers', () => assert.equal(followers, mockRow.followers))
  it('Read/Write score', () => assert.equal(score, mockRow.score))
  it('Read/Write subscribed', () => assert.equal(subscribed, mockRow.subscribed))
  it('Read/Write description', () => assert.equal(description, mockRow.description))

  it('Update Field', () => {
    const updateAge = JSIS.write('age', mockRow.age + 1, schema, runtime.rom)

    assert.equal(updateAge, true)
    assert.equal(JSIS.read('age', schema, runtime.rom), mockRow.age + 1)
  })

  it('Read/Write specific row', () => {
    const mockName = 'Jane'
    const mockRow = 3

    JSIS.write('firstname', mockName, schema, runtime.rom, mockRow)
    assert.equal(mockName, JSIS.read('firstname', schema, runtime.rom, mockRow))
  })

  it('Catch overflow', () => {
    const mockName = 'Bobby'
    const mockRow = 20

    assert.equal(JSIS.write('firstname', mockName, schema, runtime.rom, mockRow), false)
    assert.equal(JSIS.read('firstname', schema, runtime.rom, mockRow), undefined)
  })
})

describe('IO::Type Coercion (via Scope)', () => {
  it('Scope coerces string to integer', () => {
    const { rom, schema } = JSIS.create(1, { key: 'value', type: 'integer' })
    const scope = JSIS.scope(schema, rom, () => {})
    const row = scope.row(0)
    row.value = '42'
    assert.equal(row.value, 42)
  })

  it('Scope coerces number to string', () => {
    const { rom, schema } = JSIS.create(1, { key: 'name', type: 'string' })
    const scope = JSIS.scope(schema, rom, () => {})
    const row = scope.row(0)
    row.name = 123
    assert.equal(row.name, '123')
  })

  it('Scope coerces to boolean (truthy)', () => {
    const { rom, schema } = JSIS.create(1, { key: 'active', type: 'boolean' })
    const scope = JSIS.scope(schema, rom, () => {})
    const row = scope.row(0)
    row.active = 'yes'
    assert.equal(row.active, true)
  })

  it('Scope coerces to boolean (falsy)', () => {
    const { rom, schema } = JSIS.create(1, { key: 'active', type: 'boolean' })
    const scope = JSIS.scope(schema, rom, () => {})
    const row = scope.row(0)
    row.active = 0
    assert.equal(row.active, false)
  })

  it('Scope handles float values with clamp', () => {
    const { rom, schema } = JSIS.create(1, { key: 'ratio', type: 'float' })
    const scope = JSIS.scope(schema, rom, () => {})
    const row = scope.row(0)
    row.ratio = 3.14
    const result = row.ratio
    assert.equal(typeof result, 'number')
    assert.equal(Math.abs(result - 3.14) < 0.0001, true)
  })

  it('Direct write/read expects correct types', () => {
    const { rom, schema } = JSIS.create(1, { key: 'value', type: 'integer' })
    JSIS.write('value', 42, schema, rom)
    const result = JSIS.read('value', schema, rom)
    assert.equal(result, 42)
  })
})

describe('IO::Boundary Values', () => {
  const { rom, schema } = JSIS.create(1,
    { key: 'count', type: 'integer' },
    { key: 'ratio', type: 'float' }
  )

  it('Write maximum 32-bit integer', () => {
    const maxInt = 2147483647
    JSIS.write('count', maxInt, schema, rom)
    assert.equal(JSIS.read('count', schema, rom), maxInt)
  })

  it('Write minimum 32-bit integer', () => {
    const minInt = -2147483648
    JSIS.write('count', minInt, schema, rom)
    assert.equal(JSIS.read('count', schema, rom), minInt)
  })

  it('Write very small float', () => {
    const tiny = 0.0000001
    JSIS.write('ratio', tiny, schema, rom)
    const result = JSIS.read('ratio', schema, rom)
    assert.equal(typeof result, 'number')
  })

  it('Write very large float', () => {
    const huge = 1e100
    JSIS.write('ratio', huge, schema, rom)
    const result = JSIS.read('ratio', schema, rom)
    assert.equal(typeof result, 'number')
  })

  it('Handle NaN values', () => {
    JSIS.write('ratio', NaN, schema, rom)
    const result = JSIS.read('ratio', schema, rom)
    assert.equal(Number.isNaN(result), true)
  })
})

describe('IO::String Edge Cases', () => {
  const { rom, schema } = JSIS.create(1,
    { key: 'text', type: 'string', size: 256 }
  )

  it('Write empty string', () => {
    JSIS.write('text', '', schema, rom)
    const result = JSIS.read('text', schema, rom)
    assert.equal(result, undefined)
  })

  it('Write string with unicode characters', () => {
    const unicode = '你好世界'
    JSIS.write('text', unicode, schema, rom)
    const result = JSIS.read('text', schema, rom)
    assert.equal(result, unicode)
  })

  it('Write string with special characters', () => {
    const special = '!@#$%^&*()'
    JSIS.write('text', special, schema, rom)
    const result = JSIS.read('text', schema, rom)
    assert.equal(result, special)
  })

  it('Write string at size limit', () => {
    const longString = 'a'.repeat(256)
    JSIS.write('text', longString, schema, rom)
    const result = JSIS.read('text', schema, rom)
    assert.equal(result?.length <= 256, true)
  })

  it('Write string exceeding size limit', () => {
    const veryLong = 'a'.repeat(500)
    JSIS.write('text', veryLong, schema, rom)
    const result = JSIS.read('text', schema, rom)
    assert.equal(result?.length <= 256, true)
  })
})

describe('IO::Invalid Input Handling', () => {
  const { rom, schema } = JSIS.create(1, { key: 'value', type: 'integer' })

  it('Write with undefined key', () => {
    const result = JSIS.write('', 42, schema, rom)
    assert.equal(result, undefined)
  })

  it('Write with undefined schema', () => {
    const result = JSIS.write('value', 42, undefined as any, rom)
    assert.equal(result, undefined)
  })

  it('Write with undefined ROM', () => {
    const result = JSIS.write('value', 42, schema, undefined as any)
    assert.equal(result, undefined)
  })

  it('Read with undefined key', () => {
    const result = JSIS.read('', schema, rom)
    assert.equal(result, undefined)
  })

  it('Read non-existent field', () => {
    const result = JSIS.read('nonexistent', schema, rom)
    assert.equal(result, undefined)
  })
})
