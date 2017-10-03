
/*
  containsPoint(x, y) {
    return (
      x >= this.centerX - this.extent &&
      x <= this.centerX + this.extent &&
      y >= this.centerY - this.extent &&
      y <= this.centerY + this.extent
    )
  }
}
*/

type TreeNode<T> = LeafNode<T> | SubdividedNode<T>

interface LeafNode<T> {
  elements: Array<T>
}

interface SubdividedNode<T> {
  ne: TreeNode<T>
  nw: TreeNode<T>
  sw: TreeNode<T>
  se: TreeNode<T>
}

function isLeafNode(obj: any) : boolean {
  return obj.elements !== undefined
}

function isSubdividedNode(obj: any): boolean {
  return obj.ne !== undefined
}

const MAX_ELEMENTS = 4
const NORTH_WEST = 'nw'
const NORTH_EAST = 'ne'
const SOUTH_WEST = 'sw'
const SOUTH_EAST = 'se'

function createBounds(centerX, centerY, extent) {
  this.centerX = centerX;
  this.centerY = centerY;
  this.extent = extent;
}

function createQuadtree(bounds, elements) {
  if (elements.length > MAX_ELEMENTS) {
    return subdivideQuadtree(bounds, elements)
  }
  return { bounds, elements }
}

function groupByQuadrant(bounds, elements) {
  return elements.reduce((result, element) => {
    result[getQuadrant(bounds, element)].push(element)
  }, {
    [NORTH_WEST]: [],
    [NORTH_EAST]: [],
    [SOUTH_WEST]: [],
    [SOUTH_EAST]: [],
  })
}

function subdivideQuadtree(bounds, elements) {

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
    [NORTH_WEST]: createQuadtree(nwBounds, elementsByQuadrant[NORTH_WEST]),
    [NORTH_EAST]: createQuadtree(neBounds, elementsByQuadrant[NORTH_EAST]),
    [SOUTH_WEST]: createQuadtree(swBounds, elementsByQuadrant[SOUTH_WEST]),
    [SOUTH_EAST]: createQuadtree(seBounds, elementsByQuadrant[SOUTH_EAST]),
  }
}

function insertElements(quadTree, elements) {

  // If there are no elements then we're sweet.
  if (elements.length === 0) {
    return quadTree
  }

  // If this is a lead node...
  if (quadTree.elements) {
    const nextElements = [...quadTree.elements, ...elements]
    return nextElements.length > MAX_ELEMENTS
      ? subdivideQuadtree(quadTree.bounds, elements)
      : { ...quadTree, elements: nextElements }
  }

  // Otherwise split them up and insert them into children.
  const elementsByQuadrant = groupByQuadrant(quadTree.bounds, elements)
}

function getQuadrant(bounds, element) {
  if (element.x < bounds.centerX) {
    return element.y < bounds.centerY
      ? NORTH_WEST
      : SOUTH_WEST
  }
  return element.y < bounds.centerY
    ? NORTH_EAST
    : SOUTH_EAST
}

/*
function insert(quadTree, element) {
  if (quadTree.elements.length < MAX_ELEMENTS) {
    return insertElements(quadTree, element)
  }

  const quadrant = getQuadrant(quadTree.bounds, element)

  return {
    ...quadTree,
    [quadrant]: quadTree[quadrant] === undefined
      ? createQuadtree(getQuadrantBounds(quadTree.bounds, quadrant), [element])
      : insertElement(quadTree, element)
  }
}
*/
