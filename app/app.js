var pongApp = angular.module('pdxPingPong', ['ngRoute']);

pongApp.run(function(relay) {
    relay.$sub('client.reload', function() {
        // Reload the current page without hitting the cache
        window.location.reload(true);
    });
});

pongApp.config(function($compileProvider) {
    $compileProvider.debugInfoEnabled(false);
});

pongApp.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            controller: 'LeaderboardController as leaderboard',
            templateUrl: 'views/leaderboard/leaderboard.html',
            resolve: {
                players: function(ParseService) {
                    return ParseService.Player.get({
                        where: {
                            'team': {
                                '$inQuery': {
                                    'where': {
                                        'name': 'PDX'
                                    },
                                    'className': 'Team'
                                }
                            }
                        },
                        limit: 20,
                        order: '-rating,-games'
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
        })
        .when('/player/:id', {
            controller: 'PlayerController as vm',
            templateUrl: 'views/player/player.html',
            resolve: {
                player: function(ParseService, $route) {
                    return ParseService.Player.get({
                        objectId: $route.current.params.id
                    });
                },
                games: function(ParseService, $route) {
                    var player = ParseService.objToPointer({objectId: $route.current.params.id}, "Player");
                    return ParseService.Game.get({
                        'where': {
                            '$or': [
                                {'player1': player},
                                {'player2': player}
                            ]
                        },
                        'include': 'player1,player2',
                        'order': '-createdAt'
                    });
                }
            }
        })
        .otherwise({
            redirectTo: '/'
        });

});
