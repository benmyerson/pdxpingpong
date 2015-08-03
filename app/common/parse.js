pongApp.factory('ParseService', function(Resource) {
    var baseUrl = 'https://api.parse.com/1/',
        headers = {
            'X-Parse-Application-Id': 'lkTFs9P5hXRbxiLLgwt7NIzP7Xw9rDUPcffN1VMI',
            'X-Parse-REST-API-Key': 'HcST17j2wYY3XpZYtnymtlBUtnvxWJmRpgrVVpvO',
            'Content-Type': 'application/json'
        };

    function resource(url) {
        return Resource(baseUrl + url, {
            headers: headers
        });
    }

    return {
        Game: resource('classes/Game/:objectId'),
        Player: resource('classes/Player/:objectId'),
        Fn: resource('functions/:name'),
        objToPointer: function(object, className) {
            return {
                "__type": "Pointer",
                "className": className,
                "objectId": object.objectId
            }
        }
    };
});
