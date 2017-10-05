export default interface Point {
  readonly x: number
  readonly y: number
}

export interface ToPoint<T> {
  (t: T): Point
}

export function defaultToPoint(element: any): Point {
  return element
}

export function pointToKey(point: Point): string {
  return `${point.x}_${point.y}`
}

export function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y
}
