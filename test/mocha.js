﻿const assert = require('assert');
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
    for (k of Object.keys(a)) if (k != '#') equal(a[k], b[k]);
  }
  else assert.equal(a, b);
}

describe('tokenize', function() {
  it('%abc', function() {
    var P = new Parser('%abc-2.2 %etc\n%abcd\n%abc');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: '%:', h: '%:', x: '%abc' }, { l: 0, c: 4, x: '-2.2' }, { l: 0, c: 9, t: '%', x: '%etc' } ],
      [ { l: 1, c: 0, t: '%', x: '%abcd' } ],
      [ { l: 2, c: 0, t: '%', x: '%abc' } ]
    ]);
    P = new Parser(' %abc\n%abc');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 1, t: '%', x: '%abc' } ],
      [ { l: 1, c: 0, t: '%:', h: '%:', x: '%abc', e: 'must be the first line' } ],
    ]);
  });
  it('free text', function() {
    var P = new Parser('%abc\na %warn\nno %warn');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: '%:', h: '%:', x: '%abc' } ],
      [ { l: 1, c: 0, t: '??', x: 'a', e: 'missing empty line' }, { l: 1, c: 2, t: '??', x: '%warn' } ],
      [ { l: 2, c: 0, t: '??', x: 'no %warn' } ]
    ]);
    P = new Parser('%abc\n\nno %warn');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: '%:', h: '%:', x: '%abc' } ], [],
      [ { l: 2, c: 0, t: '??', x: 'no %warn' } ]
    ]);
  });
  it('comment', function() {
    var P = new Parser('N: \nN:ab \nN: ac \\% c\nN: ac \\\\% c \nabc\nB: %\nB:\\% \\%%');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'N:', h: 'N:', x: 'N:' } ],
      [ { l: 1, c: 0, t: 'N:', h: 'N:', x: 'N:' }, { l: 1, c: 2, x: 'ab' } ],
      [ { l: 2, c: 0, t: 'N:', h: 'N:', x: 'N:' }, { l: 2, c: 3, x: 'ac \\% c' } ],
      [ { l: 3, c: 0, t: 'N:', h: 'N:', x: 'N:' }, { l: 3, c: 3, x: 'ac \\\\' }, { l: 3, c: 8, t: '%', x: '% c' } ],
      [ { l: 4, c: 0, t: '??', x: 'abc' } ],
      [ { l: 5, c: 0, t: 'B:', h: 'B:', x: 'B:' }, { l: 5, c: 3, t: '%', x: '%' } ],
      [ { l: 6, c: 0, t: 'B:', h: 'B:', x: 'B:' }, { l: 6, c: 2, x: '\\% \\%' }, { l: 6, c: 7, t: '%', x: '%' } ]
    ]);
  });
  it('pseudocomment', function() {
    var P = new Parser('%%endtext %\n...\n%%unknown\n%%');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: '%%', h: '%%endtext', x: '%%endtext' }, { l: 0, c: 10, t: '%', x: '%' } ],
      [ { l: 1, c: 0, t: '??', x: '...', e: 'missing empty line' } ],
      [ { l: 2, c: 0, t: '%%', h: '%%unknown', x: '%%unknown', e: 'missing empty line; unknown directive' } ],
      [ { l: 3, c: 0, t: '%%', h: '%%', x: '%%' } ]
    ]);
  });
  it('pseudocomment bool', function() {
    var P = new Parser('%%landscape true\n%%landscape false\n%%landscape not sure %!\n%%landscape true, maybe\n%%landscape');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: '%%', h: '%%landscape', x: '%%landscape' }, { l: 0, c: 12, t: '$$', x: 'true' } ],
      [ { l: 1, c: 0, t: '%%', h: '%%landscape', x: '%%landscape' }, { l: 1, c: 12, t: '$$', x: 'false' } ],
      [ { l: 2, c: 0, t: '%%', h: '%%landscape', x: '%%landscape' }, { l: 2, c: 12, x: 'not', e: 'expected: true/false' }, { l: 2, c: 16, x: 'sure' }, { l: 2, c: 21, t: '%', x: '%!' } ],
      [ { l: 3, c: 0, t: '%%', h: '%%landscape', x: '%%landscape' }, { l: 3, c: 12, t: '$$', x: 'true' }, { l: 3, c: 16, x: ',', e: 'unexpected token' }, { l: 3, c: 18, x: 'maybe' } ],
      [ { l: 4, c: 0, t: '%%', h: '%%landscape', x: '%%landscape', e: 'expected: true/false' } ]
    ]);
  });
  it('pseudocomment none', function() {
    var P = new Parser('%%newpage\n%%newpage? ?');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: '%%', h: '%%newpage', x: '%%newpage' } ],
      [ { l: 1, c: 0, t: '%%', h: '%%newpage', x: '%%newpage' }, { l: 1, c: 9, x: '?', e: 'unexpected token' }, { l: 1, c: 11, x: '?' } ]
    ]);
  });
  it('+: ...', function() {
    var P = new Parser('+: ...');
    //console.log(P.tokens);
    equal(P.tokens, [[ { l: 0, c: 0, t: '+:', e: 'no previous field', x: '+:' }, { l: 0, c: 3, x: '...' } ]]);
    P = new Parser('X:\n+: ...');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' } ],
      [ { l: 1, c: 0, t: '+:', h: 'X:', x: '+:' }, { l: 1, c: 3, x: '...', e: 'expected: positive integer' } ]
    ]);
  });
});

describe('refnum', function() {
  it('X:\\n', function() {
    var P = new Parser('X:\n');
    //console.log(P.tokens);
    equal(P.tokens, [[{ l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' }], []]);
  });
  it('X:1', function() {
    var P = new Parser('X:1');
    //console.log(P.tokens);
    equal(P.tokens, [[{ l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' }, { l: 0, c: 2, x: '1' }]]);
  });
  it('X:x', function() {
    var P = new Parser('X:x');
    //console.log(P.tokens);
    equal(P.tokens, [[{ l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' }, { l: 0, c: 2, x: 'x', e: 'expected: positive integer' }]]);
  });
  it('X: 1 2 3 4', function() {
    var P = new Parser('X: 1 2 3 4');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' },
      { l: 0, c: 3, x: '1' },
      { l: 0, c: 5, x: '2', e: 'unexpected token' },
      { l: 0, c: 7, x: '3 4' }
    ]]);
  });
});

describe('macro', function() {
  it('U:~=!none! ... \\n', function() {
    var P = new Parser('U:~=!none! ... \n');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, t: '!!', x: '!none!' },
      { l: 0, c: 11, x: '...', e: 'unexpected token' }
    ], []]);
  });
  it('U:~=!dummy!', function() {
    var P = new Parser('U:~=!dummy!');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, t: '!!', x: '!dummy!', e: 'unknown symbol' },
    ]]);
  });
  it('U:~=!! ...', function() {
    var P = new Parser('U:~=!! ...');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, x: '!!', e: 'unexpected token' },
      { l: 0, c: 7, x: '...' }
    ]]);
  });
  it('U:~=!!! ...', function() {
    var P = new Parser('U:~=!!! ...');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, x: '!!!', e: 'unexpected token' },
      { l: 0, c: 8, x: '...' }
    ]]);
  });
  it('U:~=! ...', function() {
    var P = new Parser('U:~=! ...');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, x: '!', e: "unmatched '!'" },
      { l: 0, c: 6, x: '...' }
    ]]);
  });
  it('U:~=+none+', function() {
    var P = new Parser('U:~=+none+');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, t: '!!', x: '+none+' }
    ]]);
  });
  it('U:~=++', function() {
    var P = new Parser('U:~=++');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, x: '++', e: 'unexpected token' }
    ]]);
  });
  it('U:~="none" ...', function() {
    var P = new Parser('U:~="none" ...');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, t: '""', x: '"none"' },
      { l: 0, c: 11, x: '...', e: 'unexpected token' }
    ]]);
  });
  it('U:~="" ...', function() {
    var P = new Parser('U:~="" ...');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, t: '""', x: '""' },
      { l: 0, c: 7, x: '...', e: 'unexpected token' }
    ]]);
  });
  it('U:~=" ...', function() {
    var P = new Parser('U:~=" ...');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, x: '"', e: 'unmatched \'"\'' },
      { l: 0, c: 6, x: '...' }
    ]]);
  });
  it('U:~=none ...', function() {
    var P = new Parser('U:~=none ...');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 2, t: 'Ul', x: '~' },
      { l: 0, c: 3, t: '=', x: '=' },
      { l: 0, c: 4, x: 'none', e: 'unexpected token' },
      { l: 0, c: 9, x: '...' }
    ]]);
  });
  it('U: \\n+:H \\n+: = \\n+: !none! ... ...\\n', function() {
    var P = new Parser('U: \n+:H \n+: = \n+: !none! ... ...\n');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' } ],
      [ { l: 1, c: 0, t: '+:', h: 'U:', x: '+:' }, { l: 1, c: 2, t: 'Ul', x: 'H' } ],
      [ { l: 2, c: 0, t: '+:', h: 'U:', x: '+:' }, { l: 2, c: 3, t: '=', x: '=' } ],
      [ { l: 3, c: 0, t: '+:', h: 'U:', x: '+:' }, { l: 3, c: 3, t: '!!', x: '!none!' },
        { l: 3, c: 10, x: '...', e: 'unexpected token' }, { l: 3, c: 14, x: '...' } ], []
    ]);
  });
  it('U: = !none!', function() {
    var P = new Parser('U: = !none!');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' },
      { l: 0, c: 3, x: '=', e: 'unexpected token' },
      { l: 0, c: 5, x: '!none!' }
    ]]);
  });
  it('U:!none!', function() {
    var P = new Parser('U:!none!');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'U:', h: 'U:', x: 'U:' }, { l: 0, c: 2, x: '!none!', e: 'unexpected token' }
    ]]);
  });
  it('m:~G2=G2', function() {
    var P = new Parser('m:~G2=G2');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'm:', h: 'm:', x: 'm:' },
      { l: 0, c: 2, t: 'ml', x: '~G2' },
      { l: 0, c: 5, t: '=', x: '=' },
      { l: 0, c: 6, t: 'mr', x: 'G2' }
    ]]);
  });
  it('m:=G2', function() {
    var P = new Parser('m:=G2');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'm:', h: 'm:', x: 'm:' },
      { l: 0, c: 2, x: '=G2', e: 'unexpected token' }
    ]]);
  });
  it('m: G2', function() {
    var P = new Parser('m: G2');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'm:', h: 'm:', x: 'm:' },
      { l: 0, c: 3, t: 'ml', x: 'G2', e: 'incomplete macro' }
    ]]);
  });
});

describe('key', function() {
  it('K: % no key', function() {
    var P = new Parser('K: % no key');
    //console.log(P.tokens);
    equal(P.tokens, [[
      { l: 0, c: 0, t: 'K:', h: 'K:', x: 'K:', e: 'missing "X: ..."; expected: key' },
      { l: 0, c: 3, t: '%', x: '% no key' }
    ]]);
  });
  it('X:\\nK: % no key', function() {
    var P = new Parser('X:\nK: % no key');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' } ],
      [ { l: 1, c: 0, t: 'K:', h: 'K:', x: 'K:', e: 'expected: key' }, { l: 1, c: 3, t: '%', x: '% no key' } ]
    ]);
  });
  it('X:\\nK: no key', function() {
    var P = new Parser('X:\nK: no key');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' } ],
      [ { l: 1, c: 0, t: 'K:', h: 'K:', x: 'K:' },
        { l: 1, c: 3, x: 'no', e: 'expected: key' },
        { l: 1, c: 6, x: 'key' }
      ]
    ]);
  });
  it('X:\\nK: Ab err', function() {
    var P = new Parser('X:\nK: Ab err');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' } ],
      [ { l: 1, c: 0, t: 'K:', h: 'K:', x: 'K:' },
        { l: 1, c: 3, t: 'Kt', x: 'Ab' },
        { l: 1, c: 6, x: 'err', e: 'unexpected token' }
      ]
    ]);
  });
  it('X:\\nK: Cb majOr ^d ... % ...', function() {
    var P = new Parser('X:\nK: Cb majOr ^d ... % ...');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' } ],
      [ { l: 1, c: 0, t: 'K:', h: 'K:', x: 'K:' },
        { l: 1, c: 3, t: 'Kt', x: 'Cb' },
        { l: 1, c: 6, t: 'Km', x: 'majOr' },
        { l: 1, c: 12, t: 'Ka', x: '^d' },
        { l: 1, c: 15, x: '...', e: 'unexpected token' },
        { l: 1, c: 19, t: '%', x: '% ...' }
      ]
    ]);
  });
  it('X:\\nK:\\n+:Cb\\n+:^d', function() {
    var P = new Parser('X:\nK:\n+:Cb\n+:^d');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' } ],
      [ { l: 1, c: 0, t: 'K:', h: 'K:', x: 'K:' } ],
      [ { l: 2, c: 0, t: '+:', h: 'K:', x: '+:' }, { l: 2, c: 2, t: 'Kt', x: 'Cb' } ],
      [ { l: 3, c: 0, t: '+:', h: 'K:', x: '+:' }, { l: 3, c: 2, t: 'Ka', x: '^d' } ]
    ]);
  });
  it('X:\\nK:G ^f ^C', function() {
    var P = new Parser('X:\nK:G ^f ^C');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' } ],
      [ { l: 1, c: 0, t: 'K:', h: 'K:', x: 'K:' },
        { l: 1, c: 2, t: 'Kt', x: 'G' },
        { l: 1, c: 4, t: 'Ka', x: '^f', e: 'redundant accidental' },
        { l: 1, c: 7, t: 'Ka', x: '^C' }
      ]
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
  it('accidentals', function() {
    var k = new Parser.Key();
    assert.equal(k.setAcc(''), false);
    assert.equal(k.setAcc('^f'), true);
    assert.equal(k.setAcc('^f'), false);
    assert.equal(k.scale['f'], 9);
    assert.equal(k.setAcc('^^f'), true);
    assert.equal(k.scale['f'], 10);
    assert.equal(k.setAcc('=f'), true);
    assert.equal(k.scale['f'], 8);
    assert.equal(k.setAcc('_f'), true);
    assert.equal(k.scale['f'], 7);
    assert.equal(k.setAcc('__f'), true);
    assert.equal(k.scale['f'], 6);
  });
});

describe('tune', function() {
  it('empty', function() {
    var P = new Parser('X:\nK:C\n');
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' } ],
      [ { l: 1, c: 0, t: 'K:', h: 'K:', x: 'K:' }, { l: 1, c: 2, t: 'Kt', x: 'C' } ],
      [ { l: 2, c: 0, t: '!?', x: '', '#': true } ]
    ]);
    //console.log(P.tokens[2][0]['#']);
    assert.equal(P.tokens[2][0].c, 0);
    assert.equal(P.tokens[2][0].t, '!?');
    assert.equal(P.tokens[2][0]['#'].key.sharps, 0);
    assert.equal(Parser.getKey(P.tokens[2][0]).sharps, 0);
  });
  it("A_B,c''", function() {
    var P = new Parser("X:\nK:C\nA_B,c''");
    //console.log(P.tokens);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'X:', h: 'X:', x: 'X:' } ],
      [ { l: 1, c: 0, t: 'K:', h: 'K:', x: 'K:' }, { l: 1, c: 2, t: 'Kt', x: 'C' } ],
      [ { l: 2, c: 0, t: '!?', x: '', '#': true }, { l: 2, c: 0, t: 'note', x: 'A' }, { l: 2, c: 1, t: 'note', x: '_B,' }, { l: 2, c: 4, t: 'note', x: "c''" } ]
    ]);
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

describe('etc', function() {
  it('pseudo', function() {
    var o = {};
    for (var x of Parser.pseudo()) o[x.name] = x.det;
    assert.equal(o['newpage'], 'new page');
  });
  it('pseudoDet()', function() {
    assert.equal(Parser.pseudoDet('%%'), 'any text');
    assert.equal(Parser.pseudoDet('landscape'), 'landscape');
    assert.equal(Parser.pseudoDet('app:specific'), 'app-specific');
    assert.equal(Parser.pseudoDet('app::specific'), undefined);
  });
  it('fields', function() {
    var o = {};
    for (var x of Parser.fields()) o[x.name] = x.det;
    assert.equal(o['M'], 'meter');
  });
  it('symbols', function() {
    var o = {};
    for (var x of Parser.symbols()) o[x.name] = x.det;
    assert.equal(o['trill'], 'trill');
  });
  it('symbolDet()', function() {
    assert.equal(Parser.symbolDet('!trill!'), 'trill');
    assert.equal(Parser.symbolDet('!unknown!'), undefined);
    assert.equal(Parser.symbolDet('!fff!'), 'fortississimo');
    assert.equal(Parser.symbolDet('!ppp!'), 'pianississimo');
    assert.equal(Parser.symbolDet('!sp!'), 'subito piano');
    assert.equal(Parser.symbolDet('!sf!'), 'subito forte');
    assert.equal(Parser.symbolDet('!sff!'), 'subito fortissimo');
    assert.equal(Parser.symbolDet('!spp!'), 'subito pianissimo');
    assert.equal(Parser.symbolDet('!s!'), undefined);
  });
});
