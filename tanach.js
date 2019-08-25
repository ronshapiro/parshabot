var fs = require('fs');

var loadBook = function(name) {
  return JSON.parse(fs.readFileSync("sefaria-data/books/" + name + ".json"));
}

var tanach = {}

module.exports.get = function(name) {
  if (!tanach[name]) {
    tanach[name] = loadBook(name);
  }
  return tanach[name];
}


