import { Encodable, Decodable, Field, FieldArguments, ROM, Schema } from './types'

class JSIS {
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

    return {
      schema,
      rom: schema ? new Int16Array(schema.range * (rows || JSIS.ROWS)) : undefined
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
      range: 0
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
          encoded[pointer + 1] = code >> JSIS.BITS // high bits (usually 0 for BMP)

          index++
        }

        return encoded

      default:
        // // Does not work
        // if (value < JSIS.MIN || value > JSIS.MAX) {
        //   throw Error(`Integer overflow detected: ${Math.abs(value)}/${JSIS.MAX}`)
        // }

        const blocks = Number.isInteger(value)
          ? Math.floor(JSIS.INTEGER / 2)
          : Math.floor(JSIS.FLOAT / 2)

        response = new Array(blocks)
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
    if (!key) {
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

console.log(
  'Write',
  JSIS.write('firstname', 'John Doe', schema, rom),
  JSIS.write('budget', Math.PI, schema, rom),
  JSIS.write('age', 0xfffff, schema, rom),
  JSIS.write('firstname', 'Jane Doe', schema, rom, 1),
  JSIS.write('subscribed', true, schema, rom),
  JSIS.write('subscribed', false, schema, rom, 1)
)
console.log(
  'Read',
  JSIS.read('firstname', schema, rom),
  JSIS.read('budget', schema, rom),
  JSIS.read('age', schema, rom),
  JSIS.read('subscribed', schema, rom),
  JSIS.read('firstname', schema, rom, 1),
  JSIS.read('subscribed', schema, rom, 1)
)

// console.log('True', JSIS.encode(true))
// console.log('False', JSIS.encode(false))
// console.log('Float', JSIS.encode(Math.PI), JSIS.decode(JSIS.encode(Math.PI), 'float'), Math.PI)
// console.log('Integer', JSIS.encode(0x1000000), JSIS.decode(JSIS.encode(0x1000000)), 0x1000000)
console.log('String', JSIS.decode(JSIS.encode('Lorem🤫'), 'string'), 'Lorem🤫')

// console.log('Boolean', JSIS.MAX, JSIS.encode(true), JSIS.decode(JSIS.encode(true)), true)

export default JSIS
