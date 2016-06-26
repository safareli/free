const Identity = require('fantasy-identities')
const test = require('tape');
const Free = require('./free.js')


test('hoist', t => {
  const tree = Free.liftF(1).chain(
    a => Free.liftF(2).chain(
      b => Free.of([a, b])
    )
  )

  t.deepEqual(
    tree.hoist((a) => a + 2).foldMap((a) => Identity(a), Identity).x,
    [3,4],
    'should add 2 to all instructions in Free'
  )
  t.end()
})


test('graft', t => {
  // not the best test but at least it tests
  const io = {
    read: (path) => Free.liftF({ type: 'read', path }),
    move: (from, to) => Free.liftF({ type: 'move', from, to }),
    del: (path) => Free.liftF({ type: 'del', path }),
    write: (text, path) => Free.liftF({ type: 'write', path, text }),
  }

  var memFS = {
    '1.txt': '[1.content.1]',
    '2.txt': '[2.content.2]',
    '3.txt': '[3.content.3]',
    '4.txt': '[4.content.4]',
  };

  const tree = (
    io.read('1.txt').chain(text1 =>
    io.read('2.txt').chain(text2 =>
    io.write(text1 + text2, '1-2.txt'))).chain(() =>
    io.move('1-2.txt', 'mv-1-2.txt')
    )
  )

  const tree2 = (
    io.read('3.txt').chain(text3 =>
    io.read('4.txt').chain(text4 =>
    io.write(text3 + text4, '3-4.txt')))
  )

  const tree3 = (
    io.read('3-4.txt').chain(text34 =>
    io.read('1.txt').chain(text1 =>
    io.write(text34 + text1, '3-4-1.txt')))
  )

  var counter = 0
  const ioToIdentity = (a) => {
    if(a.type == 'read'){
      return Identity(memFS[a.path]);
    } else if(a.type == 'write') {
      memFS[a.path] = `{${a.text}:${counter}}`;
      counter++;
      return Identity(null);
    } else if(a.type == 'del') {
      delete memFS[a.path];
      return Identity(null);
    }
    // we have not implemented `move`
  }

  tree.graft((a) => {
    // we graft alternative free structure which
    // dosn't uses move but still moves file
    if (a.type == 'move') {
        return io.read(a.from).chain((fromtxt) =>
          io.write(fromtxt, a.to).chain(()=>
          io.del(a.from)));
    // graft some more trees
    } if (a.type == 'read' && a.path =='2.txt') {
        return Free.liftF(a).chain((r) => tree3.chain(() => Free.of(r)));
    } else if (a.type == 'read' && a.path =='1.txt') {
        return tree2.chain((tree2)=> Free.liftF(a));
    } else {
      return Free.liftF(a);
    }
  }).foldMap(ioToIdentity, Identity)

  t.deepEqual(memFS, {
    '1.txt': '[1.content.1]',
    '2.txt': '[2.content.2]',
    '3.txt': '[3.content.3]',
    '4.txt': '[4.content.4]',
    '3-4.txt': '{[3.content.3][4.content.4]:0}',
    '3-4-1.txt': '{{[3.content.3][4.content.4]:0}[1.content.1]:1}',
    'mv-1-2.txt': '{{[1.content.1][2.content.2]:2}:3}',
  }, 'should graft other trees')
  t.end()
})
