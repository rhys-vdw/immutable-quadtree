import { Test } from 'tape'
import { QuadtreeNode, isLeafNode } from '../../src/Quadtree'
import Point from '../../src/Point'
import { flatMap } from 'lodash'

function entriesToElements (entries: ReadonlyArray<Point>): Point[] {
  return flatMap(entries, 'elements')
}

export function assertType<T>(
  t: Test,
  guard: (i: any) => i is T,
  obj: any,
  message = guard.name
): obj is T  {
  const result = guard(obj)
  t.ok(result, message)
  return result
}

export function assertIsLeafNodeWithElements (
  t: Test,
  node: QuadtreeNode<any>,
  elements: ReadonlyArray<any>,
  name: string = 'node'
) {
  if (assertType(t, isLeafNode, node, `${name} is a leaf node`)) {
    t.deepEqual(
      entriesToElements(node.entries),
      elements.slice(0, 2),
      `${name} has correct elements`
    )
  }
}
