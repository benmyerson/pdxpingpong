/*
 * For non-provisional players, adjust the player's rating based on
 * the game outcome and the opponent's rating.
 * https://en.wikipedia.org/wiki/Elo_rating_system#Mathematical_details
 */
function computeEloRating(player, playerRating, opponentRating, playerWon, K) {
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
    var rating = playerRating + K * (actual - expected);
    rating = Math.round(rating);

    console.log("player rated " + playerRating + " " + (playerWon ? "won" : "lost") + " to player rated " + opponentRating + ". new rating: " + rating);

    player.set("rating", rating);
}

/*
 * Performance rating for the first few games to seed a player's rating.
 * Average of the ratings of the first N players, +400 for each
 * win and -400 for each loss.
 * https://en.wikipedia.org/wiki/Elo_rating_system#Performance_rating
 */
function computeProvisionalRating(player, opponentRating, playerWon) {
    // ratedGames has already been incremented here
    var games = player.get("ratedGames") - 1;

    var playerRating = player.get("provisionalRating");
    if (!playerRating) playerRating = 0;

    var delta = playerWon ? 400 : -400;

    var rating = (games * playerRating + opponentRating + delta) / (games + 1);
    rating = Math.round(rating);

    console.log("provisional player rated " + playerRating + " " + (playerWon ? "won" : "lost") + " to player rated " + opponentRating + " after " + games + " rated games. new rating: " + rating);

    player.set("provisionalRating", rating);
}

function updatePlayerRating(player, playerRating, opponentRating, playerWon, K) {
    /*
     * Players are provisional until they complete this many rated
     * games.
     */
    var numProvisionalGames = 6;

    if (player.get("ratedGames") > numProvisionalGames) {
        computeEloRating(player, playerRating, opponentRating, playerWon, K);
    } else {
        computeProvisionalRating(player, opponentRating, playerWon);
    }

    if (player.get("ratedGames") == numProvisionalGames) {
        player.set("rating", player.get("provisionalRating"));
    }
}

function sendPush(winnerName, loserName, winnerRating, loserRating, winnerScore, loserScore) {
    /*
     * Send a push to anyone who cares.
     */
    var body = winnerName + " (" + winnerRating + ") d. " + loserName + " (" + loserRating + ") " + winnerScore + " - " + loserScore;
    console.log("Sending push to all users: " + body);

    var iosQuery = new Parse.Query(Parse.Installation);
    iosQuery.equalTo("deviceType", "ios");
    var androidQuery = new Parse.Query(Parse.Installation);
    androidQuery.equalTo("deviceType", "android");

    var query = Parse.Query.or(iosQuery, androidQuery);

    Parse.Push.send({
        where: query,
        data: {
            alert: {
                body: body,
                title: "New game scored."
            }
        }
    }, {
        success: function() {
            console.log("Sent push successfully");
        },
        error: function(error) {
            console.log("Failed to send push" + error);
        }
    });
}

module.exports = {

    updatePlayerRatings: function(winner, loser, winnerScore, loserScore, game) {
        /*
         * For historical purposes, record the rating of each player whenever
         * a game is saved. The rating saved is each player's rating before
         * the game.
         */
        var player1 = game.get("player1");
        var player2 = game.get("player2");
    
        /*
         * player1 and player2 are not fully loaded. winner and loser are.
         * figure out which is which.
         */
        player1 = player1.id == winner.id ? winner : loser;
        player2 = player2.id == winner.id ? winner : loser;
    
        var player1Rating = player1.get("rating");
        var player2Rating = player2.get("rating");
    
        game.set("player1Rating", player1Rating);
        game.set("player2Rating", player2Rating);
    
        var winnerRating = winner.get("rating");
        var loserRating = loser.get("rating");
      
        var KFactor = game.get("KFactor");
        console.log("Scoring game with K factor " + KFactor);

        updatePlayerRating(winner, winnerRating, loserRating, true, KFactor);
        updatePlayerRating(loser, loserRating, winnerRating, false, KFactor);

        var winnerName = winner.get("name");
        var loserName = loser.get("name");
    
        sendPush(winnerName, loserName, winnerRating, loserRating, winnerScore, loserScore);
    }
    
};
