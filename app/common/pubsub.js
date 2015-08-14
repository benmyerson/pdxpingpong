pongApp.config(function($provide) {

    var getPrototypeOf = Object.getPrototypeOf || function(o) {
        return o.__proto__ || o.constructor.prototype;
    };

    $provide.decorator('$rootScope', function decorateWithPubSub($delegate, relay) {
        var root = $delegate,
            proto = getPrototypeOf(root);

        // Say whaaaat?
        $pub.relay = relay.$pub;

        function $pub() {
            return root.$emit.apply(root, arguments);
        }

        // Observe events locally AND at the server
        function $sub(event, callback) {
            var removalFns = [
                // Listen for server events
                relay.$sub(event, callback),
                // Listen for local events
                root.$on.apply(root, arguments)
            ];

            function removalFn() {
                if (removalFns) {
                    removalFns.forEach(function(off) { off() });
                    removalFns = null;
                }
            }

            return this.$on('$destroy', removalFn), removalFn;
        }

        proto.$pub = $pub;
        proto.$sub = $sub;

        return root;
    });
});
