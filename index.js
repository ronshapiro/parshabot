var Twit = require('twit');
var fs = require('fs');
var sedra = require("./sedra.js");
var initializeTwitter = require("./initializeTwitter.js");

var twitterApi = initializeTwitter();

sedra.requestAliyot(function(error, aliyot) {
  
});

/*
  twitterApi.post('statuses/update', { status: aliyot['1'] }, function(err, data, response) {
    // console.log(data)
  })
*/  



