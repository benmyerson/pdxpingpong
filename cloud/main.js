var _ = require('underscore'),
    util = require('cloud/util'),
    relay = require('cloud/relay');

var getGameWinner = function getGameWinner(game) {
    return game.get('player1Score') >
                game.get('player2Score') ?
                    game.get('player1') :
                    game.get('player2');
};

var getGameLoser = function getGameLoser(game) {
    return game.get('player1Score') <
                game.get('player2Score') ?
                    game.get('player1') :
                    game.get('player2');
};

var isNewObject = function isNewObject(o) {
    return +o.createdAt === +o.updatedAt;
};

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
                .then(function(game) {
                    ret.lastGame = game;
                    response.success(ret);
                },
                function(error) {
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
    var winner = getGameWinner(game);
    var loser = getGameLoser(game);
    var winnerPoints = Math.max(game.get('player1Score'), game.get('player2Score'));
    var loserPoints = Math.min(game.get('player1Score'), game.get('player2Score'));

    var Player = Parse.Object.extend("Player");
    var winnerQuery = new Parse.Query(Player);
    var loserQuery = new Parse.Query(Player);

    // run Player queries in parallel
    util.Promise.all([
        winnerQuery.get(winner.id),
        loserQuery.get(loser.id)
    ]).spread(function success(winner, loser) {
        var winPercentage,
            pointsPerGame,
            opponentPointsPerGame

        /////////////////
        // Winner updates
        /////////////////

        winner.increment("games");
        winner.increment("wins");
        winner.increment("totalPoints", winnerPoints);
        winner.increment("ratedGames");
        winner.increment("opponentTotalPoints", loserPoints);

        winPercentage = winner.get("wins") / winner.get("games");
        pointsPerGame = winner.get("totalPoints") / winner.get("games");
        opponentPointsPerGame = winner.get("opponentTotalPoints") / winner.get("games");

        winner.set("winPercentage", winPercentage);
        winner.set("pointsPerGame", pointsPerGame);
        winner.set("opponentPointsPerGame", opponentPointsPerGame);

        if (winner.get("streak") > 0) {
            winner.increment("streak");
        } else {
            winner.set("streak", 1);
        }

        ////////////////
        // Loser updates
        ////////////////

        loser.increment("games");
        loser.increment("losses");
        loser.increment("totalPoints", loserPoints);
        loser.increment("ratedGames");
        loser.increment("opponentTotalPoints", winnerPoints);

        winPercentage = loser.get("wins") / loser.get("games");
        pointsPerGame = loser.get("totalPoints") / loser.get("games");
        opponentPointsPerGame = loser.get("opponentTotalPoints") / loser.get("games");

        loser.set("winPercentage", winPercentage);
        loser.set("pointsPerGame", pointsPerGame);
        loser.set("opponentPointsPerGame", opponentPointsPerGame);

        if (loser.get("streak") < 0) {
            loser.increment("streak", -1);
        } else {
            loser.set("streak", -1);
        }

        return [winner, loser]
    }).spread(function(winner, loser) {
        updatePlayerRatings(winner, loser, game);

        winner.save();
        loser.save();

        response.success(game);
    },
    function(err) {
        response.error(err);
    });
});

Parse.Cloud.afterSave('Game', function(request) {
    var Game = Parse.Object.extend("Game"),
        gameQuery = new Parse.Query(Game);
    gameQuery.get(request.object.id).then(function(game) {
        var gameId = game.id,
            verb = isNewObject(game) ? 'create' : 'update';
        relay.publish('game.' + verb, gameId);
    });
});

Parse.Cloud.afterSave('Player', function(request) {
    var Player = Parse.Object.extend("Player"),
        playerQuery = new Parse.Query(Player);
    playerQuery.get(request.object.id).then(function(player) {
        var playerId = player.id,
            verb = isNewObject(player) ? 'create' : 'update';
        relay.publish('player.' + verb, playerId);
    });
});

/*
 * For non-provisional players, adjust the player's rating based on
 * the game outcome and the opponent's rating.
 * https://en.wikipedia.org/wiki/Elo_rating_system#Mathematical_details
 */
function computeEloRating(player, playerRating, opponentRating, playerWon) {
    /*
     * Assuming 0 points for a loss and 1 for a win, compute the
     * expected (average) score for this player against this
     * opponent.
     */

    var deltaRating = opponentRating - playerRating;

    var ln10over400 = 5.76e-3;
    var expected = 1 / (1 + Math.exp(ln10over400 * deltaRating));
    var actual = playerWon ? 1 : 0;

    /*
     * This "K factor" is arbitrary. It represents the largest number of points
     * that can be gained or lost by a single game. And when two equally-rated
     * players play, each will gain or lose half this amount.
     */
    var K = 40;
    var rating = rating + K * (actual - expected);
    player.set("rating", rating);
}

/*
 * Performance rating for the first few games to seed a player's rating.
 * Average of the ratings of the first N players, +400 for each
 * win and -400 for each loss.
 * https://en.wikipedia.org/wiki/Elo_rating_system#Performance_rating
 */
function computeProvisionalRating(player, playerRating, opponentRating, playerWon) {
    var games = player.get("ratedGames");

    var delta = playerWon ? 400 : -400;

    var rating = (games * playerRating + opponentRating + delta) / (games + 1);
    player.set("rating", rating);
}

function updatePlayerRating(player, playerRating, opponentRating, playerWon) {
    /*
     * Players are provisional until they complete this many rated
     * games.
     */
    var numProvisionalGames = 6;

    if (player.get("ratedGames") > numProvisionalGames) {
        computeEloRating(player, playerRating, opponentRating, playerWon);
    } else {
        computeProvisionalRating(player, playerRating, opponentRating, playerWon);
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

    var winnerRating = winner.get("rating");
    var loserRating = loser.get("rating");

    updatePlayerRating(winner, winnerRating, loserRating, true);
    updatePlayerRating(loser, loserRating, winnerRating, false);
}
