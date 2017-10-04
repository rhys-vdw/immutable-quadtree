import without from 'lodash/without'
import Point from './Point'
import Bounds, { containsPoint, createBounds } from './Bounds'
import groupByQuadrant from './groupByQuadrant'

// -- Constants --

const MAX_ELEMENTS = 4

// -- Types --

type Quadtree<T extends Point> = LeafNode<T> | SubdividedNode<T>

export default Quadtree

export interface LeafNode<T extends Point> {
  readonly bounds: Bounds
  readonly elements: ReadonlyArray<T>
}

export interface SubdividedNode<T extends Point> {
  readonly bounds: Bounds
  readonly nw: Quadtree<T>
  readonly ne: Quadtree<T>
  readonly sw: Quadtree<T>
  readonly se: Quadtree<T>
}

// -- Type guards --

export function isLeafNode<T extends Point>(obj: Quadtree<T>): obj is LeafNode<T> {
  return (obj as LeafNode<T>).elements !== undefined
}

export function isSubdividedNode<T extends Point>(obj: Quadtree<T>): obj is SubdividedNode<T> {
  return (obj as SubdividedNode<T>).ne !== undefined
}

// -- Functions --

export function createQuadtree<T extends Point>(bounds: Bounds, elements: ReadonlyArray<T>): Quadtree<T> {
  if (elements.length > MAX_ELEMENTS) {
    return subdivideQuadtree(bounds, elements)
  }
  return { bounds, elements }
}

function subdivideQuadtree<T extends Point>(bounds: Bounds, elements: ReadonlyArray<T>): SubdividedNode<T> {

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

export function insertElements<T extends Point>(
  quadTree: Quadtree<T>,
  elements: ReadonlyArray<T>
): Quadtree<T> {

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

export function removeElements<T extends Point>(
  quadTree: Quadtree<T>,
  elements: ReadonlyArray<T>
): Quadtree<T> {
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

export function getElementsInBounds<T extends Point>(
  quadTree: Quadtree<T>,
  bounds: Bounds,
  result: T[] = []
): T[] {
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
