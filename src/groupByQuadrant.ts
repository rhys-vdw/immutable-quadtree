import Point from './Point'
import Bounds from './Bounds'
import { SubdividedNode } from './QuadTree'

export interface ElementsByQuadrant<T extends Point> {
  readonly nw: ReadonlyArray<T>
  readonly ne: ReadonlyArray<T>
  readonly sw: ReadonlyArray<T>
  readonly se: ReadonlyArray<T>
}

interface MutableElementsByQuadrant<T extends Point> {
  nw: T[]
  ne: T[]
  sw: T[]
  se: T[]
  [propName: string]: T[]
}

function getQuadrant<T extends Point>(bounds: Bounds, point: T): keyof SubdividedNode<T> {
  return point.x < bounds.centerX
    ? point.y < bounds.centerY ? 'nw' : 'sw'
    : point.y < bounds.centerY ? 'ne' : 'se'
}

export default function groupByQuadrant<T extends Point>(bounds: Bounds, elements: ReadonlyArray<T>): ElementsByQuadrant<T> {
  return elements.reduce((result: MutableElementsByQuadrant<T>, element: T) => {
    result[getQuadrant(bounds, element)].push(element)
    return result
  }, { nw: [], ne: [], sw: [], se: [] })
}
