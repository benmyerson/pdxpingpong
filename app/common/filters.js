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

pongApp.filter('leaderboard', function($filter) {
    var sort = $filter('orderBy');
    return function(players) {
        return sort(players, ['-rating', '-games']);
    };
});
