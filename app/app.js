var pongApp = angular.module('pdxPingPong', ['ngRoute']);

pongApp.config(function($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
});

pongApp.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            controller: 'MainController as main',
            templateUrl: 'views/main/main.html'
        })
        .when('/leaderboard', {
            controller: 'LeaderboardController as leaderboard',
            templateUrl: 'views/leaderboard/leaderboard.html',
            resolve: {
                players: function(ParseService) {
                    return ParseService.Player.get({
                        order: "-winPercentage",
                        limit: 20
                    });
                }
            }

        })
        .when('/game', {
            controller: 'GameController as game',
            templateUrl: 'views/game/game.html',
            resolve: {
                players: function(ParseService) {
                    return ParseService.Player.get({
                        order: "name"
                    });
                }
            }
        });
});
