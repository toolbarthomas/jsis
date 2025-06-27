import { flags } from './CONST'

export type Containers = [Int16Array, Int32Array, Int8Array, Uint16Array, Uint32Array, Uint8Array]
export type Container = Containers[number]

export type Configuration = {
  range?: Range
  size?: number
}

export type DataType = undefined | keyof typeof flags

export type Ranges = ['int8', 'int16', 'int32', 'uint8', 'uint16', 'uint32']
export type Range = Ranges[number]

export type EntryName = string
export type EntryType = number
export type EntryLength = undefined | number

export type EntryDefinition = [EntryName, EntryType, EntryLength]
export type Schema = EntryDefinition[]
export type Meta = Record<string, EntryDefinition>

export type Defaults = Required<
  Configuration & {
    bits: number
    header: number
    placeholder: number
    propCount: number
  }
>
