pongApp.factory('relay', function() {
    var relay = new Firebase('https://pdxpong.firebaseio.com/relay'),
        events = relay.child('events'),
        pubTime = 0,
        canBeginListening,
        timeStamp;

    // Get a reliable, unique timeStamp that serves as the offset for
    // events we're interested in. Why? We don't care about things
    // that happened in the past. Date.now() *could* be used but I don't
    // feel like fighting with timezones and such.
    canBeginListening = new Promise(function(yep) {
        relay.child('ts').transaction(function() {
            return Firebase.ServerValue.TIMESTAMP;
        }, function(err, _, snap) {
            timeStamp = snap.val();
            yep();
        });
    });

    // As events are handled we need to update the timeStamp
    // with the most recent events timeStamp to keep future
    // event registrations from receiving old events...
    //
    // Example of the problem:
    //
    // Initial timestamp: 1
    //
    // $sub('event', fn) for events after timestamp @ 1
    //   - receive event with initial timestamp + 1
    //   - receive event with initial timestamp + 2
    //   - receive event with initial timestamp + 3
    //
    // ^ unbind `$sub('event', fn)` due to view change
    //
    // ... time passes ... and then
    //
    // $sub('event', fn) for events after timestamp @ 1
    //   * OOPS
    //   * All the events that were received the first time
    //   * will be received again because their timestamps
    //   * are greater than our initial timestamp @ 1
    //
    // This fixes that ((needs supreme testing))
    function updateTimeStamp(ts) {
        if (ts >= timeStamp) {
            timeStamp = ts + 1;
        }
    }

    return {

        $pub: function(event, id) {
            // Record the publish time so we can check for
            // synchronous callbacks.. see the $sub eventHandler
            // comment for more info.
            pubTime = Date.now();

            events.push({
                id: id,
                ev: event,
                ts: Firebase.ServerValue.TIMESTAMP
            });
        },

        $sub: function(event, fn) {
            var wasRegistered,
                ref;

            function removalFn() {
                if (wasRegistered) {
                    ref.off('child_added', eventHandler);
                    ref = eventHandler = wasRegistered = null;
                }
            }

            function eventHandler(snap) {
                var val = snap.val(),
                    id = val.id;

                // Update timeStamp to prevent receiving old events
                // in future event registration
                updateTimeStamp(val.ts);

                // note: right now we're receiving notifications
                // for all events. WebSockets are pretty light
                // weight but I'd like to optimize this in the future.
                if (event === val.ev) {

                    // Firebase has this nasty habit of firing handlers
                    // synchronously for events that are triggered locally..
                    // If we're handling an event and the most recent publish
                    // time is === now, it's safe to say we triggered it - force async.
                    if (pubTime === Date.now()) {
                        setTimeout(fn, 0, id);
                    } else {
                        fn(id);
                    }
                }
            }

            canBeginListening.then(function() {
                wasRegistered = true;

                ref = events.
                    // Order by event timestamp ascending
                    orderByChild('ts').
                    // Observe events that occur After our init timeStamp
                    startAt(timeStamp);

                // And listen for events
                ref.on('child_added', eventHandler);
            });

            return removalFn;
        }

    };
});
