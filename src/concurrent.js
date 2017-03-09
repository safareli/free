const daggy = require('daggy')
const { map, chain, chainRec } = require('sanctuary-type-classes')
const patch = require('./fl-patch')
const _Par = require('./par')
const _Seq = require('./seq')
const { id, compose } = require('./utils')

// data Interpreter f g m = Interpreter
//   { runSeq :: Ɐ x. f x -> m x
//   , runPar :: Ɐ x. f x -> g x
//   , seqToPar :: Ɐ x. m x -> g x
//   , parToSeq :: Ɐ x. g x -> m x
//   , Par :: TypeRep g
//   , Seq :: TypeRep m
//   }

// data Concurrent f a where
//   Lift :: f a -> Concurrent f a
//   Seq  :: Seq (Concurrent f) a -> Concurrent f a
//   Par  :: Par (Concurrent f) a -> Concurrent f a

const Concurrent = daggy.taggedSum('Concurrent', {
  Lift: ['a'],
  Seq: ['a'],
  Par: ['a'],
})

const {Lift, Seq, Par} = Concurrent

Object.assign(Concurrent, patch({
  // :: a -> Concurrent f a
  of: a => Seq(_Seq.of(a)),
  // :: f -> Concurrent f a
  lift: Lift,
  // :: Par (Concurrent f) a -> Concurrent f a
  fromPar: Par,
  // :: Seq (Concurrent f) a -> Concurrent f a
  fromSeq: Seq,
  // :: ((a -> c, b -> c, a) -> Seq f c, a) -> Seq f b
  chainRec: (f, i) => Seq(
    chainRec(_Seq, (next, done, v) => f(next, done, v).seq(), i)
  ),
}))

Object.assign(Concurrent.prototype, patch({
  // :: Concurrent f a ~> (a -> b) -> Concurrent f b
  map(f) {
    return Seq(map(f, this.seq()))
  },
  // :: Concurrent f a ~> Concurrent f (a -> b) -> Concurrent f b
  ap(mf) {
    return chain(f => map(f, this), mf)
  },
  // :: Concurrent f a ~> (a -> Concurrent f b) -> Concurrent f b
  chain(f) {
    return Seq(chain(a => f(a).seq(), this.seq()))
  },
  // :: (Monad m, ChainRec m) => Concurrent f a ~> (Ɐ x. f x -> m x, TypeRep m) -> m a`
  fold(f, T) {
    return this.cata({
      Lift: (a) => f(a),
      Par: (a) => a.foldPar(b => b.fold(f, T), T),
      Seq: (a) => a.foldSeq(b => b.fold(f, T), T),
    })
  },
  // :: Concurrent f a -> Seq (Concurrent f) a
  seq() {
    return this.cata({
      Lift: (a) => _Seq.lift(this),
      Par: (a) => _Seq.lift(this),
      Seq: (a) => a,
    })
  },
  // :: Concurrent f a -> Par (Concurrent f) a
  par() {
    return this.cata({
      Lift: (a) => _Par.lift(this),
      Par: (a) => a,
      Seq: (a) => _Par.lift(this),
    })
  },
  // :: (Monad m, ChainRec m, Applicative g) => Concurrent f a ~> Interpreter f g m -> m a`
  interpret(interpreter) {
    const { runSeq, runPar, seqToPar, parToSeq, Seq, Par } = interpreter
    return this.cata({
      Lift: (a) => runSeq(a),
      Par: (a) => a.foldPar(x => x.cata({
        Lift: (a) => runPar(a),
        Par: (a) => x.interpret(interpreter),
        Seq: (a) => seqToPar(x.interpret(interpreter)),
      }), Par),
      Seq: (a) => a.foldSeq(x => x.cata({
        Lift: (a) => runSeq(a),
        Par: (a) => parToSeq(x.interpret(interpreter)),
        Seq: (a) => x.interpret(interpreter),
      }), Seq),
    })
  },
  // :: Concurrent f a ~> (Ɐ x. f x -> g x) -> Concurrent g a`
  hoist(f) {
    return this.fold(compose(Concurrent.lift)(f), Concurrent)
  },
  // :: (Monad m, ChainRec m) => Concurrent m a ~> TypeRep m -> m a`
  retract(m) {
    return this.fold(id, m)
  },
  // :: Concurrent f a ~> (Ɐ x. f x -> Concurrent g x) -> Concurrent g a`
  graft(f) {
    return this.fold(f, Concurrent)
  },
}))

module.exports = Concurrent
