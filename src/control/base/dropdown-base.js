var htmlClickHideHandler = [],
    dropdownPanelBorderWidth = 2;

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
    showTimeValue: 200,
    hideTimeValue: 200,
    _create: function() {
        this.setLayoutPanel(this.option.layoutPanel);
        this.onMousemoveHandler = onMousemove.bind(this);
        this.onMouseupHandler = onMouseup.bind(this);
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
    show: function(fn) {
        ui.addHideHandler(this, this.hide);
        var parent, pw, ph,
            p, w, h,
            panelWidth, panelHeight,
            top, left;
        if (!this.isShow()) {
            this._panel.addClass(this._showClass);
            
            w = this.element.outerWidth();
            h = this.element.outerHeight();

            if(this.hasLayoutPanel()) {
                parent = this.layoutPanel;
                top = h;
                left = 0;
                p = this.element.parent().position();
                panelWidth = this._panel.outerWidth();
                panelHeight = this._panel.outerHeight();
                if(parent.css("overflow") === "hidden") {
                    pw = parent.width();
                    ph = parent.height();
                } else {
                    pw = parent[0].scrollWidth;
                    ph = parent[0].scrollHeight;
                    pw += parent.scrollLeft();
                    ph += parent.scrollTop();
                }
                if(p.top + h + panelHeight > ph) {
                    if(p.top - panelHeight > 0) {
                        top = -panelHeight;
                    }
                }
                if(p.left + panelWidth > pw) {
                    if(p.left - (p.left + panelWidth - pw) > 0) {
                        left = -(p.left + panelWidth - pw);
                    } else {
                        left = -p.left;
                    }
                }
                this._panel.css({
                    top: top + "px",
                    left: left + "px"
                });
            } else {
                ui.setDown(this.element, this._panel);
            }
            this._show(this._panel, fn);
        }
    },
    _show: function(panel, fn) {
        var callback,
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
        panel.fadeIn(this.showTimeValue, callback);
    },
    hide: function(fn) {
        if (this.isShow()) {
            this._panel.removeClass(this._showClass);
            this.element.removeClass(this._clearClass);
            this.element.off("mousemove", this.onMousemoveHandler);
            this.element.off("mouseup", this.onMouseupHandler);
            this.element.css("cursor", "auto");
            this._hide(this._panel, fn);
        }
    },
    _hide: function(panel, fn) {
        if(!$.isFunction(fn)) {
            fn = undefined;
        }
        panel.fadeOut(this.hideTimeValue, fn);
    },
    _clear: function() {
    }
});
