const equals = require('ramda/src/equals')
const { Test } = require('tap')
const Ɐ = require('jsverify')
const { of, map, ap, chain, lift2, lift3 } = require('sanctuary-type-classes')
const {
  Concurrent,
  Par,
  Seq,
} = require('../../src/')
const { id, compose, union } = require('../../src/utils.js')
const patch = require('../../src/fl-patch.js')
const fl = require('fantasy-land')
const { Future, Identity } = require('ramda-fantasy')

// make Future and Identity compatible with FL@1.0.x
;[
  Future, Future.prototype,
  FutureAp, FutureAp.prototype,
  Identity, Identity.prototype,
].map(patch.mutate)

var fixedAp = function(m) { return m[fl.chain](f => this[fl.map](f)) }
Future.prototype[fl.ap] = fixedAp
function FutureAp(f) {
  if (!(this instanceof FutureAp)) {
    return new FutureAp(f)
  }
  this._fork = f
}
FutureAp.prototype.fork = function(reject, resolve) {
  this._fork(reject, resolve)
}

FutureAp.of = FutureAp[fl.of] = function(v) {
  return FutureAp((rej, res) => res(v))
}
FutureAp.prototype.map = FutureAp.prototype[fl.map] = function(f) {
  return this[fl.ap](FutureAp[fl.of](f))
}

FutureAp.prototype.ap = FutureAp.prototype[fl.ap] = function(f) {
  return Future.prototype.ap.call(f.seq(), this.seq()).par()
}

FutureAp.prototype.seq = function() {
  return Future((rej, res) => this.fork(rej, res))
}

Future.prototype.par = function() {
  return FutureAp((rej, res) => this.fork(rej, res))
}

Identity.prototype[fl.ap] = fixedAp

Ɐ.any = Ɐ.oneof(Ɐ.falsy, Ɐ.json)

Test.prototype.addAssert('eqWithAccuracy', 3, function(val, expectedVal, valError, m, e) {
  m = m || 'should equal'
  if (expectedVal - valError < val && val < expectedVal + valError) {
    return this.pass(m, e)
  }
  e.found = val.toString()
  e.wanted = expectedVal.toString()
  e.compare = 'fantasy-land/equals'
  return this.fail(m, e)
})

function computeCallStack() {
  try {
    return 1 + computeCallStack()
  } catch (_) {
    return 1
  }
}

const MAX_STACK = computeCallStack()

module.exports = {
  Future,
  FutureAp,
  Identity,
  of,
  map,
  ap,
  chain,
  lift2,
  lift3,
  id,
  compose,
  Concurrent,
  Par,
  Seq,
  equals,
  MAX_STACK,
  union,
}
