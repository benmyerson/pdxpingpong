pongApp.controller('SeasonController', function($scope, relay, ParseService) {
    var vm = this;

    vm.games = 0;
    vm.points = 0;
    vm.lastGame = null;
    vm.season = 'summer league';

    // Initial stats
    ParseService.Fn.post({
        name: 'mainStats'
    }).then(function(stats) {
        vm.games = stats.totalGames;
        vm.points = stats.totalPoints;
        vm.lastGame = stats.lastGame;
    });

    // Live stats
    relay.$sub('game.create', function(id) {
        ParseService.Game.get({
            params: {
                limit: 1,
                where: {
                    objectId: id
                },
                include: 'player1,player2'
            }
        }).then(function(game) {
            game = game[0];
            vm.lastGame = game;
            vm.games += 1;
            vm.points += (game.player1Score + game.player2Score);
        });
    });
});
