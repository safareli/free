const { toString } = require('sanctuary-type-classes')

const cata = function(fs) {
  const union = this.constructor['@@union']
  for (let tag in union) {
    if (union.hasOwnProperty(tag) && typeof fs[tag] !== 'function') {
      throw new Error(`Handler for tag: '${tag}' is not provided to 'cata'`)
    }
  }
  return fs[this.tag].apply(fs, this['@@values'])
}

const makeValue = (typeRep, tag, values) => {
  const fields = typeRep['@@union'][tag]
  if (values.length !== fields.length) {
    throw new TypeError(`Expected ${fields.length} arguments, got ${values.length}`)
  }
  const obj = Object.create(typeRep.prototype)
  obj['@@values'] = values
  obj.tag = tag
  for (let idx = 0; idx < fields.length; idx++) {
    obj[fields[idx]] = values[idx]
  }
  return obj
}

const typeRepToString = function() {
  return this['@@type']
}

const constructorToString = function() {
  return `${this['@@typeRep']['@@type']}.${this['@@tag']}`
}

const objToString = function() {
  return `${this.constructor['@@type']}.${this.tag}(${
    this['@@values'].map(a => toString(a)).join(', ')
  })`
}

const union = (typeName, definitions) => {
  const proto = {}
  proto.cata = cata
  proto.toString = objToString
  const typeRep = {
    toString: typeRepToString,
    prototype: proto,
    '@@union': definitions,
    '@@type': typeName,
  }
  proto.constructor = typeRep
  Object.keys(definitions).forEach(tag => {
    if (definitions[tag].length === 0) {
      typeRep[tag] = makeValue(typeRep, tag, [])
      return
    }
    typeRep[tag] = (...args) => makeValue(typeRep, tag, args)
    typeRep[tag]['@@tag'] = tag
    typeRep[tag]['@@typeRep'] = typeRep
    typeRep[tag].toString = constructorToString
  })
  return typeRep
}

module.exports = union
