// var isArray = require("x-is-array")
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]'
}

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff
module.exports.reorder = reorder

function diff(a, b) {
    var patch = { a: a }
    walk(a, b, patch, 0)
    return patch
}

function walk(a, b, patch, index) {
    if (a === b) {
        return
    }

    // apply是要进行的操作？值为VPatch对象或者VPatch对象数组
    var apply = patch[index]
    var applyClear = false

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index)
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget(a)) {
            clearState(a, patch, index)
            apply = patch[index]
        }

        // 如果新元素没有，将移除旧元素的操作记录在apply中
        apply = appendPatch(apply, new VPatch(VPatch.REMOVE, a, b))
    } else if (isVNode(b)) {
        if (isVNode(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) { // 标签名、namespace、key相同，比较props有无变更
                var propsPatch = diffProps(a.properties, b.properties)
                if (propsPatch) { // props有变更，将props更新操作记录在apply中
                    apply = appendPatch(apply,
                        new VPatch(VPatch.PROPS, a, propsPatch))
                }
                // 进一步比较子元素
                apply = diffChildren(a, b, patch, apply, index)
            } else {
                apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
                applyClear = true
            }
        } else {
            apply = appendPatch(apply, new VPatch(VPatch.VNODE, a, b))
            applyClear = true
        }
    } else if (isVText(b)) {
        if (!isVText(a)) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
            applyClear = true
        } else if (a.text !== b.text) {
            apply = appendPatch(apply, new VPatch(VPatch.VTEXT, a, b))
        }
    } else if (isWidget(b)) {
        if (!isWidget(a)) {
            applyClear = true
        }

        apply = appendPatch(apply, new VPatch(VPatch.WIDGET, a, b))
    }

    if (apply) {
        patch[index] = apply
    }

    if (applyClear) {
        clearState(a, patch, index)
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children
    var orderedSet = reorder(aChildren, b.children)
    var bChildren = orderedSet.children

    var aLen = aChildren.length
    var bLen = bChildren.length
    var len = aLen > bLen ? aLen : bLen // 取最长的

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i]
        var rightNode = bChildren[i]
        index += 1

        if (!leftNode) {
            if (rightNode) {
                // Excess nodes in b need to be added
                apply = appendPatch(apply,
                    new VPatch(VPatch.INSERT, null, rightNode))
            }
        } else {
            walk(leftNode, rightNode, patch, index)
        }

        if (isVNode(leftNode) && leftNode.count) {
            index += leftNode.count
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch(
            VPatch.ORDER,
            a,
            orderedSet.moves
        ))
    }

    return apply
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index)
    destroyWidgets(vNode, patch, index)
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(VPatch.REMOVE, vNode, null)
            )
        }
    } else if (isVNode(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children
        var len = children.length
        for (var i = 0; i < len; i++) {
            var child = children[i]
            index += 1

            destroyWidgets(child, patch, index)

            if (isVNode(child) && child.count) {
                index += child.count
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk(a, b)
    var thunkPatch = diff(nodes.a, nodes.b)
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch(VPatch.THUNK, null, thunkPatch)
    }
}

function hasPatches(patch) {
    for (var index in patch) {
        if (index !== "a") {
            return true
        }
    }

    return false
}

// Execute hooks when two nodes are identical
function unhook(vNode, patch, index) {
    if (isVNode(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch(
                    VPatch.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            )
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children
            var len = children.length
            for (var i = 0; i < len; i++) {
                var child = children[i]
                index += 1

                unhook(child, patch, index)

                if (isVNode(child) && child.count) {
                    index += child.count
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index)
    }
}

function undefinedKeys(obj) {
    var result = {}

    for (var key in obj) {
        result[key] = undefined
    }

    return result
}

// List diff, naive left to right reordering
/**
 * 对两个list进行diff，返回对象 {
 *      children: newChildren,
 *      moves: {
 *          removes: [{ index: number, key: any }], // 需要移除的元素
 *          inserts: [{ key: any, to: number }], // 需要移动的元素
 *      }
 * }
 * @param {Array} aChildren - 第一个比较数组
 * @param {Array} bChildren - 第二个比较数组
 * @return {Object} 返回一个对象
 */
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren)
    var bKeys = bChildIndex.keys
    var bFree = bChildIndex.free

    // 如果bChildren中的元素都没有key，无法确定aChildren中哪些元素可以被复用
    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren)
    var aKeys = aChildIndex.keys
    var aFree = aChildIndex.free

    // 如果aChildren中的元素都没有key，同样无法确定aChildren中哪些元素可以被复用
    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }
    
    // 如果aChildren、bChildren中都包含有key的元素，则这些元素应该尽可能复用

    // O(MAX(N, M)) memory
    var newChildren = []

    var freeIndex = 0 // aChildren中，当前无key元素在aChildren无key元素子数组中的索引
    var freeCount = bFree.length // bChildren中，无key元素的个数
    var deletedItems = 0 // 被移除的元素个数

    // 遍历aChildren并检查bChildren中是否有相同的元素
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i]
        var itemIndex // itemIndex用于从bChildren中获取元素

        if (aItem.key) { // aChildren中元素有key
            if (bKeys.hasOwnProperty(aItem.key)) { // bChildren中有相同的key
                itemIndex = bKeys[aItem.key] // 获取bChildren中相同key的index
                newChildren.push(bChildren[itemIndex])
            } else { // b中没有相同的key，则移除
                itemIndex = i - deletedItems++ // 如果有元素被删除，deletedItems增加1，但对itemIndex的修改似乎没有作用，因为每次循环itemIndex都会被重新赋值
                newChildren.push(null)
            }

            // 举例
            // 假设aChildren、bChildren中的元素都有key, aChildren = [A, B, C, D], bChildren = [B, A, E, D]
            // akeys = { A: 0, B: 1, C: 2, D: 3 }
            // bkeys = { B: 0, A: 1, E: 2, D: 3 }
            // 遍历过程如下:
            // i = 0, aItem = A, itemIndex = 1, newChildren = [A]
            // i = 1, aItem = B, itemIndex = 0, newChildren = [A, B]
            // i = 2, aItem = C, itemIndex = 2 - 0 = 2, newChildren = [A, B, null], deletedItems = 1
            // i = 3, aItem = D, itemIndex = 3, newChildren = [A, B, null, D]
        } else { // aChildren中元素没有key
            // Match the item in a with the next free item in b
            if (freeIndex < freeCount) {
                itemIndex = bFree[freeIndex++]
                newChildren.push(bChildren[itemIndex])
            } else { // aChildren中无key的元素多余bChildren中无key的元素，且已经遍历的无key元素个数超过freeCount，则这些元素应该被删除
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++
                newChildren.push(null)
            }

            // 举例
            // 假设aChildren、bChildren中的元素都没有key, aChildren = [A, B, C, D], bChildren = [X, Y, Z]
            // aFree = [0, 1, 2, 3]
            // bFree = [0, 1, 2]
            // freeCount = 3, 
            // 遍历过程如下:
            // i = 0, aItem = A, freeIndex = 0, freeIndex < freeCount === true, itemIndex = 0, newChildren = [X]
            // i = 1, aItem = B, freeIndex = 1, freeIndex < freeCount === true, itemIndex = 1, newChildren = [Y]
            // i = 2, aItem = C, freeIndex = 2, freeIndex < freeCount === true, itemIndex = 2, newChildren = [Z]
            // i = 3, aItem = D, freeIndex = 3, freeIndex < freeCount === false, itemIndex = 3, newChildren = [X, Y, Z, null], deletedItems = 1
        }

        // 举例
        // 假设 aChildren = [A, B, x, y, E, F], bChildren = [B, A, z, E], 其中大写为有key, 小写为无key
        // akeys = { A: 0, B: 1, E: 4, F: 5 } aFree = [2, 3]
        // bkeys = { B: 0, A: 1, E: 3 } bFree = [2]
        // freeCount = 1
        // 遍历过程如下:
        // i = 0, freeIndex = 0, deletedItems = 0, aItem = A; 进入if分支: itemIndex = 1, newChildren = [A]
        // i = 1, freeIndex = 0, deletedItems = 0, aItem = B; 进入if分支: itemIndex = 0, newChildren = [A, B]
        // i = 2, freeIndex = 0, deletedItems = 0, aItem = x; 进入else分支: freeIndex < freeCount === true, itemIndex = 2, newChildren = [A, B, z]; freeIndex => 1
        // i = 3, freeIndex = 1, deletedItems = 0, aItem = y; 进入else分支: freeIndex < freeCount === false, itemIndex = 3 - 0 = 3, newChildren = [A, B, z, null]; deletedItems => 1
        // i = 4, freeIndex = 1, deletedItems = 1, aItem = E; 进入if分支: itemIndex = 3, newChildren = [A, B, z, null, E]
        // i = 5, freeIndex = 1, deletedItems = 1, aItem = F; 进入if分支: itemIndex = 5 - 1 = 4, newChildren = [A, B, z, null, E, null]; deletedItems => 2
    }

    // 在遍历aChildren的过程中逐步填充newChildren，最终newChildren中元素数量与aChildren相同
    // 对于aChildren中每个位置的元素，对应到newChildren中，有如下4种情况：
    // 1.如果该元素有key，且在bChildren中也有，则push该元素到newChildren，即newChildren中，该位置的元素保存不变
    // 2.如果该元素有key，但在bChildren中没有，则push null到newChildren，即newChildren中，该位置的元素变为null
    // 3.如果该元素无key，遍历过程中会逐步将aChildren中无key元素按顺序替换成bChildren中无key元素，即newChildren中，该位置的元素会替换成bChildren中的元素
    // 4.在3的基础上，如果bChildren中无key元素已经全部push到newChildren中，则将null push到newChildren，即newChildren中，该位置的元素变为null
    console.log('遍历aChildren的之后', JSON.stringify(newChildren))

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex]

    // 遍历bChildren以插入bChildren中新增的元素
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j]

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem)
            }
        } else if (j >= lastFreeIndex) { // 如果索引大于等于lastFreeIndex，证明b中无key的元素多于aChildren中无key的元素，这些元素都需要被追加
            // Add any leftover non-keyed items
            newChildren.push(newItem)
        }
    }

    // 经过对bChildren的遍历，newChildren中被追加了bChildren中新增的元素
    // 此时，newChildren由null、bChildren中的元素组成，但元素顺序可能和bChildren中的不同
    // 假设 aChildren = [A, B, x, y, E, F], bChildren = [B, A, z, E, G, a, b], 则目前 newChildren = [A, B, z, a, E, null, G, b]

    console.log('遍历bChildren的之后', JSON.stringify(newChildren))

    var simulate = newChildren.slice() // 复制newChildren
    var simulateIndex = 0
    var removes = [] // 需要删除的元素对象数组，数组中的元素形如 { index: number, key: string | number | null }
    var inserts = [] // 需要移动的元素对象数组，数组中的元素形如 { to: number, key: string | number }
    var simulateItem

    console.log('第二次遍历bChildren', bKeys)

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        console.log('for循环', { index: k, wantedItem, simulateItem  })

        // remove items
        // 这个while循环会删除从当前元素开始，连续的所有值为null的元素
        while (simulateItem === null && simulate.length) {
            console.log('进入while循环', { simulate, simulateIndex })
            // remove删除simulate中指定元素，并且返回 { index: number, key: null }
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        console.log('while循环结束', { simulate, simulateItem })

        // while循环结束之后，simulateItem可能是undefined
        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) { // 这个分支处理 simulateItem.key !== wantedItem.key 的情况
                    console.log('处理 simulateItem.key !== wantedItem.key', bKeys[simulateItem.key], k + 1)
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) { // 为什么要怎么判断？
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))

                        console.log('填充removes数组 case1', JSON.stringify(removes))

                        simulateItem = simulate[simulateIndex]
                        console.log('更新simulateItem', simulateItem)


                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                            console.log('填充inserts数组 case1', JSON.stringify(inserts))
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                            console.log('更新simulateIndex case1', simulateIndex)
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                        console.log('填充inserts数组 case2', JSON.stringify(inserts))
                    }
                }
                else { // simulateItem为undefined或没有key，记录需要将当前wantedItem移动到下标k处
                    inserts.push({key: wantedItem.key, to: k})
                    console.log('填充inserts数组 case3', JSON.stringify(inserts))
                }
                k++
                console.log('继续遍历 case1', k)
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
                console.log('更新simulate', JSON.stringify(simulate))
                console.log('填充removes数组 case2', JSON.stringify(removes))
            }
        }
        else { // 如果simulateItem不是undefined，且simulateItem和wantedItem的key相同，证明当前元素的位置是正确的，继续遍历
            simulateIndex++
            console.log('更新simulateIndex case2', simulateIndex)

            k++
            console.log('继续遍历 case2', k)
        }
    }

    console.log('第二次遍历bChildren结束', { simulateIndex, simulate: JSON.stringify(simulate) })

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    // 如果没有要移动的，只有要删除的
    if (removes.length === deletedItems && !inserts.length) {
        console.log('执行reorder结果', JSON.stringify({
            children: newChildren,
            moves: null
        }))
        return {
            children: newChildren,
            moves: null
        }
    }

    console.log('执行reorder结果', JSON.stringify({
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }))

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

/**
* 从数组中删除指定索引的元素并返回一个对象 { index: number, key: string | number | null }，包含被移除的元素索引和键。
* 该函数会改变arr参数
*
* @param {Array} arr 要删除元素的数组。
* @param {Number} index 要删除的元素的索引。
* @param {String|Number} key 要删除的元素的键。
* @returns {Object} 一个包含被移除的元素索引和键的对象。
*/
function remove(arr, index, key) {
    console.log('remove执行', { arr, index, key })

    arr.splice(index, 1)

    return {
        from: index,
        key: key
    }
}

/**
 * keyIndex函数用于生成一个对象，该对象包含两个属性：keys和free。
 * keys属性是一个映射，它将children数组中具有key属性的元素的key映射到它们在数组中的索引。
 * free属性是一个数组，包含children数组中没有key属性的元素的索引。
 * 
 * @param {Array} children - 输入的元素数组
 * @return {Object} 返回一个包含keys和free属性的对象
 */
function keyIndex(children) {
    var keys = {}
    var free = []
    var length = children.length

    for (var i = 0; i < length; i++) {
        var child = children[i]

        if (child.key) {
            keys[child.key] = i
        } else {
            free.push(i)
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

function appendPatch(apply, patch) {
    if (apply) {
        if (isArray(apply)) {
            apply.push(patch)
        } else {
            apply = [apply, patch]
        }

        return apply
    } else {
        return patch
    }
}
