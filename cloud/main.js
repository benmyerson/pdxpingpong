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

Parse.Cloud.beforeSave("Game", function(request, response) {
    var game = request.object;
    var winner = game.get('player1Score') > game.get('player2Score') ? game.get('player1') : game.get('player2');
    var winnerPoints = Math.max(game.get('player1Score'),game.get('player2Score'));
    var loser = winner === game.get('player1') ? game.get('player2') : game.get('player1');
    var loserPoints = Math.min(game.get('player1Score'),game.get('player2Score'));

    var Player = Parse.Object.extend("Player");
    var winnerQ = new Parse.Query(Player);
    var loserQ = new Parse.Query(Player);
    var winner, loser;
    winnerQ.get(winner.id).then(function(player) {
            winner = player;
            player.increment("games");
            player.increment("wins");
            player.increment("totalPoints", winnerPoints);
            player.increment("ratedGames");
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
            return player.save();
        }
    ).then(function() {
        return loserQ.get(loser.id);
    }).then(function(player) {
            loser=player;
            player.increment("games");
            player.increment("losses");
            player.increment("totalPoints", loserPoints);
            player.increment("ratedGames");
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

           return player.save();
        }
    ).then(function () {
        updatePlayerRatings(winner, loser, game);
        winner.save();
        loser.save();

        response.success();
    },
    function (err) {
        response.error(err);
    });
});

/*
 * For non-provisional players, adjust the player's rating based on
 * the game outcome and the opponent's rating.
 * https://en.wikipedia.org/wiki/Elo_rating_system#Mathematical_details
 */
function computeEloRating(player, opponentRating, playerWon) {
    /*
     * Assuming 0 points for a loss and 1 for a win, compute the
     * expected (average) score for this player against this
     * opponent.
     */

    var rating = player.get("rating");
    var deltaRating = opponentRating - rating;

    var ln10over400 = 5.76e-3;
    var expected = 1/(1 + Math.exp(ln10over400 * deltaRating));
    var actual = playerWon ? 1 : 0;

    /*
     * This "K factor" is arbitrary. It represents the largest number of points
     * that can be gained or lost by a single game. And when two equally-rated
     * players play, each will gain or lose half this amount.
     */
    var K = 40;
    rating += K * (actual - expected);
    player.set("rating", rating);
}

/*
 * Performance rating for the first few games to seed a player's rating.
 * Average of the ratings of the first N players, +400 for each
 * win and -400 for each loss.
 * https://en.wikipedia.org/wiki/Elo_rating_system#Performance_rating
 */
function computeProvisionalRating(player, opponentRating, playerWon) {
    var games = player.get("ratedGames");
    var rating = player.get("rating");

    var delta = playerWon ? 400 : -400

    rating = (games * rating + opponentRating + delta)/(games + 1);
    player.set("rating", rating);
}

function updatePlayerRating(player, opponentRating, playerWon) {
    /*
     * Players are provisional until they complete this many rated
     * games.
     */
    var numProvisionalGames = 6;

    if (player.get("ratedGames") > numProvisionalGames) {
        computeEloRating(player, opponentRating, playerWon);
    }
    else {
        computeProvisionalRating(player, opponentRating, playerWon);
    }
}

function updatePlayerRatings(winner, loser, game) {
    /*
     * For historical purposes, record the rating of each player whenever
     * a game is saved. The rating saved is each player's rating before
     * the game.
     */
    var player1 = game.get("player1");
    var player2 = game.get("player2");
    game.set("player1Rating", player1.get("rating"));
    game.set("player2Rating", player2.get("rating"));
    //game.save();

    updatePlayerRating(winner, loser.get("rating"), true);
    updatePlayerRating(loser, winner.get("rating"), false);
}
