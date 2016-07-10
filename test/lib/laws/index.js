const monad = require('./monad.js')
const applicative = require('./applicative.js')
const functor = require('./functor.js')

const lawsToList = (a, name) => Object.keys(a).map((k) => [`${name}: ${k}`, a[k]])
module.exports = {
  functor: lawsToList(functor, 'Functor'),
  applicative: lawsToList(applicative, 'Applicative'),
  monad: lawsToList(monad, 'Monad'),
}
