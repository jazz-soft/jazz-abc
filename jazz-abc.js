function Parser(s) {
  this.txt = s;
  this.data = [];
  var lines = s.split(/\r?\n|\r/);
  for (var i = 0; i < lines.length; i++) this.data.push(new Tokens(lines[i], i))
}

function Tokens(s) {
}

module.exports = {
  Parser: Parser
};