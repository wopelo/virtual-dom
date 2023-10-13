// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {}

module.exports = domIndex

function domIndex(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending)
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

/**
 * 递归遍历虚拟DOM树和实际DOM树，将索引在给定范围内的节点映射到一个对象中
 * @param {Node} rootNode - 实际DOM树的根节点
 * @param {Object} tree - 虚拟DOM树
 * @param {number[]} indices - 已排序的索引数组
 * @param {Object} nodes - 存储节点的对象，键为节点索引，值为节点对象
 * @param {number} rootIndex - 当前根节点的索引
 * @returns {Object} 返回存储节点的对象
 */
function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {}


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode
        }

        var vChildren = tree.children

        if (vChildren) {

            var childNodes = rootNode.childNodes

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1

                var vChild = vChildren[i] || noChild
                var nextIndex = rootIndex + (vChild.count || 0)

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex)
                }

                rootIndex = nextIndex
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
/**
 * 判断一个已排序的索引数组中是否存在一个元素，其值在给定的范围内
 * @param {number[]} indices - 已排序的索引数组
 * @param {number} left - 范围的左边界
 * @param {number} right - 范围的右边界
 * @returns {boolean} 如果存在则返回true，否则返回false
 */
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0
    var maxIndex = indices.length - 1
    var currentIndex
    var currentItem

    while (minIndex <= maxIndex) {
        // >> 其实是向下取整；对于 a >> b，它的含义是将 a 的二进制表示向右移动 b 位；当 b 为 0 时，a >> 0 相当于对 a 进行向下取整
        currentIndex = ((maxIndex + minIndex) / 2) >> 0
        currentItem = indices[currentIndex]

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1
        } else {
            return true
        }
    }

    return false;
}

/**
 * 提供给数组排序方法使用的升序排序函数
 * @param {number|string} a - 需要比较的第一个元素
 * @param {number|string} b - 需要比较的第二个元素
 * @returns {number} 如果a大于b返回1，否则返回-1
 */
function ascending(a, b) {
    return a > b ? 1 : -1
}
