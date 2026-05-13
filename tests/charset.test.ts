import JSIS from '../src'
import assert from 'node:assert'
import { describe, it } from 'node:test'

describe('Utils::Charset Properties', () => {
  it('Charset contains digits', () => {
    const charset = JSIS.charset
    for (let i = 0; i < 10; i++) {
      assert.equal(charset.includes(String(i)), true)
    }
  })

  it('Charset contains uppercase letters', () => {
    const charset = JSIS.charset
    for (let i = 65; i < 91; i++) {
      assert.equal(charset.includes(String.fromCharCode(i)), true)
    }
  })

  it('Charset length is predictable', () => {
    const charset = JSIS.charset
    const expectedLength = 10 + 26
    assert.equal(charset.length, expectedLength)
  })

  it('Charset has no duplicates', () => {
    const charset = JSIS.charset
    const charSet = new Set(charset.split(''))
    assert.equal(charSet.size, charset.length)
  })
})
