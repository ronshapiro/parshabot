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
  // roughly with aliyot
  asInt++;
  if (asInt === 8) {
    asInt = 1;
  }
  return asInt;
}

var twitterApi = initializeTwitter();

sedra.requestAliyot(function(error, aliyot) {
  console.log(aliyot[dayOfWeekAsInt(timezones.nyc).toString()]);
});

/*
  twitterApi.post('statuses/update', { status: aliyot['1'] }, function(err, data, response) {
    // console.log(data)
  })
*/  




