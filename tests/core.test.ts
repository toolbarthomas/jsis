import JSIS from '../src'

import assert, { equal } from 'assert'

import { describe, it } from 'mocha'

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
  const parsed = JSIS.parse(rom)

  it('Has fields', () => assert.equal(Object.keys(schema?.fields).length > 0, true))
  it('Matches fields', () =>
    assert.deepEqual(
      Object.keys(schema?.fields)
        .map((e) => e.toLowerCase())
        .sort(),
      Object.keys(parsed.fields).sort()
    ))

  it('Parsed fields', () => assert.equal(parsed.fields && parsed.fields instanceof Object, true))
  it('Parsed header', () =>
    assert.equal(
      (Array.isArray(parsed.header) && parsed.header.length) || parsed.header instanceof Int16Array,
      true
    ))
  it('Defined Storage context', () => assert.equal(parsed.rom instanceof Int16Array, true))
  it('Defined stackPointer', () => assert.equal(typeof parsed.stackPointer, 'number'))

  it('Matches range', () => assert.equal(schema?.range, parsed.range))
})

describe('Core::IO', () => {
  const { rom, schema } = JSIS.create(8, ...mockSchema)
  const parsed = JSIS.parse(rom)

  JSIS.write('age', mockRow.age, schema, parsed.rom)
  JSIS.write('firstname', mockRow.firstname, schema, parsed.rom)
  JSIS.write('followers', mockRow.followers, schema, parsed.rom)
  JSIS.write('lastname', mockRow.lastname, schema, parsed.rom)
  JSIS.write('score', mockRow.score, schema, parsed.rom)
  JSIS.write('subscribed', mockRow.subscribed, schema, parsed.rom)
  JSIS.write('description', mockRow.description, schema, parsed.rom)

  const age = JSIS.read('age', schema, parsed.rom)
  const firstname = JSIS.read('firstname', schema, parsed.rom)
  const followers = JSIS.read('followers', schema, parsed.rom)
  const lastname = JSIS.read('lastname', schema, parsed.rom)
  const score = JSIS.read('score', schema, parsed.rom)
  const subscribed = JSIS.read('subscribed', schema, parsed.rom)
  const description = JSIS.read('description', schema, parsed.rom)

  it('Read/Write age', () => assert.equal(age, mockRow.age))
  it('Read/Write firstname', () => assert.equal(firstname, mockRow.firstname))
  it('Read/Write lastname', () => assert.equal(lastname, mockRow.lastname))
  it('Read/Write followers', () => assert.equal(followers, mockRow.followers))
  it('Read/Write score', () => assert.equal(score, mockRow.score))
  it('Read/Write subscribed', () => assert.equal(subscribed, mockRow.subscribed))
  it('Read/Write description', () => assert.equal(subscribed, mockRow.subscribed))
})

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
