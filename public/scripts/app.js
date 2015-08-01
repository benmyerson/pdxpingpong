(function() {
    'use strict';
;var pongApp = angular.module('pdxPingPong', ['ngRoute']);

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
                        params: {
                            order: "-winPercentage",
                            limit: 20
                        }
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
                        params: {
                            order: "name"
                        }
                    });
                }
            }
        });
});
;pongApp.filter('rank', function() {
    return function(number) {
        return number < 10 ? '0' + number : number;
    };
});

pongApp.filter('ratio', function() {
    return function(number) {
        return parseInt(number * 100, 10) + '%';
    };
});
;pongApp.directive('fittext', function() {
    return {
        restrict: 'A',
        link: function($scope, element, attrs) {
            element[0].style.display = 'inline-block';

            var parent = element.parent(),
                $window = angular.element(window),
                compressor = +attrs.fittext || 1,
                lines = element[0].querySelectorAll('[fittext-nl],[data-fittext-nl]').length || 1,
                minFontSize = parseFloat(attrs.fittextMin) || Number.NEGATIVE_INFINITY,
                maxFontSize = parseFloat(attrs.fittextMax) || Number.POSITIVE_INFINITY,
                parentWidth,
                _resize,
                resize,
                frame;

            _resize = function() {
                var ratio,
                    fontSize;

                if (parentWidth !== (parentWidth = parent[0].offsetWidth)) {
                    element[0].style.lineHeight = '1';
                    element[0].style.fontSize = '10px';

                    ratio = element[0].offsetHeight / element[0].offsetWidth / lines;
                    fontSize = Math.max(
                        Math.min((parentWidth - 4) * ratio * compressor, maxFontSize),
                        minFontSize
                    );

                    element[0].style.lineHeight = '';
                    element[0].style.fontSize = fontSize + 'px';
                }
            };

            resize = function() {
                frame = frame || window.requestAnimationFrame(function() {
                    frame = null;
                    _resize();
                });
            };

            if (attrs.ngModel) {
                $scope.$watch(attrs.ngModel, resize);
            } else if (!window.fontsLoaded) {
                $window.one('fonts.loaded', resize);
            } else {
                resize();
            }

            angular.element(window).on('resize', resize);

            $scope.$on('$destroy', function() {
                angular.element(window).off('resize fonts.loaded', resize);
            });
        }
    }
});
;pongApp.factory('ParseService', function(Resource) {
    var baseUrl = 'https://api.parse.com/1/',
        headers = {
            'X-Parse-Application-Id': 'lkTFs9P5hXRbxiLLgwt7NIzP7Xw9rDUPcffN1VMI',
            'X-Parse-REST-API-Key': 'HcST17j2wYY3XpZYtnymtlBUtnvxWJmRpgrVVpvO',
            'Content-Type': 'application/json'
        };

    function resource(url) {
        return Resource(baseUrl + url, {
            headers: headers
        });
    }

    return {
        Game: resource('classes/Game/:objectId'),
        Player: resource('classes/Player/:objectId'),
        objToPointer: function(object, className) {
            return {
                "__type": "Pointer",
                "className": className,
                "objectId": object.objectId
            }
        }
    };
});
;pongApp.factory('Resource', function($http) {
    var
    // Matches param placeholders in a url of the form, e.g.
    // `rest/peoples/:id` where `id` is the param
        param_re = /:([a-z]\w*)/g,

        // Matches repeating slashes, except for those following a `:`
        slashes_re = /(^|[^:])\/{2,}/g,
        buildUrl,
        popKey;

    buildUrl = function(url, data) {
        // Replace url labels with an actual value, or remove
        // it when no value is present
        url = url.replace(param_re, function(_, key) {
            var val = popKey(data, key);
            return 'undefined' === typeof val ? '' : val;
        });

        // Strip repeating slashes
        url = url.replace(slashes_re, '$1/');
        // Strip trailing slashes
        url = url.replace(/\/$/, '');

        return url;
    };

    // Get a value at `key` from the first object it
    // shows up in, then remove that property from the object
    popKey = function(obj, key) {
        var val;
        if (key in obj) {
            val = obj[key];
            delete obj[key];
        }
        return val;
    };

    function ResourceLite(url, config) {
        this.url = url;
        this.config = config || {};
    }

    ['get', 'put', 'post', 'delete'].forEach(function(method) {
        ResourceLite.prototype[method] = function(data) {
            var headers = this.config.headers,
                params,
                url;

            data = angular.extend({}, data);
            params = angular.extend({}, popKey(data, 'params'));
            url = buildUrl(this.url, data);

            return $http({
                method: method,
                url: url,
                data: data,
                params: params,
                headers: headers
            }).then(function(response) {
                return response.data.results;
            });
        };
    });

    return function Resource(url, config) {
        return new ResourceLite(url, config);
    };
});
;pongApp.controller('GameController', function($location, ParseService, players) {
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
;pongApp.controller('LeaderboardController', function(ParseService, players) {
    this.players = players;
    this.newPlayerName = "";
    this.createPlayer = function(name) {
        ParseService.Player.post({
            name: name
        });
    };
});
;pongApp.run(function($templateCache){  'use strict';

  $templateCache.put('views/game/game.html',
    "<div class=NewGame><h1>Enter Game</h1><h2>{{game.currentSeason}}</h2><form name=newGameForm><div class=NewGame__form-row><select ng-required=true ng-model=game.player1Obj ng-options=\"player.name disable when (player == game.newGame.player2) for player in game.players\"><option value=\"\">-- Choose Player 1 --</option></select><input ng-required=true ng-model=game.newGame.player1Score type=number placeholder=\"Enter Score\"></div><div class=NewGame__separator><h1>VS</h1><h2>{{game.currentSeason}}</h2></div><div class=NewGame__form-row><select ng-required=true ng-model=game.player2Obj ng-options=\"player.name disable when (player == game.newGame.player1) for player in game.players\"><option value=\"\">-- Choose Player 2 --</option></select><input ng-required=true ng-model=game.newGame.player2Score type=number placeholder=\"Enter Score\"></div><button class=btn--block ng-disabled=newGameForm.$invalid ng-click=game.completeGame()>Complete Game</button></form></div>"
  );


  $templateCache.put('views/leaderboard/leaderboard.html',
    "<div ng-init=\"vm = leaderboard\"><table class=LeaderBoard><tbody><tr class=PlayerStats ng-repeat=\"player in vm.players track by player.objectId\"><td class=PlayerStats__rank>{{$index + 1 | rank}} <small>rank</small></td><td class=PlayerStats__name>{{player.name}} <small>bodyspace name</small></td><td class=\"PlayerStats__stat PlayerStats__stat--first\">{{player.games}} <small>games</small></td><td class=PlayerStats__stat>{{player.wins}} <small>win</small></td><td class=PlayerStats__stat>{{player.losses}} <small>loss</small></td><td class=PlayerStats__stat>{{player.winPercentage | ratio}} <small>ratio</small></td><td class=PlayerStats__stat>{{player.totalPoints | number}} <small>points</small></td><td class=PlayerStats__stat>{{player.pointsPerGame | number: 2}} <small>ppg</small></td><td class=\"PlayerStats__stat PlayerStats__stat--last\">{{player.opponentPointsPerGame | number: 2}} <small>appg</small></td></tr></tbody></table></div>"
  );


  $templateCache.put('views/main/main.html',
    "<div><h1>Main</h1><a href=#/leaderboard>Leader Board</a> <a href=#/game>Create New Game</a></div>"
  );
});;})();
