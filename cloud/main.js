var _ = require('underscore'),
    util = require('cloud/util'),
    rating = require('cloud/rating'),
    relay = require('cloud/relay'),

    classes = require('cloud/classes/index'),
    Game = classes.Game,
    Team = classes.Team,
    Season = classes.Season,
    Profile = classes.Profile,
    Player = classes.Player,
    Promise = util.Promise;


/**
 * Cloud Function mainStats
 */
Parse.Cloud.define("mainStats", function(request, response) {

    var ret = {
        totalGames: 0,
        totalPoints: 0,
        lastGame: {}
    };

    var statsQuery = Game.query()
                         .select([
                             // Only grab the columns we need for
                             // getting the total points
                             'player1Score',
                             'player2Score'
                         ]);

    statsQuery = statsQuery.each(function(game) {
        ret.totalGames += 1;
        ret.totalPoints += game.getTotalPoints();
    });

    var lastGameQuery = Game.query()
                            .include("player1")
                            .include("player2")
                            .descending("createdAt")
                            .first(); // Kicks off the query

    Promise.all([
        statsQuery,
        lastGameQuery
    ]).spread(function(_, lastGame) {
        ret.lastGame = lastGame;
        response.success(ret);
    }, function(err) {
        response.error(err);
    });

});


/**
 * Game.beforeSave
 */
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

    var winnerPoints = game.getWinnerPoints();
    var loserPoints = game.getLoserPoints();

    console.log('Game.beforeSave BEGIN');

    // run Player queries in parallel
    Promise.all([
        Player.query().get(
            game.getWinner().id
        ),
        Player.query().get(
            game.getLoser().id
        )
    ]).spread(function success(winner, loser) {

        /////////////////
        // Winner updates
        /////////////////

        winner.increment("games");
        winner.increment("wins");
        winner.increment("totalPoints", winnerPoints);
        winner.increment("ratedGames");
        winner.increment("opponentTotalPoints", loserPoints);

        winner.set("winPercentage", winner.getWinPercentage());
        winner.set("pointsPerGame", winner.getAveragePointsPerGame());
        winner.set("opponentPointsPerGame", winner.getAverageOpponentPointsPerGame());

        winner.updateWinningStreak();

        ////////////////
        // Loser updates
        ////////////////

        loser.increment("games");
        loser.increment("losses");
        loser.increment("totalPoints", loserPoints);
        loser.increment("ratedGames");
        loser.increment("opponentTotalPoints", winnerPoints);

        loser.set("winPercentage", loser.getWinPercentage());
        loser.set("pointsPerGame", loser.getAveragePointsPerGame());
        loser.set("opponentPointsPerGame", loser.getAverageOpponentPointsPerGame());

        loser.updateLosingStreak();

        var KFactor = 32;
        if (winner.get("ratedGames") < 6 || loser.get("ratedGames") < 6) {
            KFactor = 24;
        }
        game.set("KFactor", KFactor);

        rating.updatePlayerRatings(winner, loser, winnerPoints, loserPoints, game);

        return Parse.Object.saveAll([winner, loser]);
    }).then(function() {
        console.log('Game.beforeSave END');
        response.success(game);
    }, function(err) {
        response.error(err);
    });
});


/**
 * Player.beforeSave
 */
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
        var teamQuery = Team.query();
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

                response.success(player);
            }, error: function(error) {
                response.error("could not find team PDX: " + error);
            }
        });
        return;
    }

    player.set("isProvisional", player.get("ratedGames") < 6);

    response.success(player);
});


/**
 * Season.beforeSave
 */
Parse.Cloud.beforeSave('Season', function(request) {
    var season = request.object;
    var allProfiles = Profile.query();

    if (season.isNew()) {
        allProfiles.each(function(profile) {
            var seasonPlayer = new Player();
            seasonPlayer.set("season", season);
            seasonPlayer.set("profile", profile);
            seasonPlayer.set("games", 0);
            seasonPlayer.set("wins", 0);
            seasonPlayer.set("losses", 0);
            seasonPlayer.set("opponentPointsPerGame", 0);
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


/**
 * Game.afterSave
 */
Parse.Cloud.afterSave('Game', function(request) {
    var game = request.object,
        verb = game.isNew() ? 'create' : 'update';
        id = game.id;
    var winner = game.getWinner();
    var loser = game.getLoser();
    var winnerScore = game.getWinnerPoints();
    var loserScore = game.getLoserPoints();

    winner.fetch().then(function(object) {
        winner = object;
        return loser.fetch().then(function(object) {
            loser = object;
        });
    }).then(function() {
        rating.sendPush(winner.get("name"), loser.get("name"), winner.get("rating"),
            loser.get("rating"), winnerScore, loserScore, winner.get("streak"), id);

        Game.query().get(id).then(function(game) {
            var verb = game.isNew() ? 'create' : 'update';
            relay.publish('game.' + verb, id);
        });
    });
});


/**
 * Player.afterSave
 */
Parse.Cloud.afterSave('Player', function(request) {
    var player = request.object,
        verb = player.isNew() ? 'create' : 'update';
    relay.publish('player.' + verb, player.id);
});


/**
 * Season.afterSave
 */
Parse.Cloud.afterSave('Season', function(request) {
    var season = request.object,
        verb = season.isNew() ? 'create' : 'update';
    relay.publish('season.' + verb, season.id);
});
