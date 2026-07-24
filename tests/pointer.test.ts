import JSIS from '../src'
import assert from 'node:assert'
import { describe, it } from 'node:test'

describe('Pointer::Calculation', () => {
  const { schema } = JSIS.create(1,
    { key: 'first', type: 'integer' },
    { key: 'second', type: 'float' },
    { key: 'third', type: 'boolean' },
    { key: 'fourth', type: 'string', size: 10 }
  )

  it('Pointer respects field order', () => {
    const p1 = JSIS.getPointer('first', schema, 0)
    const p2 = JSIS.getPointer('second', schema, 0)
    assert.equal(p1! < p2!, true)
  })

  it('Pointer accounts for row offset', () => {
    const row0Ptr = JSIS.getPointer('first', schema, 0)
    const row1Ptr = JSIS.getPointer('first', schema, 1)
    assert.equal(row1Ptr! - row0Ptr!, schema.range)
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
