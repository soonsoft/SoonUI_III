/*
    Master 模板页
 */

function partial() {
    initToolbar.call(this);
    initSidebarManager.call(this);
    initMenu.call(this);
}

function initToolbar() {
    this.toolbar = {
        height: 40,
        extendHeight: 0
    };
}

// 初始化边栏管理器
function initSidebarManager() {
    this.sidebarManager = ui.SidebarManager();
}

function initMenu() {
    var that;
    if(this.menuConfig) {
        this.menu = ui.ctrls.Menu(this.menuConfig);
        that = this;
        this.menu.showed(function(e) {
            if(this.isExtrusion()) {
                if(this.isModern()) {
                    that.contentBodyWidth -= this.menuWidth - this.menuNarrowWidth;
                } else {
                    that.contentBodyWidth -= this.menuWidth;
                }
            }
        });
        this.menu.hided(function(e) {
            if(this.isExtrusion()) {
                if(this.isModern()) {
                    that.contentBodyWidth += this.menuWidth - this.menuNarrowWidth;
                } else {
                    that.contentBodyWidth += this.menuWidth;
                }
            }
        });
    }
}

// 布局尺寸计算
function layoutSize() {
    var bodyMinHeight,
        clientWidth,
        clientHeight,
        that;

    if(this.menu) {
        // 如果菜单屏蔽了布局尺寸计算，那么就不做计算了
        if(this.menu.disableResizeable) {
            return;
        }
    }

    clientWidth = document.documentElement.clientWidth;
    clientHeight = document.documentElement.clientHeight;

    if(this.head.length > 0) {
        clientHeight -= this.head.height();
    } else {
        this.head = null;
    }
    if(this.foot.length > 0) {
        clientHeight -= this.foot.height();
    }
    bodyMinHeight = clientHeight;
    if(this.body.length > 0) {
        this.body.css("height", bodyMinHeight + "px");
    } else {
        this.body = null;
    }

    this.contentBodyHeight = bodyMinHeight;
    this.contentBodyWidth = clientWidth;

    if(this.menu && this.menu.isShow()) {
        this.menu.resize(this.contentBodyWidth, this.contentBodyHeight);
    }
}

// 用户菜单生成
function userSettings() {
    var userProtrait,
        sidebarElement,
        userInfo,
        highlightPanel,
        operateList,
        htmlBuilder,
        i, len, highlight,
        sidebar,
        config,
        that;

    config = getConfig.call(this, "userSettings");
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
    if(!ui.theme.currentHighlight) {
        ui.theme.initHighlight();
    }
    // 高亮色
    if(Array.isArray(ui.theme.highlights)) {
        htmlBuilder = [];
        htmlBuilder.push("<h3 class='highlight-group-title font-highlight'>个性色</h3>");
        htmlBuilder.push("<div style='width:100%;height:auto'>");
        for(i = 0, len = ui.theme.highlights.length; i < len; i++) {
            highlight = ui.theme.highlights[i];
            htmlBuilder.push("<a class='highlight-item");
            if(highlight.Id === ui.theme.currentHighlight.Id) {
                htmlBuilder.push(" highlight-item-selected");
            }
            htmlBuilder.push("' href='javascript:void(0)' style='background-color:", highlight.Color, ";");
            htmlBuilder.push("' title='", highlight.Name, "' data-index='", i, "'>");
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
                highlight;
            elem = $(e.target);
            while(!elem.hasClass("highlight-item")) {
                if(elem.hasClass("highlight-panel")) {
                    return;
                }
                elem = elem.parent();
            }

            highlight = ui.theme.highlights[parseInt(elem.attr("data-index"), 10)];

            if(that._currentHighlightItem) {
                that._currentHighlightItem.removeClass("highlight-item-selected");
            }

            that._currentHighlightItem = elem;
            that._currentHighlightItem.addClass("highlight-item-selected");
            //ui.theme.changeHighlight("/Home/ChangeTheme", highlight);
            $("#highlight").prop("href", ui.str.textFormat("../../../dist/theme/color/ui.metro.{0}.css", highlight.Id));
            ui.theme.setHighlight(highlight);
        });
    }

    // 操作列表
    htmlBuilder = [];
    if(config.operateList && config.operateList.length > 0) {
        htmlBuilder.push("<ul class='operate-list-ul'>");
        config.operateList.forEach(function(item) {
            if(item.text) {
                htmlBuilder.push(
                    "<li class='operate-list-li theme-panel-hover'>",
                    "<span class='operate-text'>", item.text, "</span>",
                    "<a class='operate-list-anchor' href='", item.url, "'></a>",
                    "</li>"
                );
            }
        });
        htmlBuilder.push("</ul>");
    }
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
}

function getConfig(name) {
    var optionName;
    if(ui.str.isEmpty(name)) {
        return;
    }
    optionName = name + "Config";
    return this[optionName] || defaultConfig[optionName];
}

var defaultConfig = {
    // 默认菜单配置
    menuConfig: {
        //style: "modern",
        style: "normal",
        menuPanel: $(".ui-menu-panel"),
        contentContainer: $(".content-container"),
        //extendMethod: "extrusion",
        //contentContainer: null,
        extendMethod: "cover",
        menuButton: $(".ui-menu-button")
    },
    // 默认用户设置配置
    userSettingsConfig: {
        // 用户操作菜单 [{text: "修改密码", url: "/Account/Password"}, {text: "退出", url: "/Account/LogOff"}]
        operateList: [
            { text: "个性化", url: "javascript:void(0)" },
            { text: "修改密码", url: "javascript:void(0)" }, 
            { text: "退出", url: "javascript:void(0)" }
        ]
    }
};

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
    //内容区域宽度
    contentBodyWidth: 0,
    //内容区域高度
    contentBodyHeight: 0,

    config: function(name, option) {
        var defaultOption,
            optionName;
        if(ui.str.isEmpty(name)) {
            return;
        }
        optionName = name + "Config";
        defaultOption = defaultConfig[optionName];
        if(defaultConfig) {
            option = $.extend(defaultOption, option);
        }
        this[optionName] = option;
    },
    init: function(configFn) {
        var that = this;

        this.head = $("#head");
        this.body = $("#body");
        this.foot = $("#foot");

        ui.page.ready(function (e) {
            if(ui.core.isFunction(configFn)) {
                configFn.call(that);
            }
            partial.call(that);
            layoutSize.call(that);
            userSettings.call(that);
            ui.page.resize(function (e, clientWidth, clientHeight) {
                layoutSize.call(that);
            }, ui.eventPriority.bodyResize);
            
            if(window.pageLogic) {
                that.pageInit(pageLogic.init, pageLogic);
            }
            that.body.css("visibility", "visible");
        }, ui.eventPriority.masterReady);
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
    /** 创建toolbar */
    createToolbar: function(id, extendShow) {
        if(!id) {
            return null;
        }
        return ui.Toolbar({
            toolbarId: id,
            defaultExtendShow: !!extendShow
        });
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
    },
    /** 是否有菜单 */
    hasMenu: function() {
        return this.menu;
    }
};
ui.master = master;
