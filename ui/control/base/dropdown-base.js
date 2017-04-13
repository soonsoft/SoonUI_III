
var docClickHideHandler = [];

function hideDropdownPanels(current) {
    var handler, 
        retain;
    if (docClickHideHandler.length === 0) {
        return;
    }
    retain = [];
    while (handler = docClickHideHandler.shift()) {
        if (current && current === handler.ctrl) {
            continue;
        }
        if (handler.fn.call(handler.ctrl) === "retain") {
            retain.push(handler);
        }
    }

    docClickHideHandler.push.apply(docClickHideHandler, retain);
}

// 添加隐藏的处理方法
function addHideHandler(ctrl, fn) {
    if (ctrl && ui.core.isFunction(fn)) {
        docClickHideHandler.push({
            ctrl: ctrl,
            fn: fn
        });
    }
}
// 隐藏所有显示出来的下拉框
function hideAll(current) {
    hideDropdownPanels(current);
}

// 注册document点击事件
ui.page.docclick(function (e) {
    hideDropdownPanels();
});

// 下拉框基础类
ui.define("ui.ctrls.DropDownBase", {
    showTimeValue: 200,
    hideTimeValue: 200,
    _create: function() {
        this.setLayoutPanel(this.option.layoutPanel);
        this.onMousemoveHandler = $.proxy(function(e) {
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
        }, this);
        this.onMouseupHandler = $.proxy(function(e) {
            if(!this._clearable) {
                return;
            }
            var eWidth = this.element.width(),
                offsetX = e.offsetX;
            if(!offsetX) {
                offsetX = e.clientX - this.element.offset().left;
            }
            if (eWidth - offsetX < 0) {
                if ($.isFunction(this._clear)) {
                    this._clear();
                }
            }
        }, this);

        this._initElements();
    },
    _initElements: function() {
        if(!this.element) {
            return;
        }
        var that = this;
        if(this.element.hasClass(this._selectTextClass)) {
            this.element.css("width", parseFloat(this.element.css("width"), 10) - 23 + "px");
            if(this.hasLayoutPanel()) {
                this.element.parent().css("width", "auto");
            }
        }
        this.element.focus(function (e) {
            hideAll(that);
            that.show();
        }).click(function (e) {
            e.stopPropagation();
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
        if(!$.isNumeric(width)) {
            width = this.element 
                ? (this.element.width()) 
                : 100;
        }
        this.panelWidth = width;
        this._panel.css("width", width + "px");
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
        addHideHandler(this, this.hide);
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
            this.doShow(this._panel, fn);
        }
    },
    doShow: function(panel, fn) {
        var callback,
            that = this;
        if(!$.isFunction(fn)) {
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
            this.doHide(this._panel, fn);
        }
    },
    doHide: function(panel, fn) {
        if(!$.isFunction(fn)) {
            fn = undefined;
        }
        panel.fadeOut(this.hideTimeValue, fn);
    },
    _clear: null
});

ui.ctrls.DropDownBase.addHideHandler = addHideHandler;
ui.ctrls.DropDownBase.hideAll = hideAll;