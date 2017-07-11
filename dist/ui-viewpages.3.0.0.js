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
        var that;
        this.sidebarManager = ui.SidebarManager();
        if(!this.noMenu) {
            this.menu = ui.ctrls.Menu({
                style: "modern",
                //style: "normal",
                menuPanel: $(".ui-menu-panel"),
                contentContainer: $(".content-container"),
                extendMethod: "extrusion",
                //contentContainer: null,
                //extendMethod: "cover",
                menuButton: $(".ui-menu-button")
            });

            that = this;
            this.menu.showed(function(e) {
                if(this.isExtrusion()) {
                    that.contentBodyWidth -= this.menuWidth - this.menuNarrowWidth;
                } else {
                    that.contentBodyWidth -= this.menuWidth;
                }
            });
            this.menu.hided(function(e) {
                if(this.isExtrusion()) {
                    that.contentBodyWidth += this.menuWidth - this.menuNarrowWidth;
                } else {
                    that.contentBodyWidth += this.menuWidth;
                }
            });
        }
    },
    _initContentSize: function() {
        var bodyMinHeight,
            clientWidth,
            clientHeight,
            that;

        if(this.menu) {
            if(this.menu.disableResizeable) {
                return;
            }
        }

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

        if(this.menu) {
            this.menu.resize(this.contentBodyWidth, this.contentBodyHeight);
        }
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
                $("#highlight").prop("href", ui.str.textFormat("../../dist/theme/color/ui.metro.{0}.css", color.Id));
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

// Source: ui/viewpage/menu.js

(function($, ui) {
var showClass = "ui-menu-button-show",
    currentClass = "current-menu",
    itemHeight = 30;

var normalStyle,
    modernStyle;
// 普通模式的菜单逻辑
normalStyle = {
    show: function(animation) {
        var animator,
            option,
            left,
            that;
        if (animation === false) {
            this.resize();
            this._fireResize();
            return;
        }

        animator = this.menuPanelAnimator;
        animator.stop();

        option = animator[0];
        left = parseInt(option.target.css("left"), 10);
        if (left >= 0) {
            option.target.css("left", "0px");
            return;
        }
        option.begin = left;
        option.end = 0;

        if(animator.length > 1) {
            option = animator[1];
            option.begin = parseInt(option.target.css("left"), 10);
            option.end = this.menuWidth;

            option = animator[2];
            option.begin = parseInt(option.target.css("width"), 10);
            option.end = document.documentElement.clientWidth - this.menuWidth;
        }

        that = this;
        animator.start().done(function () {
            that.hideState = false;
        });
    },
    hide: function(animation) {
        var animator,
            option,
            left,
            that;
        if (animation === false) {
            this.resize();
            this._fireResize();
            return;
        }

        animator = this.menuPanelAnimator;
        animator.stop();

        option = animator[0];
        left = parseInt(option.target.css("left"), 10);
        if (left <= -this.menuWidth) {
            option.target.css("left", -this.menuWidth + "px");
            return;
        }
        animator[0].begin = left;
        animator[0].end = -this.menuWidth;

        if(animator.length > 1) {
            option = animator[1];
            option.begin = parseInt(option.target.css("left"), 10);
            option.end = 0;

            option = animator[2];
            option.begin = parseInt(option.target.css("width"), 10);
            option.end = document.documentElement.clientWidth;
        }

        that = this;
        animator.start().done(function () {
            that.hideState = true;
        });
    },
    subShow: function(elem, animation) {
        var maxHeight,
            ul,
            count,
            animator,
            option,
            beginVal;

        ul = elem.children("ul");
        count = ul.children().length;
        if (count === 0) {
            return;
        }
        maxHeight = count * itemHeight;

        elem.prev().find(".allow")
            .removeClass("fa-angle-down")
            .addClass("fa-angle-up");
        if (animation === false) {
            elem.css({
                "display": "block",
                "height": maxHeight + "px"
            });
            ul.css("top", "0px");
            return;
        }

        animator = this.submenuAnimator;
        animator.stop();
        animator.duration = 360;

        option = animator[0];
        option.target = elem;
        option.begin = elem.height();
        option.end = maxHeight;
        option.ease = ui.AnimationStyle.easeTo;
        option.target.css("display", "block");

        beginVal = option.end - option.begin;
        option = animator[1];
        option.target = ul;
        option.begin = -beginVal;
        option.end = 0;
        option.ease = ui.AnimationStyle.easeTo;
        option.target.css("top", -beginVal + "px");

        animator.onEnd = null;
        return animator.start();
    },
    subHide: function(elem, animation, endFn) {
        var ul, subMenusHeight,
            animator,
            option;

        elem.prev().find(".allow")
            .removeClass("fa-angle-up")
            .addClass("fa-angle-down");

        ul = elem.children("ul");
        subMenusHeight = ul.children().length * itemHeight;
        if (ui.core.isFunction(animation)) {
            endFn = animation;
            animation = undefined;
        }
        if (animation === false) {
            elem.css({
                "display": "none",
                "height": "0px"
            });
            ul.css("top", -subMenusHeight);
            if (ui.core.isFunction(endFn)) {
                endFn();
            }
            return;
        }

        animator = this.submenuAnimator;
        animator.stop();
        
        option = animator[0];
        option.target = elem;
        animator.duration = 360;
        option.begin = elem.height();
        option.end = 0;
        option.ease = ui.AnimationStyle.easeFrom;

        option = animator[1];
        option.target = ul;
        option.begin = parseFloat(option.target.css("top"));
        option.end = -subMenusHeight;
        option.ease = ui.AnimationStyle.easeFrom;

        animator.onEnd = endFn;
        return animator.start();
    },
    resize: function(contentWidth, contentHeight) {
        if (this.isShow()) {
            //显示菜单
            if(this.isExtrusion()) {
                if(!contentWidth) {
                    contentWidth = document.documentElement.clientWidth;
                }
                this.option.contentContainer.css({
                    "width": (contentWidth - this.menuWidth) + "px",
                    "left": this.menuWidth + "px"
                });
            }
            this.option.menuPanel.css("left", "0px");
            this.fire("showed");
        } else {
            //隐藏菜单
            if(this.isExtrusion()) {
                this.option.contentContainer.css({
                    "width": "100%",
                    "left": "0px"
                });
            }
            this.option.menuPanel.css({
                "left": -this.menuWidth + "px"
            });
            this.fire("hided");
        }
    }
};
// 现代模式的菜单逻辑
modernStyle = {
    show: function(animation) {
        var subElem;

        this.onMenuItemClickHandler = this.onMenuItemNormalClickHandler;
        if (this._currentMenu) {
            //展开选中菜单的子菜单
            this.submenuPanel
                    .removeClass(currentClass)
                    .removeClass("background-highlight");
            this.submenuPanel.css("display", "none");
            this.submenuList.html("");
            subElem = this._getSubmenuElement(false);
            if (subElem) {
                subElem
                    .addClass(currentClass)
                    .addClass("background-highlight");
                // 调用普通模式的展开逻辑
                normalStyle.subShow.call(this, subElem, false);
            }
        }

        this._updateStatusToSrc(false);
        
        this.resize();
        this._fireResize();
    },
    hide: function(animation) {
        var subElem,
            callback;

        this.onMenuItemClickHandler = this.onMenuItemModernClickHandler;
        if (this._currentMenu) {
            //折叠已经展开的子菜单
            subElem = this._getSubmenuElement(false);
            if (subElem) {
                normalStyle.subHide.call(this, subElem, false, function () {
                    subElem
                        .removeClass(currentClass)
                        .removeClass("background-highlight");
                    subElem.css("display", "none");
                });
            }
            this._currentMenu
                    .removeClass(currentClass)
                    .removeClass("background-highlight");
            this._currentMenu = null;
        }
        this._updateStatusToSrc(true);

        this.resize();
        this._fireResize();
    },
    subShow: function(elem, animation) {
        var animator,
            option,
            submenuListShowFn;
        if (this.isShow()) {
            normalStyle.subShow.apply(this, arguments);
        } else {
            if (animation === false) {
                this._setSubmenuList();
                this.submenuPanel.css("display", "block");
                return;
            }
            animator = this.submenuPanelAnimator;
            if(animator.isStarted) {
                return;
            }
            animator.onEnd = null;
            submenuListShowFn = $.proxy(function () {
                var that;
                this.submenuList.css("display", "none");
                this._setSubmenuList();
                that = this;
                setTimeout(function () {
                    var option;
                    that.submenuList.css({
                        "display": "block",
                        "left": -that.menuWidth + "px"
                    });
                    option = that.submenuListAnimator[0];
                    option.begin = -that.menuWidth;
                    option.end = 0;
                    that.submenuListAnimator.start();
                });

            }, this);
            if (elem.css("display") === "none") {
                option = animator[0];
                option.begin = -(this.menuWidth - this.menuNarrowWidth) + this.menuNarrowWidth;
                option.end = this.menuNarrowWidth;
                option.target.css("display", "block");

                animator.onEnd = submenuListShowFn;
                animator.start();
            } else {
                submenuListShowFn();
            }
        }
    },
    subHide: function(elem, animation, endFn) {
        var animator,
            that;
        if (this.isShow()) {
            normalStyle.subHide.apply(this, arguments);
        } else {
            if (animation === false) {
                this.submenuPanel.css("display", "none");
                endFn();
                this.submenuList.html("");
                return;
            }

            animator = this.submenuPanelAnimator;
            if (animator.isStarted) {
                return;
            }
            option = animator[0];
            option.begin = this.menuNarrowWidth;
            option.end = -(this.menuWidth - this.menuNarrowWidth);

            that = this;
            animator.onEnd = endFn;
            animator.start().done(function () {
                that.submenuList.html("");
            });
        }
    },
    resize: function(contentWidth, contentHeight) {
        if(!contentWidth) {
            contentWidth = document.documentElement.clientWidth - this.menuNarrowWidth;
        }
        if (this.isShow()) {
            //展开菜单
            if(this.isExtrusion()) {
                this.option.contentContainer.css({
                    "width": (contentWidth - (this.menuWidth - this.menuNarrowWidth)) + "px",
                    "left": this.menuWidth + "px"
                });
            }
            this.option.menuPanel.removeClass("ui-menu-panel-narrow");
            this.option.menuPanel.css("width", this.menuWidth + "px");
            this.fire("showed");
        } else {
            //收缩菜单
            if(this.isExtrusion()) {
                this.option.contentContainer.css({
                    "width": (contentWidth + (this.menuWidth - this.menuNarrowWidth)) + "px",
                    "left": this.menuNarrowWidth + "px"
                });
            }
            this.option.menuPanel.addClass("ui-menu-panel-narrow");
            this.option.menuPanel.css("width", this.menuNarrowWidth + "px");
            this.fire("hided");
        }
    },
    // 设置子菜单列表
    _setSubmenuList: function() {
        var dd,
            htmlBuilder,
            i, len, list;

        dd = this._getSubmenuElement(false);
        if(!dd) {
            return;
        }
        htmlBuilder = [];
        list = dd.children().children();
        for (i = 0, len = list.length; i < len; i++) {
            htmlBuilder.push(list[i].outerHTML);
        }
        this.submenuList.html(htmlBuilder.join(""));
    }
};

// 普通菜单点击事件处理
function onMenuItemNormalClick(e) {
    var elem,
        nodeName,
        openFn,
        closeFn,
        subElem;
    
    e.stopPropagation();
    elem = $(e.target);
    while ((nodeName = elem.nodeName()) !== "DT") {
        if (nodeName === "DL" || nodeName === "A") {
            return;
        }
        elem = elem.parent();
    }
    openFn = $.proxy(function () {
        var subElem;
        this._currentMenu = elem;
        this._currentMenu
                .addClass(currentClass)
                .addClass("background-highlight");
        subElem = this._getSubmenuElement();
        if (subElem) {
            subElem
                .addClass(currentClass)
                .addClass("background-highlight");
            this.subShow(subElem, this.hasAnimation);
        }
    }, this);
    closeFn = $.proxy(function () {
        var subElem;
        this._currentMenu
                .removeClass(currentClass)
                .removeClass("background-highlight");
        subElem = this._getSubmenuElement();
        subElem
            .removeClass(currentClass)
            .removeClass("background-highlight");
        subElem.css("display", "none");
        if (this._currentMenu[0] !== elem[0]) {
            this._currentMenu = null;
            openFn();
        } else {
            this._currentMenu = null;
        }
    }, this);

    if (this._currentMenu) {
        subElem = this._getSubmenuElement();
        if (subElem) {
            this.subHide(subElem, this.hasAnimation(), closeFn);
            return;
        } else {
            this._currentMenu
                    .removeClass(currentClass)
                    .removeClass("background-highlight");
        }
    }
    openFn();
}
// 现代菜单点击事件处理
function onMenuItemModernClick(e) {
    var elem,
        nodeName,
        subElem,
        openFn,
        closeFn;

    e.stopPropagation();
    elem = $(e.target);
    while ((nodeName = elem.nodeName()) !== "DT") {
        if (nodeName === "DL" || nodeName === "A") {
            return;
        }
        elem = elem.parent();
    }

    subElem = elem.next();
    if(subElem.length === 0 || subElem.nodeName() !== "DD") {
        return;
    }

    openFn = $.proxy(function () {
        var submenuPanel;
        this._currentMenu = elem;
        this._currentMenu
                .addClass(currentClass)
                .addClass("background-highlight");
        submenuPanel = this._getSubmenuElement();
        submenuPanel
            .addClass(currentClass)
            .addClass("background-highlight");
        this.subShow(submenuPanel, this.hasAnimation);
    }, this);
    closeFn = $.proxy(function () {
        var subElem;
        this._currentMenu
                .removeClass(currentClass)
                .removeClass("background-highlight");
        subElem = this._getSubmenuElement();
        subElem
            .removeClass(currentClass)
            .removeClass("background-highlight");
        subElem.css("display", "none");
        this._currentMenu = null;
    }, this);

    if (this._currentMenu) {
        if (this._currentMenu[0] === elem[0]) {
            this.subHide(this._getSubmenuElement(), this.hasAnimation(), closeFn);
        } else {
            this._currentMenu
                    .removeClass(currentClass)
                    .removeClass("background-highlight");
            this._currentMenu = null;
            openFn();
        }
    } else {
        openFn();
    }
}

ui.define("ui.ctrls.Menu", {
    _defineOption: function() {
        return {
            // 菜单样式，普通: normal | 现代: modern
            style: "normal",
            // URL前缀，用于定位路径
            urlPrefix: "",
            // 菜单区域
            menuPanel: null,
            // 内容区域
            contentContainer: null,
            // 展开方式，是覆盖还是挤压 cover | extrusion
            extendMethod: "extrusion",
            // 菜单呼出按钮
            menuButton: null,
            // 是否启用动画效果
            animation: true
        };
    },
    _defineEvents: function() {
        return ["showed", "hided"];
    },
    _create: function() {
        this.menuWidth = 240;
        this.menuNarrowWidth = 48;
        this._menuButtonBg = null;
        if(this.option.menuButton) {
            this._menuButtonBg = this.option.menuButton.children("b");
        }

        if(this.option.style !== "modern") {
            this.option.style = "normal";
        }

        if(this.isModern()) {
            style = modernStyle;
            this._initSubmenuPanel();
        } else {
            style = normalStyle;
        }

        for(key in style) {
            if(style.hasOwnProperty(key)) {
                this[key] = style[key];
            }
        }

        if (this.hasAnimation()) {
            this._initMenuPanelAnimator();
            this._initSubmenuAnimator();
        }

        // 普通父菜单点击事件
        this.onMenuItemNormalClickHandler = $.proxy(onMenuItemNormalClick, this);
        // 现代父菜单点击事件
        this.onMenuItemModernClickHandler = $.proxy(onMenuItemModernClick, this);
        
        // 默认设置为普通展开模式
        this.onMenuItemClickHandler = this.onMenuItemNormalClickHandler;
    },
    _render: function() {
        var style,
            key;

        this.menuList = $("<dl class='menu-list title-color' />");
        this.option.menuPanel.addClass("title-color");
        this.option.menuPanel.css("width", this.menuWidth + "px");
        this.option.menuPanel.append(this.menuList);
        
        this._initMenuList();
        if (this.defaultShow()) {
            this.option.menuButton.addClass(showClass);
        } else {
            this.hide(false);
        }
    },
    _initMenuPanelAnimator: function () {
        var that = this;
        //初始化动画
        this.menuPanelAnimator = ui.animator({
            target: this.option.menuPanel,
            ease: ui.AnimationStyle.easeTo,
            onChange: function (val, elem) {
                elem.css("left", val + "px");
            }
        });
        if(this.isExtrusion()) {
            this.menuPanelAnimator.addTarget({
                target: this.option.contentContainer,
                ease: ui.AnimationStyle.easeTo,
                onChange: function (val, elem) {
                    elem.css("left", val + "px");
                }
            }).addTarget({
                target: this.option.contentContainer,
                ease: ui.AnimationStyle.easeTo,
                onChange: function (val, elem) {
                    elem.css("width", val + "px");
                    mp.contentBodyWidth = val;

                    that._fireResize();
                }
            });
        }
        this.menuPanelAnimator.duration = 300;
    },
    _initSubmenuAnimator: function() {
        this.submenuAnimator = ui.animator({
            onChange: function (val, elem) {
                elem.css("height", parseInt(val, 10) + "px");
            }
        }).addTarget({
            onChange: function (val, elem) {
                elem.css("top", parseInt(val, 10) + "px");
            }
        });
    },
    _initSubmenuPanel: function() {
        this.submenuPanel = $("<div class='submenu-slide-panel' />");
        this.submenuPanel.css({
            "left": this.menuNarrowWidth + "px",
            "width": this.menuWidth - this.menuNarrowWidth + "px"
        });
        this.submenuPanel.addClass("title-color");
        this.submenuList = $("<ul class='submenu-list' />");
        this.submenuPanel.append("<b class='submenu-background'></b>");
        this.submenuPanel.append(this.submenuList);
        this.option.menuPanel.prepend(this.submenuPanel);

        if(this.hasAnimation()) {
            this._initSubmenuPanelAnimator();
        }
    },
    _initSubmenuPanelAnimator: function() {
        this.submenuPanelAnimator = ui.animator({
            target: this.submenuPanel,
            ease: ui.AnimationStyle.easeTo,
            onChange: function (val) {
                this.target.css("left", val);
            }
        });
        this.submenuPanelAnimator.duration = 200;

        this.submenuListAnimator = ui.animator({
            target: this.submenuList,
            ease: ui.AnimationStyle.easeTo,
            onChange: function (val) {
                this.target.css("left", val + "px")
            }
        });
        this.submenuListAnimator.duration = 100;
    },
    _initMenuList: function () {
        var nextdd,
            menuButton,
            that;

        //展开选中的子菜单
        this._updateMenuSelectedStatus();

        that = this;
        //菜单点击事件
        this.menuList.click(function (e) {
            that.onMenuItemClickHandler(e);
        });
        
        //菜单汉堡按钮点击事件
        menuButton = this.option.menuButton;
        menuButton.click(function (e) {
            if (menuButton.hasClass(showClass)) {
                menuButton.removeClass(showClass);
                that.hide(that.hasAnimation);
            } else {
                menuButton.addClass(showClass);
                that.show(that.hasAnimation);
            }
        });
    },

    _updateMenuSelectedStatus: function() {
        this._currentMenu = this.option.menuPanel.find("dt." + currentClass);
        if (this._currentMenu.length === 0) {
            this._currentMenu = null;
        }
        if (this._isCloseStatus()) {
            this.option.menuButton.removeClass(showClass);
            this.hide(false);
        } else if(this._currentMenu) {
            nextdd = this._currentMenu.next();
            if (nextdd.nodeName() === "DD") {
                this.subShow(nextdd, false);
            }
        }
    },
    _getSubmenuElement: function (isNarrow) {
        var subElement;
        if (!ui.core.isBoolean(isNarrow)) {
            isNarrow = !this.isShow();
        }
        if (this.isModern() && isNarrow) {
            subElement = this.submenuPanel;
        } else {
            subElement = this._currentMenu.next();
            if(subElement.lenght == 0 || subElement.nodeName() !== "DD") {
                subElement = null;
            }
        }
        return subElement;
    },
    _fireResize: function() {
        this.disableResizeable = true;
        ui.page.fire("resize");
        this.disableResizeable = false;
    },
    _parentCode: function (code) {
        var index;
        if (!code) {
            return null;
        }
        index = code.lastIndexOf("_");
        if (index < 0) {
            return null;
        }
        return code.substring(0, index);
    },
    _getUrl: function(url) {
        var http = /^(http|https):\/\/\w*/i,
            result;
        if (ui.str.isEmpty(url)) {
            return "";
        }
        if (url.indexOf("javascript:") == 0) {
            return url;
        }

        if (http.test(url)) {
            result = url;
        } else {
            result = "" + url;
        }
        return this.option.urlPrefix + result;
    },
    _addMenuCodeToSrc: function (url, code) {
        var result = this._getUrl(url);
        if (result.indexOf("javascript:") == 0) {
            return result;
        }
        if (ui.str.isEmpty(result)) {
            return "javascript:void(0)";
        }
        if (!ui.str.isEmpty(code)) {
            if (result.indexOf("?") > -1) {
                result += "&_m=" + ui.str.base64Encode(code);
            } else {
                result += "?_m=" + ui.str.base64Encode(code);
            }
        }
        return result;
    },
    _updateStatusToSrc: function (isAdd) {
        var items,
            i, len, item, j,
            subItems,
            subNodeName = "DD",
            menuStatusFn;
        if (isAdd) {
            menuStatusFn = this._addMenuStatus;
        } else {
            menuStatusFn = this._removeMenuStatus;
        }

        items = this.option.menuPanel.children().children()
        for (i = 0, len = items.length; i < len; i++) {
            item = $(items[i]);
            if (item.next().nodeName() === subNodeName) {
                i++;
                subItems = item.next().children().children();
                for (j = 0; j < subItems.length; j++) {
                    menuStatusFn.call(this,
                        $(subItems[j]).children(".menu-item-container").children("a"));
                }
            } else {
                menuStatusFn.call(this,
                    item.children(".menu-item-container").children("a"));
            }
        }
    },
    _addMenuStatus: function (anchor) {
        var link, 
            index;

        link = this._getUrl(anchor.attr("href"));
        if (link.indexOf("javascript:") === 0) {
            return;
        }
        index = link.indexOf("?");
        if (index == -1) {
            link += "?_s=close";
        } else {
            link += "&_s=close";
        }
        anchor.attr("href", link);
    },
    _removeMenuStatus: function (anchor) {
        var link,
            linkArr,
            params,
            param;

        link = this._getUrl(anchor.attr("href"));
        if (link.indexOf("javascript:") === 0) {
            return;
        }
        linkArr = link.split("?");
        if (linkArr.length === 1) {
            return;
        }
        params = linkArr[1].split("&");
        for (var i = 0, len = params.length; i < len; i++) {
            param = params[i];
            if (param && param.indexOf("_s=") === 0) {
                params.splice(i, 1);
                break;
            }
        }
        anchor.attr("href", linkArr[0] + "?" + params.join("&"));
    },
    _isCloseStatus: function () {
        return ui.url.getLocationParam("_s") === "close";
    },

    // 设置菜单内容
    setMenuList: function (menus) {
        var htmlBuilder,
            menu, submenu,
            currClass, 
            resourceCode,
            parentCode,
            i, len, j,
            that;

        this.menuList.empty();
        if (!Array.isArray(menus) || menus.length === 0) {
            return;
        }
        htmlBuilder = [];
        resourceCode = ui.url.getLocationParam("_m");

        if (!ui.str.isEmpty(resourceCode)) {
            resourceCode = ui.str.base64Decode(resourceCode);
            parentCode = this._parentCode(resourceCode);
        }
        for (i = 0, len = menus.length; i < len; i++) {
            menu = menus[i];
            if (ui.str.isEmpty(parentCode)) {
                currClass = menu.resourceCode === resourceCode ? " current-menu background-highlight selection-menu" : "";
            } else {
                currClass = menu.resourceCode === parentCode ? " current-menu background-highlight" : "";
            }
            htmlBuilder.push("<dt class='menu-item", currClass, "'>");
            htmlBuilder.push("<b class='menu-item-background'><b class='menu-item-color'></b></b>");
            htmlBuilder.push("<u class='menu-item-container'>");
            htmlBuilder.push("<i class='icon'>");
            htmlBuilder.push("<img class='icon-img' src='", (menu.icon ? this.option.urlPrefix + menu.icon : ""), "' />");
            htmlBuilder.push("</i>");
            htmlBuilder.push("<span class='menu-item-text'>", menu.resourceName, "</span>");
            if (!Array.isArray(menu.children) || menu.children.length === 0) {
                htmlBuilder.push("<a class='direct' href='", this._addMenuCodeToSrc(menu.url, menu.resourceCode), "'></a>");
            } else {
                htmlBuilder.push("<i class='allow fa fa-angle-down'></i>");
            }
            htmlBuilder.push("</u></dt>");

            if (Array.isArray(menu.children) && menu.children.length > 0) {
                htmlBuilder.push("<dd class='submenu-panel", currClass, "'>");
                htmlBuilder.push("<ul class='submenu-list'>");
                for (j = 0; j < menu.children.length; j++) {
                    submenu = menu.children[j];
                    currClass = submenu.resourceCode === resourceCode ? " selection-menu" : "";
                    htmlBuilder.push("<li class='submenu-item", currClass, "'>");
                    htmlBuilder.push("<b class='menu-item-background'><b class='menu-item-color'></b></b>");
                    htmlBuilder.push("<u class='menu-item-container'>");
                    htmlBuilder.push("<span class='submenu-item-text'>", submenu.resourceName, "</span>");
                    htmlBuilder.push("<a class='direct' href='", this._addMenuCodeToSrc(submenu.url, submenu.resourceCode), "'></a>");
                    htmlBuilder.push("</u>");
                    htmlBuilder.push("</li>");
                }
                htmlBuilder.push("</ul></dd>");
            }
        }
        this.menuList.html(htmlBuilder.join(""));
        
        that = this;
        setTimeout(function() {
            that._updateMenuSelectedStatus();
        });
    },
    hasAnimation: function() {
        return !!this.option.animation;
    },
    isModern: function() {
        return this.option.style === "modern";
    },
    isShow: function () {
        return this.option.menuButton.hasClass(showClass);
    },
    defaultShow: function() {
        return true;
    },
    isExtrusion: function() {
        return this.option.extendMethod === "extrusion" 
                && this.option.contentContainer
                && this.option.contentContainer.length > 0;
    }
});


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
