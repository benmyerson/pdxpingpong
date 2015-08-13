pongApp.factory('util', function($q) {

    function find(arr, fn) {
        if (arr) {
            for (var len = arr.length, i = 0; i < len; i++) {
                if (i in arr && true === fn(arr[i], i)) {
                    return arr[i];
                }
            }
        }
    }

    find.when = function findWhen(arr, fn) {
        return $q.when(arr).then(function(arr) {
            return find(arr, fn);
        });
    };

    function findWhere(arr, prop, val) {
        return find(arr, function(item) {
            return item[prop] === val;
        });
    }

    findWhere.when = function findWhereWhen(arr, prop, val) {
        return $q.when(arr).then(function(arr) {
            return findWhere(arr, prop, val);
        });
    };

    return {
        find: find,
        findWhere: findWhere
    };
});
