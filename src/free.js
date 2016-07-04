const daggy = require('daggy')

if (Function.prototype.map == null) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Function.prototype, 'map', {
    value: function(g) {
      const f = this
      return function(x) { return g(f(x)) }
    },
    writable: true,
    configurable: true,
    enumerable: false,
  })
}

const compose = (f, g) => (x) => f(g(x))
const map = (f) => (v) => v.map(f)
const id = x => x

const Free = daggy.taggedSum({
  Pure: ['x'],
  Lift: ['x', 'f'],
  Ap: ['x', 'y'],
  Join: ['x'],
})

Free.Pure.toString = () => 'Free.Pure'
Free.Ap.toString = () => 'Free.Ap'
Free.Lift.toString = () => 'Free.Lift'
Free.Join.toString = () => 'Free.Join'
Free.prototype.toString = function() {
  return this.cata({
    Pure: (x) => `Pure(${x})`,
    Lift: (x, f) => `Lift(${x},${f})`,
    Ap: (x, y) => `Ap(${x},${y})`,
    Join: (x) => `Join(${x})`,
  })
}

Free.of = Free.Pure
Free.liftF = command => Free.Lift(command, id)

Free.prototype.map = function(f) {
  return this.cata({
    Pure: (x) => Free.Pure(f(x)),
    Lift: (x, g) => Free.Lift(x, compose(f, g)),
    Ap: (x, y) => Free.Ap(x, y.map(map(f))),
    Join: (x) => Free.Join(x.map(map(f))),
  })
}

Free.prototype.ap = function(y) {
  return this.cata({
    Pure: (f) => y.map(f),
    Ap: () => Free.Ap(y, this),
    Lift: () => Free.Ap(y, this),
    Join: () => Free.Ap(y, this),
  })
}

Free.prototype.chain = function(f) {
  return this.cata({
    Pure: (x) => f(x),
    Ap: () => Free.Join(this.map(f)),
    Lift: () => Free.Join(this.map(f)),
    Join: () => Free.Join(this.map(f)),
  })
}

Free.prototype.hoist = function(f) {
  return this.foldMap(compose(Free.liftF, f), Free.of)
}

Free.prototype.retract = function(of) {
  return this.foldMap(id, of)
}

Free.prototype.foldMap = function(f, of) {
  return this.cata({
    Pure: (x) => of(x),
    Lift: (x, g) => f(x).map(g),
    Ap: (x, y) => y.foldMap(f, of).ap(x.foldMap(f, of)),
    Join: (x) => x.map((a) => a.foldMap(f, of)).foldMap(f, of).chain(id),
  })
}

Free.prototype.graft = function(f) {
  return this.foldMap(f, Free.of)
}

module.exports = Free
