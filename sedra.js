var parseXml = require('xml2js').parseString;
var request = require('request');

var rssXmlHandler = function(error, xml) {
  var thisWeek = xml.rss.channel[0].item[0].description[0];
  console.log(thisWeek);
}

var rssHttpHandler = function(error, response, body) {
  console.log(body);
  parseXml(body, rssXmlHandler);
}


// 281184 = Jerusalem
// 5128581 = NYC
// https://www.hebcal.com/shabbat/?cfg=json&geonameid=281184&m=0&a=off

// https://www.hebcal.com/sedrot/index.xml
// https://www.hebcal.com/sedrot/israel.xml
// https://www.hebcal.com/sedrot/israel-he.xml

/*
module.exports.requestSedra = function() {
  request("https://www.hebcal.com/sedrot/index.xml", rssHttpHandler);
}
*/

requestSedra = function(callback) {
  request(
    "https://www.hebcal.com/shabbat/?cfg=json&geonameid=281184&m=0&a=off",
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

module.exports.requestAliyot = function(callback) {
  requestSedra(function(error, json) {
    if (error) {
      callback(error, null);
      return;
    }
      
    json.items.forEach(item => {
      if (item.category === "parashat") {
        callback(null, item.leyning);
      }
    });
  });
}
