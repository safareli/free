const Ɐ = require('jsverify')
const { test } = require('tap')
const { Free, Identity, Future } = require('./lib')
const equals = require('ramda/src/equals')
const lawMonad = require('fantasy-land/laws/monad.js')
const lawApplicative = require('fantasy-land/laws/applicative.js')
const lawFunctor = require('fantasy-land/laws/functor.js')

test('Check laws', (t) => {
  const testLaw = (law, lawTitle, args) => {
    for (let key of Object.keys(law)) {
      t.notThrow(() => {
        Ɐ.assert(Ɐ.forall(Ɐ.any, args.reduce((f, a) => f(a), law[key])))
      }, `${lawTitle}: ${key}`)
    }
  }

  testLaw(lawMonad, 'Monad', [Free, equals])
  testLaw(lawApplicative, 'Applicative', [Free, equals])
  testLaw(lawFunctor, 'Functor', [Free.of, equals])

  t.end()
})

test('Is stack safe', t => {
  const runTimes = (n) => (v) => {
    const res = Free.liftF(n)
    if (n === 0) {
      return res
    }
    return res.chain(runTimes(n - 1))
  }

  runTimes(10000)().foldMap(Future.of, Future).fork(t.error, (v) => t.equals(v, 0, 'Works with Future'))
  t.equals(runTimes(10000)().foldMap(Identity.of, Identity).get(), 0, 'Works with Identity')

  t.end()
})

test('Check Free structure function equivalencies', (t) => {
  const compose = (f, g) => (x) => f(g(x))
  const id = x => x
  const tree = Free.of(10).ap(Free.liftF(1).map((a) => (b) => [a, b]))
  const foldTree = (t) => t.foldMap((a) => Identity(a), Identity).x
  const treeEq = (a, b) => equals(foldTree(a), foldTree(b))

  const cases = [
    ['graft(f) ≡ foldMap(f, Free)', Ɐ.forall('number -> number', (f) => {
      const fʹ = compose(Free.liftF, f)
      return treeEq(tree.graft(fʹ), tree.foldMap(fʹ, Free))
    })],

    // map(f) ≡ chain(compose(of, f))
    // hoist(f) ≡ graft(compose(liftF, f))
    ['hoist(f) ≡ foldMap(compose(liftF, f), Free)', Ɐ.forall('number -> number', (f) => {
      return treeEq(tree.hoist(f), tree.foldMap(compose(Free.liftF, f), Free))
    })],

    ['retract(M) ≡ foldMap(id, M)', Ɐ.forall('number -> number', (f) => {
      const treeʹ = tree.hoist(compose(Identity, f))
      return equals(treeʹ.retract(Identity).x, treeʹ.foldMap(id, Identity).x)
    })],

    ['foldMap(f, M) ≡ compose(retract(M), hoist(f))', Ɐ.forall('number -> number', (f) => {
      const fʹ = compose(Identity, f)
      return equals(tree.foldMap(fʹ, Identity).x, tree.hoist(fʹ).retract(Identity).x)
    })],
  ]

  cases.forEach(([title, prop]) => { t.notThrow(() => { Ɐ.assert(prop) }, title) })
  t.end()
})
