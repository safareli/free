const Ɐ = require('jsverify')
const Free = require('../../src/free.js')
Ɐ.any = Ɐ.oneof(Ɐ.falsy, Ɐ.json)

module.exports = {
  Free,
}
