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

module.exports = splitVerse
