import Point from './Point'
import Bounds from './Bounds'
import { SubdividedNode } from './QuadTree'

export interface ElementsByQuadrant<T extends Point> {
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

export default function groupByQuadrant<T extends Point>(bounds: Bounds, elements: T[]): ElementsByQuadrant<T> {
  return elements.reduce((result: ElementsByQuadrant<T>, element: T) => {
    result[getQuadrant(bounds, element)].push(element)
    return result
  }, { nw: [], ne: [], sw: [], se: [] })
}
