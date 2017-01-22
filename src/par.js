const { of, ap } = require('sanctuary-type-classes')
const patch = require('./fl-patch')
const { id, compose, union } = require('./utils')

// data Par f a where
//  Pure :: a -> Par f a
//  Lift :: f a -> Par f a
//  Ap :: Par f (a -> b) -> Par f a -> Par f b
const Par = union('Par', {
  Pure: ['x'],
  Lift: ['i'],
  Ap: ['f', 'x'],
})
const { Pure, Lift, Ap } = Par

Object.assign(Par, patch({
  // :: a -> Par f a
  of: Pure,
  // :: f a -> Par f a
  lift: Lift,
}))

Object.assign(Par.prototype, patch({
  // :: Par f a ~> (a -> b) -> Par f b
  map(f) {
    return ap(Par.of(f), this)
  },
  // :: Par f a ~> Par f (a -> b) -> Par f b
  ap(that) {
    return Ap(that, this)
  },
  // :: (Applicative g) => Par f a ~> (Ɐ x. f x -> g x, TypeRep g) -> g a
  foldPar(f, T) {
    const argsF = [this]
    const fns = []
    while (true) {
      let argF = argsF.pop()

      if (Ap.is(argF)) {
        const lengthInitial = argsF.length
        while (Ap.is(argF)) {
          argsF.push(argF.x)
          argF = argF.f
        }
        fns.push(Fn(foldArg(argF, f, T), argsF.length - lengthInitial))
        continue
      }

      const argT = foldArg(argF, f, T)
      if (fns.length === 0) {
        return argT
      }
      let fn = fns.pop()
      let res = ap(fn.f, argT)

      if (fn.length > 1) {
        fns.push(Fn(res, fn.length - 1))
        continue
      }

      while (fns.length > 0) {
        fn = fns.pop()
        res = ap(fn.f, res)
        if (fn.length > 1) {
          fns.push(Fn(res, fn.length - 1))
          break
        }
      }

      if (fns.length === 0) {
        return res
      }
    }
  },
  // :: Par f a ~> (Ɐ x. f x -> g x) -> Par g a
  hoistPar(f) {
    return this.foldPar(compose(Par.lift)(f), Par)
  },
  // :: (Applicative f) => Par f a ~> TypeRep f -> f a
  retractPar(m) {
    return this.foldPar(id, m)
  },
  // :: Par f a ~> (Ɐ x. f x -> Par g x) -> Par g a
  graftPar(f) {
    return this.foldPar(f, Par)
  },
}))

// Internal helper function for foldPar it folds only Pure and Lift nodes
const foldArg = (node, f, T) => {
  if (Pure.is(node)) {
    return of(T, node.x)
  } else if (Lift.is(node)) {
    return f(node.i)
  }
}

// Internal helper structure for foldPar it conatins an Applicative containing
// a function and information on how many argument it needs
// type Fn g a b = { fun:: g (a -> b), length:: Number}
const Fn = (f, length) => ({ f, length })

module.exports = Par
