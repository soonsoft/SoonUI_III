// 对象观察者

// 观察者
var arrayObserverPrototype = [],
    overrideMethods = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"];
// 劫持修改数组的API方法
overrideMethods.forEach(function(methodName) {
    var originalMethod = arrayObserverPrototype[methodName];

    arrayObserverPrototype[methodName] = function() {
        var result,
            insertedItems,
            args = arrayObserverPrototype.slice(arguments, 0);

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

        if(insertedItems) {
            // insertedItems 包装ViewModel 
        }
        // notify
        return result;
    };
});

function Observer() {
    if(this instanceof Observer) {
        this.initialize();
    } else {
        return new Observer();
    }
}
Observer.prototype = {
    constructor: Observer
    initialize: function() {
        this.__ob__ = this;
    },

};

// 查看器
function Watcher() {
    if(this instanceof Watcher) {
        this.initialize();
    } else {
        return new Watcher();
    }
}
Watcher.prototype = {
    constructor: Watcher,
    initialize: funciton() {

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
    remove: function() {

    },
    depend: function() {

    },
    notify: function() {

    }
};
