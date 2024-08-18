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
    //console.log(P.data);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: 'N:', x: 'N:' } ],
      [ { l: 1, c: 0, t: 'N:', x: 'N:' }, { l: 1, c: 2, x: 'ab' } ],
      [ { l: 2, c: 0, t: 'N:', x: 'N:' }, { l: 2, c: 3, x: 'ac \\% c' } ],
      [ { l: 3, c: 0, t: 'N:', x: 'N:' }, { l: 3, c: 3, x: 'ac \\\\' }, { l: 3, c: 8, t: '%', x: '% c' } ],
      [ { l: 4, c: 0, x: 'abc' } ],
      [ { l: 5, c: 0, t: 'B:', x: 'B:' }, { l: 5, c: 3, t: '%', x: '%' } ],
      [ { l: 6, c: 0, t: 'B:', x: 'B:' }, { l: 6, c: 2, x: '\\% \\%' }, { l: 6, c: 7, t: '%', x: '%' } ],
      [ ]
    ]);
  });
  it('pseudocomment', function() {
    var P = new Parser('%abc\n %abc\n%abc-2.1\n%abc %abc\n%abc-2.1%abc\n%%endtext %');
    //console.log(P.data);
    equal(P.tokens, [
      [ { l: 0, c: 0, t: '%:', x: '%abc' } ],
      [ { l: 1, c: 1, t: '%', x: '%abc' } ],
      [ { l: 2, c: 0, t: '%:', x: '%abc' }, { l: 2, c: 4, x: '-2.1' } ],
      [ { l: 3, c: 0, t: '%:', x: '%abc' }, { l: 3, c: 5, t: '%', x: '%abc' } ],
      [ { l: 4, c: 0, t: '%:', x: '%abc' }, { l: 4, c: 4, x: '-2.1' }, { l: 4, c: 8, t: '%', x: '%abc' } ],
      [ { l: 5, c: 0, t: '%%', x: '%%endtext' }, { l: 5, c: 10, t: '%', x: '%' } ]
    ]);
  });
});
