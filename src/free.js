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

function Join(x) {
  if (!(this instanceof Join)) {
    return new Join(x)
  }
  this.x = x
}
Join.prototype = Object.create(Free.prototype)
Join.prototype.constructor = Join
Join.prototype.cata = function(d) { return d.Join(this.x) }

Free.Pure = Pure
Free.Ap = Ap
Free.Lift = Lift
Free.Join = Join

/* istanbul ignore else */
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

/* istanbul ignore next */
Free.Pure.toString = () => 'Free.Pure'
/* istanbul ignore next */
Free.Ap.toString = () => 'Free.Ap'
/* istanbul ignore next */
Free.Lift.toString = () => 'Free.Lift'
Free.Join.toString = () => 'Free.Join'
/* istanbul ignore next */
/* istanbul ignore next */
Free.prototype.toString = function() {
  return this.cata({
    Pure: (x) => `Free.Pure(${x})`,
    Lift: (x, f) => `Free.Lift(${x},=>)`,
    Ap: (x, y) => `Free.Ap(${x},${y})`,
    Join: (x) => `Free.Join(${x})`,
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
