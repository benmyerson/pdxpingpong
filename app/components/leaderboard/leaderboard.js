pongApp.controller('LeaderboardController', function(ParseService, players) {
    this.players = players;
    this.newPlayerName = "";
    this.createPlayer = function(name) {
        ParseService.Player.post({
            name: name
        });
    };
});
