/*
    Master 模板页
 */

var master = {
    // 用户姓名
    name: "姓名",
    // 用户所属部门
    department: "部门",
    // 用户职位
    position: "职位",
    // 虚拟目录
    contextUrl: "/",
    //当前是否为起始页
    isHomePage: false,
    //当前页面是否加载了导航菜单
    noMenu: true,
    //内容区域宽度
    contentBodyWidth: 0,
    //内容区域高度
    contentBodyHeight: 0,

    init: function() {
        this.toolbar = {
            height: 40,
            extendHeight: 0
        };
        var that = this;
        ui.page.ready(function (e) {
            that._initElements();
            that._initContentSize();
            that._initUserSettings();
            ui.page.resize(function (e, clientWidth, clientHeight) {
                that._initContentSize();
            }, ui.eventPriority.bodyResize);
            
            if(window.pageLogic) {
                that.pageInit(pageLogic.init, pageLogic);
            }
        }, ui.eventPriority.masterReady);
    },
    _initElements: function () {
    },
    _initContentSize: function() {
        var clientWidth = document.documentElement.clientWidth,
            clientHeight = document.documentElement.clientHeight;
        this.head = $("#head");
        this.body = $("#body");
        if(this.head.length > 0) {
            clientHeight -= this.head.height();
        }
        var bodyMinHeight = clientHeight;
        this.body.css("height", bodyMinHeight + "px");
        this.contentBodyHeight = bodyMinHeight;
        this.contentBodyWidth = clientWidth;
    },
    _initUserSettings: function() {

    },
    /** 初始化页面方法 */
    pageInit: function (initObj, caller) {
        var func = null,
            caller = caller || this;
        var message = ["页面初始化时在[", "", "]阶段发生错误，", ""];
        if (ui.core.isPlainObject(initObj)) {
            for (var key in initObj) {
                func = initObj[key];
                if (ui.core.isFunction(func)) {
                    try {
                        func.call(caller);
                    } catch (e) {
                        message[1] = key;
                        message[3] = e.message;
                        ui.errorShow(message.join(""));
                    }
                }
            }
        }
    },
    /** 托管dom ready事件 */
    ready: function (fn) {
        if (ui.core.isFunction(fn)) {
            ui.page.ready(fn, ui.eventPriority.pageReady);
        }
    },
    /** 托管window resize事件 */
    resize: function (fn, autoCall) {
        if (ui.core.isFunction(fn)) {
            ui.page.resize(fn, ui.eventPriority.elementResize);
            if(autoCall !== false) {
                fn.call(ui);
            }
        }
    },
    /** 获取一个有效的url */
    getUrl: function(url) {
        var char;
        if(!url) {
            return this.contextUrl;
        }
        url = url.trim();
        char = this.contextUrl.charAt(this.contextUrl.length - 1);
        if(char === "/" || char === "\\")  {
            this.contextUrl = this.contextUrl.substring(0, this.contextUrl.length - 1) + "/";
        }

        char = url.charAt(0);
        if(char === "/" || char === "\\") {
            url = url.substring(1);
        }

        return this.contextUrl + url;
        
    }
};
ui.master = master;
