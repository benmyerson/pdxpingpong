pongApp.controller('GameController', function($location, ParseService, players) {
    this.players = players;
    this.newGame = {};
    this.currentSeason = "Summer League";

    this.completeGame = function() {
        this.newGame.player1 = ParseService.objToPointer(this.player1Obj, "Player");
        this.newGame.player2 = ParseService.objToPointer(this.player2Obj, "Player");

        var test = ParseService.Game.post(this.newGame);

        this.newGame = this.player1Obj = this.player2Obj = {};
        $location.path('leaderboard');
    };
});
