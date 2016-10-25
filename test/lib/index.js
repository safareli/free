const Ɐ = require('jsverify')
const { of, map, ap, chain, lift2, lift3 } = require('sanctuary-type-classes')
const Free = require('../../src/free.js')
const patchAll = require('../../src/fl-patch.js')
const fl = require('fantasy-land')
const { Future, Identity } = require('ramda-fantasy')

// make Future and Identity compatible with FL@1.0.x
patchAll([
  Future, Future.prototype,
  Identity, Identity.prototype]
)
var fixedAp = function(f) { return f.ap(this) }
Future.prototype[fl.ap] = fixedAp
Identity.prototype[fl.ap] = fixedAp

Ɐ.any = Ɐ.oneof(Ɐ.falsy, Ɐ.json)

module.exports = {
  Free,
  Future,
  Identity,
  of,
  map,
  ap,
  chain,
  lift2,
  lift3,
}
