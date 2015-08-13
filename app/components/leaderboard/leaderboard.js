pongApp.controller('LeaderboardController', function($scope, ParseService, players, relay, util) {
    this.players = players;

    function updatePlayer(id, data) {
        var player = util.findWhere(players, 'objectId', id);
        if (player) {
            angular.extend(player, data);
        }
    }

    var off = relay.$sub('player.update', function(id) {
        ParseService.Player.get({
            objectId: id
        }).then(function(player) {
            updatePlayer(id, player);
        });
    });

    $scope.$on('$destroy', function() {
        off();
    });
});
