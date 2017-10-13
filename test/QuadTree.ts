import test = require('tape')
import { createBounds } from '../src/Bounds'
import Point from '../src/Point'
import QuadTree, { isLeafNode, isSubdividedNode, LeafNode } from '../src/Quadtree'
import { flatMap, times, constant } from 'lodash'
import { assertType, assertIsLeafNodeWithElements } from './helpers/assertions'

const bounds01 = createBounds(0.5, 0.5, 1)
const maxEntries = 2
const quadTree = new QuadTree({ maxEntries })

test('QuadTree#create', t => {
  t.test('with maximum number of elements for single node', q => {
    const elements = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.2 },
    ]
    const node = quadTree.create(bounds01, elements)
    if (!assertType(q, isLeafNode, node)) return
    assertIsLeafNodeWithElements(q, node, elements, 'node')
    q.end()
  })

  t.test('with more than maximum number of elements', q => {
    const elements = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.2 },
      { x: 1, y: 0.9 },
    ]

    const node = quadTree.create(bounds01, elements)
    if (!assertType(q, isSubdividedNode, node)) return
    assertIsLeafNodeWithElements(q, node.nw, elements.slice(0, 2), 'nw')
    assertIsLeafNodeWithElements(q, node.ne, [], 'se')
    assertIsLeafNodeWithElements(q, node.sw, [], 'sw')
    assertIsLeafNodeWithElements(q, node.se, elements.slice(2, 3), 'se')
    q.end()
  })
})

test('QuadTree#insert', t => {
  t.test('inserting fewer than max', q => {
    const empty = quadTree.create(bounds01)
    assertIsLeafNodeWithElements(q, empty, [], 'empty')
    const one = quadTree.insert(empty, [{ x: 0, y: 0}])
    assertIsLeafNodeWithElements(q, one, [{ x: 0, y: 0}], 'one')
    q.end()
  })
})
