// Source: ui/viewpage/master.js

(function($, ui) {
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
        this.sidebarManager = ui.SidebarManager();
    },
    _initContentSize: function() {
        var bodyMinHeight,
            clientWidth,
            clientHeight;

        clientWidth = document.documentElement.clientWidth;
        clientHeight = document.documentElement.clientHeight;

        this.head = $("#head");
        this.body = $("#body");
        if(this.head.length > 0) {
            clientHeight -= this.head.height();
        } else {
            this.head = null;
        }
        bodyMinHeight = clientHeight;
        if(this.body.length > 0) {
            this.body.css("height", bodyMinHeight + "px");
        } else {
            this.body = null;
        }
        
        this.contentBodyHeight = bodyMinHeight;
        this.contentBodyWidth = clientWidth;
    },
    _initUserSettings: function() {
        var userProtrait,
            sidebarElement,
            userInfo,
            highlightPanel,
            operateList,
            htmlBuilder,
            i, len, color,
            sidebar,
            that;

        userProtrait = $("#user");
        if(userProtrait.length === 0) {
            return;
        }

        that = this;

        sidebarElement = $("<section class='user-settings' />");
        userInfo = $("<div class='user-info' />");
        highlightPanel = $("<div class='highlight-panel' />");
        operateList = $("<div class='operate-list' />");
        
        // 用户信息
        htmlBuilder = [];
        htmlBuilder.push(
            "<div class='protrait-cover'>",
            "<img class='protrait-img' src='", userProtrait.children("img").prop("src"), "' alt='用户头像' /></div>",
            "<div class='user-info-panel'>",
            "<span class='user-info-text' style='font-size:18px;line-height:36px;'>", this.name, "</span><br />",
            "<span class='user-info-text'>", this.department, "</span><br />",
            "<span class='user-info-text'>", this.position, "</span>",
            "</div>",
            "<br clear='left' />"
        );
        userInfo.append(htmlBuilder.join(""));

        //初始化当前用户的主题ID
        ui.theme.initHighlight();
        // 高亮色
        if(Array.isArray(ui.theme.Colors)) {
            htmlBuilder = [];
            htmlBuilder.push("<h3 class='highlight-group-title font-highlight'>个性色</h3>");
            htmlBuilder.push("<div style='width:100%;height:auto'>");
            for(i = 0, len = ui.theme.Colors.length; i < len; i++) {
                color = ui.theme.Colors[i];
                htmlBuilder.push("<a class='highlight-item");
                if(color.Id === ui.theme.currentHighlight.Id) {
                    htmlBuilder.push(" highlight-item-selected");
                }
                htmlBuilder.push("' href='javascript:void(0)' style='background-color:", color.Color, ";");
                htmlBuilder.push("' title='", color.Name, "' data-index='", i, "'>");
                htmlBuilder.push("<i class='fa fa-check-circle highlight-item-checker'></i>");
                htmlBuilder.push("</a>");
            }
            htmlBuilder.push("</div>");
            highlightPanel.append(htmlBuilder.join(""));
            setTimeout(function() {
                that._currentHighlightItem = highlightPanel.find(".highlight-item-selected");
                if(that._currentHighlightItem.length === 0) {
                    that._currentHighlightItem = null;
                }
            });
            highlightPanel.click(function(e) {
                var elem,
                    color;
                elem = $(e.target);
                while(!elem.hasClass("highlight-item")) {
                    if(elem.hasClass("highlight-panel")) {
                        return;
                    }
                    elem = elem.parent();
                }

                color = ui.theme.Colors[parseInt(elem.attr("data-index"), 10)];

                if(that._currentHighlightItem) {
                    that._currentHighlightItem.removeClass("highlight-item-selected");
                }

                that._currentHighlightItem = elem;
                that._currentHighlightItem.addClass("highlight-item-selected");
                //ui.theme.changeHighlight("/Home/ChangeTheme", color);
                $("#highlight").prop("href", ui.str.textFormat("../../../dist/theme/color/ui.metro.{0}.css", color.Id));
                ui.theme.setHighlight(color);
            });
        }

        // 操作列表
        htmlBuilder = [];
        htmlBuilder.push(
            "<ul class='operate-list-ul'>",
            "<li class='operate-list-li theme-panel-hover'>",
            "<span class='operate-text'>用户信息</span>",
            "<a class='operate-list-anchor' href='javascript:void(0)'></a>",
            "</li>",
            "<li class='operate-list-li theme-panel-hover'>",
            "<span class='operate-text'>修改密码</span>",
            "<a class='operate-list-anchor' href='javascript:void(0)'></a>",
            "</li>",
            "<li class='operate-list-li theme-panel-hover'>",
            "<span class='operate-text'>退出</span>",
            "<a class='operate-list-anchor' href='javascript:void(0)'></a>",
            "</li>",
            "</ul>"
        );
        operateList.append(htmlBuilder.join(""));

        sidebarElement
            .append(userInfo)
            .append(highlightPanel)
            .append("<hr class='horizontal' />")
            .append(operateList);

        sidebar = this.sidebarManager.setElement("userSidebar", {
            parent: "body",
            width: 240
        }, sidebarElement);
        sidebar._closeButton.css("color", "#ffffff");
        sidebarElement.before("<div class='user-settings-background title-color' />");
        sidebar.animator[0].ease = ui.AnimationStyle.easeFromTo;
        sidebar.contentAnimator = ui.animator({
            target: sidebarElement,
            begin: 100,
            end: 0,
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val, elem) {
                elem.css("left", val + "%");
            }
        });
        sidebar.contentAnimator.duration = 200;
        sidebar.showing(function() {
            sidebarElement.css("display", "none");
        });
        sidebar.showed(function() {
            sidebarElement.css({
                "display": "block",
                "left": "100%"
            });
            this.contentAnimator.start();
        });
        userProtrait.click(function(e) {
            that.sidebarManager.show("userSidebar");
        });
        
        
        setTimeout(function() {
            ui.theme.currentHighlight.Id
        });
        
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
                        throw e;
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


})(jQuery, ui);

// Source: ui/viewpage/sidebar-manager.js

(function($, ui) {
//边栏管理器
function SidebarManager() {
    if(this instanceof SidebarManager) {
        this.initialize();
    } else {
        return new SidebarManager();
    }
}
SidebarManager.prototype = {
    constructor: SidebarManager,
    initialize: function() {
        this.sidebars = new ui.KeyArray();
        return this;
    },
    setElement: function(name, option, element) {
        if(ui.str.isEmpty(name)) {
            return;
        }
        var sidebar = null,
            that = this;
        if(this.sidebars.containsKey(name)) {
            sidebar = this.sidebars.get(name);
            if(element) {
                sidebar.set(element);
            }
        } else {
            if(!option || !option.parent) {
                throw new Error("option is null");
            }
            sidebar = ui.ctrls.SidebarBase(option, element);
            sidebar.hiding(function(e) {
                that.currentBar = null;
            });
            this.sidebars.set(name, sidebar);
        }
        return sidebar;
    },
    get: function(name) {
        if(ui.str.isEmpty(name)) {
            return null;
        }
        if(this.sidebars.containsKey(name)) {
            return this.sidebars.get(name);
        }
        return null;
    },
    remove: function(name) {
        if(ui.str.isEmpty(name)) {
            return;
        }
        if(this.sidebars.containsKey(name)) {
            this.sidebars.remove(name);
        }
    },
    isShow: function() {
        return this.currentBar && this.currentBar.isShow();
    },
    show: function(name) {
        if(ui.str.isEmpty(name)) {
            return;
        }
        var sidebar = null,
            that = this;
        if(this.sidebars.containsKey(name)) {
            sidebar = this.sidebars.get(name);
            if(sidebar.isShow()) {
                return null;
            }
            if(this.currentBar) {
                return this.currentBar.hide().done(function() {
                    that.currentBar = sidebar;
                    sidebar.show();
                });
            } else {
                this.currentBar = sidebar;
                return sidebar.show();
            }
        }
        return null;
    },
    hide: function() {
        var sidebar = this.currentBar;
        if(ui.str.isEmpty(name)) {
            sidebar = this.currentBar;
        } else if(this.sidebars.containsKey(name)) {
            sidebar = this.sidebars.get(name);
        }
        if(!sidebar.isShow()) {
            return null;
        }
        if(sidebar) {
            this.currentBar = null;
            return sidebar.hide();
        }
        return null;
    }
};

ui.SidebarManager = SidebarManager;


})(jQuery, ui);

// Source: ui/viewpage/toolbar.js

(function($, ui) {
// toolbar
function Toolbar(option) {
    if(this instanceof Toolbar) {
        this.initialize(option);
    } else {
        return new Toolbar(option);
    }
}
Toolbar.prototype = {
    constructor: Toolbar,
    initialize: function(option) {
        if(!option) {
            option = {};
        }
        this.toolbarPanel = ui.getJQueryElement(option.toolbarId);
        if(!this.toolbarPanel) {
            return;
        }
        this.height = this.toolbarPanel.height();
        this.tools = this.toolbarPanel.children(".tools");
        this.extendPanel = this.toolbarPanel.children(".toolbar-extend");
        if(this.extendPanel.length > 0) {
            this.defaultExtendShow = !!option.defaultExtendShow;
            this._initExtendPanel();
        }
        var i = 0,
            len = this.tools.length,
            buttons;
        for(; i < len; i++) {
            buttons = $(this.tools[i]).children(".action-buttons");
            if(buttons.length > 0) {
                buttons.children(".tool-action-button").addClass("font-highlight-hover");
            }
        }
    },
    _initExtendPanel: function() {
        this.extendHeight = parseFloat(this.extendPanel.css("height"));
        this._wrapExtendPanel();
        this._createExtendAnimator();
        this._initExtendButton();
        this._initPinButton();
        if(this.defaultExtendShow) {
            this.showExtend(false);
            this.pinExtend();
        }
    },
    _wrapExtendPanel: function() {
        var position = this.toolbarPanel.css("position");
        if (position !== "absolute" && position !== "relative" && position !== "fixed") {
            this.toolbarPanel.css("position", "relative");
        }
        this.extendWrapPanel = $("<div style='position:absolute;height:0px;width:100%;display:none;overflow:hidden;'/>");
        this.extendWrapPanel.css("top", this.height + "px");
        this.extendPanel.css("top", (-this.extendHeight) + "px");
        this.extendPanel.addClass("clear");
        this.extendWrapPanel.append(this.extendPanel);
        this.toolbarPanel.append(this.extendWrapPanel);
    },
    _createExtendAnimator: function() {
        this.extendAnimator = ui.animator({
            target: this.extendPanel,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("top", val + "px");
            }
        }).addTarget({
            target: this.extendWrapPanel,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("height", val + "px");
            }
        });
        this.extendAnimator.duration = 300;
    },
    _initExtendButton: function() {
        this.extendButton = this.toolbarPanel.find(".tool-extend-button");
        var moreTool,
            moreActions;
        if(this.extendButton.length === 0) {
            moreTool = $("<ul class='tools' style='float:right;margin-left:0px;'></ul>");
            moreActions = $("<li class='action-buttons'></li>");
            moreTool.append(moreActions);
            if(this.tools.length === 0) {
                this.extendPanel.parent().before(moreTool);
            } else {
                $(this.tools[0]).before(moreTool);
            }
            this.tools = this.toolbarPanel.children(".tools");
            this.extendButton = $("<a class='tool-action-button tool-extend-button' href='javascript:void(0)' title='更多'><i class='fa fa-ellipsis-h'></i></a>");
            moreActions.append(this.extendButton);
        }
        
        var that = this;
        this.extendButton.click(function(e) {
            if(that.isExtendShow()) {
                that.hideExtend();
            } else {
                that.showExtend();
            }
        });
    },
    _initPinButton: function() {
        this.pinButton = $("<a class='tool-extend-pin-button font-highlight-hover' href='javascript:void(0)' title='固定扩展区域'><i class='fa fa-thumb-tack'></i></a>");
        this.extendWrapPanel.append(this.pinButton);
        var that = this;
        this.pinButton.click(function(e) {
            if(that.isExtendPin()) {
                that.unpinExtend();
            } else {
                that.pinExtend();
            }
        });
    },
    isExtendShow: function() {
        return this.extendButton.hasClass("extend-show");
    },
    showExtend: function(animation) {
        var option;
        if(this.extendAnimator.isStarted) {
            return;
        }
        this.extendButton
            .addClass("extend-show")
            .removeClass("font-highlight-hover")
            .addClass("background-highlight");
        this._cssOverflow = this.toolbarPanel.css("overflow");
        this.toolbarPanel.css("overflow", "visible");

        if(animation === false) {
            this.extendWrapPanel.css({
                "height": this.extendHeight + "px",
                "display": "block"
            });
            this.extendPanel.css("top", "0px");
        } else {
            option = this.extendAnimator[0];
            option.begin = -this.extendHeight;
            option.end = 0;
            
            option = this.extendAnimator[1];
            option.begin = 0;
            option.end = this.extendHeight;

            option.target.css({
                "height": "0px",
                "display": "block"
            });
            this.extendAnimator.start();
        }
    },
    hideExtend: function(animation) {
        var option, that;
        if(this.extendAnimator.isStarted) {
            return;
        }
        this.extendButton
            .removeClass("extend-show")
            .addClass("font-highlight-hover")
            .removeClass("background-highlight");

        if(animation === false) {
            this.extendWrapPanel.css({
                "height": "0px",
                "display": "none"
            });
            this.extendPanel.css("top", -this.extendHeight + "px");
            this.toolbarPanel.css("overflow", this._cssOverflow);
        } else {
            that = this;

            option = this.extendAnimator[0];
            option.begin = 0;
            option.end = -this.extendHeight;
            
            option = this.extendAnimator[1];
            option.begin = this.extendHeight;
            option.end = 0;
            
            this.extendAnimator.start().done(function() {
                that.toolbarPanel.css("overflow", that._cssOverflow);
                option.target.css("display", "none");
            });
        }
    },
    _fireResize: function() {
        ui.fire("resize");
    },
    isExtendPin: function() {
        return this.pinButton.hasClass("extend-pin");  
    },
    pinExtend: function() {
        this.pinButton.addClass("extend-pin");
        this.pinButton.children("i")
            .removeClass("fa-thumb-tack")
            .addClass("fa-angle-up");
        this.extendButton.css("display", "none");
        
        this.height = this.height + this.extendHeight;
        this.toolbarPanel.css("height", this.height + "px");
        this._fireResize();
    },
    unpinExtend: function() {
        this.pinButton.removeClass("extend-pin");
        this.pinButton.children("i")
            .removeClass("fa-angle-up")
            .addClass("fa-thumb-tack");
        this.extendButton.css("display", "inline-block");
            
        this.height = this.height - this.extendHeight;
        this.toolbarPanel.css("height", this.height + "px");
        this._fireResize();
        this.hideExtend();
    }
};

ui.Toolbar = Toolbar;


})(jQuery, ui);
