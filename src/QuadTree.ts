import { findIndex, without, values } from 'lodash'
import Point, { defaultToPoint, ToPoint, pointToKey, pointsEqual } from './Point'
import Bounds, { containsPoint, createBounds } from './Bounds'
import groupByQuadrant from './groupByQuadrant'

// -- Constants --

const DEFAULT_MAX_ENTRIES = 4

// -- Types --

export type QuadtreeNode<T> = LeafNode<T> | SubdividedNode<T>

export interface Entry<T> extends Point {
  readonly elements: ReadonlyArray<T>
}

export type Entries<T> = ReadonlyArray<Entry<T>>

export interface LeafNode<T> {
  readonly bounds: Bounds
  readonly entries: Entries<T>
}

export interface SubdividedNode<T> {
  readonly bounds: Bounds
  readonly nw: QuadtreeNode<T>
  readonly ne: QuadtreeNode<T>
  readonly sw: QuadtreeNode<T>
  readonly se: QuadtreeNode<T>
}

// -- Type guards --

export function isLeafNode<T>(obj: QuadtreeNode<T>): obj is LeafNode<T> {
  return (obj as LeafNode<T>).entries !== undefined
}

export function isSubdividedNode<T>(obj: QuadtreeNode<T>): obj is SubdividedNode<T> {
  return (obj as SubdividedNode<T>).ne !== undefined
}

// -- Functions --

function mergeEntries<T>(a: Entry<T>, b: Entry<T>): Entry<T> {
  return {
    x: a.x,
    y: a.y,
    elements: [...a.elements, ...b.elements]
  }
}

// -- Class --

export interface QuadTreeOptions<T> {
  maxEntries?: number,
  toPoint?: ToPoint<T>
}

export default class QuadTree<T> {

  private readonly maxEntries: number
  private readonly toPoint: ToPoint<T>

  constructor({ maxEntries, toPoint } : QuadTreeOptions<T> = {}) {
    if (maxEntries <= 1) {
      throw new TypeError(`maxEntries must be greater than 1, got ${maxEntries}`)
    }
    this.maxEntries = maxEntries || DEFAULT_MAX_ENTRIES
    this.toPoint = toPoint || defaultToPoint
  }

  create(bounds: Bounds, elements: ReadonlyArray<T> = []): QuadtreeNode<T> {
    return this.createNode(bounds, this.elementsToEntries(elements))
  }

  insert(quadTree: QuadtreeNode<T>, elements: ReadonlyArray<T>): QuadtreeNode<T> {
    return this.insertEntries(quadTree, this.elementsToEntries(elements))
  }

  remove(quadTree: QuadtreeNode<T>, elements: ReadonlyArray<T>): QuadtreeNode<T> {
    if (elements.length === 0) {
      return quadTree
    }

    if (isLeafNode(quadTree)) {
      const nextEntries = quadTree.entries.reduce((result: Entry<T>[], entry: Entry<T>): Entry<T>[] => {
        const nextElements = without(entry.elements, ...elements)
        if (nextElements.length > 0 && nextElements.length !== entry.elements.length) {
          result.push({ ...entry, elements: nextElements })
        }
        return result
      }, [])
      return { ...quadTree, entries: nextEntries }
    }

    // Split them up and remove them from children.
    const elementsByQuadrant = groupByQuadrant(quadTree.bounds, elements, this.toPoint)
    return {
      bounds: quadTree.bounds,
      nw: this.remove(quadTree.nw, elementsByQuadrant.nw),
      ne: this.remove(quadTree.ne, elementsByQuadrant.ne),
      sw: this.remove(quadTree.sw, elementsByQuadrant.sw),
      se: this.remove(quadTree.se, elementsByQuadrant.se),
    }
  }

  inBounds(quadTree: QuadtreeNode<T>, bounds: Bounds): T[] {
    const result: T[] = []
    this.pushInBounds(quadTree, bounds, result)
    return result
  }

  private pushInBounds(quadTree: QuadtreeNode<T>, bounds: Bounds, result: T[]): void {

    if (isLeafNode(quadTree)) {
      quadTree.entries.forEach(entry => {
        if (containsPoint(bounds, entry)) {
          result.push(...entry.elements)
        }
      })
      return
    }

    const minX = bounds.centerX - bounds.extent
    const maxX = bounds.centerX + bounds.extent
    const minY = bounds.centerY - bounds.extent
    const maxY = bounds.centerY + bounds.extent

    if (minX < quadTree.bounds.centerX) {
      if (minY < quadTree.bounds.centerY) {
        this.pushInBounds(quadTree.nw, bounds, result)
      }
      if (maxY > quadTree.bounds.centerY) {
        this.pushInBounds(quadTree.sw, bounds, result)
      }
    }
    if (maxX > quadTree.bounds.centerX) {
      if (minY < quadTree.bounds.centerY) {
        this.pushInBounds(quadTree.ne, bounds, result)
      }
      if (maxY > quadTree.bounds.centerY) {
        this.pushInBounds(quadTree.se, bounds, result)
      }
    }
  }

  private createNode(bounds: Bounds, entries: Entries<T>): QuadtreeNode<T> {
    if (entries.length > this.maxEntries) {
      return this.subdivide(bounds, entries)
    }
    return { bounds, entries }
  }

  private elementsToEntries(elements: ReadonlyArray<T>): Entries<T> {
    interface Accumulator { [key: string]: T[] }

    // Group all elements for duplicates.
    const elementsByKey = elements.reduce((result: Accumulator, element: T): Accumulator => {
      const key = pointToKey(this.toPoint(element))
      if (result[key] === undefined) {
        result[key] = []
      }
      result[key].push(element)
      return result
    }, {})

    // Now map them into their entries.
    return values(elementsByKey).map((elements: T[]) => {
      const point = this.toPoint(elements[0])
      return {
        x: point.x,
        y: point.y,
        elements: elements as ReadonlyArray<T>
      }
    })
  }

  private subdivide(bounds: Bounds, entries: Entries<T>): SubdividedNode<T> {

    // Subdivide bounds
    const halfExtent = bounds.extent / 2
    const nwBounds = createBounds(bounds.centerX - halfExtent, bounds.centerY - halfExtent, halfExtent)
    const neBounds = createBounds(bounds.centerX + halfExtent, bounds.centerY - halfExtent, halfExtent)
    const swBounds = createBounds(bounds.centerX - halfExtent, bounds.centerY + halfExtent, halfExtent)
    const seBounds = createBounds(bounds.centerX + halfExtent, bounds.centerY + halfExtent, halfExtent)

    // Filter elements
    const entriesByQuadrant = groupByQuadrant(bounds, entries)

    // Return subdivided quadtree
    return {
      bounds,
      nw: this.createNode(nwBounds, entriesByQuadrant.nw),
      ne: this.createNode(neBounds, entriesByQuadrant.ne),
      sw: this.createNode(swBounds, entriesByQuadrant.sw),
      se: this.createNode(seBounds, entriesByQuadrant.se),
    }
  }

  private insertEntries(quadTree: QuadtreeNode<T>, entries: Entries<T>): QuadtreeNode<T> {

    // If there are no entries then we're sweet.
    if (entries.length === 0) {
      return quadTree
    }

    // If this is a leaf node...
    if (isLeafNode(quadTree)) {

      // Merge any duplicate entries.
      const nextEntries = entries.reduce((acc: Entry<T>[], entry: Entry<T>): Entry<T>[] => {
        const index = findIndex(acc, e => pointsEqual(entry, e))
        if (index === -1) {
          acc.push(entry)
        } else {
          acc[index] = mergeEntries(entry, acc[index])
        }
        return acc
      }, [...quadTree.entries])

      // If necessary split the entries into some new nodes.
      return nextEntries.length > this.maxEntries
        ? this.subdivide(quadTree.bounds, nextEntries)
        : { bounds: quadTree.bounds, entries: nextEntries }
    }

    // This is already a subdivided node...
    // Split them up and insert them into children.
    const entriesByQuadrant = groupByQuadrant(quadTree.bounds, entries)
    return {
      bounds: quadTree.bounds,
      nw: this.insertEntries(quadTree.nw, entriesByQuadrant.nw),
      ne: this.insertEntries(quadTree.ne, entriesByQuadrant.ne),
      sw: this.insertEntries(quadTree.sw, entriesByQuadrant.sw),
      se: this.insertEntries(quadTree.se, entriesByQuadrant.se),
    }
  }
}
