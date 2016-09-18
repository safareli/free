const { test } = require('tap')
const { Free, Future } = require('./lib')

test('Check for concurrency', (t) => {
  const shout = (tag, ms) => Free.liftF({tag: `${tag}.${ms}`, ms})
  const pear3 = x => y => z => [x, y, z]
  let orders = { start: [], end: [] }
  Free.of(pear3)
    .ap(shout('out.ap', 500))
    .ap(shout('out.ap', 400))
    .ap(
      Free.of(pear3)
        .ap(shout('out.ap', 100))
        .ap(shout('out.ap', 300))
        .ap(shout('out.ap', 200))
        .chain((tout) => {
          return Free.of(pear3)
            .ap(shout('in.ap', 50))
            .ap(shout('in.ap', 250))
            .ap(shout('in.ap', 150))
            .map((tin) => [tout, tin])
        })
    ).chain((tout) => Free.of(pear3)
      .ap(shout('in.ap', 40))
      .ap(shout('in.ap', 140))
      .map((f) => (a) => [tout, f(a)])
    )
    .ap(shout('out.ap', 10))

    .foldMap(({tag, ms}) => Future((rej, res) => {
      orders.start.push(tag)
      setTimeout(() => {
        orders.end.push(tag)
        res(tag)
      }, ms)
    }), Future)
    .fork(() => {}, (result) => {
      t.same(orders, {
        end: [
          'out.ap.10',
          'out.ap.100',
          'out.ap.200',
          'out.ap.300',
          'in.ap.50',
          'out.ap.400',
          'in.ap.150',
          'out.ap.500',
          'in.ap.250',
          'in.ap.40',
          'in.ap.140',
        ],
        start: [
          'out.ap.500',
          'out.ap.400',
          'out.ap.100',
          'out.ap.300',
          'out.ap.200',
          'out.ap.10',
          'in.ap.50',
          'in.ap.250',
          'in.ap.150',
          'in.ap.40',
          'in.ap.140',
        ],
      }, 'start and end order to be preserved')

      t.same(result, [
        ['out.ap.500', 'out.ap.400', [
          ['out.ap.100', 'out.ap.300', 'out.ap.200'],
          ['in.ap.50', 'in.ap.250', 'in.ap.150'],
        ]],
        ['in.ap.40', 'in.ap.140', 'out.ap.10'],
      ], 'result should be correct')
      t.end()
    })
})
