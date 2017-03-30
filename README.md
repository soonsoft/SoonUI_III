# SoonUI_III
用于桌面Web浏览器的UI框架，基于jQuery。
> 这是UI库的3.0版本，本次会对各个UI组件进行重构，使其更加模块化，分层更清晰。同时也更容易的从中分离出一部分用于构建现有的项目。
## 组件
> 待续...
## 控件
> 待续...

;(function() {
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
            $.extend(constructor, constructorInfo.constructor);
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
            basePrototype = new base();
        } else {
            basePrototype = {};
            basePrototype.namespace = "";
        }
        basePrototype.option = $.extend({}, basePrototype.option);

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
        constructorInfo.constructor.prototype = $.extend(
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

    function CtrlBase() {
    }
    CtrlBase.prototype = {
        ctrlName: "CtrlBase",
        namespace: "ui.ctrls",
        version: ui.version,
        option: {},
        extend: function(target) {
            var input = Array.prototype.slice.call(arguments, 1),
                i = 0, len = input.length,
                option, key, value;
            for (; i < len; i++) {
                option = input[i];
                for (key in option) {
                    value = option[key];
                    if (option.hasOwnProperty(key) && value !== undefined) {
                        // Clone objects
                        if (ui.core.isPlainObject(value)) {
                            target[key] = ui.core.isPlainObject(target[key]) 
                                ? this.extend({}, target[key], value) 
                                // Don't extend strings, arrays, etc. with objects
                                : this.extend({}, value);
                        // Copy everything else by reference
                        } else {
                            if (value !== null && value !== undefined) {
                                target[key] = value;
                            }
                        }
                    }
                }
            }
            return target;
        },
        _initialize: function(option, element) {
            var events;

            this.document = document;
            this.window = window;
            this.element = element || null;

            // 配置项初始化
            this.option = this.extend({}, 
                this.option,
                this._defineOption(),
                option);
            // 事件初始化
            events = this._defineEvents();
            if(Array.isArray(events) && events.length > 0) {
                this.eventTarget = new ui.EventTarget(this);
                this.eventTarget.initEvents(events);
            }

            this._create();
            return this;
        },
        _defineOption: ui.core.noop,
        _defineEvents: ui.core.noop,
        _create: ui.core.noop,
        toString: function() {
            return this.fullName;
        }
    };
    ui.count = 0;
    ui.ctrls = {
        CtrlBase: CtrlBase
    };

    ui.define = function(name, base, prototype) {
        var index,
            constructor;

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
            if (this instanceof ui.ctrls.CtrlBase) {
                if (arguments.length) {
                    this._initialize(option, element);
                }
            } else {
                return new constructor(option, element);
            }
        });
        return constructor;
    };
})();
