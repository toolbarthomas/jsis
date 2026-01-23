# JSIS

JSIS (JavaScript Integer Schema) is a lightweight schema-based serialization utility for packing structured data into a compact Int16Array.

It allows you to define a schema describing fields and types, encode values into fixed-size integer blocks, and decode them back deterministically. This makes JSIS well-suited for binary-like storage, memory-efficient data layouts, shared memory, or low-level data transport where predictable structure matters.

## Usage

```bash
  $ npm install @toolbarthomas/jsis
```

```js
  import JSIS from '@toolbarthomas/jsis'

  // Basic schema
  const schema = JSIS.defineSchema(
    { key: 'id', type: 'integer' },
    { key: 'active', type: 'boolean' },
    { key: 'score', type: 'float' },
    { key: 'name', type: 'string', size: 16 }
  )

  // Create storage interface with 10 rows
  JSIS.create(10, schema)

  // Populate first row:
  JSIS.write('id', 42, schema, rom, 0)
  JSIS.write('active', true, schema, rom, 0)
  JSIS.write('score', 98.6, schema, rom, 0)
  JSIS.write('name', 'Alice', schema, rom, 0)

  // Retreive assigned values
  const id = JSIS.read('id', schema, rom, 0) // 42
  const active = JSIS.read('active', schema, rom, 0) // TRUE
  const score = JSIS.read('score', schema, rom, 0) // 98.6
  const name = JSIS.read('name', schema, rom, 0) // "Alice"
```

## API

#### JSIS.defineSchema(...fields)
Defines a new schema

#### JSIS.create(rows, ...fields)
Creates a schema and allocates storage.

#### JSIS.write(key, value, schema, rom, row)
Encodes and writes a value to storage.

#### JSIS.read(key, schema, rom, row)
Reads and decodes a value from storage.

#### JSIS.encode(value)
Encodes a value into an integer representation.

#### JSIS.decode(value, type)
Decodes integer data into its original value.

#### JSIS.getPointer(key, schema, row)
Returns the integer offset for a field within the storage buffer.

#### JSIS.parse(chunk)
Parses a raw Int16Array or number array into.

#### JSIS.hash(key, row, size)
Generates a deterministic pseudo-random string.