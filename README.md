# JSIS

JSIS (JavaScript Signed Integer Storage) stores typed data in Int16Array buffers. Define a schema with field names and types, then read and write values with deterministic storage layout.

## Installation

```bash
npm install @toolbarthomas/jsis
```

## Basic Usage

```js
import JSIS from '@toolbarthomas/jsis'

// Define schema
const fields = [
  { key: 'id', type: 'integer' },
  { key: 'active', type: 'boolean' },
  { key: 'score', type: 'float' },
  { key: 'name', type: 'string', size: 32 }
]

// Create storage for 10 rows
const { rom, schema } = JSIS.create(10, ...fields)

// Write values to row 0
JSIS.write('id', 42, schema, rom, 0)
JSIS.write('active', true, schema, rom, 0)
JSIS.write('score', 98.6, schema, rom, 0)
JSIS.write('name', 'Alice', schema, rom, 0)

// Read values from row 0
const id = JSIS.read('id', schema, rom, 0)
const active = JSIS.read('active', schema, rom, 0)
const score = JSIS.read('score', schema, rom, 0)
const name = JSIS.read('name', schema, rom, 0)
```

## Using Scope Interface

For object-like access with automatic type coercion:

```js
const scope = JSIS.scope(schema, rom, (key, value, prev) => {
  console.log(`${key} changed from ${prev} to ${value}`)
})

const row0 = scope.row(0)
row0.name = 'Bob'
row0.score = 95.5

console.log(row0.name)
console.log(row0.score)
```

## API Reference

### Schema Definition

| Method | Arguments | Returns | Description |
| --- | --- | --- | --- |
| defineSchema | ...FieldArguments | Schema | Define field layout without allocating storage. |
| create | rows, ...FieldArguments | {rom, schema} | Create storage buffer and schema. Returns Int16Array and schema object. |

### Storage Operations

| Method | Arguments | Returns | Description |
| --- | --- | --- | --- |
| write | key, value, schema, rom, row? | boolean | Encode and store value at field position. Returns false on overflow. |
| read | key, schema, rom, row? | value | Retrieve and decode value from field position. Returns undefined if field not found. |
| getPointer | key, schema, row? | number | Get byte offset of field in buffer. Accounts for row number if provided. |

### Encoding and Decoding

| Method | Arguments | Returns | Description |
| --- | --- | --- | --- |
| encode | value | Int16Array \| number | Convert value to integer representation. Boolean returns number, others return Int16Array. |
| decode | value, type? | value | Convert integer representation back to original value. Infers type from length if not provided. |
| normalize | key, value, schema | value | Apply type coercion for scope access. Used internally by scope interface. |
| clamp | value, type? | value | Adjust float values by epsilon. Only affects float type. |

### Utilities

| Method | Arguments | Returns | Description |
| --- | --- | --- | --- |
| parse | rom | Runtime | Extract schema metadata and data region from raw buffer. Separates header from data. |
| hash | key, row?, size? | string | Generate deterministic hash string. Default size 16, uses charset (0-9A-Z). |
| scope | schema, rom, onUpdate | Scope | Create object-like interface with getter/setter access and callbacks. |
| defineStorageProvider | files?, size?, namespace? | {provider, database} | Create two storage areas (data and file) with unique keys. |

## Types and Constants

### Supported Data Types

| Type | Blocks | Range | Notes |
| --- | --- | --- | --- |
| boolean | 1 | 0 or 1 | Single block, stores true/false. |
| integer | 2 | -2147483648 to 2147483647 | 32-bit signed, two blocks per value. |
| float | 4 | IEEE 754 double | 64-bit precision, four blocks per value. |
| string | 2 per char | Variable | Each character uses 2 blocks. Size parameter limits length. |

### Field Definition

```typescript
FieldArguments {
  key: string              // Field name (case-insensitive storage)
  type?: string            // One of: 'boolean', 'integer', 'float', 'string'
  size?: number            // String length in characters (only for type='string')
}
```

### Schema Object

```typescript
Schema {
  range: number            // Total blocks required per row
  fields: Record<string, Field>  // Map of field name to field info
  header?: number[]        // Encoded field metadata for serialization
}
```

### Field Info

```typescript
Field {
  name: string             // Original field key
  type: string             // Data type
  index: number            // Position in field definition order
  blocks: number           // Blocks allocated in storage
}
```

### Runtime Object

Returned by parse(). Separates header metadata from data region.

```typescript
Runtime {
  stackPointer: number     // Byte offset where data starts
  header: Int16Array | number[]
  rom: Int16Array          // Data storage region (excludes header)
  range: number            // Blocks per row
  fields: Record<string, Field>
}
```

### Scope Object

Created by scope(). Provides row-based object interface.

```typescript
Scope {
  ram: Int16Array          // Reference to storage
  currentIndex?: number    // Active row number
  middleware: Middleware   // Proxy object for property access
  row: (index: number) => Middleware  // Switch active row
  onUpdate: (key, value, prev) => void  // Update callback
}
```

### JSIS Constants

| Constant | Value | Purpose |
| --- | --- | --- |
| BITS | 16 | Word size for bit operations |
| RANGE | 0xffff | 16-bit max value for character encoding |
| ROWS | 1 | Default minimum rows in buffer |
| INTEGER | 4 | Byte size for 32-bit integers |
| FLOAT | 8 | Byte size for 64-bit floats |
| STRING | 2 | Blocks per character in strings |
| BOOLEAN | 1 | Block size for boolean values |
| BLANK | 0 | Default value for empty blocks |
| CLAMP | 1/0x8000 | Float normalization offset |
| charset | "0-9A-Z" | Characters used in hash function (36 total) |

## Row Access

Storage is organized as rows. Each row uses the same layout defined by the schema.

```js
// Write to different rows
JSIS.write('name', 'Alice', schema, rom, 0)
JSIS.write('name', 'Bob', schema, rom, 1)
JSIS.write('name', 'Charlie', schema, rom, 2)

// Read from specific row
const name = JSIS.read('name', schema, rom, 1)  // "Bob"
```

Row offset is calculated as: `row * schema.range + field_offset`

## Testing

Run the test suite:

```bash
npm test
```

Tests cover core operations, I/O, utilities, and edge cases across 282 tests. See tests/README.md for organization details.