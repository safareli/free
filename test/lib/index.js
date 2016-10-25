const Ɐ = require('jsverify')
const { of, map, ap, chain } = require('sanctuary-type-classes')
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
  // TODO remove when after https://github.com/sanctuary-js/sanctuary-type-classes/pull/5 is merged
  lift2: (f, x, y) => ap(map(f, x), y),
  lift3: (f, x, y, z) => ap(ap(map(f, x), y), z),
}
