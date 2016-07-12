const Ɐ = require('jsverify')
const Identity = require('fantasy-identities')
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
