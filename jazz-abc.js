function Parser(s) {
  this.txt = s;
  this.tokens = [];
  var lines = s.split(/\r?\n|\r/);
  for (var i = 0; i < lines.length; i++) this.tokens.push(new Tokens(lines[i], i, 0));
}

function Tokens(s, l, c, t) {
  var i, a, x;
  if (s[1] == ':' && _isField(s[0])) {
    x = s.substring(0, 2);
    if (s[0] != '+') t = s[0];
    a = _chop(s.substring(2), l, c + 2);
    return [{ l: l, c: c, t: x, x: x }].concat(a);
  }
  for (i = 0; i < s.length; i++) if (!_isSpace(s[i])) break;
  c += i;
  if (s[i] == '%') return _percent(s.substring(i), l, c);
  x = s.trim();
  return x == '' ? [] : [{ l: l, c: c, x: s.trim() }];
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
      return [{ l: l, c: c, t: '%%', x: s.substring(0, i) }].concat(_chop(s.substring(i), l, c + i));
    }
    else if (s.startsWith('%abc') && !_isLetter(s[4])) {
      return [{ l: l, c: c, t: '%:', x: '%abc' }].concat(_chop(s.substring(4), l, c + 4));
    }
  }
  return [{ l: l, c: c, t: '%', x: s.trim() }];
}
var _A = 'A'.charCodeAt(0);
var _Z = 'Z'.charCodeAt(0);
var _a = 'a'.charCodeAt(0);
var _z = 'z'.charCodeAt(0);
function _isLetter(c) {
  c = c ? c.charCodeAt(0) : 0;
  return c >= _A && c <= _Z || c >= _a && c <= _z;
}
function _isField(c) { return c == '+' || _isLetter(c); }
function _isSpace(c) { return !!/\s/.test(c); }

module.exports = {
  Parser: Parser
};