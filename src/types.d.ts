export type Encodable = string | boolean | number
export type Decodable = number | ArrayLike<number>
export type ROM = Int16Array

export type FieldArguments = {
  type?: 'boolean' | 'float' | 'integer' | 'string'
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

export type Runtime = {
  stackPointer: number
  header: number[]
  rom: ROM
  range: number
  fields: Record<string, Field>
}

export type Scope<M = Middleware> = {
  onUpdate?: <T = Encodable, R = void>(key: string, value?: T, previousValue?: Encodable) => R | void
  ram?: ROM
  currentIndex?: number
  middleware: M
  row: (index?: number) => M
}

export type Middleware<T = Record<string, string>> = Record<string, string> & T
