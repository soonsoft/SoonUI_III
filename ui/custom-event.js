// custom event
ui.CustomEvent = function (target) {
    this._listeners = {};
    this._eventTarget = target || this;
};
ui.CustomEvent.prototype = {
    addEventListener: function (type, callback, scope, priority) {
        if (isFinite(scope)) {
            priority = scope;
            scope = null;
        }
        priority = priority || 0;
        var list = this._listeners[type], index = 0, listener, i;
        if (list === null) {
            this._listeners[type] = list = [];
        }
        i = list.length;
        while (--i > -1) {
            listener = list[i];
            if (listener.callback === callback) {
                list.splice(i, 1);
            } else if (index === 0 && listener.priority < priority) {
                index = i + 1;
            }
        }
        list.splice(index, 0, {
            callback: callback,
            scope: scope,
            priority: priority
        });
    },
    removeEventListener: function (type, callback) {
        var list = this._listeners[type], i;
        if (list) {
            i = list.length;
            while (--i > -1) {
                if (list[i].callback === callback) {
                    list.splice(i, 1);
                    return;
                }
            }
        }
    },
    dispatchEvent: function (type) {
        var list = this._listeners[type];
        if (list && list.length > 0) {
            var target = this._eventTarget,
                args = Array.apply([], arguments),
                i = list.length,
                listener;
            var result;
            while (--i > -1) {
                listener = list[i];
                target = listener.scope || target;
                args[0] = {
                    type: type,
                    target: target
                };
                result = listener.callback.apply(target, args);
            }
            return result;
        }
    },
    hasEvent: function (type) {
        var list = this._listeners[type];
        return list && list.length > 0;
    },
    initEvents: function (events, target) {
        if (!target) {
            target = this._eventTarget;
        }
        if (!events) {
            events = target.events;
        }
        if (Array.isArray(events) || events.length === 0) {
            return;
        }

        var that = this;
        target.on = function (type, callback, scope, priority) {
            that.addEventListener(type, callback, scope, priority);
        };
        target.off = function (type, callback) {
            that.removeEventListener(type, callback);
        };
        target.fire = function (type) {
            var args = Array.apply([], arguments);
            return that.dispatchEvent.apply(that, args);
        };

        var i = 0, 
            len = events.length, 
            eventName;
        for (; i < len; i++) {
            eventName = events[i];
            target[eventName] = this._createEventFunction(eventName, target);
        }
    },
    _createEventFunction: function (type, target) {
        var eventName = type;
        return function (callback, scope, priority) {
            if (arguments.length > 0) {
                target.on(eventName, callback, scope, priority);
            }
        };
    }
};