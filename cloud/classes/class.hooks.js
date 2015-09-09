'use strict';

var Promise = require('cloud/util').Promise,
    slice = Array.prototype.slice;

function FauxResponse() {}
FauxResponse.prototype.success = function success(){};
FauxResponse.prototype.error = function error(){};

function ClassHooks(Class) {
    this.Class = Class;
    this.callbacks = {};
}

ClassHooks.prototype.addHook = function addHook(hook, callback) {
    var callbacks = this.callbacks[hook];

    if (callbacks) {
        callbacks.push(callback);
        return;
    }

    // Init callbacks array for this hook
    callbacks = this.callbacks[hook] = [callback];

    // Register a trigger handler that will run the registered callbacks
    Parse.Cloud[hook](this.Class, function runner(request, response) {
        // afterSave and afterDelete do not provide a response object
        response = response || new FauxResponse;

        var _success = response.success,
            _error = response.error,
            _callbacks = callbacks.slice(0),
            requestObject = request.object,
            successInvokedWithRequestObject,
            errorInvoked,
            errorArgs;

        response.success = function success() {
            successInvokedWithRequestObject = arguments[0] === requestObject;
        };

        response.error = function error() {
            errorInvoked = true;
            errorArgs = slice.call(arguments, 0);
        };

        (function processCallbacks() {
            var cb = _callbacks.shift();

            Promise(function(yep, nope) {
                // If an error is thrown here we'll catch
                // and handle it in the failHandler defined below
                Promise.when(cb.call(null, request, response)).then(
                    // Invokes successHandler
                    yep,
                    // Invokes failHandler
                    nope
                );
            }).spread(
                function successHandler(obj) {
                    // Stop processing if `response.error` was invoked
                    if (errorInvoked) {
                        _error.apply(response, errorArgs);
                    }
                    // Continue processing callbacks if there are any left
                    else if (_callbacks.length) {
                        processCallbacks();
                    } else {
                        // All callbacks have been run successfully, invoke `response.success`
                        if (successInvokedWithRequestObject || obj === requestObject) {
                            _success.call(response, requestObject);
                        } else {
                            _success.call(response);
                        }
                    }
                },
                function failHandler(error) {
                    // Uncaught error, invoke error handler
                    _error.call(response, error);
                }
            );
        })();

    });
};

[
    'beforeSave',
    'afterSave',
    'beforeDelete',
    'afterDelete'
].forEach(function(hook) {
    ClassHooks.prototype[hook] = function(callback) {
        return this.addHook(hook, callback), this;
    };
});

module.exports = ClassHooks;
