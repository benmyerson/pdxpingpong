var Promise = exports.Promise = Object.create(Parse.Promise);

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all
Promise.all = function all(arr) {
    return Promise.when(arr.map(function(val) {
        return Promise.is(val) ? val : Promise.as(val);
    })).then(function() {
        return Array.prototype.slice.call(arguments);
    });
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
Promise.resolve = function resolve(val) {
    return Promise(function(resolve, reject) {
        return resolve(val);
    });
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject
Promise.reject = function reject(reason) {
    return Promise(function(resolve, reject) {
        return reject(reason);
    });
};

// https://github.com/petkaantonov/bluebird/blob/master/API.md#spreadfunction-fulfilledhandler--function-rejectedhandler----promise
Promise.prototype.spread = function spread(yep, nope) {
    return this.then(function(val) {
        var promise = Promise.when(val);
        return 'function' == typeof nope ? promise.then(yep, nope) : promise.then(yep);
    });
};
