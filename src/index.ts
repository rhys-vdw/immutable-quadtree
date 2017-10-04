import { inspect } from 'util'

import { createQuadtree, insertElements, getElementsInBounds } from './QuadTree'
import { createBounds } from './Bounds'
import Point from './Point'

interface TestPoint extends Point {
  i: any
}

const points: TestPoint[] = []
for (let i = 0; i < 200; i++) {
  points.push({ i, x: Math.random(), y: Math.random() })
}

console.log(inspect(points))

const t = createQuadtree(createBounds(0.5, 0.5, 0.5), points)
const extra = [
  { x: 0.01, y: 0.01, i: 'TOP LEFT' },
  { x: 0.5, y: 0.5, i: 'MIDDLE' },
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

