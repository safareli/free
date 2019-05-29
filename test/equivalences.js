const Ɐ = require('jsverify')
const { test } = require('tap')

const {
  compose, id, equals, lift2,
  Concurrent, Seq, Par, Identity,
} = require('./lib')

test('Check fold, hoist, retract and graft equivalencies', (t) => {
  const run = (T, { fold, hoist, retract, graft }) => {
    const tree = lift2((a) => (b) => [a, b], T.of(10), T.lift(1))
    const foldTree = (tree) => tree[fold]((a) => Identity(a), Identity).x
    const treeEq = (a, b) => equals(foldTree(a), foldTree(b))

    const cases = [
      [`${graft}(f) ≡ ${fold}(f, T)`, Ɐ.forall('number -> number', (f) => {
        const fʹ = compose(T.lift)(f)
        return treeEq(tree[graft](fʹ), tree[fold](fʹ, T))
      })],

      // map(f) ≡ chain(compose(of)(f))
      // hoist(f) ≡ graft(compose(lift)(f))
      [`${hoist}(f) ≡ ${fold}(compose(lift, f), T)`, Ɐ.forall('number -> number', (f) => {
        return treeEq(tree[hoist](f), tree[fold](compose(T.lift)(f), T))
      })],

      [`${retract}(T) ≡ ${fold}(id, T)`, Ɐ.forall('number -> number', (f) => {
        const treeʹ = tree[hoist](compose(Identity)(f))
        return equals(treeʹ[retract](Identity).x, treeʹ[fold](id, Identity).x)
      })],

      [`${fold}(f, T) ≡ compose(${retract}(T), ${hoist}(f))`, Ɐ.forall('number -> number', (f) => {
        const fʹ = compose(Identity)(f)
        return equals(tree[fold](fʹ, Identity).x, tree[hoist](fʹ)[retract](Identity).x)
      })],
    ]

    cases.forEach(([title, prop]) => { t.notThrow(() => { Ɐ.assert(prop) }, `${T}: ${title}`) })
  }

  run(Concurrent, {
    fold: 'fold',
    hoist: 'hoist',
    retract: 'retract',
    graft: 'graft',
  })
  run(Seq, {
    fold: 'foldSeq',
    hoist: 'hoistSeq',
    retract: 'retractSeq',
    graft: 'graftSeq',
  })
  run(Par, {
    fold: 'foldPar',
    hoist: 'hoistPar',
    retract: 'retractPar',
    graft: 'graftPar',
  })

  t.end()
})
