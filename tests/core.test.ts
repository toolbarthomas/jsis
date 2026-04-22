import JSIS from '../src'

import assert, { equal } from 'assert'

import { describe, it } from 'mocha'

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
  it('Read/Write description', () => assert.equal(subscribed, mockRow.subscribed))

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

describe('Core::File', () => {
  const { rom, schema } = JSIS.create(8, ...mockSchema)

  const scope = JSIS.scope<{ firstname: string; score: number }>(
    schema,
    rom,
    (key, value, previousValue) => {
      console.log('ON UPDATE', { key, value, previousValue })
    }
  )

  const row = scope.row()

  row.firstname = 'ABCDEFGHIKJLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  row.score = 5.23
  row.score = 5.24
  row.score = 5.24
  row.score = 5.25

  // row.score = '5.24'
  // row.score = '5.26'

  console.log('ROW', row.firstname, row.score)

  // const row = scope.row<MockScope>(0)

  // if (row) {
  //   row.firstname = 3
  // }

  // console.log(row.firstname)

  console.log('provi', row.firstname)
})
