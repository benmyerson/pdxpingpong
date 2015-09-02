pongApp.factory('EventEmitter', function() {

    /**
     * Representation of a single EventEmitter function.
     *
     * @param {Function} fn Event handler to be called.
     * @param {Mixed} context Context for function execution.
     * @param {Boolean} [once=false] Only emit once
     * @api private
     */
    function Listener(fn, context, once) {
        this.fn = fn;
        this.context = context || null;
        this.once = once || false;
    }

    /**
     * Minimal EventEmitter interface
     *
     * @constructor
     * @api public
     */
    function EventEmitter() {}

    /**
     * Creates an instance of an EventEmitter
     *
     * @returns {EventEmitter}
     * @api public
     */
    EventEmitter.create = function() {
        return new EventEmitter;
    };

    /**
     * Emit an event to all registered event listeners.
     *
     * @param {String} event The name of the event.
     * @param {Mixed} [context=this] The context of the function.
     * @returns {EventEmitter} The EventEmitter instance.
     * @api public
     */
    EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4) {
        if (!this._events || !this._events[event]) return this;

        var args = Array.prototype.slice.call(arguments, 1),
            listeners = this._events[event],
            listener,
            context,
            fn;

        for (var i = 0, len = listeners.length; i < len; i++) {
            listener = listeners[i];
            context = listener.context;
            fn = listener.fn;

            if (listener.once) this.off(event, fn, null, true);

            switch (args.length) {
                case 0:  fn.call(context); break;
                case 1:  fn.call(context, a1); break;
                case 2:  fn.call(context, a1, a2); break;
                case 3:  fn.call(context, a1, a2, a3); break;
                case 4:  fn.call(context, a1, a2, a3, a4); break;
                default: fn.apply(context, args);
            }
        }

        return this;
    };

    /**
     * Register a new EventListener for the given event.
     *
     * @param {String} event Name of the event.
     * @param {Function} fn Callback function.
     * @param {Mixed} [context=this] The context of the function.
     * @returns {EventEmitter} The EventEmitter instance.
     * @api public
     */
    EventEmitter.prototype.on = function on(event, fn, context) {
        if (!this._events) this._events = Object.create(null);
        if (!this._events[event]) this._events[event] = [];

        this._events[event].push(new Listener(fn, context));

        return this;
    };

    /**
     * Add an EventListener that's only called once.
     *
     * @param {String} event Name of the event.
     * @param {Function} fn Callback function.
     * @param {Mixed} [context=this] The context of the function.
     * @returns {EventEmitter} The EventEmitter instance.
     * @api public
     */
    EventEmitter.prototype.one = function one(event, fn, context) {
        if (!this._events) this._events = Object.create(null);
        if (!this._events[event]) this._events[event] = [];

        this._events[event].push(new Listener(fn, context, true));

        return this;
    };

    /**
     * Remove event listeners.
     *
     * @param {String} event The event we want to remove.
     * @param {Function} fn The listener that we need to find.
     * @param {Mixed} context Only remove listeners matching this context.
     * @param {Boolean} once Only remove once listeners.
     * @returns {EventEmitter} The EventEmitter instance.
     * @api public
     */
    EventEmitter.prototype.off = function off(event, fn, context, once) {
        if (!arguments.length) return (this._events = null), this;
        else if (!this._events || !this._events[event]) return this;

        var listeners = this._events[event],
            events = [];

        if (fn) {
            for (var i = 0, len = listeners.length; i < len; i++) {
                if (
                    listeners[i].fn !== fn || (once && !listeners[i].once) || (context && listeners[i].context !== context)
                ) {
                    events.push(listeners[i]);
                }
            }
        }

        //
        // Reset the array, or remove it completely if we have no more listeners.
        //
        if (events.length) {
            this._events[event] = events;
        } else {
            delete this._events[event];
        }

        return this;
    };

    return EventEmitter;
});
