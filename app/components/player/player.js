pongApp.controller('PlayerController', function($scope, $location, ParseService, player, games, relay, util, $filter) {


    var currentFilter = "";
    var filteredList = $filter('filter')(games, this.currentFilter);

    var getPlayerWonGame = function getPlayerWonGame (game){
        return game.player1.objectId === player.objectId ? (game.player1Score > game.player2Score) : (game.player2Score > game.player1Score);
    };

    var getPlayerGameOutcomeClass = function getPlayerGameOutcomeClass (game) {
        return getPlayerWonGame(game) ? "Player__game--win" : "Player__game--loss";
    }

    var getGameOpponent = function getGameOpponent (game) {
        return game.player1.objectId === player.objectId ? game.player2 : game.player1;
    }

    var opponents = [];
    angular.forEach(games, function(value, key) {
        var curr = getGameOpponent(value).name;
        if (opponents.indexOf(curr) < 0) {
            opponents.push(curr);
        }
    });

    var vm = {

        currentFilter: "",
        filteredList: filteredList,
        getPlayerWonGame: getPlayerWonGame,
        getPlayerGameOutcomeClass: getPlayerGameOutcomeClass,
        getGameOpponent: getGameOpponent,
        getScoreDiff: function (game) {
            return Math.abs(game.player1Score - game.player2Score) / Math.max(game.player1Score, game.player2Score);
        },
        opponents: opponents,
        player: player,
        games: games,
        getWins: function getWins (){
            var wins = 0;
            angular.forEach(this.filteredList, function(value, key) {
                wins += getPlayerWonGame(value) ? 1 : 0;
            });
            return wins;
        },
        getLosses: function getLosses (){
            var losses = 0;
            angular.forEach(this.filteredList, function(value, key) {
                losses += getPlayerWonGame(value) ? 0 : 1;
            });
            return losses;
        },
        updateFilter: function () {

            this.filteredList = $filter('filter')(games, this.currentFilter);
            this.wins = this.getWins();
            this.losses = this.getLosses();
        }
    };

    vm.wins = vm.getWins();
    vm.losses = vm.getLosses();

    angular.extend(this, vm);
});
