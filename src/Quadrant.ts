import Point, { ToPoint, defaultToPoint } from './Point'
import Bounds from './Bounds'
import { SubdividedNode } from './Quadtree'

type Quadrant = 'nw' | 'ne' | 'sw' | 'se'
export default Quadrant

export type Quadrants<T> = {
  readonly [P in Quadrant]: T
}

export type ElementsByQuadrant<T> = Quadrants<ReadonlyArray<T>>
export type QuadrantAccumulator<T> = Quadrants<T[]>

export function getQuadrant<T> (bounds: Bounds, point: Point): Quadrant {
  return point.x < bounds.centerX
    ? point.y < bounds.centerY ? 'nw' : 'sw'
    : point.y < bounds.centerY ? 'ne' : 'se'
}

export function groupByQuadrant<T> (
  bounds: Bounds,
  elements: ReadonlyArray<T>,
  toPoint: ToPoint<T> = defaultToPoint
): Readonly<ElementsByQuadrant<T>> {
  return elements.reduce<QuadrantAccumulator<T>>((result, element) => {
    result[getQuadrant(bounds, toPoint(element))].push(element)
    return result
  }, { nw: [], ne: [], sw: [], se: [] })
}
