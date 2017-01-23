const union = require('./union')

//    compose :: (b -> c) -> (a -> b) -> a -> c
const compose = bc => ab => a => bc(ab(a))

//    id :: a -> a
const id = a => a

module.exports = {
  compose,
  id,
  union,
}
