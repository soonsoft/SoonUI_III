// custom event

function CustomEventArgs(args) {
    if(!(this instanceof CustomEventArgs)) {
        return new CustomEventArgs(args);
    }

    this.copyTo.call(args, this);
}
CustomEventArgs.prototype = {
    constructor: CustomEventArgs,
    copyTo: function(target) {
        if(!target) {
            return;
        }

        var that = this;
        Object.keys(that).forEach(function(key) {
            target[key] = that[key];
        });
    }
};

function CustomEvent (target) {
    this._listeners = {};
    this._eventTarget = target || this;
}
CustomEvent.prototype = {
    constructor: CustomEvent,
    addEventListener: function (type, data, callback, priority) {
        var list, 
            listener, 
            index, i;

        if (ui.core.isNumeric(callback) && isFinite(callback)) {
            priority = callback;
            callback = null;
        }
        if(ui.core.isFunction(data)) {
            callback = data;
            data = null;
        }

        list = this._listeners[type];
        if (!list) {
            this._listeners[type] = list = [];
        }

        i = list.length;
        index = 0;
        priority = priority || 0;
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
            data: data,
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
        var list = this._listeners[type],
            target, args, i,
            listener,
            result;
        if (list && list.length > 0) {
            target = this._eventTarget;
            args = Array.apply([], arguments);
            i = list.length;
            while (--i > -1) {
                listener = list[i];
                args[0] = {
                    type: type,
                    target: target,
                    data: listener.data
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
        var that = this;

        if (!target) {
            target = this._eventTarget;
        }
        if (!events) {
            events = target.events;
        }
        if (!Array.isArray(events) || events.length === 0) {
            return;
        }

        target.on = function (type, data, callback, priority) {
            that.addEventListener(type, data, callback, priority);
        };
        target.off = function (type, callback) {
            that.removeEventListener(type, callback);
        };
        target.fire = target.trigger = function (type) {
            var args = Array.apply([], arguments);
            return that.dispatchEvent.apply(that, args);
        };

        events.forEach(function(eventName) {
            target[eventName] = that._createEventFunction(eventName, target);
        });
    },
    _createEventFunction: function (type, target) {
        var eventName = type;
        return function (data, callback, priority) {
            if (arguments.length > 0) {
                target.on(eventName, data, callback, priority);
            }
        };
    }
};

ui.CustomEvent = CustomEvent;
