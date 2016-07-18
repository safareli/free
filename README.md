# Free [![Build Status][build-image]][build] [![npm Version][version-image]][version] [![Code Coverage][coverage-image]][coverage] [![Code Climate][climate-image]][climate] [![License][license-image]][license]

> Combination of a Free applicative functor and Free monad.


## API

Free implements [Functor](https://github.com/fantasyland/fantasy-land#functor), [Applicative](https://github.com/fantasyland/fantasy-land#applicative) and [Monad](https://github.com/fantasyland/fantasy-land#monad) specifications.

### Applicative, Functor and Monad functions:

- Free.prototype.`map :: Free i a -> (a -> b) -> Free i b`
- Free.`of :: a -> Free i a`
- Free.prototype.`ap :: Free i (a -> b) -> Free i a -> Free i b`
- Free.prototype.`chain :: Free i a -> (a -> Free i b) -> Free i b`


### Free structure functions:

- Free.prototype.`hoist :: Free i a -> (i -> z) -> Free z a`
- Free.`liftF :: i -> Free i a`
- Free.prototype.`retract :: Monad m => Free m a -> (a -> m a) -> m a`
- Free.prototype.`graft :: Free i a -> (i -> Free z a) -> Free z a`
- Free.prototype.`foldMap :: Monad m => Free i a -> (i -> m a) -> (a -> m a) -> m a`

### Free structure function equivalencies:

- `graft(f) ≡ foldMap(f, Free.of)`
- `hoist(f) ≡ foldMap(compose(liftF, f), Free.of)`
- `retract(of) ≡ foldMap(id, of)`
- `foldMap(f, of) ≡ compose(retract(of), hoist(f))`

---

This module was started as port of [srijs/haskell-free-concurrent][haskell-free-concurrent] to JavaScript.


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

[haskell-free-concurrent]: https://github.com/srijs/haskell-free-concurrent/blob/1a56280e8d63e037cf8f9e57aa17ac6a8ac817a5/src/Control/Concurrent/Free.hs
