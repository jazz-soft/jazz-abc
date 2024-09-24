const assert = require('assert');
const { Parser } = require('..');

function equal(a, b) {
  var k;
  if (Array.isArray(a)) {
    assert.equal(Array.isArray(b), true);
    assert.equal(a.length, b.length);
    for (k = 0; k < a.length; k++) equal(a[k], b[k]);
  }
  else if (typeof a == 'object') {
    assert.equal(typeof b, 'object');
    assert.equal(Object.keys(a).length, Object.keys(b).length);
    for (k of Object.keys(a)) equal(a[k], b[k]);
  }
  else assert.equal(a, b);
}

describe('tokenize', function() {
  it('comment', function() {
    var P = new Parser('N: \nN:ab \nN: ac \\% c\nN: ac \\\\% c \nabc\nB: %\nB:\\% \\%%\n');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'N:', h: 'N:', x: 'N:' } ],
      [ { l: 1, c: 0, t: 'N:', h: 'N:', x: 'N:' }, { l: 1, c: 2, x: 'ab' } ],
      [ { l: 2, c: 0, t: 'N:', h: 'N:', x: 'N:' }, { l: 2, c: 3, x: 'ac \\% c' } ],
      [ { l: 3, c: 0, t: 'N:', h: 'N:', x: 'N:' }, { l: 3, c: 3, x: 'ac \\\\' }, { l: 3, c: 8, t: '%', x: '% c' } ],
      [ { l: 4, c: 0, t: '??', x: 'abc' } ],
      [ { l: 5, c: 0, t: 'B:', h: 'B:', x: 'B:' }, { l: 5, c: 3, t: '%', x: '%' } ],
      [ { l: 6, c: 0, t: 'B:', h: 'B:', x: 'B:' }, { l: 6, c: 2, x: '\\% \\%' }, { l: 6, c: 7, t: '%', x: '%' } ],
      [ ]
    ]);
  });
  it('pseudocomment', function() {
    var P = new Parser('%abc\n %abc\n%abc-2.1\n%abc %abc\n%abc-2.1%abc\n%%endtext %');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: '%:', h: '%:', x: '%abc' } ],
      [ { l: 1, c: 1, t: '%', x: '%abc' } ],
      [ { l: 2, c: 0, t: '%:', h: '%:', x: '%abc' }, { l: 2, c: 4, x: '-2.1' } ],
      [ { l: 3, c: 0, t: '%:', h: '%:', x: '%abc' }, { l: 3, c: 5, t: '%', x: '%abc' } ],
      [ { l: 4, c: 0, t: '%:', h: '%:', x: '%abc' }, { l: 4, c: 4, x: '-2.1' }, { l: 4, c: 8, t: '%', x: '%abc' } ],
      [ { l: 5, c: 0, t: '%%', h: '%%endtext', x: '%%endtext' }, { l: 5, c: 10, t: '%', x: '%' } ]
    ]);
  });
});

describe('macro', function() {
  it('U: ...', function() {
    var P = new Parser("U:~=!none! ... \n");
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, t: 'Ur', x: '!none! ...' }
    ], []]);
    P = new Parser("U: \n+:H \n+: = \n+: !none! ... \n");
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' } ],
      [ { l: 1, c: 0, t: '+:', h: 'U:', x: '+:' }, { l: 1, c: 2, t: 'Ul', x: 'H' } ],
      [ { l: 2, c: 0, t: '+:', h: 'U:', x: '+:' }, { l: 2, c: 3, t: '=', x: '=' } ],
      [ { l: 3, c: 0, t: '+:', h: 'U:', x: '+:' }, { l: 3, c: 3, t: 'Ur', x: '!none! ...' } ], []
    ]);
    P = new Parser("U: = !none!\n");
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 3, x: '=', e: 'unexpected token' },
      { l: 0, c: 5, x: '!none!' }
    ], []]);
    P = new Parser("U:!none!\n");
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' }, { l: 0, c: 2, x: '!none!', e: 'unexpected token' }
    ], []]);
  });
  it('m: ...', function() {
    var P = new Parser("m:~G2=G2\n");
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'm:', h: 'm:', x: 'm:' },
      { l: 0, c: 2, t: 'ml', x: '~G2' },
      { l: 0, c: 5, t: '=', x: '=' },
      { l: 0, c: 6, t: 'mr', x: 'G2' }
    ], []]);
    P = new Parser("m:=G2\n");
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'm:', h: 'm:', x: 'm:' },
      { l: 0, c: 2, x: '=G2', e: 'unexpected token' }
    ], []]);
  });
});

describe('key', function() {
  it('K: ...', function() {
    var P = new Parser('K: % no key\n');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'K:', h: 'K:', x: 'K:', e: 'expected: key' },
      { l: 0, c: 3, t: '%', x: '% no key' }
    ], []]);
    P = new Parser('K: no key\n');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'K:', h: 'K:', x: 'K:' },
      { l: 0, c: 3, x: 'no', e: 'expected: key' },
      { l: 0, c: 6, x: 'key' }
    ], []]);
    P = new Parser('K: Ab err\n');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'K:', h: 'K:', x: 'K:' },
      { l: 0, c: 3, t: 'Kt', x: 'Ab' },
      { l: 0, c: 6, x: 'err', e: 'unexpected token' }
    ], []]);
    P = new Parser('K: Cb majOr ^d ... % ...\n');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'K:', h: 'K:', x: 'K:' },
      { l: 0, c: 3, t: 'Kt', x: 'Cb' },
      { l: 0, c: 6, t: 'Km', x: 'majOr' },
      { l: 0, c: 12, t: 'Ka', x: '^d' },
      { l: 0, c: 15, x: '...', e: 'unexpected token' },
      { l: 0, c: 19, t: '%', x: '% ...' }
    ], []]);
    P = new Parser('K:\n+:Cb\n+:^d\n');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'K:', h: 'K:', x: 'K:' } ],
      [ { l: 1, c: 0, t: '+:', h: 'K:', x: '+:' }, { l: 1, c: 2, t: 'Kt', x: 'Cb' } ],
      [ { l: 2, c: 0, t: '+:', h: 'K:', x: '+:' }, { l: 2, c: 2, t: 'Ka', x: '^d' } ], []
    ]);
  });
  it('C', function() {
    var k = new Parser.Key();
    equal(k.scale, { c: 3, d: 5, e: 7, f: 8, g: 10, a: 12, b: 14 });
  });
  it('D', function() {
    var k = new Parser.Key(2);
    equal(k.scale, { c: 4, d: 5, e: 7, f: 9, g: 10, a: 12, b: 14 });
  });
  it('F', function() {
    var k = new Parser.Key(-1);
    equal(k.scale, { c: 3, d: 5, e: 7, f: 8, g: 10, a: 12, b: 13 });
  });
  it('G', function() {
    var k = new Parser.Key(1);
    equal(k.scale, { c: 3, d: 5, e: 7, f: 9, g: 10, a: 12, b: 14 });
  });
  it('Bb', function() {
    var k = new Parser.Key(-2);
    equal(k.scale, { c: 3, d: 5, e: 6, f: 8, g: 10, a: 12, b: 13 });
  });
});

describe('midi', function() {
  it('m2n', function() {
    assert.equal(Parser.m2n(25), "^C,,,");
    assert.equal(Parser.m2n(37), "^C,,");
    assert.equal(Parser.m2n(49), "^C,");
    assert.equal(Parser.m2n(61), "^C");
    assert.equal(Parser.m2n(73), "^c");
    assert.equal(Parser.m2n(85), "^c'");
    assert.equal(Parser.m2n(97), "^c''");
    assert.equal(Parser.m2n(109), "^c'''");
  });
  it('n2m', function() {
    assert.equal(Parser.n2m("C,,,,,,"), undefined);
    assert.equal(Parser.n2m("_C,,,,,"), undefined);
    assert.equal(Parser.n2m("C,,,,,"), 0);
    assert.equal(Parser.n2m("C"), 60);
    assert.equal(Parser.n2m("^C"), 61);
    assert.equal(Parser.n2m("c"), 72);
    assert.equal(Parser.n2m("c''''"), 120);
    assert.equal(Parser.n2m("g''''"), 127);
    assert.equal(Parser.n2m("^g''''"), undefined);
  });
  it('m2n/n2m', function() {
    var m, k;
    for (m = 0; m < 128; m++) assert.equal(m, Parser.n2m(Parser.m2n(m)));
    k = new Parser.Key(2);
    for (m = 0; m < 128; m++) assert.equal(m, Parser.n2m(Parser.m2n(m, k), k));
    k = new Parser.Key(7);
    for (m = 0; m < 128; m++) assert.equal(m, Parser.n2m(Parser.m2n(m, k), k));
    k = new Parser.Key(-2);
    for (m = 0; m < 128; m++) assert.equal(m, Parser.n2m(Parser.m2n(m, k), k));
    k = new Parser.Key(-7);
    for (m = 0; m < 128; m++) assert.equal(m, Parser.n2m(Parser.m2n(m, k), k));
  });
});
