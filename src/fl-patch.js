const fl = require('fantasy-land')

const _patch = (obj, outObj) => Object.keys(fl).reduce((acc, key) => {
  if (typeof obj[key] === 'function') {
    acc[fl[key]] = obj[key]
  }
  return acc
}, outObj)

const patch = obj => Object.assign(
  _patch(obj, {}),
  obj
)

patch.mutate = (obj) => _patch(obj, obj)

module.exports = patch
