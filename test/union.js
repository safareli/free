const { toString } = require('sanctuary-type-classes')
const { test } = require('tap')
const { union } = require('./lib')

const List = union('List', {
  Cons: ['x', 'xs'],
  Nil: [],
})

List.prototype.foo = 'foo'

const a = 'a'

test('misc', (t) => {
  const list = List.Cons(a, List.Nil)

  t.throws(() => { list.cata({ Cons: (a, b) => a }) }, 'throws if all cases are not handled')
  t.throws(() => { List.Cons(1) }, 'when creating a tagged type with to many arguments throws error')
  t.throws(() => { List.Cons(1, 1, 1) }, 'when creating a tagged type with to many arguments throws error')
  t.same(list.toString(), `List.Cons(${toString(a)}, List.Nil())`, 'toString on value should return correct value')
  t.same(list.x, a, 'when checking head value should return correct value')
  t.same(list.xs, List.Nil, 'when checking value value should return correct value')
  t.same(list.cata({
    Cons: (x, xs) => [x, xs],
    Nil: () => [],
  }), [list.x, list.xs], 'cata should work on Cons')
  t.ok(List.Nil.cata({
    Cons: () => false,
    Nil: () => true,
  }), 'cata should work on Nil')
  t.same(List.prototype.foo, list.foo, 'values in typerep.prototype are accassible from instance values')
  t.same(List.prototype.foo, List.Nil.foo, 'values in typerep.prototype are accassible from instance values')
  t.end()
})
