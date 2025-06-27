import { flags, headers } from './CONST'

import {
  Container,
  Defaults,
  Configuration,
  Range,
  Schema,
  Meta,
  EntryName,
  EntryType,
  DataType
} from './types'

const mock = [
  {
    name: 'John',
    surname: 'Doe',
    age: 12,
    income: 2340.39,
    subscribed: true,
    description:
      'Ullamco excepteur ex irure ad labore ipsum ullamco elit esse. Adipisicing do exercitation duis quis eu velit aliquip reprehenderit. Elit pariatur enim et commodo id. Ut excepteur ex enim cillum magna sint proident pariatur laborum ipsum magna commodo.'
  },
  {
    name: 'Jane',
    surname: 'Doe',
    age: 49,
    income: 0,
    subscribed: false,
    description: 'SomeBody'
  }
]

const schema = [
  ['name', flags.STRING, 32],
  ['surname', flags.STRING, 32],
  ['age', flags.INTEGER],
  ['income', flags.FLOAT],
  ['subscribed', flags.BOOLEAN],
  ['description', flags.RAW, 0x4000]
]

export class JSIS {
  container: Container
  range: Range
  schema?: Schema
  size: number

  static defaults: Defaults = {
    range: 'int16',
    size: 0x1000000,
    header: 0x1000,
    propCount: 2,
    placeholder: -1
  }

  static assignSchema = function <T = Meta>(schema: Schema, container: Container) {
    if (!schema || !schema.length) {
      return
    }

    const meta: T = {}

    const count = schema.length
    let current = count

    let stack = 0
    let rowSize = 0

    while (current) {
      const index = count - current

      current--

      const name = schema[index][0].slice(0, headers.NAME).toUpperCase()

      if (!schema[index] || !name || meta[name]) {
        continue
      }

      for (let i = 0; i < name.length; i++) {
        container[stack + i] = String(name).charCodeAt(i)
      }

      stack += headers.NAME

      // @todo need total size
      for (let p = 1; p <= JSIS.defaults.propCount; p++) {
        const propertyValue = schema[index][p]

        console.log('aa', propertyValue, name)

        container[stack] = propertyValue

        stack++
      }
    }
  }

  static find(container: Container, charCodes: number[]) {
    if (!container || !charCodes || !charCodes.length) {
      return JSIS.defaults.placeholder
    }

    for (let i = 0; i <= container.length - charCodes.length; i++) {
      let match = true

      for (let j = 0; j < charCodes.length; j++) {
        if (container[i + j] !== charCodes[j]) {
          match = false

          break
        }
      }

      if (match) {
        return i
      }
    }

    return JSIS.defaults.placeholder
  }

  constructor(schema: Schema, config?: Configuration) {
    this.range = config?.range ?? JSIS.defaults.range
    this.size = Math.floor(config?.range ?? JSIS.defaults.size)

    if (!this.size) {
      throw Error(`Invalid Storage size detected!: ${this.size}`)
    }

    switch (this.range) {
      case 'uint8':
        this.container = new Uint8Array(this.size)
        break
      case 'uint32':
        this.container = new Uint32Array(this.size)
        break
      case 'uint16':
        this.container = new Uint16Array(this.size)
        break
      case 'int8':
        this.container = new Int8Array(this.size)
        break
      case 'int32':
        this.container = new Int32Array(this.size)
        break
      case 'int16':
      default:
        this.container = new Int16Array(this.size)
    }

    JSIS.assignSchema(schema, this.container)
  }

  info(name: EntryName) {
    const charCodes: number[] = []

    const key = name.slice(0, headers.NAME).toUpperCase()
    const count = key.length
    let current = count

    while (current) {
      const index = count - current

      charCodes[index] = String(key).charCodeAt(index)
      current--
    }

    const position = JSIS.find(this.container, charCodes)
    const column = position / (headers.NAME + JSIS.defaults.propCount)
    let type: DataType = undefined

    const [typeDefinition, maxLength] = this.container.subarray(
      position + headers.NAME,
      position + headers.NAME + JSIS.defaults.propCount
    )

    switch (typeDefinition) {
      case flags.BOOLEAN:
        type = 'BOOLEAN'
        break
      case flags.FLOAT:
        type = 'FLOAT'
        break
      case flags.INTEGER:
        type = 'INTEGER'
        break
      case flags.STRING:
        type = 'STRING'
        break
      case flags.RAW:
        type = 'RAW'
        break
    }

    return {
      position,
      key,
      maxLength,
      column,
      type
    }
  }

  read(id: number, name?: EntryName) {
    // const stack = JSIS.defaults.header + id * chunk
  }
}

export const table = new JSIS(schema)

console.log(table.info('name'))
console.log(table.info('surname'))
console.log(table.info('age'))
console.log(table.info('income'))
console.log(table.info('subscribe'))
console.log(table.info('description'))
console.log(table.read('name', 0))
