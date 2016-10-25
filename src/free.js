const { of, map, ap, chain } = require('sanctuary-type-classes')
const patchAll = require('./fl-patch')

// data Free i a
//   = Ap { x: (Free i b), y: (Free i (b -> a)) }
//   | Pure { x: a }
//   | Lift { x: i, f: (b -> a) }
//   | Chain { x: (Free i b), f: (b -> (Free i a)) }
function Free() {
  throw new TypeError('No direct use of Free constructor is Allowed')
}

function Pure(x) {
  if (!(this instanceof Pure)) {
    return new Pure(x)
  }
  this.x = x
}
Pure.prototype = Object.create(Free.prototype)
Pure.prototype.constructor = Pure
Pure.prototype.cata = function(d) { return d.Pure(this.x) }

function Lift(x, f) {
  if (!(this instanceof Lift)) {
    return new Lift(x, f)
  }
  this.x = x
  this.f = f
}
Lift.prototype = Object.create(Free.prototype)
Lift.prototype.constructor = Lift
Lift.prototype.cata = function(d) { return d.Lift(this.x, this.f) }

function Ap(x, y) {
  if (!(this instanceof Ap)) {
    return new Ap(x, y)
  }
  this.x = x
  this.y = y
}
Ap.prototype = Object.create(Free.prototype)
Ap.prototype.constructor = Ap
Ap.prototype.cata = function(d) { return d.Ap(this.x, this.y) }

function Chain(x, f) {
  if (!(this instanceof Chain)) {
    return new Chain(x, f)
  }
  this.x = x
  this.f = f
}

Chain.prototype = Object.create(Free.prototype)
Chain.prototype.constructor = Chain
Chain.prototype.cata = function(d) { return d.Chain(this.x, this.f) }

Free.Pure = Pure
Free.Ap = Ap
Free.Lift = Lift
Free.Chain = Chain

const compose = (f, g) => (x) => f(g(x))
const id = x => x

/* istanbul ignore next */
Free.Pure.toString = () => 'Free.Pure'
/* istanbul ignore next */
Free.Ap.toString = () => 'Free.Ap'
/* istanbul ignore next */
Free.Lift.toString = () => 'Free.Lift'
/* istanbul ignore next */
Free.Chain.toString = () => 'Free.Chain'
/* istanbul ignore next */
Free.prototype.toString = function() {
  return this.cata({
    Pure: (x) => `Free.Pure(${x})`,
    Lift: (x, f) => `Free.Lift(${x},=>)`,
    Ap: (x, y) => `Free.Ap(${x},${y})`,
    Chain: (x, f) => `Free.Chain(${x},=>)`,
  })
}

Free.of = Free.Pure
Free.liftF = command => Free.Lift(command, id)

Free.prototype.map = function(f) {
  return this.cata({
    Pure: (x) => Free.Pure(f(x)),
    Lift: (x, g) => Free.Lift(x, compose(f, g)),
    Ap: (x, y) => Free.Ap(x, map((a) => map(f, a), y)),
    Chain: (x, g) => Free.Chain(x, (a) => map(f, g(a))),
  })
}

Free.prototype.ap = function(y) {
  return this.cata({
    Pure: (x) => map((f) => f(x), y),
    Ap: () => Free.Ap(this, y),
    Lift: () => Free.Ap(this, y),
    Chain: () => Free.Ap(this, y),
  })
}

Free.prototype.chain = function(f) {
  return this.cata({
    Pure: (x) => f(x),
    Ap: () => Free.Chain(this, f),
    Lift: () => Free.Chain(this, f),
    Chain: (x, g) => Free.Chain(x, (v) => chain(f, g(v))),
  })
}

Free.prototype.hoist = function(f) {
  return this.foldMap(compose(Free.liftF, f), Free)
}

Free.prototype.retract = function(m) {
  return this.foldMap(id, m)
}

Free.prototype.foldMap = function(f, m) {
  return m.chainRec((next, done, v) => v.cata({
    Pure: (x) => map(done, of(m, x)),
    Lift: (x, g) => map(compose(done, g), f(x)),
    Ap: (x, y) => map(done, ap(y.foldMap(f, m), x.foldMap(f, m))),
    Chain: (x, g) => map(compose(next, g), x.foldMap(f, m)),
  }), this)
}

Free.prototype.graft = function(f) {
  return this.foldMap(f, Free)
}

const chainRecNext = (value) => ({ done: false, value })
const chainRecDone = (value) => ({ done: true, value })

Free.chainRec = (f, i) => chain(
  ({ done, value }) => done ? Free.of(value) : Free.chainRec(f, value),
  f(chainRecNext, chainRecDone, i)
)

patchAll([Free, Free.prototype])

module.exports = Free
