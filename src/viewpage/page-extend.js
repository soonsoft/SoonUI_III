/*
    基础属性
    {
        // 虚拟目录
        contextUrl: "/",
        //当前是否为起始页
        isHomePage: false,
        //内容区域宽度
        contentBodyWidth: 0,
        //内容区域高度
        contentBodyHeight: 0
    }
 */

var rank = 10,
    homeButtonClass = ".ui-home-button";

/** 获取一个有效的url */
ui.page.getUrl = function(url) {
    var char,
        contextUrl = this.contextUrl || "/";
    if(!url) {
        return contextUrl;
    }
    url = url.trim();
    char = contextUrl.charAt(contextUrl.length - 1);
    if(char === "/" || char === "\\")  {
        contextUrl = contextUrl.substring(0, contextUrl.length - 1) + "/";
    }

    char = url.charAt(0);
    if(char === "/" || char === "\\") {
        url = url.substring(1);
    }

    return contextUrl + url;
};
/** 是否有菜单 */
ui.page.hasMenu = function() {
    return !!this.menu;
};

function plugin(plugin) {
    plugin.rank = ++rank;
    ui.page.plugin(plugin);
}

// 模板页
plugin({
    name: "master",
    handler: function(arg) {
        this.head = $("#head");
        this.body = $("#body");
        this.foot = $("#foot");

        // 布局尺寸计算
        function layoutSize() {
            var clientWidth,
                clientHeight;

            if(this.menu) {
                // 如果菜单屏蔽了布局尺寸计算，那么就不做计算了
                if(this.menu.disableResizeable) {
                    return;
                }
            }

            clientWidth = document.documentElement.clientWidth;
            clientHeight = document.documentElement.clientHeight;

            if(this.head && this.head.length > 0) {
                clientHeight -= this.head.height();
            } else {
                this.head = null;
            }
            if(this.foot && this.foot.length > 0) {
                clientHeight -= this.foot.height();
            } else {
                this.foot = null;
            }
            if(this.body && this.body.length > 0) {
                this.body.css("height", clientHeight + "px");
            } else {
                this.body = null;
            }

            this.contentBodyHeight = clientHeight;
            this.contentBodyWidth = clientWidth;

            if(this.menu && this.menu.isShow()) {
                this.menu.resize(this.contentBodyWidth, this.contentBodyHeight);
            }
        }

        this.sidebarManager = ui.SidebarManager();
        layoutSize.call(this);
        ui.page.resize(layoutSize.bind(this), ui.eventPriority.bodyResize);

        if(ui.core.isFunction(arg)) {
            arg.call(this);
        }
    }
});

// 主按钮逻辑
plugin({
    name: "homeButton",
    handler: function(arg) {
        var button = $(homeButtonClass);

        if(button.length === 0) {
            return;
        }

        if(ui.core.isFunction(arg)) {
            arg.call(this, button);
        }
    }
});

// 菜单插件
plugin({
    name: "menu",
    handler: function(arg) {
        var page = this,
            homeButton;
        if(ui.core.isFunction(arg)) {
            this.menu = arg.call(this);
        } else if(arg) {
            homeButton = $(homeButtonClass);
            homeButton.empty();

            this.menu = ui.ctrls.Menu({
                style: "normal",
                menuPanel: $(".ui-menu-panel"),
                contentContainer: $(".content-container"),
                extendMethod: "cover",
                menuButton: homeButton.length > 0 ? homeButton : null
            });
            this.menu.shown(function(e) {
                if(this.isExtrusion()) {
                    if(this.isModern()) {
                        page.contentBodyWidth -= this.menuWidth - this.menuNarrowWidth;
                    } else {
                        page.contentBodyWidth -= this.menuWidth;
                    }
                }
            });
            this.menu.hidden(function(e) {
                if(this.isExtrusion()) {
                    if(this.isModern()) {
                        page.contentBodyWidth += this.menuWidth - this.menuNarrowWidth;
                    } else {
                        page.contentBodyWidth += this.menuWidth;
                    }
                }
            });
        }
    }
});

// 用户面板
plugin({
    name: "userPanel",
    handler: function(arg) {
        var config = {
                // 用户姓名
                name: "姓名",
                // 用户所属部门
                department: "部门",
                // 用户职位
                position: "职位",
                // 请求高亮色css的URL
                changeHighlightUrl: "",
                // 用户操作菜单 [{text: "修改密码", url: "/Account/Password"}, {text: "退出", url: "/Account/LogOff"}]
                operateList: [
                    { text: "个性化", url: "###" },
                    { text: "修改密码", url: "###" }, 
                    { text: "退出", url: "###" }
                ]
            },
            userProtrait,
            sidebarElement,
            userInfo,
            highlightPanel,
            operateList,
            htmlBuilder,
            i, len, highlight,
            sidebar,
            that;
        
        if(ui.core.isFunction(arg)) {
            config = ui.extend(config, arg.call(this));
        }

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
            "<span class='user-info-text' style='font-size:18px;line-height:36px;'>", ui.str.htmlEncode(config.name), "</span><br />"
        );
        if(config.department) {
            htmlBuilder.push("<span class='user-info-text'>", ui.str.htmlEncode(config.department), "</span><br />");
        }
        if(config.position) {
            htmlBuilder.push("<span class='user-info-text'>", ui.str.htmlEncode(config.position), "</span>");
        }
        htmlBuilder.push(
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
            ui.setTask(function() {
                that._currentHighlightItem = highlightPanel.find(".highlight-item-selected");
                if(that._currentHighlightItem.length === 0) {
                    that._currentHighlightItem = null;
                }
            });
            highlightPanel.on("click", function(e) {
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
                if(ui.core.isFunction(config.changeHighlightUrl)) {
                    config.changeHighlightUrl.call(null, highlight);
                } else {
                    if(config.changeHighlightUrl) {
                        ui.theme.changeHighlight(config.changeHighlightUrl, highlight);
                    }
                }
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
                        "<span class='operate-text'>", ui.str.htmlEncode(item.text), "</span>",
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
        sidebar._closeButton.attr("style", "color:#fff !important;width:32px;height:32px;");
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
        sidebar.shown(function() {
            sidebarElement.css({
                "display": "block",
                "left": "100%"
            });
            this.contentAnimator.start();
        });
        userProtrait.on("click", function(e) {
            that.sidebarManager.show("userSidebar");
        });
    }
});

// 工具条插件
plugin({
    name: "toolbar",
    handler: function(arg) {
        var id, extendShow = false;
        if(ui.core.isString(arg)) {
            id = arg;
        } else if(ui.core.isObject(arg)) {
            id = arg.id;
            extendShow = arg.extendShow;
        } else if(ui.core.isFunction(arg)) {
            this.toolbar = arg.call(this);
            return;
        } else {
            return;
        }

        this.toolbar = ui.Toolbar({
            toolbarId: id,
            defaultExtendShow: !!extendShow
        });
    }
});