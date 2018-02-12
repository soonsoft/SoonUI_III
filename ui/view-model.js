// ViewModel 模型

var arrayObserverPrototype = [],
    overrideMethods = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"],
    hasProto = '__proto__' in {},
    updatePrototype;
// 劫持修改数组的API方法
overrideMethods.forEach(function(methodName) {
    var originalMethod = arrayObserverPrototype[methodName];

    arrayObserverPrototype[methodName] = function() {
        var result,
            insertedItems,
            args = arrayObserverPrototype.slice(arguments, 0),
            notice;

        result = originalMethod.apply(this, args);

        switch(methodName) {
            case "push":
            case "unshift":
                insertedItems = args;
                break;
            case "splice":
                insertedItems = args.slice(2);
                break;
        }

        notice = this.__notice__;
        if(insertedItems) {
            notice.arrayNotify(insertedItems);
        }
        notice.dependency.notify();
        return result;
    };
});

if(hasProto) {
    updatePrototype = function(target, prototype, keys) {
        value.__proto__ = prototype;
    };
} else {
    updatePrototype = function(target, prototype, keys) {
        var i, len, key;
        for(i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            target[key] = prototype[key];
        }
    }
}

function defineNotifyProperty(obj, key, val, shallow) {
    var descriptor,
        getter,
        setter,
        childNotice;

    descriptor = Object.getOwnPropertyDescriptor(obj, key);
    if (descriptor && descriptor.configurable === false) {
        return;
    }

    getter = descriptor.get;
    setter = descriptor.set;

    // 如果深度引用，则将子属性也转换为通知对象
    if(!shallow) {
        childNotice = new NotifyObject(val);
    }

    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function () {

        },
        set: function(newVal) {
            var oldVal = getter ? getter.call(obj) : val;
            if(oldVal === newVal || (newVal !== newVal && val !== val)) {
                return;
            }

            if(setter) {
                setter.call(obj, newVal);
            } else {
                val = newVal;
            }

            if(!shallow) {
                // 更新通知对象
                childNotice = new NotifyObject(newVal);
            }
        }
    });
}

function createNotifyObject(obj) {
    var isObject,
        isArray,
        notice;

    isObject = ui.core.isObject(obj);
    isArray = Array.isArray(obj);

    if(!isObject && !isArray) {
        return obj;
    }
    if(isObject && ui.core.isEmptyObject(obj)) {
        return obj;
    }

    if(Object.hasOwnProperty("__notice__") && obj.__notice__ instanceof NotifyObject) {
        notice = obj.__notice__;
        // TODO notice.count++;
    } else if((Array.isArray(obj) || ui.core.isPlainObject(obj)) && Object.isExtensible(obj)) {
        notice = new NotifyObject(obj);
    }

    return obj;
}

function NotifyObject(value) {
    if(this instanceof NotifyObject) {
        this.initialize(value);
    } else {
        return new NotifyObject(value);
    }
}
NotifyObject.prototype = {
    constructor: NotifyObject
    initialize: function() {
        this.value = value;
        this.dependency = new Dependency();
        value.__notice__ = this;
        if(Array.isArray(value)) {
            updatePrototype(value, arrayObserverPrototype, overrideMethods);
            this.arrayNotify(value);
        } else {
            this.objectNotify(value);
        }
    },
    arrayNotify: function(array) {
        var i, len;
        for(i = 0, len = array.length; i < len; i++) {
            createNotifyObject(array[i]);
        }
    },
    objectNotify: function(obj) {
        var keys = Object.keys(obj),
            i, len;

        for(i = 0, len = keys.length; i < len; i++) {
            defineNotifyProperty(obj, keys[i], obj[keys[i]]);
        }
    }
};

// 依赖属性
function Dependency() {

}
Dependency.prototype = {
    constructor: Dependency,
    // 添加依赖处理
    addPropertyChanged: function() {

    },
    // 移除依赖处理
    remove: function(item) {

    },
    depend: function() {
    },
    notify: function() {

    }
};


// 查看器
function Binder() {
    if(this instanceof Binder) {
        this.initialize();
    } else {
        return new Binder();
    }
}
Binder.prototype = {
    constructor: Binder,
    initialize: funciton() {

    }
};

ui.ViewModel = createNotifyObject;
