var sedra = require("./sedra.js");
var initializeTwitter = require("./initializeTwitter.js");
var {DateTime, Duration, IANAZone} = require("luxon");
var splitVerse = require("./splitVerse.js");
var {HEBREW, ENGLISH} = require("./languages.js");
var consoleTweeter = require('./consoleTweeter');
var request = require("request");
// TODO: sort imports

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

var realTweeter = initializeTwitter();

var tweetIfNecessary = function() {
  var timeInIsrael = DateTime.utc().setZone(timezones.israel);
  if (timeInIsrael.hour < 15) {
    // Don't tweet before 3pm in Israel, which is 8am in NYC, or 5am in Los Angeles.
    // This seems like a happy medium
    console.log("Not tweeting at: " + timeInIsrael.toRFC2822());
    return;
  }

  sedra.requestAliyotPerDay(
    // 281184 = Jerusalem
    // 5128581 = NYC
    // TODO: make a locations object
    "https://www.hebcal.com/shabbat/?cfg=json&geonameid=281184&m=0&a=off",
    function(error, data) {
      if (error) {
        console.error(error);
        return;
      }

      var dayIndex = dayOfWeekAsInt(timezones.israel);
      var aliyot = data.aliyotPerDay[dayIndex];

      if (!aliyot) {
        // i.e. Shabbat, or Chag
        console.log("No aliyot, not tweeting");
        return;
      }

      aliyot.forEach(aliya => {
        realTweeter.ifAliyaHasNotBeenTweeted(aliya, data.parsha, () => {
          realTweeter.tweetAliya(aliya, data.parsha, HEBREW)
        });
      });
    });
};

if (process.env.on_heroku) {
  var express_app = require("express")();
  express_app.get("/", (req, res) => res.send("@ParshaBot"));
  // Note: an external service is necessary to ping this periodically. Alternatively, we could
  // use setInterval() here and manage our own timing, but on Heroku, dynos may be shutdown if they
  // sit idle. Frequently pinging ourselves seemed like a viable option, but that seems wasteful of
  // their resources.
  express_app.get("/tweet_if_necessary", (req, res) => {
    setTimeout(tweetIfNecessary, Duration.fromObject({seconds: 3}).as("milliseconds"));
    res.send("Received");
  });
  express_app.listen(process.env.PORT, () => {});
}

// TODO: rename to WeeklyTorah
// TODO: don't tweet on YomTov https://www.hebcal.com/home/195/jewish-calendar-rest-api
