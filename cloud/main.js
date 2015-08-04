var _ = require('underscore');
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
var getGameWinner = function getGameWinner(game) {
    return game.get('player1Score') >
               game.get('player2Score') ?
                  game.get('player1') :
                  game.get('player2');
}

var getGameLoser = function getGameLoser(game) {
    return game.get('player1Score') <
                game.get('player2Score') ?
                    game.get('player1') :
                    game.get('player2');
}

Parse.Cloud.define("mainStats", function(request, response) {
    var ret = {
        totalPoints: 0,
        totalGames: 0,
        lastGame: {}
    };
    var Game = Parse.Object.extend("Game");
    var query = new Parse.Query(Game);

    // cannot iterate on a query with sort, skip, or limit :/
    // query.descending("createdAt");

    query.each(function(game) {
        var player1Score = game.get('player1Score'),
            player2Score = game.get('player2Score');

        ret.totalGames += 1;
        ret.totalPoints += player1Score + player2Score;

    }, {
        success: function() {
            query = new Parse.Query(Game);
            query.include("player1")
                .include("player2")
                .descending("createdAt")
                .first()
                .then(function (game) {
                    ret.lastGame = game;
                    response.success(ret);
                },
                function (error) {
                    response.error(error)
                });
        },
        error: function(error) {
            response.error(error);
        }
    });
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

            if (player.get("streak") > 0){
                player.increment("streak");
            } else {
                player.set("streak", 1);
            }
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
            console.log("loser streak" + player.get("streak"));
            if (player.get("streak") < 0){
                player.increment("streak", -1);
            } else {
                player.set("streak", -1);
            }

            player.save();
        },
        error: function () {
            console.log("couldn't find loser player");
        }
    });
});
