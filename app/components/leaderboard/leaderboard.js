pongApp.controller('LeaderboardController', function(
    $scope,
    $location,
    leaderboardFilter,
    ParseService,
    players,
    relay,
    util
    ) {

    var vm = this;

    function updatePlayer(id, data) {
        var player = util.findWhere(players, 'objectId', id);
        if (player) {
            angular.extend(player, data);
        }
    }

    function updatePlayers() {
        var lastRating = -1;
        var lastRank = 0;

        players = leaderboardFilter(players);
        vm.players = players;

        angular.forEach(players, function(player, key) {
            if (player.rating !== lastRating) {
                lastRating = player.rating;
                lastRank = key + 1;
            }
            player.rankNumber = lastRank;
        });
    }

    $scope.$sub('player.update', function(event, id) {
        ParseService.Player.get({
            objectId: id
        }).then(function(player) {
            updatePlayer(id, player);
            updatePlayers();
        });
    });

    updatePlayers();

    vm.gotoPlayer = function(playerId) {
        $location.path('player/' + playerId);
    };
});
