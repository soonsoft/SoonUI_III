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
        this.menuList.click(function (e) {
            that.onMenuItemClickHandler(e);
        });
        
        //菜单汉堡按钮点击事件
        if(this.hasMenuButton) {
            menuButton = this.option.menuButton;
            menuButton.click(function (e) {
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
