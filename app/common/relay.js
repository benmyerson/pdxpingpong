pongApp.factory('relay', function(EventEmitter, Firebase) {
    var emitter = EventEmitter.create(),
        relayRef = new Firebase('https://pdxpong.firebaseio.com/relay'),
        eventsRef = relayRef.child('events');

    // Promises resolve asynchronously and have
    // better (faster) resolution times than setTimeout
    function nextTick(fn) {
        Promise.resolve().then(fn);
    }

    // Get a reliable, unique timeStamp that serves as the offset for
    // events we're interested in. Why? We don't care about things
    // that happened in the past. Date.now() *could* be used but I don't
    // feel like fighting with timezones and such.
    new Promise(function(yep) {
        relayRef.child('ts').transaction(function() {
            return Firebase.ServerValue.TIMESTAMP;
        }, function(err, _, snap) {
            yep(snap.val());
        });
    }).then(function(startAtTimeStamp) {

        var ref = eventsRef.
            // Order by event timestamp ascending
            orderByChild('ts').
            // Observe events that occur *after* the startAtTimeStamp
            startAt(startAtTimeStamp);

        ref.on('child_added', function eventRefHandler(snap) {
            var event = snap.val().ev;

            // Firebase has this nasty habit of firing handlers
            // synchronously for events that are triggered locally..
            // force async
            nextTick(function() {
                emitter.emit(event, snap);
            });
        });

    });

    return {

        $pub: function $pub(event, id) {
            events.push({
                id: id,
                ev: event,
                ts: Firebase.ServerValue.TIMESTAMP
            });
        },

        $sub: function $sub(event, fn) {

            // Observe said event
            emitter.on(event, eventHandler);

            function eventHandler(snap) {
                var val = snap.val(),
                    id = val.id,
                    // Angular callbacks take an eventObject as the first
                    // argument. For the sake of consistency we shall do the same
                    eventObject = {
                        name: event,
                        timeStamp: val.ts
                    };

                // Invoke the event callback
                fn(eventObject, id);
            }

            return function removeEvent() {
                if (eventHandler) {
                    emitter.off(event, eventHandler);
                    eventHandler = null;
                }
            };
        }
    };
});
