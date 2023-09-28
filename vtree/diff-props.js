var isObject = require("is-object")
var isHook = require("../vnode/is-vhook")

module.exports = diffProps

/**
 * 比较新旧两个props对象是否存在差异，返回一个对象diff，key为存在差异的字段，value是key在第二个对象中的值
 * 
 * @param {Object} a - 第一个比较对象
 * @param {Object} b - 第二个比较对象
 * @return {Object} 返回一个对象，包含了两个比较对象中不同的属性及其在第二个对象中的值
 */
function diffProps(a, b) {
    var diff

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {}
            diff[aKey] = undefined
        }

        var aValue = a[aKey]
        var bValue = b[aKey]

        if (aValue === bValue) { // 直接比较，相同则继续比较后续key
            continue
        } else if (isObject(aValue) && isObject(bValue)) { // value都是对象
            if (getPrototype(bValue) !== getPrototype(aValue)) { // value的原型对象不同
                diff = diff || {}
                diff[aKey] = bValue
            } else if (isHook(bValue)) {
                 diff = diff || {}
                 diff[aKey] = bValue
            } else { // 上面两个判断都没有命中，则比较两个value的每个属性
                var objectDiff = diffProps(aValue, bValue)
                if (objectDiff) { // 如果存在差异
                    diff = diff || {}
                    diff[aKey] = objectDiff
                }
            }
        } else { // 两个value不是对象，而且不相等
            diff = diff || {}
            diff[aKey] = bValue
        }
    }

    // 处理新对象中有，而旧对象中没有的属性
    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {}
            diff[bKey] = b[bKey]
        }
    }

    return diff
}

/**
 * 获取对象的原型
 * 
 * @param {Object} value - 对象
 * @return {Object} 返回原型对象
 */
function getPrototype(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}
