const Ɐ = require('jsverify')
const { test } = require('tap')
const { Free } = require('./lib')
const laws = require('./lib/laws/')
const equals = require('ramda/src/equals')
const unnest = require('ramda/src/unnest')

test('Check laws', (t) => {
  for (let [title, law] of unnest([laws.functor, laws.applicative, laws.monad])) {
    t.notThrow(() => {
      Ɐ.assert(Ɐ.forall(Ɐ.any, law(Free.of, equals)))
    }, title)
  }
  t.end()
})
