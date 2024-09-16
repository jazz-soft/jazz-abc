function Parser(s) {
  this.txt = s;
  this.tokens = [];
  this.lines = [];
  var state = {};
  var all = s.split(/\r?\n|\r/);
  var i, tt;
  for (i = 0; i < all.length; i++) {
    tt = tokens(all[i], i, 0, state);
    this.tokens.push(tt);
    this.lines.push(collect(tt, state));
  }
}
const _readers = { 'K:': reader_K_tonic, 'U:': reader_U_left, 'm:': reader_m_left };
const _assemble = { 'K:': assemble_K };
function collect(tt, q) {
  var t, x;
  if (!tt.length) flush(q);
  else {
    t = tt[0].t;
    if (t != '+:' && t[0] != '%') flush(q);
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

function tokens(s, l, c, q) {
  var i, a, x;
  if (s[1] == ':' && _isField(s[0])) {
    x = s.substring(0, 2);
    if (s[0] != '+') {
      q.field = s[0];
      q.reader = _readers[x];
    }
    if (s[0] == 'X') q.context = 'X';
    if (s[0] == 'K' && q.context == 'X') q.context = 'T';
    a = _chop(s.substring(2), l, c + 2);
    if (q.reader && a.length && a[0].t != '%') a = q.reader(a[0], q).concat(a.slice(1));
    return [{ l: l, c: c, t: x, h: q.field + ':', x: x }].concat(a);
  }
  for (i = 0; i < s.length; i++) if (!_isSpace(s[i])) break;
  c += i;
  if (s[i] == '%') return _percent(s.substring(i), l, c);
  x = s.trim();
  if (x == '') {
    q.context = undefined;
    return [];
  }
  return q.context == 'T' ? _tune(x, l, c) : [{ l: l, c: c, t: '??', x: x }];
}
function _tune(s, l, c) {
  var a = [];
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
  return a;
}
function _chop(s, l, c) {
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
function _percent(s, l, c) {
  var i;
  if (!c) {
    if (s[1] == '%') {
      for (i = 2; i < s.length; i++) if (!_isLetter(s[i])) break;
      return [{ l: l, c: c, t: '%%', h: s.substring(0, i), x: s.substring(0, i) }].concat(_chop(s.substring(i), l, c + i));
    }
    else if (s.startsWith('%abc') && !_isLetter(s[4])) {
      return [{ l: l, c: c, t: '%:', h: '%:', x: '%abc' }].concat(_chop(s.substring(4), l, c + 4));
    }
  }
  return [{ l: l, c: c, t: '%', x: s.trim() }];
}

// K: ...
function assemble_K(q) {
  var a = q.ass;
  var n, t, m;
  console.log('assemble_K:', q.ass);
  if (a.length < 2) {
    a[0].e = 'expected: Key';
    return;
  }
  if (a[1].t != 'Kt') {
    a[1].e = 'expected: Key';
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
    a[1].e = 'too many flats';
    a[2].e = 'too many flats';
    return;
  }
  if (m > 7) {
    a[1].e = 'too many sharps';
    a[2].e = 'too many sharps';
    return;
  }
  for (; n < a.length; n++) {
    if (a[n].t != 'Ka') a[n].e = 'unexpected token';
  }
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
  if (w.match(/^(__?|=|\^\^?)[a-g]$/)) {
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
function reader_U_left(x, q) {
  var a = [], s = x.x, l = x.l, c = x.c;
  var n, w;
  if (_HW(s[0]) || s[0] == '~') {
    a.push({ l: l, c: c, t: 'Ul', x: s[0] });
    n = 1;
    q.reader = reader_U_eq;
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
}
const reader_U_right = reader_rest('Ur');
const reader_U_eq = reader_char('=', reader_U_right);

// m: ...
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
  MIDI: {},
  'propagate-accidentals': {},
  'writeout-accidentals': {},
  pageheight: { det: 'page format' },
  pagewidth: { det: 'page format' },
  topmargin: { det: 'page format' },
  botmargin: { det: 'page format' },
  leftmargin: { det: 'page format' },
  rightmargin: { det: 'page format' },
  indent: { det: 'page format' },
  landscape: { det: 'page format' },
  titlefont: {},
  subtitlefont: {},
  composerfont: {},
  partsfont: {},
  tempofont: {},
  gchordfont: {},
  annotationfont: {},
  infofont: {},
  textfont: {},
  vocalfont: {},
  wordsfont: {},
  'setfont-1': {},
  'setfont-2': {},
  'setfont-3': {},
  'setfont-4': {},
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
  stretchstaff: {},
  stretchlast: {},
  maxshrink: {},
  scale: {},
  measurefirst: {},
  barnumbers: {},
  measurenb: {},
  measurebox: {},
  setbarnb: {},
  text: {},
  center: {},
  begintext: {},
  endtext: {},
  writefields: {},
  sep: { det: 'horizontal separator' },
  vskip: { det: 'insert vertical space' },
  newpage: { det: 'start a new page' },
  exprabove: {},
  exprbelow: {},
  graceslurs: {},
  infoline: {},
  oneperpage: {},
  vocalabove: {},
  freegchord: {},
  printtempo: {}
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
  T: { det: 'tune title' },
  U: { det: 'user defined' },
  V: { det: 'voice' },
  W: { det: 'words' },
  w: { det: 'words' },
  X: { det: 'reference number' },
  Z: { det: 'transcription' }
};

const _symbol = {
  '~': '!roll!',
  H: '!fermata!',
  L: '!accent!',
  M: '!lowermordent!',
  O: '!coda!',
  P: '!uppermordent!',
  S: '!segno!',
  T: '!trill!',
  u: '!upbow!',
  v: '!downbow!'
};

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

Parser.prototype.Key = Parser.Key = Key;

module.exports = {
  Parser: Parser
};