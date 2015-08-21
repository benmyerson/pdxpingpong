pongApp.controller('SeasonController', function($scope, ParseService) {
    var vm = this;

    vm.recentGames = [];
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


    ParseService.Game.get({
        'include': 'player1,player2',
        'order': '-createdAt',
        'limit': 3
    }).then(function (games) {
        vm.recentGames = games;
    });

    // Live stats
    $scope.$sub('game.create', function(event, id) {
        ParseService.Game.get({
            limit: 1,
            where: {
                objectId: id
            },
            include: 'player1,player2'
        }).then(function(game) {
            game = game[0];
            vm.lastGame = game;
            vm.games += 1;
            vm.points += (game.player1Score + game.player2Score);
            vm.recentGames.unshift(game);
        });
    });
});
