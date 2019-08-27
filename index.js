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
  if (DateTime.utc().setZone(timezones.israel).hour < 15) {
    // Don't tweet before 3pm in Israel, which is 8am in NYC, or 5am in Los Angeles.
    // This seems like a happy medium
    return;
  }

  sedra.requestAliyotPerDay(
    // 281184 = Jerusalem
    // 5128581 = NYC
    // TODO: make a locations object
    "https://www.hebcal.com/shabbat/?cfg=json&geonameid=281184&m=0&a=off",
    function(error, data) {
      if (error) {
        console.log(error);
        return;
      }

      var dayIndex = dayOfWeekAsInt(timezones.israel);
      var aliyot = data.aliyotPerDay[dayIndex];

      if (!aliyot) {
        // i.e. Shabbat, or Chag
      }

      aliyot.forEach(aliya => {
        realTweeter.ifAliyaHasNotBeenTweeted(aliya, data.parsha, () => {
          realTweeter.tweetAliya(aliya, data.parsha, HEBREW)
        });
      });
    });
};

setInterval(tweetIfNecessary, Duration.fromObject({hours: 1}).as("milliseconds").milliseconds);

if (process.env.on_heroku) {
  var express_app = require("express")();
  express_app.get("/", (req, res) => res.send("@ParshaBot"));
  express_app.listen(process.env.PORT, () => console.log("Listening on port: " + process.env.PORT));

  setInterval(() => {
    // Ping ourselves repeatedly so that Heroku never shuts us down. That way no external cron job
    // is necessary.
    // TODO: check to make sure this works even after dynos restart. If not, then instead perhaps
    // Google Apps Script's UrlFetchApp.fetch() is a decent way to set up a cron to ping this server
    request("https://parshabot-ronsh.herokuapp.com", () => {});
  }, 30 * 1000);
}

// TODO: rename to WeeklyTorah
// TODO: don't tweet on YomTov https://www.hebcal.com/home/195/jewish-calendar-rest-api
