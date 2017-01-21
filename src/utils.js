const { chain } = require('sanctuary-type-classes')
const union = require('./union')

//    compose :: (b -> c) -> (a -> b) -> a -> c
const compose = bc => ab => a => bc(ab(a))

//    kcompose :: (Monad m) => b -> m c -> (a -> m b) -> a -> m c
const kcompose = bc => ab => a => chain(bc, ab(a))

//    id :: a -> a
const id = a => a

module.exports = {
  compose,
  kcompose,
  id,
  union,
}
