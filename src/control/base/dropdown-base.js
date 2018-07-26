var htmlClickHideHandler = [],
    dropdownPanelBorderWidth = 1;

function hideControls (currentCtrl) {
    var handler, retain;
    if (htmlClickHideHandler.length === 0) {
        return;
    }
    retain = [];
    while (true) {
        handler = htmlClickHideHandler.shift();
        if(!handler) {
            break;
        }
        if (currentCtrl && currentCtrl === handler.ctrl) {
            continue;
        }
        if (handler.func.call(handler.ctrl) === "retain") {
            retain.push(handler);
        }
    }

    htmlClickHideHandler.push.apply(htmlClickHideHandler, retain);
}

// 注册document点击事件
ui.page.htmlclick(function (e) {
    hideControls();
});
// 添加隐藏的处理方法
ui.addHideHandler = function (ctrl, func) {
    if (ctrl && ui.core.isFunction(func)) {
        htmlClickHideHandler.push({
            ctrl: ctrl,
            func: func
        });
    }
};
// 隐藏所有显示出来的下拉框
ui.hideAll = function (currentCtrl) {
    hideControls(currentCtrl);
};

function getLayoutPanelLocation(layoutPanel, element, width, height, panelWidth, panelHeight) {
    var location,
        elementPosition,
        layoutPanelWidth, 
        layoutPanelHeight;

    location = {
        top: height,
        left: 0
    };
    location.topOffset = -height;

    elementPosition = element.parent().position();
    if(layoutPanel.css("overflow") === "hidden") {
        layoutPanelWidth = layoutPanel.width();
        layoutPanelHeight = layoutPanel.height();
    } else {
        layoutPanelWidth = layoutPanel[0].scrollWidth;
        layoutPanelHeight = layoutPanel[0].scrollHeight;
        layoutPanelWidth += layoutPanel.scrollLeft();
        layoutPanelHeight += layoutPanel.scrollTop();
    }
    if(elementPosition.top + height + panelHeight > layoutPanelHeight) {
        if(elementPosition.top - panelHeight > 0) {
            location.top = -panelHeight;
            location.topOffset = height;
        }
    }
    if(elementPosition.left + panelWidth > layoutPanelWidth) {
        if(elementPosition.left - (elementPosition.left + panelWidth - layoutPanelWidth) > 0) {
            location.left = -(elementPosition.left + panelWidth - layoutPanelWidth);
        } else {
            location.left = -elementPosition.left;
        }
    }

    return location;
}

function onMousemove(e) {
    var eWidth = this.element.width(),
        offsetX = e.offsetX;
    if(!offsetX) {
        offsetX = e.clientX - this.element.offset().left;
    }
    if (eWidth - offsetX < 0 && this.isShow()) {
        this.element.css("cursor", "pointer");
        this._clearable = true;
    } else {
        this.element.css("cursor", "auto");
        this._clearable = false;
    }
}

function onMouseup(e) {
    if(!this._clearable) {
        return;
    }
    var eWidth = this.element.width(),
        offsetX = e.offsetX;
    if(!offsetX) {
        offsetX = e.clientX - this.element.offset().left;
    }
    if (eWidth - offsetX < 0) {
        if (ui.core.isFunction(this._clear)) {
            this._clear();
        }
    }
}

function onFocus(e) {
    ui.hideAll(this);
    this.show();
}

function onClick(e) {
    e.stopPropagation();
}

// 下拉框基础类
ui.ctrls.define("ui.ctrls.DropDownBase", {
    _create: function() {
        this.setLayoutPanel(this.option.layoutPanel);
        this.onMousemoveHandler = onMousemove.bind(this);
        this.onMouseupHandler = onMouseup.bind(this);

        this.fadeAnimator = ui.animator({
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(opacity) {
                this.target.css("opacity", opacity / 100);
            }
        }).add({
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(translateY) {
                this.target.css("transform", "translateY(" + translateY + "px)");
            }
        });
        this.fadeAnimator.duration = 240;
    },
    _render: function(elementEvents) {
        var that,
            onFocusHandler,
            key;
        if(!this.element) {
            return;
        }

        onFocusHandler = onFocus.bind(this);
        that = this;
        if(!elementEvents) {
            elementEvents = {};
        }
        if(!ui.core.isFunction(elementEvents.focus)) {
            elementEvents.focus = onFocusHandler;
        }
        if(!ui.core.isFunction(elementEvents.click)) {
            elementEvents.click = onClick;
        }

        Object.keys(elementEvents).forEach(function(key) {
            that.element.on(key, elementEvents[key]);
        });
    },
    wrapElement: function(elem, panel) {
        if(panel) {
            this._panel = panel;
            if(!this.hasLayoutPanel()) {
                $(document.body).append(this._panel);
                return;
            }
        }
        if(!elem) {
            return;
        }
        var currentCss = {
            display: elem.css("display"),
            position: elem.css("position"),
            "margin-left": elem.css("margin-left"),
            "margin-top": elem.css("margin-top"),
            "margin-right": elem.css("margin-right"),
            "margin-bottom": elem.css("margin-bottom"),
            width: elem.outerWidth() + "px",
            height: elem.outerHeight() + "px"
        };
        if(currentCss.position === "relative" || currentCss.position === "absolute") {
            currentCss.top = elem.css("top");
            currentCss.left = elem.css("left");
            currentCss.right = elem.css("right");
            currentCss.bottom = elem.css("bottom");
        }
        currentCss.position = "relative";
        if(currentCss.display.indexOf("inline") === 0) {
            currentCss.display = "inline-block";
            currentCss["vertical-align"] = elem.css("vertical-align");
            elem.css("vertical-align", "top");
        } else {
            currentCss.display = "block";
        }
        var wrapElem = $("<div class='dropdown-wrap' />").css(currentCss);
        elem.css({
            "margin": "0px"
        }).wrap(wrapElem);
        
        wrapElem = elem.parent();
        if(panel) {
            wrapElem.append(panel);
        }
        return wrapElem;
    },
    isWrapped: function(element) {
        if(!element) {
            element = this.element;
        }
        return element && element.parent().hasClass("dropdown-wrap");
    },
    moveToElement: function(element, dontCheck) {
        if(!element) {
            return;
        }
        var parent;
        if(!dontCheck && this.element && this.element[0] === element[0]) {
            return;
        }
        if(this.hasLayoutPanel()) {
            if(!this.isWrapped(element)) {
                parent = this.wrapElement(element);
            } else {
                parent = element.parent();
            }
            parent.append(this._panel);
        } else {
            $(document.body).append(this._panel);
        }
    },
    initPanelWidth: function(width) {
        if(!ui.core.isNumber(width)) {
            width = this.element ? this.element.outerWidth() : 100;
        }
        this.panelWidth = width - dropdownPanelBorderWidth * 2;
        this._panel.css("width", this.panelWidth + "px");
    },
    hasLayoutPanel: function() {
        return !!this.layoutPanel;
    },
    setLayoutPanel: function(layoutPanel) {
        this.option.layoutPanel = layoutPanel;
        this.layoutPanel = ui.getJQueryElement(this.option.layoutPanel);
    },
    isShow: function() {
        return this._panel.hasClass(this._showClass);
    },
    show: function(callback) {
        ui.addHideHandler(this, this.hide);
        var panelWidth, panelHeight,
            width, height,
            location,
            offset;

        if (!this.isShow()) {
            this._panel.addClass(this._showClass);
            this._panel.css("opacity", "0");
            
            width = this.element.outerWidth();
            height = this.element.outerHeight();

            panelWidth = this._panel.outerWidth();
            panelHeight = this._panel.outerHeight();

            if(this.hasLayoutPanel()) {
                location = getLayoutPanelLocation(this.layoutPanel, this.element, width, height, panelWidth, panelHeight);
            } else {
                location = ui.getDownLocation(this.element, panelWidth, panelHeight);
                location.topOffset = -height;
                offset = this.element.offset();
                if(location.top < offset.top) {
                    location.topOffset = height;
                }
            }

            this._panel.css({
                "top": location.top + "px",
                "left": location.left + "px",
                "transform": "translateY(" + location.topOffset + "px)"
            });
            this.panelLocation = location;
            this._show(this._panel, callback);
        }
    },
    _show: function(panel, fn) {
        var callback,
            option,
            that = this;
        if(!ui.core.isFunction(fn)) {
            fn = undefined;
        }
        if (this._clearClass) {
            callback = function () {
                that.element.addClass(that._clearClass);
                that.element.on("mousemove", that.onMousemoveHandler);
                that.element.on("mouseup", that.onMouseupHandler);

                if(fn) fn.call(that);
            };
        } else {
            callback = fn;
        }
        
        this.fadeAnimator.stop();

        option = this.fadeAnimator[0];
        option.target = panel;
        option.begin = parseFloat(option.target.css("opacity")) * 100 || 0;
        option.end = 100;

        option = this.fadeAnimator[1];
        option.target = panel;
        option.begin = this.panelLocation.topOffset;
        option.end = 0;

        panel.css("display", "block");
        this.fadeAnimator.onEnd = callback;

        this.fadeAnimator.start();
    },
    hide: function(callback) {
        if (this.isShow()) {
            this._panel.removeClass(this._showClass);
            this.element.removeClass(this._clearClass);
            this.element.off("mousemove", this.onMousemoveHandler);
            this.element.off("mouseup", this.onMouseupHandler);
            this.element.css("cursor", "auto");
            this._hide(this._panel, callback);
        }
    },
    _hide: function(panel, fn) {
        var option,
            that;
        if(!ui.core.isFunction(fn)) {
            fn = undefined;
        }

        this.fadeAnimator.stop();

        option =  this.fadeAnimator[0];
        option.target = panel;
        option.begin = parseFloat(option.target.css("opacity")) * 100 || 100;
        option.end = 0;

        option = this.fadeAnimator[1];
        option.target = panel;
        option.begin = 0;
        option.end = this.panelLocation.topOffset;

        this.fadeAnimator.onEnd = fn;
        this.fadeAnimator
            .start()
            .then(function(e) {
                option.target.css("display", "none");
            });
    },
    _clear: function() {
    }
});
