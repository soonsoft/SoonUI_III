// Source: src/viewpage/menu.js

(function(ui, $) {
var showClass = "ui-menu-button-show",
    currentClass = "current-menu",
    lightClass = "head-color",
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
        animator.start().then(function () {
            that.hideState = false;
            if(animator.length === 1) {
                that.fire("shown");
            }
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
        animator.start().then(function () {
            that.hideState = true;
            if(animator.length === 1) {
                that.fire("hidden");
            }
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
            this.option.menuPanel.css("left", "0");
            this.fire("shown");
        } else {
            //隐藏菜单
            if(this.isExtrusion()) {
                this.option.contentContainer.css({
                    "width": "100%",
                    "left": "0"
                });
            }
            this.option.menuPanel.css({
                "left": -this.menuWidth + "px"
            });
            this.fire("hidden");
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
                    .removeClass(lightClass);
            this.submenuPanel.css("display", "none");
            this.submenuList.html("");
            subElem = this._getSubmenuElement(false);
            if (subElem) {
                subElem
                    .addClass(currentClass)
                    .addClass(lightClass);
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
                        .removeClass(lightClass);
                    subElem.css("display", "none");
                });
            }
            this._currentMenu
                    .removeClass(currentClass)
                    .removeClass(lightClass);
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
            submenuListShowFn = (function () {
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

            }).bind(this);
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
            option,
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
            animator.start().then(function () {
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
            this.fire("shown");
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
            this.fire("hidden");
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
    openFn = (function () {
        var subElem;
        this._currentMenu = elem;
        this._currentMenu
                .addClass(currentClass)
                .addClass(lightClass);
        subElem = this._getSubmenuElement();
        if (subElem) {
            subElem
                .addClass(currentClass)
                .addClass(lightClass);
            this.subShow(subElem, this.hasAnimation());
        }
    }).bind(this);
    closeFn = (function () {
        var subElem;
        this._currentMenu
                .removeClass(currentClass)
                .removeClass(lightClass);
        subElem = this._getSubmenuElement();
        subElem
            .removeClass(currentClass)
            .removeClass(lightClass);
        subElem.css("display", "none");
        if (this._currentMenu[0] !== elem[0]) {
            this._currentMenu = null;
            openFn();
        } else {
            this._currentMenu = null;
        }
    }).bind(this);

    if (this._currentMenu) {
        subElem = this._getSubmenuElement();
        if (subElem) {
            this.subHide(subElem, this.hasAnimation(), closeFn);
            return;
        } else {
            this._currentMenu
                    .removeClass(currentClass)
                    .removeClass(lightClass);
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

    openFn = (function () {
        var submenuPanel;
        this._currentMenu = elem;
        this._currentMenu
                .addClass(currentClass)
                .addClass(lightClass);
        submenuPanel = this._getSubmenuElement();
        submenuPanel
            .addClass(currentClass)
            .addClass(lightClass);
        this.subShow(submenuPanel, this.hasAnimation());
    }).bind(this);
    closeFn = (function () {
        var subElem;
        this._currentMenu
                .removeClass(currentClass)
                .removeClass(lightClass);
        subElem = this._getSubmenuElement();
        subElem
            .removeClass(currentClass)
            .removeClass(lightClass);
        subElem.css("display", "none");
        this._currentMenu = null;
    }).bind(this);

    if (this._currentMenu) {
        if (this._currentMenu[0] === elem[0]) {
            this.subHide(this._getSubmenuElement(), this.hasAnimation(), closeFn);
        } else {
            this._currentMenu
                    .removeClass(currentClass)
                    .removeClass(lightClass);
            this._currentMenu = null;
            openFn();
        }
    } else {
        openFn();
    }
}

ui.ctrls.define("ui.ctrls.Menu", {
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
            // 菜单默认是显示还是隐藏，默认不显示
            defaultShow: false,
            // 是否启用动画效果
            animation: true
        };
    },
    _defineEvents: function() {
        return ["shown", "hidden"];
    },
    _create: function() {
        var style,
            key;

        this.menuWidth = 240;
        this.menuNarrowWidth = 48;
        this._menuButtonBg = null;

        this.hasMenuButton = this.option.menuButton && this.option.menuButton.length;
        if(this.hasMenuButton) {
            this._menuButtonBg = $("<b class='menu-button-background title-color'></b>");
            this.option.menuButton.addClass("ui-menu-button");
            this.option.menuButton.append(this._menuButtonBg);
            this.option.menuButton
                    .append("<b class='menu-inner-line a'></b>")
                    .append("<b class='menu-inner-line b'></b>")
                    .append("<b class='menu-inner-line c'></b>");
        }

        if(this.option.style !== "modern") {
            this.option.style = "normal";
        }

        if(this.isModern()) {
            style = modernStyle;
            this.hamburgButton = "modern-hamburg";
            this.hamburgCloseButton = "modern-hamburg-close";
            this._initSubmenuPanel();
        } else {
            style = normalStyle;
            this.hamburgButton = "normal-hamburg";
            this.hamburgCloseButton = "normal-hamburg-close";
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
        this.onMenuItemNormalClickHandler = onMenuItemNormalClick.bind(this);
        // 现代父菜单点击事件
        this.onMenuItemModernClickHandler = onMenuItemModernClick.bind(this);
        
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

        if(this.hasMenuButton) {
            this.option.menuButton.addClass(this.hamburgButton);
        }
        
        this._initMenuList();
        if (this.defaultShow()) {
            if(this.hasMenuButton) {
                this.option.menuButton
                        .addClass(showClass)
                        .addClass(this.hamburgCloseButton);
            }
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
            this.menuPanelAnimator
                .add({
                    target: this.option.contentContainer,
                    ease: ui.AnimationStyle.easeTo,
                    onChange: function (val, elem) {
                        elem.css("left", val + "px");
                    }
                })
                .add({
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
        }).add({
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
                this.target.css("left", val + "px");
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
        this.menuList.on("click", function (e) {
            that.onMenuItemClickHandler(e);
        });
        
        //菜单汉堡按钮点击事件
        if(this.hasMenuButton) {
            menuButton = this.option.menuButton;
            menuButton.on("click", function (e) {
                if (menuButton.hasClass(showClass)) {
                    menuButton.removeClass(showClass).removeClass(that.hamburgCloseButton);
                    that.hide(that.hasAnimation());
                } else {
                    menuButton.addClass(showClass).addClass(that.hamburgCloseButton);
                    that.show(that.hasAnimation());
                }
            });
        }
    },

    _updateMenuSelectedStatus: function() {
        var nextdd;
        this._currentMenu = this.option.menuPanel.find("dt." + currentClass);
        if (this._currentMenu.length === 0) {
            this._currentMenu = null;
        }
        if (this._isCloseStatus()) {
            this.option.menuButton.removeClass(showClass).removeClass(this.hamburgCloseButton);
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
            if(subElement.lenght === 0 || subElement.nodeName() !== "DD") {
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
        if (url.indexOf("javascript:") === 0) {
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
        if (result.indexOf("javascript:") === 0) {
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

        items = this.option.menuPanel.children(".menu-list").children(".menu-item");
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
    setMenuList: function (menus, resourceCode, parentCode) {
        var htmlBuilder,
            menu, submenu,
            currClass,
            i, len, j;

        this.menuList.empty();
        if (!Array.isArray(menus) || menus.length === 0) {
            return;
        }
        htmlBuilder = [];

        if (ui.str.isEmpty(resourceCode)) {
            resourceCode = ui.url.getLocationParam("_m");
            resourceCode = ui.str.base64Decode(resourceCode);
        }
        if (ui.str.isEmpty(parentCode)) {
            parentCode = this._parentCode(resourceCode);
        }

        for (i = 0, len = menus.length; i < len; i++) {
            menu = menus[i];
            if (ui.str.isEmpty(parentCode)) {
                currClass = menu.resourceCode === resourceCode ? (" current-menu " + lightClass + " selection-menu") : "";
            } else {
                currClass = menu.resourceCode === parentCode ? (" current-menu " + lightClass) : "";
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
                htmlBuilder.push("<i class='allow far fa-angle-down'></i>");
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
        
        ui.setTask((function() {
            this._updateMenuSelectedStatus();
        }).bind(this));
    },
    hasAnimation: function() {
        return !!this.option.animation;
    },
    isModern: function() {
        return this.option.style === "modern";
    },
    isShow: function () {
        return this.hasMenuButton ? this.option.menuButton.hasClass(showClass) : true;
    },
    defaultShow: function() {
        return !!this.option.defaultShow;
    },
    isExtrusion: function() {
        return this.option.extendMethod === "extrusion" && 
                this.option.contentContainer && 
                this.option.contentContainer.length > 0;
    }
});


})(ui, ui.$);

// Source: src/viewpage/page-extend.js

(function(ui, $) {
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

        if(ui.core.isFunction(arg)) {
            this.toolbar = arg.call(this);
            return;
        }

        if(ui.core.isString(arg) || ui.core.isDomObject(arg)) {
            id = arg;
        } else if(ui.core.isPlainObject(arg)) {
            id = arg.id;
            extendShow = !!arg.extendShow;
        } else {
            return;
        }

        this.toolbar = ui.Toolbar({
            toolbarId: id,
            defaultExtendShow: extendShow
        });
    }
});

})(ui, ui.$);

// Source: src/viewpage/sidebar-manager.js

(function(ui, $) {
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
        var sidebar = null,
            that = this;

        if(ui.str.isEmpty(name)) {
            return;
        }

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
                return this.currentBar.hide().then(function() {
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


})(ui, ui.$);

// Source: src/viewpage/tile-view.js

(function(ui, $) {
// 动态磁贴

///磁贴组
var tileSize = {
    // 小
    small: { width: 62, height: 62, iconSize: 32, countX: 1, countY: 1 },
    // 中
    medium: { width: 128, height: 128, iconSize: 64, countX: 2, countY: 2 },
    // 宽
    wide: { width: 260, height: 128, iconSize: 64, countX: 4, countY: 2 },
    // 大
    large: { width: 260, height: 260, iconSize: 64, countX: 4, countY: 4 }
};
var tileMargin = 4,
    titleHeight = 24,
    edgeDistance = 48,
    groupTitleHeight = 48;
var defineProperty = ui.ctrls.ControlBase.prototype.defineProperty,
    tileInfoProperties = ["name", "title", "icon", "link", "color"],
    tileUpdater;

tileUpdater = {
    // 翻转更新
    rotate: {
        render: function() {
            this.tileInnerBack = $("<div class='tile-inner' style='display:none'>");
            this.tileInnerBack.css("background-color", this.color);
            
            this.updatePanel = $("<div class='update-panel' />");
            this.tileInnerBack
                    .append(this.updatePanel)
                    .append((function() {
                        var div = $("<div class='tile-title' />"),
                            span = $("<span class='tile-title-text' />");
                        span.text(this.title);
                        div.append(span);
                        return div;
                    }).call(this));

            this.smallIconImg = $("<img class='tile-small-icon' />");
            this.smallIconImg.prop("src", this.icon);
            this.tileInnerBack.append(this.smallIconImg);
            
            this.tilePanel.append(this.tileInnerBack);

            this.updateStyle._createAnimator.call(this);
        },
        _createAnimator: function() {
            var setRotateFn,
                perspective;
            
            perspective = this.width * 2;
            setRotateFn = function(val) {
                var cssObj = {},
                    prefix = ["-ms-", "-moz-", "-webkit-", "-o-", ""],
                    rotateValue = "perspective(" + perspective + "px) rotateX(" + val + "deg)";
                prefix.forEach(function(p) {
                    cssObj[p + "transform"] = rotateValue;
                });
                return cssObj;
            };
            this.animator = ui.animator({
                ease: ui.AnimationStyle.easeFrom,
                begin: 0,
                end: -90,
                duration: 500,
                onChange: function(val) {
                    this.target.css(setRotateFn(val));
                }
            }).add({
                ease: function(pos) {
                    var s = 3;
                    return (pos = pos - 1) * pos * ((s + 1) * pos + s) + 1;
                },
                begin: 90,
                end: 0,
                delay: 500,
                duration: 500,
                onChange: function(val) {
                    var css = setRotateFn(val);
                    css["display"] = "block";
                    this.target.css(css);
                }
            });
            this.animator.onEnd = function() {
                this[0].target.css("display", "none");
            };
        },
        _play: function() {
            var that = this;
            if(this.link) {
                this.link.css("display", "none");
            }
            this.animator.start().then(function() {
                var temp;
                temp = that.tileInnerBack;
                that.tileInnerBack = that.tileInner;
                that.tileInner = temp;
                if(that.link) {
                    that.link.css("display", "block");
                }
            });
        },
        update: function(content) {
            var option;

            if(content) {
                this.updatePanel.html(content);
            }
            if(this.isDynamicChanged) {
                return;
            }

            option = this.animator[0];
            option.target = this.tileInner;
            option.begin = 0;
            option.end = -90;

            option = this.animator[1];
            option.target = this.tileInnerBack;
            option.begin = 90;
            option.end = 0;

            this.updateStyle._play.call(this);
        },
        restore: function() {
            var option;

            if(!this.isDynamicChanged) {
                return;
            }

            option = this.animator[0];
            option.target = this.tileInner;
            option.begin = 0;
            option.end = 90;

            option = this.animator[1];
            option.target = this.tileInnerBack;
            option.begin = -90;
            option.end = 0;

            this.updateStyle._play.call(this);
        }
    },
    // 上升更新
    moveup: {
        render: function() {
            // 动态信息面板
            this.updatePanel = $("<div class='update-panel' />");
            this.updatePanel.css("top", "100%");
            this.contentPanel.append(this.updatePanel);

            this.smallIconImg = $("<img class='tile-small-icon' />");
            this.smallIconImg.prop("src", this.icon);

            this.animator = ui.animator({
                target: this.contentPanel,
                ease: ui.AnimationStyle.easeFromTo,
                duration: 800,
                begin: 0,
                end: this.height,
                onChange: function(val) {
                    this.target.scrollTop(val);
                }
            });
        },
        update: function(content) {
            var option;

            if(content) {
                this.updatePanel
                        .html(content)
                        .append(this.smallIconImg);
            }
            if(this.isDynamicChanged) {
                return;
            }

            this.animator.stop();
            option = this.animator[0];
            option.begin = 0;
            this.animator.start();
        },
        restore: function() {
            var option;

            if(!this.isDynamicChanged) {
                return;
            }
            this.animator.stop();
            option = this.animator[0];
            if(option.target.scrollTop() === 0) {
                return;
            }
            option.begin = option.target.scrollTop();
            option.end = 0;
            this.animator.start();
        }
    }
};

// 磁贴
/*
    tileInfo: {
        name: string 磁贴名称，用于动态更新，不能重复,
        type: string 磁贴类型，small|medium|wide|large,
        color: string 磁贴颜色,
        title: string 磁贴标题,
        icon: string 磁贴图标,
        link: string 磁贴调整的URL，如果为null则点击磁贴不会发生跳转,
        interval: int 动态更新的时间间隔，单位秒,
        updateStyle: moveup|rotate
        updateFn: function 动态更新的方法 参数： tile，isLastTile
    }
 */
function Tile(tileInfo, group) {
    if(this instanceof Tile) {
        this.initialize(tileInfo, group);
    } else {
        return new Tile(tileInfo, group);
    }
}
Tile.prototype = {
    constructor: Tile,
    initialize: function(tileInfo, group) {
        var type,
            that;

        this.type = (tileInfo.type + "").toLowerCase();
        type = tileSize[this.type];
        if(!type) {
            throw new TypeError("Invalid tile type: " + this.type);
        }

        this.group = group;
        this.isDynamic = false;
        this.isActivated = false;
        this.isDynamicChanged = false;

        this.width = type.width;
        this.height = type.height;
        this.iconSize = type.iconSize;
        this.countX = type.countX;
        this.countY = type.countY;

        this.locationX = 0;
        this.locationY = 0;

        this.tileInfo = tileInfo || {};
        that = this;
        tileInfoProperties.forEach(function(propertyName) {
            var getter,
                setter,
                setterName;
            if(tileInfo.hasOwnProperty(propertyName)) {
                getter = function() {
                    return that.tileInfo[propertyName];
                };
                setterName = "_set" + propertyName.charAt(0).toUpperCase() + propertyName.substring(1);
                if(ui.core.isFunction(that[setterName])) {
                    setter = function(value) {
                        that.tileInfo[propertyName] = value;
                        that[setterName](value);
                    };
                }
                defineProperty.call(that, propertyName, getter, setter);
            }
        });

        if(this.tileInfo.updateStyle === "moveup") {
            this.updateStyle = tileUpdater.moveup;
        } else {
            this.updateStyle = tileUpdater.rotate;
        }

        this.updateFn = 
            ui.core.isFunction(this.tileInfo.updateFn) ? this.tileInfo.updateFn : null;
        if(this.updateFn) {
            this.isDynamic = true;
            this.interval = 
                ui.core.isNumber(this.tileInfo.interval) ? this.tileInfo.interval : 60;
            if(this.interval <= 0) {
                this.interval = 60;
            }
        }
        this._render();
    },
    _render: function() {
        this.tilePanel = $("<div class='ui-tile tile-" + this.type + "' />");
        
        this.tileInner = $("<div class='tile-inner' />");
        this._setColor(this.color);
        this.tilePanel.append(this.tileInner);
        
        this.iconImg = $("<img class='tile-icon' />");
        this.iconImg.prop("src", this.icon);
        this.iconImg.css({
            "width": this.iconSize + "px",
            "height": this.iconSize + "px",
            "left": (this.width - this.iconSize) / 2 + "px",
            "top": (this.height - this.iconSize) / 2 + "px"
        });

        this.smallIconImg = null;
        if(this.type !== "small") {
            // 内容面板
            this.contentPanel = $("<div class='tile-content' />");
            this.contentPanel.append(this.iconImg);

            // 磁贴标题
            this.titlePanel = $("<div class='tile-title' />");
            this._setTitle(this.title);
            
            this.tileInner
                    .append(this.contentPanel)
                    .append(this.titlePanel);
            if(this.isDynamic) {
                this.updateStyle.render.call(this);
            }
        } else {
            this.tileInner.append(this.iconImg);
        }

        this.linkAnchor = null;
        if(ui.core.isString(this.link) && this.link.length > 0) {
            this.linkAnchor = $("<a class='tile-link " + this.type + "' />");
            this.linkAnchor.prop("href", this.link);
            this.tilePanel.append(this.linkAnchor);
        }
    },
    _setColor: function(value) {
        if(value && value.length > 0) {
            this.tileInner.css("background-color", value);
        }
    },
    _setTitle: function(value) {
        if(this.titlePanel) {
            this.titlePanel.html("<span class='tile-title-text'>" + value + "</span>");
        }
    },
    /** 更新磁贴 */
    update: function(content) {
        var builder,
            i, len;
        if(ui.core.isString(content)) {
            builder = ["<p class='update-inner'><span>", content, "</span></p>"];
            builder = builder.join("");
        } else if(Array.isArray(content)) {
            builder = [];
            builder.push("<p class='update-inner'>");
            for(i = 0, len = content.length; i < len; i++) {
                builder.push("<span>", content[i], "</span>");
                if(len < len - 1) {
                    builder.push("<br />");
                }
            }
            builder.push("</p>");
            builder = builder.join("");
        } else if(ui.core.isFunction(content)) {
            builder = content.call(this);
        }

        this.isActivated = false;
        if(!this.animator.isStarted) {
            this.updateStyle.update.call(this, builder);
            this.isDynamicChanged = true;
        }
    },
    /** 恢复磁贴的初始样子 */
    restore: function() {
        if(!this.animator.isStarted) {
            this.updateStyle.restore.call(this);
            this.isDynamicChanged = false;
        }
    },
    /** 激活磁贴自动更新 */
    activate: function(needRegister) {
        this.isActivated = true;
        this.activeTime = (new Date()).getTime() + (this.interval * 1000);
        if(needRegister !== false) {
            this.group.container.activateDynamicTile(this);
        }
    }
};

function TileGroup(tileInfos, container) {
    if(this instanceof TileGroup) {
        this.initialize(tileInfos, container);
    } else {
        return new TileGroup(tileInfos, container);
    }
}
TileGroup.prototype = {
    constructor: TileGroup,
    initialize: function(tileInfos, container) {
        var arr = [],
            that = this;
        
        this.container = container;
        tileInfos.forEach(function(tileInfo) {
            var tile = new Tile(tileInfo, that);
            if(tile.isDynamic) {
                that.container.putDynamicTile(tile);
            }
            arr.push(tile);
        });
        
        ui.ArrayLike.prototype.setArray.call(this, arr);
        this.titleHeight = groupTitleHeight;
        this._render();
    },
    _render: function() {
        var i, len;

        this.groupPanel = $("<div class='ui-tile-group' />");
        this.groupPanel.css("visibility", "hidden");
        this.groupTitle = $("<div class='ui-tile-group-title' />");
        this.groupContent = $("<div class='ui-tile-group-content' />");
        this.groupPanel
                .append(this.groupTitle)
                .append(this.groupContent);

        for(i = 0, len = this.length; i < len; i++) {
            this.groupContent.append(this[i].tilePanel);
        }
    }, 
    _calculatePosition: function(size, positionBox, currentPosition, countX, countY) {
        var row, cell, i,
            x, y,
            indexX, xLen, 
            indexY, yLen,
            positionX, positionY;

        x = currentPosition.x;
        y = currentPosition.y;

        for(;;) {
            // 确保有空间
            for(i = 0; i < countY; i++) {
                if(!positionBox[y + i]) {
                    // 用最小单位来作为网格标注，以免浪费空间
                    positionBox[y + i] = new Array(size * tileSize.medium.countX);
                }
            }

            positionX = x;
            positionY = y;

            // 检查合适的空间
            for(indexY = y, yLen = y + countY; indexY < yLen; indexY++) {
                row = positionBox[indexY];
                for(;;) {
                    indexX = x;
                    xLen = x + countX;
                    if(xLen > row.length || indexX >= row.length) {
                        positionX = -1;
                        break;
                    }
                    for(; indexX < xLen; indexX++) {
                        if(row[indexX]) {
                            // 发现起始点已经被使用则位移
                            x = indexX + 1;
                            positionX = -1;
                            break;
                        }
                    }
                    if(positionX !== -1) {
                        break;
                    } else {
                        positionX = x;
                    }
                }
                if(positionX === -1) {
                    break;
                }
            }

            if(positionX !== -1 && positionY !== -1) {
                currentPosition.x = positionX;
                currentPosition.y = positionY;
                // 标记空间已经被使用
                for(indexY = positionY, yLen = positionY + countY; indexY < yLen; indexY++) {
                    row = positionBox[indexY];
                    for(indexX = positionX, xLen = positionX + countX; indexX < xLen; indexX++) {
                        row[indexX] = true;
                    }
                }
                return;
            }
        
            x = 0;
            y += 2;
        }
    },
    /** 对该磁贴组进行布局 */
    arrange: function(size) {
        var i, len,
            standard,
            smallCount, smallX, smallY, smallIndex,
            positionBox, currentPosition, tile;

        if(!ui.core.isNumber(size) || size <= 0) {
            throw new TypeError("the arguments size: " + size + " is invalid.");
        }

        standard = tileSize.medium;
        positionBox = [];
        // 本次的起始位置
        currentPosition = {
            x: 0,
            y: 0
        };
        // 每一次循环都是medium的倍数
        for(i = 0, len = this.length; i < len;) {
            tile = this[i];
            if(tile.countX <= standard.countX && tile.countY <= standard.countY) {
                this._calculatePosition(size, positionBox, currentPosition, standard.countX, standard.countY);
            } else {
                this._calculatePosition(size, positionBox, currentPosition, tile.countX, tile.countY);
            }

            if(tile.type === "small") {
                smallCount = tileSize.medium.countX * tileSize.medium.countY;
                smallX = currentPosition.x;
                smallY = currentPosition.y;
                smallIndex = 1;
                // 获取连续的小磁贴，最多获取4枚，组成一个medium磁贴
                while(smallIndex <= smallCount) {
                    tile = this[i];
                    if(!tile || tile.type !== "small") {
                        break;
                    }
                    tile.tilePanel.css({
                        top: smallY * (tileSize.small.height + tileMargin) + "px",
                        left: smallX * (tileSize.small.width + tileMargin) + "px"
                    });
                    smallIndex++;
                    if(smallX % tileSize.medium.countX === 0) {
                        smallX = currentPosition.x + 1;
                    } else {
                        smallX = currentPosition.x;
                        smallY = currentPosition.y + Math.floor(smallIndex / tileSize.medium.countX);
                    }
                    i++;
                }
                currentPosition.x += tileSize.medium.countX;
            } else {
                tile.tilePanel.css({
                    top: currentPosition.y * (tileSize.small.height + tileMargin) + "px",
                    left: currentPosition.x * (tileSize.small.width + tileMargin) + "px"
                });
                currentPosition.x += tile.countX;
                i++;
            }
        }

        len = positionBox[0].length;
        this.width = len * tileSize.small.width + (len - 1) * tileMargin;
        len = positionBox.length;
        this.height = len * tileSize.small.height + (len - 1) * tileMargin;
        
        this.groupContent.css("height", this.height + "px");
        this.height += this.titleHeight;
        this.groupPanel.css({
            "width": this.width + "px",
            "height": this.height + "px"
        });
    },
    /** 在磁贴组中加入一个新磁贴（会引起重排计算） */
    addTile: function(tileInfo) {
        var tile = new Tile(tileInfo);
        ui.ArrayLike.prototype.push.call(this, tile);
        // 重排，重新布局
        this.container._registerLayoutTask();
    },
    /** 移除一个磁贴（会引起重排计算） */
    removeTile: function(tile) {
        var i, index;

        if(tile instanceof Tile) {
            index = -1;
            for(i = this.length - 1; i >= 0; i--) {
                if(this[i] === tile) {
                    index = i;
                    break;
                }
            }
            if(index !== -1) {
                this.removeAt(index);
            }
        }
    },
    /** 按磁贴的索引移除一个磁贴（会引起重排计算） */
    removeAt: function(index) {
        if(!ui.core.isNumber(index)) {
            throw new TypeError("the arguments index is not a number.");
        }
        if(index < 0 || index >= this.length) {
            return;
        }

        ui.ArrayLike.prototype.splice.call(this, index, 1);
        // 重排，重新布局
        this.container._registerLayoutTask();
    }
};

// 磁贴容器
function TileContainer(containerPanel) {
    if(this instanceof TileContainer) {
        this.initialize(containerPanel);
    } else {
        return new TileContainer(containerPanel);
    }
}
TileContainer.prototype = {
    constructor: TileContainer,
    initialize: function(containerPanel) {
        this.groups = [];
        this.dynamicTiles = ui.KeyArray();
        this.dynamicTiles.activeCount = 0;

        this.container = ui.getJQueryElement(containerPanel);
        if(!this.container) {
            this.container = $("<div class='ui-tile-container' />");
        } else {
            this.container.addClass("ui-tile-container");
        }
        // 如果支持触摸，则添加平滑滚动的样式
        if(ui.core.isTouchAvailable()) {
            this.container.css("-webkit-overflow-scrolling", "touch");
        }
        // 容器的宽度和高度
        this.containerWidth = this.container.width();
        this.containerHeight = this.container.height();
        // 添加底部留白占位符
        this.tileMargin = $("<div class='tile-margin' />");
        this.container.append(this.tileMargin);
    },
    // 注册动态磁贴更新器
    _register: function(interval) {
        var that;
        if(this.dynamicTiles.activeCount <= 0 || this.dynamicDelayHandler) {
            return;
        }
        if(!ui.core.isNumber(interval) || interval <= 0) {
            interval = 1000;
        }
        that = this;
        this.dynamicDelayHandler = setTimeout(function() {
            var i, len,
                tile, currentTime;
            currentTime = (new Date()).getTime();
            that.dynamicDelayHandler = null;
            if(that.dynamicTiles.activeCount > 0) {
                for(i = 0, len = that.dynamicTiles.length; i < len; i++) {
                    tile = that.dynamicTiles[i];
                    if(tile.isActivated && currentTime > tile.activeTime) {
                        tile.isActivated = false;
                        that.dynamicTiles.activeCount--;
                        try {
                            tile.updateFn.call(that, tile);
                        } catch(e) {
                            ui.handleError(e);
                        }
                    }
                }
                if(that.dynamicTiles.activeCount > 0) {
                    that._register();
                }
            }
        }, interval);
    },
    _calculateGroupLayoutInfo: function(containerWidth) {
        var size,
            medium,
            groupCount,
            groupWidth;

        medium = tileSize.medium;
        size = 4;
        groupWidth = size * medium.width + (size - 1) * tileMargin;
        groupCount = Math.floor((containerWidth - edgeDistance) / (groupWidth + edgeDistance));

        if(groupCount > 1 && this.groups.length === 1) {
            groupCount = 1;
        }
        if(groupCount < 1) {
            size = Math.floor(containerWidth / (medium.width + edgeDistance));
            // 最少一行放两个磁贴
            if(size < 2) {
                size = 2;
            }
        } else if(groupCount === 1) {
            size += Math.floor((containerWidth - edgeDistance - groupWidth) / (medium.width + edgeDistance));
            if(size % 2) {
                size--;
            }
        }
        return {
            // 水平放几组
            groupCount: groupCount ? groupCount : 1,
            // 每组一行放几个标准磁贴
            groupSize: size
        };
    },
    // 注册一个异步的layout任务，避免layout多次执行
    _registerLayoutTask: function() {
        if(ui.core.isNumber(this._layoutTaskHandler)) {
            return;
        }
        this._layoutTaskHandler = ui.setMicroTask((function() {
            this._layoutTaskHandler = null;
            this.layout(this.containerWidth, this.containerHeight);
        }).bind(this));
    },
    /** 布局磁贴 */
    layout: function(containerWidth, containerHeight) {
        var groupLayoutInfo,
            groupWholeWidth,
            groupWholeHeight,
            groupEdgeDistance, 
            scrollWidth,
            group,
            groupTemp,
            i, len, j;

        if(!ui.core.isNumber(containerWidth) || containerWidth <= 0) {
            throw new TypeError("the arguments containerWidth: " + containerWidth + " is invalid.");
        }
        if(!ui.core.isNumber(containerHeight) || containerHeight <= 0) {
            throw new TypeError("the arguments containerHeight: " + containerHeight + " is invalid.");
        }

        if(this.groups.length === 0) {
            return;
        }
        this.containerWidth = containerWidth;
        this.containerHeight = containerHeight;
        groupLayoutInfo = this._calculateGroupLayoutInfo(containerWidth);
        
        // 排列每一组磁贴
        groupWholeHeight = [];
        for(i = 0, len = this.groups.length; i < len;) {
            for(j = 0; j < groupLayoutInfo.groupCount; j++) {
                if(i >= len) {
                    break;
                }
                group = this.groups[i];
                group.arrange(groupLayoutInfo.groupSize);
                if(!groupWholeHeight[j]) {
                    groupWholeHeight[j] = 0;
                }
                groupWholeHeight[j] += group.height;
                i++;
            }
        }
        // 获取高度
        j = 0;
        for(i = 0, len = groupWholeHeight.length; i < len; i++) {
            if(j < groupWholeHeight[i]) {
                j = groupWholeHeight[i];
            }
        }
        groupWholeHeight = j;
        // 设置底部留白
        groupWholeHeight += groupTitleHeight;

        scrollWidth = 0;
        if(groupWholeHeight > containerHeight) {
            scrollWidth = ui.scrollbarWidth;
        }
        groupWholeWidth = this.groups[0].width * groupLayoutInfo.groupCount + edgeDistance * (groupLayoutInfo.groupCount - 1);
        groupEdgeDistance = (containerWidth - scrollWidth - groupWholeWidth) / 2;
        
        // 排列组
        groupTemp = {};
        for(i = 0, len = this.groups.length; i < len;) {
            groupTemp.left = groupEdgeDistance;
            for(j = 0; j < groupLayoutInfo.groupCount; j++) {
                if(i >= len) {
                    break;
                }
                group = this.groups[i];
                if(groupTemp[j] === undefined) {
                    groupTemp[j] = 0;
                }
                group.left = groupTemp.left;
                group.top = groupTemp[j];
                group.groupPanel.css({
                    "left": group.left + "px",
                    "top": group.top + "px",
                    "visibility": "visible"
                });
                groupTemp.left += group.width + edgeDistance;
                groupTemp[j] += group.height;
                i++; 
            }
        }

        this.tileMargin.css("top", groupWholeHeight + "px");
    },
    /** 添加组 */
    addGroup: function(groupName, tileInfos) {
        var group;

        if(Array.isArray(groupName)) {
            tileInfos = groupName;
            groupName = null;
        }
        if(!Array.isArray(tileInfos) || tileInfos.length === 0) {
            return;
        }
        group = new TileGroup(tileInfos, this);
        if(groupName) {
            group.groupTitle.html("<span>" + groupName + "</span>");
        }
        this.groups.push(group);
        this.container.append(group.groupPanel);
    },
    /** 放置动态磁贴 */
    putDynamicTile: function(dynamicTile) {
        var tileName,
            dynamicInfo,
            interval;

        tileName = dynamicTile.name;
        if(!tileName) {
            throw new TypeError("tileName can not be null");
        }
        if(this.dynamicTiles.hasOwnProperty(tileName)) {
            throw new TypeError("The dynamicTile is exist which name is '" + tileName + "'");
        }

        this.dynamicTiles.set(tileName, dynamicTile);
        dynamicTile.activate();
    },
    /** 获取动态磁贴 */
    getDynamicTileByName: function(tileName) {
        var dynamicTile;

        dynamicTile = this.dynamicTiles.get(tileName + "");
        if(!dynamicTile) {
            return null;
        }
        return dynamicTile;
    },
    /** 再次激活动态磁贴 */
    activateDynamicTile: function(tile) {
        this.dynamicTiles.activeCount++;
        this._register(); 
    }
};

ui.TileContainer = TileContainer;


})(ui, ui.$);

// Source: src/viewpage/tiles/tile-calendar.js

(function(ui, $) {
// 日期动态磁贴
var calendarStyle,
    weekChars;

if(!ui.tiles) {
    ui.tiles = {};
}

weekChars = "日一二三四五六";

function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}

function getNow() {
    var date,
        now;
    date = new Date();
    now = {
        year: date.getFullYear(),
        month: twoNumberFormatter(date.getMonth() + 1),
        day: date.getDate().toString(),
        week: "星期" + weekChars.charAt(date.getDay())
    };
    return now;
}

calendarStyle = {
    medium: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='day-text'>", now.day, "</span>");
        builder.push("<span class='week-text'>", now.week, "</span>");
        builder.push("<span class='year-month-text'>", now.year, ".", now.month, "</span>");

        tile.updatePanel.html(builder.join(""));
        if(!tile.isDynamicChanged) {
            if(tile.smallIconImg) {
                tile.smallIconImg.remove();
                tile.smallIconImg = null;
            }
            tile.update();
        }
    },
    wide: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='day-text'>", now.day, "</span>");
        builder.push("<span class='week-text'>", now.week, "</span>");
        builder.push("<span class='year-month-text'>", now.year, ".", now.month, "</span>");

        tile.updatePanel.html(builder.join(""));
        if(!tile.isDynamicChanged) {
            if(tile.smallIconImg) {
                tile.smallIconImg.remove();
                tile.smallIconImg = null;
            }
            tile.update();
        }
    },
    large: function(tile) {
        calendarStyle.wide.apply(this, arguments);
    }
};

ui.tiles.calendar = function(tile) {
    var now;
    calendarStyle[tile.type].apply(this, arguments);
    now = new Date();
    now = now.getHours() * 60 * 60 + now.getMinutes() * 60 + now.getSeconds();
    tile.interval = 86400 - now;
    tile.activate();
};


})(ui, ui.$);

// Source: src/viewpage/tiles/tile-clock.js

(function(ui, $) {
// 时钟动态磁贴
var clockStyle;

if(!ui.tiles) {
    ui.tiles = {};
}

function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}

function getNow() {
    var date,
        now;
    date = new Date();
    now = {
        hour: twoNumberFormatter(date.getHours()),
        minute: twoNumberFormatter(date.getMinutes()),
        spliter: ":"
    };
    return now;
}

clockStyle = {
    medium: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='clock-hour'>", now.hour, "</span>");
        builder.push("<span class='clock-minute'>", now.minute, "</span>");

        tile.updatePanel.html(builder.join(""));

        if(!tile.isDynamicChanged) {
            tile.updatePanel
                .css({ 
                    "text-align": "center", 
                    "height": tile.height + "px"
                });
            if(tile.smallIconImg) {
                tile.smallIconImg.remove();
                tile.smallIconImg = null;
            }
            tile.update();
        }
    },
    wide: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='clock-hour'>", now.hour, "</span>");
        builder.push("<span class='clock-spliter'></span>");
        builder.push("<span class='clock-minute'>", now.minute, "</span>");

        tile.updatePanel.html(builder.join(""));

        if(!tile.isDynamicChanged) {
            tile.updatePanel
                .css({ 
                    "text-align": "center", 
                    "line-height": tile.height - 8 + "px",
                    "height": tile.height + "px"
                });
            if(tile.smallIconImg) {
                tile.smallIconImg.remove();
                tile.smallIconImg = null;
            }
            tile.update();
        }
    },
    large: function(tile) {
        clockStyle.wide.apply(this, arguments);
    }
};

ui.tiles.clock = function(tile) {
    clockStyle[tile.type].apply(this, arguments);
    tile.activate();
};


})(ui, ui.$);

// Source: src/viewpage/tiles/tile-picture.js

(function(ui, $) {
// 图片动态磁贴

if(!ui.tiles) {
    ui.tiles = {};
}

ui.tiles.picture = function(tile, images) {
    var i, len,
        arr;
    if(!Array.isArray(images)) {
        return;
    }
    arr = [];
    for(i = 0, len = images.length; i < len; i++) {
        if(images[i]) {
            arr.push(images[i]);
        }
    }
    if(arr.length === 0) {
        return;
    }

    tile.pictureContext = {
        images: arr,
        currentIndex: 0,
        imageSizeCache: {},
        imageLoader: new ui.ImageLoader()
    };
    initDisplayArea(tile);
    initAnimator(tile);
    showPicture(tile, tile.pictureContext.currentImage, firstPictrue);
};

function initDisplayArea(tile) {
    var context;
    context = tile.pictureContext;

    context.currentImagePanel = $("<div class='tile-picture-container' />");
    context.currentImage = $("<img class='tile-picture' />");
    context.currentImagePanel.append(context.currentImage);

    context.nextImagePanel = $("<div class='tile-picture-container' />");
    context.nextImagePanel.css("display", "none");
    context.nextImage = $("<img class='tile-picture' />");
    context.nextImagePanel.append(context.nextImage);

    tile.updatePanel
            .append(context.currentImagePanel)
            .append(context.nextImagePanel);
}

function initAnimator(tile) {
    var context = tile.pictureContext;
    context.switchAnimator = ui.animator({
        ease: ui.AnimationStyle.easeTo,
        duration: 500,
        begin: 0,
        end: -tile.height,
        onChange: function(val) {
            this.target.css("top", val + "px");
        }
    }).add({
        ease: ui.AnimationStyle.easeTo,
        duration: 500,
        begin: tile.height,
        end: 0,
        onChange: function(val) {
            this.target.css("top", val + "px");
        }
    });
}

function showPicture(tile, currentImg, callback) {
    var imageSrc,
        context,
        setImageFn;

    context = tile.pictureContext;
    if(context.images.length === 0) {
        return;
    }
    imageSrc = context.images[context.currentIndex];
    setImageFn = function(css) {
        currentImg.css(css);
        currentImg.prop("src", imageSrc);
        callback(tile);
    };

    if(context.imageSizeCache.hasOwnProperty(imageSrc)) {
        setImageFn(context.imageSizeCache[imageSrc]);
    } else {
        context.imageLoader
                    .load(imageSrc, tile.width, tile.height, ui.ImageLoader.centerCrop)
                    .then(
                        function(loader) {
                            var css = {
                                "width": loader.displayWidth + "px",
                                "height": loader.displayHeight + "px",
                                "top": loader.marginTop + "px",
                                "left": loader.marginLeft + "px"
                            };
                            context.imageSizeCache[imageSrc] = css;
                            setImageFn(css);
                        }, 
                        function() {
                            context.images.splice(index, 1);
                            if(context.images.length > 0) {
                                moveNext(tile);
                                showPicture(tile, currentImg, callback);
                            }
                        }
                    );
    }
}

function firstPictrue(tile) {
    var context = tile.pictureContext,
        option;
    tile.update();

    setTimeout(function() {
        context.currentImage.addClass("tile-picture-play");
    }, 1000);
    setTimeout(function() {
        if(context.images.length > 1) {
            moveNext(tile);
            showPicture(tile, context.nextImage, nextPicture);
        }
    }, 10000);
}

function nextPicture(tile) {
    var temp,
        context,
        option;
    context = tile.pictureContext;

    temp = context.currentImagePanel;
    context.currentImagePanel = context.nextImagePanel;
    context.nextImagePanel = temp;
    temp = context.currentImage;
    context.currentImage = context.nextImage;
    context.nextImage = temp;

    option = context.switchAnimator[0];
    option.target = context.nextImagePanel;
    option = context.switchAnimator[1];
    option.target = context.currentImagePanel;
    option.target.css({
        "top": tile.height + "px",
        "display": "block"
    });

    context.switchAnimator.start().then(function() {
        context.nextImagePanel.css("display", "none");
        context.nextImage.removeClass("tile-picture-play");
        setTimeout(function() {
            context.currentImage.addClass("tile-picture-play");
            setTimeout(function() {
                if(context.images.length > 1) {
                    moveNext(tile);
                    showPicture(tile, context.nextImage, nextPicture);
                }
            }, 10000);
        }, 500);
    });
}

function moveNext(tile) {
    var context,
        index;

    context = tile.pictureContext;
    index = context.currentIndex + 1;
    if(index >= context.images.length) {
        index = 0;
    }
    context.currentIndex = index;
}


})(ui, ui.$);

// Source: src/viewpage/tiles/tile-weather.js

(function(ui, $) {
// 天气可交互磁贴
/*
    cityName: 城市名称
    days: [
        weatherDay: {
            date: yyyy-MM-dd
            type: 天气类型
            temperature: 当前气温
            low: 低温
            high: 高温
            description: 天气描述
            windDirection: 风向
        }
    ]

    晴朗 | 多云 | 阴天 | 雨天 | 雾霾 | 雨雪 | 雪天
 */
var weatherStyle;

if(!ui.tiles) {
    ui.tiles = {};
}

function findToday(days) {
    var i, len,
        weatherDay,
        result = null,
        today;
    if(Array.isArray(days)) {
        today = new Date();
        for(i = 0, len = days.length; i < len; i++) {
            weatherDay = days[i];
            weatherDay.date = ui.date.parseJSON(weatherDay.date);
            if(!weatherDay.date) {
                continue;
            }
            if(weatherDay.date.getFullYear() === today.getFullYear() && 
                weatherDay.date.getMonth() === today.getMonth() && 
                weatherDay.date.getDate() === today.getDate()) {
                result = weatherDay;
            }
        }
    }
    return result;
}
function getDateText(date) {
    var month = date.getMonth() + 1,
        day = date.getDate();
    return (month < 10 ? "0" + month : month) + "/" + (day < 10 ? "0" + day : day);
}
function getWeekday(date) {
    var today = new Date(),
        dayCount,
        weekDayFn;
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    dayCount = parseInt((date.getTime() / 1000 / 60 / 60 / 24) - (today.getTime() / 1000 / 60 / 60 / 24), 10);
    
    weekDayFn = function(week) {
        return "周" + "日一二三四五六".charAt(week);
    };
    if(dayCount < -1) {
        return weekDayFn(date.getDay());
    } else if(dayCount < 0) {
        return "昨天";
    } else if(dayCount < 1) {
        return "今天";
    } else if(dayCount < 2) {
        return "明天";
    } else {
        return weekDayFn(date.getDay());
    }
}
function getWeatherText(type) {
    return "晴朗";
}

function createBuilder(weatherData) {
    return {
        htmlBuilder: [],
        weatherData: weatherData,
        weatherToday: findToday(weatherData.days),
        graph: graph,
        info: info,
        days: days,
        build: build
    };
}
function graph() {
    var builder = this.htmlBuilder;
    builder.push("<div class='weather-graph'>");
    _callChildBuilders.apply(this, arguments);
    builder.push("</div>");
    return this;
}
function info() {
    var builder = this.htmlBuilder;
    builder.push("<div class='weather-info'>");
    _callChildBuilders.apply(this, arguments);
    builder.push("</div>");
    return this;
}
function days() {
    var builder = this.htmlBuilder,
        weatherData = this.weatherData,
        weatherDay,
        i, len;
    if(Array.isArray(weatherData.days)) {
        builder.push("<ul class='weather-days'>");
        for(i = 0, len = weatherData.days.length; i < len; i++) {
            weatherDay = weatherData.days[i];
            builder.push("<li class='weather-day'", i === 0 ? " style='height:150px'" : "", ">");
            builder.push("<div class='weather-item'", i === 0 ? " style='opacity:1'" : "", ">");
            this.graph();
            this.weatherToday = weatherDay;
            this.info(city, temperature, description, windDirection);
            builder.push("</div>");
            builder.push("<div class='weather-handle", i === 0 ? " weather-current-handle" : "", "'>");
            builder.push("<span class='weather-text'>", 
                ui.str.format("{0}&nbsp;({1})&nbsp;{2}&nbsp;&nbsp;{3}",
                    getDateText(weatherDay.date),
                    getWeekday(weatherDay.date), 
                    ui.str.format("{0}℃ - {1}℃", weatherDay.low, weatherDay.high), 
                    getWeatherText(weatherData.type)),
                "</span>");
            builder.push("</div>");
            builder.push("</li>");
        }
        builder.push("</ul>");
    }
    return this;
}
function build() {
    return this.htmlBuilder.join("");
}
function _callChildBuilders() {
    var i, len,
        weatherDay;
    weatherDay = this.weatherToday;
    for(i = 0, len = arguments.length; i < len; i++) {
        if(ui.core.isFunction(arguments[i])) {
            arguments[i].call(this, weatherDay);
        }
    }
}
function city(weatherDay) {
    var builder = this.htmlBuilder,
        weatherData = this.weatherData;
    builder.push("<h6 class='weather-city'>", weatherData.city, "</h6>");
}
function temperature(weatherDay) {
    var builder = this.htmlBuilder;
    builder.push("<h3 class='weather-temperature'>");
    if(weatherDay.temperature) {
        builder.push("<span class='weather-curr-temp'>", weatherDay.temperature, "<span style='font-size:22px;'>℃</span>", "</span>");
    }
    builder.push("<span class='weather-low-high'>", weatherDay.low, "℃ / ", weatherDay.high, "℃", "</span>");
    builder.push("</h3>");
}
function description(weatherDay) {
    var builder = this.htmlBuilder;
    builder.push("<h6 class='weather-description'>", weatherDay.description, "</h6>");
}
function windDirection(weatherDay) {
    var builder = this.htmlBuilder;
    builder.push("<h6 class='weather-wind'>", weatherDay.windDirection, "</h6>");
}

function activeMutualTile(tile) {
    var animator,
        context,
        days;
    context = tile.weatherContext;
    context.changeDayAnimator = ui.animator({
        ease: ui.AnimationStyle.easeFromTo,
        onChange: function(val) {
            this.target.css("height", val + "px");
            this.original.css("height", this.end - (val - this.begin) + "px");
        }
    }).add({
        ease: ui.AnimationStyle.easeTo,
        onChange: function(val) {
            this.target.css("opacity", val / 100);
            this.original.css("opacity", (this.end - val) / 100);
        }
    });
    context.changeDayAnimator.duration = 500;

    days = context.parent.children(".weather-days");
    context.current = $(days.children()[0]);
    days.on("click", onWeatherHandleClick.bind(tile));
}
function onWeatherHandleClick(e) {
    var context,
        elem,
        item,
        nodeName,
        original,
        target,
        option;
    elem = $(e.target);
    while(!elem.hasClass("weather-handle")) {
        nodeName = elem.nodeName();
        if(nodeName === "LI" || nodeName === "UL") {
            return;
        }
        elem = elem.parent();
    }

    context = this.weatherContext;
    if(elem.parent()[0] === context.current[0]) {
        return;
    }
    if(context.changeDayAnimator.isStarted) {
        return;
    }
    
    original = context.current;
    item = original.children(".weather-item");
    item.removeClass("active-dynamic");
    original.children(".weather-handle")
        .removeClass("weather-current-handle");

    target = elem.parent();
    target.children(".weather-handle")
        .addClass("weather-current-handle");
    context.current = target;

    option = context.changeDayAnimator[0];
    option.original = original;
    option.target = target;
    option.begin = 22;
    option.end = 150;

    option = context.changeDayAnimator[1];
    option.original = item;
    option.target = target.children(".weather-item");
    option.begin = 0;
    option.end = 100;

    item = context.current.children(".weather-item");
    context.changeDayAnimator.start().then(function() {
        item.addClass("active-dynamic");
    });
}

weatherStyle = {
    medium: function(tile, weatherData) {
        var html;
        html = createBuilder(weatherData)
            .graph()
            .info(
                temperature,
                description
            )
            .build();

        tile.weatherContext.parent.html(html);
        tile.update();
    },
    wide: function(tile, weatherData) {
        var html;
        html = createBuilder(weatherData)
            .graph()
            .info(
                city,
                temperature,
                description,
                windDirection
            )
            .build();

        tile.weatherContext.parent.html(html);
        tile.update();
    },
    large: function(tile, weatherData) {
        var html;
        html = createBuilder(weatherData)
            .days()
            .build();

        tile.weatherContext.parent.html(html);
        setTimeout(function() {
            activeMutualTile(tile);
        }, 1000);
        tile.update();
    }
};

ui.tiles.weather = function(tile, weatherData) {
    tile.weatherContext = {
        weatherData: weatherData
    };
    if(tile.tileInfo.updateStyle === "moveup") {
        tile.weatherContext.parent = tile.updatePanel;
        tile.smallIconImg.remove();
        tile.titlePanel.remove();
    } else {
        tile.weatherContext.parent = tile.tileInnerBack;
    }
    weatherStyle[tile.type].apply(this, arguments);
};


})(ui, ui.$);

// Source: src/viewpage/toolbar.js

(function(ui, $) {
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
        }).add({
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
            moreActions = $("<li class='tool-item action-buttons'></li>");
            moreTool.append(moreActions);
            if(this.tools.length === 0) {
                this.extendPanel.parent().before(moreTool);
            } else {
                $(this.tools[0]).before(moreTool);
            }
            this.tools = this.toolbarPanel.children(".tools");
            this.extendButton = $("<a class='tool-action-button tool-extend-button' href='javascript:void(0)' title='更多'><i class='far fa-ellipsis-h'></i></a>");
            moreActions.append(this.extendButton);
        }
        
        var that = this;
        this.extendButton.on("click", function(e) {
            if(that.isExtendShow()) {
                that.hideExtend();
            } else {
                that.showExtend();
            }
        });
    },
    _initPinButton: function() {
        this.pinButton = $("<a class='tool-extend-pin-button font-highlight-hover' href='javascript:void(0)' title='固定扩展区域'><i class='far fa-thumbtack'></i></a>");
        this.extendWrapPanel.append(this.pinButton);
        var that = this;
        this.pinButton.on("click", function(e) {
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
            
            this.extendAnimator.start().then(function() {
                that.toolbarPanel.css("overflow", that._cssOverflow);
                option.target.css("display", "none");
            });
        }
    },
    _fireResize: function() {
        ui.page.fire("resize");
    },
    isExtendPin: function() {
        return this.pinButton.hasClass("extend-pin");  
    },
    pinExtend: function() {
        this.pinButton.addClass("extend-pin");
        this.pinButton.children("i")
            .removeClass("fa-thumbtack")
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
            .addClass("fa-thumbtack");
        this.extendButton.css("display", "inline-block");
            
        this.height = this.height - this.extendHeight;
        this.toolbarPanel.css("height", this.height + "px");
        this._fireResize();
        this.hideExtend();
    }
};

ui.Toolbar = Toolbar;


})(ui, ui.$);
