import JSIS from './index'

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

export type Scope<M = Middleware> = {
  onUpdate: <T = Encodable, R = void>(key: string, value?: T, previousValue?: Encodable) => R
  currentIndex?: number
  middleware: M
  row: <T = M>(index?: number) => Middleware<T>
}

export type Middleware<T = Record<string, string>> = Record<string, string> & T
