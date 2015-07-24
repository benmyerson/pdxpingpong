var _ = require('underscore');
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
});


Parse.Cloud.define("winPerc", function(request, response) {
    var Player = Parse.Object.extend("Player");
    var query = new Parse.Query(Player);

    query.limit(20);
    query.find({
        success: function(results) {
            response.success(results);
        },
        error: function () {
            response.error("couldn't get scores")
        }
    })
});
