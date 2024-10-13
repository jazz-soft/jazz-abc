function Parser(s) {
  this.txt = s;
  this.tokens = [];
  this.lines = [];
  var state = { head: { u_def: _u_def() } };
  var all = s.split(/\r?\n|\r/);
  var i, tt;
  for (i = 0; i < all.length; i++) {
    tt = tokens(all[i], i, 0, state);
    this.tokens.push(tt);
    this.lines.push(collect(tt, state));
  }
  flush(state);
}
const _readers = { 'X:': reader_X, 'K:': reader_K_tonic, 'U:': reader_U_left, 'm:': reader_m_left,
  'bool': reader_enum(['true', 'false']),
  'pr-acc': reader_enum(['not', 'octave', 'pitch']),
  'wr-acc': reader_enum(['none', 'added', 'all']),
  'none': reader_unexpected
};
const _assemble = { 'X:': assemble_X, 'K:': assemble_K, 'U:': assemble_U, 'm:': assemble_m,
  'bool': assemble_enum(['true', 'false']),
  'pr-acc': assemble_enum(['not', 'octave', 'pitch']),
  'wr-acc': assemble_enum(['none', 'added', 'all']),
  'none': assemble_unexpected
};
function _u_def() {
  return { '~': '!roll!', H: '!fermata!', L: '!accent!', M: '!lowermordent!', O: '!coda!', P: '!uppermordent!', S: '!segno!', T: '!trill!', u: '!upbow!', v: '!downbow!' };
}
const _UET = 'unexpected token';
const _MEL = 'missing empty line';
function _dup(x) {
  var r = {};
  if (x) for (var k of Object.keys(x)) r[k] = x[k];
  return r;
}
function err(e, x) {
  if (!e) return x;
  x.e = x.e ? x.e + '; ' + e : e;
  return x;
}
function collect(tt, q) {
  var t, x;
  if (tt.length) {
    t = tt[0].t || '';
    if (t != '+:' && t != '%') flush(q);
    if (!q.ass && _assemble[t]) q.ass = [];
    if (q.ass) for (x of tt) if (!x.t || x.t != '+:' && x.t[0] != '%') q.ass.push(x);
  }
}
function flush(q) {
  if (!q.ass) return;
  var fn = _assemble[q.ass[0].t];
  if (fn) fn(q);
  q.ass = undefined;
}
function reset(q) {
  q.last = undefined;
  q.tune = undefined;
}
function state(l, c, q) {
  return { l: l, c: c, t: '!?', x: '', '#': { key: q.tune.key } };
}

function tokens(s, l, c, q) {
  var i, a, x;
  if (s[1] == ':' && _isField(s[0])) {
    x = s.substring(0, 2);
    if (s[0] != '+') {
      q.field = s[0];
      q.reader = _readers[x];
    }
    a = chop(s.substring(2), l, c + 2);
    if (q.reader && a.length && a[0].t != '%') a = q.reader(a[0], q).concat(a.slice(1));
    return q.field ? [{ l: l, c: c, t: x, h: q.field + ':', x: x }].concat(a) : [{ l: l, c: c, t: x, e: 'no previous field', x: x }].concat(a);
  }
  for (i = 0; i < s.length; i++) if (!_isSpace(s[i])) break;
  c += i;
  if (s[i] == '%') return read_percent(s.substring(i), l, c, q);
  q.field = undefined;
  flush(q);
  x = s.trim();
  a = q.tune && q.tune.key ? read_tune(x, l, c, q) : read_free(x, l, c, q);
  if (!x) reset(q);
  return a;
}
function read_free(s, l, c, q) {
  if (!s) return [];
  var a = [];
  var n = 0;
  if (q.last && q.last != '??') {
    n = read_any(s);
    if (n) a.push({ l: l, c: c, t: '??', x: s.substring(0, n), e: _MEL });
  }
  for (; n < s.length; n++) if (!_isSpace(s[n])) break;
  if (n < s.length) a.push({ l: l, c: c + n, t: '??', x: s.substring(n) });
  q.last = '??';
  return a;
}
function read_tune(s, l, c, q) {
  if (!s) return [state(l, 0, q)];
  var a = chop(s, l, c);
  var comm;
  if (a.length > 1) {
    s = a[0].x;
    comm = a[1];
  }
  a = [state(l, 0, q)];
  var n, k;
  n = 0;
  while (n < s.length) {
    if (_isNote(s[n])) {
      for (k = n + 1; k < s.length; k++) if (s[k] != ',' && s[k] != "'") break;
      a.push({ l: l, c: n + c, t: 'note', x: s.substring(n, k) });
      n = k;
      continue;
    }
    else if ((s[n] == '^' || s[n] == '=' || s[n] == '_') && _isNote(s[n + 1])) {
      for (k = n + 2; k < s.length; k++) if (s[k] != ',' && s[k] != "'") break;
      a.push({ l: l, c: n + c, t: 'note', x: s.substring(n, k) });
      n = k;
      continue;
    }
    else {
      a.push({ l: l, c: n + c, x: s[n] });
      n++;
    }
  }
  if (comm) a.push(comm);
  return a;
}
function chop(s, l, c) {
  var a = [];
  var i, k, q, x;
  for (i = 0; i < s.length; i++) if (!_isSpace(s[i])) break;
  if (i == s.length) return a;
  for (k = i; k < s.length; k++) {
    if (s[k] == '\\') q = !q;
    else if (s[k] == '%' && !q) {
      x = s.substring(i, k).trim();
      if (x) a.push({ l: l, c: c + i, x: x });
      a.push({ l: l, c: c + k, t: '%', x: s.substring(k).trim() });
      return a;
    }
    else q = false;
  }
  a.push({ l: l, c: c + i, x: s.substring(i).trim() });
  return a;
}
function read_percent(s, l, c, q) {
  var n, a, e0, e1, x, fn;
  if (!c) {
    if (s[1] == '%') {
      flush(q);
      if (q.last == '??') e0 = _MEL;
      q.last = '%%';
      for (n = 2; n < s.length; n++) if (!_isLetter(s[n]) && !_isDigit(s[n]) && s[n] != '-' && s[n] != ':') break;
      x = s.substring(2, n);
      if (!pseudoDet(x)) e1 = 'unknown directive';
      a = chop(s.substring(n), l, c + n);
      x = _pseudo[x];
      if (x && x.rdr) {
        q.reader = _readers[x.rdr];
        fn = _assemble[x.rdr];
      }
      x = err(e1, err(e0, { l: l, c: c, t: '%%', h: s.substring(0, n), x: s.substring(0, n) }));
      if (q.reader && a.length && a[0].t != '%') a = q.reader(a[0], q).concat(a.slice(1));
      a = [x].concat(a);
      if (fn) {
        q.ass = [];
        for (x of a) if (x.t != '%') q.ass.push(x);
        fn(q);
        q.ass = undefined;
      }
      return a;
    }
    else if (!q.abc && s.startsWith('%abc') && !_isLetter(s[4])) {
      flush(q);
      q.abc = true;
      q.last = '%:';
      return [err(l ? 'must be the first line' : undefined, { l: l, c: c, t: '%:', h: '%:', x: '%abc' })].concat(chop(s.substring(4), l, c + 4));
    }
  }
  return [{ l: l, c: c, t: q.last == '??' ? '??' : '%', x: s.trim() }];
}
function _add_tune(q) {
  q.tune = {};
  q.tune.macro = _dup(q.head.macro);
  q.tune.u_def = _dup(q.head.u_def);
  q.cut = true;
}

// X: ...
function assemble_X(q) {
  var a = q.ass;
  var n;
  if (a.length > 1) {
    n = parseInt(a[1].x);
    if (a[1].x == n && n >= 0) {
      if (a.length > 2) err(_UET, a[2]);
    }
    else {
      err('expected: positive integer', a[1]);
    }
  }
  _add_tune(q);
}
function reader_X(x, q) {
  var a = [], s = x.x, l = x.l, c = x.c;
  var n;
  for (n = 0; n < s.length; n++) if (_isSpace(s[n])) break;
  a.push({ l: l, c: c, x: s.substring(0, n) });
  q.reader = undefined;
  for (; n < s.length; n++) if (!_isSpace(s[n])) break;
  if (n < s.length) a = a.concat(reader_unexpected({ l: l, c: c + n, x: s.substring(n) }, q));
  return a;
}

// K: ...
function assemble_K(q) {
  var a = q.ass;
  var n, t, m;
  if (!q.tune) err('missing "X: ..."', a[0]);
  else if (!q.tune.key) q.tune.key = new Key();
  if (a.length < 2) {
    err('expected: key', a[0]);
    return;
  }
  if (a[1].t != 'Kt') {
    err('expected: key', a[1]);
    return;
  }
  t = a[1].x;
  n = 2;
  if (a.length > 2 && a[2].t == 'Km') {
    m = a[2].x;
    n = 3;
  }
  m = sharps(t, m);
  if (m < -7) {
    err('too many flats', a[1]);
    err('too many flats', a[2]);
    return;
  }
  if (m > 7) {
    err('too many sharps', a[1]);
    err('too many sharps', a[2]);
    return;
  }
  var K = new Key(m);
  for (; n < a.length; n++) {
    if (a[n].t != 'Ka') {
      err(_UET, a[n]);
      return;
    }
    if (!K.setAcc(a[n].x)) err('redundant accidental', a[n]);
  }
  if (q.tune) q.tune.key = K;
}
function reader_K_tonic(x, q) {
  var a = [], s = x.x, l = x.l, c = x.c;
  var n, w;
  if (_ABCDEFG(s[0])) {
    if (s[1] == '#' || s[1] == 'b') {
      a.push({ l: l, c: c, t: 'Kt', x: s.substring(0, 2) });
      n = 2;
    }
    else {
      a.push({ l: l, c: c, t: 'Kt', x: s[0] });
      n = 1;
    }
    q.reader = reader_K_mode;
  }
  else {
    for (n = 0; n < s.length; n++) if (_isSpace(s[n])) break;
    w = s.substring(0, n);
    if (w == 'none' || w == 'HP' || w == 'Hp') {
      a.push({ l: l, c: c, t: 'Kt', x: w });
      q.reader = reader_K_acc;
    }
    else {
      a.push({ l: l, c: c, x: w });
      q.reader = undefined;
    }
  }
  for (; n < s.length; n++) if (!_isSpace(s[n])) break;
  if (n < s.length) a = a.concat(q.reader ? q.reader({ l: l, c: c + n, x: s.substring(n) }, q) : [{ l: l, c: c + n, x: s.substring(n) }]);
  return a;
}
function reader_K_mode(x, q) {
  var a = [], s = x.x, l = x.l, c = x.c;
  var n, w;
  for (n = 0; n < s.length; n++) if (_isSpace(s[n])) break;
  w = s.substring(0, n);
  if (_isMode(w)) {
    a.push({ l: l, c: c, t: 'Km', x: w });
  }
  else n = 0;
  q.reader = reader_K_acc;
  for (; n < s.length; n++) if (!_isSpace(s[n])) break;
  if (n < s.length) a = a.concat(q.reader({ l: l, c: c + n, x: s.substring(n) }, q));
  return a;
}
function reader_K_acc(x, q) {
  var a = [], s = x.x, l = x.l, c = x.c;
  var n, w;
  for (n = 0; n < s.length; n++) if (_isSpace(s[n])) break;
  w = s.substring(0, n);
  if (w.match(/^(__?|=|\^\^?)[a-gA-G]$/)) {
    a.push({ l: l, c: c, t: 'Ka', x: w });
  }
  else {
    a.push({ l: l, c: c, x: w });
    q.reader = undefined;
  }
  for (; n < s.length; n++) if (!_isSpace(s[n])) break;
  if (n < s.length) a = a.concat(q.reader ? q.reader({ l: l, c: c + n, x: s.substring(n) }, q) : [{ l: l, c: c + n, x: s.substring(n) }]);
  return a;
}

// U: ...
function assemble_U(q) {
  var a = q.ass;
  if (a.length < 2) {
    err('expected: definition', a[0]);
    return;
  }
  if (a[1].t != 'Ul') {
    err(_UET, a[1]);
    return;
  }
  if (a.length < 3) {
    err('incomplete definition', a[1]);
    return;
  }
  if (a[2].t != '=') {
    err(_UET, a[2]);
    return;
  }
  if (a.length < 4) {
    err('incomplete definition', a[2]);
    return;
  }
  if (a[3].t != 'Ur') {
    err(a[3].x == '!' ? 'unmatched \'!\'' : a[3].x == '"' ? 'unmatched \'"\'' : _UET, a[3]);
    return;
  }
  if (a[3].x[0] == '!' || a[3].x[0] == '+') {
    a[3].t = '!!';
    if (!symbolDet(a[3].x)) err('unknown symbol', a[3]);
  }
  else if (a[3].x[0] == '"') a[3].t = '""';
  if (a.length > 4) {
    err(_UET, a[4]);
  }
}
function reader_U_left(x, q) {
  var a = [], s = x.x, l = x.l, c = x.c;
  var n, w;
  if (_HW(s[0]) || s[0] == '~') {
    a.push({ l: l, c: c, t: 'Ul', x: s[0] });
    n = 1;
    q.reader = reader_U_eq;
  }
  else {
    for (n = 1; n < s.length; n++) if (_isSpace(s[n]) || s[n] == '=') break;
    w = s.substring(0, n);
    a.push({ l: l, c: c, x: w });
    q.reader = undefined;
  }
  for (; n < s.length; n++) if (!_isSpace(s[n])) break;
  if (n < s.length) a = a.concat(q.reader ? q.reader({ l: l, c: c + n, x: s.substring(n) }, q) : [{ l: l, c: c + n, x: s.substring(n) }]);
  return a;
}
function reader_U_right(x, q) {
  var a = [], s = x.x, l = x.l, c = x.c;
  var n = read_symbol(s) || read_depr_symbol(s) || read_quoted(s);
  if (n) a.push({ l: l, c: c, t: 'Ur', x: s.substring(0, n) });
  else {
    n = read_any(s);
    if (n) a.push({ l: l, c: c, x: s.substring(0, n) });
  }
  for (; n < s.length; n++) if (!_isSpace(s[n])) break;
  q.reader = undefined;
  if (n < s.length) a = a.concat(reader_unexpected({ l: l, c: c + n, x: s.substring(n) }, q));
  return a;
}
const reader_U_eq = reader_char('=', reader_U_right);

// m: ...
function assemble_m(q) {
  var a = q.ass;
  if (a.length < 2) {
    err('expected: macro', a[0]);
    return;
  }
  if (a[1].t != 'ml') {
    err(_UET, a[1]);
    return;
  }
  if (a.length < 3) {
    err('incomplete macro', a[1]);
    return;
  }
  if (a[2].t != '=') {
    err(_UET, a[2]);
    return;
  }
  if (a.length < 4) {
    err('incomplete macro', a[2]);
    return;
  }
}
function reader_m_left(x, q) {
  var a = [], s = x.x, l = x.l, c = x.c;
  var n, w;
  for (n = 0; n < s.length; n++) if (_isSpace(s[n]) || s[n] == '=') break;
  if (n) {
    w = s.substring(0, n);
    a.push({ l: l, c: c, t: 'ml', x: w });
    q.reader = reader_m_eq;
  }
  else q.reader = undefined;
  for (; n < s.length; n++) if (!_isSpace(s[n])) break;
  if (n < s.length) a = a.concat(q.reader ? q.reader({ l: l, c: c + n, x: s.substring(n) }, q) : [{ l: l, c: c + n, x: s.substring(n) }]);
  return a;
}
const reader_m_right = reader_rest('mr');
const reader_m_eq = reader_char('=', reader_m_right);

function reader_char(ch, nxt) {
  return function(x, q) {
    var a = [], s = x.x, l = x.l, c = x.c;
    var n, w;
    if (s[0] == ch) {
      a.push({ l: l, c: c, t: ch, x: ch });
      n = 1;
      q.reader = nxt;
    }
    else {
      for (n = 0; n < s.length; n++) if (_isSpace(s[n])) break;
      w = s.substring(0, n);
      a.push({ l: l, c: c, x: w });
      q.reader = undefined;
    }
    for (; n < s.length; n++) if (!_isSpace(s[n])) break;
    if (n < s.length) a = a.concat(q.reader ? q.reader({ l: l, c: c + n, x: s.substring(n) }, q) : [{ l: l, c: c + n, x: s.substring(n) }]);
    return a;
  };
}
function reader_rest(tt, nxt) {
  return function(x, q) {
    q.reader = nxt;
    return [{ l: x.l, c: x.c, t: tt, x: x.x.trim() }];
  };
}
function reader_enum(ee, nxt) {
  return function(x, q) {
    var a = [], s = x.x, l = x.l, c = x.c;
    var n = read_any(s);
    var w = s.substring(0, n);
    if (ee.includes(w)) a.push({ l: l, c: c, t: '$$', x: w });
    else n = 0;
    q.reader = reader_unexpected;
    for (; n < s.length; n++) if (!_isSpace(s[n])) break;
    if (n < s.length) a = a.concat(q.reader({ l: l, c: c + n, x: s.substring(n) }, q));
    q.reader = nxt;
    return a;
  };
}
function assemble_enum(ee) {
  return function(q) {
    var a = q.ass;
    if (a.length < 2) {
      err('expected: ' + ee.join('/'), a[0]);
      return;
    }
    if (a[1].t != '$$') {
      err('expected: ' + ee.join('/'), a[1]);
      return;
    }
    if (a.length > 2) {
      err(_UET, a[2]);
    }
  };
}

function assemble_unexpected(q) {
  var a = q.ass;
  if (a.length > 1) {
    err(_UET, a[1]);
  }
}
function reader_unexpected(x, q) {
  var a = [], s = x.x, l = x.l, c = x.c;
  var n = read_any(s);
  if (n) a.push({ l: l, c: c, x: s.substring(0, n) });
  for (; n < s.length; n++) if (!_isSpace(s[n])) break;
  q.reader = undefined;
  if (n < s.length) a = a.concat([{ l: l, c: c + n, x: s.substring(n) }]);
  return a;
}

function read_symbol(s) { // !...!
  if (s[0] != '!') return 0;
  var n, c;
  for (n = 1; n < s.length; n++) {
    c = s[n];
    if (c == '!') return n > 1 ? n + 1 : 0;
    if (_isSpace(c)) break;
  }
  return 0;
}
function read_depr_symbol(s) { // +...+ // deprecated
  if (s[0] != '+') return 0;
  var n, c;
  for (n = 1; n < s.length; n++) {
    c = s[n];
    if (c == '+') return n > 1 ? n + 1 : 0;
    if (_isSpace(c)) break;
  }
  return 0;
}
function read_quoted(s) { // "..."
  if (s[0] != '"') return 0;
  var n, c;
  for (n = 1; n < s.length; n++) {
    c = s[n];
    if (c == '"') return n + 1;
  }
  return 0;
}
function read_any(s) {
  if (!s.length) return 0;
  var n;
  var c = s[0];
  if (_isLetter(c) || c == '_') {
    for (n = 1; n < s.length; n++) {
      c = s[n];
      if (!_isLetter(c) && !_isDigit(c) && c != '_') break;
    }
  }
  else if (_isDigit(c)) {
    for (n = 1; n < s.length; n++) {
      c = s[n];
      if (!_isDigit(c)) break;
    }
  }
  else {
    for (n = 1; n < s.length; n++) {
      if (s[n] != c) break;
    }
  }
  return n;
}

var _0 = '0'.charCodeAt(0);
var _9 = '9'.charCodeAt(0);
var _A = 'A'.charCodeAt(0);
var _G = 'G'.charCodeAt(0);
var _H = 'H'.charCodeAt(0);
var _W = 'W'.charCodeAt(0);
var _Z = 'Z'.charCodeAt(0);
var _a = 'a'.charCodeAt(0);
var _h = 'h'.charCodeAt(0);
var _w = 'w'.charCodeAt(0);
var _z = 'z'.charCodeAt(0);
function _ABCDEFG(c) {
  c = c ? c.charCodeAt(0) : 0;
  return c >= _A && c <= _G;
}
function _HW(c) {
  c = c ? c.charCodeAt(0) : 0;
  return c >= _H && c <= _W || c >= _h && c <= _w;
}
function _isLetter(c) {
  c = c ? c.charCodeAt(0) : 0;
  return c >= _A && c <= _Z || c >= _a && c <= _z;
}
function _isDigit(c) {
  c = c ? c.charCodeAt(0) : 0;
  return c >= _0 && c <= _9;
}
function _isNote(c) { return c ? _ABCDEFG(c.toUpperCase()) : false; }
function _isField(c) { return c == '+' || _isLetter(c); }
function _isSpace(c) { return !!/\s/.test(c); }

const _mode = { major: 0, minor: -3, ionian: 0, aeolian: -3, mixolydian: -1, dorian: -2, phrygian: -4, lydian: 1, locrian: 5 };
const _modes = Object.keys(_mode);
function _isMode(s) {
  if (s == 'm') return true;
  if (s.length < 3) return false;
  s = s.toLowerCase();
  for (var m of _modes) if (m.startsWith(s)) return true;
  return false;
}

const _pseudo = {
  '': { det: 'any text' },
  MIDI: {},
  'propagate-accidentals': { det: 'propagate accidentals', rdr: 'pr-acc' },
  'writeout-accidentals': { det: 'writeout accidentals', rdr: 'wr-acc' },
  pageheight: { det: 'page height' },
  pagewidth: { det: 'page width' },
  topmargin: { det: 'top margin' },
  botmargin: { det: 'bottom margin' },
  leftmargin: { det: 'left margin' },
  rightmargin: { det: 'right margin' },
  indent: { det: 'page format' },
  landscape: { rdr: 'bool' },
  titlefont: { det: 'title font' },
  subtitlefont: { det: 'subtitle font' },
  composerfont: { det: 'composer font' },
  partsfont: { det: 'parts font' },
  tempofont: { det: 'tempo font' },
  gchordfont: { det: 'chords font' },
  annotationfont: { det: 'annotation font' },
  infofont: { det: 'info font' },
  textfont: { det: 'text font' },
  vocalfont: { det: 'vocal font' },
  wordsfont: { det: 'words font' },
  'setfont-1': { det: '$1 font' },
  'setfont-2': { det: '$2 font' },
  'setfont-3': { det: '$3 font' },
  'setfont-4': { det: '$4 font' },
  topspace: {},
  titlespace: {},
  subtitlespace: {},
  composerspace: {},
  musicspace: {},
  partsspace: {},
  vocalspace: {},
  wordsspace: {},
  textspace: {},
  infospace: {},
  staffsep: {},
  sysstaffsep: {},
  barsperstaff: {},
  parskipfac: {},
  lineskipfac: {},
  stretchstaff: { rdr: 'bool' },
  stretchlast: { rdr: 'bool' },
  maxshrink: {},
  scale: {},
  measurefirst: {},
  barnumbers: {},
  measurenb: {},
  measurebox: { rdr: 'bool' },
  setbarnb: {},
  text: {},
  center: {},
  begintext: { det: 'begin text', rdr: 'none' },
  endtext:  { det: 'end text', rdr: 'none' },
  writefields: {},
  sep: { det: 'horizontal separator', rdr: 'none' },
  vskip: { det: 'vertical space', rdr: 'none' },
  newpage: { det: 'new page', rdr: 'none' },
  exprabove: { rdr: 'bool' },
  exprbelow: { rdr: 'bool' },
  graceslurs: { rdr: 'bool' },
  infoline: { rdr: 'bool' },
  oneperpage: { rdr: 'bool' },
  vocalabove: { rdr: 'bool' },
  freegchord: { rdr: 'bool' },
  printtempo: { rdr: 'bool' }
};

const _fields = {
  A: { det: 'area' },
  B: { det: 'book' },
  C: { det: 'composer' },
  D: { det: 'discography' },
  F: { det: 'file url' },
  G: { det: 'group' },
  H: { det: 'history' },
  I: { det: 'instruction' },
  K: { det: 'key' },
  L: { det: 'unit note' },
  M: { det: 'meter' },
  m: { det: 'macro' },
  N: { det: 'notes' },
  O: { det: 'origin' },
  P: { det: 'parts' },
  Q: { det: 'tempo' },
  R: { det: 'rhythm' },
  r: { det: 'remark' },
  S: { det: 'source' },
  s: { det: 'symbol line' },
  T: { det: 'title' },
  U: { det: 'user defined' },
  V: { det: 'voice' },
  W: { det: 'words' },
  w: { det: 'words' },
  X: { det: 'reference number' },
  Z: { det: 'transcription' }
};

const _symbols = {
  'none': { det: 'disable' },
  'nil': { det: 'disable' },
  'trill': { det: 'trill' },
  'trill(': { det: 'start of a trill' },
  'trill)': { det: 'end of a trill' },
  'lowermordent': { det: 'lower mordent' },
  'uppermordent': { det: 'upper mordent' },
  'mordent': { det: 'lower mordent' },
  'pralltriller': { det: 'upper mordent' },
  'roll': { det: 'roll mark' },
  'turn': { det: 'turn mark' },
  'turnx': { det: 'turn slash mark' },
  'invertedturn': { det: 'inverted turn mark' },
  'invertedturnx': { det: 'inverted turn slash mark' },
  'arpeggio': { det: 'vertical squiggle' },
  '>': { det: 'accent' },
  'accent': { det: 'accent' },
  'emphasis': { det: 'accent' },
  '^': { det: 'marcato' },
  'marcato': { det: 'marcato' },
  'fermata': { det: 'fermata' },
  'invertedfermata': { det: 'upside down fermata' },
  'tenuto': { det: 'tenuto' },
  '0': { det: 'fingering' },
  '1': { det: 'fingering' },
  '2': { det: 'fingering' },
  '3': { det: 'fingering' },
  '4': { det: 'fingering' },
  '5': { det: 'fingering' },
  '+': { det: 'pizzicato' },
  'plus': { det: 'pizzicato' },
  'snap': { det: 'snap-pizzicato' },
  'slide': { det: 'slide up' },
  'wedge': { det: 'wedge mark' },
  'upbow': { det: 'up bow' },
  'downbow': { det: 'down bow' },
  'open': { det: 'circle mark' },
  'thumb': { det: 'cello thumb' },
  'breath': { det: 'breath mark' },
  'p': { det: 'piano' },
  'mp': { det: 'mezzo piano' },
  'sp': { det: 'subito piano' },
  'f': { det: 'forte' },
  'mf': { det: 'mezzo forte' },
  'sf': { det: 'subito forte' },
  'sfz': { det: 'sforzando' },
  'crescendo(': { det: 'start of a crescendo mark' },
  '<(': { det: 'start of a crescendo mark' },
  'crescendo)': { det: 'end of a crescendo mark' },
  '<)': { det: 'end of a crescendo mark' },
  'diminuendo(': { det: 'start of a diminuendo mark' },
  '>(': { det: 'start of a diminuendo mark' },
  'diminuendo)': { det: 'end of a diminuendo mark' },
  '>)': { det: 'end of a diminuendo mark' },
  'segno': { det: 'segno' },
  'coda': { det: 'coda' },
  'D.S.': { det: 'D.S.' },
  'D.S.alcoda': { det: 'D.S. al coda' },
  'D.S.alfine': { det: 'D.S. al fine' },
  'D.C.': { det: 'D.C.' },
  'D.C.alcoda': { det: 'D.C. al coda' },
  'D.C.alfine': { det: 'D.C. al fine' },
  'dacoda': { det: 'da code' },
  'dacapo': { det: 'da capo' },
  'fine': { det: 'fine' },
  'shortphrase': { det: 'vertical line' },
  'mediumphrase': { det: 'vertical line' },
  'longphrase': { det: 'vertical line' },
  'editorial': { det: 'editorial accidental' },
  'courtesy': { det: 'courtesy accidental' }
};
function pseudoDet(s) {
  if (s.startsWith('%%')) s = s.substring(2); 
  if (_pseudo[s]) return _pseudo[s].det || s;
  var a = s.split(':');
  if (a.length == 2 && a[0].length && a[1].length) return 'app-specific';
}
function symbolDet(s) {
  var n = s.length - 1;
  if (n < 2 || s[0] != s[n] || s[0] != '!' && s[0] != '+' ) return;
  s = s.substring(1, n);
  if (_symbols[s]) return _symbols[s].det;
  var ff = 0, pp = 0;
  for (n = 0; n < s.length; n++) {
    if (s[n] == 'f') ff++;
    else if (s[n] == 'p') pp++;
  }
  if (ff == s.length) {
    s = 'forti';
    for (n = 1; n < ff; n++) s += 'ssi';
    return s + 'mo';
  }
  if (ff == s.length - 1 && ff > 1 && s[0] == 's') {
    s = 'subito forti';
    for (n = 1; n < ff; n++) s += 'ssi';
    return s + 'mo';
  }
  if (pp == s.length) {
    s = 'piani';
    for (n = 1; n < pp; n++) s += 'ssi';
    return s + 'mo';
  }
  if (pp == s.length - 1 && pp > 1 && s[0] == 's') {
    s = 'subito piani';
    for (n = 1; n < pp; n++) s += 'ssi';
    return s + 'mo';
  }
}

Parser.prototype.pseudo = Parser.pseudo = function() {
  var a = [];
  for (var k of Object.keys(_pseudo)) a.push({ name: k, det: _pseudo[k].det });
  return a;
}
Parser.prototype.fields = Parser.fields = function() {
  var a = [];
  for (var k of Object.keys(_fields)) a.push({ name: k, det: _fields[k].det });
  return a;
}
Parser.prototype.symbols = Parser.symbols = function() {
  var a = [];
  for (var k of Object.keys(_symbols)) a.push({ name: k, det: _symbols[k].det });
  return a;
}
Parser.prototype.pseudoDet = Parser.pseudoDet = pseudoDet;
Parser.prototype.symbolDet = Parser.symbolDet = symbolDet;

const _notes = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
const _scale = { c: 3, d: 5, e: 7, f: 8, g: 10, a: 12, b: 14 };  // MIDI + 3 to allow Cbb
Parser.prototype.m2n = Parser.m2n = function(m, k) {
  var n = m % 12;
  var i, c, s;
  var sc = k ? k.scale : _scale;
  var sh = k ? k.sharps : 0;
  for (c of _notes) if (n + 3 == sc[c]) {
    m += _scale[c] - sc[c];
    n = m % 12;
    s = c;
    break;
  }
  if (!s) s = ['=c', 0, '=d', 0, '=e', '=f', 0, '=g', 0, '=a', 0, '=b'][n];
  if (!s) s = Math.abs([0, 2, 0, 4, 0, 0, 1, 0, 3, 0, 5][n] - sh) > Math.abs([0, 4, 0, 2, 0, 0, 5, 0, 3, 0, 1][n] + sh) ?
          [0, '_d', 0, '_e', 0, 0, '_g', 0, '_a', 0, '_b'][n] :
          [0, '^c', 0, '^d', 0, 0, '^f', 0, '^g', 0, '^a'][n];
  var t = (m - n) / 12;
  if (t < 6) s = s.toUpperCase();
  for (i = t; i < 5; i++) s += ',';
  for (i = 6; i < t; i++) s += "'";
  return s;
}

Parser.prototype.n2m = Parser.n2m = function(s, k) {
  var m, a, n, nn, o, t;
  a = { '_': 1, '=': 2, '^': 3 }[s[0]];
  if (a) {
    n = s[1];
    t = s.substring(2);
    nn = n.toLowerCase();
    m = _scale[nn];
    if (!m) return;
    m = m + a - 5;
  }
  else {
    n = s[0];
    t = s.substring(1);
    nn = n.toLowerCase();
    m = k ? k.scale[nn] : _scale[nn];
    if (!m) return;
    m = m - 3;
  }
  o = n == nn ? 6 : 5;
  for (var i = 0; i < t.length; i++) {
    if (t[i] == ',') o--;
    else if (t[i] == "'") o++;
    else return;
  }
  m += o * 12;
  if (m < 0 || m > 127) return;
  return m;
}

const _sharps = { major: 0, ionian: 0, minor: -3, aeolian: -3, mixolydian: -1, dorian: -2, phrygian: -4, lydian: 1, locrian: -5 };
function sharps(t, m) {
  var n = { cb: 1, gb: 2, db: 3, ab: 4, eb: 5, bb: 6, f: 7, c: 8, none: 8, g: 9, d: 10, hp: 10, a: 11, e: 12, b: 13, 'f#': 14, 'c#': 15 }[t.toLowerCase()] - 8;
  if (m) {
    m = m.toLowerCase();
    if (m == 'm') return n - 3;
    for (var k of Object.keys(_sharps)) if (k.startsWith(m)) return n + _sharps[k];
  }
  return n;
}

function Key(n) {
  var i, k, m;
  this.sharps= n;
  this.scale = {};
  for (k of _notes) this.scale[k] = _scale[k];
  if (n > 0) {
    m = 3;
    for (i = 0; i < n; i++) {
      this.scale[_notes[m]]++;
      m = (m + 4) % 7;
    }
  }
  else if (n < 0) {
    m = 6;
    for (i = 0; i < -n; i++) {
      this.scale[_notes[m]]--;
      m = (m + 3) % 7;
    }
  }
}
Key.prototype.setAcc = function(s) {
  var a, n;
  if (s[0] == '^') {
    if (s[1] == '^') {
      a = s[2];
      n = 2;
    }
    else {
      a = s[1];
      n = 1;
    }
  }
  else if (s[0] == '_') {
    if (s[1] == '_') {
      a = s[2];
      n = -2;
    }
    else {
      a = s[1];
      n = -1;
    }
  }
  else if (s[0] == '=') {
    a = s[1];
    n = 0;
  }
  else return false;
  a = a.toLowerCase();
  n = _scale[a] + n;
  if (this.scale[a] == n) return false;
  this.scale[a] = n;
  return true;
}

Parser.prototype.Key = Parser.Key = Key;
Parser.prototype.getKey = Parser.getKey = function(x) { return x['#'].key; };

module.exports = {
  Parser: Parser
};