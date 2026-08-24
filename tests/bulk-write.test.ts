import JSIS from '../src'
import assert from 'node:assert'
import { describe, it } from 'node:test'

describe('IO::writeColumn', () => {
  it('Writes a flat list of values across consecutive rows', () => {
    const { rom, schema } = JSIS.create(5, { key: 'label', type: 'string' })
    const runtime = JSIS.parse(rom)
    const values = ['Grass', 'Water', 'Fire', 'Rock']

    const written = JSIS.writeColumn('label', values, schema, runtime.rom)

    assert.equal(written, values.length)

    values.forEach((value, row) => {
      assert.equal(JSIS.read('label', schema, runtime.rom, row), value)
    })
  })

  it('Writes starting from a given row offset', () => {
    const { rom, schema } = JSIS.create(5, { key: 'label', type: 'string' })
    const runtime = JSIS.parse(rom)
    const values = ['Ice', 'Poison']

    const written = JSIS.writeColumn('label', values, schema, runtime.rom, 2)

    assert.equal(written, values.length)
    assert.equal(JSIS.read('label', schema, runtime.rom, 2), 'Ice')
    assert.equal(JSIS.read('label', schema, runtime.rom, 3), 'Poison')
  })

  it('Stops cleanly without throwing when values run past the row count', () => {
    const { rom, schema } = JSIS.create(3, { key: 'label', type: 'string' })
    const runtime = JSIS.parse(rom)
    const values = ['A', 'B', 'C', 'D', 'E']

    let written = 0

    assert.doesNotThrow(() => {
      written = JSIS.writeColumn('label', values, schema, runtime.rom)
    })

    assert.equal(written, 3)
    assert.equal(JSIS.read('label', schema, runtime.rom, 0), 'A')
    assert.equal(JSIS.read('label', schema, runtime.rom, 2), 'C')
    assert.equal(JSIS.read('label', schema, runtime.rom, 3), undefined)
  })
})

describe('IO::writeRows', () => {
  const mockSchema = [
    { key: 'name', type: 'string' },
    { key: 'width', type: 'integer' },
    { key: 'height', type: 'integer' },
    { key: 'solid', type: 'boolean' },
    { key: 'friction', type: 'float' }
  ] as const

  it('Writes heterogeneous row objects across consecutive rows', () => {
    const { rom, schema } = JSIS.create(3, ...mockSchema)
    const runtime = JSIS.parse(rom)

    const rows = [
      { name: 'Grass', width: 16, height: 16, solid: false, friction: 0.9 },
      { name: 'Water', width: 16, height: 16, solid: false, friction: 0.5 },
      { name: 'Wall', width: 16, height: 16, solid: true, friction: 0.75 }
    ]

    const written = JSIS.writeRows(rows, schema, runtime.rom)

    assert.equal(written, rows.length)

    rows.forEach((row, index) => {
      assert.equal(JSIS.read('name', schema, runtime.rom, index), row.name)
      assert.equal(JSIS.read('width', schema, runtime.rom, index), row.width)
      assert.equal(JSIS.read('height', schema, runtime.rom, index), row.height)
      assert.equal(JSIS.read('solid', schema, runtime.rom, index), row.solid)
      assert.equal(JSIS.read('friction', schema, runtime.rom, index), row.friction)
    })
  })

  it('Handles a sparse row object that omits fields', () => {
    const { rom, schema } = JSIS.create(2, ...mockSchema)
    const runtime = JSIS.parse(rom)

    const rows = [{ name: 'Grass', solid: false }]

    const written = JSIS.writeRows(rows, schema, runtime.rom)

    assert.equal(written, 1)
    assert.equal(JSIS.read('name', schema, runtime.rom, 0), 'Grass')
    assert.equal(JSIS.read('solid', schema, runtime.rom, 0), false)
    // Fields omitted from the row object are never written, so they read
    // back as the ROM's zero-initialized default rather than throwing.
    assert.equal(JSIS.read('width', schema, runtime.rom, 0), 0)
    assert.equal(JSIS.read('height', schema, runtime.rom, 0), 0)
  })

  it('Stops cleanly without throwing when rows run past the row count', () => {
    const { rom, schema } = JSIS.create(2, ...mockSchema)
    const runtime = JSIS.parse(rom)

    const rows = [{ name: 'Grass' }, { name: 'Water' }, { name: 'Fire' }, { name: 'Rock' }]

    let written = 0

    assert.doesNotThrow(() => {
      written = JSIS.writeRows(rows, schema, runtime.rom)
    })

    assert.equal(written, 2)
    assert.equal(JSIS.read('name', schema, runtime.rom, 0), 'Grass')
    assert.equal(JSIS.read('name', schema, runtime.rom, 1), 'Water')
    assert.equal(JSIS.read('name', schema, runtime.rom, 2), undefined)
  })
})
