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

| Method       | Arguments                    | Type                                      | Description                                                      |
| ------------ | ---------------------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| defineSchema | fields                       | Field[]                                   | Defines a new Schema                                             |
| create       | rows, fields                 | Number, Field[]                           | Create and assign a new Schema                                   |
| write        | key, value, schema, rom, row | String, Value, Schema, Int16Array, Number | Encodes and writes a value to storage                            |
| read         | key, schema, rom, row        | String, Schema, Int16Array, Number        | Reads and decodes a value from storage.                          |
| encode       | value                        | Value                                     | Encodes a value into an integer representation                   |
| decode       | value, type                  | Value, Type                               | Decodes integer data into its original value                     |
| getPointer   | key, schema, row             | String, Schema, Number                    | Returns the integer offset for a field within the storage buffer |
| parse        | chunk                        | Int16Array                                | Parses a raw integer buffer into a schema and data view.         |
| hash         | key, row, size               | String, Number, Number                    | Generates a deterministic pseudo-random string.                  |

## Definitions

| Name   | Property | Type                  |
| ------ | -------- | --------------------- |
| Schema | range    | Number                |
|        | fields   | Number                |
|        | header?  | Record<string, Field> |
| Field  | blocks   | Number                |
|        | index    | Number                |
|        | name?    | String                |