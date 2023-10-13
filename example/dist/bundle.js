var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

var src = {};

var nativeIsArray = Array.isArray;
var toString = Object.prototype.toString;

var xIsArray = nativeIsArray || isArray$3;

function isArray$3(obj) {
    return toString.call(obj) === "[object Array]"
}

var version$5 = "2";

var version$4 = version$5;

var isVnode = isVirtualNode;

function isVirtualNode(x) {
    return x && x.type === "VirtualNode" && x.version === version$4
}

var isWidget_1 = isWidget$7;

function isWidget$7(w) {
    return w && w.type === "Widget"
}

var isThunk_1 = isThunk$3;

function isThunk$3(t) {
    return t && t.type === "Thunk"
}

var isVhook = isHook$3;

function isHook$3(hook) {
    return hook &&
      (typeof hook.hook === "function" && !hook.hasOwnProperty("hook") ||
       typeof hook.unhook === "function" && !hook.hasOwnProperty("unhook"))
}

var version$3 = version$5;
var isVNode$4 = isVnode;
var isWidget$6 = isWidget_1;
var isThunk$2 = isThunk_1;
var isVHook = isVhook;

var vnode = VirtualNode;

var noProperties = {};
var noChildren = [];

function VirtualNode(tagName, properties, children, key, namespace) {
    this.tagName = tagName;
    this.properties = properties || noProperties;
    this.children = children || noChildren;
    this.key = key != null ? String(key) : undefined;
    this.namespace = (typeof namespace === "string") ? namespace : null;

    var count = (children && children.length) || 0;
    var descendants = 0;
    var hasWidgets = false;
    var hasThunks = false;
    var descendantHooks = false;
    var hooks;

    for (var propName in properties) {
        if (properties.hasOwnProperty(propName)) {
            var property = properties[propName];
            if (isVHook(property) && property.unhook) {
                if (!hooks) {
                    hooks = {};
                }

                hooks[propName] = property;
            }
        }
    }

    for (var i = 0; i < count; i++) {
        var child = children[i];
        if (isVNode$4(child)) {
            descendants += child.count || 0;

            if (!hasWidgets && child.hasWidgets) {
                hasWidgets = true;
            }

            if (!hasThunks && child.hasThunks) {
                hasThunks = true;
            }

            if (!descendantHooks && (child.hooks || child.descendantHooks)) {
                descendantHooks = true;
            }
        } else if (!hasWidgets && isWidget$6(child)) {
            if (typeof child.destroy === "function") {
                hasWidgets = true;
            }
        } else if (!hasThunks && isThunk$2(child)) {
            hasThunks = true;
        }
    }

    this.count = count + descendants;
    this.hasWidgets = hasWidgets;
    this.hasThunks = hasThunks;
    this.hooks = hooks;
    this.descendantHooks = descendantHooks;
}

VirtualNode.prototype.version = version$3;
VirtualNode.prototype.type = "VirtualNode";

var version$2 = version$5;

var vtext = VirtualText;

function VirtualText(text) {
    this.text = String(text);
}

VirtualText.prototype.version = version$2;
VirtualText.prototype.type = "VirtualText";

var version$1 = version$5;

var isVtext = isVirtualText;

function isVirtualText(x) {
    return x && x.type === "VirtualText" && x.version === version$1
}

/*!
 * Cross-Browser Split 1.1.1
 * Copyright 2007-2012 Steven Levithan <stevenlevithan.com>
 * Available under the MIT License
 * ECMAScript compliant, uniform cross-browser split method
 */

/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * split('a b c d', ' ');
 * // -> ['a', 'b', 'c', 'd']
 *
 * // With limit
 * split('a b c d', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * split('..word1 word2..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', ' ', 'word', '2', '..']
 */
var browserSplit = (function split(undef) {

  var nativeSplit = String.prototype.split,
    compliantExecNpcg = /()??/.exec("")[1] === undef,
    // NPCG: nonparticipating capturing group
    self;

  self = function(str, separator, limit) {
    // If `separator` is not a regex, use `nativeSplit`
    if (Object.prototype.toString.call(separator) !== "[object RegExp]") {
      return nativeSplit.call(str, separator, limit);
    }
    var output = [],
      flags = (separator.ignoreCase ? "i" : "") + (separator.multiline ? "m" : "") + (separator.extended ? "x" : "") + // Proposed for ES6
      (separator.sticky ? "y" : ""),
      // Firefox 3+
      lastLastIndex = 0,
      // Make `global` and avoid `lastIndex` issues by working with a copy
      separator = new RegExp(separator.source, flags + "g"),
      separator2, match, lastIndex, lastLength;
    str += ""; // Type-convert
    if (!compliantExecNpcg) {
      // Doesn't need flags gy, but they don't hurt
      separator2 = new RegExp("^" + separator.source + "$(?!\\s)", flags);
    }
    /* Values for `limit`, per the spec:
     * If undefined: 4294967295 // Math.pow(2, 32) - 1
     * If 0, Infinity, or NaN: 0
     * If positive number: limit = Math.floor(limit); if (limit > 4294967295) limit -= 4294967296;
     * If negative number: 4294967296 - Math.floor(Math.abs(limit))
     * If other: Type-convert, then use the above rules
     */
    limit = limit === undef ? -1 >>> 0 : // Math.pow(2, 32) - 1
    limit >>> 0; // ToUint32(limit)
    while (match = separator.exec(str)) {
      // `separator.lastIndex` is not reliable cross-browser
      lastIndex = match.index + match[0].length;
      if (lastIndex > lastLastIndex) {
        output.push(str.slice(lastLastIndex, match.index));
        // Fix browsers whose `exec` methods don't consistently return `undefined` for
        // nonparticipating capturing groups
        if (!compliantExecNpcg && match.length > 1) {
          match[0].replace(separator2, function() {
            for (var i = 1; i < arguments.length - 2; i++) {
              if (arguments[i] === undef) {
                match[i] = undef;
              }
            }
          });
        }
        if (match.length > 1 && match.index < str.length) {
          Array.prototype.push.apply(output, match.slice(1));
        }
        lastLength = match[0].length;
        lastLastIndex = lastIndex;
        if (output.length >= limit) {
          break;
        }
      }
      if (separator.lastIndex === match.index) {
        separator.lastIndex++; // Avoid an infinite loop
      }
    }
    if (lastLastIndex === str.length) {
      if (lastLength || !separator.test("")) {
        output.push("");
      }
    } else {
      output.push(str.slice(lastLastIndex));
    }
    return output.length > limit ? output.slice(0, limit) : output;
  };

  return self;
})();

var split = browserSplit;

var classIdSplit = /([\.#]?[a-zA-Z0-9\u007F-\uFFFF_:-]+)/;
var notClassId = /^\.|#/;

var parseTag_1 = parseTag$1;

/**
 * 解析HTML标签，并根据解析结果对传入的属性对象进行修改
 * @param {string} tag - HTML标签字符串
 * @param {Object} props - 属性对象，可能包含id、className、namespace等属性
 * @returns {string} 返回解析后的标签名，如果props包含namespace属性，则返回原始标签名，否则返回大写形式的标签名
 */
function parseTag$1(tag, props) {
    if (!tag) {
        return 'DIV';
    }

    var noId = !(props.hasOwnProperty('id'));

    var tagParts = split(tag, classIdSplit);
    var tagName = null;

    if (notClassId.test(tagParts[1])) {
        tagName = 'DIV';
    }

    var classes, part, type, i;

    for (i = 0; i < tagParts.length; i++) {
        part = tagParts[i];

        if (!part) {
            continue;
        }

        type = part.charAt(0);

        if (!tagName) {
            tagName = part;
        } else if (type === '.') {
            classes = classes || [];
            classes.push(part.substring(1, part.length));
        } else if (type === '#' && noId) {
            props.id = part.substring(1, part.length);
        }
    }

    if (classes) {
        if (props.className) {
            classes.push(props.className);
        }

        props.className = classes.join(' ');
    }

    return props.namespace ? tagName : tagName.toUpperCase();
}

var softSetHook$1 = SoftSetHook;

function SoftSetHook(value) {
    if (!(this instanceof SoftSetHook)) {
        return new SoftSetHook(value);
    }

    this.value = value;
}

SoftSetHook.prototype.hook = function (node, propertyName) {
    if (node[propertyName] !== this.value) {
        node[propertyName] = this.value;
    }
};

/*global window, global*/

var root = typeof window !== 'undefined' ?
    window : typeof commonjsGlobal !== 'undefined' ?
    commonjsGlobal : {};

var individual = Individual$1;

function Individual$1(key, value) {
    if (key in root) {
        return root[key];
    }

    root[key] = value;

    return value;
}

var Individual = individual;

var oneVersion = OneVersion;

function OneVersion(moduleName, version, defaultValue) {
    var key = '__INDIVIDUAL_ONE_VERSION_' + moduleName;
    var enforceKey = key + '_ENFORCE_SINGLETON';

    var versionValue = Individual(enforceKey, version);

    if (versionValue !== version) {
        throw new Error('Can only have one copy of ' +
            moduleName + '.\n' +
            'You already have version ' + versionValue +
            ' installed.\n' +
            'This means you cannot install version ' + version);
    }

    return Individual(key, defaultValue);
}

var OneVersionConstraint = oneVersion;

var MY_VERSION = '7';
OneVersionConstraint('ev-store', MY_VERSION);

var hashKey = '__EV_STORE_KEY@' + MY_VERSION;

var evStore = EvStore$1;

function EvStore$1(elem) {
    var hash = elem[hashKey];

    if (!hash) {
        hash = elem[hashKey] = {};
    }

    return hash;
}

var EvStore = evStore;

var evHook$1 = EvHook;

function EvHook(value) {
    if (!(this instanceof EvHook)) {
        return new EvHook(value);
    }

    this.value = value;
}

EvHook.prototype.hook = function (node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = this.value;
};

EvHook.prototype.unhook = function(node, propertyName) {
    var es = EvStore(node);
    var propName = propertyName.substr(3);

    es[propName] = undefined;
};

var isArray$2 = xIsArray;

var VNode = vnode;
var VText = vtext;
var isVNode$3 = isVnode;
var isVText$3 = isVtext;
var isWidget$5 = isWidget_1;
var isHook$2 = isVhook;
var isVThunk = isThunk_1;

var parseTag = parseTag_1;
var softSetHook = softSetHook$1;
var evHook = evHook$1;

var virtualHyperscript = h$2;

function h$2(tagName, properties, children) {
    var childNodes = [];
    var tag, props, key, namespace;

    if (!children && isChildren(properties)) {
        children = properties;
        props = {};
    }

    props = props || properties || {};
    tag = parseTag(tagName, props);

    // support keys
    if (props.hasOwnProperty('key')) {
        key = props.key;
        props.key = undefined;
    }

    // support namespace
    if (props.hasOwnProperty('namespace')) {
        namespace = props.namespace;
        props.namespace = undefined;
    }

    // fix cursor bug
    if (tag === 'INPUT' &&
        !namespace &&
        props.hasOwnProperty('value') &&
        props.value !== undefined &&
        !isHook$2(props.value)
    ) {
        if (props.value !== null && typeof props.value !== 'string') {
            throw UnsupportedValueType({
                expected: 'String',
                received: typeof props.value,
                Vnode: {
                    tagName: tag,
                    properties: props
                }
            });
        }
        props.value = softSetHook(props.value);
    }

    transformProperties(props);

    if (children !== undefined && children !== null) {
        addChild(children, childNodes, tag, props);
    }


    return new VNode(tag, props, childNodes, key, namespace);
}

/**
 * 将子节点添加到childNodes数组中
 * @param {string|number|Object|Array|null|undefined} c - 子节点，可以是字符串、数字、子节点对象、子节点数组，或者null/undefined
 * @param {Array} childNodes - 存储子节点的数组
 * @param {string} tag - 父节点的标签名
 * @param {Object} props - 父节点的属性对象
 * @throws {Error} 如果c既不是字符串、数字、子节点对象、子节点数组，也不是null/undefined，将抛出异常
 */
function addChild(c, childNodes, tag, props) {
    if (typeof c === 'string') {
        childNodes.push(new VText(c));
    } else if (typeof c === 'number') {
        childNodes.push(new VText(String(c)));
    } else if (isChild(c)) {
        childNodes.push(c);
    } else if (isArray$2(c)) {
        for (var i = 0; i < c.length; i++) {
            addChild(c[i], childNodes, tag, props);
        }
    } else if (c === null || c === undefined) {
        return;
    } else {
        throw UnexpectedVirtualElement({
            foreignObject: c,
            parentVnode: {
                tagName: tag,
                properties: props
            }
        });
    }
}

function transformProperties(props) {
    for (var propName in props) {
        if (props.hasOwnProperty(propName)) {
            var value = props[propName];

            if (isHook$2(value)) {
                continue;
            }

            if (propName.substr(0, 3) === 'ev-') {
                // add ev-foo support
                props[propName] = evHook(value);
            }
        }
    }
}

function isChild(x) {
    return isVNode$3(x) || isVText$3(x) || isWidget$5(x) || isVThunk(x);
}

function isChildren(x) {
    return typeof x === 'string' || isArray$2(x) || isChild(x);
}

function UnexpectedVirtualElement(data) {
    var err = new Error();

    err.type = 'virtual-hyperscript.unexpected.virtual-element';
    err.message = 'Unexpected virtual child passed to h().\n' +
        'Expected a VNode / Vthunk / VWidget / string but:\n' +
        'got:\n' +
        errorString(data.foreignObject) +
        '.\n' +
        'The parent vnode is:\n' +
        errorString(data.parentVnode);
    err.foreignObject = data.foreignObject;
    err.parentVnode = data.parentVnode;

    return err;
}

function UnsupportedValueType(data) {
    var err = new Error();

    err.type = 'virtual-hyperscript.unsupported.value-type';
    err.message = 'Unexpected value type for input passed to h().\n' +
        'Expected a ' +
        errorString(data.expected) +
        ' but got:\n' +
        errorString(data.received) +
        '.\n' +
        'The vnode is:\n' +
        errorString(data.Vnode);
    err.Vnode = data.Vnode;

    return err;
}

function errorString(obj) {
    try {
        return JSON.stringify(obj, null, '    ');
    } catch (e) {
        return String(obj);
    }
}

var h$1 = virtualHyperscript;

var h_1 = h$1;

var diff$3 = {exports: {}};

var version = version$5;

VirtualPatch.NONE = 0;
VirtualPatch.VTEXT = 1;
VirtualPatch.VNODE = 2;
VirtualPatch.WIDGET = 3;
VirtualPatch.PROPS = 4;
VirtualPatch.ORDER = 5;
VirtualPatch.INSERT = 6;
VirtualPatch.REMOVE = 7;
VirtualPatch.THUNK = 8;

var vpatch = VirtualPatch;

function VirtualPatch(type, vNode, patch) {
    this.type = Number(type);
    this.vNode = vNode;
    this.patch = patch;
}

VirtualPatch.prototype.version = version;
VirtualPatch.prototype.type = "VirtualPatch";

var isVNode$2 = isVnode;
var isVText$2 = isVtext;
var isWidget$4 = isWidget_1;
var isThunk$1 = isThunk_1;

var handleThunk_1 = handleThunk$2;

function handleThunk$2(a, b) {
    var renderedA = a;
    var renderedB = b;

    if (isThunk$1(b)) {
        renderedB = renderThunk(b, a);
    }

    if (isThunk$1(a)) {
        renderedA = renderThunk(a, null);
    }

    return {
        a: renderedA,
        b: renderedB
    }
}

function renderThunk(thunk, previous) {
    var renderedThunk = thunk.vnode;

    if (!renderedThunk) {
        renderedThunk = thunk.vnode = thunk.render(previous);
    }

    if (!(isVNode$2(renderedThunk) ||
            isVText$2(renderedThunk) ||
            isWidget$4(renderedThunk))) {
        throw new Error("thunk did not return a valid node");
    }

    return renderedThunk
}

// var isObject = require("is-object")
function isObject$2(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]'
}
var isHook$1 = isVhook;

var diffProps_1 = diffProps$1;

/**
 * 比较新旧两个props对象是否存在差异，返回一个对象diff，key为存在差异的字段，value是key在第二个对象中的值
 * 
 * @param {Object} a - 第一个比较对象
 * @param {Object} b - 第二个比较对象
 * @return {Object} 返回一个对象，包含了两个比较对象中不同的属性及其在第二个对象中的值
 */
function diffProps$1(a, b) {
    var diff;

    for (var aKey in a) {
        if (!(aKey in b)) {
            diff = diff || {};
            diff[aKey] = undefined;
        }

        var aValue = a[aKey];
        var bValue = b[aKey];

        if (aValue === bValue) { // 直接比较，相同则继续比较后续key
            continue
        } else if (isObject$2(aValue) && isObject$2(bValue)) { // value都是对象
            if (getPrototype$1(bValue) !== getPrototype$1(aValue)) { // value的原型对象不同
                diff = diff || {};
                diff[aKey] = bValue;
            } else if (isHook$1(bValue)) {
                 diff = diff || {};
                 diff[aKey] = bValue;
            } else { // 上面两个判断都没有命中，则比较两个value的每个属性
                var objectDiff = diffProps$1(aValue, bValue);
                if (objectDiff) { // 如果存在差异
                    diff = diff || {};
                    diff[aKey] = objectDiff;
                }
            }
        } else { // 两个value不是对象，而且不相等
            diff = diff || {};
            diff[aKey] = bValue;
        }
    }

    // 处理新对象中有，而旧对象中没有的属性
    for (var bKey in b) {
        if (!(bKey in a)) {
            diff = diff || {};
            diff[bKey] = b[bKey];
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
function getPrototype$1(value) {
  if (Object.getPrototypeOf) {
    return Object.getPrototypeOf(value)
  } else if (value.__proto__) {
    return value.__proto__
  } else if (value.constructor) {
    return value.constructor.prototype
  }
}

// var isArray = require("x-is-array")
function isArray$1(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]'
}

var VPatch$1 = vpatch;
var isVNode$1 = isVnode;
var isVText$1 = isVtext;
var isWidget$3 = isWidget_1;
var isThunk = isThunk_1;
var handleThunk$1 = handleThunk_1;

var diffProps = diffProps_1;

diff$3.exports = diff$2;
diff$3.exports.reorder = reorder;

function diff$2(a, b) {
    var patch = { a: a };
    walk(a, b, patch, 0);

    console.log('diff结果', patch);

    return patch
}

function walk(a, b, patch, index) {
  console.log('walk', a, b, patch, index);

    if (a === b) { // 当 a 和 b 是VNode时，即使key相同，判断也为false
        console.log('a 和 b相同');
        return
    }

    // apply目前看一开始都是undefined
    var apply = patch[index];
    console.log('apply', apply, index);

    var applyClear = false;

    if (isThunk(a) || isThunk(b)) {
        thunks(a, b, patch, index);
    } else if (b == null) {

        // If a is a widget we will add a remove patch for it
        // Otherwise any child widgets/hooks must be destroyed.
        // This prevents adding two remove patches for a widget.
        if (!isWidget$3(a)) {
            clearState(a, patch, index);
            apply = patch[index];
        }

        // 如果新元素没有，将移除旧元素的操作记录在apply中
        apply = appendPatch(apply, new VPatch$1(VPatch$1.REMOVE, a, b));
    } else if (isVNode$1(b)) {
        if (isVNode$1(a)) {
            if (a.tagName === b.tagName &&
                a.namespace === b.namespace &&
                a.key === b.key) { // 标签名、namespace、key相同，比较props有无变更
                var propsPatch = diffProps(a.properties, b.properties);
                if (propsPatch) { // props有变更，将props更新操作记录在apply中
                    apply = appendPatch(apply,
                        new VPatch$1(VPatch$1.PROPS, a, propsPatch));
                }
                // 进一步比较子元素
                apply = diffChildren(a, b, patch, apply, index);
            } else { // 标签名、namespace、key有一个不相同，将重新创建元素的操作记录在apply中
                apply = appendPatch(apply, new VPatch$1(VPatch$1.VNODE, a, b));
                applyClear = true;
            }
        } else {
            // 将重新创建元素的操作记录在apply中
            apply = appendPatch(apply, new VPatch$1(VPatch$1.VNODE, a, b));
            applyClear = true;
        }
    } else if (isVText$1(b)) {
        if (!isVText$1(a)) { // b是文本节点，a不是，将重新创建文本节点的操作记录在apply中
            apply = appendPatch(apply, new VPatch$1(VPatch$1.VTEXT, a, b));
            applyClear = true;
        } else if (a.text !== b.text) { // 如果文本不同，将重新创建文本节点的操作记录在apply中
            apply = appendPatch(apply, new VPatch$1(VPatch$1.VTEXT, a, b));
        }
    } else if (isWidget$3(b)) {
        if (!isWidget$3(a)) {
            applyClear = true;
        }

        apply = appendPatch(apply, new VPatch$1(VPatch$1.WIDGET, a, b));
    }

    if (apply) {
        patch[index] = apply;
    }

    if (applyClear) {
        clearState(a, patch, index);
    }
}

function diffChildren(a, b, patch, apply, index) {
    var aChildren = a.children;
    var orderedSet = reorder(aChildren, b.children);

    console.log('执行reorder结果', orderedSet);

    // 获取newChildren
    var bChildren = orderedSet.children;

    var aLen = aChildren.length;
    var bLen = bChildren.length;
    var len = aLen > bLen ? aLen : bLen; // 取最长的

    for (var i = 0; i < len; i++) {
        var leftNode = aChildren[i];
        var rightNode = bChildren[i];
        index += 1;

        if (!leftNode) { // 这种情况存在于b比a的元素多
            if (rightNode) {
                // 添加元素
                apply = appendPatch(apply,
                    new VPatch$1(VPatch$1.INSERT, null, rightNode));

                // 举例：aChildren = [A, B, x, y, E, F], bChildren = [B, A, z, E, G, a, b]
                // 此时，newChildren = [A, B, z, a, E, null, G, b]
                // G和b的添加操作将被记录到apply中
            }
        } else {
            // 对相同位置的元素进行递归，以进一步diff元素子节点
            walk(leftNode, rightNode, patch, index);
        }

        if (isVNode$1(leftNode) && leftNode.count) {
            index += leftNode.count;
        }
    }

    if (orderedSet.moves) {
        // Reorder nodes last
        apply = appendPatch(apply, new VPatch$1(
            VPatch$1.ORDER,
            a,
            orderedSet.moves
        ));
    }

    return apply

    // 举例：aChildren = [A, B, x, y, E, F], bChildren = [B, A, z, E, G, a, b]
    // diffChildren将执行6次
    // 第一次比较aChildren和bChildren，orderedSet.children = newChildren = [A, B, z, a, E, null, G, b]
    // 后续五次分别是因为遍历newChildren时，从 A -> E，aChildren对应位置都有元素，进一步比较他们的子节点
    // E之后，则是删除或者新增，不用进行子节点对比
}

function clearState(vNode, patch, index) {
    // TODO: Make this a single walk, not two
    unhook(vNode, patch, index);
    destroyWidgets(vNode, patch, index);
}

// Patch records for all destroyed widgets must be added because we need
// a DOM node reference for the destroy function
function destroyWidgets(vNode, patch, index) {
    if (isWidget$3(vNode)) {
        if (typeof vNode.destroy === "function") {
            patch[index] = appendPatch(
                patch[index],
                new VPatch$1(VPatch$1.REMOVE, vNode, null)
            );
        }
    } else if (isVNode$1(vNode) && (vNode.hasWidgets || vNode.hasThunks)) {
        var children = vNode.children;
        var len = children.length;
        for (var i = 0; i < len; i++) {
            var child = children[i];
            index += 1;

            destroyWidgets(child, patch, index);

            if (isVNode$1(child) && child.count) {
                index += child.count;
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index);
    }
}

// Create a sub-patch for thunks
function thunks(a, b, patch, index) {
    var nodes = handleThunk$1(a, b);
    var thunkPatch = diff$2(nodes.a, nodes.b);
    if (hasPatches(thunkPatch)) {
        patch[index] = new VPatch$1(VPatch$1.THUNK, null, thunkPatch);
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
    if (isVNode$1(vNode)) {
        if (vNode.hooks) {
            patch[index] = appendPatch(
                patch[index],
                new VPatch$1(
                    VPatch$1.PROPS,
                    vNode,
                    undefinedKeys(vNode.hooks)
                )
            );
        }

        if (vNode.descendantHooks || vNode.hasThunks) {
            var children = vNode.children;
            var len = children.length;
            for (var i = 0; i < len; i++) {
                var child = children[i];
                index += 1;

                unhook(child, patch, index);

                if (isVNode$1(child) && child.count) {
                    index += child.count;
                }
            }
        }
    } else if (isThunk(vNode)) {
        thunks(vNode, null, patch, index);
    }
}

function undefinedKeys(obj) {
    var result = {};

    for (var key in obj) {
        result[key] = undefined;
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
 * @return {{
 *  children: Array,
 *  moves: {
 *    removes: { key: any, from: number }[],
 *    inserts: { key: any, to: number }[]
 *  } | null
 * }} 返回一个对象
 */
function reorder(aChildren, bChildren) {
    // O(M) time, O(M) memory
    var bChildIndex = keyIndex(bChildren);
    var bKeys = bChildIndex.keys;
    var bFree = bChildIndex.free;

    // 如果bChildren中的元素都没有key，无法确定aChildren中哪些元素可以被复用
    if (bFree.length === bChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }

    // O(N) time, O(N) memory
    var aChildIndex = keyIndex(aChildren);
    var aKeys = aChildIndex.keys;
    var aFree = aChildIndex.free;

    // 如果aChildren中的元素都没有key，同样无法确定aChildren中哪些元素可以被复用
    if (aFree.length === aChildren.length) {
        return {
            children: bChildren,
            moves: null
        }
    }
    
    // 如果aChildren、bChildren中都包含有key的元素，则这些元素应该尽可能复用

    // O(MAX(N, M)) memory
    var newChildren = [];

    var freeIndex = 0; // aChildren中，当前无key元素在aChildren无key元素子数组中的索引
    var freeCount = bFree.length; // bChildren中，无key元素的个数
    var deletedItems = 0; // 被移除的元素个数

    // 遍历aChildren并检查bChildren中是否有相同的元素
    // O(N) time,
    for (var i = 0 ; i < aChildren.length; i++) {
        var aItem = aChildren[i];
        var itemIndex; // itemIndex用于从bChildren中获取元素

        if (aItem.key) { // aChildren中元素有key
            if (bKeys.hasOwnProperty(aItem.key)) { // bChildren中有相同的key
                itemIndex = bKeys[aItem.key]; // 获取bChildren中相同key的index
                newChildren.push(bChildren[itemIndex]);
            } else { // b中没有相同的key，则移除
                itemIndex = i - deletedItems++; // 如果有元素被删除，deletedItems增加1，但对itemIndex的修改似乎没有作用，因为每次循环itemIndex都会被重新赋值
                newChildren.push(null);
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
                itemIndex = bFree[freeIndex++];
                newChildren.push(bChildren[itemIndex]);
            } else { // aChildren中无key的元素多余bChildren中无key的元素，且已经遍历的无key元素个数超过freeCount，则这些元素应该被删除
                // There are no free items in b to match with
                // the free items in a, so the extra free nodes
                // are deleted.
                itemIndex = i - deletedItems++;
                newChildren.push(null);
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
    console.log('遍历aChildren的之后', newChildren);

    var lastFreeIndex = freeIndex >= bFree.length ?
        bChildren.length :
        bFree[freeIndex];

    // 遍历bChildren以插入bChildren中新增的元素
    // O(M) time
    for (var j = 0; j < bChildren.length; j++) {
        var newItem = bChildren[j];

        if (newItem.key) {
            if (!aKeys.hasOwnProperty(newItem.key)) {
                // Add any new keyed items
                // We are adding new items to the end and then sorting them
                // in place. In future we should insert new items in place.
                newChildren.push(newItem);
            }
        } else if (j >= lastFreeIndex) { // 如果索引大于等于lastFreeIndex，证明b中无key的元素多于aChildren中无key的元素，这些元素都需要被追加
            // Add any leftover non-keyed items
            newChildren.push(newItem);
        }
    }

    // 经过对bChildren的遍历，newChildren中被追加了bChildren中新增的元素
    // 此时，newChildren由null、bChildren中的元素组成，但元素顺序可能和bChildren中的不同
    // 假设 aChildren = [A, B, x, y, E, F], bChildren = [B, A, z, E, G, a, b], 则目前 newChildren = [A, B, z, a, E, null, G, b]

    console.log('遍历bChildren的之后', newChildren);

    var simulate = newChildren.slice(); // 复制newChildren
    var simulateIndex = 0;
    var removes = []; // 需要删除的元素对象数组，数组中的元素形如 { index: number, key: string | number | null }
    var inserts = []; // 需要移动的元素对象数组，数组中的元素形如 { to: number, key: string | number }
    var simulateItem;

    console.log('第二次遍历bChildren', bKeys);
    // 第二次遍历的目的是什么？
    // newChildren的顺序和bChildren不相同，且有多余的null

    for (var k = 0; k < bChildren.length;) {
        var wantedItem = bChildren[k]; // bChildren中，当前位置的元素
        simulateItem = simulate[simulateIndex]; // simulate中，当前需要处理的元素

        console.log('for循环', { index: k, wantedItem, simulateItem  });

        // remove items
        // 这个while循环将从当前元素开始，所有连续的null添加到remove中
        while (simulateItem === null && simulate.length) {
            console.log('进入while循环', { simulate, simulateIndex });
            // remove删除simulate中指定元素，并且返回 { index: number, key: null }，会修改simulate
            removes.push(remove(simulate, simulateIndex, null));
            simulateItem = simulate[simulateIndex];
        }

        console.log('while循环结束', { simulate, simulateItem });

        // while循环结束之后，simulateItem可能是undefined
        if (!simulateItem || simulateItem.key !== wantedItem.key) {
            // if we need a key in this position...
            if (wantedItem.key) {
                if (simulateItem && simulateItem.key) {
                    // 这个分支处理 simulateItem.key !== wantedItem.key 的情况，此时需要将simulateItem移动到正确的位置
                    console.log('处理 simulateItem.key !== wantedItem.key', bKeys[simulateItem.key], k + 1);

                    // if an insert doesn't put this key in place, it needs to move
                    if (bKeys[simulateItem.key] !== k + 1) { // 为什么要怎么判断？
                        removes.push(remove(simulate, simulateIndex, simulateItem.key));

                        console.log('填充removes数组 case1', removes);

                        simulateItem = simulate[simulateIndex];
                        console.log('更新simulateItem', simulateItem);


                        // if the remove didn't put the wanted item in place, we need to insert it
                        if (!simulateItem || simulateItem.key !== wantedItem.key) {
                            inserts.push({key: wantedItem.key, to: k});
                            console.log('填充inserts数组 case1', inserts);
                        }
                        // items are matching, so skip ahead
                        else {
                            simulateIndex++;
                            console.log('更新simulateIndex case1', simulateIndex);
                        }
                    }
                    else {
                        inserts.push({key: wantedItem.key, to: k});
                        console.log('填充inserts数组 case2', inserts);
                    }
                }
                else { // simulateItem为undefined或没有key，记录需要将当前wantedItem移动到下标k处
                    inserts.push({key: wantedItem.key, to: k});
                    console.log('填充inserts数组 case3', inserts);
                }
                k++;
                console.log('继续遍历 case1', k);
            }
            // a key in simulate has no matching wanted key, remove it
            else if (simulateItem && simulateItem.key) {
                removes.push(remove(simulate, simulateIndex, simulateItem.key));
                console.log('更新simulate', simulate);
                console.log('填充removes数组 case2', removes);
            }
        }
        else { 
            // 如果simulateItem不是undefined，且simulateItem和wantedItem的key相同，包括都没有key的情况
            // 此时当前元素的位置是正确的，继续遍历
            simulateIndex++;
            console.log('更新simulateIndex case2', simulateIndex);

            k++;
            console.log('继续遍历 case2', k);
        }
    }

    console.log('第二次遍历bChildren结束', { 
      simulateIndex,
      simulate,
      inserts,
      removes,
    });

    // remove all the remaining nodes from simulate
    // simulate中还有未处理到的元素，都要删除，这些元素都是null
    while(simulateIndex < simulate.length) {
        simulateItem = simulate[simulateIndex];
        removes.push(remove(simulate, simulateIndex, simulateItem && simulateItem.key));
    }

    // If the only moves we have are deletes then we can just
    // let the delete patch remove these items.
    // 如果没有要移动的，只有要删除的
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

/**
* 从数组中删除指定索引的元素并返回一个对象 { index: number, key: string | number | null }，包含被移除的元素索引和键。
* 该函数会改变arr参数
*
* @param {Array} arr 要删除元素的数组。
* @param {Number} index 要删除的元素的索引。
* @param {String|Number} key 要删除的元素的键。
* @returns {{ from: number, key: any }} 一个包含被移除的元素索引和键的对象。
*/
function remove(arr, index, key) {
    console.log('remove执行', { arr, index, key });

    arr.splice(index, 1);

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
    var keys = {};
    var free = [];
    var length = children.length;

    for (var i = 0; i < length; i++) {
        var child = children[i];

        if (child.key) {
            keys[child.key] = i;
        } else {
            free.push(i);
        }
    }

    return {
        keys: keys,     // A hash of key name to index
        free: free      // An array of unkeyed item indices
    }
}

/**
 * 将补丁添加到应用补丁集合中
 * @param {Array|Object} apply - 应用补丁集合，可以是数组或者单个补丁对象
 * @param {Object} patch - 需要添加的补丁
 * @returns {Array} 返回包含所有补丁的数组
 */
function appendPatch(apply, patch) {
    if (apply) {
        if (isArray$1(apply)) {
            apply.push(patch);
        } else {
            apply = [apply, patch];
        }

        return apply
    } else {
        return patch
    }
}

var diffExports = diff$3.exports;

var diff$1 = diffExports;

var diff_1 = diff$1;

var slice = Array.prototype.slice;

var domWalk$2 = iterativelyWalk;

function iterativelyWalk(nodes, cb) {
    if (!('length' in nodes)) {
        nodes = [nodes];
    }
    
    nodes = slice.call(nodes);

    while(nodes.length) {
        var node = nodes.shift(),
            ret = cb(node);

        if (ret) {
            return ret
        }

        if (node.childNodes && node.childNodes.length) {
            nodes = slice.call(node.childNodes).concat(nodes);
        }
    }
}

var domComment = Comment$1;

function Comment$1(data, owner) {
    if (!(this instanceof Comment$1)) {
        return new Comment$1(data, owner)
    }

    this.data = data;
    this.nodeValue = data;
    this.length = data.length;
    this.ownerDocument = owner || null;
}

Comment$1.prototype.nodeType = 8;
Comment$1.prototype.nodeName = "#comment";

Comment$1.prototype.toString = function _Comment_toString() {
    return "[object Comment]"
};

var domText = DOMText$1;

function DOMText$1(value, owner) {
    if (!(this instanceof DOMText$1)) {
        return new DOMText$1(value)
    }

    this.data = value || "";
    this.length = this.data.length;
    this.ownerDocument = owner || null;
}

DOMText$1.prototype.type = "DOMTextNode";
DOMText$1.prototype.nodeType = 3;
DOMText$1.prototype.nodeName = "#text";

DOMText$1.prototype.toString = function _Text_toString() {
    return this.data
};

DOMText$1.prototype.replaceData = function replaceData(index, length, value) {
    var current = this.data;
    var left = current.substring(0, index);
    var right = current.substring(index + length, current.length);
    this.data = left + value + right;
    this.length = this.data.length;
};

var dispatchEvent_1 = dispatchEvent$2;

function dispatchEvent$2(ev) {
    var elem = this;
    var type = ev.type;

    if (!ev.target) {
        ev.target = elem;
    }

    if (!elem.listeners) {
        elem.listeners = {};
    }

    var listeners = elem.listeners[type];

    if (listeners) {
        return listeners.forEach(function (listener) {
            ev.currentTarget = elem;
            if (typeof listener === 'function') {
                listener(ev);
            } else {
                listener.handleEvent(ev);
            }
        })
    }

    if (elem.parentNode) {
        elem.parentNode.dispatchEvent(ev);
    }
}

var addEventListener_1 = addEventListener$2;

function addEventListener$2(type, listener) {
    var elem = this;

    if (!elem.listeners) {
        elem.listeners = {};
    }

    if (!elem.listeners[type]) {
        elem.listeners[type] = [];
    }

    if (elem.listeners[type].indexOf(listener) === -1) {
        elem.listeners[type].push(listener);
    }
}

var removeEventListener_1 = removeEventListener$2;

function removeEventListener$2(type, listener) {
    var elem = this;

    if (!elem.listeners) {
        return
    }

    if (!elem.listeners[type]) {
        return
    }

    var list = elem.listeners[type];
    var index = list.indexOf(listener);
    if (index !== -1) {
        list.splice(index, 1);
    }
}

var serialize = serializeNode$1;

var voidElements = ["area","base","br","col","embed","hr","img","input","keygen","link","menuitem","meta","param","source","track","wbr"];

function serializeNode$1(node) {
    switch (node.nodeType) {
        case 3:
            return escapeText(node.data)
        case 8:
            return "<!--" + node.data + "-->"
        default:
            return serializeElement(node)
    }
}

function serializeElement(elem) {
    var strings = [];

    var tagname = elem.tagName;

    if (elem.namespaceURI === "http://www.w3.org/1999/xhtml") {
        tagname = tagname.toLowerCase();
    }

    strings.push("<" + tagname + properties(elem) + datasetify(elem));

    if (voidElements.indexOf(tagname) > -1) {
        strings.push(" />");
    } else {
        strings.push(">");

        if (elem.childNodes.length) {
            strings.push.apply(strings, elem.childNodes.map(serializeNode$1));
        } else if (elem.textContent || elem.innerText) {
            strings.push(escapeText(elem.textContent || elem.innerText));
        } else if (elem.innerHTML) {
            strings.push(elem.innerHTML);
        }

        strings.push("</" + tagname + ">");
    }

    return strings.join("")
}

function isProperty(elem, key) {
    var type = typeof elem[key];

    if (key === "style" && Object.keys(elem.style).length > 0) {
      return true
    }

    return elem.hasOwnProperty(key) &&
        (type === "string" || type === "boolean" || type === "number") &&
        key !== "nodeName" && key !== "className" && key !== "tagName" &&
        key !== "textContent" && key !== "innerText" && key !== "namespaceURI" &&  key !== "innerHTML"
}

function stylify(styles) {
    if (typeof styles === 'string') return styles
    var attr = "";
    Object.keys(styles).forEach(function (key) {
        var value = styles[key];
        key = key.replace(/[A-Z]/g, function(c) {
            return "-" + c.toLowerCase();
        });
        attr += key + ":" + value + ";";
    });
    return attr
}

function datasetify(elem) {
    var ds = elem.dataset;
    var props = [];

    for (var key in ds) {
        props.push({ name: "data-" + key, value: ds[key] });
    }

    return props.length ? stringify(props) : ""
}

function stringify(list) {
    var attributes = [];
    list.forEach(function (tuple) {
        var name = tuple.name;
        var value = tuple.value;

        if (name === "style") {
            value = stylify(value);
        }

        attributes.push(name + "=" + "\"" + escapeAttributeValue(value) + "\"");
    });

    return attributes.length ? " " + attributes.join(" ") : ""
}

function properties(elem) {
    var props = [];
    for (var key in elem) {
        if (isProperty(elem, key)) {
            props.push({ name: key, value: elem[key] });
        }
    }

    for (var ns in elem._attributes) {
      for (var attribute in elem._attributes[ns]) {
        var prop = elem._attributes[ns][attribute];
        var name = (prop.prefix ? prop.prefix + ":" : "") + attribute;
        props.push({ name: name, value: prop.value });
      }
    }

    if (elem.className) {
        props.push({ name: "class", value: elem.className });
    }

    return props.length ? stringify(props) : ""
}

function escapeText(s) {
    var str = '';

    if (typeof(s) === 'string') { 
        str = s; 
    } else if (s) {
        str = s.toString();
    }

    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
}

function escapeAttributeValue(str) {
    return escapeText(str).replace(/"/g, "&quot;")
}

var domWalk$1 = domWalk$2;
var dispatchEvent$1 = dispatchEvent_1;
var addEventListener$1 = addEventListener_1;
var removeEventListener$1 = removeEventListener_1;
var serializeNode = serialize;

var htmlns = "http://www.w3.org/1999/xhtml";

var domElement = DOMElement$2;

function DOMElement$2(tagName, owner, namespace) {
    if (!(this instanceof DOMElement$2)) {
        return new DOMElement$2(tagName)
    }

    var ns = namespace === undefined ? htmlns : (namespace || null);

    this.tagName = ns === htmlns ? String(tagName).toUpperCase() : tagName;
    this.nodeName = this.tagName;
    this.className = "";
    this.dataset = {};
    this.childNodes = [];
    this.parentNode = null;
    this.style = {};
    this.ownerDocument = owner || null;
    this.namespaceURI = ns;
    this._attributes = {};

    if (this.tagName === 'INPUT') {
      this.type = 'text';
    }
}

DOMElement$2.prototype.type = "DOMElement";
DOMElement$2.prototype.nodeType = 1;

DOMElement$2.prototype.appendChild = function _Element_appendChild(child) {
    if (child.parentNode) {
        child.parentNode.removeChild(child);
    }

    this.childNodes.push(child);
    child.parentNode = this;

    return child
};

DOMElement$2.prototype.replaceChild =
    function _Element_replaceChild(elem, needle) {
        // TODO: Throw NotFoundError if needle.parentNode !== this

        if (elem.parentNode) {
            elem.parentNode.removeChild(elem);
        }

        var index = this.childNodes.indexOf(needle);

        needle.parentNode = null;
        this.childNodes[index] = elem;
        elem.parentNode = this;

        return needle
    };

DOMElement$2.prototype.removeChild = function _Element_removeChild(elem) {
    // TODO: Throw NotFoundError if elem.parentNode !== this

    var index = this.childNodes.indexOf(elem);
    this.childNodes.splice(index, 1);

    elem.parentNode = null;
    return elem
};

DOMElement$2.prototype.insertBefore =
    function _Element_insertBefore(elem, needle) {
        // TODO: Throw NotFoundError if referenceElement is a dom node
        // and parentNode !== this

        if (elem.parentNode) {
            elem.parentNode.removeChild(elem);
        }

        var index = needle === null || needle === undefined ?
            -1 :
            this.childNodes.indexOf(needle);

        if (index > -1) {
            this.childNodes.splice(index, 0, elem);
        } else {
            this.childNodes.push(elem);
        }

        elem.parentNode = this;
        return elem
    };

DOMElement$2.prototype.setAttributeNS =
    function _Element_setAttributeNS(namespace, name, value) {
        var prefix = null;
        var localName = name;
        var colonPosition = name.indexOf(":");
        if (colonPosition > -1) {
            prefix = name.substr(0, colonPosition);
            localName = name.substr(colonPosition + 1);
        }
        if (this.tagName === 'INPUT' && name === 'type') {
          this.type = value;
        }
        else {
          var attributes = this._attributes[namespace] || (this._attributes[namespace] = {});
          attributes[localName] = {value: value, prefix: prefix};
        }
    };

DOMElement$2.prototype.getAttributeNS =
    function _Element_getAttributeNS(namespace, name) {
        var attributes = this._attributes[namespace];
        var value = attributes && attributes[name] && attributes[name].value;
        if (this.tagName === 'INPUT' && name === 'type') {
          return this.type;
        }
        if (typeof value !== "string") {
            return null
        }
        return value
    };

DOMElement$2.prototype.removeAttributeNS =
    function _Element_removeAttributeNS(namespace, name) {
        var attributes = this._attributes[namespace];
        if (attributes) {
            delete attributes[name];
        }
    };

DOMElement$2.prototype.hasAttributeNS =
    function _Element_hasAttributeNS(namespace, name) {
        var attributes = this._attributes[namespace];
        return !!attributes && name in attributes;
    };

DOMElement$2.prototype.setAttribute = function _Element_setAttribute(name, value) {
    return this.setAttributeNS(null, name, value)
};

DOMElement$2.prototype.getAttribute = function _Element_getAttribute(name) {
    return this.getAttributeNS(null, name)
};

DOMElement$2.prototype.removeAttribute = function _Element_removeAttribute(name) {
    return this.removeAttributeNS(null, name)
};

DOMElement$2.prototype.hasAttribute = function _Element_hasAttribute(name) {
    return this.hasAttributeNS(null, name)
};

DOMElement$2.prototype.removeEventListener = removeEventListener$1;
DOMElement$2.prototype.addEventListener = addEventListener$1;
DOMElement$2.prototype.dispatchEvent = dispatchEvent$1;

// Un-implemented
DOMElement$2.prototype.focus = function _Element_focus() {
    return void 0
};

DOMElement$2.prototype.toString = function _Element_toString() {
    return serializeNode(this)
};

DOMElement$2.prototype.getElementsByClassName = function _Element_getElementsByClassName(classNames) {
    var classes = classNames.split(" ");
    var elems = [];

    domWalk$1(this, function (node) {
        if (node.nodeType === 1) {
            var nodeClassName = node.className || "";
            var nodeClasses = nodeClassName.split(" ");

            if (classes.every(function (item) {
                return nodeClasses.indexOf(item) !== -1
            })) {
                elems.push(node);
            }
        }
    });

    return elems
};

DOMElement$2.prototype.getElementsByTagName = function _Element_getElementsByTagName(tagName) {
    tagName = tagName.toLowerCase();
    var elems = [];

    domWalk$1(this.childNodes, function (node) {
        if (node.nodeType === 1 && (tagName === '*' || node.tagName.toLowerCase() === tagName)) {
            elems.push(node);
        }
    });

    return elems
};

DOMElement$2.prototype.contains = function _Element_contains(element) {
    return domWalk$1(this, function (node) {
        return element === node
    }) || false
};

var DOMElement$1 = domElement;

var domFragment = DocumentFragment$1;

function DocumentFragment$1(owner) {
    if (!(this instanceof DocumentFragment$1)) {
        return new DocumentFragment$1()
    }

    this.childNodes = [];
    this.parentNode = null;
    this.ownerDocument = owner || null;
}

DocumentFragment$1.prototype.type = "DocumentFragment";
DocumentFragment$1.prototype.nodeType = 11;
DocumentFragment$1.prototype.nodeName = "#document-fragment";

DocumentFragment$1.prototype.appendChild  = DOMElement$1.prototype.appendChild;
DocumentFragment$1.prototype.replaceChild = DOMElement$1.prototype.replaceChild;
DocumentFragment$1.prototype.removeChild  = DOMElement$1.prototype.removeChild;

DocumentFragment$1.prototype.toString =
    function _DocumentFragment_toString() {
        return this.childNodes.map(function (node) {
            return String(node)
        }).join("")
    };

var event = Event$1;

function Event$1(family) {}

Event$1.prototype.initEvent = function _Event_initEvent(type, bubbles, cancelable) {
    this.type = type;
    this.bubbles = bubbles;
    this.cancelable = cancelable;
};

Event$1.prototype.preventDefault = function _Event_preventDefault() {
    
};

var domWalk = domWalk$2;

var Comment = domComment;
var DOMText = domText;
var DOMElement = domElement;
var DocumentFragment = domFragment;
var Event = event;
var dispatchEvent = dispatchEvent_1;
var addEventListener = addEventListener_1;
var removeEventListener = removeEventListener_1;

var document$3 = Document$1;

function Document$1() {
    if (!(this instanceof Document$1)) {
        return new Document$1();
    }

    this.head = this.createElement("head");
    this.body = this.createElement("body");
    this.documentElement = this.createElement("html");
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.childNodes = [this.documentElement];
    this.nodeType = 9;
}

var proto = Document$1.prototype;
proto.createTextNode = function createTextNode(value) {
    return new DOMText(value, this)
};

proto.createElementNS = function createElementNS(namespace, tagName) {
    var ns = namespace === null ? null : String(namespace);
    return new DOMElement(tagName, this, ns)
};

proto.createElement = function createElement(tagName) {
    return new DOMElement(tagName, this)
};

proto.createDocumentFragment = function createDocumentFragment() {
    return new DocumentFragment(this)
};

proto.createEvent = function createEvent(family) {
    return new Event()
};

proto.createComment = function createComment(data) {
    return new Comment(data, this)
};

proto.getElementById = function getElementById(id) {
    id = String(id);

    var result = domWalk(this.childNodes, function (node) {
        if (String(node.id) === id) {
            return node
        }
    });

    return result || null
};

proto.getElementsByClassName = DOMElement.prototype.getElementsByClassName;
proto.getElementsByTagName = DOMElement.prototype.getElementsByTagName;
proto.contains = DOMElement.prototype.contains;

proto.removeEventListener = removeEventListener;
proto.addEventListener = addEventListener;
proto.dispatchEvent = dispatchEvent;

var Document = document$3;

var minDocument = new Document();

var topLevel = typeof commonjsGlobal !== 'undefined' ? commonjsGlobal :
    typeof window !== 'undefined' ? window : {};
var minDoc = minDocument;

var doccy;

if (typeof document !== 'undefined') {
    doccy = document;
} else {
    doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

    if (!doccy) {
        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
    }
}

var document_1 = doccy;

var isObject$1 = function isObject(x) {
	return typeof x === 'object' && x !== null;
};

var isObject = isObject$1;
var isHook = isVhook;

var applyProperties_1 = applyProperties$2;

function applyProperties$2(node, props, previous) {
    for (var propName in props) {
        var propValue = props[propName];

        if (propValue === undefined) {
            removeProperty(node, propName, propValue, previous);
        } else if (isHook(propValue)) {
            removeProperty(node, propName, propValue, previous);
            if (propValue.hook) {
                propValue.hook(node,
                    propName,
                    previous ? previous[propName] : undefined);
            }
        } else {
            if (isObject(propValue)) {
                patchObject(node, props, previous, propName, propValue);
            } else {
                node[propName] = propValue;
            }
        }
    }
}

function removeProperty(node, propName, propValue, previous) {
    if (previous) {
        var previousValue = previous[propName];

        if (!isHook(previousValue)) {
            if (propName === "attributes") {
                for (var attrName in previousValue) {
                    node.removeAttribute(attrName);
                }
            } else if (propName === "style") {
                for (var i in previousValue) {
                    node.style[i] = "";
                }
            } else if (typeof previousValue === "string") {
                node[propName] = "";
            } else {
                node[propName] = null;
            }
        } else if (previousValue.unhook) {
            previousValue.unhook(node, propName, propValue);
        }
    }
}

function patchObject(node, props, previous, propName, propValue) {
    var previousValue = previous ? previous[propName] : undefined;

    // Set attributes
    if (propName === "attributes") {
        for (var attrName in propValue) {
            var attrValue = propValue[attrName];

            if (attrValue === undefined) {
                node.removeAttribute(attrName);
            } else {
                node.setAttribute(attrName, attrValue);
            }
        }

        return
    }

    if(previousValue && isObject(previousValue) &&
        getPrototype(previousValue) !== getPrototype(propValue)) {
        node[propName] = propValue;
        return
    }

    if (!isObject(node[propName])) {
        node[propName] = {};
    }

    var replacer = propName === "style" ? "" : undefined;

    for (var k in propValue) {
        var value = propValue[k];
        node[propName][k] = (value === undefined) ? replacer : value;
    }
}

function getPrototype(value) {
    if (Object.getPrototypeOf) {
        return Object.getPrototypeOf(value)
    } else if (value.__proto__) {
        return value.__proto__
    } else if (value.constructor) {
        return value.constructor.prototype
    }
}

var document$2 = document_1;

var applyProperties$1 = applyProperties_1;

var isVNode = isVnode;
var isVText = isVtext;
var isWidget$2 = isWidget_1;
var handleThunk = handleThunk_1;

var createElement_1$1 = createElement$2;

/**
 * 根据虚拟节点创建真实的DOM节点
 * @param {Object} vnode - 虚拟节点对象，包含tagName、properties、children等属性
 * @param {Object} opts - 可选参数对象，可能包含document和warn属性
 * @returns {Object} 返回创建的DOM节点，如果vnode不是有效的虚拟节点，返回null
 */
function createElement$2(vnode, opts) {
    var doc = opts ? opts.document || document$2 : document$2;
    var warn = opts ? opts.warn : null;

    vnode = handleThunk(vnode).a;

    if (isWidget$2(vnode)) {
        return vnode.init()
    } else if (isVText(vnode)) {
        return doc.createTextNode(vnode.text)
    } else if (!isVNode(vnode)) {
        if (warn) {
            warn("Item is not a valid virtual dom node", vnode);
        }
        return null
    }

    var node = (vnode.namespace === null) ?
        doc.createElement(vnode.tagName) :
        doc.createElementNS(vnode.namespace, vnode.tagName);

    var props = vnode.properties;
    applyProperties$1(node, props);

    var children = vnode.children;

    for (var i = 0; i < children.length; i++) {
        var childNode = createElement$2(children[i], opts);
        if (childNode) {
            node.appendChild(childNode);
        }
    }

    return node
}

// Maps a virtual DOM tree onto a real DOM tree in an efficient manner.
// We don't want to read all of the DOM nodes in the tree so we use
// the in-order tree indexing to eliminate recursion down certain branches.
// We only recurse into a DOM node if we know that it contains a child of
// interest.

var noChild = {};

var domIndex_1 = domIndex$1;

function domIndex$1(rootNode, tree, indices, nodes) {
    if (!indices || indices.length === 0) {
        return {}
    } else {
        indices.sort(ascending);
        return recurse(rootNode, tree, indices, nodes, 0)
    }
}

function recurse(rootNode, tree, indices, nodes, rootIndex) {
    nodes = nodes || {};


    if (rootNode) {
        if (indexInRange(indices, rootIndex, rootIndex)) {
            nodes[rootIndex] = rootNode;
        }

        var vChildren = tree.children;

        if (vChildren) {

            var childNodes = rootNode.childNodes;

            for (var i = 0; i < tree.children.length; i++) {
                rootIndex += 1;

                var vChild = vChildren[i] || noChild;
                var nextIndex = rootIndex + (vChild.count || 0);

                // skip recursion down the tree if there are no nodes down here
                if (indexInRange(indices, rootIndex, nextIndex)) {
                    recurse(childNodes[i], vChild, indices, nodes, rootIndex);
                }

                rootIndex = nextIndex;
            }
        }
    }

    return nodes
}

// Binary search for an index in the interval [left, right]
function indexInRange(indices, left, right) {
    if (indices.length === 0) {
        return false
    }

    var minIndex = 0;
    var maxIndex = indices.length - 1;
    var currentIndex;
    var currentItem;

    while (minIndex <= maxIndex) {
        currentIndex = ((maxIndex + minIndex) / 2) >> 0;
        currentItem = indices[currentIndex];

        if (minIndex === maxIndex) {
            return currentItem >= left && currentItem <= right
        } else if (currentItem < left) {
            minIndex = currentIndex + 1;
        } else  if (currentItem > right) {
            maxIndex = currentIndex - 1;
        } else {
            return true
        }
    }

    return false;
}

function ascending(a, b) {
    return a > b ? 1 : -1
}

var isWidget$1 = isWidget_1;

var updateWidget_1 = updateWidget$1;

function updateWidget$1(a, b) {
    if (isWidget$1(a) && isWidget$1(b)) {
        if ("name" in a && "name" in b) {
            return a.id === b.id
        } else {
            return a.init === b.init
        }
    }

    return false
}

var applyProperties = applyProperties_1;

var isWidget = isWidget_1;
var VPatch = vpatch;

var updateWidget = updateWidget_1;

var patchOp$1 = applyPatch$1;

function applyPatch$1(vpatch, domNode, renderOptions) {
    var type = vpatch.type;
    var vNode = vpatch.vNode;
    var patch = vpatch.patch;

    switch (type) {
        case VPatch.REMOVE:
            return removeNode(domNode, vNode)
        case VPatch.INSERT:
            return insertNode(domNode, patch, renderOptions)
        case VPatch.VTEXT:
            return stringPatch(domNode, vNode, patch, renderOptions)
        case VPatch.WIDGET:
            return widgetPatch(domNode, vNode, patch, renderOptions)
        case VPatch.VNODE:
            return vNodePatch(domNode, vNode, patch, renderOptions)
        case VPatch.ORDER:
            reorderChildren(domNode, patch);
            return domNode
        case VPatch.PROPS:
            applyProperties(domNode, patch, vNode.properties);
            return domNode
        case VPatch.THUNK:
            return replaceRoot(domNode,
                renderOptions.patch(domNode, patch, renderOptions))
        default:
            return domNode
    }
}

function removeNode(domNode, vNode) {
    var parentNode = domNode.parentNode;

    if (parentNode) {
        parentNode.removeChild(domNode);
    }

    destroyWidget(domNode, vNode);

    return null
}

function insertNode(parentNode, vNode, renderOptions) {
    var newNode = renderOptions.render(vNode, renderOptions);

    if (parentNode) {
        parentNode.appendChild(newNode);
    }

    return parentNode
}

function stringPatch(domNode, leftVNode, vText, renderOptions) {
    var newNode;

    if (domNode.nodeType === 3) {
        domNode.replaceData(0, domNode.length, vText.text);
        newNode = domNode;
    } else {
        var parentNode = domNode.parentNode;
        newNode = renderOptions.render(vText, renderOptions);

        if (parentNode && newNode !== domNode) {
            parentNode.replaceChild(newNode, domNode);
        }
    }

    return newNode
}

function widgetPatch(domNode, leftVNode, widget, renderOptions) {
    var updating = updateWidget(leftVNode, widget);
    var newNode;

    if (updating) {
        newNode = widget.update(leftVNode, domNode) || domNode;
    } else {
        newNode = renderOptions.render(widget, renderOptions);
    }

    var parentNode = domNode.parentNode;

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode);
    }

    if (!updating) {
        destroyWidget(domNode, leftVNode);
    }

    return newNode
}

function vNodePatch(domNode, leftVNode, vNode, renderOptions) {
    var parentNode = domNode.parentNode;
    var newNode = renderOptions.render(vNode, renderOptions);

    if (parentNode && newNode !== domNode) {
        parentNode.replaceChild(newNode, domNode);
    }

    return newNode
}

function destroyWidget(domNode, w) {
    if (typeof w.destroy === "function" && isWidget(w)) {
        w.destroy(domNode);
    }
}

function reorderChildren(domNode, moves) {
    var childNodes = domNode.childNodes;
    var keyMap = {};
    var node;
    var remove;
    var insert;

    for (var i = 0; i < moves.removes.length; i++) {
        remove = moves.removes[i];
        node = childNodes[remove.from];
        if (remove.key) {
            keyMap[remove.key] = node;
        }
        domNode.removeChild(node);
    }

    var length = childNodes.length;
    for (var j = 0; j < moves.inserts.length; j++) {
        insert = moves.inserts[j];
        node = keyMap[insert.key];
        // this is the weirdest bug i've ever seen in webkit
        domNode.insertBefore(node, insert.to >= length++ ? null : childNodes[insert.to]);
    }
}

function replaceRoot(oldRoot, newRoot) {
    if (oldRoot && newRoot && oldRoot !== newRoot && oldRoot.parentNode) {
        oldRoot.parentNode.replaceChild(newRoot, oldRoot);
    }

    return newRoot;
}

var document$1 = document_1;
var isArray = xIsArray;

var render$1 = createElement_1$1;
var domIndex = domIndex_1;
var patchOp = patchOp$1;
var patch_1$1 = patch$2;

function patch$2(rootNode, patches, renderOptions) {
    renderOptions = renderOptions || {};
    renderOptions.patch = renderOptions.patch && renderOptions.patch !== patch$2
        ? renderOptions.patch
        : patchRecursive;
    renderOptions.render = renderOptions.render || render$1;

    return renderOptions.patch(rootNode, patches, renderOptions)
}

function patchRecursive(rootNode, patches, renderOptions) {
    // 通常情况，renderOptions = { patch: patchRecursive, render, }

    // console.log('patches', patches)
    
    var indices = patchIndices(patches);

    if (indices.length === 0) {
        return rootNode
    }

    var index = domIndex(rootNode, patches.a, indices);
    var ownerDocument = rootNode.ownerDocument;

    if (!renderOptions.document && ownerDocument !== document$1) {
        renderOptions.document = ownerDocument;
    }

    for (var i = 0; i < indices.length; i++) {
        var nodeIndex = indices[i];
        rootNode = applyPatch(rootNode,
            index[nodeIndex],
            patches[nodeIndex],
            renderOptions);
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList, renderOptions) {
    if (!domNode) {
        return rootNode
    }

    var newNode;

    if (isArray(patchList)) {
        for (var i = 0; i < patchList.length; i++) {
            newNode = patchOp(patchList[i], domNode, renderOptions);

            if (domNode === rootNode) {
                rootNode = newNode;
            }
        }
    } else {
        newNode = patchOp(patchList, domNode, renderOptions);

        if (domNode === rootNode) {
            rootNode = newNode;
        }
    }

    return rootNode
}

function patchIndices(patches) {
    var indices = [];

    for (var key in patches) {
        if (key !== "a") {
            indices.push(Number(key));
        }
    }

    return indices
}

var patch$1 = patch_1$1;

var patch_1 = patch$1;

var createElement$1 = createElement_1$1;

var createElement_1 = createElement$1;

const h = h_1;
const diff = diff_1;
const patch = patch_1;
const createElement = createElement_1;

function render(key) {
  if (key >= 'A' && key <= 'Z') return h('div', { key }, [key])

  return h('div', [key])
}

const oldList = ['A', 'B', 'x', 'y', 'E', 'F'];
const newList = ['B', 'A',' z', 'E', 'G', 'a', 'b'];

const oldTree = h('div', { key: 'root' }, oldList.map(key => render(key)));
console.log('oldTree', oldTree);

let rootNode = createElement(oldTree);
console.log('rootNode', rootNode);

document.body.appendChild(rootNode);

setTimeout(() => {
  const newTree = h('div', { key: 'root' }, newList.map(key => render(key)));
  console.log('newTree', newTree);

  const patches = diff(oldTree, newTree);

  rootNode = patch(rootNode, patches);
  // console.log('patch结果', rootNode)
}, 3000);

export { src as default };
