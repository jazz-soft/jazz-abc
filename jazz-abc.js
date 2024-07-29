function Parser(s) {
  this.txt = s;
  this.data = [];
  var lines = s.split(/\r?\n|\r/);
  for (var i = 0; i < lines.length; i++) this.data.push(new Tokens(lines[i], i, 0));
}

function Tokens(s, r, c, t) {
  this.txt = s;
  if (s[1] == ':') {
    if (_isLetter(s[0])) t = s[0];
  }
  return { r: r, c: c, x: s };
}
var _A = 'A'.charCodeAt(0);
var _Z = 'Z'.charCodeAt(0);
var _a = 'a'.charCodeAt(0);
var _z = 'z'.charCodeAt(0);
function _isLetter(c) {
  c = c.charCodeAt(0);
  return c >= _A && c <= _Z || c >= _a && c <= _z;
}

module.exports = {
  Parser: Parser
};