
// JS类型化

var global = ui.core.global();
function noop() {}
function getNamespace(namespace) {
    var spaces,
        spaceRoot,
        spaceName,
        i, len;

    spaces = namespace.split(".");
    spaceRoot = global;
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
        constructorInfo.namespace = name;
        constructorInfo.name = name;
        existingConstructor = global[constructorInfo.name];
        constructorInfo.constructor = global[constructorInfo.name] = constructor;
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
        basePrototype = {
            name: "",
            namespace: ""
        };
    }

    // 方法重写
    Object.keys(prototype).forEach(function (prop) {
        var value = prototype[prop];
        if (!ui.core.isFunction(value)) {
            return;
        }
        var func = basePrototype[prop];
        if (!ui.core.isFunction(func)) {
            return;
        }
        delete prototype[prop];
        proxiedPrototype[prop] = (function () {
            var _super = function () {
                return basePrototype[prop].apply(this, arguments);
            },
            _superApply = function (args) {
                return basePrototype[prop].apply(this, args);
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
        {},
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

ui.define = function(name, base, prototype) {
    var index,
        constructor,
        basePrototype,
        events;

    if(!ui.core.isString(name) || name.length === 0) {
        return null;
    }

    if(!prototype) {
        prototype = base;
        base = null;
    }

    // 基类的处理
    if(!base) {
        base = {};
    }
    if(!ui.core.isFunction(base._initialize)) {
        base._initialize = noop;
    }

    constructor = define(name, base, prototype, function(option, element) {
        if (this instanceof constructor) {
            this._initialize(option, element);
        } else {
            return new constructor(option, element);
        }
    });

    return constructor;
};
