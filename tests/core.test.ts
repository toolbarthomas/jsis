import JSIS from '../src'
import assert from 'node:assert'
import { describe, it } from 'node:test'

type MockScope = {
  firstname: string
  score: number
}

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
  {
    key: 'Firstname',
    type: 'string'
  },
  {
    key: 'score',
    type: 'float'
  },
  {
    key: 'Lastname',
    type: 'string',
    size: 13
  },
  {
    key: 'Age',
    type: 'integer'
  },
  {
    key: 'Subscribed',
    type: 'boolean'
  },
  {
    key: 'Followers',
    type: 'integer'
  },
  {
    key: 'Description',
    type: 'string',
    size: 256
  }
]

describe('Core::Constants', () => {
  it('Charset', () => assert.equal(typeof JSIS.charset, 'string'))
  it('Charset - Characters', () => assert.equal(JSIS.charset.length > 0, true))

  it('BOOLEAN', () => assert.equal(typeof JSIS.BOOLEAN, 'number'))
  it('FLOAT', () => assert.equal(typeof JSIS.FLOAT, 'number'))
  it('INTEGER', () => assert.equal(typeof JSIS.INTEGER, 'number'))
  it('STRING', () => assert.equal(typeof JSIS.STRING, 'number'))
  it('BITS', () => assert.equal(typeof JSIS.BITS, 'number'))
  it('BLANK', () => assert.equal(typeof JSIS.BLANK, 'number'))
  it('RANGE', () => assert.equal(typeof JSIS.RANGE, 'number'))
  it('ROWS', () => assert.equal(typeof JSIS.ROWS, 'number'))
})

describe('Core::Buffers', () => {
  it('integerBuffer', () => assert.equal(JSIS.integerBuffer instanceof ArrayBuffer, true))
  it('integerView', () => assert.equal(JSIS.integerView instanceof DataView, true))
  it('floatBuffer', () => assert.equal(JSIS.floatBuffer instanceof ArrayBuffer, true))
  it('floatView', () => assert.equal(JSIS.floatView instanceof DataView, true))
})

describe('Command::Create', () => {
  const { rom, schema } = JSIS.create(8, ...mockSchema)

  it('Create Fields', () => assert.equal(schema?.fields && schema?.fields instanceof Object, true))
  it('Create Header', () => assert.equal(schema?.header && schema?.header.length > 0, true))
  it('Create Rom', () => assert.equal(rom instanceof Int16Array, true))
  it('Created range', () => assert.equal(typeof schema?.range, 'number'))
})

describe('Command::Create - Edge Cases', () => {
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

describe('Core::Parsing', () => {
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

describe('Core::Parsing - Edge Cases', () => {
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

describe('Core::IO', () => {
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

describe('Core::IO - Type Coercion (via Scope)', () => {
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

describe('Core::IO - Boundary Values', () => {
  const { rom, schema } = JSIS.create(1,
    { key: 'count', type: 'integer' },
    { key: 'ratio', type: 'float' }
  )
  const runtime = JSIS.parse(rom)

  it('Write maximum 32-bit integer', () => {
    const maxInt = 2147483647
    JSIS.write('count', maxInt, schema, runtime.rom)
    assert.equal(JSIS.read('count', schema, runtime.rom), maxInt)
  })

  it('Write minimum 32-bit integer', () => {
    const minInt = -2147483648
    JSIS.write('count', minInt, schema, runtime.rom)
    assert.equal(JSIS.read('count', schema, runtime.rom), minInt)
  })

  it('Write very small float', () => {
    const tiny = 0.0000001
    JSIS.write('ratio', tiny, schema, runtime.rom)
    const result = JSIS.read('ratio', schema, runtime.rom)
    assert.equal(typeof result, 'number')
  })

  it('Write very large float', () => {
    const huge = 1e100
    JSIS.write('ratio', huge, schema, runtime.rom)
    const result = JSIS.read('ratio', schema, runtime.rom)
    assert.equal(typeof result, 'number')
  })

  it('Handle NaN values', () => {
    JSIS.write('ratio', NaN, schema, runtime.rom)
    const result = JSIS.read('ratio', schema, runtime.rom)
    assert.equal(Number.isNaN(result), true)
  })
})

describe('Core::IO - String Edge Cases', () => {
  const { rom, schema } = JSIS.create(1,
    { key: 'text', type: 'string', size: 256 }
  )
  const runtime = JSIS.parse(rom)

  it('Write empty string', () => {
    JSIS.write('text', '', schema, runtime.rom)
    const result = JSIS.read('text', schema, runtime.rom)
    assert.equal(result, undefined)
  })

  it('Write string with unicode characters', () => {
    const unicode = '你好世界'
    JSIS.write('text', unicode, schema, runtime.rom)
    const result = JSIS.read('text', schema, runtime.rom)
    assert.equal(result, unicode)
  })

  it('Write string with special characters', () => {
    const special = '!@#$%^&*()'
    JSIS.write('text', special, schema, runtime.rom)
    const result = JSIS.read('text', schema, runtime.rom)
    assert.equal(result, special)
  })

  it('Write string at size limit', () => {
    const longString = 'a'.repeat(256)
    JSIS.write('text', longString, schema, runtime.rom)
    const result = JSIS.read('text', schema, runtime.rom)
    assert.equal(result?.length <= 256, true)
  })

  it('Write string exceeding size limit', () => {
    const veryLong = 'a'.repeat(500)
    JSIS.write('text', veryLong, schema, runtime.rom)
    const result = JSIS.read('text', schema, runtime.rom)
    // Should truncate to size limit
    assert.equal(result?.length <= 256, true)
  })
})

describe('Core::Scope', () => {
  const { rom, schema } = JSIS.create(4, ...mockSchema)

  let updateCount = 0
  const scope = JSIS.scope<{ firstname: string; score: number }>(
    schema,
    rom,
    (key, value, previousValue) => {
      updateCount++
    }
  )

  const row0 = scope.row(0)
  row0.firstname = 'Alice'
  row0.score = 3.5

  const row1 = scope.row(1)
  row1.firstname = 'Bob'
  row1.score = 4.8

  it('Scope row switching', () => {
    assert.equal(scope.currentIndex, 1)
    scope.row(0)
    assert.equal(scope.currentIndex, 0)
  })

  it('Scope row isolation', () => {
    const readRow0 = scope.row(0)
    assert.equal(readRow0.firstname, 'Alice')

    const readRow1 = scope.row(1)
    assert.equal(readRow1.firstname, 'Bob')
  })

  it('Scope update callback triggers', () => {
    const before = updateCount
    scope.row(2).firstname = 'Charlie'
    assert.equal(updateCount > before, true)
  })

  it('Scope prevents duplicate updates', () => {
    const before = updateCount
    scope.row(3).score = 2.0
    scope.row(3).score = 2.0
    scope.row(3).score = 2.0
    assert.equal(updateCount === before + 1, true)
  })
})

describe('Core::Pointer Calculation', () => {
  const { schema } = JSIS.create(1,
    { key: 'first', type: 'integer' },
    { key: 'second', type: 'float' },
    { key: 'third', type: 'boolean' },
    { key: 'fourth', type: 'string', size: 10 }
  )

  it('Pointer respects field order', () => {
    const p1 = JSIS.getPointer('first', schema, 0)
    const p2 = JSIS.getPointer('second', schema, 0)
    assert.equal(p1 < p2, true)
  })

  it('Pointer accounts for row offset', () => {
    const row0Ptr = JSIS.getPointer('first', schema, 0)
    const row1Ptr = JSIS.getPointer('first', schema, 1)
    assert.equal(row1Ptr - row0Ptr, schema.range)
  })

  it('Invalid pointer returns undefined', () => {
    const ptr = JSIS.getPointer('nonexistent', schema, 0)
    assert.equal(ptr, undefined)
  })

  it('Case insensitive pointer lookup', () => {
    const ptr1 = JSIS.getPointer('First', schema, 0)
    const ptr2 = JSIS.getPointer('FIRST', schema, 0)
    assert.equal(ptr1, ptr2)
  })
})
