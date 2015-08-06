var util = require('cloud/util'),
    serverEventsUrl = 'https://pdxpong.firebaseio.com/relay/events.json?print=silent',
    TIMESTAMP = {
        '.sv': 'timestamp'
    };

module.exports = {

    subscribe: function() {
        return util.Promise.resolve();
    },

    publish: function(event, id) {
        return Parse.Cloud.httpRequest({
            method: 'POST',
            url: serverEventsUrl,
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: JSON.stringify({
                id: id,
                ev: event,
                ts: TIMESTAMP
            })
        });
    }

};
