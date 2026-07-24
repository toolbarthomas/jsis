import JSIS from '../src'
import assert from 'node:assert'
import { describe, it } from 'node:test'

describe('Scope::Row Operations', () => {
  const mockSchema = [
    { key: 'Firstname', type: 'string' },
    { key: 'score', type: 'float' },
    { key: 'Lastname', type: 'string', size: 13 },
    { key: 'Age', type: 'integer' },
    { key: 'Subscribed', type: 'boolean' },
    { key: 'Followers', type: 'integer' }
  ] as const

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

describe('Scope::Middleware Interface', () => {
  const { rom, schema } = JSIS.create(2,
    { key: 'data', type: 'string', size: 64 }
  )

  const scope = JSIS.scope(schema, rom, () => {})

  it('Middleware provides property access', () => {
    const row = scope.row(0)
    assert.equal(typeof row, 'object')
    const type = typeof row.data
    assert.equal(type === 'string' || type === 'undefined', true)
  })

  it('Middleware getter/setter work', () => {
    const row = scope.row(1)
    row.data = 'test data'
    assert.equal(row.data, 'test data')
  })
})
