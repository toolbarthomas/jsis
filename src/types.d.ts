import JSIS from 'src'

export type Encodable = string | boolean | number
export type Decodable = number | ArrayLike<number>
export type ROM = Int16Array

export type FieldArguments = {
  type?: (typeof JSIS.types)[number]
  size?: number
  key?: string
}

export type Field = FieldArguments & {
  name?: string
  blocks: number
  index: number
}

export type Schema = {
  range: number
  fields: Record<string, Field>
  header?: number[]
}
