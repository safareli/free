const daggy = require("daggy")

if (Function.prototype.map == null) {
  Object.defineProperty(Function.prototype, 'map',{
    value: function(g) {
      const f = this
      return function(x) { return g(f(x)) }
    },
    writable: true,
    configurable: true,
    enumerable: false
  })
}

const compose = (f,g) => x => f(g(x))
const map = (f) => (v) => v.map(f)
const id = x => x

const Free = daggy.taggedSum({
  Pure: ['x'],
  Lift: ['x', 'f'],
  Ap:   ['x', 'f'],
  Join: ['x'],
})

Free.Pure.toString = () => 'Free.Pure'
Free.Ap.toString = () => 'Free.Ap'
Free.Lift.toString = () => 'Free.Lift'
Free.Join.toString = () => 'Free.Join'
Free.prototype.toString = function() {
  return this.cata({
    Pure: (a)    => `Pure(${a})`,
    Lift: (x, g) => `Lift(${x},${g})`,
    Ap:   (x, g) => `Ap(${x},${g})`,
    Join: (x)    => `Join(${x})`,
  })
}

Free.of = Free.Pure
Free.liftF = command => Free.Lift(command, id)

Free.prototype.map = function(f) {
  return this.cata({
    Pure: (x)    => Free.Pure(f(x)),
    Lift: (x, g) => Free.Lift(x, compose(f,g)),
    Ap:   (x, y) => Free.Ap(x, y.map(map(f))),
    Join: (x)    => Free.Join(x.map(map(f))),
  })
}

Free.prototype.ap = function(y) {
  return this.cata({
    Pure: (f) => y.map(f),
    Ap:   ()  => Free.Ap(y, this),
    Lift: ()  => Free.Ap(y, this),
    Join: ()  => Free.Ap(y, this),
  })
}

Free.prototype.chain = function(f) {
  return this.cata({
    Pure: (x) => f(x),
    Ap:   ()  => Free.Join(this.map(f)),
    Lift: ()  => Free.Join(this.map(f)),
    Join: ()  => Free.Join(this.map(f)),
  })
}

const hoist = (f) => (a) => a.hoist(f)
Free.prototype.hoist = function(f) {
  return this.cata({
    Pure: (x)    => Free.Pure(x),
    Lift: (x, g) => Free.Lift(f(x), g),
    Ap:   (x, g) => Free.Ap(x.hoist(f), g.hoist(f)),
    Join: (x)  => Free.Join(x.map(hoist(f)).hoist(f)),
  })
}


const retract = (of) => (a) => a.retract(of)
const join = (a) => a.chain(id)
Free.prototype.retract = function(of) {
  return this.cata({
    Pure: (x)    => of(x),
    Lift: (x, g) => x.map(g),
    Ap:   (x, y) => y.retract(of).ap(x.retract(of)),
    Join: (x)  => compose(join, retract(of))(x.map(retract(of)))
  })
}

Free.prototype.foldMap = function(interpreter, of) {
  return this.hoist(interpreter).retract(of)
}

module.exports = Free
