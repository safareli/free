const { identity, compose } = require('fantasy-combinators')

module.exports = {
  'Identity': (create, equality) => (a) => {
    const x = create(a).map(identity)
    const y = create(a)
    return equality(x, y)
  },
  'Composition': (create, equality) => (a) => {
    const x = create(a).map(compose(identity)(identity))
    const y = create(a).map(identity).map(identity)
    return equality(x, y)
  },
}
