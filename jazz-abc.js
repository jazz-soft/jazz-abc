function Parser(s) {
  this.txt = s;
  this.tokens = [];
  var state = {};
  var lines = s.split(/\r?\n|\r/);
  for (var i = 0; i < lines.length; i++) this.tokens.push(tokens(lines[i], i, 0, state));
}

function tokens(s, l, c, t) {
  var i, a, x;
  if (s[1] == ':' && _isField(s[0])) {
    x = s.substring(0, 2);
    if (s[0] != '+') t.field = s[0];
    a = _chop(s.substring(2), l, c + 2);
    return [{ l: l, c: c, t: x, h: t.field + ':', x: x }].concat(a);
  }
  for (i = 0; i < s.length; i++) if (!_isSpace(s[i])) break;
  c += i;
  if (s[i] == '%') return _percent(s.substring(i), l, c);
  x = s.trim();
  return x == '' ? [] : [{ l: l, c: c, t: '??', x: s.trim() }];
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

var _A = 'A'.charCodeAt(0);
var _G = 'G'.charCodeAt(0);
var _Z = 'Z'.charCodeAt(0);
var _a = 'a'.charCodeAt(0);
var _z = 'z'.charCodeAt(0);
function _ABCDEFG(c) {
  c = c ? c.charCodeAt(0) : 0;
  return c >= _A && c <= _G;
}
function _isLetter(c) {
  c = c ? c.charCodeAt(0) : 0;
  return c >= _A && c <= _Z || c >= _a && c <= _z;
}
function _isField(c) { return c == '+' || _isLetter(c); }
function _isSpace(c) { return !!/\s/.test(c); }

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

Parser.prototype.m2n = Parser.m2n = function(m, k) {
  var n = m % 12;
  var t = (m - n) / 12;
  var i, s;
  if (!k) {
    s = ['C', '^C', 'D', '_E', 'E', 'F', '^F', 'G', '_A', 'A', '_B', 'B'][n];
  }
  if (t > 5) s = s.toLowerCase();
  for (i = t; i < 5; i++) s += ',';
  for (i = 6; i < t; i++) s += "'";
  return s;
}

const _scale = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
Parser.prototype.n2m = Parser.n2m = function(s, k) {
  var m, a, n, nn, o, t;
  a = { '_': 1, '=': 2, '^': 3 }[s[0]];
  if (a) {
    n = s[1];
    t = s.substring(2);
    nn = n.toLowerCase();
    m = _scale[nn];
    if (!m) return;
    m = m + a - 3;
  }
  else {
    n = s[0];
    t = s.substring(1);
    nn = n.toLowerCase();
    m = k ? k.scale[nn] : _scale[nn];
    if (!m) return;
    m = m - 1;
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

module.exports = {
  Parser: Parser
};