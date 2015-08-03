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

    function getGameWinner(game) {
        return game.get('player1Score') >
               game.get('player2Score') ?
                  game.get('player1') :
                  game.get('player2');
    }

    // cannot iterate on a query with sort, skip, or limit :/
    // query.descending("createdAt");

    var last;
    query.each(function(game) {
        var player1Score = game.get('player1Score'),
            player2Score = game.get('player2Score'),
            lastWinner = getGameWinner(last || game),
            winner = getGameWinner(game);

        ret.totalGames += 1;
        ret.totalPoints += player1Score + player2Score;

        if (last && lastWinner.id === winner.id) {
            ret.winnerStreak += 1;
        }

        last = game;
    }, {
        success: function() {
            response.success(ret);
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
