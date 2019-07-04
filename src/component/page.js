// 事件优先级
ui.eventPriority = {
    masterReady: 3,
    pageReady: 2,

    bodyResize: 3,
    ctrlResize: 2,
    elementResize: 2
};
function noop() {}
var page = {
        // resize事件延迟时间
        _resizeDelay: 200,
        _resizeTimeoutHandler: null,
        events: [
            "themechanged",
            "hlchanged", 
            "ready", 
            "htmlclick", 
            "docmouseup", 
            "resize", 
            "hashchange",
            "keydown",
            "load"
        ],
        $config: {
            // 模型对象
            model: null,
            // 创建
            created: null,
            // 布局处理
            layout: null,
            // 数据加载
            load: null,
            // 销毁
            destroy: null,
            // 错误处理
            error: null
        }
    },
    handlers = {}, 
    ranks = {};

page.event = new ui.CustomEvent(page);
page.event.initEvents();

function onError(e) {
    if(!this.$errors) {
        this.$errors = [];
    }
    this.$errors.push(e);
}

function getKeys(config) {
    var keys = Object.keys(config);
    keys.sort(function(a, b) {
        var v1 = ranks[a] || 99;
        var v2 = ranks[b] || 99;
        if(v1 === v2) {
            return 0;
        }
        return v1 < v2 ? -1 : 1;
    });
    return keys;
}

page.init = function(config) {
    var model = this.$config.model,
        readyHandler;
    
    if(ui.core.isPlainObject(config)) {
        model = ui.extend(true, {}, model, config.model);
        delete config.model;
        this.$config = ui.extend({}, this.$config, config);
        this.$config.model = model;
    }

    readyHandler = (function(e) {
        var config = this.$config,
            errorHandler = config.error,
            that = this;

        config.error = null;
        if(!ui.core.isFunction(errorHandler)) {
            errorHandler = onError;
        }

        getKeys(config).forEach(function(key) {
            var item = config[key];
            try {
                if(handlers.hasOwnProperty(key)) {
                    handlers[key].call(that, item);
                } else {
                    if(ui.core.isFunction(item)) {
                        item.call(that);
                    }
                }
            } catch(e) {
                e.cycleName = key;
                errorHandler.call(that, e);
            }
        });

        if(this.$errors) {
            this.$errors.forEach(function(e) {
                var errorMessage = ui.str.format("page init error. [{0}] {1}", e.cycleName, e.message);
                if(ui.errorShow) {
                    ui.errorShow(errorMessage);
                } else {
                    console.error(errorMessage);
                }
            });
            delete this.$errors;
        }
    }).bind(this);

    if(!this.$isInitAlready) {
        this.ready(readyHandler);
        this.$isInitAlready = true;
    }
};
page.plugin = function(plugin) {
    if(!plugin) {
        return;
    }

    if(!plugin.name || !ui.core.isFunction(plugin.handler)) {
        return;
    }

    if(this.$config[plugin.name]) {
        throw new Error("the name " + plugin.name + " is exists.");
    }

    this.$config[plugin.name] = noop;
    handlers[plugin.name] = plugin.handler;
    ranks[plugin.name] = plugin.rank;
};
page.watch = function(property, fn) {
    var vm = this.model,
        props, propertyName, i;
    if(!vm || !property || !ui.core.isFunction(fn)) {
        return;
    }

    props = property.split(".");
    for(i = 0; i < props.length; i++) {
        propertyName = props[i];
        vm = vm[propertyName];
        if(!ui.core.isObject(vm)) {
            throw new Error(propertyName + " can not bind watcher.");
        }
    }

    ui.ViewModel.bindOneWay(vm, propertyName, fn);
};

// 模型对象
page.plugin({
    name: "model",
    rank: 1,
    handler: function(arg) {
        var vm;
        if(ui.core.isFunction(arg)) {
            vm = arg.call(this);
        } else {
            vm = arg;
        }

        if(ui.core.isPlainObject(vm)) {
            this.model = ui.ViewModel(vm);
        }
    }
});
// 创建
page.plugin({
    name: "created",
    handler: function(arg) {
        if(ui.core.isFunction(arg)) {
            arg.call(this);
        }
    }
});
// 布局处理
page.plugin({
    name: "layout",
    handler: function(arg) {
        var resizeHandler;
        if(ui.core.isFunction(arg)) {
            resizeHandler = arg.bind(this);
            resizeHandler();
            this.resize(resizeHandler);
        }
    }
});
// 数据加载
page.plugin({
    name: "load",
    handler: function(arg) {
        var result,
            onload = (function() {
                this.fire("load");
            }).bind(this);
        if(ui.core.isFunction(arg)) {
            result = arg.call(this);
            if(ui.core.isFunction(result.then)) {
                result.then(onload, onload);
                return;
            }
        }
        onload();
    }
});
// 销毁
page.plugin({
    name: "destroy",
    handler: function(arg) {
        
    }
});

$(document)
    //注册全局ready事件
    .ready(function (e) {
        page.fire("ready");
    })
    //注册全局click事件
    .click(function (e) {
        page.fire("htmlclick", e.target);
    })

$(window)
    //注册全局resize事件
    .on("resize", function (e) {
        if(page._resizeTimeoutHandler) {
            clearTimeout(page._resizeTimeoutHandler);
        }
        page._resizeTimeoutHandler = setTimeout(function() {
            page._resizeTimeoutHandler = null;
            page.fire("resize");
        }, page._resizeDelay);
    })
    //注册全局hashchange事件
    .on("hashchange", function(e) {
        var hash = "";
        if(window.location.hash) {
            hash = window.location.hash;
        }
        page.fire("hashchange", hash);
    });

ui.page = page;
