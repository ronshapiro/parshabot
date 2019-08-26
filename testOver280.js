var splitVerse = require("./splitVerse.js");
var {HEBREW, ENGLISH} = require("./languages.js");

var tanach = require("./tanach.js");

["Deuteronomy", "Exodus", "Genesis", "Leviticus", "Numbers"].forEach(book => {
  tanach.get(book, HEBREW).text.forEach(chapter => {
    chapter.forEach(verse => {
      if (verse.length > 280) {
        var first = true;
        splitVerse(verse).forEach(b => console.log(b));
        console.log();
      }
    });
  });
});
