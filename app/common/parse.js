pongApp.factory('ParseService', function(Resource) {
    var baseUrl = 'https://api.parse.com/1/',
        headers = {
            'X-Parse-Application-Id': 'lkTFs9P5hXRbxiLLgwt7NIzP7Xw9rDUPcffN1VMI',
            'X-Parse-REST-API-Key': 'HcST17j2wYY3XpZYtnymtlBUtnvxWJmRpgrVVpvO',
            'Content-Type': 'application/json'
        };

    function parseAPI(url) {
        return Resource(baseUrl + url, {
            headers: headers
        }).after(function handleResponse(response) {
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
    }

    return {
        Game: parseAPI('classes/Game/:objectId'),
        Player: parseAPI('classes/Player/:objectId'),
        Fn: parseAPI('functions/:name'),
        objToPointer: function(object, className) {
            return {
                "__type": "Pointer",
                "className": className,
                "objectId": object.objectId
            }
        }
    };
});
