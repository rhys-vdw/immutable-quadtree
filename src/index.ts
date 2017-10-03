
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
  ne: QuadTree<T>
  nw: QuadTree<T>
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
  ne: T[]
  nw: T[]
  sw: T[]
  se: T[]
}

const MAX_ELEMENTS = 4

function createBounds(centerX: number, centerY: number, extent: number): Bounds {
  return { centerX, centerY, extent }
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
      ? subdivideQuadtree(quadTree.bounds, elements)
      : { ...quadTree, elements: nextElements }
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

function getQuadrant<T extends Point>(bounds: Bounds, element: T) {
  return element.x < bounds.centerX
    ? element.y < bounds.centerY ? 'nw' : 'sw'
    : element.y < bounds.centerY ? 'ne' : 'se'
}


const points: Point[] = []
for (let i = 0; i < 20; i++) {
  points.push({ x: Math.random(), y: Math.random() })
}

const t = createQuadtree(createBounds(0.5, 0.5, 0.5), points)
const extra = [
  { x: 0.01, y: 0.01, thing: 'TOP LEFT' },
  { x: 0.5, y: 0.5, thing: 'MIDDLE' },
]
const before = insertElements(t, extra)
const after = removeElements(before, extra)
console.log(inspect(before, { depth: 10 }))
console.log('\n\n-------------------\n\n')
console.log(inspect(after, { depth: 10 }))
