const Ɐ = require('jsverify')
const Free = require('../../src/free.js')
const { Future, Identity } = require('ramda-fantasy')

Ɐ.any = Ɐ.oneof(Ɐ.falsy, Ɐ.json)

module.exports = {
  Free,
  Future,
  Identity,
}
