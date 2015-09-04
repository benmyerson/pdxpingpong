var _ = require('underscore'),
    util = require('cloud/util'),
    rating = require('cloud/rating'),
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
    var KFactor = game.get("KFactor");
    var season = game.get("season");
    /*
     * Only execute the following for new games
     */
    if (KFactor) {
        response.success(game);
        return;
    }

    var winner = getGameWinner(game);
    var loser = getGameLoser(game);
    var winnerPoints = Math.max(game.get('player1Score'), game.get('player2Score'));
    var loserPoints = Math.min(game.get('player1Score'), game.get('player2Score'));

    var Player = Parse.Object.extend("SeasonPlayer");
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
        var KFactor = 32;
        if (winner.get("ratedGames") < 6 || loser.get("ratedGames") < 6) {
            KFactor = 24;
        }
        game.set("KFactor", KFactor);

        rating.updatePlayerRatings(winner, loser, winnerPoints, loserPoints, game);

        return util.Promise.all([winner.save(), loser.save()]);
    }).then(function() {
        response.success(game);
    }, function(err) {
        response.error(err);
    });
});

Parse.Cloud.beforeSave('Player', function(request, response) {
    var player = request.object;
    var rating = player.get("rating");
    var name = player.get("name");
    if (!name) {
        response.error("can't save Player without a name");
        return;
    }

    if (!rating) {
        /*
         * New player. Set appropriate defaults.
         */

        /*
         * First look up the PDX team.
         */
        var Team = Parse.Object.extend("Team");
        var teamQuery = new Parse.Query(Team);
        teamQuery.equalTo("name", "PDX");
        teamQuery.limit(1);
        teamQuery.find({
            success: function(results) {
                var pdx = results[0];

                /*
                 * Defaults for all new players.
                 */
                player.set("rating", 1200);
                player.set("ratedGames", 0);
                player.set("games", 0);
                player.set("wins", 0);
                player.set("losses", 0);
                player.set("winPercentage", 0);
                player.set("totalPoints", 0);
                player.set("pointsPerGame", 0);
                player.set("opponentPointsPerGame", 0);
                player.set("opponentTotalPoints", 0);
                player.set("streak", 0);
                player.set("team", pdx);

                response.success();
            }, error: function(error) {
                console.log("could not find team PDX: " + error);
            }
        });
        return;
    }

    player.set("isProvisional", player.get("ratedGames") < 6);

    response.success();
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


Parse.Cloud.beforeSave('Season', function(request) {
    var season = request.object;
    var Profile = new Parse.Object.extend("Profile"),
        Player = new Parse.Object.extend("Player"),
        allProfiles = new Parse.Query(Profile);

    if (isNewObject(season)) {
        allProfiles.each(function(profile) {
            var seasonPlayer = new Player();
            seasonPlayer.set("season", season);
            seasonPlayer.set("profile", profile);
            seasonPlayer.set("games", 0);
            seasonPlayer.set("wins", 0;)
            seasonPlayer.set("losses", 0);
            seasonPlayer.set("opponentPointsPerGame", 0;)
            seasonPlayer.set("pointsPerGame", 0);
            seasonPlayer.set("totalPoints", 0);
            seasonPlayer.set("winPercentage", 0);
            seasonPlayer.set("opponentTotalPoints", 0);
            seasonPlayer.set("streak", 0);
            seasonPlayer.set("ratedGames", 0);
            seasonPlayer.set("rating", 1200);
            seasonPlayer.set("provisionalRating", 1200);
            seasonPlayer.set("isProvisional", true);

        });
    }

});
