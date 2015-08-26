pongApp.controller('LeaderboardController', function($scope, $location, ParseService, players, relay, util) {

    function updatePlayer(id, data) {
        var player = util.findWhere(players, 'objectId', id);
        if (player) {
            angular.extend(player, data);
        }
    }

    function updateRankings() {
        var lastRating = -1;
        var lastRank = 0;
        angular.forEach(players, function(player) {
            if (player.rating !== lastRating) {
                lastRating = player.rating;
                lastRank += 1;
            }
            player.rankNumber = lastRank;
        });
    }

    $scope.$sub('player.update', function(event, id) {
        ParseService.Player.get({
            objectId: id
        }).then(function(player) {
            updatePlayer(id, player);
            updateRankings();
        });
    });

    updateRankings();

    this.players = players;

    this.gotoPlayer = function(playerId) {
        $location.path('player/' + playerId);
    };
});
