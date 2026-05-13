import JSIS from '../src'
import assert from 'node:assert'
import { describe, it } from 'node:test'

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
