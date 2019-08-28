var fs = require('fs');
var {HEBREW, ENGLISH} = require("./languages.js");
var sedra = require('./sedra.js');
var splitVerse = require('./splitVerse.js');
var Twit = require('twit');
var {DateTime} = require("luxon");

function requiredGet(obj, key) {
  if (obj.hasOwnProperty(key)) {
    return obj[key];
  }
  throw key + " not found in " + obj;
}

function loadSecrets() {
  if (process.env.parshabot_use_secret_from_env) {
    return process.env;
  }

  return JSON.parse(fs.readFileSync('secrets.json'))
}

function options() {
  var secrets = loadSecrets();

  var twitOptions = {}
  // copy the options to make sure that they're all available, and nothing else is present
  twitOptions["consumer_key"] = requiredGet(secrets, "consumer_key")
  twitOptions["consumer_secret"] = requiredGet(secrets, "consumer_secret")
  twitOptions["access_token"] = requiredGet(secrets, "access_token")
  twitOptions["access_token_secret"] = requiredGet(secrets, "access_token_secret")

  twitOptions["timeout_ms"] = 60*1000
  twitOptions["strictSSL"] = true

  return twitOptions;
}

var chainAppend = function(previous, text) {
  if (Object.keys(previous).length === 0) {
    previous.text = text;
    return previous;
  }
  previous.next = {text: text};
  previous = previous.next;
  return previous;
};

var aliyaNumberToHebrew = {
  1: "ראשון",
  2: "שני",
  3: "שלישי",
  4: "רביעי",
  5: "חמישי",
  6: "שישי",
  7: "שביעי",
}

var formatAliyaHeader = function(aliya, parsha) {
  return parsha.hebrew + " | " + parsha.english + "\n" + aliyaNumberToHebrew[aliya.aliyaNumber];
}

var buildTweetChain = function(aliya, parsha, lang) {
  var chain = {text: formatAliyaHeader(aliya, parsha)};
  var previous = chain;

  var hebrewVerses = [];
  var englishVerses = [];
  sedra.forEachVerse(aliya, HEBREW, verse => hebrewVerses.push(verse));
  sedra.forEachVerse(aliya, ENGLISH, verse => englishVerses.push(verse));

  for (var i = 0; i < hebrewVerses.length; i++) {
    var hebrewSplits = splitVerse(hebrewVerses[i]);
    var firstHebrew = chainAppend(previous, hebrewSplits[0]);
    previous = firstHebrew;
    for (var j = 1; j < hebrewSplits.length; j++) {
      previous = chainAppend(previous, hebrewSplits[j]);
    }

    var englishSplits = splitVerse(englishVerses[i]);
    var englishPrevious = firstHebrew.english = {};
    for (var j = 0; j < englishSplits.length; j++) {
      englishPrevious = chainAppend(englishPrevious, englishSplits[j]);
    }
  }
  return chain;
}


// TODO: give this file a better name (perhaps twitterClient.js)
module.exports = function() {
  twitterApi = new Twit(options());

  var newTweet = function(tweet, lastTweetId) {
    if (tweet === undefined) {
      return;
    }
    var parameters = {status: tweet.text};
    if (lastTweetId) {
      parameters["in_reply_to_status_id"] = lastTweetId;
      parameters["auto_populate_reply_metadata"] = true;
    }
    twitterApi.post('statuses/update', parameters, function(error, data, response) {
      // TODO: confirm that this tweet succeeded. If not, exponential backoff
      if (error) {
        console.error(error);
      } else {
        console.log(data);
      }

      newTweet(tweet.next, data.id_str);

      // Delay English tweets slightly so that Twitter creates a single thread for all of the Hebrew
      setTimeout(() => {
        newTweet(tweet.english, data.id_str);
      }, 2000);
    });
  };

  return {
    ifAliyaHasNotBeenTweeted: function(aliya, parsha, callback) {
      // A rough estimate for a recency of when to search. Should be more than enough
      var twoWeeksAgo = DateTime.utc().minus({weeks: 2});
      twitterApi.get(
        "search/tweets",
        {q: '"' + formatAliyaHeader(aliya, parsha) + '"'
         + " from:parshabot since:" + twoWeeksAgo.toFormat("yyyy-LL-dd")},
        function(error, data, response) {
          if (error) {
            console.error(error);
          } else if (data.statuses.length > 0) {
            console.log("Already tweeted: " + data.statuses[0].text);
          } else {
            callback();
          }
        });
    },
    tweetAliya: function(aliya, parsha, lang) {
      var tweetChain = buildTweetChain(aliya, parsha, lang);
      newTweet(tweetChain);
    },
  };
}
