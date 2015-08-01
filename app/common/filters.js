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
