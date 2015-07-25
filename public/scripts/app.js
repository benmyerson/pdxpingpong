angular.module('pdxPingPong', ['ngRoute'])

	.config(function($compileProvider) {
		$compileProvider.debugInfoEnabled(false);
	})

	.config(function($routeProvider) {
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
	                            order: "-wins",
	                            limit: 20
	                        }
	                    });
	                }
	            }

	        })
	        .when('/game', {
	            controller: 'GameController as game',
	            templateUrl: 'views/game/game.html'

	        });
	})

	.controller('MainController', function() {

	})

	.controller('LeaderboardController', function(ParseService, players) {
	    this.players = players;
	    this.newPlayerName = "";
	    this.createPlayer = function(name) {
	        ParseService.Player.post({
	            name: name
	        });
	    };
	})

	.controller('GameController', function() {

	})

	.factory('ParseService', function(Resource) {
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
	        Player: resource('classes/Player/:objectId')
	    };
	})

	.factory('Resource', function($http) {
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
