const h = require("../../h.js")
const diff = require("../../diff.js")
const patch = require("../../patch.js")
const createElement = require("../../create-element.js")

function render(key) {
  if (key >= 'A' && key <= 'Z') return h('div', { key }, [key])

  return h('div', [key])
}

const oldList = ['A', 'B', 'x', 'y', 'E', 'F']
const newList = ['B', 'A',' z', 'E', 'G', 'a', 'b']

const oldTree = h('div', { key: 'root' }, oldList.map(key => render(key)))
console.log('oldTree', oldTree)

let rootNode = createElement(oldTree)
console.log('rootNode', rootNode)

document.body.appendChild(rootNode)

setTimeout(() => {
  const newTree = h('div', { key: 'root' }, newList.map(key => render(key)))
  console.log('newTree', newTree)

  const patches = diff(oldTree, newTree)

  rootNode = patch(rootNode, patches)
  // console.log('patch结果', rootNode)
}, 3000)
