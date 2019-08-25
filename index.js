var sedra = require("./sedra.js");
var initializeTwitter = require("./initializeTwitter.js");
var {DateTime, IANAZone} = require("luxon");

var timezones = {
  israel: IANAZone.create("Asia/Jerusalem"),
  nyc: IANAZone.create("America/New_York"),
}

function dayOfWeekAsInt(timezone) {
  var asInt = DateTime.utc().setZone(timezone).weekday;
  // Luxon treats Monday = 1, Tuesday = 2, ... Sunday = 7. Adjust so that Sunday = 1 to align
  // with Hebrew day-of-week ordering
  asInt++;
  if (asInt === 8) {
    asInt = 1;
  }
  return asInt;
}

var twitterApi = initializeTwitter();

var tweetAliya = function(aliya) {
  /*
  twitterApi.post('statuses/update', { status: aliyot['1'] }, function(err, data, response) {
    // console.log(data)
  })
  */  

  var first = true;
  sedra.forEachVerse(aliya, verse => {
    if (first) {
      // console.log(verse);
      first = false;
    } else {
      // console.log(" - " + verse);
    }
  });
}

sedra.requestAliyotPerDay(
  // 281184 = Jerusalem
  // 5128581 = NYC
  // TODO: make a locations object
  "https://www.hebcal.com/shabbat/?cfg=json&geonameid=281184&m=0&a=off",
  function(error, aliyotPerDay) {
    if (error) {
      console.log(error);
    }

    var dayIndex = dayOfWeekAsInt(timezones.israel);
    aliyotPerDay[dayIndex].forEach(tweetAliya);
  });


var splitOnLast = function(verse, splitOn) {
  // Use 275 so there's enough space for the splitOn character, a space, and an ellipsis
  var splittingIndex = verse.lastIndexOf(splitOn, 275);
  if (splittingIndex === -1) {
    return undefined;
  } else {
    // We could use a unicode ellipsis if we want. Twitter seems to treat that as 2 characters, so 3
    // periods seems more straightforward now (and 1 character seems like a micro optimization)
    var breaks = [verse.slice(0, splittingIndex) + splitOn + " ..."];
    var rest = "... " + verse.slice(splittingIndex + 1);
    splitVerse(rest).forEach(b => breaks.push(b));
    return breaks;
  }
}

var splitVerse = function(verse) {
  if (verse.length <= 280) {
    return [verse];
  }
  var split =
      splitOnLast(verse, ",") ||
      splitOnLast(verse, ":") ||
      splitOnLast(verse, "׀");
  if (split) {
    return split;
  }
  throw "Can't figure out how to split `" + verse + "` into multiple tweets";
}

var tanach = require("./tanach.js");

["Deuteronomy", "Exodus", "Genesis", "Leviticus", "Numbers"].forEach(book => {
  tanach.getHebrew(book).text.forEach(chapter => {
    chapter.forEach(verse => {
      if (verse.length > 280) {
        var first = true;
        splitVerse(verse).forEach(b => console.log(b));
        console.log();
      }
    });
  });
});
