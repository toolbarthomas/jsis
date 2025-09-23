export type ArrayInstance = Int8Array | Int16Array | Int32Array

export function rotate(
  array: ArrayInstance,
  position: number,
  range?: number,
  offset: number = 1,
  reverse: boolean = false
) {
  if (!array || !array.subarray || !array.length) {
    return
  }

  const size = array.length - 1
  const from = Math.min(position ?? 0, size)
  const to = range ? Math.min(range || from + 1, size) : size
  let count = to - from

  let current = 0

  while (count) {
    console.log(size - count)

    count--
  }
}
