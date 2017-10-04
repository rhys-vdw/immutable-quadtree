
import { without } from 'lodash'
import { inspect } from 'util'

interface Point {
  x: number
  y: number
}

interface Bounds {
  centerX: number
  centerY: number
  extent: number
}

type QuadTree<T extends Point> = LeafNode<T> | SubdividedNode<T>

interface LeafNode<T extends Point> {
  bounds: Bounds
  elements: T[]
}

interface SubdividedNode<T extends Point> {
  bounds: Bounds
  nw: QuadTree<T>
  ne: QuadTree<T>
  sw: QuadTree<T>
  se: QuadTree<T>
}

function isLeafNode<T extends Point>(obj: QuadTree<T>) : obj is LeafNode<T> {
  return (obj as LeafNode<T>).elements !== undefined
}

function isSubdividedNode<T extends Point>(obj: QuadTree<T>): obj is SubdividedNode<T> {
  return (obj as SubdividedNode<T>).ne !== undefined
}

interface ElementsByQuadrant<T extends Point> {
  nw: T[]
  ne: T[]
  sw: T[]
  se: T[]
}

const MAX_ELEMENTS = 4

function createBounds(centerX: number, centerY: number, extent: number): Bounds {
  return { centerX, centerY, extent }
}

function containsPoint(bounds: Bounds, point: Point) {
  return (
    point.x >= bounds.centerX - bounds.extent &&
    point.x <= bounds.centerX + bounds.extent &&
    point.y >= bounds.centerY - bounds.extent &&
    point.y <= bounds.centerY + bounds.extent
  )
}


function createQuadtree<T extends Point>(bounds: Bounds, elements: T[]): QuadTree<T> {
  if (elements.length > MAX_ELEMENTS) {
    return subdivideQuadtree(bounds, elements)
  }
  return { bounds, elements }
}

function groupByQuadrant<T extends Point>(bounds, elements: T[]): ElementsByQuadrant<T> {
  return elements.reduce((result, element: T) => {
    result[getQuadrant(bounds, element)].push(element)
    return result
  }, {
    nw: [],
    ne: [],
    sw: [],
    se: [],
  })
}

function subdivideQuadtree<T extends Point>(bounds: Bounds, elements: T[]): SubdividedNode<T> {

  // Subdivide bounds
  const halfExtent = bounds.extent / 2
  const nwBounds = createBounds(bounds.centerX - halfExtent, bounds.centerY - halfExtent, halfExtent)
  const neBounds = createBounds(bounds.centerX + halfExtent, bounds.centerY - halfExtent, halfExtent)
  const swBounds = createBounds(bounds.centerX - halfExtent, bounds.centerY + halfExtent, halfExtent)
  const seBounds = createBounds(bounds.centerX + halfExtent, bounds.centerY + halfExtent, halfExtent)

  // Filter elements
  const elementsByQuadrant = groupByQuadrant(bounds, elements)

  // Return subdivided quadtree
  return {
    bounds,
    nw: createQuadtree(nwBounds, elementsByQuadrant.nw),
    ne: createQuadtree(neBounds, elementsByQuadrant.ne),
    sw: createQuadtree(swBounds, elementsByQuadrant.sw),
    se: createQuadtree(seBounds, elementsByQuadrant.se),
  }
}

function insertElements<T extends Point>(quadTree: QuadTree<T>, elements) {

  // If there are no elements then we're sweet.
  if (elements.length === 0) {
    return quadTree
  }

  // If this is a lead node...
  if (isLeafNode(quadTree)) {
    const nextElements = [...quadTree.elements, ...elements]
    return nextElements.length > MAX_ELEMENTS
      ? subdivideQuadtree(quadTree.bounds, nextElements)
      : { bounds: quadTree.bounds, elements: nextElements }
  }

  // Split them up and insert them into children.
  const elementsByQuadrant = groupByQuadrant(quadTree.bounds, elements)
  return {
    bounds: quadTree.bounds,
    nw: insertElements(quadTree.nw, elementsByQuadrant.nw),
    ne: insertElements(quadTree.ne, elementsByQuadrant.ne),
    sw: insertElements(quadTree.sw, elementsByQuadrant.sw),
    se: insertElements(quadTree.se, elementsByQuadrant.se),
  }
}

function removeElements<T extends Point>(quadTree: QuadTree<T>, elements): QuadTree<T> {
  if (elements.length === 0) {
    return quadTree
  }

  if (isLeafNode(quadTree)) {
    const nextElements = without(quadTree.elements, ...elements)
    if (nextElements.length !== (quadTree.elements.length - elements.length)) {
      throw new TypeError('Tried to remove elements that were not in quad tree')
    }
    return { ...quadTree, elements: nextElements }
  }

  // Split them up and remove them from children.
  const elementsByQuadrant = groupByQuadrant(quadTree.bounds, elements)
  return {
    bounds: quadTree.bounds,
    nw: removeElements(quadTree.nw, elementsByQuadrant.nw),
    ne: removeElements(quadTree.ne, elementsByQuadrant.ne),
    sw: removeElements(quadTree.sw, elementsByQuadrant.sw),
    se: removeElements(quadTree.se, elementsByQuadrant.se),
  }
}

function getQuadrant<T extends Point>(bounds: Bounds, point: T): string {
  return point.x < bounds.centerX
    ? point.y < bounds.centerY ? 'nw' : 'sw'
    : point.y < bounds.centerY ? 'ne' : 'se'
}

function getElementsInBounds<T extends Point>(quadTree: QuadTree<T>, bounds: Bounds, result: T[] = []): T[] {
  if (isLeafNode(quadTree)) {
    quadTree.elements.forEach(element => {
      if (containsPoint(bounds, element)) {
        result.push(element)
      }
    })
  } else {
    const minX = bounds.centerX - bounds.extent
    const maxX = bounds.centerX + bounds.extent
    const minY = bounds.centerY - bounds.extent
    const maxY = bounds.centerY + bounds.extent

    if (minX < quadTree.bounds.centerX) {
      if (minY < quadTree.bounds.centerY) {
        getElementsInBounds(quadTree.nw, bounds, result)
      }
      if (maxY > quadTree.bounds.centerY) {
        getElementsInBounds(quadTree.sw, bounds, result)
      }
    }
    if (maxX > quadTree.bounds.centerX) {
      if (minY < quadTree.bounds.centerY) {
        getElementsInBounds(quadTree.ne, bounds, result)
      }
      if (maxY > quadTree.bounds.centerY) {
        getElementsInBounds(quadTree.se, bounds, result)
      }
    }
  }
  return result
}

interface TestPoint extends Point {
  i: number
}

const points: TestPoint[] = []
for (let i = 0; i < 200; i++) {
  points.push({ i, x: Math.random(), y: Math.random() })
}

console.log(inspect(points))

const t = createQuadtree(createBounds(0.5, 0.5, 0.5), points)
const extra = [
  { x: 0.01, y: 0.01, thing: 'TOP LEFT' },
  { x: 0.5, y: 0.5, thing: 'MIDDLE' },
]

/*
const after = removeElements(before, extra)
console.log(inspect(before, { depth: 10 }))
console.log('\n\n-------------------\n\n')
console.log(inspect(after, { depth: 10 }))
*/

//console.log(inspect(getElementsInBounds(before, { centerX: 0.5, centerY: 0.5, extent: 0.1 }), { depth: 10 }))
const before = insertElements(t, extra)
console.log(inspect(before, { depth: 10 }))
console.log(getElementsInBounds(before, { centerX: 0.5, centerY: 0.5, extent: 0.1 }))

