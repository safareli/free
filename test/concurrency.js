const { test } = require('tap')
const {
  Concurrent,
  Identity, Future, FutureAp,
  ap, lift2, lift3,
} = require('./lib')

const fromPar = Concurrent.fromPar
const fromSeq = Concurrent.fromSeq

const delay = (val, ms) => (rej, res) => setTimeout(res, ms, val)
const shoutSeq = (tag, ms) => Concurrent.lift({tag: `${tag}.${ms}`, ms})
const shout = (tag, ms) => Concurrent.lift({tag: `${tag}.${ms}`, ms}).par()
const pear3 = x => y => z => [x, y, z]

const futureEq = (t, expectedDuration, expectedResult, val) => {
  const interpreter = {
    runSeq: ({tag, ms}) => Future(delay(tag, ms)),
    runPar: ({tag, ms}) => FutureAp(delay(tag, ms)),
    seqToPar: a => a.par(),
    parToSeq: a => a.seq(),
    Seq: Future,
    Par: FutureAp,
  }

  const now = new Date().getTime()

  t.same(val.fold(({tag, ms}) => Identity(tag), Identity), Identity(expectedResult), `result is correct using Identity (${expectedResult})`)
  val.interpret(interpreter).fork(t.fail, a => {
    const end = new Date().getTime()
    const duration = end - now
    t.same(a, expectedResult, `result is correct (${expectedResult})`)
    t.eqWithAccuracy(duration, expectedDuration, 40, `computation takes expected duration (${expectedDuration})`)
  })
}

test('triangle', (t) => {
  const cases = [
    {
      result: 'a.100.200',
      duration: 300,
      fragment: shoutSeq('a', 100).chain(a => shoutSeq(a, 200)),
    },
    {
      result: 'a.100',
      duration: 100,
      fragment: shoutSeq('a', 100),
    },
    {
      result: 'a.100a.200a.100a.200.50',
      duration: 250,
      fragment:
        fromPar(
          lift2(a => b => a + b, shout('a', 100), shout('a', 200))
        ).chain(v => shoutSeq(v + v, 50)),
    },
    {
      result: 'a.100a.200a.100',
      duration: 200,
      fragment: fromPar(lift2(a => b => a + b, lift2(a => b => a + b, shout('a', 100), shout('a', 200)), shout('a', 100))),
    },
    {
      result: 'a.100b.200c.100',
      duration: 200,
      fragment: fromPar(lift2(a => b => a + b, lift2(a => b => a + b, shout('a', 100), shout('b', 200)), shout('c', 100))),
    },
    {
      result: 'a.100a.200a.100a.200.50',
      duration: 250,
      fragment: fromPar(lift2(a => b => a + b, shout('a', 100), shout('a', 200))).chain(v => shoutSeq(v + v, 50)),
    },
    {
      result: 'a.100.200b.100',
      duration: 300,
      fragment: fromPar(lift2(a => b => a + b, shoutSeq('a', 100).chain(a => shoutSeq(a, 200)).par(), shout('b', 100))),
    },
  ]

  t.plan(cases.length * 3)
  cases.forEach(({ result, duration, fragment }) => {
    futureEq(t, duration, result, fragment)
  })
})

test('moving with par/seq/fromPar/fromSeq produces same result', (t) => {
  const run = (n, v) => t.same(v.fold(Identity, Identity), Identity(n), v.toString())

  run(1, fromSeq(fromPar(Concurrent.of(1).par()).seq()))
  run(2, fromPar(fromSeq(Concurrent.of(2).seq()).par()))
  run(3, fromPar(fromPar(Concurrent.of(3).par()).par()))
  run(4, fromSeq(fromSeq(Concurrent.of(4).seq()).seq()))

  t.end()
})

test('Future and FutureAp', (t) => {
  t.plan(4)

  const timetest = (t, expectedDuration, name, val) => {
    const now = new Date().getTime()
    val.fork(t.fail, a => {
      const end = new Date().getTime()
      const duration = end - now
      t.eqWithAccuracy(duration, expectedDuration, 15, `computation takes expected duration (${expectedDuration})`)
    })
  }

  timetest(t, 200, 'Future', lift2(a => b => a + b, Future(delay(1, 100)), Future(delay(1, 100))))
  timetest(t, 100, 'FutureAp', lift2(a => b => a + b, FutureAp(delay(1, 100)), FutureAp(delay(1, 100))))
  timetest(t, 100, 'Future.par()', lift2(a => b => a + b, Future(delay(1, 100)).par(), Future(delay(1, 100)).par()))
  timetest(t, 200, 'FutureAp.seq()', lift2(a => b => a + b, FutureAp(delay(1, 100)).seq(), FutureAp(delay(1, 100)).seq()))
})

test('Check for concurrency', (t) => {
  let orders = { start: [], end: [] }
  let tre = fromPar(ap(
    fromPar(lift3(
      pear3,
      shout('out.ap', 500),
      shout('out.ap', 400),
      fromPar(lift3(
        pear3,
        shout('out.ap', 100),
        shout('out.ap', 300),
        shout('out.ap', 200)
      )).chain((tout) =>
        fromPar(lift3(pear3,
          shout('in.ap', 50),
          shout('in.ap', 250),
          shout('in.ap', 150)
        ).map((tin) => [tout, tin]))
      ).par()
    )).chain((tout) =>
      fromPar(lift2(pear3,
        shout('in.ap', 40),
        shout('in.ap', 140)
      ).map((f) => (a) => [tout, f(a)]))
    ).par(),
    shout('out.ap', 10).ap(Concurrent.of((a) => a).par())
  ))

  const actionToComp = ({tag, ms}) => {
    return (rej, res) => {
      orders.start.push(tag)
      setTimeout(() => {
        orders.end.push(tag)
        res(tag)
      }, ms)
    }
  }

  const interpreter = {
    runSeq: (inst) => Future(actionToComp(inst)),
    runPar: (inst) => FutureAp(actionToComp(inst)),
    seqToPar: a => a.par(),
    parToSeq: a => a.seq(),
    Seq: Future,
    Par: FutureAp,
  }

  tre.interpret(interpreter)
    .fork(t.fail, (result) => {
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
