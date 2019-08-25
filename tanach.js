var fs = require('fs');

var loadBook = function(folder, name) {
  return JSON.parse(fs.readFileSync("sefaria-data/" + folder + "/" + name + ".json"));
}

var tanach = {
  english: {},
  hebrew: {}
}

var createGet = function(lang) {
  return function(name) {
    if (!tanach[lang][name]) {
      tanach[lang][name] = loadBook("books-" + lang, name);
    }
    return tanach[lang][name];
  }
}

module.exports.getEnglish = createGet("english")
module.exports.getHebrew = createGet("hebrew")
