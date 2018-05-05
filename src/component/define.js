function noop() {
}
function getNamespace(namespace) {
    var spaces,
        spaceRoot,
        spaceName;
    var i, len;

    spaces = namespace.split(".");
    spaceRoot = window;
    for(i = 0, len = spaces.length; i < len; i++) {
        spaceName = spaces[i];
        if(!spaceRoot[spaceName]) {
            spaceRoot[spaceName] = {};
        }
        spaceRoot = spaceRoot[spaceName];
    }
    return spaceRoot;
}
function getConstructor(name, constructor) {
    var namespace,
        constructorInfo = {
            name: null,
            namespace: null,
            fullName: name,
            constructor: constructor
        },
        existingConstructor,
        index;

    index = name.lastIndexOf(".");
    if(index < 0) {
        constructorInfo.name = name;
        existingConstructor = window[constructorInfo.name];
        constructorInfo.constructor = window[constructorInfo.name] = constructor;
    } else {
        constructorInfo.namespace = name.substring(0, index);
        constructorInfo.name = name.substring(index + 1);
        namespace = getNamespace(constructorInfo.namespace);
        existingConstructor = namespace[constructorInfo.name];
        constructorInfo.constructor = namespace[constructorInfo.name] = constructor;
    }

    if(existingConstructor) {
        constructor.getOriginal = function() {
            return existingConstructor;
        };
    }

    return constructorInfo;
}
function define(name, base, prototype, constructor) {
    var constructorInfo,
        // 代理原型
        proxiedPrototype = {},
        basePrototype;

    if(!ui.core.isFunction(constructor)) {
        constructor = function() {};
    }
    constructorInfo = getConstructor(name, constructor);

    // 基类的处理
    if(base) {
        basePrototype = ui.core.isFunction(base) ? base.prototype : base;
        basePrototype = ui.extend({}, basePrototype);
    } else {
        basePrototype = {};
        basePrototype.namespace = "";
    }

    // 方法重写
    $.each(prototype, function (prop, value) {
        if (!$.isFunction(value)) {
            return;
        }
        var func = base.prototype[prop];
        if (!$.isFunction(func)) {
            return;
        }
        delete prototype[prop];
        proxiedPrototype[prop] = (function () {
            var _super = function () {
                return base.prototype[prop].apply(this, arguments);
            },
            _superApply = function (args) {
                return base.prototype[prop].apply(this, args);
            };
            return function () {
                var __super = this._super,
                    __superApply = this._superApply,
                    returnValue;

                this._super = _super;
                this._superApply = _superApply;

                returnValue = value.apply(this, arguments);

                this._super = __super;
                this._superApply = __superApply;

                return returnValue;
            };
        })();
    });

    // 原型合并
    constructorInfo.constructor.prototype = ui.extend(
        // 基类
        basePrototype,
        // 原型
        prototype,
        // 方法重写代理原型 
        proxiedPrototype, 
        // 附加信息
        constructorInfo
    );
    return constructorInfo.constructor;
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

function CtrlBase() {
}
CtrlBase.prototype = {
    constructor: CtrlBase,
    ctrlName: "CtrlBase",
    namespace: "ui.ctrls",
    version: ui.version,
    i18n: function(key) {
        // TODO: 实现根据key获取对应的本地化文本
    },
    _initialize: function(option, element) {
        var events,
            prototypeOption,
            prototypeEvents;

        this.document = document;
        this.window = window;
        this.element = element || null;

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
            config.get = $.proxy(getter, this);
        }
        if(ui.core.isFunction(setter)) {
            config.set = $.proxy(setter, this);
        }

        config.enumerable = false;
        config.configurable = false;
        definePropertyFn(this, propertyName, config);
    },
    /** 默认的toString方法实现，返回类名 */
    toString: function() {
        return this.fullName;
    }
};
ui.ctrls = {
    CtrlBase: CtrlBase
};

ui.define = function(name, base, prototype) {
    var index,
        constructor,
        basePrototype,
        events;

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
        base = ui.ctrls.CtrlBase;
    }

    constructor = define(name, base, prototype, function(option, element) {
        if (this instanceof constructor) {
            this._initialize(option, element);
        } else {
            return new constructor(option, element);
        }
    });

    basePrototype = ui.core.isFunction(base) ? base.prototype : base;
    if(ui.core.isFunction(basePrototype._defineOption)) {
        constructor.prototype.option = ui.extend(true, {}, basePrototype.option, basePrototype._defineOption());
    }
    if(ui.core.isFunction(basePrototype._defineEvents)) {
        constructor.prototype.events = mergeEvents(basePrototype._defineEvents(), basePrototype.events);
    }

    return constructor;
};
