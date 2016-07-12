const Ɐ = require('jsverify')
const Free = require('../../src/free.js')
Ɐ.any = Ɐ.oneof(Ɐ.number, Ɐ.falsy, Ɐ.bool, Ɐ.json)

module.exports = {
  Free,
}
