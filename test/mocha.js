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
    var P = new Parser('N: \nN:ab \nN: ac \\% c\nN: ac \\\\% c \nabc');
    //console.log(P.data);
    equal(P.data, [
      [ { l: 0, c: 0, t: 'N:', x: 'N:' } ],
      [ { l: 1, c: 0, t: 'N:', x: 'N:' }, { l: 1, c: 2, x: 'ab' } ],
      [ { l: 2, c: 0, t: 'N:', x: 'N:' }, { l: 2, c: 3, x: 'ac \\% c' } ],
      [ { l: 3, c: 0, t: 'N:', x: 'N:' },
        { l: 3, c: 3, x: 'ac \\\\' },
        { l: 3, c: 8, t: '%', x: '% c' }
      ],
      [ { l: 4, c: 0, x: 'abc' } ]
    ]);
  });
});
