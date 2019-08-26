var sedra = require("./sedra.js");

var logAliyaToConsole = function(aliya, lang) {
  var first = true;
  sedra.forEachVerse(aliya, lang, verse => {
    if (first) {
      console.log(verse);
      first = false;
    } else {
      console.log(" - " + verse);
    }
  });
}

module.exports = logAliyaToConsole;
