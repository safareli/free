const Ɐ = require('jsverify')
const Identity = require('fantasy-identities')
const { test } = require('tap')
const { Free } = require('./lib')
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

test('Check Free structure function equivalencies', (t) => {
  const compose = (f, g) => (x) => f(g(x))
  const id = x => x
  const tree = Free.liftF(1).map((a) => (b) => [a, b]).ap(Free.of(10))
  const foldTree = (t) => t.foldMap((a) => Identity(a), Identity).x
  const treeEq = (a, b) => equals(foldTree(a), foldTree(b))

  const cases = [
    ['graft(f) ≡ foldMap(f, Free.of)', Ɐ.forall('number -> number', (f) => {
      const fʹ = compose(Free.liftF, f)
      return treeEq(tree.graft(fʹ), tree.foldMap(fʹ, Free.of))
    })],

    // map(f) ≡ chain(compose(of, f))
    // hoist(f) ≡ graft(compose(liftF, f))
    ['hoist(f) ≡ foldMap(compose(liftF, f), Free.of)', Ɐ.forall('number -> number', (f) => {
      return treeEq(tree.hoist(f), tree.foldMap(compose(Free.liftF, f), Free.of))
    })],

    ['retract(of) ≡ foldMap(id, of)', Ɐ.forall('number -> number', (f) => {
      const treeʹ = tree.hoist(compose(Identity, f))
      return equals(treeʹ.retract(Identity).x, treeʹ.foldMap(id, Identity).x)
    })],

    ['foldMap(f, of) ≡ compose(retract(of), hoist(f))', Ɐ.forall('number -> number', (f) => {
      const fʹ = compose(Identity, f)
      return equals(tree.foldMap(fʹ, Identity).x, tree.hoist(fʹ).retract(Identity).x)
    })],
  ]

  cases.forEach(([title, prop]) => { t.notThrow(() => { Ɐ.assert(prop) }, title) })
  t.end()
})
