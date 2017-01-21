const Ɐ = require('jsverify')
const { test } = require('tap')
const { Concurrent, Identity, Future, id, equals, MAX_STACK } = require('./lib')
const lawMonad = require('fantasy-land/laws/monad.js')
const lawApplicative = require('fantasy-land/laws/applicative.js')
const lawFunctor = require('fantasy-land/laws/functor.js')

test('Check laws', (t) => {
  const testLaw = (law, lawTitle, key, args) => {
    t.notThrow(() => {
      Ɐ.assert(Ɐ.forall(Ɐ.any, args.reduce((f, a) => f(a), law[key])))
    }, `${lawTitle}: ${key}`)
  }

  testLaw(lawMonad, 'Monad', 'leftIdentity', [Concurrent, equals, Concurrent.of])
  testLaw(lawMonad, 'Monad', 'rightIdentity', [Concurrent, equals])
  testLaw(lawApplicative, 'Applicative', 'identity', [Concurrent, equals])
  testLaw(lawApplicative, 'Applicative', 'homomorphism', [Concurrent, equals])
  testLaw(lawApplicative, 'Applicative', 'interchange', [Concurrent, equals])
  testLaw(lawFunctor, 'Functor', 'identity', [Concurrent.of, equals])
  testLaw(lawFunctor, 'Functor', 'composition', [Concurrent.of, equals, a => [a], a => [a, a]])

  t.end()
})

test('misc', (t) => {
  const run = (name, expected, v) => t.same(v.fold(a => Identity(a.to * 10), Identity), expected, name)

  run('lift.chain.map.ap', Identity(111), Concurrent
    .lift({to: 1})
    .chain((a) => Concurrent.lift({to: a + 1}))
    .map(a => b => a + b)
    .ap(Concurrent.of(f => f(1)))
  )

  run('lift.chain.map', Identity(111), Concurrent
    .lift({to: 1})
    .chain((a) => Concurrent.lift({to: a + 1}))
    .map(a => a + 1)
  )

  run('lift.chain', Identity(110), Concurrent
    .lift({to: 1})
    .chain((a) => Concurrent.lift({to: a + 1}))
  )

  t.end()
})

test('Is stack safe', t => {
  const runTimes = (n) => (v) => {
    const res = Concurrent.lift(n)
    if (n === 0) {
      return res
    }
    return res.chain(runTimes(n - 1))
  }

  runTimes(MAX_STACK)().fold(Future.of, Future).fork(t.error, (v) => t.equals(v, 0, 'Works with Future'))
  t.equals(runTimes(MAX_STACK)().hoist(id).fold(Identity.of, Identity).get(), 0, 'is Concurrent stack safe')
  t.equals(runTimes(MAX_STACK)().fold(Identity.of, Identity).get(), 0, 'Works with Identity')

  t.end()
})
