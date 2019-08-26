var parseXml = require('xml2js').parseString;
var request = require('request');
var {HEBREW, ENGLISH} = require("./languages.js");
var tanach = require("./tanach.js");
var mathjs = require("mathjs");
// TODO: sort imports

var requestSedra = function(url, callback) {
  request(
    url,
    function(error, response, body) {
      if (error) {
        callback(error, null);
        return;
      }

      try {
        callback(null, JSON.parse(body));
      } catch (jsonError) {
        callback(jsonError, null);
      }
    }
  );
}

// Deuteronomy 12:15 - 14:3
var aliyaPattern = /(.*) (\d{1,3}):(\d{1,3}) - (\d{1,3}):(\d{1,3})/;

function extractAliyaData(aliya) {
  var matches = aliya.match(aliyaPattern)
  return {
    book: matches[1],
    startChapter: parseInt(matches[2]),
    startVerse: parseInt(matches[3]),
    lastChapter: parseInt(matches[4]),
    lastVerse: parseInt(matches[5]),
  };
}

function extractAliyotData(aliyot) {
  return {
    1: extractAliyaData(aliyot["1"]),
    2: extractAliyaData(aliyot["2"]),
    3: extractAliyaData(aliyot["3"]),
    4: extractAliyaData(aliyot["4"]),
    5: extractAliyaData(aliyot["5"]),
    6: extractAliyaData(aliyot["6"]),
    7: extractAliyaData(aliyot["7"]),
  }
}

var requestAliyot = function(url, callback) {
  requestSedra(
    url,
    function(error, json) {
      if (error) {
        callback(error, null);
        return;
      }

      json.items.forEach(item => {
        if (item.category === "parashat") {
          callback(null, extractAliyotData(item.leyning));
        }
      });
    });
}

var forEachVerse = function(aliya, lang, receiver) {
  var currentVerse = aliya.startVerse;
  for (var currentChapter = aliya.startChapter;
       currentChapter <= aliya.lastChapter;
       currentChapter++) {
    var chapterText = tanach.get(aliya.book, lang).text[currentChapter - 1];
    var lastVerseIndex =
        currentChapter === aliya.lastChapter ? aliya.lastVerse : chapterText.length;
    chapterText.slice(currentVerse - 1, lastVerseIndex).forEach(receiver);
    currentVerse = 1;
  }
}

var countVersesPerAliya = function(aliyot) {
  var output = {}
  for (var k in aliyot) {
    var aliya = aliyot[k];
    var counter = 0;
    forEachVerse(aliya, HEBREW, verse => counter++);
    output[k] = counter;
  }
  return output;
}

var findAliyaToDoublePack = function(aliyot) {
  var versesPerAliya = countVersesPerAliya(aliyot);
  var minStandardDeviation = Number.MAX_SAFE_INTEGER;
  var aliyaToMerge = null;
  for (var k in versesPerAliya) {
    if (k === '1') continue;
    var versesArray = [];
    for (var k2 in versesPerAliya) {
      var nextValue = versesPerAliya[k2];
      if (k === k2) {
        nextValue += versesArray.pop();
      }
      versesArray.push(nextValue);
    }

    var currentStandardDeviation = mathjs.std(versesArray);
    if (currentStandardDeviation < minStandardDeviation) {
      minStandardDeviation = currentStandardDeviation;
      aliyaToMerge = k;
    }
  }

  return aliyaToMerge;
}

var computeAliyotPerDay = function(aliyot) {
  var aliyaToMerge = findAliyaToDoublePack(aliyot);
  var output = {};

  var dayOfWeek = 1;
  for (var k in aliyot) {
    if (k === aliyaToMerge) {
      output[dayOfWeek - 1].push(aliyot[k]);
    } else {
      output[dayOfWeek] = [aliyot[k]];
      dayOfWeek++;
    }
  }
  return output;
}

var requestAliyotPerDay = function(url, callback) {
  requestAliyot(url, function(error, aliyot) {
    if (error) {
      callback(error, null);
    } else {
      callback(null, computeAliyotPerDay(aliyot));
    }
  });
}

module.exports = {
  forEachVerse: forEachVerse,
  requestAliyotPerDay: requestAliyotPerDay,
}
