// Source: ui/control/base/dropdown-base.js

(function($, ui) {

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

})(jQuery, ui);

// Source: ui/control/base/pager.js

(function($, ui) {
//控件分页逻辑，GridView, ReportView, flowView
var pageHashPrefix = "page";
function Pager(option) {
    if(!option) {
        option = {};
    }
    this.pageNumPanel = null;
    this.pageInfoPanel = null;

    this.pageButtonCount = 5;
    this.pageIndex = 1;
    this.pageSize = 100;

    this.data = [];
    this.pageInfoFormatter = option.pageInfoFormatter;

    if ($.isNumeric(option.pageIndex) && option.pageIndex > 0) {
        this.pageIndex = option.pageIndex;
    }
    if ($.isNumeric(option.pageSize) || option.pageSize > 0) {
        this.pageSize = option.pageSize;
    }
    if ($.isNumeric(option.pageButtonCount) || option.pageButtonCount > 0) {
        this.pageButtonCount = option.pageButtonCount;
    }
    this._ex = Math.floor((this.pageButtonCount - 1) / 2);
}
Pager.prototype = {
    constructor: Pager,
    renderPageList: function (rowCount) {
        var pageInfo = this._createPageInfo();
        if (!$.isNumeric(rowCount) || rowCount < 1) {
            if (this.data) {
                rowCount = this.data.length || 0;
            } else {
                rowCount = 0;
            }
        }
        pageInfo.pageIndex = this.pageIndex;
        pageInfo.pageSize = this.pageSize;
        pageInfo.rowCount = rowCount;
        pageInfo.pageCount = Math.floor((rowCount + this.pageSize - 1) / this.pageSize);
        if (this.pageInfoPanel) {
            this.pageInfoPanel.html("");
            this._showRowCount(pageInfo);
        }
        this._renderPageButton(pageInfo.pageCount);
        if (pageInfo.pageCount) {
            this._checkAndSetDefaultPageIndexHash(this.pageIndex);
        }
    },
    _showRowCount: function (pageInfo) {
        var dataCount = (this.data) ? this.data.length : 0;
        if (pageInfo.pageCount == 1) {
            pageInfo.currentRowNum = pageInfo.rowCount < pageInfo.pageSize ? pageInfo.rowCount : pageInfo.pageSize;
        } else {
            pageInfo.currentRowNum = dataCount < pageInfo.pageSize ? dataCount : pageInfo.pageSize;
        }
        
        if(this.pageInfoFormatter) {
            for(var key in this.pageInfoFormatter) {
                if(this.pageInfoFormatter.hasOwnProperty(key) && $.isFunction(this.pageInfoFormatter[key])) {
                    this.pageInfoPanel
                            .append(this.pageInfoFormatter[key].call(this, pageInfo[key]));
                }
            }
        }
    },
    _createPageInfo: function() {
        return {
            rowCount: -1,
            pageCount: -1,
            pageIndex: -1,
            pageSize: -1,
            currentRowNum: -1
        }; 
    },
    _renderPageButton: function (pageCount) {
        if (!this.pageNumPanel) return;
        this.pageNumPanel.empty();

        //添加页码按钮
        var start = this.pageIndex - this._ex;
        start = (start < 1) ? 1 : start;
        var end = start + this.pageButtonCount - 1;
        end = (end > pageCount) ? pageCount : end;
        if ((end - start + 1) < this.pageButtonCount) {
            if ((end - (this.pageButtonCount - 1)) > 0) {
                start = end - (this.pageButtonCount - 1);
            }
            else {
                start = 1;
            }
        }

        //当start不是从1开始时显示带有特殊标记的首页
        if (start > 1)
            this.pageNumPanel.append(this._createPageButton("1..."));
        for (var i = start, btn; i <= end; i++) {
            if (i == this.pageIndex) {
                btn = this._createCurrentPage(i);
            } else {
                btn = this._createPageButton(i);
            }
            this.pageNumPanel.append(btn);
        }
        //当end不是最后一页时显示带有特殊标记的尾页
        if (end < pageCount)
            this.pageNumPanel.append(this._createPageButton("..." + pageCount));
    },
    _createPageButton: function (pageIndex) {
        return "<a class='pager-button font-highlight-hover'>" + pageIndex + "</a>";
    },
    _createCurrentPage: function (pageIndex) {
        return "<span class='pager-current font-highlight'>" + pageIndex + "</span>";
    },
    pageChanged: function(eventHandler, eventCaller) {
        var that;
        if(this.pageNumPanel && $.isFunction(eventHandler)) {
            eventCaller = eventCaller || ui;
            this.pageChangedHandler = function() {
                eventHandler.call(eventCaller, this.pageIndex, this.pageSize);
            };
            that = this;
            if(!ui.core.ie || ui.core.ie >= 8) {
                ui.hashchange(function(e, hash) {
                    if(that._breakHashChanged) {
                        that._breakHashChanged = false;
                        return;
                    }
                    if(!that._isPageHashChange(hash)) {
                        return;
                    }
                    that.pageIndex = that._getPageIndexByHash(hash);
                    that.pageChangedHandler();
                });
            }
            this.pageNumPanel.click(function(e) {
                var btn = $(e.target);
                if (btn.nodeName() !== "A")
                    return;
                var num = btn.text();
                num = num.replace("...", "");
                num = parseInt(num, 10);

                that.pageIndex = num;
                if (!ui.core.ie || ui.core.ie >= 8) {
                    that._setPageHash(that.pageIndex);
                }
                that.pageChangedHandler();
            });
        }
    },
    empty: function() {
        if(this.pageNumPanel) {
            this.pageNumPanel.html("");
        }
        if(this.pageInfoPanel) {
            this.pageInfoPanel.html("");
        }
        this.data = [];
        this.pageIndex = 1;
    },
    _setPageHash: function(pageIndex) {
        if(!pageIndex) {
            return;
        }
        
        this._breakHashChanged = true;
        window.location.hash = pageHashPrefix + "=" + pageIndex;
    },
    _isPageHashChange: function(hash) {
        var index = 0;
        if(!hash) {
            return false;
        }
        if(hash.charAt(0) === "#") {
            index = 1;
        }
        return hash.indexOf(pageHashPrefix) == index;
    },
    _getPageIndexByHash: function(hash) {
        var pageIndex,
            index;
        if(hash) {
            index = hash.indexOf("=");
            if(index >= 0) {
                pageIndex = hash.substring(index + 1, hash.length);
                return parseInt(pageIndex, 10);
            }
        }
        return 1;
    },
    _checkAndSetDefaultPageIndexHash: function (pageIndex) {
        var hash = window.location.hash;
        var len = hash.length;
        if (hash.charAt(0) === "#")
            len--;
        if (len <= 0) {
            this._setPageHash(pageIndex);
        }
    }
};

ui.ctrls.Pager = Pager;


})(jQuery, ui);

// Source: ui/control/base/sidebar.js

(function($, ui) {
//侧滑面板基类
ui.define("ui.ctrls.Sidebar", {
    showTimeValue: 300,
    hideTimeValue: 300,
    _defineOption: function() {
        return {
            parent: null,
            width: 240
        };
    },
    _defineEvents: function () {
        return ["showing", "showed", "hiding", "hided", "resize"];
    },
    _create: function() {
        var that = this;

        this._showClass = "sidebar-show";
        
        this.parent = ui.getJQueryElement(this.option.parent);
        this._panel = $("<aside class='sidebar-panel border-highlight' />");
        this._panel.css("width", this.width + "px");
        
        this._closeButton = $("<button class='icon-button' />");
        this._closeButton.append("<i class='fa fa-arrow-right'></i>");
        this._closeButton.css({
            "position": "absolute",
            "top": "6px",
            "right": "10px",
            "z-index": 999
        });
        
        this.height = 0;
        this.width = this.option.width || 240;
        this.borderWidth = 0;

        this.parent.append(this._panel);
        if(this.element) {
            this._panel.append(this.element);
        }
        this._closeButton.click(function(e) {
            that.hide();
        });
        this._panel.append(this._closeButton);
        
        this.borderWidth += parseInt(this._panel.css("border-left-width"), 10) || 0;
        this.borderWidth += parseInt(this._panel.css("border-right-width"), 10) || 0;
        
        //进入异步调用，给resize事件绑定的时间
        setTimeout(function() {
            that.setSizeLocation();
        });
        ui.resize(function() {
            that.setSizeLocation();
        }, ui.eventPriority.ctrlResize);
        
        this.animator = ui.animator({
            target: this._panel,
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css("left", val + "px");
            }
        });
    },
    set: function (elem) {
        if(this.element) {
            this.element.remove();
        }
        if(ui.core.isDomObject(elem)) {
            elem = $(elem);
        } else if(!ui.core.isJQueryObject(elem)) {
            return;
        }
        this.element = elem;
        this._closeButton.before(elem);
    },
    append: function(elem) {
        if(ui.core.isDomObject(elem)) {
            elem = $(elem);
        } else if(!ui.core.isJQueryObject(elem)) {
            return;
        }
        this._panel.append(elem);
        if(!this.element) {
            this.element = elem;
        }
    },
    setSizeLocation: function(width, resizeFire) {
        var parentWidth = this.parent.width(),
            parentHeight = this.parent.height();
        
        this.height = parentHeight;
        var sizeCss = {
            height: this.height + "px"
        };
        var right = this.width;
        if ($.isNumeric(width)) {
            this.width = width;
            sizeCss["width"] = this.width + "px";
            right = width;
        }
        this.hideLeft = parentWidth;
        this.left = parentWidth - this.width - this.borderWidth;
        this._panel.css(sizeCss);
        if (this.isShow()) {
            this._panel.css({
                "left": this.left + "px",
                "display": "block"
            });
        } else {
            this._panel.css({
                "left": this.hideLeft + "px",
                "display": "none"
            });
        }
        
        if(resizeFire !== false) {
            this.fire("resize", this.width, this.height);
        }
    },
    isShow: function() {
        return this._panel.hasClass(this._showClass);
    },
    show: function() {
        var op, 
            that = this,
            i, len;
        if(!this.isShow()) {
            this.animator.stop();
            this.animator.splice(1, this.length - 1);
            this.animator.duration = this.showTimeValue;
            
            op = this.animator[0];
            op.target.css("display", "block");
            op.target.addClass(this._showClass);
            op.begin = parseFloat(op.target.css("left"), 10) || this.hideLeft;
            op.end = this.left;

            for(i = 0, len = arguments.length; i < len; i++) {
                if(arguments[i]) {
                    this.animator.addTarget(arguments[i]);
                }
            }

            this.animator.onBegin = function() {
                that.fire("showing");
            };
            this.animator.onEnd = function() {
                this.splice(1, this.length - 1);
                that.fire("showed");
            };
            return this.animator.start();
        }
        return null;
    },
    hide: function() {
        var op,
            that = this,
            i, len;
        if(this.isShow()) {
            this.animator.stop();
            this.animator.splice(1, this.length - 1);
            this.animator.duration = this.hideTimeValue;
            
            op = this.animator[0];
            op.target.removeClass(this._showClass);
            op.begin = parseFloat(op.target.css("left"), 10) || this.left;
            op.end = this.hideLeft;
            
            for(i = 0, len = arguments.length; i < len; i++) {
                if(arguments[i]) {
                    this.animator.addTarget(arguments[i]);
                }
            }

            this.animator.onBegin = function() {
                that.fire("hiding");
            };
            this.animator.onEnd = function() {
                this.splice(1, this.length - 1);
                op.target.css("display", "none");
                that.fire("hided");
            };
            return this.animator.start();
        }
        return null;
    }
});


})(jQuery, ui);

// Source: ui/control/box/dialog-box.js

(function($, ui) {
// DialogBox


})(jQuery, ui);

// Source: ui/control/box/message-box.js

(function($, ui) {
// MessageBox


})(jQuery, ui);

// Source: ui/control/box/option-box.js

(function($, ui) {
// OptionBox


})(jQuery, ui);

// Source: ui/control/view/calendar-view.js

(function($, ui) {
// CalendarView


})(jQuery, ui);

// Source: ui/control/view/card-view.js

(function($, ui) {
//CardView


})(jQuery, ui);

// Source: ui/control/view/grid-view.js

(function($, ui) {
// GridView


})(jQuery, ui);

// Source: ui/control/view/list-view.js

(function($, ui) {
//列表

function defaultItemFormatter() {

}

ui.define("ui.ctrls.ListView", {
    _defineOption: function() {
        return {
            multiple: false,
            data: null,
            itemFormatter: false,
            hasRemoveButton: false
        };
    },
    _defineEvents: function() {
        return ["selecting", "selected", "deselected", "cancel", "removing", "removed"];
    },
    _create: function() {
        this.listData = [];
        this.selectList = [];

        if(!ui.core.isFunction(this.option.itemFormatter)) {
            this.option.itemFormatter = defaultItemFormatter;
        }

        this.option.hasRemoveButton = !!this.option.hasRemoveButton;
        this.onListItemClickHandler = $.proxy(this.onListItemClick);

        this._init();
    },
    _init: function() {
        this.element.addClass("ui-list-view");

        this.listPanel = $("<ul class='ui-list-view-ul' />");
        this.listPanel.click(this.onListItemClickHandler);
        this.element.append(this.listPanel);

        this._initAnimator();
        this.setData(this.option.data);
    },
    _initAnimator: function() {
        // TODO Something
    },
    _fill: function(data) {
        var i, len,
            itemBuilder = [],
            item;

        this.listPanel.empty();
        for(i = 0, len = data.length; i < len; i++) {
            item = data[i];
            if(item === null || item === undefined) {
                continue;
            }
            this._createItem(builder, item, i);
        }
        this.listPanel.html(itemBuilder.join(""));
    },
    _createItem: function(builder, item, index) {
        var content,
            index,
            temp;
        builder.push("<li class='ui-list-view-item'>");
        content = this.option.itemFormatter.call(this, item, index);
        if(ui.core.isString(content)) {
            builder.push(content);
        } else if(ui.core.isPlainObject(content)) {
            temp = builder[builder.length - 1];
            index = temp.lastIndexOf("'");
            builder[builder.length - 1] = temp.substring(0, index);
            // 添加class
            if(ui.core.isString(content.class)) {
                builder.push(" ", content.class);
            } else if(Array.isArray(content.class)) {
                builder.push(" ", content.class.join(" "));
            }
            builder.push("'");

            // 添加style
            if(content.style && !ui.core.isEmptyObject(content.style)) {
                builder.push(" style='");
                for(temp in content.style) {
                    if(content.style.hasOwnProperty(temp)) {
                        builder.push(temp, ":", content.style[temp], ";");
                    }
                }
                builder.push("'");
            }
            builder.push(">");

            // 放入html
            if(ui.core.isString(content.html)) {
                builder.push(content.html);
            }
        }
        builder.push("</li>");
    },

    /// API
    setData: function(data) {
        if(Array.isArray(data)) {
            this._fill(data);
        }
    }

});


})(jQuery, ui);

// Source: ui/control/view/report-view.js

(function($, ui) {
// ReportView


})(jQuery, ui);

// Source: ui/control/tools/confirm-button.js

(function($, ui) {
/* 确认按钮 */
ui.define("ui.ctrls.ConfirmButton", {
    _defineOption: function () {
        return {
            disabled: false,
            readonly: false,
            backTime: 5000,
            checkHandler: false,
            handler: false,
            color: null,
            backgroundColor: null
        };
    },
    _create: function() {
        var text,
            textState,
            confirmState;

        this.state = 0;
        this.animating = false;
        if(ui.core.type(this.option.backTime) !== "number" || this.option.backTime <= 0) {
            this.option.backTime = 5000;
        }

        if(!ui.core.isFunction(this.option.handler)) {
            return;
        }
        text = this.element.text().trim();
        textState = $("<span class='text-state' />");
        confirmState = $("<i class='confirm-state' />");
        
        textState.text(text);
        if(!this.option.backgroundColor) {
            this.option.backgroundColor = this.element.css("color");
        }
        confirmState
            .text("确定")
            .css("background-color", this.option.backgroundColor);
        if(this.option.color) {
            confirmState.css("color", this.option.color);
        }
        this.element.addClass("confirm-button");
        this.element.css("width", this.element.width() + "px");
        this.element
            .empty()
            .append(textState)
            .append(confirmState);
        
        this.changeAnimator = ui.animator({
            target: textState,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("margin-left", val + "%");
            }
        }).addTarget({
            target: confirmState,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("left", val + "%");
            }
        });
        this.changeAnimator.duration = 200;
        this.element.click($.proxy(this.doClick, this));
        
        this.readonly(this.option.readonly);
        this.disabled(this.option.disabled);
    },
    doClick: function(e) {
        clearTimeout(this.backTimeHandler);
        if($.isFunction(this.option.checkHandler)) {
            if(this.option.checkHandler.call(this) === false) {
                return;
            }
        }
        var that = this;
        if(this.state == 0) {
            this.next();
            this.backTimeHandler = setTimeout(function() {
                that.back();
            }, this.option.backTime);
        } else if(this.state == 1) {
            this.next();
            this.option.handler.call(this);
        }
    },
    back: function() {
        if(this.animating) {
            return;
        }
        var that = this,
            option;
        this.state = 0;
        option = this.changeAnimator[0];
        option.target.css("margin-left", "-200%");
        option.begin = -200;
        option.end = 0;
        option = this.changeAnimator[1];
        option.target.css("left", "0%");
        option.begin = 0;
        option.end = 100;
        
        this.animating = true;
        this.changeAnimator.start().done(function() {
            that.animating = false;
        });
    },
    next: function(state) {
        if(this.animating) {
            return;
        }
        var that = this,
            option;
        if(this.state == 0) {
            option = this.changeAnimator[0];
            option.target.css("margin-left", "0%");
            option.begin = 0;
            option.end = -200;
            option = this.changeAnimator[1];
            option.target.css("left", "100%");
            option.begin = 100;
            option.end = 0;
            
            this.state = 1;
        } else {
            option = this.changeAnimator[0];
            option.target.css("margin-left", "100%");
            option.begin = 100;
            option.end = 0;
            option = this.changeAnimator[1];
            option.target.css("left", "0%");
            option.begin = 0;
            option.end = -100;
            
            this.state = 0;
        }
        this.animating = true;
        this.changeAnimator.start().done(function() {
            that.animating = false;
        });
    },
    disabled: function() {
        if(arguments.length == 0) {
            return this.option.disabled;
        } else {
            this.option.disabled = !!arguments[0];
            if(this.option.disabled) {
                this.element.attr("disabled", "disabled");
            } else {
                this.element.removeAttr("disabled")
            }
        }
    },
    readonly: function() {
        if(arguments.length == 0) {
            return this.option.readonly;
        } else {
            this.option.readonly = !!arguments[0];
            if(this.option.readonly) {
                this.element.attr("readonly", "readonly");
            } else {
                this.element.removeAttr("readonly");
            }
        }
    },
    text: function() {
        var span = this.element.children(".text-state");
        if(arguments.length == 0) {
            return span.text();
        } else {
            return span.text(ui.str.trim(arguments[0] + ""));
        }
    }
});
$.fn.confirmClick = function(option) {
    if (!this || this.length == 0) {
        return null;
    }
    if(ui.core.isFunction(option)) {
        if(ui.core.isFunction(arguments[1])) {
            option = {
                checkHandler: option,
                handler: arguments[1]
            };
        } else {
            option = {
                handler: option
            };
        }
    }
    return ui.ctrls.ConfirmButton(option, this);
};


})(jQuery, ui);

// Source: ui/control/tools/extend-button.js

(function($, ui) {
/* 扩展按钮 */
ui.define("ui.ctrls.ExtendButton", {
    _defineOption: function() {
        return {
            buttonSize: 32,
            //centerIcon = close: 关闭按钮 | none: 中空结构 | htmlString: 提示信息
            centerIcon: "close",
            centerSize: null,
            buttons: [],
            parent: null
        };
    },
    _defineEvents: function() {
        return ["showing", "showed", "hiding", "hided"];
    },
    _create: function() {
        this.parent = ui.getJQueryElement(this.option.parent);
        if(!this.parent) {
            this.parent = $(document.body);
            this.isBodyInside = true;
        } else {
            this.isBodyInside = false;
        }
        this.buttonPanelBGBorderWidth = 0;
        if(ui.core.type(this.option.buttonSize) !== "number") {
            this.option.buttonSize = 32;
        }
        this.centerSize = this.option.centerSize;
        if(ui.core.type(this.centerSize) !== "number") {
            this.centerSize = this.option.buttonSize;
        }
        if(ui.core.type(this.option.buttons) !== "array") {
            this.option.buttons = [];   
        }
        
        this.buttonPanel = $("<div class='extend-button-panel' />");
        this.buttonPanelBackground = $("<div class='extend-button-background border-highlight' />");
        
        this.hasCloseButton = false;
        if(this.option.centerIcon === "close") {
            this.hasCloseButton = true;
            this.centerIcon = $("<a class='center-icon close-button font-highlight' style='font-size:24px !important;' title='关闭'>×</a>");
        } else if(this.option.centerIcon === "none") {
            this.centerIcon = $("<a class='center-icon center-none border-highlight' />");
            this.backgroundColorPanel = $("<div class='background-panel' />");
            this.buttonPanelBackground.append(this.backgroundColorPanel);
            this.buttonPanelBackground.append(this.centerIcon);
            this.buttonPanelBackground.css("background-color", "transparent");
        } else {
            this.centerIcon = $("<a class='center-icon' />");
            if(!ui.str.isNullOrEmpty(this.option.centerIcon)) {
                this.centerIcon.append(this.option.centerIcon);
            }
        }
        
        this._createAnimator();
        this._init();
    },
    _createAnimator: function() {
        this.buttonPanelAnimator = ui.animator({
            target: this.buttonPanelBackground,
            onChange: function(val) {
                this.target.css("top", val + "px");
            }
        }).addTarget({
            target: this.buttonPanelBackground,
            onChange: function(val) {
                this.target.css("left", val + "px");
            }
        }).addTarget({
            target: this.buttonPanelBackground,
            onChange: function(val) {
                this.target.css({
                    "width": val + "px",
                    "height": val + "px"
                });
            }
        }).addTarget({
            target: this.buttonPanelBackground,
            onChange: function(op) {
                this.target.css({
                    "opacity": op / 100,
                    "filter": "Alpha(opacity=" + op + ")"
                });
            }
        });
        this.buttonPanelAnimator.duration =240;

        this.buttonAnimator = ui.animator();
        this.buttonAnimator.duration = 240;
    },
    _init: function() {
        var i = 0,
            len,
            that = this;
        
        this._caculateSize();
        this.buttonPanel.append(this.buttonPanelBackground);
        
        if(this.option.centerIcon === "none") {
            this.backgroundColorPanel.css({
                "width": this.centerSize + "px",
                "height": this.centerSize + "px"
            });
            this.buttonPanelAnimator[2].onChange = function(val) {
                var borderWidth = (that.buttonPanelSize - that.centerSize) / 2;
                if(val > that.centerSize) {
                    borderWidth = Math.ceil(borderWidth * (val / that.buttonPanelSize));
                } else {
                    borderWidth = 0;   
                }
                this.target.css({
                    "width": val + "px",
                    "height": val + "px"
                });
                that.backgroundColorPanel.css("border-width", borderWidth + "px");
            };
            this.centerIcon.css({
                "width": this.centerSize + "px",
                "height": this.centerSize + "px",
                "margin-left": -(this.centerSize / 2 + 1) + "px",
                "margin-top": -(this.centerSize / 2 + 1) + "px"
            });
        } else {
            this.centerIcon.css({
                "width": this.centerSize + "px",
                "height": this.centerSize + "px",
                "line-height": this.centerSize + "px",
                "top": this.centerTop - this.centerSize / 2 + "px",
                "left": this.centerLeft - this.centerSize / 2 + "px"
            });
            this.buttonPanel.append(this.centerIcon);
        }
        
        for(len = this.option.buttons.length; i < len; i++) {
                this._createButton(this.option.buttons[i], this.deg * i);
        }
        if($.isFunction(this.element.addClass)) {
            this.element.addClass("extend-element");
        }
        this.parent.append(this.buttonPanel);
        this.buttonPanelBGBorderWidth = parseFloat(this.buttonPanelBackground.css("border-top-width")) || 0;
        
        this.bindShowEvent();
        this.bindHideEvent();
        this.buttonPanel.click(function(e) {
            e.stopPropagation();
        });
    },
    bindShowEvent: function() {
        var that = this;
        this.element.click(function(e) {
            e.stopPropagation();
            that.show();
        });
    },
    bindHideEvent: function() {
        var that = this;
        if(this.hasCloseButton) {
            this.centerIcon.click(function(e) {
                that.hide();
            });
        } else {
            ui.docClick(function(e) {
                that.hide();
            });
        }
    },
    getElementCenter: function() {
        var position = this.isBodyInside 
            ? this.element.offset()
            : this.element.position();
        position.left = position.left + this.element.outerWidth() / 2;
        position.top = position.top + this.element.outerHeight()/ 2;
        return position;
    },
    isShow: function() {
        return this.buttonPanel.css("display") === "block";  
    },
    show: function(hasAnimation) {
        var that = this;
        if(this.isShow()) {
            return;
        }
        
        if(this.fire("showing") === false) {
            return;
        }
        
        this._setButtonPanelLocation();
        if(hasAnimation === false) {
            this.buttonPanel.css("display", "block");
        } else {
            this.buttonPanel.css("display", "block");
            this._setButtonPanelAnimationOpenValue(this.buttonPanelAnimator);
            this._setButtonAnimationOpenValue(this.buttonAnimator);
            this.buttonPanelAnimator.start();
            this.buttonAnimator.delayHandler = setTimeout(function() {
                that.buttonAnimator.delayHandler = null;
                that.buttonAnimator.start().done(function() {
                    that.fire("showed");
                });
            }, 100);
        }
    },
    hide: function(hasAnimation) {
        var that = this;
        if(!this.isShow()) {
            return;
        }
        
        if(this.fire("hiding") === false) {
            return;
        }
        
        if(hasAnimation === false) {
            this.buttonPanel.css("display", "none");
        } else {
            this._setButtonPanelAnimationCloseValue(this.buttonPanelAnimator);
            this._setButtonAnimationCloseValue(this.buttonAnimator);
            this.buttonAnimator.start();
            this.buttonPanelAnimator.delayHandler = setTimeout(function() {
                that.buttonPanelAnimator.delayHandler = null;
                that.buttonPanelAnimator.start().done(function() {
                    that.buttonPanel.css("display", "none");
                    that.fire("hided");
                });
            }, 100);
        }
    },
    _setButtonPanelAnimationOpenValue: function(animator) {
        var option,
            target;
        option = animator[0];
        target = option.target;
        option.begin = this.centerTop - this.centerSize / 2;
        option.end = 0 - this.buttonPanelBGBorderWidth;
        option.ease = ui.AnimationStyle.easeTo;
        
        option = animator[1];
        option.begin = this.centerLeft - this.centerSize / 2;
        option.end = 0 - this.buttonPanelBGBorderWidth;
        option.ease = ui.AnimationStyle.easeTo;
        
        option = animator[2];
        option.begin = this.centerSize;
        option.end = this.buttonPanelSize;
        option.ease = ui.AnimationStyle.easeTo;
        
        option = animator[3];
        option.begin = 0;
        option.end = 100;
        option.ease = ui.AnimationStyle.easeFrom;
        
        target.css({
            "left": this.centerLeft - this.buttonSize / 2 + "px",
            "top": this.centerTop - this.buttonSize / 2 + "px",
            "width": this.buttonSize + "px",
            "height": this.buttonSize + "px"
        });
    },
    _setButtonPanelAnimationCloseValue: function(animator) {
        var option,
            temp;
        var i = 0,
            len = animator.length;
        for(; i < len; i++) {
            option = animator[i];
            temp = option.begin;
            option.begin = option.end;
            option.end = temp;
            option.ease = ui.AnimationStyle.easeFrom;
        }
    },
    _setButtonAnimationOpenValue: function(animator) {
        var i = 0,
            len = animator.length;
        var option,
            button;
        for(; i < len; i ++) {
            button = this.option.buttons[i];
            option = animator[i];
            option.begin = 0;
            option.end = 100;
            option.ease = ui.AnimationStyle.easeTo;
            option.target.css({
                "top": button.startTop + "px",
                "left": button.startLeft + "px"
            });
        }
    },
    _setButtonAnimationCloseValue: function(animator) {
        var i = 0,
            len = animator.length;
        var option,
            button;
        for(; i < len; i ++) {
            button = this.option.buttons[i];
            option = animator[i];
            option.begin = 100;
            option.end = 0;
            option.ease = ui.AnimationStyle.easeFrom;
        }
    },
    _caculateSize: function() {
        var buttonCount = this.option.buttons.length;
        this.deg = 360 / buttonCount;
        var radian = this.deg / 180 * Math.PI;
        var length = this.option.buttonSize;
        var temp = length / 2 / Math.tan(radian / 2);
        if(temp <= length / 2) {
            temp = length / 2 + 4;
        }
        this.centerRadius = temp + length / 2;
        this.insideRadius = temp + length;
        this.outsideRadius = Math.sqrt(this.insideRadius * this.insideRadius + (length / 2) * (length / 2));
        this.outsideRadius += 20;
        
        this.buttonSize = length;
        this.buttonPanelSize = Math.ceil(this.outsideRadius * 2);
        
        this.centerTop = this.centerLeft = this.buttonPanelSize / 2;
    },
    _setButtonPanelLocation: function() {
        var center = this.getElementCenter();
        var buttonPanelTop = Math.floor(center.top - this.buttonPanelSize / 2);
        var buttonPanelLeft = Math.floor(center.left - this.buttonPanelSize / 2);
        
        this.buttonPanel.css({
            "top": buttonPanelTop + "px",
            "left": buttonPanelLeft + "px",
            "width": this.buttonPanelSize + "px",
            "height": this.buttonPanelSize + "px"
        });
    },
    _caculatePositionByCenter: function(x, y) {
        var position = {
            left: 0,
            top: 0
        };
        position.left = x - this.buttonSize / 2;
        position.top = y - this.buttonSize / 2;
        return position;
    },
    _createButton: function(button, deg) {
        var radian,
            position,
            x,
            y,
            that = this;
        button.elem = $("<a href='javascript:void(0)' class='extend-button background-highlight' />");
        if(button.icon) {
            button.elem.append(button.icon);
        }
        if(ui.str.isNullOrEmpty(button.title)) {
            button.elem.prop("title", button.title);
        }
        button.centerStartLeft = 0;
        button.centerStartTop = 0;
        
        radian = deg / 180 * Math.PI;
        x = this.centerRadius * Math.sin(radian) + button.centerStartLeft;
        y = this.centerRadius * Math.cos(radian) + button.centerStartTop;
        
        button.centerLeft = Math.floor(this.centerLeft + x);
        button.centerTop =  Math.floor(this.centerTop - y);
        
        position = this._caculatePositionByCenter(this.centerLeft, this.centerTop);
        button.startLeft = position.left;
        button.startTop = position.top;
        
        button.elem.css({
            "width": this.buttonSize + "px",
            "height": this.buttonSize + "px",
            "line-height": this.buttonSize + "px"
        });
        this.buttonPanel.append(button.elem);
        
        this.buttonAnimator.addTarget({
            target: button.elem,
            button: button,
            that: this,
            onChange: function(val) {
                var centerLeft = (this.button.centerLeft - this.that.centerLeft) * val / 100 + this.that.centerLeft,
                    centerTop = (this.button.centerTop - this.that.centerTop) * val / 100 + this.that.centerTop;
                var po = this.that._caculatePositionByCenter(centerLeft, centerTop);
                this.target.css({
                    "left": po.left + "px",
                    "top": po.top + "px"
                });
            }
        });
        
        if(ui.core.isFunction(button.handler)) {
            button.elem.click(function(e) {
                button.handler.call(that, button);
            });
        }
    }
});

$.fn.extendButton = function(option) {
    if (this.length == 0) {
        return null;
    }
    return ui.ctrls.ExtendButton(option, this);
};


})(jQuery, ui);

// Source: ui/control/tools/filter-tool.js

(function($, ui) {
/* 内容过滤选择器 */
var prefix = "filter_tool";
var filterCount = 0;

ui.define("ui.ctrls.FilterTool", {
    _defineOption: function () {
        //data item is { text: "", value: "" }
        return {
            data: [],
            defaultIndex: 0,
            filterCss: null
        };
    },
    _defineEvents: function () {
        return ["selected", "deselected"];
    },
    _create: function () {
        var i, len, item;

        this.data = Array.isArray(this.option.data) ? this.option.data : [];
        this.filterPanel = $("<div class='filter-tools-panel'>");
        this.parent = this.element;
        this.radioName = prefix + "_" + (filterCount++);

        len = this.data.length;
        for (i = 0; i < len; i++) {
            item = this.data[i];
            if (item.selected === true) {
                this.option.defaultIndex = i;
            }
            this._createTool(item, i);
        }
        if (this.option.filterCss) {
            this.filterPanel.css(this.option.filterCss);
        }
        this.filterPanel.click($.proxy(this.onClickHandler, this));
        this.parent.append(this.filterPanel);

        if (!ui.core.isNumber(this.option.defaultIndex) || this.option.defaultIndex >= len || this.option.defaultIndex < 0) {
            this.option.defaultIndex = 0;
        }
        this.setIndex(this.option.defaultIndex);
    },
    _createTool: function (item, index) {
        if (!ui.core.isPlainObject(item)) {
            return;
        }

        item.index = index;
        var label = $("<label class='filter-tools-item' />"),
            radio = $("<input type='radio' name='" + this.radioName + "'/>"),
            span = $("<span />");
        label.append(radio).append(span);

        if (index === 0) {
            label.addClass("filter-tools-item-first");
        }
        label.addClass("font-highlight").addClass("border-highlight");
        radio.prop("value", item.value || "");
        span.text(item.text || "tool" + index);
        label.data("dataItem", item);

        this.filterPanel.append(label);
    },
    onClickHandler: function (e) {
        var elem = $(e.target);
        var nodeName;
        while ((nodeName = elem.nodeName()) !== "LABEL") {
            if (nodeName === "DIV") {
                return;
            }
            elem = elem.parent();
        }
        this.selectFilterItem(elem);
    },
    selectFilterItem: function (label) {
        var item = label.data("dataItem"),
            currentItem;
        if (this.current) {
            currentItem = this.current.data("dataItem");
            if (item.index == currentItem.index) {
                return;
            }

            this.current
                .addClass("font-highlight")
                .removeClass("background-highlight");
            this.fire("deselected", currentItem);
        }

        this.current = label;
        label.find("input").prop("checked", true);
        this.current
            .addClass("background-highlight")
            .removeClass("font-highlight");

        this.fire("selected", item);
    },
    _getIndexByValue: function(value) {
        var index = -1;
        if(!this.data) {
            return index;
        }
        var i = this.data.length - 1;
        for (; i >= 0; i--) {
            if (this.data[i].value === value) {
                index = i;
                break;
            }
        }
        return index;
    },
    setIndex: function (index) {
        if (!this.data) {
            return;
        }
        if (!$.isNumeric(index)) {
            index = 0;
        }
        var label;
        if (index >= 0 && index < this.data.length) {
            label = $(this.filterPanel.children()[index]);
            this.selectFilterItem(label);
        }
    },
    setValue: function(value) {
        var index = this._getIndexByValue(value);
        if(index > -1) {
            this.setIndex(index);
        }
    },
    hideIndex: function(index) {
        this._setDisplayIndex(index, true);
    },
    hideValue: function(value) {
        var index = this._getIndexByValue(value);
        if(index > -1) {
            this.hideIndex(index);
        }
    },
    showIndex: function(index) {
        this._setDisplayIndex(index, false);
    },
    showValue: function(value) {
        var index = this._getIndexByValue(value);
        if(index > -1) {
            this.showIndex(index);
        }
    },
    _setDisplayIndex: function(index, isHide) {
        if (!this.data) {
            return;
        }
        if (!ui.core.isNumber(index)) {
            index = 0;
        }
        var label;
        if (index >= 0 && index < this.data.length) {
            label = $(this.filterPanel.children()[index]);
            if(isHide) {
                label.addClass("filter-tools-item-hide");
            } else {
                label.removeClass("filter-tools-item-hide");
            }
            this._updateFirstClass();
        }  
    },
    _updateFirstClass: function() {
        var children = this.filterPanel.children();
        var i = 0,
            len = children.length,
            label,
            firstLabel;
        for(; i < len; i++) {
            label = $(children[i]);
            if(label.hasClass("filter-tools-item-hide")) {
                continue;
            }
            if(!firstLabel) {
                firstLabel = label;
            } else {
                label.removeClass("filter-tools-item-first");
            }
        }
        if(firstLabel) {
            firstLabel.addClass("filter-tools-item-first");
        }
    },
    getCurrent: function () {
        var currentItem = null;
        if (this.current) {
            currentItem = this.current.data("dataItem");
        }
        return currentItem;
    }
});
$.fn.createFilterTools = function (option) {
    if (this.length === 0) {
        return null;
    }
    return ui.ctrls.FilterTool(option, this);
};


})(jQuery, ui);

// Source: ui/control/tools/hover-view.js

(function($, ui) {
/* 悬停视图 */
var guid = 1;
ui.define("ui.ctrls.HoverView", {
    buffer: 30,
    _defineOption: function () {
        return {
            width: 160,
            height: 160
        };
    },
    _defineEvents: function () {
        return ["showing", "showed", "hiding", "hided"];
    },
    _create: function () {
        this.viewPanel = $("<div class='hover-view-panel' />");
        this.viewPanel.addClass(borderColor);
        this.viewPanel.css({
            "width": this.option.width + "px",
            "max-height": this.option.height + "px"
        });
        $(document.body).append(this.viewPanel);

        this.width = this.viewPanel.outerWidth();
        this.height = this.viewPanel.outerHeight();

        this.target = null;
        this.targetWidth;
        this.targetHeight;

        this.hasDocMousemoveEvent = false;

        this.animating = false;
        this.isShow = false;

        if (!ui.core.isNumber(this.option.width) || this.option.width <= 0) {
            this.option.width = 160;
        }
        if (!ui.core.isNumber(this.option.height) || this.option.height <= 0) {
            this.option.height = 160;
        }

        this.onDocumentMousemove = $.proxy(this.doDocumentMousemove, this);
        this.onDocumentMousemove.guid = "hoverView" + (guid++);
    },
    empty: function () {
        this.viewPanel.empty();
        return this;
    },
    append: function (elem) {
        this.viewPanel.append(elem);
        return this;
    },
    doDocumentMousemove: function (e) {
        var x = e.clientX,
            y = e.clientY;
        if (this.animating) {
            return;
        }
        var p = this.target.offset();
        var tl = {
            top: Math.floor(p.top),
            left: Math.floor(p.left)
        };
        tl.bottom = tl.top + this.targetHeight;
        tl.right = tl.left + this.targetWidth;

        p = this.viewPanel.offset();
        var pl = {
            top: Math.floor(p.top),
            left: Math.floor(p.left)
        };
        pl.bottom = pl.top + this.height;
        pl.right = pl.left + this.width;

        //差值
        var xdv = -1,
            ydv = -1,
            l, r,
            t = tl.top < pl.top ? tl.top : pl.top,
            b = tl.bottom > pl.bottom ? tl.bottom : pl.bottom;
        //判断view在左边还是右边
        if (tl.left < pl.left) {
            l = tl.left;
            r = pl.right;
        } else {
            l = pl.left;
            r = tl.right;
        }

        //判断鼠标是否在view和target之外
        if (x < l) {
            xdv = l - x;
        } else if (x > r) {
            xdv = x - r;
        }
        if (y < t) {
            ydv = t - y;
        } else if (y > b) {
            ydv = y - b;
        }

        if (xdv == -1 && ydv == -1) {
            xdv = 0;
            if (x >= tl.left && x <= tl.right) {
                if (y <= tl.top - this.buffer || y >= tl.bottom + this.buffer) {
                    ydv = this.buffer;
                }
            } else if (x >= pl.left && x <= pl.right) {
                if (y < pl.top) {
                    ydv = pl.top - y;
                } else if (y > pl.bottom) {
                    ydv = y - pl.bottom;
                }
            }
            if (ydv == -1) {
                this.viewPanel.css({
                    "opacity": 1,
                    "filter": "Alpha(opacity=100)"
                });
                return;
            }
        }

        if (xdv > this.buffer || ydv > this.buffer) {
            this.hide();
            return;
        }

        var opacity = 1.0 - ((xdv > ydv ? xdv : ydv) / this.buffer);
        if (opacity < 0.2) {
            this.hide();
            return;
        }
        this.viewPanel.css({
            "opacity": opacity,
            "filter": "Alpha(opacity=" + opacity * 100 + ")"
        });
    },
    addDocMousemove: function () {
        if (this.hasDocMousemoveEvent) {
            return;
        }
        this.hasDocMousemoveEvent = true;
        $(document).on("mousemove", this.onDocumentMousemove);
    },
    removeDocMousemove: function () {
        if (!this.hasDocMousemoveEvent) {
            return;
        }
        this.hasDocMousemoveEvent = false;
        $(document).off("mousemove", this.onDocumentMousemove);
    },
    setLocation: function () {
        ui.setLeft(this.target, this.viewPanel);
    },
    getLocation: function () {
        var location = ui.getLeftLocation(this.target, this.width, this.height);
        return location;
    },
    show: function (target) {
        var view = this;
        this.target = target;

        this.animating = true;

        var result = this.fire("showing");
        if (result === false) return;

        //update size
        this.targetWidth = this.target.outerWidth();
        this.targetHeight = this.target.outerHeight();
        this.height = this.viewPanel.outerHeight();

        this.viewPanel.stop();
        var loc = this.getLocation(),
            opacity,
            css;
        if (this.isShow) {
            css = {
                left: loc.left + "px",
                top: loc.top + "px"
            };
            opacity = parseFloat(this.viewPanel.css("opacity"));
            if (opacity < 1) {
                css["opacity"] = 1;
                css["filter"] = "Alpha(opacity=100)"
            }
        } else {
            this.viewPanel.css({
                "top": loc.top + "px",
                "left": loc.left + "px",
                "opacity": 0,
                "filter": "Alpha(opacity=0)"
            });
            css = {
                "opacity": 1,
                "filter": "Alpha(opacity=100)"
            };
        }
        this.isShow = true;
        this.viewPanel.css("display", "block");
        var func = function () {
            view.animating = false;
            view.addDocMousemove();
            view.fire("showed");
        };
        this.viewPanel.animate(css, 240, func);
    },
    hide: function (complete) {
        var view = this;

        var result = this.fire("hiding");
        if (result === false) return;

        this.viewPanel.stop();
        this.removeDocMousemove();
        var func = function () {
            view.isShow = false;
            view.viewPanel.css("display", "none");
            view.fire("hided");
        };
        var css = {
            "opacity": 0,
            "filter": "Alpha(opacity=0)"
        };
        this.viewPanel.animate(css, 200, func);
    }
});
ui.createHoverView = function (option) {
    return ui.ctrls.HoverView(option);
};
$.fn.addHoverView = function (view) {
    if (this.length === 0) {
        return null;
    }
    var that = this;
    if (view instanceof ui.ctrls.HoverView) {
        this.mouseover(function(e) {
            view.show(that);
        });
    }
};


})(jQuery, ui);

// Source: ui/control/tools/switch-button.js

(function($, ui) {
/* 开关按钮 */
ui.define("ui.ctrls.SwitchButton", {
    _defineOption: function() {
        return {
            readonly: false,
            style: null
        };
    },
    _defineEvents: function() {
        return ["changed"];
    },
    _create: function() {
        this.switchBox = $("<label class='switch-button' />");
        this.inner = $("<div class='switch-inner theme-border-color' />");
        this.thumb = $("<div class='switch-thumb' />");
        
        if(this.option.style === "lollipop") {
            this.switchBox.addClass("switch-lollipop");
            this._open = this._lollipopOpen;
            this._close = this._lollipopClose;
        } else if(this.option.style === "marshmallow") {
            this.switchBox.addClass("switch-marshmallow");
            this._open = this._lollipopOpen;
            this._close = this._lollipopClose;
        }

        this._createAnimator();
        
        this.element.wrap(this.switchBox);
        this.switchBox = this.element.parent();
        this.switchBox
            .append(this.inner)
            .append(this.thumb);
            
        this.width = this.switchBox.width();
        this.height = this.switchBox.height();
        
        var that = this;
        this.element.change(function(e) {
            that.onChange();
        });
        
        this.readonly(this.option.readonly);
        this.thumbColor = this.thumb.css("background-color");
        if(this.checked()) {
            this._open();
        }
    },
    _createAnimator: function() {
        this.animator = ui.animator({
            target: this.thumb,
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css("background-color", 
                    ui.color.overlay(this.beginColor, this.endColor, val / 100));
            }
        }).addTarget({
            target: this.thumb,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val, elem) {
                elem.css("left", val + "px");
            }
        });
        this.animator.duration = 200;
    },
    onChange: function() {
        var checked = this.element.prop("checked");
        if(this.readonly()) {
            this.element.prop("checked", !checked);
            return;
        }
        if(checked) {
            this._open();
        } else {
            this._close();
        }
        this.fire("changed");
    },
    _open: function() {
        this.animator.stop();
        this.switchBox.addClass("switch-open");
        this.inner
            .addClass("border-highlight")
            .addClass("background-highlight");
        var option = this.animator[0];
        option.beginColor = this.thumbColor;
        option.endColor = "#FFFFFF";
        option.begin = 0;
        option.end = 100;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = this.width - this.thumb.width() - 3;
        this.animator.start();
    },
    _close: function() {
        this.animator.stop();
        this.switchBox.removeClass("switch-open");
        this.inner
            .removeClass("border-highlight")
            .removeClass("background-highlight");
        var option = this.animator[0];
        option.beginColor = "#FFFFFF";
        option.endColor = this.thumbColor;
        option.begin = 0;
        option.end = 100;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = 3;
        
        this.animator.start();     
    },
    _lollipopOpen: function() {
        this.animator.stop();
        this.switchBox.addClass("switch-open");
        this.inner.addClass("background-highlight");
        this.thumb
            .addClass("border-highlight")
            .addClass("background-highlight");
        var option = this.animator[0];
        option.begin = 0;
        option.end = 0;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = this.width - this.thumb.outerWidth();
        this.animator.start();
    },
    _lollipopClose: function() {
        this.animator.stop();
        this.switchBox.removeClass("switch-open");
        this.inner.removeClass("background-highlight");
        this.thumb
            .removeClass("border-highlight")
            .removeClass("background-highlight");
        var option = this.animator[0];
        option.begin = 0;
        option.end = 0;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = 0;
        
        this.animator.start();
    },
    isOpen: function() {
        return this.switchBox.hasClass("switch-open");  
    },
    readonly: function() {
        if(arguments.length == 0) {
            return this.option.readonly;
        } else {
            this.option.readonly = !!arguments[0];
            if(this.option.readonly) {
                this.element.attr("readonly", "readonly");
            } else {
                this.element.removeAttr("readonly");
            }
        }
    },
    val: function() {
        if(arguments.length == 0) {
            return this.element.val();
        } else {
            this.element.val(arguments[0]);
        }
    },
    checked: function() {
        var checked;
        if(arguments.length == 0) {
            return this.element.prop("checked");
        } else {
            arguments[0] = !!arguments[0];
            checked = this.element.prop("checked");
            if(arguments[0] !== checked) {
                this.element.prop("checked", arguments[0]);
                this.onChange();
            } else {
                //修正checkbox和当前样式不一致的状态，可能是手动给checkbox赋值或者是reset导致
                if(checked && !this.isOpen()) {
                    this._open();
                } else if(!checked && this.isOpen()) {
                    this._close();
                }
            }
        }
    }
});
$.fn.switchButton = function(option) {
    if (this.length == 0) {
        return null;
    }
    if(this.nodeName() !== "INPUT" && this.prop("type") !== "checkbox") {
        throw new TypeError("the element is not checkbox");
    }
    return ui.ctrls.SwitchButton(option, this);
};


})(jQuery, ui);

// Source: ui/control/images/image-preview.js

(function($, ui) {
//图片预览视图
ui.define("ui.ctrls.ImagePreview", {
    _defineOption: function () {
        return {
            chooserButtonSize: 16,
            imageMargin: 10,
            //vertical | horizontal
            direction: "horizontal"
        };
    },
    _defineEvents: function () {
        return ["changing", "changed", "ready"];
    },
    _create: function () {
        this.element.addClass("image-preview");
        this.viewer = this.element.children(".image-view-panel");
        this.chooser = this.element.children(".image-preview-chooser");
        
        if(this.viewer.length == 0) {
            throw new Error("需要设置一个class为image-view-panel的元素");
        }
        if(this.chooser.length == 0) {
            throw new Error("需要设置一个class为image-preview-chooser的元素");
        }
        
        this.isHorizontal = this.option.direction === "horizontal";
        if(!ui.core.type(this.option.chooserButtonSize) || this.option.chooserButtonSize < 2) {
            this.option.chooserButtonSize = 16;
        }
        this.item = [];

        this._init();
    },
    _init: function () {
        this.chooserQueue = $("<div class='chooser-queue' />");
        this.chooserPrev = $("<a href='javascript:void(0)' class='chooser-button font-highlight-hover'></a>");
        this.chooserNext = $("<a href='javascript:void(0)' class='chooser-button font-highlight-hover'></a>");
        this.chooser.append(this.chooserPrev)
            .append(this.chooserQueue)
            .append(this.chooserNext);
        
        this.chooserPrev.click($.proxy(function(e) {
            this.beforeItems();
        }, this));
        this.chooserNext.click($.proxy(function(e) {
            this.afterItems();
        }, this));
        
        this.chooserAnimator = ui.animator({
            target: this.chooserQueue,
            ease: ui.AnimationStyle.easeFromTo
        });
        
        var buttonSize = this.option.chooserButtonSize,
            showCss = null;
        if(this.isHorizontal) {
            this.smallImageSize = this.chooser.height();
            this.chooserAnimator[0].onChange = function(val) {
                this.target.scrollLeft(val);
            };
            showCss = {
                "width": buttonSize + "px",
                "height": "100%"
            };
            this.chooserPrev
                .append("<i class='fa fa-angle-left'></i>")
                .css(showCss);
            this.chooserNext
                .append("<i class='fa fa-angle-right'></i>")
                .css(showCss)
                .css("right", "0px");
            this.isOverflow = function() {
                return this.chooserQueue[0].scrollWidth > this.chooserQueue.width();
            };
            this.showChooserButtons = function() {
                this.chooserPrev.css("display", "block");
                this.chooserNext.css("display", "block");
                this.chooserQueue.css({
                    "left": buttonSize + "px",
                    "width": this.chooser.width() - this.option.chooserButtonSize * 2 + "px"
                });
            };
            this.hideChooserButtons = function() {
                this.chooserPrev.css("display", "none");
                this.chooserNext.css("display", "none");
                this.chooserQueue.css({
                    "left": "0px",
                    "width": "100%"
                });
            };
        } else {
            this.smallImageSize = this.chooser.width();
            this.chooserAnimator[0].onChange = function(val) {
                this.target.scrollTop(val);
            };
            showCss = {
                "height": buttonSize + "px",
                "width": "100%",
                "line-height": buttonSize + "px"
            };
            this.chooserPrev
                .append("<i class='fa fa-angle-up'></i>")
                .css(showCss);
            this.chooserNext
                .append("<i class='fa fa-angle-down'></i>")
                .css(showCss)
                .css("bottom", "0px");
            showCss = {
                "display": "block"
            };
            this.isOverflow = function() {
                return this.chooserQueue[0].scrollHeight > this.chooserQueue.height();
            };
            this.showChooserButtons = function() {
                this.chooserPrev.css("display", "block");
                this.chooserNext.css("display", "block");
                this.chooserQueue.css({
                    "top": buttonSize + "px",
                    "height": this.chooser.height() - buttonSize * 2 + "px"
                });
            };
            this.hideChooserButtons = function() {
                this.chooserPrev.css("display", "none");
                this.chooserNext.css("display", "none");
                this.chooserQueue.css({
                    "top": "0px",
                    "height": "100%"
                });
            };
        }
        this.chooserQueue.click($.proxy(this._onClickHandler, this));
        
        this.setImages(this.option.images);
    },
    _initImages: function(images) {
        var width, 
            height,
            marginValue = 0;
        var i = 0, 
            len = images.length,
            image,
            item, img,
            css;
        height = this.smallImageSize - 4;
        width = height;

        this.imageSource = images;
        for(; i < len; i++) {
            image = images[i];
            css = this._getImageDisplay(width, height, image.width, image.height);
            item = $("<div class='small-img' />");
            item.attr("data-index", i);
            img = $("<img alt='' />");
            img.css({
                width: css.width,
                height: css.height,
                "margin-top": css.top,
                "margin-left": css.left
            });
            img.prop("src", image.src);
            item.append(img);
            this.chooserQueue.append(item);

            if(this.isHorizontal) {
                item.css("left", marginValue + "px");
                marginValue += this.option.imageMargin + item.outerWidth();
            } else {
                item.css("top", marginValue + "px");
                marginValue += this.option.imageMargin + item.outerHeight();
            }
            this.items.push(item);
        }
        
        if(this.isOverflow()) {
            this.showChooserButtons();
        } else {
            this.hideChooserButtons();
        }

        if(this.imageViewer.currentIndex >= 0) {
            this.selectItem(this.imageViewer.currentIndex);
            this.fire("changed", this.imageViewer.currentIndex);
        }
    },
    _getImageDisplay: function(displayWidth, displayHeight, imgWidth, imgHeight) {
        var width,
            height;
        var css = {
            top: "0px",
            left: "0px"
        };
        if (displayWidth > displayHeight) {
            height = displayHeight;
            width = Math.floor(imgWidth * (height / imgHeight));
            if (width > displayWidth) {
                width = displayWidth;
                height = Math.floor(imgHeight * (width / imgWidth));
                css.top = Math.floor((displayHeight - height) / 2) + "px";
            } else {
                css.left = Math.floor((displayWidth - width) / 2) + "px";
            }
        } else {
            width = displayWidth;
            height = Math.floor(imgHeight * (width / imgWidth));
            if (height > displayHeight) {
                height = displayHeight;
                width = Math.floor(imgWidth * (height / imgHeight));
                css.left = Math.floor((displayWidth - width) / 2) + "px";
            } else {
                css.top = Math.floor((displayHeight - height) / 2) + "px";
            }
        }
        css.width = width + "px";
        css.height = height + "px";
        return css;
    },
    _onClickHandler: function(e) {
        var elem = $(e.target),
            nodeName = elem.nodeName();
        if(elem.hasClass("chooser-queue")) {
            return;
        }
        if(nodeName === "IMG") {
            elem = elem.parent();
        }
        var index = parseInt(elem.attr("data-index"), 10);
        if(this.fire("changing", index) === false) {
            return;
        }
        if(this.selectItem(index) === false) {
            return;
        }
        this.imageViewer.showImage(index);
    },
    selectItem: function(index) {
        var elem = this.items[index];
        if(this.currentChooser) {
            if(this.currentChooser[0] === elem[0]) {
                return false;
            }
            this.currentChooser
                .removeClass("chooser-selected")
                .removeClass("border-highlight");
        }
        this.currentChooser = elem;
        this.currentChooser
            .addClass("chooser-selected")
            .addClass("border-highlight");
        if(this.isOverflow()) {
            this._moveChooserQueue(index);
        }
    },
    empty: function() {
        this.items = [];
        this.chooserQueue.empty();
        
        if(this.imageViewer) {
            this.imageViewer.empty();
        }
    },
    setImages: function(images) {
        if(!Array.isArray(images) || images.length == 0) {
            return;
        }
        this.empty();
        
        this.option.images = images;
        var that = this;
        if(!this.imageViewer) {
            this.imageViewer = this.viewer.imageViewer(this.option);
            this.imageViewer.ready(function(e, images) {
                that._initImages(images);
                that.fire("ready");
            });
            this.imageViewer.changed(function(e, index) {
                that.selectItem(index);
                that.fire("changed", index);
            });
        } else {
            this.imageViewer.setImages(images);
        }
    },
    _caculateScrollValue: function(fn) {
        var currentValue,
            caculateValue,
            queueSize,
            scrollLength;
        if(this.isHorizontal) {
            queueSize = this.chooserQueue.width();
            currentValue = this.chooserQueue.scrollLeft();
            scrollLength = this.chooserQueue[0].scrollWidth;
        } else {
            queueSize = this.chooserQueue.height();
            currentValue = this.chooserQueue.scrollTop();
            scrollLength = this.chooserQueue[0].scrollHeight;
        }
        
        caculateValue = fn.call(this, queueSize, currentValue);
        if(caculateValue < 0) {
            caculateValue = 0;
        } else if(caculateValue > scrollLength - queueSize) {
            caculateValue = scrollLength - queueSize;
        }
        return {
            from: currentValue,
            to: caculateValue
        };
    },
    _moveChooserQueue: function(index) {
        var scrollValue = this._caculateScrollValue(function(queueSize, currentValue) {
            var fullSize = this.smallImageSize + this.option.imageMargin,
                count = Math.floor(queueSize / fullSize),
                beforeCount = Math.floor(count / 2);
            var scrollCount = index - beforeCount;
            if(scrollCount < 0) {
                return 0;
            } else if(scrollCount + count > this.items.length - 1) {
                return this.items.length * fullSize;
            } else {
                return scrollCount * fullSize;
            }
        });
        this._setScrollValue(scrollValue);
    },
    _setScrollValue: function(scrollValue) {
        if(isNaN(scrollValue.to)) {
            return;
        }
        this.chooserAnimator.stop();
        var option = this.chooserAnimator[0];
        if(Math.abs(scrollValue.from - scrollValue.to) < this.smallImageSize) {
            option.onChange.call(option, scrollValue.to);
        } else {
            option.begin = scrollValue.from;
            option.end = scrollValue.to;
            this.chooserAnimator.start();
        }
    },
    beforeItems: function() {
        var scrollValue = this._caculateScrollValue(function(queueSize, currentValue) {
            var fullSize = this.smallImageSize + this.option.imageMargin,
                count = Math.floor(queueSize / fullSize),
                currentCount = Math.floor(currentValue / fullSize);
            return (currentCount + count * -1) * fullSize;
        });
        this._setScrollValue(scrollValue);
    },
    afterItems: function() {
        var scrollValue = this._caculateScrollValue(function(queueSize, currentValue) {
            var fullSize = this.smallImageSize + this.option.imageMargin,
                count = Math.floor(queueSize / fullSize),
                currentCount = Math.floor(currentValue / fullSize);
            return (currentCount + count) * fullSize;
        });
        this._setScrollValue(scrollValue);
    }
});

$.fn.imagePreview = function(option) {
    if(this.length == 0) {
        return;
    }
    return ui.ctrls.ImagePreview(option, this);
};


})(jQuery, ui);

// Source: ui/control/images/image-viewer.js

(function($, ui) {
//图片轮播视图
ui.define("ui.ctrls.ImageViewer", {
    _defineOption: function () {
        return {
            //是否显示切换
            hasSwitchButtom: false,
            //是否自动切换
            interval: 2000,
            //vertical | horizontal
            direction: "horizontal",
            //图片路径
            images: []
        };
    },
    _defineEvents: function () {
        return ["changed", "ready"];
    },
    _create: function () {
        if(!Array.isArray(this.option.images)) {
            this.option.images = [];
        }
        if(ui.core.isNumber(this.option.interval) || this.option.interval <= 0) {
            this.isAutoView = false
        } else {
            this.isAutoView = true;
        }
        this.stopAutoView = false;
        this.currentIndex = -1;
        this.images = [];
        
        this.isHorizontal = this.option.direction === "horizontal";
        this.animationCssItem = this.isHorizontal ? "left" : "top";

        this._init();
    },
    _init: function () {
        var that = this;
        this.element.addClass("image-view-panel");
        this.currentView = null;
        this.nextView = null;

        this._initAnimator();
        this._loadImages(this.option.images);
        
        if(this.isAutoView) {
            this.element.mouseenter(function(e) {
                that.stopAutoView = true;
                if(that._autoViewHandler) {
                    clearTimeout(that._autoViewHandler);
                }
            });
            this.element.mouseleave(function(e) {
                that.stopAutoView = false;
                that._autoViewHandler = setTimeout(function() {
                    that.next();
                }, that.option.interval);
            });
        }
    },
    _initAnimator: function() {
        var that = this;
        this.viewAnimator = ui.animator({
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css(that.animationCssItem, val + "px");
            }
        }).addTarget({
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css(that.animationCssItem, val + "px");
            }
        });
        this.viewAnimator.onEnd = function() {
            that.currentView.css("display", "none");
            that.currentView = that.nextView;
            that.nextView = null;
            
            if(that.isAutoView && !that.stopAutoView) {
                that._autoViewHandler = setTimeout(function() {
                    that.next();
                }, that.option.interval);
            }
            that.fire("changed", that.currentIndex, that.images[that.currentIndex]);
        };
        this.viewAnimator.duration = 500;
    },
    setImages: function() {
        if(arguments.length == 0) {
            return;
        }
        this.empty();
        var images = [],
            i = 0,
            len = arguments.length,
            img = null;
        for(; i < len; i++) {
            img = arguments[i];
            if(Array.isArray(img)) {
                images = images.concat(img);
            } else if(ui.core.type(img) === "string") {
                images.push(img);
            }
        }
        this._loadImages(images);
    },
    _loadImages: function(images) {
        if(images.length == 0) {
            return;
        }
        
        if(this.option.hasSwitchButtom === true) {
            this.prevBtn = $("<a href='javascript:void(0)' class='image-switch-button switch-button-prev font-highlight-hover'><i class='fa fa-angle-left'></i></a>");
            this.nextBtn = $("<a href='javascript:void(0)' class='image-switch-button switch-button-next font-highlight-hover'><i class='fa fa-angle-right'></i></a>");
            this.prevBtn.click($.proxy(function(e) {
                this.prev();
            }, this));
            this.nextBtn.click($.proxy(function(e) {
                this.next();
            }, this));
            this.element
                .append(this.prevBtn)
                .append(this.nextBtn);
        }
        
        var promises = [],
            i = 0,
            that = this;
        for(; i < images.length; i++) {
            promises.push(this._loadImage(images[i]));
        }
        Promise.all(promises).done(function(result) {
            var i = 0,
                len = result.length,
                image;
            for(; i < len; i++) {
                image = result[i];
                if(image) {
                    image.view = $("<div class='image-view' />");
                    image.view.append("<img src='" + image.src + "' alt='' />");
                    that.element.append(image.view);
                    that.images.push(image);
                }
            }
            if(that.images.length > 0) {
                that.showImage(0);
            }
            
            that.fire("ready", that.images);
        });
    },
    _loadImage: function(src) {
        if(ui.core.type(src) !== "string" || src.length == 0) {
            return;
        }
        var promise = new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function () {
                img.onload = null;
                resolve({
                    src: src,
                    width: img.width,
                    height: img.height
                });
            };
            img.onerror = function () {
                resolve(null);
            };
            img.src = src;
        });
        return promise;
    },
    _startView: function(isNext) {
        this.viewAnimator.stop();

        var width = this.element.width(),
            height = this.element.height(),
            cssValue = this.isHorizontal ? width : height,
            option;
        
        option = this.viewAnimator[0];
        option.target = this.currentView;
        option.begin = parseFloat(option.target.css(this.animationCssItem), 10);
        if(isNext) {
            option.end = -cssValue;
        } else {
            option.end = cssValue;
        }
        option = this.viewAnimator[1];
        option.target = this.nextView;
        option.begin = parseFloat(option.target.css(this.animationCssItem), 10);
        option.end = 0;
        
        this.viewAnimator.start();
    },
    _setImage: function(index, view) {
        var image = this.images[index];
        var displayWidth = this.element.width(),
            displayHeight = this.element.height();
        var img = null,
            width, height;
        view = view || this.currentView;
        img = view.children("img");
        
        if (displayWidth > displayHeight) {
            height = displayHeight;
            width = Math.floor(image.width * (height / image.height));
            if (width > displayWidth) {
                width = displayWidth;
                height = Math.floor(image.height * (width / image.width));
                img.css("top", Math.floor((displayHeight - height) / 2) + "px");
            } else {
                img.css("left", Math.floor((displayWidth - width) / 2) + "px");
            }
        } else {
            width = displayWidth;
            height = Math.floor(image.height * (width / image.width));
            if (height > displayHeight) {
                height = displayHeight;
                width = Math.floor(image.width * (height / image.height));
                img.css("left", Math.floor((displayWidth - width) / 2) + "px");
            } else {
                img.css("top", Math.floor((displayHeight - height) / 2) + "px");
            }
        }
        img.css({
            "width": width + "px",
            "height": height + "px"
        });
    },
    showImage: function(index) {
        if(this.images.length == 0) {
            return;
        }
        if(this._autoViewHandler) {
            clearTimeout(this._autoViewHandler);
        }
        
        var width = this.element.width(),
            height = this.element.height(),
            that = this,
            css = {
                "display": "block"
            },
            cssValue = this.isHorizontal ? width : height,
            flag;
        this.element.css("overflow", "hidden");
        if(this.currentIndex < 0) {
            this.currentIndex = index;
            this.currentView = this.images[this.currentIndex].view;
            this._setImage(index);
            this.currentView.css("display", "block");
            if(this.isAutoView) {
                this._autoViewHandler = setTimeout(function() {
                    that.next();
                }, this.option.interval);
            }
            return;
        }
        
        if(this.nextView) {
            this.currentView
                .css("display", "none")
                .css(this.animationCssItem, -cssValue + "px");
            this.currentView = this.nextView;
            this.currentView.css(this.animationCssItem, "0px");
        }
        if(index > this.currentIndex) {
            if(index >= this.images.length) {
                index = 0;
            }
            css[this.animationCssItem] = cssValue + "px";
            flag = true;
        } else {
            if(index < 0) {
                index = this.images.length - 1;
            }
            css[this.animationCssItem] = -cssValue + "px";
            flag = false;
        }
        this.nextView = this.images[index].view;
        this.nextView.css(css);
        this._setImage(index, this.nextView);
        this.currentIndex = index;
        this._startView(flag);
    },
    prev: function() {
        if(this.currentIndex >= 0) {
            this.showImage(this.currentIndex - 1);
        } else {
            this.showImage(0);
        }
    },
    next: function() {
        if(this.currentIndex >= 0) {
            this.showImage(this.currentIndex + 1);
        } else {
            this.showImage(0);
        }
    },
    empty: function() {
        this.images = [];
        this.currentIndex = -1;
        this.viewAnimator.stop();
        clearTimeout(this._autoViewHandler);
        
        this.element.empty();
        this.prevBtn = null;
        this.nextBtn = null;
        this.currentView = null;
        this.nextView = null;
    }
});

$.fn.imageViewer = function(option) {
    if(this.length == 0) {
        return;
    }
    return ui.ctrls.ImageViewer(option, this);
};


})(jQuery, ui);

// Source: ui/control/images/image-watcher.js

(function($, ui) {
//图片局部放大查看器
ui.define("ui.ctrls.ImageWatcher", {
    _defineOption: function () {
        return {
            position: "right",
            zoomWidth: null,
            zoomHeight: null
        };
    },
    _create: function () {
        this.borderWidth = 1;
        this.viewMargin = 10;
        
        this.option.position = this.option.position.toLowerCase();
        this.zoomWidth = this.option.zoomWidth;
        this.zoomHeight = this.option.zoomHeight;

        this.element.addClass("image-watch-panel");
        this.focusView = $("<div class='focus-view border-highlight' />");
        this.zoomView = $("<div class='zoom-view border-highlight' />");
        this.zoomImage = $("<img alt='' />");
        
        this.zoomView.append(this.zoomImage);
        this.element.append(this.focusView).append(this.zoomView);
        
        this._initImage();
        this._initZoomer();
    },
    _initImage: function() {
        this.image = $(this.element.children("img")[0]);
        if(this.image.length == 0) {
            throw new Error("元素中没有图片，无法使用图片局部查看器");
        }
        this.imageOffsetWidth = this.image.width();
        this.imageOffsetHeight = this.image.height();
        this.image.css({
            "width": "auto",
            "height": "auto"
        });
        this.imageWidth = this.image.width();
        this.imageHeight = this.image.height();
        this.image.css({
            "width": this.imageOffsetWidth + "px",
            "height": this.imageOffsetHeight + "px"
        });
        
        this.zoomImage.prop("src", this.image.prop("src"));
    },
    _initZoomer: function() {
        var that = this;
        if(ui.core.isNumber(this.option.zoomHeight)) {
            this.zoomHeight = this.element.height();
        }
        if(ui.core.isNumber(this.option.zoomWidth)) {
            this.zoomWidth = this.zoomHeight;
        }
        this.zoomView.css({
            "width": this.zoomWidth - this.borderWidth * 2 + "px",
            "height": this.zoomHeight - this.borderWidth * 2 + "px"
        });
        
        this.element
            .mouseenter(function(e) {
                that.start = true;
                that._setFocusView(e);
                that._setZoomView();
            })
            .mousemove(function(e) {
                if(!that.start) {
                    return;
                }
                that._setFocusView(e);
                that._setZoomView();
            })
            .mouseleave(function(e) {
                that.start = false;
                that.focusView.css("display", "none");
                that.zoomView.css("display", "none");
            });
    },
    _setFocusView: function(e) {
        var offset = this.image.offset(),
            offsetX = e.clientX - offset.left,
            offsetY = e.clientY - offset.top;
        var ratio = this.imageOffsetWidth / this.imageWidth,
            width = this.zoomWidth * ratio,
            height = this.zoomHeight * ratio;
        var top, left,
            parentOffset = this.element.offset(),
            marginTop = offset.top - parentOffset.top,
            marginLeft = offset.left - parentOffset.left;
        if(offsetX < 0 || offsetX > this.imageOffsetWidth || offsetY < 0 || offsetY > this.imageOffsetHeight) {
            this.focusView.css("display", "none");
            return;
        }
        left = offsetX + marginLeft - width / 2;
        if(left < marginLeft) {
            left = marginLeft;
        } else if(left + width > this.imageOffsetWidth + marginLeft) {
            left = this.imageOffsetWidth + marginLeft - width;
        }
        top = offsetY + marginTop - height / 2;
        if(top < marginTop) {
            top = marginTop;
        } else if(top + height > this.imageOffsetHeight + marginTop) {
            top = this.imageOffsetHeight + marginTop - height;
        }
        this.focusView.css({
            "display": "block",
            "width": width - this.borderWidth * 2 + "px",
            "height": height - this.borderWidth * 2 + "px",
            "top": top + "px",
            "left": left + "px"
        });
        
        this.topRatio = (top - marginTop) / this.imageOffsetHeight;
        this.leftRatio = (left - marginLeft) / this.imageOffsetWidth;
    },
    _setZoomView: function() {
        if(this.focusView.css("display") === "none") {
            this.zoomView.css("display", "none");
            return;
        }
        var top, left;
        if(this.option.position === "top") {
            left = 0;
            top = -(this.zoomHeight + this.viewMargin);
        } else if(this.option.position === "bottom") {
            left = 0;
            top = (this.element.outerHeight() + this.viewMargin);
        } else if(this.option.position === "left") {
            left = -(this.zoomWidth + this.viewMargin);
            top = 0;
        } else {
            left = (this.element.outerWidth() + this.viewMargin);
            top = 0;
        }
        
        this.zoomView.css({
            "display": "block",
            "top": top + "px",
            "left": left + "px"
        });
        this.zoomImage.css({
            "top": -(this.imageHeight * this.topRatio) + "px",
            "left": -(this.imageWidth * this.leftRatio) + "px"
        });
    }
});

$.fn.imageWatcher = function(option) {
    if(this.length == 0) {
        return;
    }
    return ui.ctrls.ImageWatcher(option, this);
};


})(jQuery, ui);

// Source: ui/control/images/image-zoomer.js

(function($, ui) {
function getLargeImageSrc(img) {
    var src = img.attr("data-large-src");
    if(!src) {
        src = img.prop("src");
    }
    return src;
}

function loadImageSize(src) {
    var promise = new Promise(function(resolve, reject) {
        var reimg = new Image();
        var size = {
            src: src,
            width: -1,
            height: -1
        };
        reimg.onload = function () {
            reimg.onload = null;
            size.width = reimg.width;
            size.height = reimg.height;
            resolve(size);
        };
        reimg.onerror = function () {
            reject(size);
        };
        reimg.src = src;
    });
    return promise;
}

//图片放大器
ui.define("ui.ctrls.ImageZoomer", {
    _defineOption: function () {
        return {
            parentContent: $(document.body),
            onNext: null,
            onPrev: null,
            hasNext: null,
            hasPrev: null,
            getLargeImageSrc: null
        };
    },
    _defineEvents: function () {
        return ["hided"];
    },
    _create: function () {
        this.parentContent = this.option.parentContent;
        this.closeButton = null;
        this.mask = null;
        this.width;
        this.height;

        this.target = null;
        this.targetTop;
        this.targetLeft;

        if($.isFunction(this.option.getLargeImageSrc)) {
            this._getLargeImageSrc = this.option.getLargeImageSrc;
        } else {
            this._getLargeImageSrc = getLargeImageSrc;
        }

        this._init();
    },
    _init: function () {
        this.imagePanel = $("<div class='show-image-panel' />");
        this.currentView = $("<div class='image-view-panel' style='display:none;' />");
        this.nextView = $("<div class='image-view-panel' style='display:none;' />");
        this.currentView.append("<img class='image-view-img' />");
        this.nextView.append("<img class='image-view-img' />");
        this.closeButton = $("<a class='close-button font-highlight-hover' href='javascript:void(0)'>×</a>");
        
        var that = this;
        this.closeButton.click(function () {
            that.hide();
        });
        
        this.imagePanel
            .append(this.currentView)
            .append(this.nextView)
            .append(this.closeButton);
        if($.isFunction(this.option.onNext)) {
            this.nextButton = $("<a class='next-button font-highlight-hover disabled-button' style='right:10px;' href='javascript:void(0)'><i class='fa fa-angle-right'></i></a>");
            this.nextButton.click(function(e) {
                that._doNextView();
            });
            this.imagePanel.append(this.nextButton);
        }
        if($.isFunction(this.option.onPrev)) {
            this.prevButton = $("<a class='prev-button font-highlight-hover disabled-button' style='left:10px;' href='javascript:void(0)'><i class='fa fa-angle-left'></i></a>");
            this.prevButton.click(function(e) {
                that._doPrevView();
            });
            this.imagePanel.append(this.prevButton);
        }
        $(document.body).append(this.imagePanel);
        
        ui.page.resize(function(e) {
            that.resizeZoomImage();
        }, ui.eventPriority.ctrlResize);
        
        if(this.prevButton || this.nextButton) {
            this.changeViewAnimator = ui.animator({
                ease: ui.AnimationStyle.easeFromTo,
                onChange: function(val) {
                    this.target.css("left", val + "px");
                }
            }).addTarget({
                ease: ui.AnimationStyle.easeFromTo,
                onChange: function(val) {
                    this.target.css("left", val + "px");
                }
            });
        }
    },
    _showOptionButtons: function() {
        if(this.prevButton) {
            this.prevButton.removeClass("disabled-button");
        }
        if(this.nextButton) {
            this.nextButton.removeClass("disabled-button");
        }
    },
    _hideOptionButtons: function() {
        if(this.prevButton) {
            this.prevButton.addClass("disabled-button");
        }
        if(this.nextButton) {
            this.nextButton.addClass("disabled-button");
        }
    },
    _updateButtonState: function() {
        if($.isFunction(this.option.hasNext)) {
            if(this.option.hasNext.call(this)) {
                this.nextButton.removeClass("disabled-button");
            } else {
                this.nextButton.addClass("disabled-button");
            }
        }
        if($.isFunction(this.option.hasPrev)) {
            if(this.option.hasPrev.call(this)) {
                this.prevButton.removeClass("disabled-button");
            } else {
                this.prevButton.addClass("disabled-button");
            }
        }
    },
    show: function (target) {
        this.target = target;
        var content = this._setImageSize();
        if (!content) {
            return;
        }
        var img = this.currentView.children("img");
        img.prop("src", this.target.prop("src"));
        img.css({
            "width": this.target.width() + "px",
            "height": this.target.height() + "px",
            "left": this.targetLeft + "px",
            "top": this.targetTop + "px"
        });
        this.imagePanel.css({
            "display": "block",
            "width": content.parentW + "px",
            "height": content.parentH + "px",
            "left": content.parentLoc.left + "px",
            "top": content.parentLoc.top + "px"
        });
        this.currentView.css("display", "block");
        var left = (content.parentW - this.width) / 2;
        var top = (content.parentH - this.height) / 2;
        
        var that = this;
        ui.mask.open({
            opacity: .8
        });
        img.animate({
            "left": left + "px",
            "top": top + "px",
            "width": this.width + "px",
            "height": this.height + "px"
        }, 240, function() {
            that._updateButtonState();
        });
    },
    hide: function () {
        var that = this,
            img = this.currentView.children("img");
        ui.mask.close();
        img.animate({
            "top": this.targetTop + "px",
            "left": this.targetLeft + "px",
            "width": this.target.width() + "px",
            "height": this.target.height() + "px"
        }, 240, function() {
            that._hideOptionButtons();
            that.imagePanel.css("display", "none");
            that.currentView.css("display", "none");
            that.fire("hided", that.target);
        });
    },
    _doNextView: function() {
        if(this.changeViewAnimator.isStarted) {
            return;
        }
        var nextImg = this.option.onNext.call(this);
        if(!nextImg) {
            return;
        }
        this._doChangeView(nextImg, function() {
            this.target = nextImg;
            this._updateButtonState();
            this._changeView(-this.parentContent.width());
        });
    },
    _doPrevView: function() {
        var prevImg;
        if(this.changeViewAnimator.isStarted) {
            return;
        }
        prevImg = this.option.onPrev.call(this);
        if(!prevImg) {
            return;
        }
        this._doChangeView(prevImg, function() {
            this.target = prevImg;
            this._updateButtonState();
            this._changeView(this.parentContent.width());
        });
    },
    _doChangeView: function(changeImg, action) {
        var largeSize = changeImg.data("LargeSize"),
            that = this;
        if(largeSize) {
            action.call(this);
        } else {
            loadImageSize(this._getLargeImageSrc(changeImg))
                .then(
                    //success
                    function(size) {
                        changeImg.data("LargeSize", size);
                        action.call(that);
                    },
                    //failed
                    function (size) {
                        action.call(that);
                    }
                );
        }
    },
    _changeView: function(changeValue) {
        var temp = this.currentView;
        this.currentView = this.nextView;
        this.nextView = temp;
        var largeSrc = this._getLargeImageSrc(this.target);

        var content = this._setImageSize();
        if (!content) {
            return;
        }
        var img = this.currentView.children("img");
        img.prop("src", largeSrc);
        img.css({
            "left": (content.parentW - this.width) / 2 + "px",
            "top": (content.parentH - this.height) / 2 + "px",
            "width": this.width + "px",
            "height": this.height + "px"
        });
        this.currentView.css("display", "block");
        this.currentView.css("left", (-changeValue) + "px");
        
        var option = this.changeViewAnimator[0];
        option.target = this.nextView;
        option.begin = 0;
        option.end = changeValue;
        
        option = this.changeViewAnimator[1];
        option.target = this.currentView;
        option.begin = -changeValue;
        option.end = 0;
        
        var that = this;
        this.changeViewAnimator.start().done(function() {
            that.nextView.css("display", "none");
        });
        
    },
    resizeZoomImage: function () {
        var content = this._setImageSize();
        if (!content) {
            return;
        }
        var left = (content.parentW - this.width) / 2;
        var top = (content.parentH - this.height) / 2;
        
        this.imagePanel.css({
            "width": content.parentW + "px",
            "height": content.parentH + "px",
        });
        var img = this.currentView.children("img");
        img.css({
            "left": left + "px",
            "top": top + "px",
            "width": this.width + "px",
            "height": this.height + "px"
        });
    },
    _getActualSize: function (img) {
        var largeSize = img.data("LargeSize");
        var mem, w, h;
        if(!largeSize) {
            //保存原来的尺寸  
            mem = { w: img.width(), h: img.height() };
            //重写
            img.css({
                "width": "auto",
                "height": "auto"
            });
            //取得现在的尺寸 
            w = img.width();
            h = img.height();
            //还原
            img.css({
                "width": mem.w + "px",
                "height": mem.h + "px"
            });
            largeSize = { width: w, height: h };
        }
        
        return largeSize;
    },
    _setImageSize: function () {
        if (!this.currentView) {
            return;
        }
        if (!this.target) {
            return;
        }
        var img = this.currentView.children("img");
        img.stop();
        
        var size = this._getActualSize(this.target);

        var parentH = this.parentContent.height();
        var parentW = this.parentContent.width();
        var imageW = size.width;
        var imageH = size.height;
        if (imageW / parentW < imageH / parentH) {
            if(imageH >= parentH) {
                this.height = parentH;
            } else {
                this.height = imageH;
            }
            this.width = Math.floor(imageW * (this.height / imageH));
        } else {
            if(imageW >= parentW) {
                this.width = parentW;
            } else {
                this.width = imageH;
            }
            this.height = Math.floor(imageH * (this.width / imageW));
        }
        var loc = this.target.offset();
        var parentLoc = this.parentContent.offset();
        this.targetTop = loc.top - parentLoc.top;
        this.targetLeft = loc.left - parentLoc.left;
        var content = {
            parentW: parentW,
            parentH: parentH,
            parentLoc: parentLoc
        };
        return content;
    }
});

$.fn.addImageZoomer = function (image) {
    if (this.length == 0) {
        return;
    }
    if (image instanceof ui.ctrls.ImageZoomer) {
        this.click(function(e) {
            var target = $(e.target);
            var largeSize = target.data("LargeSize");
            if(largeSize) {
                image.show(target);
            } else {
                loadImageSize(image._getLargeImageSrc(target))
                    .then(
                        //success
                        function(size) {
                            target.data("LargeSize", size);
                            image.show(target);
                        },
                        //failed
                        function(size) {
                            image.show(target)
                        }
                    );
            }
        });
    }
};


})(jQuery, ui);
