pongApp.controller('GameController', function($location, ParseService, players, relay) {
    this.players = players;
    this.newGame = {};
    this.currentSeason = "Summer League";

    this.completeGame = function() {
        this.newGame.player1 = ParseService.objToPointer(this.player1Obj, "Player");
        this.newGame.player2 = ParseService.objToPointer(this.player2Obj, "Player");

        ParseService.Game.post(this.newGame).then(function(game) {
            // switch to leaderboard
            $location.path('leaderboard');
        });

        this.newGame = this.player1Obj = this.player2Obj = null;
    };
});
