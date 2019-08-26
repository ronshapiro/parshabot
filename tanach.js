var fs = require('fs');
var {HEBREW, ENGLISH} = require("./languages.js");

var loadBook = function(folder, name) {
  return JSON.parse(fs.readFileSync("sefaria-data/" + folder + "/" + name + ".json"));
}

var tanach = {
  english: {},
  hebrew: {}
}

module.exports.get = function(name, lang) {
  var id;
  if (lang == HEBREW) {
    id = "hebrew";
  } else if (lang == ENGLISH) {
    id = "english";
  } else {
    throw "Unknown language: " + lang;
  }

  if (!tanach[id][name]) {
    tanach[id][name] = loadBook("books-" + id, name);
  }
  return tanach[id][name];
}
