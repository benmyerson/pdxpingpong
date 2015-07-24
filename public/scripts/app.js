angular.module('pdxPingPong', ['ngRoute'])
	.config(function($routeProvider) {
		$routeProvider
			.when('/', {
				controller: 'MainController as main',
				templateUrl: 'views/main.html'
			})
			.when('/scoreboard',  {
				controller: 'ScoreboardController as scoreboard',
				templateUrl: 'views/scoreboard.html'

			})
			.when('/game', {
				controller: 'GameController as game',
				templateUrl: 'views/game.html'

			})
	})

	.controller('MainController', function () {

	})

	.controller('ScoreboardController', function() {

	})

	.controller('GameController', function() {

	});