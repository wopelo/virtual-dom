var isArray = require("x-is-array")

var VPatch = require("../vnode/vpatch")
var isVNode = require("../vnode/is-vnode")
var isVText = require("../vnode/is-vtext")
var isWidget = require("../vnode/is-widget")
var isThunk = require("../vnode/is-thunk")
var handleThunk = require("../vnode/handle-thunk")

var diffProps = require("./diff-props")

module.exports = diff

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
    var len = aLen > bLen ? aLen : bLen

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

    var freeIndex = 0
    var freeCount = bFree.length
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
    // 3.如果该元素无key，遍历过程中会逐步将aChildren中无key元素替换成bChildren中无key元素，即newChildren中，该位置的元素会替换成bChildren中的元素
    // 4.如果bChildren中无key元素已经全部push到newChildren中，则将null push到newChildren，即newChildren中，该位置的元素变为null

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

    var simulate = newChildren.slice()
    var simulateIndex = 0
    var removes = []
    var inserts = []
    var simulateItem

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]
        simulateItem = simulate[simulateIndex]

        // remove items
        while (simulateItem === null && simulate.length) {
            removes.push(remove(simulate, simulateIndex, null))
            simulateItem = simulate[simulateIndex]
        }

        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) {
                        removes.push(remove(simulate, simulateIndex, simulateItem.key))
                        simulateItem = simulate[simulateIndex]
                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k})
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k})
                    }
                }
                else {
                    inserts.push({key: wantedItem.key, to: k})
                }
                k++
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key))
            }
        }
        else {
            simulateIndex++
            k++
        }
    }

    // remove all the remaining nodes from simulate
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex]
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key))
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    if (removes.length === deletedItems && !inserts.length) {
        return {
            children: newChildren,
            moves: null
        }
    }

    return {
        children: newChildren,
        moves: {
            removes: removes,
            inserts: inserts
        }
    }
}

function remove(arr, index, key) {
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
