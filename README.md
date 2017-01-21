# Free [![Build Status][build-image]][build] [![npm Version][version-image]][version] [![Code Coverage][coverage-image]][coverage] [![Code Climate][climate-image]][climate] [![License][license-image]][license]

> Combination of a Free applicative functor and Free monad.


## API

### Types
```hs
data Par f a where
  Pure  :: a -> Par f a
  Apply :: f a -> Par f (a -> b) -> Par f b

data Seq f a where
  Pure :: a -> Seq f a
  Roll :: f a -> (a -> Seq f b) -> Seq f b

data Concurrent f a where
  Lift :: f a -> Concurrent f a
  Seq  :: Seq (Concurrent f) a -> Concurrent f a
  Par  :: Par (Concurrent f) a -> Concurrent f a

data Interpreter f g m = Interpreter
  { runSeq :: Ɐ x. f x -> m x
  , runPar :: Ɐ x. f x -> g x
  , seqToPar :: Ɐ x. m x -> g x
  , parToSeq :: Ɐ x. g x -> m x
  , Par :: TypeRep g
  , Seq :: TypeRep m
  }

```



### Concurrent

Implements [Functor][], [Applicative][], [ChainRec][] and [Monad][] specifications.

It holds `Par`allel or `Seq`uential computations which are itself holding Concurrent computations. When operating on Concurrent structures it's behaving as Sequential. but in cases you want Parallel behaviour you can call `.par()` on it and it will return `Par` object which is only Applicative. then you can move back to `Concurrent` using `Concurrent.Par`.


#### Functor, Applicative, ChainRec and Monad functions:

- Concurrent.prototype.`map :: Concurrent f a ~> (a -> b) -> Concurrent f b`
- Concurrent.prototype.`ap :: Concurrent f a ~> Concurrent f (a -> b) -> Concurrent f b`
- Concurrent.prototype.`chain :: Concurrent f a ~> (a -> Concurrent f b) -> Concurrent f b`
- Concurrent.`chainRec :: ((a -> c, b -> c, a) -> Concurrent f c, a) -> Concurrent f b`
- Concurrent.`of :: a -> Concurrent f a`

#### other functions:

- Concurrent.`Par :: Par (Concurrent f) a -> Concurrent f a`
- Concurrent.`Seq :: Seq (Concurrent f) a -> Concurrent f a`
- Concurrent.`Lift :: f a -> Concurrent f a`
- Concurrent.`lift :: f a -> Concurrent f a`
- Concurrent.prototype.`seq :: Concurrent f a ~> Seq (Concurrent f) a`
- Concurrent.prototype.`par :: Concurrent f a ~> Par (Concurrent f) a`
- Concurrent.prototype.`interpret :: (Monad m, ChainRec m, Applicative g) => Concurrent f a ~> Interpreter f g m -> m a`
- Concurrent.prototype.`fold :: (Monad m, ChainRec m) => Concurrent f a ~> (Ɐ x. f x -> m x, TypeRep m) -> m a`
- Concurrent.prototype.`hoist :: Concurrent f a ~> (Ɐ x. f x -> g x) -> Concurrent g a`
- Concurrent.prototype.`retract :: (Monad m, ChainRec m) => Concurrent m a ~> TypeRep m -> m a`
- Concurrent.prototype.`graft :: Concurrent f a ~> (Ɐ x. f x -> Concurrent g x) -> Concurrent g a`



### Seq

Implements [Functor][], [Applicative][], [ChainRec][] and [Monad][] specifications.

#### Functor, Applicative, ChainRec and Monad functions:

- Seq.prototype.`map :: Seq f a ~> (a -> b) -> Seq f b`
- Seq.prototype.`ap :: Seq f a ~> Seq f (a -> b) -> Seq f b`
- Seq.prototype.`chain :: Seq f a ~> (a -> Seq f b) -> Seq f b`
- Seq.`chainRec :: ((a -> c, b -> c, a) -> Seq f c, a) -> Seq f b`
- Seq.`of :: a -> Seq f a`

#### other functions:

- Seq.`Pure :: a -> Seq f a`
- Seq.`Roll :: f a -> (a -> Seq f b) -> Seq f b`
- Seq.`lift :: f a -> Seq f a`
- Seq.prototype.`foldSeq :: (Monad m, ChainRec m) => Seq f a ~> (Ɐ x. f x -> m x, TypeRep m) -> m a`
- Seq.prototype.`hoistSeq :: Seq f a ~> (Ɐ x. f x -> g x) -> Seq g a`
- Seq.prototype.`retractSeq :: (Monad m, ChainRec m) => Seq m a ~> TypeRep m -> m a`
- Seq.prototype.`graftSeq :: Seq f a ~> (Ɐ x. f x -> Seq g x) -> Seq g a`



### Par

Implements [Functor][] and [Applicative][] specifications.

#### Functor, Applicative, ChainRec and Monad functions:

- Par.prototype.`map :: Par f a ~> (a -> b) -> Par f b`
- Par.prototype.`ap :: Par f a ~> Par f (a -> b) -> Par f b`
- Par.`of :: a -> Par f a`

#### other functions:

- Par.`Pure  :: a -> Par f a`
- Par.`Apply :: f a -> Par f (a -> b) -> Par f b`
- Par.`lift :: f a -> Par f a`
- Par.prototype.`foldPar :: (Applicative g) => Par f a ~> (Ɐ x. f x -> g x, TypeRep g) -> g a`
- Par.prototype.`hoistPar :: Par f a ~> (Ɐ x. f x -> g x) -> Par g a`
- Par.prototype.`retractPar :: (Applicative f) => Par f a ~> TypeRep f -> f a`
- Par.prototype.`graftPar :: Par f a ~> (Ɐ x. f x -> Par g x) -> Par g a`



### graft, hoist, retract and fold relations:

> same for graftPar, graftSeq ... variations

- `a.graft(f) ≡ a.fold(f, a.constructor)`
- `a.hoist(f) ≡ a.fold(compose(a.constructor.lift, f), a.constructor)`
- `a.retract(M) ≡ a.fold(id, M)`
- `a.fold(f, M) ≡ compose(a.retract(M), a.hoist(f))`

---

This initial version of this module was based on a bit older version of [srijs/haskell-free-concurrent][haskell-free-concurrent-old], but it was not lawful, and from v2 it's based on more resent lawful [version][haskell-free-concurrent-resent].


[Functor]: https://github.com/fantasyland/fantasy-land#functor
[Applicative]: https://github.com/fantasyland/fantasy-land#applicative
[ChainRec]: https://github.com/fantasyland/fantasy-land#chainrec
[Monad]: https://github.com/fantasyland/fantasy-land#monad

[build-image]: https://img.shields.io/travis/safareli/free/master.svg
[build]: https://travis-ci.org/safareli/free

[version-image]: https://img.shields.io/npm/v/@safareli/free.svg
[version]: https://www.npmjs.com/package/@safareli/free

[coverage-image]: https://img.shields.io/codecov/c/github/safareli/free/master.svg
[coverage]: https://codecov.io/gh/safareli/free/branch/master

[climate-image]: https://img.shields.io/codeclimate/github/safareli/free.svg
[climate]: https://codeclimate.com/github/safareli/free

[license-image]: https://img.shields.io/github/license/safareli/free.svg
[license]: https://github.com/safareli/free/blob/master/LICENSE

[haskell-free-concurrent-old]: https://github.com/srijs/haskell-free-concurrent/blob/1a56280e8d63e037cf8f9e57aa17ac6a8ac817a5/src/Control/Concurrent/Free.hs

[haskell-free-concurrent-resent]: https://github.com/srijs/haskell-free-concurrent/blob/1a56280e8d63e037cf8f9e57aa17ac6a8ac817a5/src/Control/Concurrent/Free.hs
