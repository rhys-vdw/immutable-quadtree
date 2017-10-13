import Point, { ToPoint, defaultToPoint } from './Point'
import Bounds from './Bounds'
import { SubdividedNode } from './Quadtree'

export interface ElementsByQuadrant<T> {
  readonly nw: ReadonlyArray<T>
  readonly ne: ReadonlyArray<T>
  readonly sw: ReadonlyArray<T>
  readonly se: ReadonlyArray<T>
}

interface MutableElementsByQuadrant<T> {
  nw: T[]
  ne: T[]
  sw: T[]
  se: T[]
  [propName: string]: T[]
}

function getQuadrant<T> (bounds: Bounds, point: Point): keyof ElementsByQuadrant<T> {
  return point.x < bounds.centerX
    ? point.y < bounds.centerY ? 'nw' : 'sw'
    : point.y < bounds.centerY ? 'ne' : 'se'
}

export default function groupByQuadrant<T> (
  bounds: Bounds,
  elements: ReadonlyArray<T>,
  toPoint: ToPoint<T> = defaultToPoint
): ElementsByQuadrant<T> {
  return elements.reduce((result: MutableElementsByQuadrant<T>, element: T) => {
    result[getQuadrant(bounds, toPoint(element))].push(element)
    return result
  }, { nw: [], ne: [], sw: [], se: [] })
}
