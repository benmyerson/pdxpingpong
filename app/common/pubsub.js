pongApp.config(function($provide) {

    var getPrototypeOf = Object.getPrototypeOf || function(o) {
        return o.__proto__ || o.constructor.prototype;
    };

    $provide.decorator('$rootScope', function decorateWithPubSub($delegate) {
        var root = $delegate,
            proto = getPrototypeOf(root);

        function $pub() {
            return root.$emit.apply(root, arguments);
        }

        function $sub() {
            var removalFn = root.$on.apply(root, arguments);
            return this.$on('$destroy', removalFn), removalFn;
        }

        proto.$pub = $pub;
        proto.$sub = $sub;

        return root;
    });
});
