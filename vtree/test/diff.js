const { reorder } = require('../diff')

function Item(value) {
  this.value = value

  // 大写视为有key
  if (/^[A-Z]$/.test(value)) this.key = value
}

function createData(list) {
  return list.map(item => new Item(item))
}

const aChildren = createData(['A', 'B', 'x', 'y', 'E', 'F'])
const bChildren = createData(['B', 'A',' z', 'E', 'G', 'a', 'b'])

console.log('aChildren', JSON.stringify(aChildren))
console.log('bChildren', JSON.stringify(bChildren))

reorder(aChildren, bChildren)
