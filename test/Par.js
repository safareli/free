const Ɐ = require('jsverify')
const { test } = require('tap')
const { Par, Identity, id, ap, equals, lift3, MAX_STACK } = require('./lib')
const lawApplicative = require('fantasy-land/laws/applicative.js')
const lawFunctor = require('fantasy-land/laws/functor.js')

test('Check laws', (t) => {
  const idFold = a => a.foldPar(x => Identity(x), Identity)
  const eq = (a, b) => equals(idFold(a), idFold(b))
  const testLaw = (law, lawTitle, key, args) => {
    t.notThrow(() => {
      Ɐ.assert(Ɐ.forall(Ɐ.any, args.reduce((f, a) => f(a), law[key])))
    }, `${lawTitle}: ${key}`)
  }

  testLaw(lawApplicative, 'Applicative', 'identity', [Par, eq])
  testLaw(lawApplicative, 'Applicative', 'homomorphism', [Par, eq])
  testLaw(lawApplicative, 'Applicative', 'interchange', [Par, eq])
  testLaw(lawFunctor, 'Functor', 'identity', [Par.of, eq])
  testLaw(lawFunctor, 'Functor', 'composition', [Par.of, eq, a => [a], a => [a, a]])

  t.end()
})

test('misc', (t) => {
  const run = (name, expected, v) => {
    t.same(v.foldPar(a => Identity(a.to * 10), Identity), expected, name)
  }

  run('map', Identity(11), Par.lift({to: 1}).map(a => a + 1))
  run('ap', Identity(11), Par.lift({to: 1}).ap(Par.of(a => a + 1)))
  run('ap.map', Identity(20), Par.lift({to: 1}).ap(Par.lift({to: 1}).map(a => b => a + b)))

  t.end()
})

test('fold order should be left to right', (t) => {
  const f = a1 => a2 => a3 => '' + a1 + a2 + a3
  const a1 = Par.lift(1)
  const a2 = Par.lift(2)
  const a3 = Par.lift(3)
  const tree = lift3(f, a1, a2, lift3(f, a1, a2, a3))
  let order = []

  t.same(tree.foldPar(i => {
    order.push(i)
    return Identity(i)
  }, Identity), Identity('12123'), 'produces correct result')
  t.same(order, [1, 2, 1, 2, 3], 'order of fold is correct')

  t.end()
})

test('Is stack safe', t => {
  const apTimes = (n) => {
    const args = []
    const f = (a) => {
      args.push(a)
      if (args.length === n) {
        return args.length
      }
      return f
    }
    let res = Par.lift(f)
    for (let i = 0; i < n; i++) {
      res = ap(res, Par.lift(i))
    }
    return res
  }

  const testN = MAX_STACK

  t.equals(apTimes(testN).hoistPar(id).foldPar(Identity.of, Identity).get(), testN, 'is Par stack safe')
  t.equals(apTimes(testN).foldPar(Identity.of, Identity).get(), testN, 'Works with Identity')

  t.end()
})
