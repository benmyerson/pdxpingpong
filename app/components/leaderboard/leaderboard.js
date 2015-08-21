pongApp.controller('LeaderboardController', function($scope, $location, ParseService, players, relay, util) {

    var lastRating = -1;
    var lastRank = 0;
    angular.forEach(players, function(value, key) {

        if (value.rating !== lastRating) {
            lastRating = value.rating;
            lastRank = key + 1;
        }
        value.rankNumber = lastRank;
    });

    this.players = players;

    function updatePlayer(id, data) {
        var player = util.findWhere(players, 'objectId', id);
        if (player) {
            angular.extend(player, data);
        }
    }

    $scope.$sub('player.update', function(event, id) {
        ParseService.Player.get({
            objectId: id
        }).then(function(player) {
            updatePlayer(id, player);
        });
    });

    this.gotoPlayer = function(playerId) {
        $location.path('player/' + playerId);
    };
});
