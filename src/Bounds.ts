import Point from './Point'

export default interface Bounds {
  centerX: number
  centerY: number
  extent: number
}

export function createBounds(centerX: number, centerY: number, extent: number): Bounds {
  return { centerX, centerY, extent }
}

export function containsPoint(bounds: Bounds, point: Point) {
  return (
    point.x >= bounds.centerX - bounds.extent &&
    point.x <= bounds.centerX + bounds.extent &&
    point.y >= bounds.centerY - bounds.extent &&
    point.y <= bounds.centerY + bounds.extent
  )
}
