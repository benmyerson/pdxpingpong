pongApp.factory('Resource', function($q, $http) {
    var param_re = /:([a-z]\w*)/g,
        slashes_re = /(^|[^:])\/{2,}/g,
        trailing_slash_re = /\/$/,
        copy = angular.copy,
        extend = angular.extend,
        httpMethods = 'get delete head jsonp put post patch';

    function acceptsData(method) {
        return /^(put|post|patch)$/i.test(method);
    }

    function interpolateUrl(url, data, params) {
        // Replace url labels with an actual value, or remove
        // it when no value is present
        url = url.replace(param_re, function(_, key) {
            var val = popFirstKey(data, params, key);
            return 'undefined' === typeof val ? '' : val;
        });

        // Strip repeating slashes
        url = url.replace(slashes_re, '$1/');
        // Strip trailing slashes
        url = url.replace(trailing_slash_re, '');

        return url;
    }

    // Get a value at `key` from the first object it
    // shows up in, then remove that property from the object
    function popFirstKey() {
        var objects = Array.prototype.slice.call(arguments),
            key = objects.pop(),
            obj;
        while ((obj = objects.shift())) {
            if (obj && obj.hasOwnProperty(key)) {
                return popKey(obj, key);
            }
        }
    }

    function popKey(obj, key) {
        var val = obj[key];
        delete obj[key];
        return val;
    }

    function ResourceLite(url, config) {
        this.url = url;
        this.config = config || {};
    }

    extend(ResourceLite.prototype, {

        _makeRequest: function(type, data, config) {
            var method = this.config.method || type,
                headers = popKey(config, 'headers'),
                params;

            if (acceptsData(method)) {
                params = popKey(data, 'params');
            } else {
                params = data;
                data = null;
            }

            url = interpolateUrl(this.url, data, params);
            headers = extend({}, this.config.headers, headers);

            return $http(extend(config, {
                method: method,
                url: url,
                data: data,
                params: params,
                headers: headers
            }));
        },

        before: function(methods, fn) {
            var self = this;
            if (!fn) {
                fn = methods;
                methods = httpMethods;
            }
            angular.forEach(methods.split(' '), function(method) {
                var original = self[method];
                self[method] = function beforeOriginal() {
                    fn.apply(self, arguments);
                    return original.apply(self, arguments);
                };
            });
            return self;
        },

        after: function(methods, fn) {
            var self = this;
            if (!fn) {
                fn = methods;
                methods = httpMethods;
            }
            angular.forEach(methods.split(' '), function(method) {
                var original = self[method];
                self[method] = function afterOriginal() {
                    return original.apply(self, arguments).then(function() {
                        return fn.apply(self, arguments);
                    });
                };
            });
            return self;
        }

    });

    httpMethods.split(' ').forEach(function(method) {
        ResourceLite.prototype[method] = function(data, config) {
            return this._makeRequest(method, copy(data) || {}, copy(config) || {});
        };
    });

    return function Resource(url, config) {
        return new ResourceLite(url, config);
    };
});
