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

function noop() {}

function defineNotifyProperty(obj, propertyName, val, shallow, path) {
    var descriptor,
        getter,
        setter,
        notice,
        childNotice;

    descriptor = Object.getOwnPropertyDescriptor(obj, propertyName);
    if (descriptor && descriptor.configurable === false) {
        return;
    }

    getter = descriptor.get;
    setter = descriptor.set;

    // 如果深度引用，则将子属性也转换为通知对象
    if(!shallow) {
        childNotice = new NotifyObject(val);
    }

    notice = obj.__notice__;
    Object.defineProperty(obj, propertyName, {
        enumerable: true,
        configurable: true,
        get: function () {
            return getter ? getter.call(obj) : val;
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
            notice.dependency.notify(propertyName);
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

    if(obj.hasOwnProperty("__notice__") && obj.__notice__ instanceof NotifyObject) {
        notice = obj.__notice__;
        // TODO notice.count++;
    } else if((isArray || isObject) && Object.isExtensible(obj)) {
        notice = new NotifyObject(obj);
    }

    return obj;
}

function NotifyObject(obj) {
    this.value = value;
    this.dependency = new Dependency();
    value.__notice__ = this;
    if(Array.isArray(value)) {
        updatePrototype(value, arrayObserverPrototype, overrideMethods);
        this.arrayNotify(value);
    } else {
        this.objectNotify(value);
    }
}
NotifyObject.prototype = {
    constructor: NotifyObject,
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
    this.depMap = {};
}
Dependency.prototype = {
    constructor: Dependency,
    // 添加依赖处理
    add: function(binder) {
        var propertyName;
        if(binder instanceof Binder) {
            propertyName = binder.propertyName;
            if(!this.depMap.hasOwnProperty(binder.propertyName)) {
                this.depMap[propertyName] = [];
            }
            this.depMap[propertyName].push(binder);
        }
    },
    // 移除依赖处理
    remove: function(binder) {
        var propertyName;
        if(binder instanceof Binder) {
            var propertyName,
                binderList,
                i, len;
            propertyName = binder.propertyName;
            binderList = this.depMap[propertyName];

            if(Array.isArray(binderList)) {
                for(i = binderList.length - 1; i >= 0; i--) {
                    if(binderList[i] === binder) {
                        binderList.splice(i, 1);
                        break;
                    }
                }
            }
        }
    },
    depend: function() {
    },
    // 变化通知
    notify: function(propertyName) {
        var keys,
            delegate,
            errors,
            i, len;
        if(ui.core.type(propertyName) === "string" && propertyName) {
            if(this.depMap.hasOwnProperty(propertyName)) {
                keys = [propertyName];    
            } else {
                keys = [];
            }
        } else {
            keys = Object.keys(this.depMap);
        }
        errors = [];
        for(i = 0, len = keys.length; i < len; i++) {
            delegate = this.depMap[keys[i]];
            delegate.forEach(function(binder) {
                try {
                    binder.update();
                } catch(e) {
                    errors.push(e);
                }
            });
        }
        if(errors.length > 0) {
            throw errors.toString();
        }
    }
};


// 查看器
function Binder(option) {
    var propertyName = null;
    Object.defineProperty(this, "propertyName", {
        configurable: false,
        enumerable: true,
        get: function() {
            if(!propertyName) {
                return "_";
            }
            return propertyName;
        },
        set: function(val) {
            propertyName = val;
        }
    });

    this.viewModel = null;
    this.isActive = true;

    if(option) {
        this.sync = !!option.sync;
        //this.lazy = !!option.lazy;
    } else {
        this.sync = this.lazy = false;
    }

    this.value = this.lazy ? null : this.get();
}
Binder.prototype = {
    constructor: Binder,
    update: function() {
        if(!this.isActive) {
            return;
        }

        if(this.sync) {
            this.execute();
        } else {
            enqueue(this);
        }
    },
    execute: function() {
        var oldValue,
            value;

        oldValue = this.value;
        value = this.get();

        if(value !== oldValue) {
            this.value = value;
            try {
                this.action(value, oldValue);
            } catch(e) {
                ui.core.handleError(e);
            }
        }
    },
    get: function() {
        var value = null;

        if(this.viewModel && this.viewModel.hasOwnProperty(this.propertyName)) {
            value = this.viewModel[this.propertyName];
        }

        return value;
    }
};

function createBinder(viewModel, propertyName, bindData, handler, option) {
    var binder;
    if(!viewModel || viewModel.__notice__) {
        throw new TypeError("the arguments 'viewModel' is invalid.");
    }
    if(!viewModel.hasOwnProperty(propertyName)) {
        throw new TypeError("the property '" + propertyName + "' not belong to the viewModel.");
    }
    if(!ui.core.isFunction(bindData)) {
        handler = bindData;
        bindData = null;
    }
    if(!ui.core.isFunction(handler)) {
        return null;
    }

    binder = new Binder(option);
    binder.propertyName = propertyName;
    binder.viewModel = vm;
    binder.action = function(value, oldValue) {
        handler.call(viewModel, value, oldValue, bindData);
    };

    return binder;
}

ui.ViewModel = createNotifyObject;
ui.ViewModel.bindOnce = function(vm, propertyName, bindData, fn) {
    var binder = createBinder(viewModel, propertyName, bindData, fn);
};
ui.ViewModel.bindOneWay = function(viewModel, propertyName, bindData, fn, isSync) {
    var binder,
        option;

    option = {
        sync: !!isSync
    };
    binder = createBinder(viewModel, propertyName, bindData, fn, option);
    if(binder) {
        viewModel.dependency.add(binder);
    }
};
ui.ViewModel.bindTwoWay = function(option) {
    //var binder = createBinder();
};
