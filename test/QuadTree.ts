import test = require('tape')
import { Test } from 'tape'
import { createBounds } from '../src/Bounds'
import Point from '../src/Point'
import Quadtree, { isLeafNode, isSubdividedNode, LeafNode } from '../src/Quadtree'
import { flatMap, times, constant } from 'lodash'
import { assertType, assertIsLeafNodeWithElements } from './helpers/assertions'

const bounds01 = createBounds(0.5, 0.5, 1)
const maxEntries = 2
const quadTree = new Quadtree({ maxEntries })

test('Quadtree#create', t => {
  t.test('with maximum number of elements for single node', q => {
    const elements = [
      { x: 0.1, y: 0.1 },
      { x: 0.2, y: 0.2 }
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
      { x: 1, y: 0.9 }
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

test('Quadtree#insert', t => {
  t.test('inserting fewer than max', q => {
    const empty = quadTree.create(bounds01)
    assertIsLeafNodeWithElements(q, empty, [], 'empty')
    const one = quadTree.insert(empty, [{ x: 0, y: 0}])
    assertIsLeafNodeWithElements(q, one, [{ x: 0, y: 0}], 'one')
    q.end()
  })
})

test('Quadtree#remove', t => {
  const elements = [
    { x: 0.1, y: 0.1 },
    { x: 0.1, y: 0.1 },
    { x: 0.2, y: 0.2 }
  ]

  // Populate leaf node.
  const tree = quadTree.create(bounds01, elements)
  if (!assertType(t, isLeafNode, tree)) return

  t.test('removing individual elements from leaf node', q => {
    // Remove one element.
    const withoutFirst = quadTree.remove(tree, [elements[0]])
    if (!assertType(q, isLeafNode, withoutFirst)) return
    q.notEqual(withoutFirst, tree, 'node was replaced')
    q.deepEqual(withoutFirst.entries, [
      { x: 0.1, y: 0.1, elements: [elements[1]] },
      { x: 0.2, y: 0.2, elements: [elements[2]] }
    ], 'element has been removed from entry')
    q.equal(withoutFirst.entries[0].elements.length, 1)
    q.equal(withoutFirst.entries[0].elements[0], elements[1])
    q.equal(withoutFirst.entries[1].elements.length, 1)
    q.equal(withoutFirst.entries[1].elements[0], elements[2])

    q.notEqual(
      withoutFirst.entries[0],
      tree.entries[0],
      'modified entry was replaced'
    )
    q.equal(
      withoutFirst.entries[1],
      tree.entries[1],
      'unmodified entry was not replaced'
    )

    // Remove another, completely removing its entry.
    const withoutThird = quadTree.remove(withoutFirst, [elements[2]])
    if (!assertType(q, isLeafNode, withoutThird)) return
    q.notEqual(withoutThird, withoutFirst, 'node was replaced')
    q.deepEqual(withoutThird.entries, [
      { x: 0.1, y: 0.1, elements: [elements[1]] }
    ], 'entry is removed entirely')
    q.equal(withoutThird.entries[0].elements.length, 1)
    q.equal(withoutThird.entries[0].elements[0], elements[1])
    q.equal(
      withoutThird.entries[0],
      withoutFirst.entries[0],
      'unmodified was not replaced'
    )

    // Remove last element
    const withoutSecond = quadTree.remove(withoutThird, [elements[1]])
    if (!assertType(q, isLeafNode, withoutSecond)) return
    q.notEqual(withoutSecond, withoutThird, 'node was replaced')
    q.deepEqual(withoutSecond.entries, [], 'entry is removed entirely')

    q.end()
  })

  t.test('Remove all elements', q => {
    // Remove subset of elements
    const removed = quadTree.remove(tree, elements)
    if (!assertType(q, isLeafNode, removed)) return
    q.notEqual(removed, tree, 'node was replaced')
    q.deepEqual(removed.entries, [], 'node is empty')
    q.end()
  })
})
