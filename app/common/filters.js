pongApp.filter('rank', function() {
    return function(number) {
        return number < 10 ? '0' + number : number;
    };
});

pongApp.filter('ratio', function() {
    return function(number) {
        return parseInt(number * 100, 10) + '%';
    };
});

pongApp.filter('leaderboard', function($filter, numberFilter) {
    var sort = $filter('orderBy');
    return function(players) {

        var sorted = sort(players, ['-rating', '-games']);

        var provisional = [];
        var nonProvisional = [];
        sorted.forEach(function (player) {
            if (player.ratedGames >= 6) {
                player.displayRating = numberFilter(player.rating);
                nonProvisional.push(player);
            }else {
                player.displayRating = '--';
                provisional.push(player);
            }
        });
        return nonProvisional.concat(provisional.sort(function(a,b){
            return -1 * (a.ratedGames - b.ratedGames);
        }));
    };
});
