const { apply } = require('fantasy-combinators')

module.exports = {
  'Left Identity': (create, equality) => (a) => {
    const x = create(a).chain(apply(create))
    const y = apply(create)(a)
    return equality(x, y)
  },
  'Right Identity': (create, equality) => (a) => {
    const x = create(a).chain(create)
    const y = create(a)
    return equality(x, y)
  },
  'Associativity': (create, equality) => (a) => {
    const x = create(a).chain(create).chain(create)
    const y = create(a).chain((x) => create(x).chain(create))
    return equality(x, y)
  },
}
