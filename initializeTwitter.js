var Twit = require('twit');
var fs = require('fs');

function requiredGet(obj, key) {
  if (obj.hasOwnProperty(key)) {
    return obj[key];
  }
  throw key + " not found in " + obj;
}

function options() {
  var secrets = JSON.parse(fs.readFileSync('secrets.json'))
  
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

module.exports = () => new Twit(options());

