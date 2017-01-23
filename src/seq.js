const { of, map, chain, chainRec } = require('sanctuary-type-classes')
const patch = require('./fl-patch')
const { id, compose, union } = require('./utils')

// data Seq f a where
//   Pure :: a -> Seq f a
//   Lift :: f a -> Seq f a
//   Roll :: Seq f a -> (a -> Seq f b) -> Seq f b

const Seq = union('Seq', {
  Pure: ['a'],
  Lift: ['i'],
  Roll: ['x', 'y'],
})

const { Pure, Lift, Roll } = Seq

const chainRecNext = (value) => ({ done: false, value })
const chainRecDone = (value) => ({ done: true, value })

Object.assign(Seq, patch({
  // :: a -> Seq f a
  of: Pure,
  // :: f a -> Seq f a
  lift: (i) => Lift(i),
  // :: ((a -> c, b -> c, a) -> Seq f c, a) -> Seq f b
  chainRec: (f, i) => chain(
    ({ done, value }) => done ? of(Seq, value) : chainRec(Seq, f, value),
    f(chainRecNext, chainRecDone, i)
  ),
}))

Object.assign(Seq.prototype, patch({
  // :: Seq f a ~> (a -> b) -> Seq f b
  map(f) {
    return chain(a => of(Seq, f(a)), this)
  },
  // :: Seq f a ~> Seq f (a -> b) -> Seq f b
  ap(mf) {
    return chain(f => map(f, this), mf)
  },
  // :: Seq f a ~> (a -> Seq f b) -> Seq f b
  chain(f) {
    // this way in Roll.x we don't have any `Pure` node
    if (Pure.is(this)) {
      return f(this.a)
    }
    return Roll(this, f)
  },
  // :: (Monad m, ChainRec m) => Seq f a ~> (Ɐ x. f x -> m x, TypeRep m) -> m a
  foldSeq(f, T) {
    return chainRec(T, (next, done, { focus, stack }) => {
      while (Pure.is(focus) && stack.length) {
        const fn = stack.pop()
        focus = fn(focus.a)
      }
      if (Pure.is(focus)) {
        return of(T, done(focus.a))
      }
      while (Roll.is(focus)) {
        // We are mutating `stack` for performance reasons but it's not
        // an issue as it's not an observable side effects 8-)
        // If we wanted to do same in a staticly typed language,
        // some kind of efficient type aligned sequnce should be used.
        stack.push(focus.y)
        focus = focus.x
      }
      // here `focus` must be `Lift`
      return map((v) => {
        if (stack.length === 0) {
          return done(v)
        }
        const fn = stack.pop()
        const nextFocus = fn(v)
        return next({ focus: nextFocus, stack })
      }, f(focus.i))
    }, { focus: this, stack: [] })
  },
  // :: Seq f a ~> (Ɐ x. f x -> g x) -> Seq g a
  hoistSeq(f) {
    return this.foldSeq(compose(Seq.lift)(f), Seq)
  },
  // :: (Monad m, ChainRec m) => Seq m a ~> TypeRep m -> m a
  retractSeq(m) {
    return this.foldSeq(id, m)
  },
  // :: Seq f a ~> (Ɐ x. f x -> Seq g x) -> Seq g a
  graftSeq(f) {
    return this.foldSeq(f, Seq)
  },
}))

module.exports = Seq
