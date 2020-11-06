
// 创建命名空间
ui.ctrls = {};

function noop() {}

// 事件代理
function ClassEventDelegate(eventName) {
    this.classEventMap = new ui.KeyArray();
    this.exclusiveFlag = {};
    this.length = this.classEventMap.length;
    this.eventName = eventName || "NONE";
}
ClassEventDelegate.prototype = {
    getClassNames: function() {
        return this.classEventMap.keys();
    },
    call: function(className) {
        var args = Array.prototype.slice.call(arguments, 1),
            handler = this.classEventMap.get(className);
        if(Array.isArray(handler)) {
            handler.forEach(function(h) {
                h.apply(null, args);
            });
        } else {
            handler.apply(null, args);
        }
    },
    add: function(className, handler, isMultiple, isExclusive) {
        var old;
        if(!ui.core.isFunction(handler)) {
            throw new TypeError("the delegate event handler is not a function.");
        }

        old = this.classEventMap.get(className);
        if(isMultiple) {
            if(Array.isArray(old)) {
                old.push(handler);
                handler = old;
            } else if(ui.core.isFunction(old)) {
                handler = [old, handler];
            }
        }
        this.classEventMap.set(className, handler);
        this.exclusiveFlag[className] = typeof isExclusive === "undefined" ? true : !!isExclusive;
        this.length = this.classEventMap.length;
    },
    remove: function(className, handler) {
        var old;
        if(ui.core.isFunction(handler)) {
            old = this.classEventMap.get(className);
            if(Array.isArray(old)) {
                this.classEventMap.set(className, old.filter(function(item) {
                    return item === handler;
                }));
            } else {
                this.classEventMap.remove(className);
            }
        } else {
            this.classEventMap.remove(className);
        }
        this.length = this.classEventMap.length;
    },
    has: function(className) {
        return this.classEventMap.containsKey(className);
    },
    getDelegateHandler: function(cancelFn) {
        var that = this;
        if(!ui.core.isFunction(cancelFn)) {
            cancelFn = function() {
                return false;
            };
        }
        return function(e) {
            var elem = $(e.target),
                classNames, className,
                i, len = that.length;
            
            if(len === 0) {
                return;
            }
            classNames = that.getClassNames();
            while (true) {
                if (elem.length === 0 || cancelFn(elem)) {
                    return;
                }
                for(i = 0; i < len; i++) {
                    className = classNames[i];
                    if(elem.hasClass(className)) {
                        that.call(className, e, elem);
                        if(that.exclusiveFlag[className]) {
                            return;
                        }
                    }
                }
                elem = elem.parent();
            }
        };
    }
};

// 创建控件基础类
ui.define("ui.ctrls.ControlBase", {
    version: ui.version,
    i18n: function() {
        return ui.i18n("control", this.toString());
    },
    _initialize: function(option, element) {
        var events,
            prototypeOption,
            prototypeEvents;

        this.document = document;
        this.window = window;
        this.element = ensureElement(element) || null;

        // 配置项初始化 deep copy
        if(this.constructor && this.constructor.prototype) {
            prototypeOption = this.constructor.prototype.option;
            prototypeEvents = this.constructor.prototype.events;
        }
        this.option = ui.extend(true, {}, prototypeOption, this._defineOption(), option) || {};
        // 事件初始化
        events = mergeEvents(prototypeEvents, this._defineEvents());
        if(events.length > 0) {
            this.eventDispatcher = new ui.CustomEvent(this);
            this.eventDispatcher.initEvents(events);
        }

        this._create();
        this._render();
        return this;
    },
    _defineOption: noop,
    _defineEvents: noop,
    _create: noop,
    _render: noop,
    /** 提供属性声明方法，用于创建属性 */
    defineProperty: function(propertyName, getter, setter) {
        var definePropertyFn,
            config = {};

        if(!ui.core.isString(propertyName) || propertyName.length === 0) {
            throw new TypeError("参数propertyName只能是String类型并且不能为空");
        }

        if(typeof Reflect !== "undefined" && ui.core.isFunction(Reflect.defineProperty)) {
            definePropertyFn = Reflect.defineProperty;
        } else if(ui.core.isFunction(Object.defineProperty)) {
            definePropertyFn = Object.defineProperty;
        } else {
            return;
        }

        if(ui.core.isFunction(getter)) {
            config.get = getter.bind(this);
        }
        if(ui.core.isFunction(setter)) {
            config.set = setter.bind(this);
        }

        config.enumerable = false;
        config.configurable = false;
        definePropertyFn(this, propertyName, config);
    },
    createClassEventDelegate: function(eventName) {
        return new ClassEventDelegate();
    },
    /** 默认的toString方法实现，返回类名 */
    toString: function() {
        return this.fullName;
    }
});

function ensureElement(element) {
    if(!element) {
        return element;
    }

    if(!ui.core.isJQueryObject(element)) {
        return $(element);
    }
}

function mergeEvents() {
    var temp,
        events,
        i, len;

    temp = {};
    for(i = 0, len = arguments.length; i < len; i++) {
        events = arguments[i];
        if(Array.isArray(events)) {
            events.forEach(function(e) {
                if(!temp.hasOwnProperty(e)) {
                    temp[e] = true;
                }
            });
        }
    }

    return Object.keys(temp);
}

function define(name, base, prototype) {
    var index,
        constructor,
        basePrototype;

    if(!ui.core.isString(name) || name.length === 0) {
        return null;
    }

    index = name.indexOf(".");
    if(index < 0) {
        name = "ui.ctrls." + name;
    } else {
        if(name.substring(0, index) !== "ui") {
            name = "ui." + name;
        }
    }

    if(!prototype) {
        prototype = base;
        base = ui.ctrls.ControlBase;
    }

    constructor = ui.define(name, base, prototype);

    basePrototype = ui.core.isFunction(base) ? base.prototype : base;
    if(ui.core.isFunction(basePrototype._defineOption)) {
        constructor.prototype.option = ui.extend(true, {}, basePrototype.option, basePrototype._defineOption());
    }
    if(ui.core.isFunction(basePrototype._defineEvents)) {
        constructor.prototype.events = mergeEvents(basePrototype._defineEvents(), basePrototype.events);
    }

    return constructor;
}

ui.ctrls.define = define;