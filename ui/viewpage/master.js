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
