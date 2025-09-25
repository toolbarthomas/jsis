import { Encodable, Decodable, Field, FieldArguments, ROM, Schema } from './types'

class JSIS {
  static charset = [
    ...Array.from({ length: 10 }, (_, index) => {
      return String.fromCharCode(48 + index)
    }),
    ...Array.from({ length: 26 }, (_, index) => {
      return String.fromCharCode(65 + index)
    })
  ].join('')

  /**
   * Defines the available Types to store within the Integer Array
   */
  static types = ['boolean', 'float', 'integer', 'string'] as const

  /**
   * Fixed ranges for the available types which are bound to the Integer Array
   * range.
   */
  static INTEGER = 4
  static FLOAT = 8
  static STRING = 2
  static BOOLEAN = 1
  static ENDIAN = true
  static BITS = 16
  static RANGE = 0xffff
  static BLANK = 0

  /**
   * The minimum row amount for a Schematic to use
   */
  static ROWS = 1

  /**
   * Internal Integer Storage Buffer and Array View that is required while
   * parsing Integer values.
   */
  static integerBuffer = new ArrayBuffer(JSIS.INTEGER)
  static integerView = new DataView(JSIS.integerBuffer, 0)

  /**
   * Internal Floating Point Storage Buffer and Array View that is required
   * while parsing Floating Points.
   */
  static floatBuffer = new ArrayBuffer(JSIS.FLOAT)
  static floatView = new DataView(JSIS.floatBuffer, 0)

  /**
   * Helper function that will create the Integer in the required size that
   * has been defined by the schema.
   *
   * @param rows Multiply the assumed block range with the amount of rows.
   * @param fields The expected field configuration entries for this schema.
   */
  static create<T = Schema>(rows: number, ...fields: FieldArguments[]) {
    const schema = fields ? JSIS.defineSchema(...fields) : undefined
    const pointer = schema.header?.length || 0

    const rom = schema && new Int16Array(pointer + schema.range * (rows || JSIS.ROWS))
    if (rom && schema.header) {
      rom.set(schema.header, 0)
    }

    return {
      schema,
      rom
    }
  }

  /**
   * Defines the new field Schematic that container the parse configuration
   * for the given fields
   *
   * @param fields The fields to include for the new Schematic.
   */
  static defineSchema<T = Schema>(...fields: FieldArguments[]) {
    const schema: Schema = {
      fields: {},
      range: 0,
      header: []
    }

    let count = fields.length

    while (count) {
      const index = fields.length - count

      count--

      const field = fields[index]

      if (!field || !field.key) {
        continue
      }

      const key = (field.key ?? field.name).toLowerCase()

      if (schema.fields[key]) {
        console.warn(`Duplicate key detected: ${key}`)

        continue
      }

      const type =
        field.type && JSIS.types.includes(field.type.toLowerCase()) ? field.type : undefined

      const blocks =
        type === 'float'
          ? JSIS.FLOAT / 2
          : type === 'integer'
            ? JSIS.INTEGER / 2
            : type === 'boolean'
              ? 1
              : Math.ceil(
                  Math.max(
                    (field.size || (type === 'string' ? JSIS.BITS : 0)) * JSIS.STRING,
                    JSIS.STRING
                  )
                )

      schema.fields[key] = {
        name: field.key,
        type,
        index,
        blocks
      }

      schema.range += Math.ceil(blocks)

      const startIndex = schema.header.length
      const headerLength = key.length + 3

      for (let index = 0; index < headerLength; index++) {
        if (index < key.length) {
          schema.header[startIndex + index] = -key.charCodeAt(index)
        }

        if (index === key.length) {
          schema.header[startIndex + index] = blocks
        }

        if (index === key.length + 1) {
          schema.header[startIndex + index] = schema.fields[key].index
        }

        if (index > key.length + 1) {
          switch (type) {
            case 'boolean':
              schema.header[startIndex + index] = JSIS.BOOLEAN
              break

            case 'float':
              schema.header[startIndex + index] = JSIS.FLOAT
              break

            case 'integer':
              schema.header[startIndex + index] = JSIS.INTEGER
              break

            default:
              schema.header[startIndex + index] = JSIS.STRING
              break
          }
        }
      }
    }

    return schema as T
  }

  /**
   * Decodes value from the existing Integer Array context and parse it in the
   * expected type: Boolean, String, Float or Integer.
   *
   * @param value The value to decode
   * @param type Parse as the defined type instead.
   */
  static decode(value?: Decodable, type?: FieldArguments['type']) {
    if (value === undefined || typeof value === 'number') {
      if (!type || type === 'boolean') {
        return value ? true : false
      }

      return value
    }

    if (value.length === JSIS.BOOLEAN && (value[0] === 1 || !value[0])) {
      return value[0] ? true : false
    }

    let index = 0
    const isNumber = type === 'float' || type === 'integer'

    // Convert the existing Float or Integer with the internal Array Buffers
    // which should be correctly encoded for the given Integer Array.
    while (isNumber && index < value.length) {
      const currentIndex = index

      index++

      if (type === 'float') {
        JSIS.floatView.setInt16(currentIndex * 2, value[currentIndex], JSIS.ENDIAN)

        continue
      }

      if (type === 'integer' || (type === undefined && value.length === JSIS.INTEGER / 2)) {
        JSIS.integerView.setInt16(currentIndex * 2, value[currentIndex], JSIS.ENDIAN)

        continue
      }
    }

    // Parse the assumed bits to the actual value
    switch (type) {
      case 'float':
        return JSIS.floatView.getFloat64(0, JSIS.ENDIAN)

      case 'string':
        const characters: string[] = new Array(value.length / JSIS.STRING)

        while (index < characters.length) {
          characters[index] = String.fromCharCode(
            (value[index * JSIS.STRING + 1] << JSIS.BITS) | (value[index * JSIS.STRING] & 0xffff)
          )

          index++
        }

        return characters.join('')

      default:
        return value.length === JSIS.INTEGER / 2
          ? JSIS.integerView.getInt32(0, JSIS.ENDIAN)
          : undefined
    }
  }

  /**
   * Encodes the defined value for the existing Integer Array
   * @param value
   */
  static encode(value?: Encodable) {
    if (value === undefined) {
      return
    }

    const type = typeof value

    if (type !== 'number' && !JSIS.types.includes(type)) {
      return
    }

    let response: undefined | Int16Array = undefined
    let index = 0

    switch (type) {
      case 'boolean':
        return value ? 1 : 0

      case 'string':
        const encoded = new Int16Array(value.length * JSIS.STRING)

        while (index < value.length) {
          const code = value.charCodeAt(index)
          const pointer = index * JSIS.STRING

          encoded[pointer] = code & JSIS.RANGE
          encoded[pointer + 1] = code >> JSIS.BITS

          index++
        }

        return encoded

      default:
        const blocks = Number.isInteger(value)
          ? Math.floor(JSIS.INTEGER / 2)
          : Math.floor(JSIS.FLOAT / 2)

        response = new Int16Array(blocks)
        const isInteger = Number.isInteger(value)

        if (isInteger) {
          JSIS.integerView.setInt32(0, value, JSIS.ENDIAN)
        } else {
          JSIS.floatView.setFloat64(0, value, JSIS.ENDIAN)
        }

        while (index < blocks) {
          response[index] = isInteger
            ? JSIS.integerView.getInt16(index * 2, JSIS.ENDIAN)
            : JSIS.floatView.getInt16(index * 2, JSIS.ENDIAN)

          index++
        }

        return response
    }
  }

  static parse(chunk: number[] | Int16Array) {
    const schema: Schema = {
      range: 0,
      fields: {}
    }

    const length = chunk.length
    let i = 0
    let stackPointer = 0

    while (i < length) {
      const point = chunk[i]

      if (!i && point >= 0) {
        break
      }

      if (point < 0) {
        let key = ''

        while (i < length && chunk[i] < 0) {
          key += String.fromCharCode(-chunk[i])
          i++
        }

        // We expect 3 header values after the decoded key.
        const blocks = chunk[i++] ?? 0
        const index = chunk[i++] ?? 0
        const typeMarker = chunk[i++] ?? JSIS.STRING

        let type: FieldArguments['type']
        switch (typeMarker) {
          case JSIS.BOOLEAN:
            type = 'boolean'
            break
          case JSIS.FLOAT:
            type = 'float'
            break
          case JSIS.INTEGER:
            type = 'integer'
            break
          default:
            type = 'string'
            break
        }

        schema.fields[key] = { name: key, index, blocks, type }
        schema.range += blocks

        continue
      }

      if (point >= 0) {
        if (!stackPointer) {
          stackPointer = i
        }

        break
      }

      i++
    }

    return {
      ...schema,
      stackPointer,
      headers:
        chunk instanceof Int16Array
          ? chunk.subarray(0, stackPointer)
          : chunk.slice(0, stackPointer),
      rom: chunk instanceof Int16Array ? chunk.subarray(stackPointer) : new Int16Array(schema.range)
    }
  }

  /**
   * Generates a deterministic pseudo-random string based on the given key and
   * optional row.
   * It uses a combination of a linear congruential generator (LCG) and integer
   * mixing to produce a spread of characters from the defined charset.
   *
   * @param key The input string to hash.
   * @param row Optional row index to vary the seed.
   * @param size The desired length of the resulting hash string.
   * @param a Multiplier constant for the LCG.
   * @param c Increment constant for the LCG.
   * @param m LCG Modulus to ensure the state wraps correctly in 32-bit space.
   * @param ax First mixing constant for the base seed.
   * @param bx Second mixing constant to further diffuse seed bits.
   * @param rx Row mixing constant to spread row influence across bits.
   * @param dx Shift amount for the intermediate mixing
   */
  static hash(
    key: string,
    row?: number,
    size = 16,
    a = 0x19660d,
    c = 0x3c6ef35f,
    m = 0x100000000,
    ax = 0x1f123bb5,
    bx = 0xa56fa5b3,
    rx = 0x9e3779b9,
    dx = 3
  ) {
    const rid = (row || 0) + 1

    let seed = rid
    let i = 0
    const len = key.length

    while (i < len) {
      seed += key.charCodeAt(i) * (i + 1) * rid
      i++
    }

    seed ^= rid * rx

    seed ^= seed >>> JSIS.BITS
    seed = Math.imul(seed, ax)
    seed ^= seed >>> (JSIS.BITS - dx)
    seed = Math.imul(seed, bx)
    seed ^= seed >>> JSIS.BITS

    let state = seed >>> 0
    let resultIndex = 0

    const result: string[] = new Array(size)

    while (resultIndex < size) {
      state = (state * a + c) >>> 0
      const idx = Math.floor((state / m) * JSIS.charset.length)
      result[resultIndex] = JSIS.charset[idx]
      resultIndex++
    }

    return result.join('')
  }

  /**
   * Get the start address for the given field within the requested row.
   *
   * @param key
   * @param schema
   * @param row
   */
  static getPointer(key: string, schema: Schema, row?: number) {
    if (!key || !schema || !schema.fields) {
      return
    }

    const k = key.toLowerCase()

    const fields = Object.values(schema.fields)
    let count = fields.length
    const index = schema.fields[k].index

    let pointer = 0

    while (count) {
      const currentIndex = fields.length - count

      if (currentIndex >= index) {
        break
      }

      pointer += fields[currentIndex].blocks

      count--
    }

    const range = Math.ceil(
      fields.reduce((commit, current) => {
        return commit + (current.blocks ?? 0)
      }, 0)
    )

    return range * (row ?? 0) + pointer
  }

  static read(key: string, schema: Schema, rom: ROM, row?: number) {
    if (!key || !schema || !rom) {
      return
    }

    const k = key.toLowerCase()
    const pointer = JSIS.getPointer(key, schema, row)
    const blocks = schema.fields[k].blocks
    const chunk = rom.subarray(pointer, pointer + blocks)
    const type = schema.fields[k].type

    return JSIS.decode(chunk, type)
  }

  static write(key: string, value: Encodable, schema: Schema, rom: ROM, row?: number) {
    if (!key || value === undefined || !schema || !rom) {
      return
    }

    const k = key.toLowerCase()

    if (!schema.fields[k]) {
      return
    }

    const encoded = JSIS.encode(value)
    const pointer = JSIS.getPointer(k, schema, row)

    if (encoded === undefined) {
      return
    }

    if (typeof encoded === 'number') {
      rom[pointer] = encoded

      return true
    }

    const blocks = schema.fields[k].blocks
    let i = 0

    while (i < blocks) {
      rom[pointer + i] = i < encoded.length ? encoded[i] : JSIS.BLANK

      i++
    }

    return true
  }
}

const { rom, schema } = JSIS.create(
  8,
  {
    key: 'Firstname',
    type: 'string'
  },
  {
    key: 'Budget',
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
    key: 'Followers'
  }
)

console.log('Schema', schema)
console.log('Parse', JSIS.parse(rom))

// console.log(
//   'Write',
//   JSIS.write('firstname', 'John Doe', schema, rom),
//   JSIS.write('budget', Math.PI, schema, rom),
//   JSIS.write('age', 0xfffff, schema, rom),
//   JSIS.write('firstname', 'Jane Doe', schema, rom, 1),
//   JSIS.write('subscribed', true, schema, rom),
//   JSIS.write('subscribed', false, schema, rom, 1)
// )
// console.log(
//   'Read',
//   JSIS.read('firstname', schema, rom),
//   JSIS.read('budget', schema, rom),
//   JSIS.read('age', schema, rom),
//   JSIS.read('subscribed', schema, rom),
//   JSIS.read('firstname', schema, rom, 1),
//   JSIS.read('subscribed', schema, rom, 1)
// )

// for (let i = 0; i < 4; i++) {
//   console.log('HASH', JSIS.hash('foo', undefined, undefined, i + 1))
// }

// for (let i = 0; i < 4; i++) {
//   console.log('HASH 10', JSIS.hash('foobar', 10, undefined, i + 1))
// }

// // console.log('True', JSIS.encode(true))
// // console.log('False', JSIS.encode(false))
// // console.log('Float', JSIS.encode(Math.PI), JSIS.decode(JSIS.encode(Math.PI), 'float'), Math.PI)
// // console.log('Integer', JSIS.encode(0x1000000), JSIS.decode(JSIS.encode(0x1000000)), 0x1000000)
// console.log('String', JSIS.decode(JSIS.encode('Lorem🤫'), 'string'), 'Lorem🤫')

// console.log('Header', JSIS.parse(schema?.header))

// // console.log('Boolean', JSIS.MAX, JSIS.encode(true), JSIS.decode(JSIS.encode(true)), true)

export default JSIS
