const { identity, compose, thrush } = require('fantasy-combinators')

module.exports = {
  'Identity': (create, equality) => (a) => {
    const x = create(identity).ap(create(a))
    const y = create(a)
    return equality(x, y)
  },
  'Composition': (create, equality) => (a) => {
    const x = create(compose).ap(create(identity)).ap(create(identity)).ap(create(a))
    const y = create(identity).ap(create(identity).ap(create(a)))
    return equality(x, y)
  },
  'Homomorphism': (create, equality) => (a) => {
    const x = create(identity).ap(create(a))
    const y = create(identity(a))
    return equality(x, y)
  },
  'Interchange': (create, equality) => (a) => {
    const x = create(identity).ap(create(a))
    const y = create(thrush(a)).ap(create(identity))
    return equality(x, y)
  },
}
