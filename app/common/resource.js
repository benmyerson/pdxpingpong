pongApp.factory('Resource', function($http) {
    var
    // Matches param placeholders in a url of the form, e.g.
    // `rest/peoples/:id` where `id` is the param
        param_re = /:([a-z]\w*)/g,

        // Matches repeating slashes, except for those following a `:`
        slashes_re = /(^|[^:])\/{2,}/g,
        buildUrl,
        popKey;

    buildUrl = function(url, data) {
        // Replace url labels with an actual value, or remove
        // it when no value is present
        url = url.replace(param_re, function(_, key) {
            var val = popKey(data, key);
            return 'undefined' === typeof val ? '' : val;
        });

        // Strip repeating slashes
        url = url.replace(slashes_re, '$1/');
        // Strip trailing slashes
        url = url.replace(/\/$/, '');

        return url;
    };

    // Get a value at `key` from the first object it
    // shows up in, then remove that property from the object
    popKey = function(obj, key) {
        var val;
        if (key in obj) {
            val = obj[key];
            delete obj[key];
        }
        return val;
    };

    function ResourceLite(url, config) {
        this.url = url;
        this.config = config || {};
    }

    ['get', 'put', 'post', 'delete'].forEach(function(method) {
        ResourceLite.prototype[method] = function(data) {
            var headers = this.config.headers,
                params,
                url;

            data = angular.extend({}, data);
            params = angular.extend({}, popKey(data, 'params'));
            url = buildUrl(this.url, data);

            return $http({
                method: method,
                url: url,
                data: data,
                params: params,
                headers: headers
            }).then(function(response) {
                var data = response.data;

                // Parse /1/function/<name> result
                if ('object' == typeof data.result) {
                    return data.result;
                }
                // Parse /1/classes/<name> results
                else if (Array.isArray(data.results)) {
                    return data.results;
                }

                // So far, Parse calls to create objects have returned
                // plain objects as the result without burying the data
                // within `result[s]` properties
                return data;
            });
        };
    });

    return function Resource(url, config) {
        return new ResourceLite(url, config);
    };
});
