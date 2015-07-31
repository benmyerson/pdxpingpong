var _ = require('underscore');
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
    response.success("Hello world!");
});

Parse.Cloud.define("mainStats", function(request, response) {
    var ret = {
        totalPoints: 0,
        totalGames: 0,
        lastGame: {},
        winnerStreak: 0
    };
    var Game = Parse.Object.extend("Game");
    var query = new Parse.Query(Game);

    query.descending("createdAt");

    query.find({
        success: function (results) {
            console.log(results);
            ret.totalGames = results.length;
            ret.lastGame = results[0];

            var winner = lastGame.player1Score > lastGame.player2Score ? lastGame.player1 : lastGame.player2;
            for (var i = 0; i < results.length; i++) {
                ret.totalPoints += results[i].player1Score + results[i].player2Score;
                if (winner !== null) {
                    var currGameWinner = results[i].player1Score > results[i].player2Score ? results[i].player1 : results[i].player2;
                    if (winner === currGameWinner) {
                        ret.winnerStreak ++;
                    }else {
                        winner = null;
                    }
                }
            }
        },
        error: function (error) {
            console.log("Error!!");
            console.log(error);
        }
    });

    response.success(ret);

});

Parse.Cloud.afterSave("Game", function(request) {
    var game = request.object;
    var winner = game.get('player1Score') > game.get('player2Score') ? game.get('player1') : game.get('player2');
    var winnerPoints = Math.max(game.get('player1Score'),game.get('player2Score'));
    var loser = winner === game.get('player1') ? game.get('player2') : game.get('player1');
    var loserPoints = Math.min(game.get('player1Score'),game.get('player2Score'));

    var Player = Parse.Object.extend("Player");
    var winnerQ = new Parse.Query(Player);

    winnerQ.get(winner.id, {
        success: function(player) {

            player.increment("games");
            player.increment("wins");
            player.increment("totalPoints", winnerPoints);
            player.increment("opponentTotalPoints", loserPoints);
            var winPerc = player.get("wins") / player.get("games");
            var ppG = player.get("totalPoints") / player.get("games");
            var oppG = player.get("opponentTotalPoints") / player.get("games");
            player.set("winPercentage", winPerc);
            player.set("pointsPerGame", ppG);
            player.set("opponentPointsPerGame", oppG);
            player.save();
        },
        error: function () {
            console.log("couldn't find winner player");
        }
    });
    var loserQ = new Parse.Query(Player);
    loserQ.get(loser.id, {
        success: function(player) {

            player.increment("games");
            player.increment("losses");
            player.increment("totalPoints", loserPoints);
            player.increment("opponentTotalPoints", winnerPoints);
            var winPerc = player.get("wins") / player.get("games");
            var ppG = player.get("totalPoints") / player.get("games");
            var oppG = player.get("opponentTotalPoints") / player.get("games");
            player.set("winPercentage", winPerc);
            player.set("pointsPerGame", ppG);
            player.set("opponentPointsPerGame", oppG);
            player.save();
        },
        error: function () {
            console.log("couldn't find loser player");
        }
    });
});
