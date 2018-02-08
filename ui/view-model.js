// 对象观察者

// 观察者
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
