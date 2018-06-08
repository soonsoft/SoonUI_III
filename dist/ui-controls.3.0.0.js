// Source: src/control/base/control-define.js

(function($, ui) {

// 创建命名空间
ui.ctrls = {};
function noop() {}
// 创建控件基础类
ui.define("ui.ctrls.ControlBase", {
    version: ui.version,
    i18n: function(key) {
        // TODO: 实现根据key获取对应的本地化文本
    },
    _initialize: function(option, element) {
        var events,
            prototypeOption,
            prototypeEvents;

        this.document = document;
        this.window = window;
        this.element = element || null;

        // 配置项初始化 deep copy
        if(this.constructor && this.constructor.prototype) {
            prototypeOption = this.constructor.prototype.option;
            prototypeEvents = this.constructor.prototype.events;
        }
        this.option = ui.extend(true, {}, prototypeOption, this._defineOption(), option) || {};
        // 事件初始化
        events = mergeEvents(prototypeEvents, this._defineEvents());
        if(events.length > 0) {
            this.eventDispatcher = new ui.CustomEvent(this);
            this.eventDispatcher.initEvents(events);
        }

        this._create();
        this._render();
        return this;
    },
    _defineOption: noop,
    _defineEvents: noop,
    _create: noop,
    _render: noop,
    /** 提供属性声明方法，用于创建属性 */
    defineProperty: function(propertyName, getter, setter) {
        var definePropertyFn,
            config = {};

        if(!ui.core.isString(propertyName) || propertyName.length === 0) {
            throw new TypeError("参数propertyName只能是String类型并且不能为空");
        }

        if(typeof Reflect !== "undefined" && ui.core.isFunction(Reflect.defineProperty)) {
            definePropertyFn = Reflect.defineProperty;
        } else if(ui.core.isFunction(Object.defineProperty)) {
            definePropertyFn = Object.defineProperty;
        } else {
            return;
        }

        if(ui.core.isFunction(getter)) {
            config.get = getter.bind(this);
        }
        if(ui.core.isFunction(setter)) {
            config.set = setter.bind(this);
        }

        config.enumerable = false;
        config.configurable = false;
        definePropertyFn(this, propertyName, config);
    },
    /** 默认的toString方法实现，返回类名 */
    toString: function() {
        return this.fullName;
    }
});

function mergeEvents() {
    var temp,
        events,
        i, len;

    temp = {};
    for(i = 0, len = arguments.length; i < len; i++) {
        events = arguments[i];
        if(Array.isArray(events)) {
            events.forEach(function(e) {
                if(!temp.hasOwnProperty(e)) {
                    temp[e] = true;
                }
            });
        }
    }

    return Object.keys(temp);
}

function define(name, base, prototype) {
    var index,
        constructor,
        basePrototype,
        events;

    if(!ui.core.isString(name) || name.length === 0) {
        return null;
    }

    index = name.indexOf(".");
    if(index < 0) {
        name = "ui.ctrls." + name;
    } else {
        if(name.substring(0, index) !== "ui") {
            name = "ui." + name;
        }
    }

    if(!prototype) {
        prototype = base;
        base = ui.ctrls.ControlBase;
    }

    constructor = ui.define(name, base, prototype);

    basePrototype = ui.core.isFunction(base) ? base.prototype : base;
    if(ui.core.isFunction(basePrototype._defineOption)) {
        constructor.prototype.option = ui.extend(true, {}, basePrototype.option, basePrototype._defineOption());
    }
    if(ui.core.isFunction(basePrototype._defineEvents)) {
        constructor.prototype.events = mergeEvents(basePrototype._defineEvents(), basePrototype.events);
    }

    return constructor;
}

ui.ctrls.define = define;

})(jQuery, ui);

// Source: src/control/base/dropdown-base.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/control/base/sidebar-base.js

(function($, ui) {
//侧滑面板基类
ui.ctrls.define("ui.ctrls.SidebarBase", {
    showTimeValue: 300,
    hideTimeValue: 300,
    _defineOption: function() {
        return {
            parent: null,
            width: 240
        };
    },
    _defineEvents: function () {
        return ["showing", "shown", "hiding", "hidden", "resize"];
    },
    _create: function() {
        this.parent = ui.getJQueryElement(this.option.parent);
        if(!this.parent) {
            this.parent = $(document.body);
        }

        this._showClass = "ui-sidebar-show";
        this.height = 0;
        this.width = this.option.width || 240;
        this.borderWidth = 0;
    },
    _render: function() {
        var that = this;

        this._panel = $("<aside class='ui-sidebar-panel border-highlight' />");
        this._panel.css("width", this.width + "px");
        
        this._closeButton = $("<button class='icon-button background-highlight-active' />");
        this._closeButton.append("<i class='fa fa-chevron-right'></i>");
        this._closeButton.css({
            "position": "absolute",
            "border": "none 0",
            "width": "20px",
            "height": "20px",
            "min-width": "auto",
            "top": "5px",
            "right": "5px",
            "z-index": 999,
            "background-color": "transparent"
        });
        this._closeButton.click(function(e) {
            that.hide();
        });

        if(this.element) {
            this._panel.append(this.element);
        }
        this._panel.append(this._closeButton);
        this.parent.append(this._panel);
        
        this.borderWidth += parseInt(this._panel.css("border-left-width"), 10) || 0;
        this.borderWidth += parseInt(this._panel.css("border-right-width"), 10) || 0;
        
        //进入异步调用，给resize事件绑定的时间
        setTimeout(function() {
            that.setWidth();
        });
        ui.page.resize(function() {
            that.setWidth();
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
    setWidth: function(width, resizeFire) {
        var parentWidth = this.parent.width(),
            parentHeight = this.parent.height();
        
        this.height = parentHeight;
        var sizeCss = {
            height: this.height + "px"
        };
        var right = this.width;
        if (ui.core.isNumber(width)) {
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
            if(this.fire("showing") === false) {
                return ui.PromiseEmpty;
            }

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

            this.animator.onEnd = function() {
                this.splice(1, this.length - 1);
                that.fire("shown");
            };
            return this.animator.start();
        }
        return ui.PromiseEmpty;
    },
    hide: function() {
        var op,
            that = this,
            i, len;
        if(this.isShow()) {
            if(this.fire("hiding") === false) {
                return ui.PromiseEmpty;
            }

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

            this.animator.onEnd = function() {
                this.splice(1, this.length - 1);
                op.target.css("display", "none");
                that.fire("hidden");
            };
            return this.animator.start();
        }
        return ui.PromiseEmpty;
    }
});


})(jQuery, ui);

// Source: src/control/common/column-style.js

(function($, ui) {
// column style 默认提供的GridView和ReportView的格式化器
var spanKey = "_RowspanContext",
    hoverViewKey = "_HoverView";

function noop() {}
function addZero (val) {
    return val < 10 ? "0" + val : "" + val;
}
function getMoney (symbol, content) {
    if (!symbol) {
        symbol = "";
    }
    if (!ui.core.isNumber(content))
        return null;
    return "<span>" + ui.str.moneyFormat(content, symbol) + "</span>";
}
function getDate(val) {
    return ui.date.parseJSON(val);
}

var columnFormatter,
    cellFormatter,
    cellParameterFormatter;

var progressError = new Error("column.len或width设置太小，无法绘制进度条！");

// 列头格式化器
columnFormatter = {
    /** 全选按钮 */
    checkAll: function (col) {
        var checkbox = $("<i class='fa fa-square grid-checkbox-all' />");
        checkbox.click(this.onCheckboxAllClickHandler);
        this.resetColumnStateHandlers.checkboxAllCancel = function () {
            checkbox.removeClass("fa-check-square").addClass("fa-square");
            this._checkedCount = 0;
        };
        return checkbox;
    },
    /** 列头文本 */
    columnText: function (col) {
        var span = $("<span class='table-cell-text' />"),
            value = col.text;
        if (value === undefined || value === null) {
            return null;
        }
        span.text(value);
        return span;
    },
    /** 空列 */
    empty: function (col) {
        return null;
    }
};

// 单元格格式化器
cellFormatter = {
    /** 单行文本 */
    text: function (val, col) {
        var span;
        val += "";
        if (val === "undefined" || val === "null" || val === "NaN") {
            return null;
        }
        span = $("<span class='table-cell-text' />");
        span.text(val);
        return span;
    },
    /** 空单元格 */
    empty: function (val, col) {
        return null;
    },
    /** 行号 */
    rowNumber: function (val, col, idx) {
        var span;
        if(val === "no-count") {
            return null;
        }
        span = $("<span />");
        span.text((this.pageIndex - 1) * this.pageSize + (idx + 1));
        return span;
    },
    /** 多选框 */
    check: function(val, col) {
        var checkbox = $("<i class='fa fa-square grid-checkbox' />");
        checkbox.attr("data-value", val + "");
        return checkbox;
    },
    /** 多行文本 */
    paragraph: function (val, col) {
        var p;
        val += "";
        if (val === "undefined" || val === "null" || val === "NaN") {
            return null;
        }
        p = $("<p class='table-cell-block' />");
        p.text(val);
        return p;
    },
    /** 日期 yyyy-MM-dd */
    date: function(val, col) {
        var span,
            date = getDate(val);
        if(date === null) {
            return null;
        }

        span = $("<span />");
        if(isNaN(date)) {
            span.text("无法转换");
        } else {
            span.text([date.getFullYear(), "-",
                addZero(date.getMonth() + 1), "-",
                addZero(date.getDate())].join(""));
        }
        return span;
    },
    /** 时间 HH:mm:ss */
    time: function(val, col) {
        var span,
            date = getDate(val);
        if(date === null) {
            return null;
        }

        span = $("<span />");
        if(isNaN(date)) {
            span.text("无法转换");
        } else {
            span.text([addZero(date.getHours()), ":",
                addZero(date.getMinutes()), ":",
                addZero(date.getSeconds())].join(""));
        }
        return span;
    },
    /** 日期时间 yyyy-MM-dd hh:mm:ss */
    datetime: function(val, col) {
        var span,
            date = getDate(val);
        if(date === null) {
            return null;
        }

        span = $("<span />");
        if(isNaN(date)) {
            span.text("无法转换");
        } else {
            span.text([date.getFullYear(), "-",
                addZero(date.getMonth() + 1), "-",
                addZero(date.getDate()), " ",
                addZero(date.getHours()), ":",
                addZero(date.getMinutes()), ":",
                addZero(date.getSeconds())].join(""));
        }
        return span;
    },
    /** 短时期时间，不显示秒 yyyy-MM-dd hh:mm */
    shortDatetime: function(val, col) {
        var span,
            date = getDate(val);
        if(date === null) {
            return null;
        }

        span = $("<span />");
        if(isNaN(date)) {
            span.text("无法转换");
        } else {
            span.text([date.getFullYear(), "-",
                addZero(date.getMonth() + 1), "-",
                addZero(date.getDate()), " ",
                addZero(date.getHours()), ":",
                addZero(date.getMinutes())].join(""));
        }
        return span;
    },
    /** 人民币，￥9,999.00 */
    money: function(val, col) {
        return getMoney("￥", val);
    },
    /** 手机号码，136-1151-8560 */
    cellPhone: function(val, col) {
        var span;
        if(!val) {
            return;
        }
        span = $("<span />");
        if (val.length === 11) {
            span.text(val.substring(0, 3) + "-" + val.substring(3, 7) + "-" + val.substring(7));
        } else {
            span.text(val);
        }
        return span;
    },
    /** 相同内容自动合并 */
    rowspan: function(val, col, idx, td) {
        var ctx,
            span;
        if (idx === 0) {
            ctx = col[spanKey] = {
                rowSpan: 1,
                value: val,
                td: td
            };
        } else {
            ctx = col[spanKey];
            if (ctx.value !== val) {
                ctx.rowSpan = 1;
                ctx.value = val;
                ctx.td = td;
            } else {
                ctx.rowSpan++;
                ctx.td.prop("rowSpan", ctx.rowSpan);
                td.isAnnulment = true;
                return null;
            }
        }
        return $("<span />").text(val);
    }
};

// 带参数的单元格格式化器
cellParameterFormatter = {
    /** 格式化boolean类型 */
    getBooleanFormatter: function(trueText, falseText, nullText) {
        var width = 16,
            trueWidth,
            falseWidth;
        trueText += "";
        falseText += "";
        if (arguments.length === 2) {
            nullText = "";
        }

        trueWidth = width * trueText.length || width;
        falseWidth = width * falseText.length || width;

        return function (val, col) {
            var span = $("<span />");
            if (val === true) {
                span.addClass("state-text").addClass("state-true")
                    .css("width", trueWidth + "px");
                span.text(trueText);
            } else if (val === false) {
                span.addClass("state-text").addClass("state-false")
                    .css("width", falseWidth + "px");
                span.text(falseText);
            } else {
                span.text(nullText);
            }
            return span;
        };
    },
    /** 数字小数格式化 */
    getNumberFormatter: function(decimalLen) {
        return function(val, col) {
            if(!ui.core.isNumber(val)) {
                return null;
            }
            return $("<span />").text(ui.str.numberScaleFormat(val, decimalLen));
        };
    },
    /** 其它国家货币格式化 */
    getMoneyFormatter: function(symbol) {
        return function(val, col) {
            return getMoney(symbol, col);
        };
    },
    /** 进度条格式化 */
    getProgressFormatter: function(progressWidth, totalValue) {
        var defaultWidth = 162;
        if (!ui.core.isNumber(progressWidth) || progressWidth < 60) {
            progressWidth = false;
        }
        if (!$.isNumeric(totalValue)) {
            totalValue = null;
        } else if (totalValue < 1) {
            totalValue = null;
        }
        return function(val, col, idx, td) {
            var div, progress,
                barDiv, progressDiv, percentDiv,
                barWidth, percent;

            progress = {};
            if(ui.core.isNumber(val[0])) {
                progress.value = val[0];
                progress.total = totalValue || val[1] || 0;
            } else {
                progress.value = val;
                progress.total = totalValue || 0;
            }
            if(progress.total === 0) {
                progress.total = 1;
            }
            if(!ui.core.isNumber(progress.value)) {
                progress.value = 0;
            }

            percent = progress.value / progress.total;
            if(isNaN(percent)) {
                percent = 0;
            }
            percent = ui.str.numberScaleFormat(percent * 100, 2) + "%";
            div = $("<div class='cell-progress-panel' />");
            barDiv = $("<div class='cell-progress-bar' />");
            barWidth = progressWidth;
            if(!ui.core.isNumber(barWidth)) {
                barWidth = col.len - 12;
            }
            barWidth -= 52;
            barDiv.css("width", barWidth + "px");

            progressDiv = $("<div class='cell-progress-value background-highlight' />");
            progressDiv.css("width", percent);
            barDiv.append(progressDiv);

            percentDiv = $("<div class='cell-progress-text font-highlight'/>");
            percentDiv.append("<span style='margin:0'>" + percent + "</span>");

            div.append(barDiv);
            div.append(percentDiv);
            div.append("<br clear='all' />");
            
            return div;
        };
    },
    /** 跨行合并 */
    getRowspanFormatter: function(key, createFn) {
        return function(val, col, idx, td) {
            var ctx;
            if (idx === 0) {
                ctx = col[spanKey] = {
                    rowSpan: 1,
                    value: val[key],
                    td: td
                };
            } else {
                ctx = col[spanKey];
                if (ctx.value !== val[key]) {
                    ctx.rowSpan = 1;
                    ctx.value = val[key];
                    ctx.td = td;
                } else {
                    ctx.rowSpan++;
                    ctx.td.prop("rowSpan", ctx.rowSpan);
                    td.isAnnulment = true;
                    return null;
                }
            }
            return createFn.apply(this, arguments);
        };
    },
    /** 显示图片，并具有点击放大浏览功能 */
    getImageFormatter: function(width, height, prefix, defaultSrc, fillMode) {
        var imageZoomer,
            getFn;
        if(!ui.core.isNumber(width) || width <= 0) {
            width = 120;
        }
        if(!ui.core.isNumber(height) || height <= 0) {
            height = 90;
        }
        if(!prefix) {
            prefix = "";
        } else {
            prefix += "";
        }

        getFn = function(val) {
            var img = this.target,
                cell = img.parent().parent(),
                row = cell.parent(),
                tableBody = row.parent(),
                rowCount = tableBody[0].rows.length,
                rowIndex = row[0].rowIndex + val,
                imgPanel;
            do {
                if(rowIndex < 0 || rowIndex >= rowCount) {
                    return false;
                }
                imgPanel = $(tableBody[0].rows[rowIndex].cells[cell[0].cellIndex]).children();
                img = imgPanel.children("img");
                rowIndex += val;
            } while(imgPanel.hasClass("failed-image"));
            return img;
        };

        imageZoomer = ui.ctrls.ImageZoomer({
            getNext: function() {
                return getFn.call(this, 1) || null;
            },
            getPrev: function() {
                return getFn.call(this, -1) || null;
            },
            hasNext: function() {
                return !!getFn.call(this, 1);
            },
            hasPrev: function() {
                return !!getFn.call(this, -1);
            }
        });
        return function(imageSrc, column, index, td) {
            var imagePanel,
                image;
            if(!imageSrc) {
                return "<span>暂无图片</span>";
            }
            imagePanel = $("<div class='grid-small-image' style='overflow:hidden;' />");
            image = $("<img style='cursor:crosshair;' />");
            imagePanel.css({
                "width": width + "px",
                "height": height + "px"
            });
            imagePanel.append(image);
            image
                .setImage(prefix + imageSrc, width, height, fillMode)
                .then(
                    function(result) {
                        image.addImageZoomer(imageZoomer);
                    }, 
                    function(e) {
                        var imageInfo = {
                            originalWidth: 120,
                            originalHeight: 90,
                            width: width,
                            height: height
                        };
                        image.attr("alt", "请求图片失败");
                        if(defaultSrc) {
                            image.prop("src", defaultSrc);
                            fillMode.call(imageInfo);
                            image.css({
                                "vertical-align": "top",
                                "width": imageInfo.displayWidth + "px",
                                "height": imageInfo.displayHeight + "px",
                                "margin-top": imageInfo.marginTop + "px",
                                "margin-left": imageInfo.marginLeft + "px"
                            });
                            image.addClass("default-image");
                        }
                        imagePanel.addClass("failed-image");
                    });
            return imagePanel;
        };
    },
    /** 悬停提示 */
    hoverView: function(viewWidth, viewHeight, formatViewFn) {
        if(!ui.core.isNumber(viewWidth) || viewWidth <= 0) {
            viewWidth = 160;
        }
        if(!ui.core.isNumber(viewHeight) || viewHeight <= 0) {
            viewHeight = 160;
        }
        if(!ui.core.isFunction(formatViewFn)) {
            formatViewFn = noop;
        }
        return function(val, col, idx) {
            var hoverView = col[hoverViewKey],
                anchor;
            if(!hoverView) {
                hoverView = ui.ctrls.HoverView({
                    width: viewWidth,
                    height: viewHeight
                });
                hoverView._contextCtrl = this;
                hoverView.showing(function(e) {
                    var rowData,
                        index,
                        result;
                    this.empty();
                    index = parseInt(this.target.attr("data-rowIndex"), 10);
                    rowData = this._contextCtrl.getRowData(index);
                    result = formatViewFn.call(this._contextCtrl, rowData);
                    if(result) {
                        this.append(result);
                    }
                });
                col[hoverViewKey] = hoverView;
            }

            anchor = $("<a href='javascript:void(0)' class='grid-hover-target' />");
            anchor.text(val + " ");
            anchor.addHoverView(hoverView);
            anchor.attr("data-rowIndex", idx);
            return anchor;
        };
    },
    /** 开关按钮 */
    switchButton: function(changeFn, style) {
        if(!ui.core.isFunction(changeFn)) {
            changeFn = noop;
        }
        if(!ui.core.isString(style)) {
            style = null;
        }

        return function(val, col, idx) {
            var checkbox,
                switchButton;
            
            checkbox = $("<input type='checkbox' />");
            checkbox.prop("checked", !!val);
            switchButton = checkbox.switchButton({
                thumbColor: ui.theme.currentTheme === "Light" ? "#666666" : "#888888",
                style: style
            });
            switchButton.changed(changeFn);
            checkbox.data("switchButton", switchButton);
            return switchButton.switchBox;
        };
    }
};

ui.ColumnStyle = {
    cnfn: columnFormatter,
    cfn: cellFormatter,
    cfnp: cellParameterFormatter
};


})(jQuery, ui);

// Source: src/control/common/mask.js

(function($, ui) {
//全局遮罩
ui.mask = {
    maskId: "#ui_mask_rectangle",
    isOpen: function() {
        return $(this.maskId).css("display") === "block";
    },
    open: function(target, option) {
        var mask = $(this.maskId),
            body = $(document.body),
            offset;
        if(ui.core.isPlainObject(target)) {
            option = target;
            target = null;
        }
        if(!target) {
            target = option.target;
        }
        target = ui.getJQueryElement(target);
        if(!target) {
            target = body;
        }
        if(!option) {
            option = {};
        }
        option.color = option.color || "#000000";
        option.opacity = option.opacity || .6;
        option.animate = option.animate !== false;
        if (mask.length === 0) {
            mask = $("<div class='mask-panel' />");
            mask.prop("id", this.maskId.substring(1));
            body.append(mask);
            ui.page.resize(function (e, width, height) {
                mask.css({
                    "height": height + "px",
                    "width": width + "px"
                });
            }, ui.eventPriority.ctrlResize);
            this._mask_animator = ui.animator({
                target: mask,
                onChange: function (op) {
                    this.target.css({
                        "opacity": op / 100,
                        "filter": "Alpha(opacity=" + op + ")"
                    });
                }
            });
            this._mask_animator.duration = 500;
        }
        mask.css("background-color", option.color);
        this._mask_data = {
            option: option,
            target: target
        };
        if(target.nodeName() === "BODY") {
            this._mask_data.overflow = body.css("overflow");
            if(this._mask_data.overflow !== "hidden") {
                body.css("overflow", "hidden");
            }
            mask.css({
                top: "0",
                left: "0",
                width: document.documentElement.clientWidth + "px",
                height: document.documentElement.clientHeight + "px"
            });
        } else {
            offset = target.offset();
            mask.css({
                top: offset.top + "px",
                left: offset.left + "px",
                width: target.outerWidth() + "px",
                height: target.outerHeight() + "px"
            });
        }
        
        if(option.animate) {
            mask.css({
                "display": "block",
                "opacity": "0",
                "filter": "Alpha(opacity=0)"
            });
            this._mask_animator[0].begin = 0;
            this._mask_animator[0].end = option.opacity * 100;
            this._mask_animator.start();
        } else {
            mask.css({
                "display": "block",
                "filter": "Alpha(opacity=" + (option.opacity * 100) + ")",
                "opacity": option.opacity
            });
        }
        return mask;
    },
    close: function() {
        var mask, data;

        mask = $(this.maskId);
        if (mask.length === 0) {
            return;
        }
        data = this._mask_data;
        this._mask_data = null;
        if(data.target.nodeName() === "BODY") {
            data.target.css("overflow", data.overflow);
        }
        if(data.option.animate) {
            this._mask_animator[0].begin = 60;
            this._mask_animator[0].end = 0;
            this._mask_animator.start().then(function() {
                mask.css("display", "none");
            });
        } else {
            mask.css("display", "none");
        }
    }
};

})(jQuery, ui);

// Source: src/control/common/pager.js

(function($, ui) {
//控件分页逻辑，GridView, ReportView, flowView
var pageHashPrefix = "page";
function Pager(option) {
    if(this instanceof Pager) {
        this.initialize(option);
    } else {
        return new Pager(option);
    }
}
Pager.prototype = {
    constructor: Pager,
    initialize: function(option) {
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
    },
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
                ui.page.hashchange(function(e, hash) {
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

// Source: src/control/box/dialog-box.js

(function($, ui) {
var defaultWidth = 640,
    defaultHeight = 480,
    showStyles,
    hideStyles;

showStyles = {
    up: function () {
        var clientWidth,
            clientHeight,
            option,
            that;

        that = this;
        clientHeight = document.documentElement.clientHeight;
        clientWidth = document.documentElement.clientWidth;

        option = this.animator[0];
        option.begin = clientHeight;
        option.end = (clientHeight - this.offsetHeight) / 2;
        option.onChange = function (top) {
            that.box.css("top", top + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": option.begin + "px",
            "left": (clientWidth - this.offsetWidth) / 2 + "px",
            "display": "block"
        });
    },
    down: function () {
        var clientWidth,
            clientHeight,
            option,
            that;

        that = this;
        clientHeight = document.documentElement.clientHeight;
        clientWidth = document.documentElement.clientWidth;

        option = this.animator[0];
        option.begin = -this.offsetHeight;
        option.end = (clientHeight - this.offsetHeight) / 2;
        option.onChange = function (top) {
            that.box.css("top", top + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": option.begin + "px",
            "left": (clientWidth - this.offsetWidth) / 2 + "px",
            "display": "block"
        });
    },
    left: function () {
        var clientWidth,
            clientHeight,
            option,
            that;

        that = this;
        clientHeight = document.documentElement.clientHeight;
        clientWidth = document.documentElement.clientWidth;

        option = this.animator[0];
        option.begin = -this.offsetWidth;
        option.end = (clientWidth - this.offsetWidth) / 2;
        option.onChange = function (left) {
            that.box.css("left", left + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": (clientHeight - this.offsetHeight) / 2 + "px",
            "left": option.begin + "px",
            "display": "block"
        });
    },
    right: function () {
        var clientWidth,
            clientHeight,
            option,
            that;

        that = this;
        clientHeight = document.documentElement.clientHeight;
        clientWidth = document.documentElement.clientWidth;

        option = this.animator[0];
        option.begin = clientWidth;
        option.end = (clientWidth - this.offsetWidth) / 2;
        option.onChange = function (left) {
            that.box.css("left", left + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": (clientHeight - this.offsetHeight) / 2 + "px",
            "left": option.begin + "px",
            "display": "block"
        });
    },
    fadein: function () {
        var clientWidth,
            clientHeight,
            option,
            that;

        that = this;
        clientHeight = document.documentElement.clientHeight;
        clientWidth = document.documentElement.clientWidth;

        option = this.animator[0];
        option.begin = 0;
        option.end = 100;
        option.onChange = function (opacity) {
            that.box.css("opacity", opacity / 100);
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": (clientHeight - this.offsetHeight) / 2 + "px",
            "left": (clientWidth - this.offsetWidth) / 2 + "px",
            "opacity": 0,
            "display": "block"
        });
    }
};
hideStyles = {
    up: function () {
        var option,
            that;
        
        that = this;
        option = this.animator[0];
        option.begin = parseFloat(this.box.css("top"));
        option.end = -this.offsetHeight;
        option.onChange = function (top) {
            that.box.css("top", top + "px");
        };

        this.closeMask();
        this.animator.onEnd = function () {
            that.onHidden();
        };
    },
    down: function () {
        var option,
            that;
        
        that = this;
        option = this.animator[0];
        option.begin = parseFloat(this.box.css("top"), 10);
        option.end = document.documentElement.clientHeight;
        option.onChange = function (top) {
            that.box.css("top", top + "px");
        };

        this.closeMask();
        this.animator.onEnd = function () {
            that.onHidden();
        };
    },
    left: function () {
        var option,
            that;
        
        that = this;
        option = this.animator[0];
        option.begin = parseFloat(this.box.css("left"), 10);
        option.end = -this.offsetWidth;
        option.onChange = function (left) {
            that.box.css("left", left + "px");
        };

        this.closeMask();
        this.animator.onEnd = function () {
            that.onHidden();
        };
    },
    right: function () {
        var option,
            that;
        
        that = this;
        option = this.animator[0];
        option.begin = parseFloat(this.box.css("left"), 10);
        option.end = document.documentElement.clientWidth;
        option.onChange = function (left) {
            that.box.css("left", left + "px");
        };

        this.closeMask();
        this.animator.onEnd = function () {
            that.onHidden();
        };
    },
    fadeout: function () {
        var option,
            that;
        
        that = this;
        option = this.animator[0];
        option.begin = 100;
        option.end = 0;
        option.onChange = function (opacity) {
            that.box.css("opacity", opacity / 100);
        };
        this.closeMask();
        this.animator.onEnd = function () {
            that.onHidden();
        };

        this.box.css({
            "opacity": 1,
            "display": "block"
        });
    }
};

ui.ctrls.define("ui.ctrls.DialogBox", {
    _defineOption: function() {
        return {
            // 标题 { text: String 标题文字, hasHr: false 是否显示分隔符, style: 标题样式 }
            title: "",
            // 标题栏的高度
            titleHeight: 48,
            // box显示方式
            show: "up",
            // box隐藏方式
            hide: "down",
            // box操作完成的方式
            done: "up",
            // box内容是否是一个url，可以支持iframe外链
            src: null,
            // 内容是否包含iframe
            hasIframe: false,
            // box的宽度
            width: defaultWidth,
            // box的高度
            height: defaultHeight,
            // 是否需要显示遮罩层
            maskable: true,
            // 操作按钮
            buttons: [],
            // 操作栏的高度
            operatePanelHeight: 48,
            // 是否自适应
            suitable: true,
            // 是否可以调整box大小
            resizeable: false,
            // 是否可以拖动box的位置
            draggable: true,
            // 窗体样式
            style: null,
            // 关闭按钮的样式
            closeButtonStyle: "closable-button font-highlight-hover"
        };
    },
    _defineEvents: function() {
        return ["showing", "shown", "hiding", "hidden", "resize"];
    },
    _create: function() {
        var that;
        this.box = null;
        this.mask = null;
        this.buttons = [];
        
        this.animator = ui.animator();
        this.animator.duration = 500;

        if(!ui.core.isNumber(this.option.width)) {
            this.option.width = defaultWidth;
        }
        if(!ui.core.isNumber(this.option.height)) {
            this.option.height = defaultHeight;
        }
        this.option.titleHeight = parseInt(this.option.titleHeight, 10) || 48;
        
        this.offsetWidth = this.width = this.option.width;
        this.offsetHeight = this.height = this.option.height;
        this.contentWidth = this.width;
        this.contentHeight = 0;

        that = this;
        ui.core.each("show, hide, done", function(name) {
            that[name + "Async"] = function(callback) {
                this._asyncCall(name, callback);
            };
        });
    },
    _render: function() {
        var body;

        this.box = $("<div class='ui-dialog-box border-highlight' />");
        this.titlePanel = $("<section class='ui-dialog-box-title' />");
        this.contentPanel = $("<section class='ui-dialog-box-content' />");
        this.operatePanel = null;

        this.box
            .append(this.titlePanel)
            .append(this.contentPanel);

        this._initTitle();
        this._initContent();
        this._initOperateButtons();
        this._initClosableButton();

        this.animator.addTarget({
            target: this.box,
            ease: ui.AnimationStyle.easeFromTo
        });

        body = $(document.body);
        if(this.maskable()) {
            this.mask = $("<div class='ui-dialog-box-mask' />");
            body.append(this.mask);
            this.animator.addTarget({
                target: this.mask,
                ease: ui.AnimationStyle.easeFrom
            });
        }
        body.append(this.box);

        if(this.draggable()) {
            this._initDraggable();
        }
        if(this.resizeable()) {
            this._initResizeable();
        }
        this._initSuitable();

        if(ui.core.isPlainObject(this.option.style)) {
            this.box.css(this.option.style);
        }
        this.titlePanel.css("height", this.option.titleHeight + "px");
        this.contentPanel.css({
            "height": this.contentHeight + "px",
            "top": this.option.titleHeight + "px"
        });
    },
    _initTitle: function() {
        var title = this.option.title;
        if (ui.core.isPlainObject(title)) {
            this.setTitle(title.text, title.hasHr, title.style);
        } else if (title) {
            this.setTitle(title);
        }
    },
    _initClosableButton: function() {
        var closeBtn,
            that;
        closeBtn = $("<a href='javascript:void(0)'>×</a>");
        closeBtn.attr("class", this.option.closeButtonStyle || "closable-button");

        that = this;
        closeBtn.click(function() {
            that.hide();
        });
        this.box.append(closeBtn);
    },
    _initContent: function() {
        if(this.option.src) {
            this.option.hasIframe = true;
            this.element = $("<iframe class='content-frame' frameborder='0' scrolling='auto' />");
            this.element.prop("src", this.option.src);
        }
        this.contentPanel.append(this.element);
    },
    _initOperateButtons: function() {
        var i, len;
        if(!Array.isArray(this.option.buttons)) {
            if(ui.core.isString(this.option.buttons)) {
                this.option.buttons = [this.option.buttons];
            } else {
                this.option.buttons = [];
            }
        }
        for(i = 0, len = this.option.buttons.length; i < len; i++) {
            this.addButton(this.option.buttons[i]);
        }
    },
    _initDraggable: function() {
        var option = {
            target: this.box,
            parent: $(document.body),
            hasIframe: this.hasIframe()
        };
        this.titlePanel
            .addClass("draggable-handle")
            .draggable(option);
    },
    _initResizeable: function() {
        var option;
        this.resizeHandle = $("<u class='resize-handle' />");
        this.box.append(this.resizeHandle);

        option = {
            context: this,
            target: this.box,
            handle: this.resizeHandle,
            parent: $(document.body),
            hasIframe: this.hasIframe(),
            minWidth: 320,
            minHeight: 240,
            onMoving: function(arg) {
                var op = this.option,
                    that,
                    width, 
                    height;
                that = op.context;
                width = that.offsetWidth + arg.x;
                height = that.offsetHeight + arg.y;
                if (width < option.minWidth) {
                    width = option.minWidth;
                }
                if (height < option.minHeight) {
                    height = option.minHeight;
                }
                that._setSize(width, height);
            }
        };
        this.resizer = ui.MouseDragger(option);
        this.resizer.on();
    },
    _initSuitable: function() {
        var resizeFn,
            that = this;
        if(this.suitable()) {
            resizeFn = function(e, clientWidth, clientHeight) {
                that._calculateSize(clientWidth, clientHeight);
            };
            resizeFn();
            ui.page.resize(resizeFn, ui.eventPriority.ctrlResize);
        } else {
            this._setSize(this.width, this.height, false);
        }
    },
    _calculateSize: function(parentWidth, parentHeight) {
        var newWidth,
            newHeight;
        if(!ui.core.isNumber(parentWidth)) {
            parentWidth = document.documentElement.clientWidth;
        }
        if(!ui.core.isNumber(parentHeight)) {
            parentHeight = document.documentElement.clientHeight;
        }
        newWidth = this.option.width;
        newHeight = parentHeight * 0.85;
        if(this.height > newHeight) {
            if (this.height > parentHeight) {
                newHeight = parentHeight;
            } else {
                newHeight = this.height;
            }
        }
        if (newWidth > parentWidth) {
            newWidth = parentWidth;
        }
        this.setSize(newWidth, newHeight, parentWidth, parentHeight);
    },
    _setSize: function(newWidth, newHeight, isFire) {
        var borderTop = parseInt(this.box.css("border-top-width"), 10) || 0,
            borderBottom = parseInt(this.box.css("border-bottom-width"), 10) || 0,
            borderLeft = parseInt(this.box.css("border-left-width"), 10) || 0,
            borderRight = parseInt(this.box.css("border-right-width"), 10) || 0;

        if (ui.core.isNumber(newWidth) && newWidth > 0) {
            this.offsetWidth = newWidth;
            this.width = this.offsetWidth - borderLeft - borderRight;
            this.box.css("width", this.width + "px");
        }
        if (ui.core.isNumber(newHeight) && newHeight > 0) {
            this.offsetHeight = newHeight;
            this.height = this.offsetHeight - borderTop - borderBottom;
            this.box.css("height", this.height + "px");
            this._updateContentPanelHeight();
        }
        if (isFire !== false)
            this.fire("resize");
    },
    _updateContentPanelHeight: function() {
        this.contentHeight = this.height - this.option.titleHeight - (this.operatePanel ? this.option.operatePanelHeight : 0);
        this.contentPanel.css("height", this.contentHeight + "px");
    },
    _asyncCall: function(method, callback) {
        var promise = null;
        if(ui.core.isFunction(this[method])) {
            promise = this[method].call(this);
            if (promise && ui.core.isFunction(callback)) {
                promise.then(callback);
            }
        }
    },

    // API
    /** 是否有遮罩层 */
    maskable: function() {
        return !!this.option.maskable;
    },
    /** 是否自适应显示 */
    suitable: function() {
        return !!this.option.suitable; 
    },
    /** 是否可以调整大小 */
    resizeable: function() {
        return !!this.option.resizeable;
    },
    /** 是否可以拖动 */
    draggable: function() {
        return !!this.option.draggable;
    },
    /** 内容是否包含iframe标签 */
    hasIframe: function() {
        return !!this.option.hasIframe;
    },
    /** 设置标题 */
    setTitle: function(title, hasHr, style) {
        var titleContent,
            titleInner;
        if(ui.core.isString(title)) {
            titleContent = $("<span class='title-text font-highlight' />").text(title);
        } else if (ui.core.isDomObject(title)) {
            titleContent = $(title);
        } else if (ui.core.isJQueryObject(title)) {
            titleContent = title;
        }

        this.titlePanel.empty();
        titleInner = $("<div class='title-inner-panel' />");
        titleInner.append(titleContent);
        
        if (hasHr !== false) {
            hasHr = true;
        }
        if(hasHr) {
            titleInner.append("<hr class='ui-dialog-box-spline background-highlight' />");
        }
        this.titlePanel.append(titleInner);

        if(Array.isArray(style)) {
            style.forEach((function(item) {
                this.titlePanel.addClass(item);
            }).bind(this));
        } else if(ui.core.isPlainObject(style)) {
            this.titlePanel.css(style);
        }
    },
    /** 添加操作按钮 */
    addButton: function(button) {
        button = ui.getJQueryElement(button);
        if(!button) {
            return;
        }
        if(!this.operatePanel) {
            this.operatePanel = $("<section class='ui-dialog-box-operate' />");
            this.box.append(this.operatePanel);
            this._updateContentPanelHeight();
            this.fire("resize");
        }
        this.operatePanel.append(button);
        return this;
    },
    /** 显示状态 */
    isShow: function() {
        return this.box.css("display") === "block";
    },
    /** 显示 */
    show: function(showFn) {
        if(this.animator.isStarted || this.isShow()) {
            return ui.PromiseEmpty;
        }

        if(this.fire("showing") === false) {
            return ui.PromiseEmpty;
        }
        if(!ui.core.isFunction(showFn)) {
            showFn = showStyles[this.option.show];
            if(!ui.core.isFunction(showFn)) {
                return ui.PromiseEmpty;
            }
        }
        showFn.call(this);
        return this.animator.start();
    },
    /** 取消并隐藏 */
    hide: function(hideFn) {
        if(this.animator.isStarted || !this.isShow()) {
            return ui.PromiseEmpty;
        }

        if(this.fire("hiding") === false) {
            return ui.PromiseEmpty;
        }
        if(!ui.core.isFunction(hideFn)) {
            hideFn = hideStyles[this.option.hide];
            if(!ui.core.isFunction(hideFn)) {
                return ui.PromiseEmpty;
            }
        }
        hideFn.call(this);
        return this.animator.start();
    },
    /** 完成并隐藏 */
    done: function(doneFn) {
        if(!ui.core.isFunction(doneFn)) {
            doneFn = hideStyles[this.option.done];
            if(!ui.core.isFunction(doneFn)) {
                return ui.PromiseEmpty;
            }
        }
        return this.hide(doneFn);
    },
    /** 显示结束后处理函数，显示动画用 */
    onShown: function() {
        this.fire("shown");
    },
    /** 隐藏结束后处理函数，隐藏动画用 */
    onHidden: function() {
        this.box.css("display", "none");
        if (this.maskable()) {
            $(document.body).css("overflow", this._oldBodyOverflow);
            this.mask.css("display", "none");
        }
        this.fire("hidden");
    },
    /** 显示遮罩层，显示动画用 */
    openMask: function() {
        var body = $(document.body),
            option;
        if (this.maskable()) {
            this._oldBodyOverflow = body.css("overflow");
            body.css("overflow", "hide");
            this.mask.css({
                "display": "block",
                "opacity": 0,
                "height": document.documentElement.clientHeight + "px"
            });

            option = this.animator[1];
            option.begin = 0;
            option.end = 70;
            option.onChange = function (op) {
                this.target.css("opacity", op / 100);
            };
        }
    },
    /** 隐藏遮罩层，隐藏动画用 */
    closeMask: function() {
        var option;
        if (this.maskable()) {
            option = this.animator[1];
            option.begin = 70;
            option.end = 0;
            option.onChange = function (op) {
                this.target.css("opacity", op / 100);
            };
        }
    },
    /** 设置大小并居中显示 */
    setSize: function(newWidth, newHeight, parentWidth, parentHeight) {
        if(!ui.core.isNumber(parentWidth)) {
            parentWidth = document.documentElement.clientWidth;
        }
        if(!ui.core.isNumber(parentHeight)) {
            parentHeight = document.documentElement.clientHeight;
        }
        this._setSize(newWidth, newHeight);
        this.box.css({
            "top": (parentHeight - this.offsetHeight) / 2 + "px",
            "left": (parentWidth - this.offsetWidth) / 2 + "px"
        });
        if (this.maskable()) {
            this.mask.css("height", parentHeight + "px");
        }
    }
});

$.fn.dialogBox = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.DialogBox(option, this);
};

/** 添加显示动画样式 */
ui.ctrls.DialogBox.setShowStyle = function(name, fn) {
    if(ui.core.isString(name) && name.length > 0) {
        if(ui.core.isFunction(fn)) {
            showStyles[name] = fn;
        }
    }
};
/** 添加隐藏动画样式 */
ui.ctrls.DialogBox.setHideStyle = function(name, fn) {
    if(ui.core.isString(name) && name.length > 0) {
        if(ui.core.isFunction(fn)) {
            hideStyles[name] = fn;
        }
    }
};


})(jQuery, ui);

// Source: src/control/box/loading-box.js

(function($, ui) {
// 加载提示框
var loadingBox,
    loadingClass = "c_dotsPlaying";
function LoadingBox(option) {
    if(this instanceof LoadingBox) {
        this.initialize(option);
    } else {
        return new LoadingBox(option);
    }
}
LoadingBox.prototype = {
    constructor: LoadingBox,
    initialize: function(option) {
        if(!option) {
            option = {};
        }
        this.delay = option.delay;
        if(ui.core.type(this.delay) !== "number" || this.delay < 0) {
            this.delay = 1000;
        }
        this.timeoutHandle = null;
        this.isOpening = false;
        this.box = null;
        this.openCount = 0;
    },
    getBox: function() {
        if(!this.box) {
            this.box = $("#loadingElement");
        }
        return this.box;
    },
    isShow: function() {
        return this.getBox().css("display") === "block";
    },
    show: function() {
        var that;
        if(this.isOpening || this.isShow()) {
            this.openCount++;
            return;
        }
        this.isOpening = true;
        that = this;
        this.timeoutHandle = setTimeout(function() {
            that.timeoutHandle = null;
            that._doShow();
        }, this.delay);
    },
    _doShow: function() {
        this.getBox();
        this.box
            .addClass(loadingClass)
            .css("display", "block");
    },
    hide: function() {
        if(this.openCount > 0) {
            this.openCount--;
            return;
        }
        this.isOpening = false;
        if(this.timeoutHandle) {
            clearTimeout(this.timeoutHandle);
            return;
        }
        this.getBox();
        this.box
            .removeClass(loadingClass)
            .css("display", "none");
    }
};
loadingBox = LoadingBox();
ui.loadingShow = function() {
    loadingBox.show();
};
ui.loadingHide = function() {
    loadingBox.hide();
};


})(jQuery, ui);

// Source: src/control/box/message-box.js

(function($, ui) {
// MessageBox
var MessageType = {
        message: 0,
        warn: 1,
        error: 3,
        success: 4,
        failed: 5
    },
    defaultWaitSeconds = 5,
    messagebox;

function MessageBox() {
    if(this instanceof MessageBox) {
        this.initialize();
    } else {
        return new MessageBox();
    }
}
MessageBox.prototype = {
    constructor: MessageBox,
    initialize: function() {
        this.box = null;
        this.type = MessageType;
        this.isStartHide = false;
        this.boxAnimator = null;
        this.width = 322;
        this.top = 88;
    },
    _initAnimator: function() {
        this.boxAnimator = ui.animator({
            target: this.box,
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css("left", val + "px");
            }
        });
        this.boxAnimator.duration = 200;
    },
    getIcon: function(type) {
        if(type === MessageType.warn) {
            return "mb-warn fa fa-exclamation-triangle";
        } else if(type === MessageType.error) {
            return "mb-error fa fa-times-circle";
        } else if(type === MessageType.success) {
            return "mb-success fa fa-check-circle-o";
        } else if(type === MessageType.failed) {
            return "mb-failed fa fa-times-circle-o";
        } else {
            return "mb-message fa fa-commenting";
        }
    },
    getBox: function () {
        var clientWidth,
            clientHeight;
        if (!this.box) {
            clientWidth = document.documentElement.clientWidth;
            clientHeight = document.documentElement.clientHeight;
            this.box = $("<div class='ui-message-box border-highlight' />");
            this.box.css({
                "top": this.top + "px",
                "left": clientWidth + "px",
                "max-height": clientHeight - (this.top * 2) + "px"
            });
            var close = $("<a href='javascript:void(0)' class='closable-button'>×</a>");
            var that = this;
            close.click(function (e) {
                that.hide(true);
            });
            this.box.mouseenter(function (e) {
                if (that.isClosing) {
                    return;
                }
                if (that.isStartHide) {
                    that._show();
                } else {
                    clearTimeout(that.hideHandler);
                }
            });
            this.box.mouseleave(function (e) {
                that.waitSeconds(defaultWaitSeconds);
            });

            this.box.append(close);
            $(document.body).append(this.box);

            this._initAnimator();
        }
        return this.box;
    },
    isShow: function() {
        return this.getBox().css("display") === "block";
    },
    show: function (text, type) {
        var box,
            messageItem,
            htmlBuilder = [];
        
        messageItem = $("<div class='message-item' />");
        htmlBuilder.push("<i class='message-icon ", this.getIcon(type), "'></i>");
        htmlBuilder.push("<div class='message-content'>");
        if(ui.core.isFunction(text)) {
            htmlBuilder.push(text());
        } else {
            htmlBuilder.push(ui.str.htmlEncode(text + ""));
        }
        htmlBuilder.push("</div>");
        messageItem.html(htmlBuilder.join(""));

        box = this.getBox();
        if(this.isShow()) {
            box.append(messageItem);
            return;
        }
        box.children(".message-item").remove();
        box.append(messageItem);
        this._show(function () {
            messagebox.waitSeconds(defaultWaitSeconds);
        });
    },
    _show: function (completedHandler) {
        var box = this.getBox(),
            option,
            clientWidth = document.documentElement.clientWidth;
        this.isStartHide = false;

        this.boxAnimator.stop();
        option = this.boxAnimator[0];
        option.begin = parseFloat(option.target.css("left")) || clientWidth;
        option.end = clientWidth - this.width;
        option.target.css("display", "block");
        this.boxAnimator.start().then(completedHandler);
    },
    hide: function (flag) {
        var box,
            option,
            that = this,
            clientWidth = document.documentElement.clientWidth;
        if (flag) {
            this.isClosing = true;
        }
        box = this.getBox();
        this.isStartHide = true;

        this.boxAnimator.stop();
        option = this.boxAnimator[0];
        option.begin = parseFloat(option.target.css("left")) || clientWidth - this.width;
        option.end = clientWidth;
        this.boxAnimator.start().then(function() {
            box.css("display", "none");
            that.isClosing = false;
            that.isStartHide = false;
        });
    },
    waitSeconds: function (seconds) {
        var that = this;
        if (that.hideHandler)
            window.clearTimeout(that.hideHandler);
        if (isNaN(parseInt(seconds)))
            seconds = defaultWaitSeconds;
        that.hideHandler = window.setTimeout(function () {
            that.hideHandler = null;
            if (that.isStartHide === false) {
                that.hide();
            }
        }, seconds * 1000);
    }
};

// 初始化全局消息提示框
messagebox = MessageBox();
ui.page.resize(function(e) {
    var box = messagebox.getBox(),
        clientWidth = document.documentElement.clientWidth,
        clientHeight = document.documentElement.clientHeight,
        left;
    if(messagebox.isShow()) {
        left = clientWidth - messagebox.width;
    } else {
        left = clientWidth;
    }
    messagebox.waitSeconds(defaultWaitSeconds);
    box.css({
        "left": left + "px",
        "max-height": clientHeight - (messagebox.top * 2) + "px"
    });
});
function msgshow(text, type) {
    if(!type) {
        type = MessageType.message;
    }
    messagebox.show(text, type);
}
ui.messageShow = function(text) {
    msgshow(text, MessageType.message);
};
ui.warnShow = function(text) {
    msgshow(text, MessageType.warn);
};
ui.errorShow = function(text) {
    msgshow(text, MessageType.error);
};
ui.successShow = function(text) {
    msgshow(text, MessageType.success);
};
ui.failedShow = function(text) {
    msgshow(text, MessageType.failed);
};


})(jQuery, ui);

// Source: src/control/box/option-box.js

(function($, ui) {
// OptionBox
var contentTop = 40,
    buttonTop = 0,
    operatePanelHeight = 0;
ui.ctrls.define("ui.ctrls.OptionBox", ui.ctrls.SidebarBase, {
    _defineOption: function() {
        return {
            title: "",
            buttons: null
        };
    },
    _create: function() {
        this._super();
        this.contentPanel = null;
        this.contentHeight = 0;
        this.contentTop = 40;
        this.buttonTop = 0;
        this.operatePanelHeight = 0;
        this.buttons = [];

        this.opacityOption = {
            target: this.panel,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val, elem) {
                elem.css("opacity", val / 100);
            }
        };
    },
    _render: function() {
        this._super();

        this._panel.addClass("ui-option-box-panel");
        this.titlePanel = $("<section class='ui-option-box-title' />");
        this.contentPanel = $("<section class='ui-option-box-content' />");

        this.contentPanel.append(this.element);
        this.contentHeight = this.element.height();

        this._panel
            .append(this.titlePanel)
            .append(this.contentPanel);
        this._initOperateButtons();
        this.setTitle(this.option.title);
    },
    _initOperateButtons: function() {
        var i, len;
        if(!Array.isArray(this.option.buttons)) {
            if(ui.core.isString(this.option.buttons)) {
                this.option.buttons = [this.option.buttons];
            } else {
                this.option.buttons = [];
            }
        }
        for(i = 0, len = this.option.buttons.length; i < len; i++) {
            this.addButton(this.option.buttons[i]);
        }
    },
    addButton: function(button) {
        var buttonContainer;
        button = ui.getJQueryElement(button);
        if(!button) {
            return;
        }
        this.buttons.push(button);
        if(!this.operatePanel) {
            this.operatePanel = $("<section class='ui-option-box-buttons' />");
            buttonContainer = $("<div class='ui-form' />");
            this.operatePanel.append(buttonContainer);
            this._panel.append(this.operatePanel);
            this.buttonTop = 24;
            this.operatePanelHeight = 24;
        } else {
            buttonContainer = this.operatePanel.children(".ui-form");
        }
        buttonContainer.append(button);
        return this;
    },
    setTitle: function(title) {
        this.titlePanel.empty();
        if(title) {
            if(ui.core.isString(title)) {
                title = "<span class='option-box-title-text font-highlight'>" + title + "<span>";
            }
            this.titlePanel.append(title);
        }
    },
    setWidth: function(width) {
        var contentMaxheight;

        this._super(width);
        // 调整内容的对齐方式
        contentMaxheight = this.height - this.contentTop - this.buttonTop - this.operatePanelHeight - this.buttonTop;
        this.contentPanel.css({
            "max-height": contentMaxheight + "px"
        });
        if (this.operatePanel) {
            if (contentMaxheight < this.contentHeight) {
                this.operatePanel.css("width", this.width - ui.scrollbarWidth + "px");
            } else {
                this.operatePanel.css("width", "100%");
            }
        }
    },
    show: function() {
        this.showTimeValue = 240;
        this.opacityOption.begin = 0;
        this.opacityOption.end = 100;
        this._super(this.opacityOption);
    },
    hide: function() {
        this.hideTimeValue = 240;
        this.opacityOption.begin = 100;
        this.opacityOption.end = 0;
        this._super(this.opacityOption);
    }
});


})(jQuery, ui);

// Source: src/control/select/chooser.js

(function($, ui) {

/**
 * 选择器
 */

var selectedClass = "ui-chooser-selection-item";

var sizeInfo = {
        S: 3,
        M: 5,
        L: 9
    },
    borderWidth = 2,
    defaultMargin = 0,
    defaultItemSize = 32,
    defaultSize = "M",
    minWidth = 120,
    chooserTypes;

function noop() {}
function addZero (val) {
    return val < 10 ? "0" + val : "" + val;
}
function getText(val) {
    return val + "";
}
function getList(begin, end, formatter) {
    var i, data, args;

    args = [];
    args.push(null);
    for(i = 3; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    data = [];
    for(i = begin; i <= end; i++) {
        args[0] = i;
        data.push(formatter.apply(this, args));
    }
    return data;
}
function getTimeData(hasHour, hasMinute, hasSecond) {
    var data, item;

    data = [];
    if(hasHour) {
        // 时
        item = {
            title: "时"
        };
        item.list = getList.call(this, 0, 23, addZero);
        data.push(item);
    }
    if(hasMinute) {
        // 分
        item = {
            title: "分"
        };
        item.list = getList.call(this, 0, 59, addZero);
        data.push(item);
    }
    if(hasSecond) {
        //秒
        item = {
            title: "秒"
        };
        item.list = getList.call(this, 0, 59, addZero);
        data.push(item);
    }
    return data;
}

chooserTypes = {
    hourMinute: function() {
        var data;

        data = getTimeData(true, true, false);
        this.option.spliter = ":";
        this.defaultValue = function () {
            var now = new Date();
            return [
                addZero(now.getHours()), 
                addZero(now.getMinutes())
            ];
        };
        this.getValue = this.getText = getText;
        return data;
    },
    time: function() {
        var data;

        data = getTimeData(true, true, true);
        this.option.spliter = ":";
        this.defaultValue = function () {
            var now = new Date();
            return [
                addZero(now.getHours()), 
                addZero(now.getMinutes()),
                addZero(now.getSeconds())
            ];
        };
        this.getValue = this.getText = getText;
        return data;
    },
    yearMonth: function() {
        var data, begin, end, item;
        
        data = [];
        // 年
        begin = (new Date()).getFullYear() - 49;
        end = begin + 99;
        item = {
            title: "年"
        };
        item.list = getList.call(this, begin, end, getText);
        data.push(item);
        // 月
        begin = 1;
        end = 12;
        item = {
            title: "月"
        };
        item.list = getList.call(this, begin, end, addZero);
        data.push(item);

        this.option.spliter = "-";
        this.defaultValue = function () {
            var now = new Date();
            return [
                addZero(now.getFullYear()),
                addZero(now.getMonth() + 1)
            ];
        };
        this.getValue = this.getText = getText;
        return data;
    }
};

// 动画处理
function easeTo(pos) {
    return Math.pow(pos, .25);
}
function startScroll(item) {
    var that, fps, ease,
        animationFn;

    if (item.beginAnimation) {
        item.duration = 200;
        item.startTime = (new Date()).getTime();
        return;
    }

    item.startTime = (new Date()).getTime();
    item.duration = 160;
    item.beginAnimation = true;

    that = this;
    fps = 60;
    ease = easeTo;

    animationFn = function() {
        //当前帧开始的时间
        var newTime = new Date().getTime(),
            //逝去时间
            timestamp = newTime - item.startTime,
            delta = ease(timestamp / item.duration),
            change = item.scrollEnd - item.scrollBegin,
            currVal = Math.ceil(item.scrollBegin + delta * change);
        item.target.scrollTop(currVal);
        if (item.duration <= timestamp) {
            item.target.scrollTop(item.scrollEnd);
            stopScroll.call(that, item);
            that._selectItem(item);
        }
    };

    this._deselectItem(item);
    animationFn();
    item.stopScrollHandler = setInterval(animationFn, 1000 / fps);
}
function stopScroll(item) {
    clearInterval(item.stopScrollHandler);
    item.beginAnimation = false;
}
function setScrollTop(elem, index) {
    if(index < 0) {
        index = 0;
    }
    elem.scrollTop(index * (this.option.itemSize + this.option.margin));
}

// 事件处理函数
function onFocus(e) {
    ui.hideAll(this);
    this.show();
    this._updateSelectionState();
}
function onItemClick(e) {
    var elem, nodeName,
        index, item;

    e.stopPropagation();
    elem = $(e.target);
    while((nodeName = elem.nodeName()) !== "LI") {
        if(elem.hasClass("ui-chooser-list")) {
            return;
        }
    }
    if(elem.hasClass("ui-chooser-empty-item")) {
        return;
    }
    if(elem.hasClass(selectedClass)) {
        return;
    }

    index = parseInt(elem.attr("data-index"), 10);
    item = this.scrollData[parseInt(elem.parent().parent().attr("data-index"), 10)];
    this._chooseItem(item, index);
}
function onMousewheel(e) {
    var div, index, item, 
        val, change, direction;
    e.stopPropagation();

    div = e.data.target;
    index = parseInt(div.attr("data-index"), 10);
    item = this.scrollData[index];
    val = this.option.itemSize + this.option.margin;
    change = (-e.delta) * val;
    direction = -e.delta > 0;
    if(item.lastDirection === null) {
        item.lastDirection = direction;
    }
    if(item.lastDirection !== direction) {
        item.lastDirection = direction;
        stopScroll.call(this, item);
    }
    if(!item.beginAnimation) {
        item.scrollBegin = div.scrollTop();
        item.scrollEnd = parseInt((item.scrollBegin + change) / val, 10) * val;
    } else {
        item.scrollBegin = div.scrollTop();
        item.scrollEnd = parseInt((item.scrollEnd + change) / val, 10) * val;
    }

    startScroll.call(this, item);
    return false; 
}

ui.ctrls.define("ui.ctrls.Chooser", ui.ctrls.DropDownBase, {
    _defineOption: function() {
        return {
            // 选择器类型，支持yearMonth, time, hourMinute，也可以自定义
            type: false,
            // 显示标题，如果数据中没有单独设置则会显示这个内容
            title: null,
            // 视图数据 [{title: 时, list: [1, 2, ...]}, ...]
            viewData: null,
            // 分隔符常用于日期格式，时间格式
            spliter: "",
            // 候选项的间隔距离
            margin: defaultMargin,
            // 候选项的显示个数 S: 3, M: 5, L: 9
            size: defaultSize,
            // 候选项的大小
            itemSize: defaultItemSize
        };
    },
    _defineEvents: function() {
        return ["changing", "changed", "cancel", "listChanged"];
    },
    _create: function() {
        this._super();

        // 存放当前的选择数据
        this.scrollData = null;
        if (sizeInfo.hasOwnProperty(this.option.size)) {
            this.size = sizeInfo[this.option.size];
        } else {
            this.size = sizeInfo[defaultSize];
        }

        if (!ui.core.isNumber(this.option.margin) || this.option.margin < 0) {
            this.option.margin = defaultMargin;
        }

        if (!ui.core.isNumber(this.option.itemSize) || this.option.itemSize <= 0) {
            this.option.itemSize = defaultItemSize;
        }

        this.width = this.element.outerWidth() - borderWidth * 2;
        if (this.width < this.itemSize + (this.margin * 2)) {
            this.width = minWidth;
        }

        this.onFocusHandler = $.proxy(onFocus, this);
        this.onItemClickHandler = $.proxy(onItemClick, this);
        this.onMousewheelHandler = $.proxy(onMousewheel, this);
    },
    _render: function() {
        this.chooserPanel = $("<div class='ui-chooser-panel border-highlight' />");
        this.chooserPanel.css("width", this.width + "px");

        this._itemTitlePanel = $("<div class='ui-chooser-title-panel' />");
        this._itemListPanel = $("<div class='ui-chooser-list-panel' />");
        this._itemListPanel.append(this._createFocusElement());
        this._createItemList(this._itemTitlePanel, this._itemListPanel);

        this.chooserPanel
            .append(this._itemTitlePanel)
            .append(this._itemListPanel);

        this._selectTextClass = "ui-select-text";
        this._showClass = "ui-chooser-show";
        this._clearClass = "ui-clear-text";
        this._clear = function () {
            this.cancelSelection();
        };
        this.wrapElement(this.element, this.chooserPanel);
        this._super({
            focus: this.onFocusHandler
        });
        this.chooserPanel.click(function (e) {
            e.stopPropagation();
        });
    },
    _createFocusElement: function() {
        var div = $("<div class='focus-choose-element' />");
        div.addClass("border-highlight");
        div.css("top", this.option.itemSize * ((this.size - 1) / 2));
        return div;
    },
    _createItemList: function(itemTitlePanel, itemListPanel) {
        var sizeData = this._fillList(itemTitlePanel, itemListPanel);
        this.chooserPanel.css("width", sizeData.width + "px");
        itemListPanel.css("height", sizeData.height + "px");
    },
    _fillList: function(itemTitlePanel, itemListPanel) {
        var sizeData, div, css, ul,
            item, i, len, tsd, isClassifiableTitle,
            tempWidth,
            surWidth,
            temp;
        
        sizeData = {
            width: 0,
            height: this.size * (this.option.itemSize + this.option.margin) + this.option.margin
        };

        if(ui.core.isString(this.option.type)) {
            if(chooserTypes.hasOwnProperty(this.option.type)) {
                this.scrollData = chooserTypes[this.option.type].call(this);
            }
        } else if(ui.core.isFunction(this.option.type)) {
            this.scrollData = this.option.type.call(this);
        }

        if(!this.scrollData) {
            this.scrollData = this.option.viewData;
        }
        if(!Array.isArray(this.scrollData) || this.scrollData.length === 0) {
            return sizeData;
        }

        len = this.scrollData.length;
        tempWidth = Math.floor(this.width / len);
        surWidth = this.width - tempWidth * len;

        //设置标题
        isClassifiableTitle = false;
        for(i = 0; i < len; i++) {
            if(this.scrollData[i].title) {
                isClassifiableTitle = true;
                break;
            }
        }
        if(!isClassifiableTitle) {
            itemTitlePanel.append("<span class='font-highlight'>" + this.option.title + "</span>");
        }

        for(i = 0; i < len; i++) {
            item = this.scrollData[i];
            if(surWidth > 0) {
                temp = 1;
                surWidth--;
            } else {
                temp = 0;
            }
            css = {
                "left": sizeData.width + "px",
                "width": (tempWidth + temp) + "px"
            };

            if(isClassifiableTitle) {
                div = $("<div class='ui-chooser-title-item font-highlight' />");
                div.css(css);
                div.text(item.title || "");
                itemTitlePanel.append(div);
            }

            div = $("<div class='ui-chooser-list' />");
            div.css(css);
            div.attr("data-index", i);

            tsd = this.scrollData[i];
            tsd.target = div;
            tsd.lastDirection = null;

            sizeData.width += tempWidth + temp + this.option.margin;

            div.mousewheel({ target: div }, this.onMousewheelHandler);
            div.click(this.onItemClickHandler);
            
            ul = this._createList(item);
            div.append(ul);
            itemListPanel.append(div);
        }
        return sizeData;
    },
    _createList: function(listItem) {
        var list, headArr, footArr,
            ul, li, i, len;

        // 计算需要附加的空元素个数
        len = this._getAttachmentCount();
        // 在头尾添加辅助元素
        list = listItem.list;
        headArr = [];
        footArr = [];
        for(i = 0; i < len; i++) {
            headArr.push(null);
            footArr.push(null);
        }
        list = headArr.concat(list, footArr);

        ul = $("<ul class='ui-chooser-list-ul' />");
        for(i = 0, len = list.length; i < len; i++) {
            li = this._createItem(list[i]);
            li.attr("data-index", i);
            ul.append(li);
        }
        li.css("margin-bottom", this.option.margin + "px");
        return ul;
    },
    _createItem: function(text) {
        var li, css;

        li = $("<li class='ui-chooser-list-li' />");
        css = {
            width: this.option.itemSize + "px",
            height: this.option.itemSize + "px"
        };
        li.addClass("ui-chooser-item");
        if (text) {
            li.text(this.getText(text));
        } else {
            li.addClass("ui-chooser-empty-item");
        }
        return li;
    },
    _getAttachmentCount: function() {
        return Math.floor((this.size - 1) / 2);
    },
    _getIndexes: function(fn) {
        var attachmentCount,
            indexes,
            i, len, item, index;
        
        attachmentCount = this._getAttachmentCount();
        indexes = [];
        if(!ui.core.isFunction(fn)) {
            fn = noop;
        }
        for(i = 0, len = this.scrollData.length; i < len; i++) {
            item = this.scrollData[i];
            if(item._current) {
                index = parseInt(item._current.attr("data-index"), 10);
                index -= attachmentCount;
                indexes.push(index);
                fn.call(this, item.list[index]);
            } else {
                indexes.push(-1);
                fn.call(this, null);
            }
        }
        return indexes;
    },
    _getValues: function() {
        var values,
            indexes;
        
        values = [];
        indexes = this._getIndexes(function(item) {
            if(item) {
                values.push(this.getValue(item));
            } else {
                values.push("");
            }
        });

        return {
            values: values,
            indexes: indexes
        };
    },
    _setValues: function(values) {
        var i, j, len, 
            item, indexArray;

        if(!Array.isArray(values)) {
            return;
        }

        indexArray = [];
        for (i = 0; i < values.length; i++) {
            item = this.scrollData[i];
            if (!item) {
                continue;
            }
            indexArray[i] = 0;
            for (j = 0, len = item.list.length; j < len; j++) {
                if (this.getValue(item.list[j]) === values[i]) {
                    indexArray[i] = j;
                    break;
                }
            }
        }
        this._setSelectionState(indexArray);
    },
    _setSelectionState: function(indexArray) {
        var item, index, i, len;
        
        if (indexArray.length != this.scrollData.length) {
            return;
        }
        for (i = 0, len = indexArray.length; i < len; i++) {
            index = indexArray[i];
            item = this.scrollData[i];
            this._deselectItem(item);
            setScrollTop.call(this, item.target, index);
            this._selectItem(item);
        }
    },
    _updateSelectionState: function() {
        var i, indexArray;

        indexArray = this._getIndexes();
        for(i = indexArray.length - 1; i >= 0; i--) {
            if(indexArray[i] === -1) {
                indexArray.splice(i, 1);
            }
        }
        if (indexArray.length > 0) {
            this._setSelectionState(indexArray);
        } else if (ui.core.isFunction(this.defaultValue)) {
            this._setValues(this.defaultValue());
        } else {
            indexArray = [];
            for (i = 0; i < this.scrollData.length; i++) {
                indexArray.push(0);
            }
            this._setSelectionState(indexArray);
        }
    },
    _chooseItem: function(item, index) {
        if(item.beginAnimation) {
            stopScroll.call(this, item);
        }
        index -= this._getAttachmentCount();
        item.scrollBegin = item.target.scrollTop();
        item.scrollEnd = index * (this.option.itemSize + this.option.margin);
        startScroll.call(this, item);
    },
    _selectItem: function(item) {
        var ul,
            scrollTop,
            index, i, len,
            that,
            eventData;

        for (i = 0, len = this.scrollData.length; i < len; i++) {
            if (this.scrollData[i].beginAnimation) {
                return;
            }
        }
        
        ul = item.target.find("ul");
        scrollTop = item.target.scrollTop();
        index = parseInt(scrollTop / (this.option.itemSize + this.option.margin), 10);

        eventData = {
            listItem: item,
            itemIndex: index 
        };
        this.fire("listChanged", eventData);

        item._current = $(ul.children()[index + this._getAttachmentCount()]);
        item._current
            .addClass(selectedClass)
            .addClass("font-highlight");

        eventData = this._getValues();
        eventData.text = "";
        if(Array.isArray(eventData.values)) {
            that = this;
            eventData.text = eventData.values.map(function(item) {
                return that.getText(item);
            }).join(this.option.spliter);
        }

        if (this.fire("changing", eventData) === false) {
            return;
        }

        this._selectedItems = eventData.indexes;
        this.fire("changed", eventData);
    },
    _deselectItem: function(item) {
        if(item._current) {
            item._current
                .removeClass(selectedClass)
                .removeClass("font-highlight");
        }
    },
    /** 获取当前选中项 */
    getSelection: function() {
        var selectionItem,
            values = [],
            i;
        selectionItem = this._getValues();
        for(i = 0; i < selectionItem.indexes.length; i++) {
            if(selectionItem.indexes[i] === -1) {
                values.push(null);
            } else {
                values.push(selectionItem.values[i]);
            }
        }
        return values;
    },
    /** 设置选中项 */
    setSelection: function(values) {
        this._setValues(values);
    },
    /** 清除选择 */
    cancelSelection: function(isFire) {
        this.scrollData.forEach(function(item) {
            item._current = null;
        });
        if(isFire !== false) {
            this.fire("cancel");
        }
    }
});

// 扩展选择器类型
ui.ctrls.Chooser.extendType = function(type, fn) {
    if(!ui.core.isFunction(fn)) {
        return;
    }
    if(ui.core.isString(type) && !chooserTypes.hasOwnProperty(type)) {
        chooserTypes[type] = fn;
    }
};

$.fn.chooser = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Chooser(option, this);
};


})(jQuery, ui);

// Source: src/control/select/color-picker.js

(function($, ui) {

/**
 * Farbtastic Color Picker 1.2
 * © 2008 Steven Wittens
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
 */

function farbtastic(container, callback) {
    // Store farbtastic object
    var fb = this;

    //events
    fb.eventDispatcher = new ui.CustomEvent(fb);
    fb.eventDispatcher.initEvents(["changed"]);

    // Insert markup
    $(container).html('<div class="farbtastic"><div class="color"></div><div class="wheel"></div><div class="overlay"></div><div class="h-marker marker"></div><div class="sl-marker marker"></div></div>');
    var e = $('.farbtastic', container);
    fb.wheel = $('.wheel', container).get(0);
    // Dimensions
    fb.radius = 84;
    fb.square = 100;
    fb.width = 194;

    // Fix background PNGs in IE6
    if (navigator.appVersion.match(/MSIE [0-6]\./)) {
        $('*', e).each(function () {
            if (this.currentStyle.backgroundImage != 'none') {
                var image = this.currentStyle.backgroundImage;
                image = this.currentStyle.backgroundImage.substring(5, image.length - 2);
                $(this).css({
                    'backgroundImage': 'none',
                    'filter': "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, sizingMethod=crop, src='" + image + "')"
                });
            }
        });
    }

    /**
     * Link to the given element(s) or callback.
     */
    fb.linkTo = function (callback) {
        // Unbind previous nodes
        if (typeof fb.callback == 'object') {
            $(fb.callback).unbind('keyup', fb.updateValue);
        }

        // Reset color
        fb.color = null;

        // Bind callback or elements
        if (typeof callback == 'function') {
            fb.callback = callback;
        }
        else if (typeof callback == 'object' || typeof callback == 'string') {
            fb.callback = $(callback);
            fb.callback.bind('keyup', fb.updateValue);
            if (fb.callback.get(0).value) {
                fb.setColor(fb.callback.get(0).value);
            }
        }
        return this;
    };
    fb.updateValue = function (event) {
        if (this.value && this.value != fb.color) {
            fb.setColor(this.value);
        }
    };

    /**
     * Change color with HTML syntax #123456
     */
    fb.setColor = function (color) {
        var unpack = fb.unpack(color);
        if (fb.color != color && unpack) {
            fb.color = color;
            fb.rgb = unpack;
            fb.hsl = fb.RGBToHSL(fb.rgb);
            fb.updateDisplay();
        }
        return this;
    };

    /**
     * Change color with HSL triplet [0..1, 0..1, 0..1]
     */
    fb.setHSL = function (hsl) {
        fb.hsl = hsl;
        fb.rgb = fb.HSLToRGB(hsl);
        fb.color = fb.pack(fb.rgb);
        fb.updateDisplay();
        return this;
    };

    /////////////////////////////////////////////////////

    /**
     * Retrieve the coordinates of the given event relative to the center
     * of the widget.
     */
    fb.widgetCoords = function (event) {
        var x, y;
        var el = event.target || event.srcElement;
        var reference = fb.wheel;
        var pos, offset;

        if (typeof event.offsetX != 'undefined') {
            // Use offset coordinates and find common offsetParent
            pos = { x: event.offsetX, y: event.offsetY };

            // Send the coordinates upwards through the offsetParent chain.
            var e = el;
            while (e) {
                e.mouseX = pos.x;
                e.mouseY = pos.y;
                pos.x += e.offsetLeft;
                pos.y += e.offsetTop;
                e = e.offsetParent;
            }

            // Look for the coordinates starting from the wheel widget.
            e = reference;
            offset = { x: 0, y: 0 };
            while (e) {
                if (typeof e.mouseX != 'undefined') {
                    x = e.mouseX - offset.x;
                    y = e.mouseY - offset.y;
                    break;
                }
                offset.x += e.offsetLeft;
                offset.y += e.offsetTop;
                e = e.offsetParent;
            }

            // Reset stored coordinates
            e = el;
            while (e) {
                e.mouseX = undefined;
                e.mouseY = undefined;
                e = e.offsetParent;
            }
        } else {
            // Use absolute coordinates
            pos = fb.absolutePosition(reference);
            x = (event.pageX || 0 * (event.clientX + $('html').get(0).scrollLeft)) - pos.x;
            y = (event.pageY || 0 * (event.clientY + $('html').get(0).scrollTop)) - pos.y;
        }
        // Subtract distance to middle
        return { x: x - fb.width / 2, y: y - fb.width / 2 };
    };

    /**
     * Mousedown handler
     */
    fb.mousedown = function (event) {
        // Capture mouse
        if (!document.dragging) {
            $(document).bind('mousemove', fb.mousemove).bind('mouseup', fb.mouseup);
            document.dragging = true;
        }

        // Check which area is being dragged
        var pos = fb.widgetCoords(event);
        fb.circleDrag = Math.max(Math.abs(pos.x), Math.abs(pos.y)) * 2 > fb.square;

        // Process
        fb.mousemove(event);
        return false;
    };

    /**
     * Mousemove handler
     */
    fb.mousemove = function (event) {
        // Get coordinates relative to color picker center
        var pos = fb.widgetCoords(event);

        // Set new HSL parameters
        if (fb.circleDrag) {
            var hue = Math.atan2(pos.x, -pos.y) / 6.28;
            if (hue < 0) hue += 1;
            fb.setHSL([hue, fb.hsl[1], fb.hsl[2]]);
        }
        else {
            var sat = Math.max(0, Math.min(1, -(pos.x / fb.square) + .5));
            var lum = Math.max(0, Math.min(1, -(pos.y / fb.square) + .5));
            fb.setHSL([fb.hsl[0], sat, lum]);
        }
        return false;
    };

    /**
     * Mouseup handler
     */
    fb.mouseup = function () {
        // Uncapture mouse
        $(document).unbind('mousemove', fb.mousemove);
        $(document).unbind('mouseup', fb.mouseup);
        document.dragging = false;
    };

    /**
     * Update the markers and styles
     */
    fb.updateDisplay = function () {
        // Markers
        var angle = fb.hsl[0] * 6.28;
        $('.h-marker', e).css({
            left: Math.round(Math.sin(angle) * fb.radius + fb.width / 2) + 'px',
            top: Math.round(-Math.cos(angle) * fb.radius + fb.width / 2) + 'px'
        });

        $('.sl-marker', e).css({
            left: Math.round(fb.square * (.5 - fb.hsl[1]) + fb.width / 2) + 'px',
            top: Math.round(fb.square * (.5 - fb.hsl[2]) + fb.width / 2) + 'px'
        });

        // Saturation/Luminance gradient
        $('.color', e).css('backgroundColor', fb.pack(fb.HSLToRGB([fb.hsl[0], 1, 0.5])));

        // Linked elements or callback
        if (typeof fb.callback == 'object') {
            // Set background/foreground color
            $(fb.callback).css({
                backgroundColor: fb.color,
                color: fb.hsl[2] > 0.5 ? '#000' : '#fff'
            });

            // Change linked value
            $(fb.callback).each(function () {
                if (this.value && this.value != fb.color) {
                    this.value = fb.color;
                }
            });
        }
        else if (typeof fb.callback == 'function') {
            fb.callback.call(fb, fb.color);
        }

        this.fire("changed", fb.color);
    };

    /**
     * Get absolute position of element
     */
    fb.absolutePosition = function (el) {
        var r = { x: el.offsetLeft, y: el.offsetTop };
        // Resolve relative to offsetParent
        if (el.offsetParent) {
            var tmp = fb.absolutePosition(el.offsetParent);
            r.x += tmp.x;
            r.y += tmp.y;
        }
        return r;
    };

    /* Various color utility functions */
    fb.pack = function (rgb) {
        var r = Math.round(rgb[0] * 255);
        var g = Math.round(rgb[1] * 255);
        var b = Math.round(rgb[2] * 255);
        return '#' + (r < 16 ? '0' : '') + r.toString(16) +
                (g < 16 ? '0' : '') + g.toString(16) +
                (b < 16 ? '0' : '') + b.toString(16);
    };

    fb.unpack = function (color) {
        if (color.length == 7) {
            return [parseInt('0x' + color.substring(1, 3)) / 255,
                parseInt('0x' + color.substring(3, 5)) / 255,
                parseInt('0x' + color.substring(5, 7)) / 255];
        } else if (color.length == 4) {
            return [parseInt('0x' + color.substring(1, 2)) / 15,
                parseInt('0x' + color.substring(2, 3)) / 15,
                parseInt('0x' + color.substring(3, 4)) / 15];
        }
    };

    fb.HSLToRGB = function (hsl) {
        var m1, m2;
        var h = hsl[0], s = hsl[1], l = hsl[2];
        m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
        m1 = l * 2 - m2;
        return [this.hueToRGB(m1, m2, h + 0.33333),
            this.hueToRGB(m1, m2, h),
            this.hueToRGB(m1, m2, h - 0.33333)];
    };

    fb.hueToRGB = function (m1, m2, h) {
        h = (h < 0) ? h + 1 : ((h > 1) ? h - 1 : h);
        if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
        if (h * 2 < 1) return m2;
        if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
        return m1;
    };

    fb.RGBToHSL = function (rgb) {
        var min, max, delta, h, s, l;
        var r = rgb[0], g = rgb[1], b = rgb[2];
        min = Math.min(r, Math.min(g, b));
        max = Math.max(r, Math.max(g, b));
        delta = max - min;
        l = (min + max) / 2;
        s = 0;
        if (l > 0 && l < 1) {
            s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
        }
        h = 0;
        if (delta > 0) {
            if (max == r && max != g) h += (g - b) / delta;
            if (max == g && max != b) h += (2 + (b - r) / delta);
            if (max == b && max != r) h += (4 + (r - g) / delta);
            h /= 6;
        }
        return [h, s, l];
    };

    // Install mousedown handler (the others are set on the document on-demand)
    $('*', e).mousedown(fb.mousedown);

    // Init color
    fb.setColor('#000000');

    // Set linked elements/callback
    if (callback) {
        fb.linkTo(callback);
    }
}

function createFarbtastic(container, callback) {
    container = $(container).get(0);
    return container.farbtastic || (container.farbtastic = new farbtastic(container, callback));
}

function setColorValue(elem, color) {
    elem = ui.getJQueryElement(elem);
    if(!elem) {
        return;
    }
    if (!color) {
        // 元素原始颜色
        color = arguments[2] || elem.css("background-color");
    }
    if (!color || color === "transparent") {
        color = "#ffffff";
    } else {
        color = ui.color.parseRGB(color);
        color = ui.color.rgb2hex(color.red, color.green, color.blue).toLowerCase();
    }
    elem.val(color);
    this.setColor(color);
}

$.fn.colorPicker = function (option) {
    var colorPicker,
        colorPickerPanel,
        oldHideFn;

    if(this.length === 0) {
        return null;
    }
    
    colorPicker = ui.ctrls.DropDownBase(option, this);
    colorPickerPanel = $("<div class='ui-color-picker border-highlight' />");
    colorPickerPanel.click(function (e) {
        e.stopPropagation();
    });

    colorPicker.colorPickerPanel = colorPickerPanel;
    colorPicker._showClass = "color-picker-show";
    
    colorPicker.wrapElement(this, colorPickerPanel);
    colorPicker._render();
    oldHideFn = colorPicker.hide;

    createFarbtastic(colorPickerPanel, this);
    colorPicker.farbtastic = colorPicker.colorPickerPanel[0].farbtastic;
    colorPicker.hide = function() {
        if (document.dragging) {
            return "retain";
        }
        oldHideFn.call(this);
    };
    colorPicker.setColorValue = function() {
        setColorValue.apply(this.farbtastic, arguments);
    };
    colorPicker.setColorValue(this);

    return colorPicker;
};




})(jQuery, ui);

// Source: src/control/select/date-chooser.js

(function($, ui) {
var language,
    selectedClass = "date-selected",
    yearSelectedClass = "year-selected",
    monthSelectedClass = "month-selected",
    defaultDateFormat = "yyyy-MM-dd",
    defaultDateTimeFormat = "yyyy-MM-dd hh:mm:ss";

var formatYear = /y+/i,
    formatMonth = /M+/,
    formatDay = /d+/i,
    formatHour = /h+/i,
    formatMinute = /m+/,
    formatSecond = /s+/i;

language = {};
//简体中文
language["zh-CN"] = {
    dateFormat: "yyyy-mm-dd",
    year: "年份",
    month: "月份",
    weeks: ["日", "一", "二", "三", "四", "五", "六"],
    months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
};
//英文
language["en-US"] = {
    dateFormat: "yyyy-mm-dd",
    year: "Year",
    month: "Month",
    weeks: ["S", "M", "T", "W", "T", "F", "S"],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
};

function Day(year, month, day, dateChooser) {
    if(this instanceof Day) {
        this.initialize(year, month, day, dateChooser);
    } else {
        return new Day(year, month, day, dateChooser);
    }
}
Day.prototype = {
    constructor: Day,
    initialize: function(year, month, day, dateChooser) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.dateChooser = dateChooser;
        this.today = null;
        this._isCurrentMonth = true;
    },
    isCurrentMonth: function(value) {
        if(arguments.length > 0) {
            this._isCurrentMonth = value;
            return this;
        } else {
            return this._isCurrentMonth;
        }
    },
    setToday: function(today) {
        this.today = today;
    },
    isToday: function() {
        if(!this.today) {
            this.today = new Date();
        }
        return this.year === this.today.getFullYear() && 
            this.month === this.today.getMonth() && 
            this.day === this.today.getDate();
    },
    isTheDay: function(year, month, day) {
        return this.year === year && 
            this.month === month && 
            this.day === day;
    },
    isDisabled: function() {
        if(this.dateChooser) {
            return this.dateChooser._isDisabledDay(
                this.year, this.month, this.day);
        }
        return false;
    },
    //小于
    lt: function(year, month, day) {
        var d1 = new Date(this.year, this.month, this.day),
            d2 = new Date(year, month, day);
        return d1.getTime() < d2.getTime();
    },
    //大于
    gt: function(year, month, day) {
        var d1 = new Date(this.year, this.month, this.day),
            d2 = new Date(year, month, day);
        return d1.getTime() > d2.getTime();
    },
    toDate: function() {
        return new Date(this.year, this.month, this.day, 0, 0, 0);
    }
};

function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}
function formatCalendarTitle(year, month) {
    month += 1;
    return year + "-" + twoNumberFormatter.call(this, month) + "&nbsp;▼";
}
function formatDateItem(r, value, format) {
    var result;
    result = r.exec(format);
    if(result !== null) {
        if(result[0].length > 1) {
            value = twoNumberFormatter(value);
        }
    }
    return format.replace(r, value);
} 
function findDateItem(r, value, format) {
    var result;
    result = r.exec(format);
    if(result) {
        return parseInt(value.substring(result.index, result.index + result[0].length), 10);
    } else {
        return NaN;
    }
}
function createDay(value, format) {
    var year,
        month,
        day;
    year = findDateItem.call(this, formatYear, value, format);
    month = findDateItem.call(this, formatMonth, value, format);
    day = findDateItem.call(this, formatDay, value, format);

    if(isNaN(year) || isNaN(month) || isNaN(day)) {
        return null;
    }
    return Day(year, month - 1, day, this);
}
function checkButtonDisabled(btn) {
    return btn.hasClass("date-chooser-prev-disabled") || btn.hasClass("date-chooser-next-disabled");
}

// 事件处理函数
function onYearChanged(e) {
    var elem,
        value = e.data.value,
        year, month;
    
    elem = $(e.target);
    if(checkButtonDisabled(elem)) {
        return;
    }
    if(this._currentYear) {
        year = parseInt(this._currentYear.attr("data-year"), 10);
    } else {
        year = this._selYear;
    }
    if(this._currentMonth) {
        month = parseInt(this._currentMonth.attr("data-month"), 10);
    } else {
        month = this._selMonth;
    }

    year = year + value;
    this._fillYear(year, month);
}
function onYearSelected(e) {
    var elem,
        year,
        startMonth,
        endMonth, 
        currentMonth;
    
    e.stopPropagation();
    elem = $(e.target);
    if(elem.nodeName() !== "TD") {
        return;
    }
    if(elem.hasClass("disabled-year")) {
        return;
    }
    if(this._currentYear) {
        if(this._currentYear[0] === elem[0]) {
            return;
        }
        this._currentYear
            .removeClass(yearSelectedClass)
            .removeClass("background-highlight");
    }
    this._currentYear = elem;
    this._currentYear
        .addClass(yearSelectedClass)
        .addClass("background-highlight");

    if(this._currentMonth) {
        currentMonth = parseInt(this._currentMonth.attr("data-month"), 10);
    } else {
        currentMonth = this._selMonth;
    }
    this._updateMonthsStatus(currentMonth);
}
function onMonthSelected(e) {
    var elem;
    
    e.stopPropagation();
    elem = $(e.target);
    if(elem.nodeName() !== "TD") {
        return;
    }
    if(elem.hasClass("disabled-month")) {
        return;
    }
    if(this._currentMonth) {
        if(this._currentMonth[0] === elem[0]) {
            return;
        }
        this._currentMonth
            .removeClass(monthSelectedClass)
            .removeClass("background-highlight");
    }
    this._currentMonth = elem;
    this._currentMonth
        .addClass(monthSelectedClass)
        .addClass("background-highlight");
}
function onApplyYearMonth(e) {
    e.stopPropagation();
    this._selYear = parseInt(
        this._currentYear.attr("data-year"), 10);
    this._selMonth = parseInt(
        this._currentMonth.attr("data-month"), 10);
    this._updateCalendarTitle();
    this._fillMonth(this._currentDays, this._selYear, this._selMonth);

    this._closeYearMonthPanel();
}
function onCancelYearMonth(e) {
    e.stopPropagation();
    this._closeYearMonthPanel();
}
function onMonthChanged(e) {
    var elem,
        value = e.data.value,
        date;
    
    elem = $(e.target);
    if(checkButtonDisabled(elem)) {
        return;
    }
    date = new Date(this._selYear, this._selMonth + value, 1);
    this._changeMonth(date, value > 0);
}
function onCalendarTitleClick(e) {
    e.stopPropagation();
    this._fillYear(this._selYear, this._selMonth);
    this._openYearMonthPanel();
}
function onDayItemClick(e) {
    var elem,
        nodeName;
    elem = $(e.target);
    if(this._currentDays.parent().hasClass("click-disabled")) {
        return;
    }
    while((nodeName = elem.nodeName()) !== "TD") {
        if(elem.hasClass("date-chooser-days-panel")) {
            return;
        }
        elem = elem.parent();
    }

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    this._selectItem(elem);
}
function onTodayButtonClick(e) {
    var now = new Date(),
        year, month;
    year = now.getFullYear();
    month = now.getMonth();
    if(year === this._selYear && month === this._selMonth) {
        this.setSelection(now);
    } else {
        this._changeMonth(
            now, 
            year * 12 + month + 1 > this._selYear * 12 + this._selMonth + 1,
            function() {
                this.setSelection(now);
            });
    }
}
function onTimeMousewheel(e) {
    var elem,
        max,
        val,
        h, m, s;

    elem = $(e.target);
    if(elem.nodeName() !== "INPUT") {
        return;
    }
    if(elem.hasClass("hour")) {
        max = 24;
    } else {
        max = 60;
    }
    val = elem.val();
    val = parseFloat(val);
    val += -e.delta;
    if (val < 0) {
        val = max - 1;
    } else if (val >= max) {
        val = 0;
    }
    elem.val(twoNumberFormatter(val));
    
    h = parseInt(this.hourText.val(), 10);
    m = parseInt(this.minuteText.val(), 10);
    s = parseInt(this.secondText.val(), 10);
    this.setSelection(
        new Date(this._selYear, this._selMonth, this._selDay, h, m, s));
}
function onTimeTextinput(e) {
    var elem,
        now,
        h, m, s;

    elem = $(e.target);
    if(elem.val().length === 0) {
        return;
    }
    now = new Date();
    h = parseInt(this.hourText.val(), 10);
    if(isNaN(h) || h < 0 || h >= 24) {
        h = now.getHours();
        this.hourText.val(twoNumberFormatter(h));
        return;
    }
    m = parseInt(this.minuteText.val(), 10);
    if(isNaN(m) ||m < 0 || m >= 60) {
        m = now.getMinutes();
        this.minuteText.val(twoNumberFormatter(m));
        return;
    }
    s = parseInt(this.secondText.val(), 10);
    if(isNaN(s) || s < 0 || s >= 60) {
        s = now.getSeconds();
        this.secondText.val(twoNumberFormatter(s));
        return;
    }
    this.setSelection(
        new Date(this._selYear, this._selMonth, this._selDay, h, m, s));
}

ui.ctrls.define("ui.ctrls.DateChooser", ui.ctrls.DropDownBase, {
    _defineOption: function() {
        return {
            // 日期格式化样式
            dateFormat: defaultDateFormat,
            // 显示语言 zh-CN: 中文, en-US: 英文
            language: "zh-CN",
            // 放置日历的容器
            calendarPanel: null,
            // 是否要显示时间
            isDateTime: false,
            // 起始日期 不填则表示没有限制
            startDate: null,
            // 结束日期 不填则表示没有限制
            endDate: null
        };
    },
    _defineEvents: function() {
        return ["selecting", "selected", "cancel"];
    },
    _create: function() {
        var now;
        this._super();

        // 日期格式化
        if(this.isDateTime()) {
            this.option.dateFormat = this.option.dateFormat || defaultDateTimeFormat;
        } else {
            this.option.dateFormat = this.option.dateFormat || defaultDateFormat;
        }

        this._initDateRange();
        now = this.formatDateValue(new Date());
        this._setCurrentDate(now);
         
        // 文字显示
        this._language = language[this.option.language];
        if (!this._language) {
            this._language = language["zh-CN"];
        }

        // 事件
        /* 年月选择面板相关事件 */
        // 年切换处理
        this.onYearChangedHandler = onYearChanged.bind(this);
        // 年选中事件
        this.onYearSelectedHandler = onYearSelected.bind(this);
        // 月选中事件
        this.onMonthSelectedHandler = onMonthSelected.bind(this);
        // 选中年月应用事件
        this.onApplyYearMonthHandler = onApplyYearMonth.bind(this);
        // 取消事件
        this.onCancelYearMonthHandler = onCancelYearMonth.bind(this);
        /* 日历面板相关事件 */
        // 月切换处理
        this.onMonthChangedHandler = onMonthChanged.bind(this);
        // 日历标题点击事件
        this.onCalendarTitleClickHandler = onCalendarTitleClick.bind(this);
        // 日期项点击事件
        this.onDayItemClickHandler = onDayItemClick.bind(this);
        // 今日日期点击事件
        this.onTodayButtonClickHandler = onTodayButtonClick.bind(this);
        if(this.isDateTime()) {
            // 时间滚轮选择事件
            this.onTimeMousewheelHandler = onTimeMousewheel.bind(this);
            // 时间输入事件
            this.onTimeTextinputHandler = onTimeTextinput.bind(this);
        }
    },
    _initDateRange: function() {
        this.startDay = null;
        if(ui.core.isString(this.option.startDate) && this.option.startDate.length > 0) {
            this.startDay = createDay.call(this, this.option.startDate, this.option.dateFormat);
        }
        this.endDay = null;
        if(ui.core.isString(this.option.endDate) && this.option.endDate.length > 0) {
            this.endDay = createDay.call(this, this.option.endDate, this.option.dateFormat);
        }
    },
    _render: function() {
        this._calendarPanel = ui.getJQueryElement(this.option.calendarPanel);
        if(this._calendarPanel) {
            this._calendarPanel.css("position", "relative");
        } else {
            this._calendarPanel = $("<div />");
        }
        this._calendarPanel
            .addClass("ui-date-chooser-panel")
            .addClass("border-highlight")
            .click(function (e) {
                e.stopPropagation();
            });

        this._showClass = "ui-date-chooser-show";
        this._panel = this._calendarPanel;
        this._selectTextClass = "ui-date-text";
        this._clearClass = "ui-clear-text";
        this._clear = (function () {
            this.cancelSelection();
        }).bind(this);

        // 创建日历内容面板
        this._initCalendarPanel();
        // 创建年月选择面板
        this._initYearMonthPanel();
        
        // 创建动画
        this._initYearMonthPanelAnimator();
        this._initCalendarChangeAnimator();
    },
    _initYearMonthPanelAnimator: function() {
        this.ymAnimator = ui.animator({
            target: this._settingPanel,
            onChange: function(val) {
                this.target.css("top", val + "px");
            }
        });
        this.ymAnimator.duration = 240;
    },
    _initCalendarChangeAnimator: function() {
        this.mcAnimator = ui.animator({
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css("left", val + "px");
            }
        }).addTarget({
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css("left", val + "px");
            }
        });
        this.mcAnimator.duration = 240;
    },
    _initYearMonthPanel: function() {
        var yearTitle, monthTitle,
            prev, next,
            html;

        this._settingPanel = $("<div class='year-month-setting-panel' />");
        // 年标题
        yearTitle = $("<div class='set-title font-highlight' style='height:24px;line-height:24px;' />");
        this._settingPanel.append(yearTitle);
        // 后退
        prev = $("<div class='date-chooser-prev'/>");
        prev.click({ value: -10 }, this.onYearChangedHandler);
        yearTitle.append(prev);
        this._yearPrev = prev;
        // 标题文字
        yearTitle.append("<div class='date-chooser-title'><span id='yearTitle'>" + this._language.year + "</span></div>");
        // 前进
        next = $("<div class='date-chooser-next'/>");
        next.click({ value: 10 }, this.onYearChangedHandler);
        yearTitle.append(next);
        this._yearNext = next;
        // 清除浮动
        yearTitle.append($("<br clear='left' />"));
        // 年
        this._settingPanel.append(this._createYearPanel());
        // 月标题
        monthTitle = $("<div class='set-title font-highlight' style='text-align:center;height:27px;line-height:27px;' />");
        html = [];
        html.push("<fieldset class='title-fieldset border-highlight'>");
        html.push("<legend class='title-legend font-highlight'>", this._language.month, "</legend>");
        html.push("</fieldset>");
        monthTitle.html(html.join(""));
        this._settingPanel.append(monthTitle);
        // 月
        this._settingPanel.append(this._createMonthPanel());
        // 确定取消按钮
        this._settingPanel.append(this._createOkCancel());
        this._calendarPanel.append(this._settingPanel);
    },
    _createYearPanel: function() {
        var yearPanel,
            tbody, tr, td, 
            i, j;

        yearPanel = $("<div class='date-chooser-year-panel' />");
        this._yearsTable = $("<table class='date-chooser-table' cellpadding='0' cellspacing='0' />");
        this._yearsTable.click(this.onYearSelectedHandler);
        tbody = $("<tbody />");
        for(i = 0; i < 3; i++) {
            tr = $("<tr />");
            for(j = 0; j < 5; j++) {
                td = $("<td class='date-chooser-year-td' />");
                tr.append(td);
            }
            tbody.append(tr);
        }
        this._yearsTable.append(tbody);
        yearPanel.append(this._yearsTable);

        return yearPanel;
    },
    _createMonthPanel: function() {
        var monthPanel,
            tbody, tr, td,
            i, j, index;

        monthPanel = $("<div class='date-chooser-month-panel' />");
        this._monthsTable = $("<table class='date-chooser-table' cellpadding='0' cellspacing='0' />");
        this._monthsTable.click(this.onMonthSelectedHandler);
        tbody = $("<tbody />");
        index = 0;
        for (i = 0; i < 3; i++) {
            tr = $("<tr />");
            for (j = 0; j < 4; j++) {
                td = $("<td class='date-chooser-month-td' />");
                td.html(this._language.months[index]);
                    td.attr("data-month", index++);
                tr.append(td);
            }
            tbody.append(tr);
        }
        this._monthsTable.append(tbody);
        monthPanel.append(this._monthsTable);

        return monthPanel;
    },
    _createOkCancel: function() {
        var okCancel = $("<div class='date-chooser-operate-panel' />");
        okCancel.append(
            this._createButton(
                this.onApplyYearMonthHandler, 
                "<i class='fa fa-check'></i>", 
                null, 
                { "margin-right": "10px" }));
        okCancel.append(
            this._createButton(
                this.onCancelYearMonthHandler, 
                "<i class='fa fa-remove'></i>"));
        return okCancel;
    },
    _initCalendarPanel: function() {
        //创建日历正面的标题
        this._calendarPanel.append(this._createTitlePanel());
        //创建日期显示面板
        this._calendarPanel.append(this._createDatePanel());
        //创建控制面板
        this._calendarPanel.append(this._createCtrlPanel());
    },
    _createTitlePanel: function() {
        var titlePanel,
            prev, next, 
            dateTitle;

        titlePanel = $("<div class='date-chooser-calendar-title' />");
        // 后退
        prev = $("<div class='date-chooser-prev' />");
        prev.click({ value: -1 }, this.onMonthChangedHandler);
        titlePanel.append(prev);
        this._monthPrev = prev;
        // 标题
        dateTitle = $("<div class='date-chooser-title' />");
        this._linkBtn = $("<a href='javascript:void(0)' class='date-chooser-title-text font-highlight' />");
        this._linkBtn.click(this.onCalendarTitleClickHandler);
        this._updateCalendarTitle();
        dateTitle.append(this._linkBtn);
        titlePanel.append(dateTitle);
        // 前进
        next = $("<div class='date-chooser-next' />");
        next.click({ value: 1 }, this.onMonthChangedHandler);
        titlePanel.append(next);
        this._monthNext = next;

        return titlePanel;
    },
    _createDatePanel: function() {
        var datePanel = $("<div class='date-chooser-calendar-panel' />");
        datePanel.append(this._createWeekHead());
        datePanel.append(this._createDaysBody());
        return datePanel;
    },
    _createWeekHead: function() {
        var weekPanel,
            weekTable,
            tbody, tr, th,
            i;
        
        weekPanel = $("<div class='date-chooser-week-panel'/>");
        weekTable = $("<table class='date-chooser-table' cellpadding='0' cellspacing='0' />");
        tbody = $("<tbody />");
        tr = $("<tr />");
        for (i = 0; i < 7; i++) {
            th = $("<th class='date-chooser-calendar-th' />");
            th.text(this._language.weeks[i]);
            if (i === 0 || i === 6) {
                th.addClass("date-chooser-weekend");
            }
            tr.append(th);
        }
        tbody.append(tr);
        weekTable.append(tbody);
        weekPanel.append(weekTable);

        return weekPanel;
    },
    _createDaysBody: function() {
        var daysPanel;

        daysPanel = $("<div class='date-chooser-days-panel' />");
        this._currentDays = this._createDaysTable();
        this._nextDays = this._createDaysTable();
        this._nextDays.css("display", "none");

        daysPanel.append(this._currentDays);
        daysPanel.append(this._nextDays);

        daysPanel.click(this.onDayItemClickHandler);

        return daysPanel;
    },
    _createDaysTable: function() {
        var table, tbody, 
            tr, td, 
            i, j;

        table = $("<table class='date-chooser-table' cellpadding='0' cellspacing='0' />");
        tbody = $("<tbody />");
        for (i = 0; i < 6; i++) {
            tr = $("<tr />");
            for (j = 0; j < 7; j++) {
                tr.append($("<td class='date-chooser-calendar-td' />"));
            }
            tbody.append(tr);
        }
        table.append(tbody);
        return table;
    },
    _createCtrlPanel: function() {
        var ctrlPanel,
            now,
            temp;

        ctrlPanel = $("<div class='date-chooser-operate-panel' />");
        now = new Date();

        if(this.isDateTime()) {
            temp = twoNumberFormatter(now.getHours());
            this.hourText = $("<input type='text' class='hour date-chooser-time-input font-highlight-hover' />");
            this.hourText.val(temp);
            this.hourText.textinput(this.onTimeTextinputHandler);
            ctrlPanel.append(this.hourText);
            
            ctrlPanel.append("<span style='margin-left:2px;margin-right:2px;'>:</span>");
            
            temp = twoNumberFormatter(now.getMinutes());
            this.minuteText = $("<input type='text' class='minute date-chooser-time-input font-highlight-hover' />");
            this.minuteText.val(temp);
            this.minuteText.textinput(this.onTimeTextinputHandler);
            ctrlPanel.append(this.minuteText);

            ctrlPanel.append("<span style='margin-left:2px;margin-right:2px;'>:</span>");
            
            temp = twoNumberFormatter(now.getSeconds());
            this.secondText = $("<input type='text' class='second date-chooser-time-input font-highlight-hover' />");
            this.secondText.val(temp);
            this.secondText.textinput(this.onTimeTextinputHandler);
            ctrlPanel.append(this.secondText);

            ctrlPanel.mousewheel(this.onTimeMousewheelHandler);
        } else {
            this._setTodayButton(function() {
                this._todayButton = this._createButton(
                    this.onTodayButtonClickHandler,
                    now.getDate()
                );
                ctrlPanel.append(this._todayButton);
            });
        }
        return ctrlPanel;
    },
    _setTodayButton: function(createFn, now) {
        var valid;
        
        if(createFn) {
            createFn.call(this);
        }

        if(!now) {
            now = new Date();
        }
        valid = this.startDay ? this.startDay.lt(now.getFullYear(), now.getMonth(), now.getDate()) : true;
        valid = valid && (this.endDay ? this.endDay.gt(now.getFullYear(), now.getMonth(), now.getDate()) : true);

        if(!valid) {
            this._todayButton.removeAttr("title");
            this._todayButton.attr("disabled", "disabled");
        } else {
            this._todayButton.attr("title", this.formatDateValue(now));
            this._todayButton.removeAttr("disabled");
        }

    },
    _createButton: function(eventFn, innerHtml, className, css) {
        var btn = $("<button class='icon-button date-chooser-button' />");
        if(innerHtml) {
            btn.html(innerHtml);
        }
        if(className) {
            btn.addClass(className);
        }
        if(ui.core.isObject(css)) {
            btn.css(css);
        }
        if(eventFn) {
            btn.click(eventFn);
        }
        return btn;
    },
    _setCurrentDate: function(value) {
        var format = this.option.dateFormat,
            now = new Date();

        this._selYear = findDateItem.call(this, formatYear, value, format);
        this._selMonth = findDateItem.call(this, formatMonth, value, format);
        this._selDay = findDateItem.call(this, formatDay, value, format);
        
        if (isNaN(this._selYear) || this._selYear <= 1970 || this._selYear > 9999) {
            this._selYear = now.getFullYear();
        }
        this._selMonth--;
        if (isNaN(this._selMonth) || this._selMonth < 0 || this._selMonth > 11) {
            this._selMonth = now.getMonth();
        }
        if (isNaN(this._selDay) || this._selDay <= 0 || this._selDay > 31) {
            this._selDay = now.getDate();
        }

        if(this._isDisabledDay(this._selYear, this._selMonth, this._selDay)) {
            this._selYear = this.startDay.year;
            this._selMonth = this.startDay.month;
            this._selDay = this.startDay.day;
        }
    },
    _setCurrentTime: function(value) {
        var h, m, s,
            format,
            now;
        if(!this.isDateTime()) {
            return;
        }

        format = this.option.dateFormat;
        now = new Date();
        h = findDateItem.call(this, formatHour, value, format);
        m = findDateItem.call(this, formatMinute, value, format);
        s = findDateItem.call(this, formatSecond, value, format);
        if(isNaN(h) || h < 0 || h >= 24) {
            h = now.getHours();
        }
        if(isNaN(m) || m < 0 || m >= 60) {
            m = now.getMinutes();
        }
        if(isNaN(s) || s < 0 || s >= 60) {
            s = now.getSeconds();
        }
        this.hourText.val(twoNumberFormatter(h));
        this.minuteText.val(twoNumberFormatter(m));
        this.secondText.val(twoNumberFormatter(s));
    },
    _updateCalendarTitle: function() {
        this._linkBtn.html(
            formatCalendarTitle.call(this, this._selYear, this._selMonth));
    },
    _fillMonth: function(daysTable, currentYear, currentMonth) {
        var days,
            prevMonthDate,
            currentMonthDate,
            nextMonthDate,
            firstWeekDay,
            y, m, d, i, j, index,
            rows, td, today,
            lastDay;

        // 检查月份的切换按钮
        this._checkPrev(currentYear, currentMonth, this._monthPrev);
        this._checkNext(currentYear, currentMonth, this._monthNext);

        days = [];
        // 当前月的第一天
        currentMonthDate = new Date(currentYear, currentMonth, 1);
        // 当前月的第一天是星期几
        firstWeekDay = currentMonthDate.getDay();

        if(firstWeekDay > 0) {
            // 填充上个月的日期
            // 上一个月的最后一天
            prevMonthDate = new Date(currentYear, currentMonth, 0);
            // 需要显示上个月的日期
            y = prevMonthDate.getFullYear();
            m = prevMonthDate.getMonth();
            d = prevMonthDate.getDate();
            for(i = d - (firstWeekDay - 1); i <= d; i++) {
                days.push(Day(y, m, i, this).isCurrentMonth(false));
            }
        }

        // 填充当前月的日期
        lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
        for(i = 1; i <= lastDay; i++) {
            days.push(Day(currentYear, currentMonth, i, this));
        }

        // 填充下个月的日期
        // 下一个月的第一天
        nextMonthDate = new Date(currentMonth, currentMonth + 1, 1);
        y = nextMonthDate.getFullYear();
        m = nextMonthDate.getMonth();
        lastDay = 6 * 7 - days.length;
        for(i = 1; i <= lastDay; i++) {
            days.push(Day(y, m, i, this).isCurrentMonth(false));
        }

        today = new Date();
        daysTable.data("days", days);
        rows = daysTable[0].rows;
        for(i = 0; i < 6; i++) {
            for(j = 0; j < 7; j++) {
                index = (i * 7) + j;
                d = days[index];
                d.setToday(today);
                td = $(rows[i].cells[j]);
                td.attr("data-index", index);

                if(d.isDisabled()) {
                    td.addClass("disabled-day").html("");
                    continue;
                } else {
                    td.removeClass("disabled-day").html("<span>" + d.day + "</span>");
                }

                // 判断是否是选中的日期
                if(d.isTheDay(this._selYear, this._selMonth, this._selDay)) {
                    this._selectItem(td);
                }
                // 高亮显示今日
                if(d.isToday()) {
                    td.addClass("font-highlight");
                } else {
                    td.removeClass("font-highlight");
                }
                // 不是当前月的日期
                if(!d.isCurrentMonth()) {
                    td.addClass("other-month-day");
                }
            }
        }
    },
    _fillYear: function(year, month) {
        var startYear, yearCount,
            rows, td, value,
            i, j;

        yearCount = 15;
        startYear = Math.floor(year / 15) * 15;
        $("#yearTitle").text(
            startYear + "年 ~ " + (startYear + yearCount - 1) + "年");
        
        // 检查年的切换按钮
        this._checkPrev(startYear - 1, -1, this._yearPrev);
        this._checkNext(startYear + yearCount, -1, this._yearNext);

        if(this._currentYear) {
            this._currentYear
                .removeClass(yearSelectedClass)
                .removeClass("background-highlight");
            this._currentYear = null;
        }
        rows = this._yearsTable[0].rows;
        for(i = 0; i < 3; i++) {
            for(j = 0; j < 5; j++) {
                td = $(rows[i].cells[j]);
                value = startYear + (i * 5 + j);
                if((this.startDay && value < this.startDay.year) || (this.endDay && value > this.endDay.year)) {
                    td.addClass("disabled-year");
                } else {
                    td.html(value);
                }
                td.attr("data-year", value);
                if(value === year) {
                    td.addClass(yearSelectedClass)
                        .addClass("background-highlight");
                    this._currentYear = td;
                }
            }
        }

        this._updateMonthsStatus(month);
    },
    _updateMonthsStatus: function(month) {
        var rows, td,
            disabledArray, year,
            firstEnabledMonth,
            startMonth, endMonth,
            index, i, j;

        year = parseInt(this._currentYear.attr("data-year"), 10);
        disabledArray = new Array(12);
        if(this.startDay || this.endDay) {
            startMonth = -1;
            endMonth = -1;
            if(this.startDay) {
                if(this.startDay.year === year) {
                    startMonth = this.startDay.month;
                } else if(this.startDay.year < year) {
                    startMonth = 0;
                }
            }
            if(this.endDay && this.endDay.year >= year) {
                if(this.endDay.year === year) {
                    endMonth = this.endDay.month;
                } else if(this.endDay.year > year) {
                    endMonth = 11;
                }
            }
            for(i = 0; i < disabledArray.length; i++) {
                if(i < startMonth || i > endMonth) {
                    disabledArray[i] = false;
                }
            }
        }
        if(this._currentMonth) {
            this._currentMonth
                .removeClass(monthSelectedClass)
                .removeClass("background-highlight");
            this._currentMonth = null;
        }
        rows = this._monthsTable[0].rows;
        firstEnabledMonth = null;
        for(i = 0; i < 3; i++) {
            for(j = 0; j < 4; j++) {
                index = (i * 4) + j;
                td = $(rows[i].cells[j]);
                if(disabledArray[index] === false) {
                    td.addClass("disabled-month");
                } else {
                    if(!firstEnabledMonth) {
                        firstEnabledMonth = td;
                    }
                    td.removeClass("disabled-month");
                }
                if(index === month && disabledArray[index] !== false) {
                    this._currentMonth = td;
                    td.addClass(monthSelectedClass).addClass("background-highlight");
                }
            }
        }
        if(!this._currentMonth) {
            this._currentMonth = firstEnabledMonth;
            firstEnabledMonth.addClass(monthSelectedClass).addClass("background-highlight");
        }
    },
    _checkPrev: function(year, month, prevBtn) {
        var startMonthCount,
            monthCount;
        if(this.startDay) {
            startMonthCount = this.startDay.year * 12;
            monthCount = year * 12;
            if(month >= 0) {
                startMonthCount += this.startDay.month + 1;
                monthCount += month + 1;
            }
            if(monthCount <= startMonthCount) {
                prevBtn.addClass("date-chooser-prev-disabled");
            } else {
                prevBtn.removeClass("date-chooser-prev-disabled");
            }
        }
    },
    _checkNext: function(year, month, nextBtn) {
        var endMonthCount,
            monthCount;
        if(this.endDay) {
            endMonthCount = this.endDay.year * 12;
            monthCount = year * 12;
            if(month >= 0) {
                endMonthCount += this.endDay.month + 1;
                monthCount += month + 1;
            }
            if(monthCount >= endMonthCount) {
                nextBtn.addClass("date-chooser-next-disabled");
            } else {
                nextBtn.removeClass("date-chooser-next-disabled");
            }
        }
    },
    _isDisabledDay: function(year, month, day) {
        if(this.startDay && this.startDay.gt(year, month, day)) {
            // 日期小于起始日期
            return true;
        }
        if(this.endDay && this.endDay.lt(year, month, day)) {
            // 日期大于结束日期
            return true;
        }
        return false;
    },
    _getSelectionData: function(elem) {
        var h = 0, m = 0, s = 0,
            index, days, day,
            data;
        data = {};
        if(this.isDateTime()) {
            h = parseInt(this.hourText.val(), 10) || 0;
            m = parseInt(this.minuteText.val(), 10) || 0;
            s = parseInt(this.secondText.val(), 10) || 0;
        }

        index = parseInt(elem.attr("data-index"), 10);
        days = elem.parent().parent().parent();
        days = days.data("days");
        day = days[index];
        
        data.date = new Date(day.year, day.month, day.day, h, m, s);
        data.value = this.formatDateValue(data.date);
        return data;
    },
    _selectItem: function(elem) {
        var eventData;
        
        if(elem.hasClass("disabled-day")) {
            return;
        }
        eventData = this._getSelectionData(elem);
        elem.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        if(this.fire("selecting", eventData) === false) {
            return;
        }

        this._selYear = eventData.date.getFullYear();
        this._selMonth = eventData.date.getMonth();
        this._selDay = eventData.date.getDate();

        if(this._currentDate) {
            this._currentDate
                .removeClass(selectedClass)
                .removeClass("background-highlight");
        }
        this._currentDate = elem;
        this._currentDate
            .addClass(selectedClass)
            .addClass("background-highlight");
        this.fire("selected", eventData);
    },
    _openYearMonthPanel: function() {
        var option;
        option = this.ymAnimator[0];
        option.target.css("display", "block");
        option.begin = parseFloat(option.target.css("top"));
        option.end = 0;
        option.ease = ui.AnimationStyle.easeTo;
        this.ymAnimator.start();
    },
    _closeYearMonthPanel: function() {
        var option;
        option = this.ymAnimator[0];
        option.begin = parseFloat(option.target.css("top"));
        option.end = -option.target.height();
        option.ease = ui.AnimationStyle.easeFrom;
        this.ymAnimator.start().then(function() {
            option.target.css("display", "none");
        });

        this._currentYear
            .removeClass(yearSelectedClass)
            .removeClass("background-highlight");
        this._currentMonth
            .removeClass(monthSelectedClass)
            .removeClass("background-highlight");
        this._currentYear = null;
        this._currentMonth = null;
    },
    _changeMonth: function(date, isNext, callback) {
        var option,
            daysPanel,
            currentLeft,
            width,
            that;

        if(this.mcAnimator.isStarted) {
            return;
        }

        daysPanel = this._currentDays.parent();
        width = daysPanel.width();
        currentLeft = parseFloat(this._currentDays.css("left")) || 0;
        
        option = this.mcAnimator[0];
        option.target = this._currentDays;
        option.begin = currentLeft;
        option.end = isNext ? -width : width;

        option = this.mcAnimator[1];
        option.target = this._nextDays;
        option.target.css("display", "block");
        if(isNext) {
            option.begin = width - currentLeft;
            option.target.css("left", option.begin + "px");
        } else {
            option.begin = currentLeft - width;
            option.target.css("left", option.begin + "px");
        }
        option.end = 0;

        this._selYear = date.getFullYear();
        this._selMonth = date.getMonth();
        this._updateCalendarTitle();
        this._fillMonth(this._nextDays, this._selYear, this._selMonth);
        
        daysPanel.addClass("click-disabled");
        that = this;
        this.mcAnimator.start().then(function() {
            var temp = that._currentDays;
            that._currentDays = that._nextDays;
            that._nextDays = temp;
            that._nextDays.css("display", "none");
            daysPanel.removeClass("click-disabled");
            if(ui.core.isFunction(callback)) {
                callback.call(that);
            }
        });
    },

    // API
    /** 是否能选择时间 */
    isDateTime: function() {
        return !!this.option.isDateTime;
    },
    /** 设置日期 */
    setSelection: function(date) {
        var index,
            rowIndex,
            cellIndex,
            firstDate,
            td;

        if(!date || this._isDisabledDay(date.getFullYear(), date.getMonth(), date.getDate())) {
            return;
        }
        
        firstDate = new Date(date.getFullYear(), date.getMonth(), 1);
        index = firstDate.getDay() + date.getDate() - 1;
        rowIndex = Math.floor(index / 7);
        cellIndex = index - rowIndex * 7;

        td = $(this._currentDays[0].rows[rowIndex].cells[cellIndex]);
        if(td.length > 0) {
            this._selectItem(td);
        }
    },
    /** 获取当前选择的数据 */
    getSelection: function() {
        if(this._currentDate) {
            return this._getSelectionData(this._currentDate);
        }
        return null;
    },
    /** 取消选择 */
    cancelSelection: function() {
        if(this._currentDate) {
            this._currentDate
                .removeClass(selectedClass)
                .removeClass("background-highlight");
        }
        this.fire("cancel");
    },
    /** 设置日期值，初始化日历 */
    setDateValue: function(value) {
        this._setCurrentDate(value);
        if(this.isDateTime()) {
            this._setCurrentTime(value);
        }
        this._updateCalendarTitle();
        this._fillMonth(this._currentDays, this._selYear, this._selMonth);
    },
    /** 将date格式化为对应格式的文本 */
    formatDateValue: function(date) {
        var dateValue = this.option.dateFormat;
        dateValue = formatDateItem(formatYear, date.getFullYear(), dateValue);
        dateValue = formatDateItem(formatMonth, date.getMonth() + 1, dateValue);
        dateValue = formatDateItem(formatDay, date.getDate(), dateValue);
        if(this.isDateTime()) {
            dateValue = formatDateItem(formatHour, date.getHours(), dateValue);
            dateValue = formatDateItem(formatMinute, date.getMinutes(), dateValue);
            dateValue = formatDateItem(formatSecond, date.getSeconds(), dateValue);
        }
        return dateValue;
    },
    /** 显示 */
    show: function() {
        var that,
            superShow,
            today, now,
            fn;

        // 更新今日按钮日期
        if(this._todayButton) {
            now = new Date();
            today = parseInt(this._todayButton.text(), 10);
            if(now.getDate() !== today) {
                this._todayButton
                    .html(now.getDate())
                    .attr("title", this.formatDateValue(now));
            }
        }

        that = this;
        superShow = this._super;
        fn = function() {
            that.moveToElement(that.element, true);
            superShow.call(that);
        };
        if(this.isShow()) {
            this.hide(fn);
        } else {
            fn();
        }
    }
});

/* 构造可以重用的日历选择器 */
var dateChooser,
    dateTimeChooser;

function noop() {}
function createDateChooser(option, element) {
    var dc = ui.ctrls.DateChooser(option, element);
    dc.selecting(function(e, eventData) {
        if(ui.core.isFunction(this.selectingHandler)) {
            return this.selectingHandler.apply(this, arguments);
        }
    });
    dc.selected(function(e, eventData) {
        if(ui.core.isFunction(this.selectedHandler)) {
            this.selectedHandler.apply(this, arguments);
        } else {
            if (this.element.nodeName() === "INPUT") {
                this.element.val(eventData.value);
            } else {
                this.element.html(eventData.value);
            }
        }
    });
    dc.cancel(function() {
        if(ui.core.isFunction(this.cancelHandler)) {
            this.cancelHandler.apply(this, arguments);
        } else {
            if(this.element.nodeName() === "INPUT") {
                this.element.val("");
            } else {
                this.element.html("");
            }
        }
    });
    return dc;
}
function onMousemoveHandler(e) {
    var eWidth,
        offsetX;
    if(!this.isShow()) {
        this.element.css("cursor", "auto");
        this._clearable = false;
        return;
    }
    eWidth = this.element.width();
    offsetX = e.offsetX;
    if(!offsetX) {
        offsetX = e.clientX - this.element.offset().left;
    }
    if (eWidth - offsetX < 0) {
        this.element.css("cursor", "pointer");
        this._clearable = true;
    } else {
        this.element.css("cursor", "auto");
        this._clearable = false;
    }
}
function onMouseupHandler(e) {
    var eWidth,
        offsetX;
    if(!this._clearable) {
        return;
    }
    eWidth = this.element.width();
    offsetX = e.offsetX;
    if(!offsetX) {
        offsetX = e.clientX - this.element.offset().left;
    }
    if (eWidth - offsetX < 0) {
        if ($.isFunction(this._clear)) {
            this._clear();
        }
    }
}
function setOptions(elem, option) {
    // 修正配置信息
    this.option = option;
    // 更新可选择范围
    this._monthPrev.removeClass("date-chooser-prev-disabled");
    this._monthNext.removeClass("date-chooser-next-disabled");
    this._initDateRange();
    if(!this.isDateTime()) {
        this._setTodayButton();
    }
    // 设置面板的位置是否固定
    this.setLayoutPanel(option.layoutPanel);
    // 更新目标对象
    this.element = elem;
    // 修正事件引用
    this.selectingHandler = option.selectingHandler;
    this.selectedHandler = option.selectedHandler;
    this.clearHandler = option.cancelHandler;
    // 修正事件处理函数
    if(elem.nodeName() === "INPUT") {
        this.onMousemoveHandler = onMousemoveHandler.bind(this);
        this.onMouseupHandler = onMouseupHandler.bind(this);
    } else {
        this.onMousemoveHandler = noop;
        this.onMouseupHandler = noop;
    }
}

$.fn.dateChooser = function(option) {
    var nodeName,
        valueFn,
        currentDateChooser;

    if(this.length === 0) {
        return null;
    }

    if(this.hasClass("date-text")) {
        this.css("width", parseFloat(this.css("width"), 10) - 23 + "px");
    }
    nodeName = this.nodeName();
    if(nodeName !== "INPUT" && nodeName !== "A" && nodeName !== "SELECT") {
        this.attr("tabindex", 0);
    }

    if(nodeName === "INPUT") {
        valueFn = function() {
            return this.val();
        };
    } else {
        valueFn = function() {
            return this.text();
        };
    }

    if(option && option.isDateTime) {
        if(!dateTimeChooser) {
            if(!option.dateFormat) {
                option.dateFormat = defaultDateTimeFormat;
            }
            dateTimeChooser = createDateChooser(option, this);
        }
        currentDateChooser = dateTimeChooser;
    } else {
        if(!dateChooser) {
            dateChooser = createDateChooser(null, this);
        }
        currentDateChooser = dateChooser;
    }
    option = ui.extend({}, currentDateChooser.option, option);
    this.focus(function(e) {
        var elem = $(e.target),
            value;
        if(currentDateChooser.isShow() && 
            currentDateChooser.element && 
            currentDateChooser.element[0] === elem[0]) {
            return;
        }
        if(currentDateChooser.element) {
            currentDateChooser.element.removeClass(currentDateChooser._clearClass);
        }
        setOptions.call(currentDateChooser, elem, option);
        value = valueFn.call(elem);
        currentDateChooser.setDateValue(value);

        ui.hideAll(currentDateChooser);
        currentDateChooser.show();
    }).click(function(e) {
        e.stopPropagation();
    });
    return currentDateChooser;
};


})(jQuery, ui);

// Source: src/control/select/selection-list.js

(function($, ui) {

/**
 * 自定义下拉列表
 * 可以支持单项选择和多项选则
 */

var selectedClass = "ui-selection-list-selected",
    checkboxClass = "ui-selection-list-checkbox";

// 获取值
function getValue(field) {
    var value,
        arr,
        i, len;
    
    arr = field.split(".");
    value = this[arr[0]];
    for(i = 1, len = arr.length; i < len; i++) {
        value = value[arr[i]];
        if(value === undefined || value === null) {
            break;
        }
    }
    if(value === undefined) {
        value = null;
    }
    return value;
}
// 获取多个字段的值并拼接
function getArrayValue(fieldArray) {
    var result = [],
        value,
        i = 0;
    for(; i < fieldArray.length; i++) {
        value = this[fieldArray[i]];
        if(value === undefined) {
            value = null;
        }
        result.push(value + "");
    }
    return result.join("_");
}
function defaultItemFormatter(item, index, li) {
    var text = "";
    if (ui.core.isString(item)) {
        text = item;
    } else if (item) {
        text = this._getText.call(item, this.option.textField);
    }
    return $("<span />").text(text);
}
function setChecked(cbx, checked) {
    if(checked) {
        cbx.removeClass("fa-square")
            .addClass("fa-check-square").addClass("font-highlight");
    } else {
        cbx.removeClass("fa-check-square").removeClass("font-highlight")
            .addClass("fa-square");
    }
}
function isChecked(cbx) {
    return cbx.hasClass("fa-check-square");
}

// 项目点击事件
function onItemClick(e) {
    var elem,
        nodeName;

    if(this.isMultiple()) {
        e.stopPropagation();
    }

    elem = $(e.target);
    while((nodeName = elem.nodeName()) !== "LI" && 
        !elem.hasClass("ui-selection-list-li")) {

        if(elem.hasClass("ui-selection-list-panel")) {
            return;
        }
        elem = elem.parent();
    }

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    this._selectItem(elem);
}

ui.ctrls.define("ui.ctrls.SelectionList", ui.ctrls.DropDownBase, {
    _defineOption: function() {
        return {
            // 是否支持多选
            multiple: false,
            // 获取值的属性名称，可以用多个值进行组合，用数组传入["id", "name"], 可以支持子属性node.id，可以支持function
            valueField: null,
            // 获取文字的属性名称，可以用多个值进行组合，用数组传入["id", "name"], 可以支持子属性node.id，可以支持function
            textField: null,
            // 数据集
            viewData: null,
            // 内容格式化器，可以自定义内容
            itemFormatter: null,
            // 下拉框的宽度
            width: null
        };
    },
    _defineEvents: function() {
        return ["changing", "changed", "cancel"];
    },
    _create: function() {
        var fields, fieldMethods;
        this._super();

        this._current = null;
        this._selectList = [];

        fields = [this.option.valueField, this.option.textField];
        fieldMethods = ["_getValue", "_getText"];

        fields.forEach(function(item, index) {
            if(Array.isArray(item)) {
                this[fieldMethods[index]] = getArrayValue;
            } else if($.isFunction(item)) {
                this[fieldMethods[index]] = item;
            } else {
                this[fieldMethods[index]] = getValue;
            }
        }, this);

        //事件函数初始化
        this.onItemClickHandler = onItemClick.bind(this);
    },
    _render: function() {
        this.listPanel = $("<div class='ui-selection-list-panel border-highlight' />");
        this.listPanel.click(this.onItemClickHandler);

        this.wrapElement(this.element, this.listPanel);

        this._showClass = "ui-selection-list-show";
        this._clearClass = "ui-clear-text";
        this._clear = function() {
            this.cancelSelection();
        };
        this._selectTextClass = "ui-select-text";

        this.initPanelWidth(this.option.width);
        if (ui.core.isFunction(this.option.itemFormatter)) {
            this.itemFormatter = this.option.itemFormatter;
        } else {
            this.itemFormatter = defaultItemFormatter;
        }
        if (Array.isArray(this.option.viewData)) {
            this._fill(this.option.viewData);
        }
        this._super();
    },
    _fill: function (data) {
        var ul, li, i;

        this.clear();
        ul = $("<ul class='ui-selection-list-ul' />");
        for (i = 0; i < data.length; i++) {
            this.option.viewData.push(data[i]);

            li = $("<li class='ui-selection-list-li' />");
            if (this.isMultiple()) {
                li.append(this._createCheckbox());
            }
            li.append(this.itemFormatter(data[i], i, li));
            li.attr("data-index", i);
            ul.append(li);
        }
        this.listPanel.append(ul);
    },
    _createCheckbox: function() {
        var checkbox = $("<i class='fa fa-square' />");
        checkbox.addClass(checkboxClass);
        return checkbox;
    },
    _getItemIndex: function(li) {
        return parseInt(li.getAttribute("data-index"), 10);
    },
    _getSelectionData: function(li) {
        var index = this._getItemIndex(li),
            data = {},
            viewData = this.getViewData();
        data.itemData = viewData[index];
        data.itemIndex = index;
        return data;
    },
    _selectItem: function(elem, isSelection, isFire) {
        var eventData,
            checkbox,
            isMultiple,
            i, len;

        eventData = this._getSelectionData(elem[0]);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;
        
        isMultiple = this.isMultiple();
        if(isMultiple) {
            checkbox = elem.find("." + checkboxClass);
        }

        // 当前是要选中还是取消选中
        if(ui.core.isBoolean(isSelection)) {
            eventData.isSelection = isSelection;
        } else {
            if(isMultiple) {
                eventData.isSelection = !isChecked.call(this, checkbox);
            } else {
                eventData.isSelection = true;
            }
        }
        
        if(this.fire("changing", eventData) === false) {
            return;
        }

        if(isMultiple) {
            // 多选
            if(!eventData.isSelection) {
                // 当前要取消选中，如果本来就没选中则不用取消选中状态了
                if(!isChecked.call(this, checkbox)) {
                    return;
                }
                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if(this._selectList[i] === elem[0]) {
                        setChecked.call(this, checkbox, false);
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
            } else {
                // 当前要选中，如果已经是选中状态了就不再选中
                if(isChecked.call(this, checkbox)) {
                    return;
                }
                setChecked.call(this, checkbox, true);
                this._selectList.push(elem[0]);
            }
        } else {
            // 单选
            if (this._current) {
                if (this._current[0] == elem[0]) {
                    return;
                }
                this._current
                    .removeClass(selectedClass)
                    .removeClass("background-highlight");
            }
            this._current = elem;
            this._current
                .addClass(selectedClass)
                .addClass("background-highlight");
        }

        if(isFire === false) {
            return;
        }
        this.fire("changed", eventData);
    },
    _selectByValues: function(values, outArguments) {
        var count,
            viewData,
            item,
            i, j, len;

        count = values.length;
        values = values.slice(0);
        viewData = this.getViewData();
        for(i = 0, len = viewData.length; i < len; i++) {
            item = viewData[i];
            for(j = 0; j < count; j++) {
                if(this._equalValue(item, values[j])) {
                    outArguments.elem = 
                        $(this.listPanel.children("ul").children()[i]);
                    this._selectItem(outArguments.elem, true, false);
                    count--;
                    values.splice(j, 1);
                    break;
                }
            }
        }
    },
    _equalValue: function(item, value) {
        if(ui.core.isString(item)) {
            return item === value + "";
        } else if (ui.core.isObject(item) && !ui.core.isObject(value)) {
            return this._getValue.call(item, this.option.valueField) === value;
        } else {
            return this._getValue.call(item, this.option.valueField) === this._getValue.call(value, this.option.valueField);
        }
    },

    /// API
    /** 获取选中项 */
    getSelection: function() {
        var result = null,
            i, len;
        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                result.push(this._getSelectionData(this._selectList[i]).itemData);
            }
        } else {
            if(this._current) {
                result = this._getSelectionData(this._current[0]).itemData;
            }
        }
        return result;
    },
    /** 获取选中项的值 */
    getSelectionValues: function() {
        var result = null,
            item,
            i, len;
        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                item = this._getSelectionData(this._selectList[i]).itemData;
                result.push(this._getValue.call(item, this.option.valueField));
            }
        } else {
            if(this._current) {
                item = this._getSelectionData(this._current[0]).itemData;
                result = this._getValue.call(item, this.option.valueField);
            }
        }
        return result;
    },
    /** 设置选中项 */
    setSelection: function(values) {
        var outArguments,
            eventData;

        this.cancelSelection();
        if(this.isMultiple()) {
            if(!Array.isArray(values)) {
                values = [values];
            }
        } else {
            if(Array.isArray(values)) {
                values = [values[0]];
            } else {
                values = [values];
            }
        }

        outArguments = {
            elem: null
        };
        this._selectByValues(values, outArguments);
        if(outArguments.elem) {
            eventData = this._getSelectionData(outArguments.elem[0]);
            eventData.element = outArguments.elem;
            eventData.originElement = null;
            this.fire("changed", eventData);
        }
    },
    /** 取消选中 */
    cancelSelection: function(isFire) {
        var elem,
            i, len;
        if(this.isMultiple()) {
            for(i = 0, len = this._selectList.length; i < len; i++) {
                elem = $(this._selectList[i]);
                setChecked.call(this, elem.find("." + checkboxClass), false);
            }
            this._selectList = [];
        } else {
            if(this._current) {
                this._current
                    .removeClass(selectedClass)
                    .removeClass("background-highlight");
                this._current = null;
            }
        }
        if(isFire !== false) {
            this.fire("cancel");
        }
    },
    /** 设置视图数据 */
    setViewData: function(data) {
        if(Array.isArray(data)) {
            this._fill(data);
        }
    },
    /** 获取视图数据 */
    getViewData: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData : [];
    },
    /** 获取项目数 */
    count: function() {
        return this.viewData.length;
    },
    /** 是否可以多选 */
    isMultiple: function() {
        return this.option.multiple === true;
    },
    /** 清空列表 */
    clear: function() {
        this.option.viewData = [];
        this.listPanel.empty();
        this._current = null;
        this._selectList = [];
    }
});

$.fn.selectionList = function (option) {
    if (this.length === 0) {
        return null;
    }
    return ui.ctrls.SelectionList(option, this);
};


})(jQuery, ui);

// Source: src/control/select/selection-tree.js

(function($, ui) {
/**
 * 树形下拉列表，可以完美的解决多级联动下拉列表的各种弊端
 * 支持单项选择和多项选择
 */

var selectedClass = "ui-selection-tree-selected",
    checkboxClass = "ui-selection-tree-checkbox",
    foldClass = "fold-button",
    expandClass = "expand-button";

var instanceCount = 0,
    parentNode = "_selectionTreeParentNode";

var flodButtonLeft = 3,
    flodButtonWidth = 14;

function getParent() {
    return this[parentNode];
}
// 获取值
function getValue(field) {
    var value,
        arr,
        i, len;
    
    arr = field.split(".");
    value = this[arr[0]];
    for(i = 1, len = arr.length; i < len; i++) {
        value = value[arr[i]];
        if(value === undefined || value === null) {
            break;
        }
    }
    if(value === undefined) {
        value = null;
    }
    return value;
}
// 获取多个字段的值并拼接
function getArrayValue(fieldArray) {
    var result = [],
        value,
        i = 0;
    for(; i < fieldArray.length; i++) {
        value = this[fieldArray[i]];
        if(value === undefined) {
            value = null;
        }
        result.push(value + "");
    }
    return result.join("_");
}
function defaultItemFormatter(text, marginLeft, item) {
    var span = $("<span />").text(text);
    if(marginLeft > 0) {
        span.css("margin-left", marginLeft);
    }
    return span;
}
function setChecked(cbx, checked) {
    if(checked) {
        cbx.removeClass("fa-square")
            .addClass("fa-check-square").addClass("font-highlight");
    } else {
        cbx.removeClass("fa-check-square").removeClass("font-highlight")
            .addClass("fa-square");
    }
}
function isChecked(cbx) {
    return cbx.hasClass("fa-check-square");
}

// 事件处理函数
// 树节点点击事件
function onTreeItemClick(e) {
    var elem,
        nodeName,
        nodeData,
        hasChildren;

    if(this.isMultiple()) {
        e.stopPropagation();
    }

    elem = $(e.target);
    if(elem.hasClass(foldClass)) {
        e.stopPropagation();
        this.onTreeFoldClickHandler(e);
        return;
    }

    while((nodeName = elem.nodeName()) !== "DT" && 
            !elem.hasClass("ui-selection-tree-dt")) {
        
        if(elem.hasClass("ui-selection-tree-panel")) {
            return;
        }
        elem = elem.parent();
    }

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    nodeData = this._getNodeData(elem);
    hasChildren = this._hasChildren(nodeData);
    if(this.option.nodeSelectable === true || !hasChildren) {
        this._selectItem(elem, nodeData);
    } else {
        if(hasChildren) {
            e.stopPropagation();
            this.onTreeFoldClickHandler({
                target: elem.children(".fold-button")[0]
            });
        }
    }
}
// 折叠按钮点击事件
function onTreeFoldClick(e) {
    var elem, dt;

    elem = $(e.target);
    dt = elem.parent();
    if(elem.hasClass(expandClass)) {
        this._setChildrenExpandStatus(dt, false, elem);
    } else {
        this._setChildrenExpandStatus(dt, true, elem);
    }
}
// 异步状态点击折叠按钮事件
function onTreeFoldLazyClick(e) {
    var elem, dt, dd;

    elem = $(e.target);
    dt = elem.parent();
    dd = dt.next();
    if(elem.hasClass(expandClass)) {
        this._setChildrenExpandStatus(dt, false, elem);
    } else {
        this._setChildrenExpandStatus(dt, true, elem);
        if(dd.children().length === 0) {
            this._loadChildren(dt, dd, this._getNodeData(dt));
        }
    }
}

ui.ctrls.define("ui.ctrls.SelectionTree", ui.ctrls.DropDownBase, {
    _defineOption: function() {
        return {
            // 是否支持多选
            multiple: false,
            // 获取值的属性名称，可以用多个值进行组合，用数组传入["id", "name"], 可以支持子属性node.id，可以支持function
            valueField: null,
            // 获取文字的属性名称，可以用多个值进行组合，用数组传入["id", "name"], 可以支持子属性node.id，可以支持function
            textField: null,
            // 获取父节点的属性名称，可以用多个值进行组合，用数组传入["id", "name"], 可以支持子属性node.id，可以支持function
            parentField: null,
            // 子节点的属性名称，子节点为数组，和parentField互斥，如果两个值都设置了，优先使用childField
            childField: null,
            // 视图数据
            viewData: null,
            // 是否可以选择父节点
            nodeSelectable: true,
            // 默认展开的层级，false|0：显示第一层级，true：显示所有层级，数字：显示的层级值(0表示根级别，数值从1开始)
            defaultExpandLevel: false,
            // 是否延迟加载，只有用户展开这个节点才会渲染节点下面的数据（对大数据量时十分有效）
            lazy: false,
            // 内容格式化器，可以自定义内容
            itemFormatter: null,
            // 下拉框的宽度
            width: null
        };
    },
    _defineEvents: function() {
        return ["changing", "changed", "cancel"];
    },
    _create: function() {
        var fields, fieldMethods;

        this._super();
        this._current = null;
        this._selectList = [];
        this._treePrefix = "selectionTree_" + (++instanceCount) + "_";
        
        fields = [this.option.valueField, this.option.textField, this.option.parentField];
        fieldMethods = ["_getValue", "_getText", "_getParent"];
        fields.forEach(function(item, index) {
            if(Array.isArray(item, index)) {
                this[fieldMethods[index]] = getArrayValue;
            } else if($.isFunction(item)) {
                this[fieldMethods[index]] = item;
            } else {
                this[fieldMethods[index]] = getValue;
            }
        }, this);

        if(this.option.defaultExpandLevel === false) {
            this.expandLevel = 0;
        } else {
            if(ui.core.isNumber(this.option.defaultExpandLevel)) {
                this.expandLevel = 
                    this.option.defaultExpandLevel <= 0 ? 0 : this.option.defaultExpandLevel;
            } else {
                // 设置到最大展开1000层
                this.expandLevel = 1000;
            }
        }

        if(this.option.lazy) {
            if(ui.core.isFunction(this.option.lazy.hasChildren)) {
                this._hasChildren = this.option.lazy.hasChildren;
            }
            if(ui.core.isFunction(this.option.lazy.loadChildren)) {
                this._loadChildren = this.option.lazy.loadChildren;
                // 当数据延迟加载是只能默认加载根节点
                this.expandLevel = 0;
            }

            this.onTreeFoldClickHandler = onTreeFoldLazyClick.bind(this);
            this.option.lazy = true;
        } else {
            this.onTreeFoldClickHandler = onTreeFoldClick.bind(this);
            this.option.lazy = false;
        }

        if(!ui.core.isFunction(this.option.itemFormatter)) {
            this.option.itemFormatter = defaultItemFormatter;
        }

        this.onTreeItemClickHandler = onTreeItemClick.bind(this);
    },
    _render: function() {
        this.treePanel = $("<div class='ui-selection-tree-panel border-highlight' />");
        this.treePanel.click(this.onTreeItemClickHandler);
        this.wrapElement(this.element, this.treePanel);

        this._showClass = "ui-selection-tree-show";
        this._clearClass = "ui-clear-text";
        this._clear = function() {
            this.cancelSelection();
        };
        this._selectTextClass = "ui-select-text";

        this.initPanelWidth(this.option.width);
        if (ui.core.isFunction(this.option.itemFormatter)) {
            this.itemFormatter = this.option.itemFormatter;
        } else {
            this.itemFormatter = defaultItemFormatter;
        }
        if (Array.isArray(this.option.viewData)) {
            this._fill(this.option.viewData);
        }
        this._super();
    },
    _fill: function (data) {
        var dl,
            viewData;

        this.clear();
        this.option.viewData = data;

        dl = $("<dl class='ui-selection-tree-dl' />");
        viewData = this.getViewData();
        if (this.option.childField) {
            this._renderTree(viewData, dl, 0);
        } else if (this.option.parentField) {
            this._listDataToTree(viewData, dl, 0);
        }
        this.treePanel.append(dl);
    },
    _listDataToTree: function(viewData, dl, level) {
        var childField;
        if(!Array.isArray(viewData) || viewData.length === 0) {
            return;
        }

        this.originalViewData = viewData;
        childField = "children";
        viewData = ui.trans.listToTree(
            viewData, 
            this.option.parentField, 
            this.option.valueField, 
            childField);
        if(viewData) {
            this.option.childField = childField;
            this.option.viewData = viewData;
            this._renderTree(viewData, dl, level);
        } else {
            delete this.originalViewData;
        }
    },
    _renderTree: function(list, dl, level, idValue, parentData) {
        var id, text, children,
            item, i, len, tempMargin,
            childDL, dt, dd, cbx,
            path;
        if(!Array.isArray(list) || list.length === 0) {
            return;
        }

        path = idValue;
        for(i = 0, len = list.length; i < len; i++) {
            tempMargin = 0;
            item = list[i];
            item[parentNode] = parentData || null;
            item.getParent = getParent;

            id = path ? (path + "_" + i) : ("" + i);
            text = this._getText.call(item, this.option.textField) || "";

            dt = $("<dt class='ui-selection-tree-dt' />");
            if(this.isMultiple()) {
                cbx = this._createCheckbox();
            }
            dt.prop("id", this._treePrefix + id);
            dl.append(dt);

            if(this._hasChildren(item)) {
                children = this._getChildren(item);
                dd = $("<dd class='ui-selection-tree-dd' />");

                if(level + 1 <= this.expandLevel) {
                    dt.append(this._createFoldButton(level, expandClass, "fa-angle-down"));
                } else {
                    dt.append(this._createFoldButton(level, "fa-angle-right"));
                    dd.css("display", "none");
                }
                if(this.option.nodeSelectable === true && cbx) {
                    dt.append(cbx);
                }

                if(this.option.lazy) {
                    if(level + 1 <= this.expandLevel) {
                        this._loadChildren(dt, dd, item);
                    }
                } else {
                    childDL = $("<dl class='ui-selection-tree-dl' />");
                    this._renderTree(children, childDL, level + 1, id, item);
                    dd.append(childDL);
                }
                dl.append(dd);
            } else {
                tempMargin = (level + 1) * (flodButtonWidth + flodButtonLeft) + flodButtonLeft;
                if(cbx) {
                    cbx.css("margin-left", tempMargin + "px");
                    tempMargin = 0;
                    dt.append(cbx);
                }
            }
            dt.append(
                this.option.itemFormatter.call(this, text, tempMargin, item, dt));
        }
    },
    _createCheckbox: function() {
        var checkbox = $("<i class='fa fa-square' />");
        checkbox.addClass(checkboxClass);
        return checkbox;
    },
    _createFoldButton: function(level) {
        var btn, i, len;
        
        btn = $("<i class='fold-button font-highlight-hover fa' />");
        for (i = 1, len = arguments.length; i < len; i++) {
            btn.addClass(arguments[i]);
        }
        btn.css("margin-left", (level * (flodButtonWidth + flodButtonLeft) + flodButtonLeft) + "px");
        return btn;
    },
    _setChildrenExpandStatus: function(dt, isOpen, btn) {
        var dd = dt.next();
        if(!btn || btn.length === 0) {
            btn = dt.children(".fold-button");
        }
        if(isOpen) {
            btn.addClass(expandClass)
                .removeClass("fa-angle-right")
                .addClass("fa-angle-down");
            dd.css("display", "block");
        } else {
            btn.removeClass(expandClass)
                .removeClass("fa-angle-down")
                .addClass("fa-angle-right");
            dd.css("display", "none");
        }
    },
    _getChildren: function (nodeData) {
        return nodeData[this.option.childField] || null;
    },
    _hasChildren: function(nodeData) {
        var children = this._getChildren(nodeData);
        return Array.isArray(children) && children.length > 0;
    },
    _loadChildren: function(dt, dd, nodeData) {
        var children,
            dl;
        
        children = this._getChildren(nodeData);
        if(Array.isArray(children) && children.length > 0) {
            dl = $("<dl />");
            this._renderTree(
                children,
                dl,
                this._getLevel(nodeData) + 1,
                ui.str.trimLeft(dt.prop("id"), this._treePrefix),
                nodeData);
            dd.append(dl);
        }
    },
    _getLevel: function(nodeData) {
        var level = 0;
        while(nodeData[parentNode]) {
            level++;
            nodeData = nodeData[parentNode];
        }
        return level;
    },
    _getNodeData: function(elem) {
        var id;
        if(!elem) {
            return null;
        }
        id = elem.prop("id");
        if(id.length === 0 || id.indexOf(this._treePrefix) !== 0) {
            return null;
        }
        id = id.substring(this._treePrefix.length);
        return this._getNodeDataByPath(id);
    },
    _getNodeDataByPath: function(path) {
        var arr, data, viewData,
            i, len;
        if(!path) {
            return null;
        }
        arr = path.split("_");
        viewData = this.getViewData();
        data = viewData[parseInt(arr[0], 10)];
        for(i = 1, len = arr.length; i < len; i++) {
            data = this._getChildren(data)[parseInt(arr[i], 10)];
        }
        return data;
    },
    _getSelectionData: function(dt, nodeData) {
        var data = {};
        if(!nodeData) {
            nodeData = this._getNodeData(dt);
        }
        data.nodeData = nodeData;
        data.children = this._getChildren(nodeData);
        data.parent = nodeData[parentNode];
        data.isRoot = !nodeData[parentNode];
        data.isNode = this._hasChildren(nodeData);
        return data;
    },
    _selectItem: function(elem, nodeData, isSelection, isFire) {
        var eventData,
            checkbox,
            isMultiple,
            i, len;

        eventData = this._getSelectionData(elem, nodeData);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        isMultiple = this.isMultiple();
        if(isMultiple) {
            checkbox = elem.find("." + checkboxClass);
        }

        // 当前是要选中还是取消选中
        if(ui.core.isBoolean(isSelection)) {
            eventData.isSelection = isSelection;
        } else {
            if(isMultiple) {
                eventData.isSelection = !isChecked.call(this, checkbox);
            } else {
                eventData.isSelection = true;
            }
        }

        if(this.fire("changing", eventData) === false) {
            return;
        }

        if(isMultiple) {
            // 多选
            if(!eventData.isSelection) {
                // 当前要取消选中，如果本来就没选中则不用取消选中状态了
                if(!isChecked.call(this, checkbox)) {
                    return;
                }
                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if(this._selectList[i] === elem[0]) {
                        setChecked.call(this, checkbox, false);
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
            } else {
                // 当前要选中，如果已经是选中状态了就不再选中
                if(isChecked.call(this, checkbox)) {
                    return;
                }
                setChecked.call(this, checkbox, true);
                this._selectList.push(elem[0]);
            }
        } else {
            // 单选
            if (this._current) {
                if (this._current[0] == elem[0]) {
                    return;
                }
                this._current
                    .removeClass(selectedClass)
                    .removeClass("background-highlight");
            }
            this._current = elem;
            this._current
                .addClass(selectedClass)
                .addClass("background-highlight");
        }

        if(isFire === false) {
            return;
        }
        this.fire("changed", eventData);
    },
    _selectTreeByValues: function(list, values, level, path, outArguments) {
        var i, j, len,
            item, id;

        if(!Array.isArray(list) || list.length === 0) {
            return;
        }
        if(!Array.isArray(values) || values.length === 0) {
            return;
        }

        for(i = 0, len = list.length; i < len; i++) {
            item = list[i];
            id = path ? (path + "_" + i) : ("" + i);
            
            for(j = 0; j < values.length; j++) {
                if(this._equalValue(item, values[j])) {
                    outArguments.elem = this._selectNodeByValue(item, id);
                    values.splice(j, 1);
                    break;
                }
            }
            if(values.length === 0) {
                break;
            }
            this._selectTreeByValues(
                this._getChildren(item), values, level + 1, id, outArguments);
        }
    },
    _equalValue: function(item, value) {
        if (ui.core.isObject(item) && !ui.core.isObject(value)) {
            return this._getValue.call(item, this.option.valueField) === value;
        } else {
            return this._getValue.call(item, this.option.valueField) === this._getValue.call(value, this.option.valueField);
        }
    },
    _selectNodeByValue: function(nodeData, path) {
        var dt, tempId, needAppendElements, pathArray,
            i, treeNodeDT, treeNodeDD;
        
        if(this.option.lazy) {
            needAppendElements = [];
            pathArray = path.split("_");

            tempId = "#" + this._treePrefix + path;
            dt = $(tempId);
            while(dt.length === 0) {
                needAppendElements.push(tempId);
                pathArray.splice(pathArray.length - 1, 1);
                if(pathArray.length === 0) {
                    break;
                }
                tempId = "#" + this._treePrefix + pathArray.join("_");
                dt = $(tempId);
            }
            if (dt.length === 0) {
                return;
            }
            for (i = needAppendElements.length - 1; i >= 0; i--) {
                treeNodeDT = dt;
                treeNodeDD = treeNodeDT.next();
                this._loadChildren(treeNodeDT, treeNodeDD, this._getNodeData(treeNodeDT));
                dt = $(needAppendElements[i]);
            }
        } else {
            dt = $("#" + this._treePrefix + path);
        }

        treeNodeDD = dt.parent().parent();
        while (treeNodeDD.nodeName() === "DD" && 
                treeNodeDD.hasClass("ui-selection-tree-dd")) {

            treeNodeDT = treeNodeDD.prev();
            if (treeNodeDD.css("display") === "none") {
                this._setChildrenExpandStatus(treeNodeDT, true);
            }
            treeNodeDD = treeNodeDT.parent().parent();
        }
        this._selectItem(dt, nodeData, true, false);
        return dt;
    },
    _selectChildNode: function (nodeData, dt, isSelection) {
        var children,
            parentId,
            dd,
            i, len;

        children = this._getChildren(nodeData);
        if (!Array.isArray(children) || children.length === 0) {
            return;
        }
        parentId = dt.prop("id");
        dd = dt.next();

        if (this.option.lazy && dd.children().length === 0) {
            this._loadChildren(dt, dd, nodeData);
        }
        for (i = 0, len = children.length; i < len; i++) {
            nodeData = children[i];
            dt = $("#" + parentId + "_" + i);
            this._selectItem(dt, nodeData, isSelection, false);
            this._selectChildNode(nodeData, dt, isSelection);
        }
    },
    _selectParentNode: function (nodeData, nodeId, isSelection) {
        var parentNodeData, parentId,
            elem, nextElem, dtList, 
            i, len, checkbox;

        parentNodeData = nodeData[parentNode];
        if (!parentNodeData) {
            return;
        }
        parentId = nodeId.substring(0, nodeId.lastIndexOf("_"));
        elem = $("#" + parentId);
        if (!isSelection) {
            nextElem = elem.next();
            if (nextElem.nodeName() === "DD") {
                dtList = nextElem.find("dt");
                for (i = 0, len = dtList.length; i < len; i++) {
                    checkbox = $(dtList[i]).find("." + checkboxClass);
                    if (isChecked.call(this, checkbox)) {
                        return;
                    }
                }
            }
        }
        this._selectItem(elem, parentNodeData, isSelection, false);
        this._selectParentNode(parentNodeData, parentId, isSelection);
    },

    /// API
    /** 获取选中项 */
    getSelection: function() {
        var result = null,
            i, len;
        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                result.push(this._getNodeData($(this._selectList[i])));
            }
        } else {
            if(this._current) {
                result = this._getNodeData(this._current);
            }
        }
        return result;
    },
    /** 获取选中项的值 */
    getSelectionValues: function() {
        var result = null,
            item,
            i, len;
        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                item = this._getNodeData($(this._selectList[i]));
                result.push(this._getValue.call(item, this.option.valueField));
            }
        } else {
            if(this._current) {
                item = this._getNodeData(this._current);
                result = this._getValue.call(item, this.option.valueField);
            }
        }
        return result;
    },
    /** 设置选中项 */
    setSelection: function(values) {
        var outArguments,
            viewData,
            eventData;

        this.cancelSelection();
        if(this.isMultiple()) {
            if(Array.isArray(values)) {
                values = Array.from(values);
            } else {
                values = [values];
            }
        } else {
            if(Array.isArray(values)) {
                values = [values[0]];
            } else {
                values = [values];
            }
        }

        outArguments = {
            elem: null
        };
        viewData = this.getViewData();
        this._selectTreeByValues(viewData, values, 0, null, outArguments);
        if(outArguments.elem) {
            eventData = this._getSelectionData(outArguments.elem);
            eventData.element = outArguments.elem;
            eventData.originElement = null;
            eventData.isSelection = true;
            this.fire("changed", eventData);
        }
    },
    /** 选择一个节点的所有子节点 */
    selectChildNode: function(nodeElement, isSelection) {
        var nodeData;
        if(arguments.length === 1) {
            isSelection = true;
        } else {
            isSelection = !!isSelection;
        }

        nodeData = this._getNodeData(nodeElement);
        if(!nodeData) {
            return;
        }
        if(!this.isMultiple() || this.option.nodeSelectable !== true) {
            return;
        }
        this._selectChildNode(nodeData, nodeElement, isSelection);
    },
    /** 选择一个节点的所有父节点 */
    selectParentNode: function(nodeElement, isSelection) {
        var nodeData,
            nodeId;
        if(arguments.length === 1) {
            isSelection = true;
        } else {
            isSelection = !!isSelection;
        }

        nodeData = this._getNodeData(nodeElement);
        if(!nodeData) {
            return;
        }
        if(!this.isMultiple() || this.option.nodeSelectable !== true) {
            return;
        }
        nodeId = nodeElement.prop("id");
        this._selectParentNode(nodeData, nodeId, isSelection);
    },
    /** 取消选中 */
    cancelSelection: function(isFire) {
        var elem,
            i, len;
        if(this.isMultiple()) {
            for(i = 0, len = this._selectList.length; i < len; i++) {
                elem = $(this._selectList[i]);
                setChecked.call(this, elem.find("." + checkboxClass), false);
            }
            this._selectList = [];
        } else {
            if(this._current) {
                this._current
                    .removeClass(selectedClass)
                    .removeClass("background-highlight");
                this._current = null;
            }
        }

        if(isFire !== false) {
            this.fire("cancel");
        }
    },
    /** 设置视图数据 */
    setViewData: function(data) {
        if(Array.isArray(data)) {
            this._fill(data);
        }
    },
    /** 获取视图数据 */
    getViewData: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData : [];
    },
    /** 获取项目数 */
    count: function() {
        return this.viewData.length;
    },
    /** 是否可以多选 */
    isMultiple: function() {
        return this.option.multiple === true;
    },
    /** 清空列表 */
    clear: function() {
        this.option.viewData = [];
        this.treePanel.empty();
        this._current = null;
        this._selectList = [];
        delete this.originalViewData;
    }
});

$.fn.selectionTree = function (option) {
    if (this.length === 0) {
        return null;
    }
    return ui.ctrls.SelectionTree(option, this);
};


})(jQuery, ui);

// Source: src/control/select/selection-tree4autocomplete.js

(function($, ui) {

/**
 * 支持自动完成的下拉树
 */

var selectedClass = "autocomplete-selected";

function onFocus(e) {
    ui.hideAll(this);
    this._resetTreeList();
    this.show();
}
function onKeyup(e) {
    if(e.which === ui.keyCode.DOWN) {
        this._moveSelection(1);
    } else if(e.which === ui.keyCode.UP) {
        this._moveSelection(-1);
    } else if(e.which === ui.keyCode.ENTER) {
        this._selectCompleter();
    }
}
function onMouseover(e) {
    var elem = $(e.target),
        nodeName;

    while((nodeName = elem.nodeName()) !== "DT" && 
            !elem.hasClass("autocomplete-dt")) {
        
        if(elem.hasClass("autocomplete-dl")) {
            return;
        }
        elem = elem.parent();
    }
    if(this._currentCompleterElement) {
        this._currentCompleterElement.removeClass(selectedClass);
    }
    this._currentCompleterElement = elem;
    this._currentCompleterElement.addClass(selectedClass);
}
function onClick(e) {
    e.stopPropagation();
    this._selectCompleter();
}
function onTextinput(e) {
    var elem = $(e.target),
        value = elem.val(),
        oldValue = elem.data("autocomplete.value");
    if(this._cancelAutoComplete) {
        return;
    }
    if(value.length === 0) {
        this._resetTreeList();
        this.cancelSelection();
        return;
    }
    if(this._autoCompleteListIsShow() && oldValue === value) {
        return;
    }
    elem.data("autocomplete.value", value);
    if(!this.isShow()) {
        this.show();
    }
    this._launch(value);
}


ui.ctrls.define("ui.ctrls.AutocompleteSelectionTree", ui.ctrls.SelectionTree, {
    _create: function() {
        // 只支持单选
        this.option.multiple = false;
        // 设置最小结果显示条数，默认是10条
        if(!ui.core.isNumber(this.option.limit)) {
            this.option.limit = 10;
        } else {
            if(this.option.limit <= 0) {
                this.option.limit = 10;
            } else if(this.option.limit > 100) {
                this.option.limit = 100;
            }
        }

        // 初始化事件处理函数
        this.onFocusHandler = onFocus.bind(this);
        this.onKeyupHandler = onKeyup.bind(this);
        this.onMouseoverHandler = onMouseover.bind(this);
        this.onClickHandler = onClick.bind(this);
        this.onTextinputHandler = onTextinput.bind(this);

        this._super();
    },
    _render: function() {
        var oldFireFn;

        this._super({
            focus: this.onFocusHandler,
            keyup: this.onKeyupHandler
        });

        if(ui.browser.ie && ui.browser < 9) {
            oldFireFn = this.fire;
            this.fire = function() {
                this._callAndCancelPropertyChange(oldFireFn, arguments);
            };
        }
        this.element.textinput(this.onTextinputHandler);
        this._clear = function() {
            this.cancelSelection(true, this._autoCompleteListIsShow());
        };
    },
    _callAndCancelPropertyChange: function(fn, args) {
        //修复IE8下propertyChange事件由于用户赋值而被意外触发
        this._cancelAutoComplete = true;
        fn.apply(this, args);
        this._cancelAutoComplete = false;
    },
    _launch: function(searchText) {
        var viewData = this.getViewData(),
            response;
        if(viewData.length === 0) {
            return;
        }
        this.cancelSelection(false, false);
        response = this._search(searchText, viewData, this.option.limit);
        this._showSearchInfo(response, searchText);
    },
    _search: function(searchText, viewData, limit) {
        var beginArray = [], 
            containArray = [],
            result;
        
        searchText = searchText.toLowerCase();
        this._doSearch(beginArray, containArray, searchText, viewData, limit);
        result = beginArray.concat(containArray);
        return result.slice(0, limit);
    },
    _doSearch: function(beginArray, containArray, searchText, viewData, limit, path) {
        var i, len, 
            nodeData, id;
        
        for(i = 0, len = viewData.length; i < len; i++) {
            if(beginArray.length > limit) {
                return;
            }
            id = path ? (path + "_" + i) : ("" + i);
            nodeData = viewData[i];
            if(this._hasChildren(nodeData)) {
                if(this.option.nodeSelectable === true) {
                    this._doQuery(beginArray, containArray, searchText, nodeData, id);
                }
                this._doSearch(beginArray, containArray, searchText, this._getChildren(nodeData), limit, id);
            } else {
                this._doQuery(beginArray, containArray, searchText, nodeData, id);
            }
        }
    },
    _doQuery: function(beginArray, containArray, searchText, nodeData, path) {
        var index;
        index = this._getText.call(nodeData, this.option.textField)
                    .toLowerCase()
                    .search(searchText);
        if(index === 0) {
            beginArray.push({ nodeData: nodeData, path: path });
        } else if(index > 0) {
            containArray.push({ nodeData: nodeData, path: path });
        }
    },
    _showSearchInfo: function(info, searchText) {
        var dl, html, textHtml, 
            regexp, hintHtml,
            i, len;
        
        dl = this._autoCompleteList;
        if(!dl) {
            dl = this._autoCompleteList = $("<dl class='autocomplete-dl' />");
            dl.hide();
            dl.click(this.onClickHandler)
                .mouseover(this.onMouseoverHandler);
            this.treePanel.append(dl);
        } else {
            dl.empty();
        }

        html = [];
        regexp = new RegExp(searchText, "gi");
        hintHtml = "<span class='font-highlight'>" + searchText + "</span>";
        for(i = 0, len = info.length; i < len; i++) {
            html.push("<dt class='autocomplete-dt' data-path='" + info[i].path + "'>");
            html.push("<span class='normal-text'>");
            textHtml = this._getText.call(info[i].nodeData, this.option.textField);
            textHtml = textHtml.replace(regexp, hintHtml);
            html.push(textHtml);
            html.push("</span></dt>");
        }
        $(this.treePanel.children()[0]).hide();
        dl.append(html.join(""));
        dl.show();
        this._moveSelection(1);
    },
    _autoCompleteListIsShow: function() {
        if(this._autoCompleteList) {
            return this._autoCompleteList.css("display") === "block";
        } else {
            return false;
        }
    },
    _resetTreeList: function() {
        var children = this.treePanel.children();
        $(children[1]).hide();
        $(children[0]).show();
    },
    _selectCompleter: function() {
        var path, nodeData, dt;
        if(this._currentCompleterElement) {
            path = this._currentCompleterElement.attr("data-path");
            nodeData = this._getNodeDataByPath(path);
            if (nodeData) {
                dt = this._selectNodeByValue(nodeData, path);
                //触发选择事件
                this.fire("changed", this._getSelectionData(dt, nodeData));
            }
            ui.hideAll();
        }
    },
    _moveSelection: function(step) {
        var children,
            elem;

        children = $(this.treePanel.children()[1]).children();
        if(!this._currentCompleterElement) {
            this._currentCompleterElement = $(children[0]);
        } else {
            this._currentCompleterElement.removeClass(selectedClass);
        }

        if(step === 0) {
            this._currentCompleterElement = $(children[0]);
        } else if(step === 1) {
            elem = this._currentCompleterElement.next();
            if(elem.length === 0) {
                elem = $(children[0]);
            }
            this._currentCompleterElement = elem;
        } else if(step === -1) {
            elem = this._currentCompleterElement.prev();
            if(elem.length === 0) {
                elem = $(children[children.length - 1]);
            }
            this._currentCompleterElement = elem;
        }
        this._currentCompleterElement.addClass(selectedClass);
    },
    _selectItem: function() {
        this._callAndCancelPropertyChange(this._super, arguments);
    },

    // API
    /** 取消选中 */
    cancelSelection: function(isFire, justAutoCompleteListCancel) {
        if(justAutoCompleteListCancel) {
            this._callAndCancelPropertyChange(function() {
                this.element.val("");
            });
            this._resetTreeList();
        } else {
            this._super(isFire);
        }
    }
});

$.fn.autocompleteSelectionTree = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.AutocompleteSelectionTree(option, this);
};


})(jQuery, ui);

// Source: src/control/view/calendar-view.js

(function($, ui) {
// CalendarView
var timeTitleWidth = 80,
    hourHeight = 25,
    currentTimeLineHeight = 17,
    sundayFirstWeek = ["日", "一", "二", "三", "四", "五", "六"],
    mondayFirstWeek = ["一", "二", "三", "四", "五", "六", "日"],
    viewTypes;

function noop() {}
function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}
function formatTime (date, beginDate) {
    var h = date.getHours(),
        m = date.getMinutes(),
        s = date.getSeconds();
    var tempDate, value;
    if (beginDate) {
        tempDate = new Date(beginDate.getFullYear(), beginDate.getMonth(), beginDate.getDate(), 0, 0, 0);
        value = date - tempDate;
        value = value / 1000 / 60 / 60;
        if (value >= 24) {
            h = 24;
        }
    }
    return [
        twoNumberFormatter(h),
        ":",
        twoNumberFormatter(m),
        ":",
        twoNumberFormatter(s)].join("");
}
function defaultFormatDateHeadText(date) {
    return (date.getMonth() + 1) + " / " + date.getDate() + "（" + sundayFirstWeek[date.getDay()] + "）";
}

// 事件处理
// 年视图日期点击事件
function onYearItemClick(e) {
    var elem = $(e.target),
        nodeName;
    while ((nodeName = elem.nodeName()) !== "TD") {
        if (nodeName === "TABLE") {
            return;
        }
        elem = elem.parent();
    }

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    this._selectItem(elem);
}
// 月视图日期点击事件
function onMouseItemClick(e) {
    var elem = $(e.target),
        nodeName;
    while ((nodeName = elem.nodeName()) !== "TD") {
        if (nodeName === "TABLE") {
            return;
        }
        elem = elem.parent();
    }

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    this._selectItem(elem);
}
// 周视图标题点击事件
function onWeekHeadItemClick(e) {
    var th = $(e.target),
        eventData,
        nodeName;
    while ((nodeName = th.nodeName()) !== "TH") {
        if(nodeName === "TABLE") {
            return;
        }
        th = th.parent();
    }
    eventData = {
        view: this,
        index: th[0].cellIndex
    };
    this.calendar.fire("weekTitleClick", eventData);
}
// 日视图标题点击事件
function onDayHeadItemClick(e) {
    var eventData = {
        view: this,
        index: 0
    };
    this.calendar.fire("weekTitleClick", eventData);
}

// 年视图
function YearView(calendar) {
    if(this instanceof YearView) {
        this.initialize(calendar);
    } else {
        return new YearView(calendar);
    }
}
YearView.prototype = {
    constructor: YearView,
    initialize: function(calendar) {
        this.calendar = calendar;
        this.initialled = false;
        this.year = null;

        this._selectList = [];
        this._current = null;

        this.width = null;
        this.height = null;

        this.viewPanel = $("<div class='calendar-view-panel' />");
        this.calendar.element.append(this.viewPanel);
    },
    render: function() {
        if (this.initialled) {
            return;
        }

        // 日期项点击事件
        this.onYearItemClickHandler = onYearItemClick.bind(this);

        this.yearPanel = $("<div class='ui-calendar-year-view' />");
        this._initYear();
        this.viewPanel.append(this.yearPanel);

        this.initialled = true;
    },
    _initYear: function() {
        var div, i;
        for (i = 0; i < 12; i++) {
            div = $("<div class='year-month-panel' />");
            div.append(
                $("<div class='year-month-title' />")
                    .append("<span class='font-highlight'>" + (i + 1) + "月" + "</span>"));
            div.append("<div class='year-month-content' />");
            this.yearPanel.append(div);
        }
        this.yearPanel.append("<br clear='all' />");
    },
    _oddStyle: function (monthPanel, count, i) {
        if (i % 2) {
            monthPanel.addClass("year-month-odd");
        }
    },
    _evenStyle: function (monthPanel, count, i) {
        if (Math.floor(i / count) % 2) {
            if (i % 2) {
                monthPanel.addClass("year-month-odd");
            }
        } else {
            if (i % 2 === 0) {
                monthPanel.addClass("year-month-odd");
            }
        }
    },
    _setCellSize: function (width, height) {
        var count,
            oddFn,
            cells, cell, 
            unitWidth, unitHeight,
            i;

        if(!width || !height) {
            return;
        }
        if(this.width === width && this.height === height) {
            return;
        }

        this.width = width;
        this.height = height;

        count = this.getMonthCount(width);
        if (count % 2) {
            oddFn = this._oddStyle;
        } else {
            oddFn = this._evenStyle;
        }

        cells = this.yearPanel.children();
        cells.removeClass("year-month-odd");

        unitWidth = Math.floor(width / count);
        unitHeight = Math.floor(unitWidth / 4 * 3);
        if (unitHeight * (12 / count) > height || this.yearPanel[0].scrollHeight > height) {
            width -= ui.scrollbarWidth;
            unitWidth = Math.floor(width / count);
        }
        if (unitHeight < 248) {
            unitHeight = 248;
        }
        for (i = 0; i < 12; i++) {
            cell = $(cells[i]);
            cell.css({
                width: unitWidth + "px",
                height: unitHeight + "px"
            });
            cell.children(".year-month-content")
                .css("height", unitHeight - 48 + "px");
            oddFn.call(this, cell, count, i);
        }
    },
    _changeYear: function(yearDate) {
        this.calendar.currentDate = yearDate;
        this.year = this.calendar.currentDate.getFullYear();
        this._setCellSize(
            this.viewPanel.width(), this.viewPanel.height());
        this._updateYear();

        this._current = null;
        this._selectList = [];
    },
    _updateYear: function () {
        var cells = this.yearPanel.children(".year-month-panel"),
            year = this.calendar.currentDate.getFullYear(),
            cell = null,
            today = new Date(), 
            i;
        for (i = 0; i < 12; i++) {
            cell = $(cells[i]);
            this._createMonth($(cell.children()[1]), year, i, today);
        }
    },
    _createMonth: function (content, year, month, today) {
        var table, colgroup, thead, tbody, row, cell,
            week, dayNum, startIndex, last,
            flag, day, dayVal,
            i, j, that;

        table = $("<table class='year-month-table unselectable' cellspacing='0' cellpadding='0' />");
        colgroup = $("<colgroup />");
        thead = $("<thead />");
        tbody = $("<tbody />");
        week = this.calendar.getWeekNames();
        row = $("<tr />");
        for(i = 0; i < week.length; i++) {
            colgroup.append("<col />");
            if(this.calendar.isWeekend(i)) {
                flag = "<th class='year-month-table-head ui-calendar-weekend'>";
            } else {
                flag = "<th class='year-month-table-head'>";
            }
            row.append(flag + week[i] + "</th>");
        }
        thead.append(row);

        dayNum = 1;
        startIndex = this.calendar.getWeekIndexOf(
            new Date(year, month, dayNum));
        last = (new Date(year, month + 1, 0)).getDate();
        flag = false;
        if (year === today.getFullYear() && month === today.getMonth()) {
            flag = true;
            day = today.getDate();
        }

        for (i = 0; i < 6; i++) {
            row = $("<tr />");
            for (j = 0; j < 7; j++) {
                cell = $("<td class='year-month-table-cell' />");
                row.append(cell);
                if (i === 0 && j < startIndex) {
                    cell.addClass("ui-calendar-empty");
                    continue;
                } else if (dayNum <= last) {
                    dayVal = $("<span>" + dayNum + "</span>");
                    if (flag && dayNum === day) {
                        dayVal.addClass("today")
                            .addClass("background-highlight");
                    }
                    cell.append(dayVal);
                    dayNum++;
                }
            }
            tbody.append(row);
        }
        table.append(colgroup).append(thead).append(tbody);
        content.empty().append(table);

        table.data("month", month);
        table.click(this.onYearItemClickHandler);
    },
    _isDateCell: function(td) {
        return !td.hasClass("ui-calendar-empty") && td.children().length > 0;
    },
    _getDateByCell: function(elem) {
        var table,
            month,
            day;
        table = elem.parent().parent().parent();
        month = parseInt(table.data("month"), 10);
        day = parseInt(elem.children().text(), 10);
        return new Date(this.year, month, day);
    },
    _getCellByDate: function(months, date) {
        var month,
            indexer,
            dayCell;

        month = $($(months[date.getMonth()]).children()[1]);
        indexer = this.calendar.getTableIndexOf(date);
        dayCell = $(month.children()[0].tBodies[0].rows[indexer.rowIndex].cells[indexer.cellIndex]);
        return dayCell;
    },
    _selectItem: function(elem) {
        var eventData,
            selectedClass = "selected",
            i, len;
        if (!this._isDateCell(elem)) {
            return;
        }

        eventData = {};
        eventData.date = this._getDateByCell(elem);
        eventData.view = this;
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;
        
        if(this.calendar.fire("selecting", eventData) === false) {
            return;
        }

        if(this.isMultiple()) {
            if(elem.hasClass(selectedClass)) {
                elem.removeClass(selectedClass);
                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if (this._selectList[i] === elem[0]) {
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
                this.calendar.fire("deselected", eventData);
            } else {
                elem.addClass(selectedClass);
                this._selectList.push(elem[0]);
                this.calendar.fire("selected", eventData);
            }
        } else {
            if(this._current) {
                this._current.removeClass(selectedClass);
                if(this._current[0] === elem[0]) {
                    this.calendar.fire("deselected", eventData);
                    return;
                }
                this._current = null;
            }
            this._current = elem;
            this._current.addClass(selectedClass);
            this.calendar.fire("selected", eventData);
        }
    },
    _updateSchedules: function(data, dateField, action) {
        var months, getDateFn,
            date, dayCell,
            i, len, item, 
            isFunctionValue;

        if(!Array.isArray(data)) {
            return;
        }
        if(!dateField) {
            dateField = "date";
        }
        if(ui.core.isFunction(dateField)) {
            getDateFn = dateField; 
        } else {
            getDateFn = function() {
                return this[dateField];
            };
        }
        isFunctionValue = ui.core.isFunction(action);

        months = this.yearPanel.children(".year-month-panel");
        for(i = 0, len = data.length; i < len; i++) {
            item = data[i];
            if(!(item instanceof Date)) {
                date = getDateFn.call(item);
                if(!(date instanceof Date)) {
                    continue;
                }
            } else {
                date = item;
            }
            dayCell = this._getCellByDate(months, date);
            if(isFunctionValue) {
                action.call(dayCell, item);
            }
        }
    },
    /** 一行放几个月 */
    getMonthCount: function (width) {
        if (width >= 1024) {
            return 4;
        } else if (width >= 768) {
            return 3;
        } else if (width >= 512) {
            return 2;
        } else {
            return 1;
        }
    },
    /** 检查是否需要更新 */
    checkChange: function () {
        this.calendar.hideTimeLine();
        if (this.year === this.calendar.currentDate.getFullYear()) {
            return false;
        }
        this._changeYear(this.calendar.currentDate);
        return true;
    },
    /** 激活 */
    active: noop,
    /** 休眠 */
    dormant: noop,
    /** 向前切换 */
    previous: function() {
        var day = this.calendar.currentDate;
        this._changeYear(new Date(day.setFullYear(day.getFullYear() - 1)));
    },
    /** 向后切换 */
    next: function() {
        var day = this.calendar.currentDate;
        this._changeYear(new Date(day.setFullYear(day.getFullYear() + 1)));
    },
    /** 切换到当前 */
    today: function(day) {
        if (!day || !(day instanceof Date)) {
            day = new Date();
        }
        this._changeYear(new Date(day.getTime()));
    },
    /** 添加日程信息 */
    addSchedules: function(data, dateField, action) {
        var formatterFn;

        if(!ui.core.isFunction(action)) {
            action = null;
        }
        formatterFn = function(item) {
            var marker = this.children(".year-day-marker");
            if(marker.length === 0) {
                this.append("<i class='year-day-marker border-highlight'></i>");
            }
            if(action) {
                action.call(this, item);
            }
        };
        this._updateSchedules(data, dateField, formatterFn);
    },
    /** 移除日程信息 */
    removeSchedules: function(data, dateField, action) {
        var formatterFn;

        if(!ui.core.isFunction(action)) {
            action = null;
        }
        formatterFn = function(item) {
            var marker = this.children(".year-day-marker");
            if(marker.length > 0) {
                marker.remove();
            }
            if(action) {
                action.call(this, item);
            }
        };
        this._updateSchedules(data, dateField, formatterFn);
    },
    /** 清空日程信息 */
    clearSchedules: function() {
        var months,
            rows, cells, cell, item,
            i, j, k;
        
        months = this.yearPanel.children(".year-month-panel");
        for(i = 0; i < 12; i++) {
            rows = $(months[i])
                        .children(".year-month-content")
                        .children(".year-month-table")[0].tBodies[0].rows;
            for(j = 0; j < rows.length; j++) {
                cells = rows[j].cells;
                for(k = 0; k < cells.length; k++) {
                    cell = $(cells[k]);
                    item = cell.children(".year-day-marker");
                    if(item.length > 0) {
                        item.remove();
                    }
                }
            }
        }
    },
    /** 是否可以多选 */
    isMultiple: function() {
        return !!this.calendar.option.yearMultipleSelect;
    },
    /** 获取选中的数据，单选返回单个对象，多选返回数组 */
    getSelection: function() {
        var result = null,
            i, len;
        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                result.push(this._getDateByCell($(this._selectList[i])));
            }
        } else {
            if(this._current) {
                result = this._getDateByCell(this._current);
            }
        }
        return result;
    },
    /** 设置选中的元素 */
    setSelection: function(dateArray) {
        var months, date, cell,
            i, len;

        if(!Array.isArray(dateArray)) {
            dateArray = [dateArray];
        }
        months = this.yearPanel.children(".year-month-panel");
        for(i = 0, len = dateArray.length; i < len; i++) {
            date = dateArray[i];
            if(!(date instanceof Date)) {
                continue;
            }
            if (date.getFullYear() !== this.year) {
                throw new Error(
                    ui.str.format(
                        "the date({0}) does not belong to {1}", 
                        ui.date.format(date, "yyyy-MM-dd"),
                        this.year));
            }
            cell = this._getCellByDate(months, date);
            this._selectItem(cell);
        }
    },
    /** 取消选中项 */
    cancelSelection: function() {
        var selectedClass,
            elem,
            i, len;

        selectedClass = "selected";
        if(this.isMultiple()) {
            for(i = 0, len = this._selectList.length; i < len; i++) {
                elem = $(this._selectList[i]);
                elem.removeClass(selectedClass);
            }
            this._selectList = [];
        } else {
            if(this._current) {
                this._current.removeClass(selectedClass);
                this._current = null;
            }
        }
        this.calendar.fire("cancel", this);
    },
    /** 设置大小 */
    setSize: function(width, height) {
        this._setCellSize(width, height);
    },
    /** 获取标题 */
    getTitle: function() {
        return this.year + "年";
    },
    /** 重写toString */
    toString: function() {
        return "ui.ctrls.CalendarView.YearView";
    }
};
// 月视图
function MonthView(calendar) {
    if(this instanceof MonthView) {
        this.initialize(calendar);
    } else {
        return new MonthView(calendar);
    }
}
MonthView.prototype = {
    constructor: MonthView,
    initialize: function(calendar) {
        this.calendar = calendar;
        this.year = null;
        this.month = null;
        this.initialled = false;

        this._selectList = [];
        this._current = null;

        this.width = null;
        this.height = null;

        this.viewPanel = $("<div class='calendar-view-panel' />");
        this.calendar.element.append(this.viewPanel);
    },
    render: function() {
        if (this.initialled) {
            return;
        }

        // 事件
        this.onMonthItemClickHandler = onMouseItemClick.bind(this);

        this._setCurrent();
        this.weekPanel = $("<div class='ui-calendar-month-week-view' />");
        this._createWeek();

        this.daysPanel = $("<div class='ui-calendar-month-day-view' />");
        this._createDays();

        this.viewPanel
            .append(this.weekPanel)
            .append(this.daysPanel);
        this.initialled = true;
    },
    _setCurrent: function() {
        var date = this.calendar.currentDate;
        this.year = date.getFullYear();
        this.month = date.getMonth();
    },
    _createWeek: function () {
        var weekNames,
            colgroup, thead, tr, th,
            i, len;

        this.weekTable = $("<table class='month-week-table unselectable' cellspacing='0' cellpadding='0' />");
        thead = $("<thead />");
        colgroup = $("<colgroup />");
        this.weekTable
            .append(colgroup)
            .append(thead);
        tr = $("<tr />");
        weekNames = this.calendar.getWeekNames();
        for(i = 0, len = weekNames.length; i < len; i++) {
            colgroup.append("<col />");
            th = $("<th class='month-week-cell' />");
            if(this.calendar.isWeekend(i)) {
                th.addClass("ui-calendar-weekend");
            }
            th.append("<span class='month-week-text'>星期" + weekNames[i] + "</span>");
            if(i === len - 1) {
                th.addClass("month-week-cell-last");
            }
            tr.append(th);
        }
        thead.append(tr);
        this.weekPanel.append(this.weekTable);
    },
    _createDays: function() {
        var tbody, colgroup, tr, td,
            day, first, last, startIndex,
            today, todayDate, checkTodayFn,
            i, j, index;

        if (!this.daysTable) {
            this.daysTable = $("<table class='month-days-table unselectable' cellspacing='0' cellpadding='0' />");
            this.daysTable.click(this.onMonthItemClickHandler);
        } else {
            this.daysTable.html("");
        }

        tbody = $("<tbody />");
        colgroup = $("<colgroup />");
        for (i = 0; i < 7; i++) {
            colgroup.append("<col />");
        }
        this.daysTable.append(colgroup).append(tbody);

        day = this.calendar.currentDate;
        first = new Date(day.getFullYear(), day.getMonth(), 1);
        startIndex = this.calendar.getWeekIndexOf(first);
        last = (new Date(first.getFullYear(), first.getMonth() + 1, 0)).getDate();
        first = 1;

        today = new Date();
        todayDate = today.getDate();
        if (today.getFullYear() === day.getFullYear() && today.getMonth() === day.getMonth()) {
            checkTodayFn = function(elem, d) {
                if(d === todayDate) {
                    elem.children().children(".month-date").addClass("font-highlight");
                }
            };
        }

        index = first;
        for(i = 0; i < 6; i++) {
            tr = $("<tr />");
            for (j = 0; j < 7; j++) {
                td = $("<td class='month-days-cell' />");
                tr.append(td);
                if (i === 0 && j < startIndex) {
                    continue;
                } else if (index > last) {
                    continue;
                }

                td.append("<div class='day-container' />");
                if(this.calendar.isWeekend(j)) {
                    td.addClass("month-days-cell-weekend");
                }
                if(j === 6) {
                    td.addClass("month-days-cell-last");
                }

                td.children().html("<span class='month-date'>" + index + "</span>");
                if(checkTodayFn) {
                    checkTodayFn.call(this, td, index);
                }
                index++;
            }
            tbody.append(tr);
            if(index > last) {
                break;
            }
        }
        this.daysPanel.append(this.daysTable);
    },
    _setCellSize: function (width, height) {
        var unitWidth,
            rows, cells,
            unitHeight,
            lastHeight,
            prefix, weekNames,
            i, len;

        if(!width || !height) {
            return;
        }
        if(this.width === width && this.height === height) {
            return;
        }

        this.width = width;
        this.height = height;
        // 减去head的高度
        height -= 26;
        this.daysPanel.css("height", height + "px");

        unitWidth = this._setCellWidth(width);
        rows = this.daysTable[0].rows;
        len = rows.length;
        // 减去边框
        height -= len;
        unitHeight = Math.floor(height / len);
        lastHeight = height - unitHeight * (len - 1);

        for(i = 0; i < len; i++) {
            if(i < len - 1) {
                $(rows[i]).children().css("height", unitHeight + "px");
            } else {
                $(rows[i]).children().css("height", lastHeight + "px");
            }
        }

        cells = this.weekTable[0].tHead.rows[0].cells;
        prefix = "";
        weekNames = this.calendar.getWeekNames();
        if(unitWidth >= 60) {
            prefix = "星期";
        }
        for(i = 0, len = cells.length; i < len; i++) {
            $(cells[i]).children().text(prefix + weekNames[i]);
        }
    },
    _setCellWidth: function (width) {
        var unitWidth,
            wcols,
            dcols;
        
        unitWidth = Math.floor(width / 7);
        wcols = this.weekTable.children("colgroup").children();
        dcols = this.daysTable.children("colgroup").children("col");

        wcols.splice(6, 1);
        dcols.splice(6, 1);
        wcols.css("width", unitWidth + "px");
        dcols.css("width", unitWidth + "px");

        return unitWidth;
    },
    _changeMonth: function(monthDate) {
        this.calendar.currentDate = monthDate;

        this._setCurrent();
        this._createDays();
        this._setCellSize(this.viewPanel.width(), this.viewPanel.height());

        this._current = null;
        this._selectList = [];
    },
    _isDateCell: function(td) {
        return td.children(".day-container").children().length > 0;
    },
    _getDateByCell: function(elem) {
        var container,
            day;

        container = elem.children(".day-container");
        day = container.children(".month-date");
        if(day.length === 0) {
            return null;
        }

        day = parseInt(day.text(), 10);
        return new Date(this.year, this.month, day);
    },
    _getCellByDate: function(date) {
        var rows,
            indexer,
            dayCell;

        rows = this.daysTable[0].tBodies[0].rows;
        indexer = this.calendar.getTableIndexOf(date);
        dayCell = $(rows[indexer.rowIndex].cells[indexer.cellIndex]);
        return dayCell;
    },
    _selectItem: YearView.prototype._selectItem,
    _updateSchedules: function(data, dateField, action) {
        var getDateFn, date, dayCell,
            i, len, item, 
            isFunctionValue;

        if(!Array.isArray(data)) {
            return;
        }
        if(!dateField) {
            dateField = "date";
        }
        if(ui.core.isFunction(dateField)) {
            getDateFn = dateField; 
        } else {
            getDateFn = function() {
                return this[dateField];
            };
        }
        isFunctionValue = ui.core.isFunction(action);

        for(i = 0, len = data.length; i < len; i++) {
            item = data[i];
            if(!(item instanceof Date)) {
                date = getDateFn.call(item);
                if(!(date instanceof Date)) {
                    continue;
                }
            } else {
                date = item;
            }
            dayCell = this._getCellByDate(date);
            if(isFunctionValue) {
                action.call(dayCell, item);
            }
        }
    },
    // API
    /** 检查是否需要更新 */
    checkChange: function () {
        var day;
        this.calendar.hideTimeLine();
        day = this.calendar.currentDate;
        if (this.year === day.getFullYear() && this.month === day.getMonth()) {
            return false;
        }
        this._changeMonth(day);
        return true;
    },
    /** 激活 */
    active: noop,
    /** 休眠 */
    dormant: noop,
    /** 向前切换 */
    previous: function() {
        var day = this.calendar.currentDate;
        this.width = null;
        this.height = null;
        this._changeMonth(new Date(day.setMonth(day.getMonth() - 1)));
    },
    /** 向后切换 */
    next: function() {
        var day = this.calendar.currentDate;
        this.width = null;
        this.height = null;
        this._changeMonth(new Date(day.setMonth(day.getMonth() + 1)));
    },
    /** 切换到当前 */
    today: function(day) {
        if (!day || !(day instanceof Date)) {
            day = new Date();
        }
        this.width = null;
        this.height = null;
        this._changeMonth(new Date(day.getTime()));
    },
    /** 添加日程信息 */
    addSchedules: function(data, dateField, action) {
        var option,
            getValueFn;
        if(ui.core.isPlainObject(data)) {
            option = data;
            data = option.data;
            dateField = option.dateField;
            action = option.action;
        } else {
            option = {
                textField: "text"
            };
        }
        if(ui.core.isFunction(option.textField)) {
            getValueFn = option.textField;
        } else {
            getValueFn = function() {
                return this[option.textField] || null;
            };
        }
        if(!ui.core.isFunction(action)) {
            action = function(item) {
                var scheduleList,
                    items,
                    container,
                    builder,
                    itemStyle,
                    borderStyle;
                
                container = this.children(".day-container");
                scheduleList = container.children(".schedule-list");
                
                if(scheduleList.length === 0) {
                    scheduleList = $("<ul class='schedule-list' />");
                    scheduleList.data("schedule-items", []);
                    container.append(scheduleList);
                }

                items = scheduleList.data("schedule-items");
                items.push(item);

                if(item.backgroundColor) {
                    itemStyle = " style='background-color:" + item.backgroundColor + "'";
                }
                if(item.borderColor) {
                    borderStyle = " style='background-color:" + item.borderColor + "'";
                }

                builder = [];
                builder.push("<li class='schedule-item'", itemStyle, ">");
                builder.push("<b class='schedule-border'", borderStyle, "></b>");
                builder.push("<span class='schedule-text'>", getValueFn.call(item), "</span>");
                builder.push("</li>");
                scheduleList.append(builder.join(""));
            };
        }
        this._updateSchedules(data, dateField, action);
    },
    /** 移除日程信息 */
    removeSchedules: function(data, dateField, action) {
        var option,
            getValueFn;
        if(ui.core.isPlainObject(data)) {
            option = data;
            data = option.data;
            dateField = option.dateField;
            action = option.action;
        } else {
            option = {
                idField: function() {
                    return this;
                }
            };
        }
        if(ui.core.isFunction(option.idField)) {
            getValueFn = option.idField;
        } else {
            getValueFn = function() {
                return this[option.idField] || null;
            };
        }
        if(!ui.core.isFunction(action)) {
            action = function(item) {
                var container,
                    scheduleList,
                    items,
                    children,
                    index,
                    i, len, scheduleItem;
                
                container = this.children(".day-container");
                scheduleList = container.children(".schedule-list");
                
                if(scheduleList.length === 0) {
                    return;
                }

                items = scheduleList.data("schedule-items");
                index = -1;
                for(i = 0, len = items.length; i < len; i++) {
                    scheduleItem = items[i];
                    if(getValueFn.call(scheduleItem) === getValueFn.call(item)) {
                        index = i;
                        break;
                    }
                }
                if(index > -1) {
                    $(scheduleList.children()[index]).remove();
                    items.splice(index, 1);
                }
            };
        }
        this._updateSchedules(data, dateField, action);
    },
    /** 清空日程信息 */
    clearSchedules: function(removeAction) {
        var cell,
            scheduleList,
            i, len;
        
        len = (new Date(this.year, this.month + 1, 0)).getDate();
        if(!ui.core.isFunction(removeAction)) {
            removeAction = function() {
                var container,
                    scheduleList;
                container = this.children(".day-container");
                scheduleList = container.children(".schedule-list");
                scheduleList.removeData("schedule-items");
                scheduleList.remove();
            };
        }
        for (i = 1; i <= len; i++) {
            cell = this._getCellByDate(new Date(this.year, this.month, i));
            removeAction.call(cell);
        }
    },
    /** 是否可以多选 */
    isMultiple: function() {
        return !!this.calendar.option.monthMultipleSelect;
    },
    /** 获取选中的数据，单选返回单个对象，多选返回数组 */
    getSelection: YearView.prototype.getSelection,
    /** 设置选中的元素 */
    setSelection: function(dateArray) {
        var date, cell,
            i, len;
        if(!Array.isArray(dateArray)) {
            dateArray = [dateArray];
        }
        for(i = 0, len = dateArray.length; i < len; i++) {
            date = dateArray[i];
            if(!(date instanceof Date)) {
                continue;
            }
            if (date.getFullYear() !== this.year || date.getMonth() !== this.month) {
                throw new Error(
                    ui.str.format(
                        "the date({0}) does not belong to {1}-{2}", 
                        ui.date.format(date, "yyyy-MM-dd"),
                        this.year,
                        this.month));
            }
            cell = this._getCellByDate(date);
            this._selectItem(cell);
        }
    },
    /** 取消选中项 */
    cancelSelection: YearView.prototype.cancelSelection,
    /** 设置视图的尺寸 */
    setSize: function(width, height) {
        this._setCellSize(width, height);
    },
    /** 获取月视图标题 */
    getTitle: function() {
        return this.year + "年" + (this.month + 1) + "月";
    },
    /** 重写toString方法 */
    toString: function() {
        return "ui.ctrls.CalendarView.MonthView";
    }
};
// 周视图
function WeekView(calendar) {
    if(this instanceof WeekView) {
        this.initialize(calendar);
    } else {
        return new WeekView(calendar);
    }
}
WeekView.prototype = {
    constructor: WeekView,
    initialize: function(calendar) {
        this.calendar = calendar;
        this.startDate = null;
        this.endDate = null;
        this.year = null;
        this.month = null;

        this.todayIndex = -1;
        this.weekDays = null;
        this.weekHours = [];
        this.initialled = false;

        this.width = null;
        this.height = null;

        this.singleSelect = !!this.calendar.option.weekSingleSelect;

        this.viewPanel = $("<div class='calendar-view-panel' />");
        this.calendar.element.append(this.viewPanel);
    },
    render: function() {
        if (this.initialled) {
            return;
        }

        this._formatDayText = this.calendar.option.formatWeekDayHead; 
        if(!ui.core.isFunction(this._formatDayText)) {
            this._formatDayText = defaultFormatDateHeadText;
        }
        // 事件
        this.onWeekHeadItemClickHandler = onWeekHeadItemClick.bind(this);

        this.weekDays = this.calendar.getWeek(this.calendar.currentDate);
        this._setCurrent();

        this.weekDayPanel = $("<div class='ui-calendar-week-view' />");
        this._createWeek();

        this.hourPanel = $("<div class='ui-calendar-hour-panel' />");
        this._createHourName();
        this._createHour();

        this._setTodayStyle();
        this.viewPanel
            .append(this.weekDayPanel)
            .append(this.hourPanel);

        this.selector = Selector(this, this.hourPanel, this.hourTable);
        this.selector.getDateByIndex = function(index) {
            return this.view.weekDays[index];
        };

        this.hourAnimator = ui.animator(this.hourPanel, {
            ease: ui.AnimationStyle.easeTo,
            onChange: function (val, elem) {
                elem.scrollTop(val);
            }
        });
        this.hourAnimator.duration = 800;
        this.initialled = true;
    },
    _setCurrent: function() {
        var day = this.weekDays[0];
        this.startDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
        day = this.weekDays[6];
        this.endDate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);

        this.year = day.getFullYear();
        this.month = day.getMonth();
    },
    _createWeek: function() {
        var thead, 
            colgroup,
            tr, th, date, 
            i, day;

        this.weekTable = $("<table class='ui-calendar-weekday unselectable' cellspacing='0' cellpadding='0' />");
        thead = $("<thead />");
        colgroup = $("<colgroup />");
        tr = $("<tr />");
        for(i = 0; i < 7; i++) {
            day = this.weekDays[i];
            colgroup.append("<col />");

            th = $("<th class='weekday-cell' />");
            th.text(this._formatDayText(day));
            tr.append(th);
        }

        thead.append(tr);
        this.weekTable.append(colgroup).append(thead);
        this.weekDayPanel.append(this.weekTable);

        this.weekTable.click(this.onWeekHeadItemClickHandler);
    },
    _createHourName: function() {
        var table, colgroup, tbody, 
            tr, td,
            i, j, unitCount;

        this.hourNames = $("<div class='hour-name-panel' />");
        table = $("<table class='hour-name-table unselectable' cellspacing='0' cellpadding='0' />");
        colgroup = $("<colgroup />");
        // 特殊的结构，保持表格高度一致，包括边框的高度
        colgroup
            .append("<col style='width:0px;' />")
            .append("<col />");
        table.append(colgroup);
        tbody = $("<tbody />");

        unitCount = this.calendar._getTimeCellCount();
        for (i = 0; i < 24; i++) {
            for(j = 0; j < unitCount; j++) {
                tr = $("<tr />");
                td = $("<td class='hour-name-cell' />");
                if((j + 1) % unitCount) {
                    td.addClass("hour-name-cell-odd");
                }
                tr.append(td);
                if(j === 0) {
                    td = $("<td class='hour-name-cell' rowspan='" + unitCount + "' />");
                    td.append("<h3 class='hour-name-text'>" + i + "</h3>");
                    tr.append(td);
                }
                tbody.append(tr);
            }
        }
        table.append(tbody);
        this.hourNames.append(table);
        this.hourPanel.append(this.hourNames);
    },
    _createHour: function() {
        var tbody, colgroup, tr, td,
            i, len, j, unitCount;

        this.weekHour = $("<div class='week-hour-panel' />");
        this.hourTable = $("<table class='week-hour-table unselectable' cellspacing='0' cellpadding='0' />");
        tbody = $("<tbody />");
        colgroup = $("<colgroup />");
        for (i = 0; i < 7; i++) {
            colgroup.append("<col />");
        }

        unitCount = this.calendar._getTimeCellCount();
        len = 24 * unitCount;
        for (i = 0; i < len; i++) {
            tr = $("<tr />");
            for (j = 0; j < 7; j++) {
                td = $("<td class='week-hour-cell' />");
                if (this.calendar.isWeekend(j)) {
                    td.addClass("week-hour-cell-weekend");
                }
                if ((i + 1) % unitCount) {
                    td.addClass("week-hour-cell-odd");
                }
                tr.append(td);
            }
            tbody.append(tr);
        }
        this.hourTable.append(colgroup).append(tbody);
        this.weekHour.append(this.hourTable);
        this.hourPanel.append(this.weekHour);
    },
    _setTodayStyle: function() {
        var today, date,
            table, row,
            i, len;

        today = new Date();
        this.todayIndex = -1;
        for (i = 0; i < 7; i++) {
            date = this.weekDays[i];
            if (date.getFullYear() == today.getFullYear() && date.getMonth() == today.getMonth() && date.getDate() == today.getDate()) {
                this.todayIndex = i;
                break;
            }
        }
        if (this.todayIndex < 0) {
            return;
        }

        table = this.hourTable[0];
        for (i = 0, len = table.rows.length; i < len; i++) {
            row = table.rows[i];
            $(row.cells[this.todayIndex]).addClass("week-hour-cell-today");
        }
    },
    _clearTodayStyle: function() {
        var rows, cell,
            todayIndex,
            i, len;
        rows = this.hourTable[0].tBodies[0].rows;
        todayIndex = -1;
        for(i = 0, len = rows[0].cells.length; i < len; i++) {
            cell = $(rows[0].cells[i]);
            if(cell.hasClass("week-hour-cell-today")) {
                todayIndex = i;
                break;
            }
        }
        if(todayIndex < 0) {
            return;
        }
        for(i = 0, len = rows.length; i < len; i++) {
            cell = $(rows[i].cells[todayIndex]);
            cell.removeClass("week-hour-cell-today");
        }
    },
    _setCellSize: function (width, height) {
        var scrollWidth = 0,
            realWidth, unitWidth,
            wcols, hcols;

        if(!width || !height) {
            return;
        }
        if(this.width === width && this.height === height) {
            return;
        }

        this.width = width;
        this.height = height;
        
        if (height < this.hourPanel[0].scrollHeight) {
            scrollWidth = ui.scrollbarWidth;
        }
        realWidth = width - timeTitleWidth - scrollWidth;
        unitWidth = Math.floor(realWidth / 7);
        if (unitWidth < 95) {
            unitWidth = 95;
        }

        wcols = this.weekTable.find("col");
        hcols = this.hourTable.find("col");
        this.weekTable.css("width", unitWidth * 7 + "px");
        this.hourTable.css("width", unitWidth * 7 + "px");
        wcols.css("width", unitWidth + "px");
        hcols.css("width", unitWidth + "px");

        if (this.selector.cellWidth > 1) {
            this._restoreSchedules(unitWidth - this.selector.cellWidth);
        }

        this.selector.cellWidth = unitWidth;
        this.selector.cancelSelection();
    },
    _updateWeek: function() {
        var tr, th, day, i;
        tr = this.weekTable[0].tHead.rows[0];
        for (i = 0; i < 7; i++) {
            day = this.weekDays[i];
            th = $(tr.cells[i]);
            th.text(this._formatDayText(day));
            // 将样式恢复成初始值
            th.attr("class", "weekday-cell");
        }
    },
    _addScheduleItem: function(beginCell, endCell, formatAction, scheduleInfo, titleText) {
        var scheduleItem,
            title,
            container,
            bp, ep;
        
        scheduleItem = $("<div class='schedule-item-panel' />");
        title = $("<div class='time-title' />");
        title.html("<span class='time-title-text'>" + titleText + "</span>");
        container = $("<div class='schedule-container' />");
        scheduleItem.append(title).append(container);

        bp = this._getPositionAndSize(beginCell);
        ep = this._getPositionAndSize(endCell);
        scheduleItem.css({
            "top": bp.top + "px",
            "left": bp.left + "px",
            "width": bp.width + "px",
            "height": ep.height + ep.top - bp.top + "px"
        });
        $(this.hourPanel).append(scheduleItem);

        scheduleInfo.itemPanel = scheduleItem;
        this._setScheduleInfo(scheduleInfo.columnIndex, scheduleInfo);
        if (ui.core.isFunction(formatAction)) {
            formatAction.call(this, scheduleInfo, container);
        }
    },
    _findSchedules: function(beginDateArray, action) {
        var i, j, date,
            weekIndex, beginRowIndex, dayItems,
            actionIsFunction;

        actionIsFunction = ui.core.isFunction(action);
        for (i = 0; i < beginDateArray.length; i++) {
            date = beginDateArray[i];
            if (date instanceof Date) {
                weekIndex = this.calendar.getWeekIndexOf(date);
                beginRowIndex = this.calendar.timeToIndex(formatTime(date));
                dayItems = this._getScheduleInfo(weekIndex);
                if (dayItems) {
                    for (j = dayItems.length - 1; j >= 0 ; j--) {
                        if (beginRowIndex === dayItems[j].beginRowIndex) {
                            if(actionIsFunction) {
                                action.call(this, dayItems[j], j, dayItems);
                            }
                        }
                    }
                }
            }
        }
    },
    _restoreSchedules: function(value) {
        var column, left, width,
            i, j, weekDay, panel;

        for (i = 0; i < this.weekHours.length; i++) {
            weekDay = this.weekHours[i];
            if (weekDay) {
                for (j = 0; j < weekDay.length; j++) {
                    panel = weekDay[j].itemPanel;
                    column = weekDay[j].weekIndex;
                    left = parseFloat(panel.css("left"));
                    width = parseFloat(panel.css("width"));
                    panel.css({
                        "left": (left + column * val) + "px",
                        "width": (width + val) + "px"
                    });
                }
            }
        }
    },
    _setScheduleInfo: function(weekIndex, info) {
        var weekDay = this.weekHours[weekIndex];
        if (!weekDay) {
            weekDay = [];
            this.weekHours[weekIndex] = weekDay;
        }
        info.weekIndex = weekIndex;
        weekDay.push(info);
    },
    _getScheduleInfo: function (weekIndex) {
        var weekDay = this.weekHours[weekIndex];
        if (!weekDay) {
            return null;
        }
        return weekDay;
    },
    _changeWeek: function () {
        this.calendar.currentDate = this.weekDays[0];
        this._setCurrent();
        this.clearSchedules();
        this.selector.cancelSelection();
        this._updateWeek();
        
        // 重新标出今天
        this._clearTodayStyle();
        this._setTodayStyle();
    },
    _getUnitHourNameHeight: function() {
        var table;
        if(!this.hourNames) {
            return hourHeight;
        }
        table = this.hourNames.children("table")[0];
        return $(table.tBodies[0].rows[0].cells[1]).outerHeight() / this.calendar._getTimeCellCount();
    },
    _getPositionAndSize: function(td) {
        var position = td.position();
        position.left = position.left + timeTitleWidth;
        position.top = position.top;
        return {
            top: position.top,
            left: position.left,
            width: td.outerWidth() - 1,
            height: td.outerHeight() - 1
        };
    },
    // API
    /** 检查是否需要更新 */
    checkChange: function () {
        var day = this.calendar.currentDate;
        this.calendar.showTimeLine(this.hourPanel, this._getUnitHourNameHeight());
        if (day >= this.startDate && day <= this.endDate) {
            return false;
        }
        this.weekDays = this.calendar.getWeek(day);
        this._changeWeek();
        return true;
    },
    /** 激活 */
    active: function() {
        this.selector.active();
    },
    /** 休眠 */
    dormant: function() {
        this.selector.dormant();
    },
    /** 向前切换 */
    previous: function() {
        var day = this.calendar.currentDate;
        this.weekDays = this.calendar.getWeek(
            new Date(day.getFullYear(), day.getMonth(), day.getDate() - 7));
        this._changeWeek();
    },
    /** 向后切换 */
    next: function() {
        var day = this.calendar.currentDate;
        this.weekDays = this.calendar.getWeek(
            new Date(day.getFullYear(), day.getMonth(), day.getDate() + 7));
        this._changeWeek();
    },
    /** 切换到当前 */
    today: function(day) {
        if (!day || !(day instanceof Date)) {
            day = new Date();
        }
        this.weekDays = this.calendar.getWeek(day);
        this._changeWeek();
    },
    /** 设置显示的时间 */
    setBeginTime: function (beginTime) {
        var height, scrollHeight,
            index, count,
            maxTop, scrollTop,
            option;

        height = this.hourPanel.height();
        scrollHeight = this.hourPanel[0].scrollHeight;
        if (height >= scrollHeight) {
            return;
        }
        this.hourAnimator.stop();
        index = this.calendar.timeToIndex(beginTime);
        count = this.calendar._getTimeCellCount();
        if (index > count) {
            index -= count;
        }
        maxTop = scrollHeight - height;
        scrollTop = index * hourHeight;
        if (scrollTop > maxTop) {
            scrollTop = maxTop;
        }
        option = this.hourAnimator[0];
        option.begin = this.hourPanel.scrollTop();
        option.end = scrollTop;
        this.hourAnimator.start();
    },
    /** 添加日程信息 */
    addSchedules: function(data, beginDateTimeField, endDateTimeField, formatAction, getColumnFn) {
        var getBeginDateTimeFn,
            getEndDateTimeFn,
            scheduleInfo, beginTime, endTime,
            i, len, item;
        if(!Array.isArray(data)) {
            return;
        }

        if(ui.core.isFunction(beginDateTimeField)) {
            getBeginDateTimeFn = beginDateTimeField;
        } else {
            getBeginDateTimeFn = function() {
                return this[beginDateTimeField + ""] || null;
            };
        }
        if(ui.core.isFunction(endDateTimeField)) {
            getEndDateTimeFn = endDateTimeField;
        } else {
            getEndDateTimeFn = function() {
                return this[endDateTimeField + ""] || null;
            };
        }

        if(!ui.core.isFunction(getColumnFn)) {
            getColumnFn = function(date) {
                return this.calendar.getWeekIndexOf(date);
            };
        }

        for(i = 0, len = data.length; i < len; i++) {
            item = data[i];
            scheduleInfo = {
                data: item
            };
            scheduleInfo.beginDate = getBeginDateTimeFn.call(item);
            scheduleInfo.endDate = getEndDateTimeFn.call(item);
            if(!(scheduleInfo.beginDate instanceof Date) || !(scheduleInfo.endDate instanceof Date)) {
                continue;
            }
            scheduleInfo.columnIndex = getColumnFn.call(this, scheduleInfo.beginDate);
            beginTime = formatTime(scheduleInfo.beginDate);
            endTime = formatTime(scheduleInfo.endDate, scheduleInfo.beginDate);
            scheduleInfo.beginRowIndex = this.calendar.timeToIndex(beginTime);
            scheduleInfo.endRowIndex = this.calendar.timeToIndex(endTime) - 1;

            this._addScheduleItem(
                    $(this.hourTable[0].rows[scheduleInfo.beginRowIndex].cells[scheduleInfo.columnIndex]),
                    $(this.hourTable[0].rows[scheduleInfo.endRowIndex].cells[scheduleInfo.columnIndex]),
                    formatAction, scheduleInfo,
                    beginTime.substring(0, 5) + " - " + endTime.substring(0, 5));
        }
    },
    /** 移除日程信息 */
    removeSchedules: function(beginDateArray) {
        this._findSchedules(beginDateArray, function (scheduleInfo, index, itemArray) {
            scheduleInfo.itemPanel.remove();
            itemArray.splice(index, 1);
        });
    },
    /** 查找日程信息并做相应的处理 */
    findSchedules: function(beginDateArray, callback, caller) {
        var action;
        if (beginDateArray instanceof Date) {
            beginDateArray = [beginDateArray];
        }
        if (!Array.isArray(beginDateArray)) {
            return;
        }
        if (!caller) {
            caller = this;
        }
        if (ui.core.isFunction(callback)) {
            action = function() {
                callback.apply(caller, arguments);
            };
        } else {
            action = null;
        }
        this._findSchedules(beginDateArray, action);
    },
    /** 清空日程信息 */
    clearSchedules: function() {
        var i, j,
            weekDay;
        for (i = 0; i < this.weekHours.length; i++) {
            weekDay = this.weekHours[i];
            if (weekDay) {
                for (j = 0; j < weekDay.length; j++) {
                    weekDay[j].itemPanel.remove();
                }
            }
        }
        this.weekHours = [];
    },
    /** 判断是否已经有日程信息 */
    hasSchedule: function(weekIndex) {
        var weekDay = this.weekHours[weekIndex];
        if (!weekDay) {
            return false;
        }
        return weekDay.length > 0;
    },
    /** 设置选中的元素 返回数组 */
    getSelection: function() {
        var hours, date, time,
            i, len,
            result;

        result = [];
        hours = this.selector.getSelection();
        if(!hours) {
            return result;
        }

        date = this.weekDays[hours.weekIndex];
        for(i = 0, len = hours.timeArray.length; i < len; i++) {
            time = hours.timeArray[i];
            result.push(new Date(
                date.getFullYear(), 
                date.getMonth(), 
                date.getDate(), 
                time.hours, 
                time.minutes, 
                time.seconds));
        }
        return result;
    },
    /** 设置选中状态 */
    setSelection: function(start, end) {
        var weekIndex,
            startTime, endTime,
            i, len, date;
        if(!(start instanceof Date) || !(end instanceof Date)) {
            return;
        }
        weekIndex = -1;
        for (i = 0, len = this.weekDays.length; i < len; i++) {
            date = this.weekDays[i];
            if (date.getFullYear() == start.getFullYear() && date.getMonth() == start.getMonth() && date.getDate() == start.getDate()) {
                weekIndex = i;
                break;
            }
        }
        if(weekIndex < 0) {
            return;
        }

        startTime = ui.date.format(start, "hh:mm:ss");
        endTime = ui.date.format(end, "hh:mm:ss");
        this.selector.setSelectionByTime(weekIndex, startTime, endTime);
    },
    /** 取消选中状态 */
    cancelSelection: function() {
        this.selector.cancelSelection();
    },
    /** 这是周视图尺寸 */
    setSize: function (width, height) {
        this.hourPanel.css("height", height - hourHeight + "px");
        this._setCellSize(width, height);
    },
    /** 获取周视图标题 */
    getTitle: function () {
        return ui.str.format(
            "{0}年{1}月{2}日 ~ {3}年{4}月{5}日",
            this.startDate.getFullYear(), 
            this.startDate.getMonth() + 1, 
            this.startDate.getDate(),
            this.endDate.getFullYear(), 
            this.endDate.getMonth() + 1, 
            this.endDate.getDate());
    },
    /** 重写toString方法 */
    toString: function () {
        return "ui.ctrls.CalendarView.WeekView";
    }
};
// 日视图
function DayView(calendar) {
    if(this instanceof DayView) {
        this.initialize(calendar);
    } else {
        return new DayView(calendar);
    }
}
DayView.prototype = {
    constructor: DayView,
    initialize: function(calendar) {
        this.calendar = calendar;
        this.year = null;
        this.month = null;
        this.day = null;
        this.dayHours = [];
        this.initialled = false;

        this.width = null;
        this.height = null;

        this.singleSelect = !!this.calendar.option.daySingleSelect;

        this.viewPanel = $("<div class='calendar-view-panel' />");
        this.calendar.element.append(this.viewPanel);
    },
    render: function() {
        if (this.initialled) {
            return;
        }

        this._formatDayText = this.calendar.option.formatDayHead; 
        if(!ui.core.isFunction(this._formatDayText)) {
            this._formatDayText = defaultFormatDateHeadText;
        }

        // 事件
        this.onDayHeadItemClickHandler = onDayHeadItemClick.bind(this);

        this._setCurrent();

        this.dayPanel = $("<div class='ui-calendar-day-view' />");
        this._createDay();

        this.hourPanel = $("<div class='ui-calendar-hour-panel' />");
        this._createHourName();
        this._createHour();

        this.viewPanel
            .append(this.dayPanel)
            .append(this.hourPanel);

        this.selector = Selector(this, this.hourPanel, this.hourTable);
        this.selector.getDateByIndex = function(index) {
            return new Date(this.view.year, this.view.month, this.view.day);
        };
        
        this.hourAnimator = ui.animator(this.hourPanel, {
            ease: ui.AnimationStyle.easeTo,
            onChange: function (val, elem) {
                elem.scrollTop(val);
            }
        });
        this.hourAnimator.duration = 800;
        this.initialled = true;
    },
    _setCurrent: function () {
        var day = this.calendar.currentDate;
        this.year = day.getFullYear();
        this.month = day.getMonth();
        this.day = day.getDate();
    },
    _createDay: function () {
        this.dayTitle = $("<div class='ui-calendar-day-title' />");
        this.dayTitle.html("<span class='ui-calendar-day-title-text'>" + 
                this._formatDayText(this.calendar.currentDate) + "</span>");
        this.dayPanel.append(this.dayTitle);

        this.dayTitle.click(this.onDayHeadItemClickHandler);
    },
    _createHourName: WeekView.prototype._createHourName,
    _createHour: function() {
        var tbody, tr, td, 
            count, i, len;

        this.weekHour = $("<div class='week-hour-panel' />");
        this.hourTable = $("<table class='week-hour-table unselectable' cellspacing='0' cellpadding='0' />");
        tbody = $("<tbody />");
        count = this.calendar._getTimeCellCount();
        
        for (i = 0, len = 24 * count; i < len; i++) {
            tr = $("<tr />");
            td = $("<td class='week-hour-cell' style='width:100%' />");
            if ((i + 1) % count) {
                td.addClass("week-hour-cell-odd");
            }
            tr.append(td);
            tbody.append(tr);
        }
        this.hourTable.append(tbody);
        this.weekHour.append(this.hourTable);
        this.hourPanel.append(this.weekHour);
    },
    _setCellSize: function (width, height) {
        var scrollWidth = 0,
            realWidth;

        if(!width || !height) {
            return;
        }
        if(this.width === width && this.height === height) {
            return;
        }

        this.width = width;
        this.height = height;

        if (height < this.hourPanel[0].scrollHeight) {
            scrollWidth = ui.scrollbarWidth;
        }
        realWidth = width - timeTitleWidth - scrollWidth - 2;
        this.dayTitle.css("width", realWidth + "px");
        this.hourTable.css("width", realWidth + "px");

        if (this.selector.cellWidth > 1) {
            this._restoreSchedules(realWidth - this.selector.cellWidth);
        }

        this.selector.cellWidth = realWidth;
        this.selector.cancelSelection();
    },
    _addScheduleItem: WeekView.prototype._addScheduleItem,
    _restoreSchedules: function(value) {
        var column, left, width,
            i, panel;
        for (i = 0; i < this.dayHours.length; i++) {
            panel = this.dayHours[i].itemPanel;
            column = this.dayHours[i].weekIndex;
            left = parseFloat(panel.css("left"));
            width = parseFloat(panel.css("width"));
            panel.css({
                "left": (left + column * val) + "px",
                "width": (width + val) + "px"
            });
        }
    },
    _setScheduleInfo: function(weekIndex, info) {
        this.dayHours.push(info);
    },
    _getScheduleInfo: function (weekIndex) {
        return this.dayHours;
    },
    _changeDay: function() {
        this._setCurrent();
        this.clearSchedules();
        this.selector.cancelSelection();
        this.dayTitle.html("<span class='ui-calendar-day-title-text'>" 
                + this._formatDayText(this.calendar.currentDate) 
                + "</span>");
    },
    _getUnitHourNameHeight: WeekView.prototype._getUnitHourNameHeight,
    _getPositionAndSize: WeekView.prototype._getPositionAndSize,

    // API
    /** 检查是否需要更新 */
    checkChange: function () {
        var day = this.calendar.currentDate;
        this.calendar.showTimeLine(this.hourPanel, this._getUnitHourNameHeight());
        if (this.year == day.getFullYear() && this.month == day.getMonth() && this.day == day.getDate()) {
            return false;
        }
        this._changeDay();
        return true;
    },
    /** 激活 */
    active: function() {
        this.selector.active();
    },
    /** 休眠 */
    dormant: function() {
        this.selector.dormant();
    },
    /** 向前切换 */
    previous: function() {
        var day = this.calendar.currentDate;
        this.calendar.currentDate = new Date(day.setDate(day.getDate() - 1));
        this._changeDay();
    },
    /** 向后切换 */
    next: function() {
        var day = this.calendar.currentDate;
        this.calendar.currentDate = new Date(day.setDate(day.getDate() + 1));
        this._changeDay();
    },
    /** 切换到当前 */
    today: function(day) {
        if (!day || !(day instanceof Date)) {
            day = new Date();
        }
        this.calendar.currentDate = new Date(day.getTime());
        this._changeDay();
    },
    setBeginTime: WeekView.prototype.setBeginTime,
    /** 添加日程信息 */
    addSchedules: function(data, beginDateTimeField, endDateTimeField, formatAction, getColumnFn) {
        WeekView.prototype.addSchedules.call(this,
            data, 
            beginDateTimeField, 
            endDateTimeField, 
            formatAction,
            function () {
                return 0;
            }
        );
    },
    /** 清空日程信息 */
    clearSchedules: function() {
        var i = 0;
        for (; i < this.dayHours.length; i++) {
            this.dayHours[i].itemPanel.remove();
        }
        this.dayHours = [];
    },
    /** 判断是否已经有日程信息 */
    hasSchedule: function () {
        return this.dayHours.length > 0;
    },
    /** 设置选中的元素 返回数组 */
    getSelection: function() {
        var hours, date, time,
            i, len,
            result;

        result = [];
        hours = this.selector.getSelection();
        if(!hours) {
            return result;
        }

        date = new Date(this.year, this.month, this.day);
        for(i = 0, len = hours.timeArray.length; i < len; i++) {
            time = hours.timeArray[i];
            result.push(new Date(
                date.getFullYear(), 
                date.getMonth(), 
                date.getDate(), 
                time.hours, 
                time.minutes, 
                time.seconds));
        }
        return result;
    },
    /** 设置选中状态 */
    setSelection: function(start, end) {
        var startTime, 
            endTime;
        if(!(start instanceof Date) || !(end instanceof Date)) {
            return;
        }

        startTime = ui.date.format(start, "hh:mm:ss");
        endTime = ui.date.format(end, "hh:mm:ss");
        this.selector.setSelectionByTime(0, startTime, endTime);
    },
    /** 取消选中状态 */
    cancelSelection: function() {
        this.selector.cancelSelection();
    },
    /** 设置日视图尺寸 */
    setSize: function (width, height) {
        this.hourPanel.css("height", height - hourHeight + "px");
        this._setCellSize(width, height);
    },
    /** 获取日视图标题 */
    getTitle: function () {
        return ui.str.format("{0}年{1}月{2}日",
            this.year, this.month + 1, this.day);
    },
    /** 重写toString方法 */
    toString: function () {
        return "ui.ctrls.CalendarView.DayView";
    }
};
// 选择器
function Selector(view, panel, table) {
    if(this instanceof Selector) {
        this.initialize(view, panel, table);
    } else {
        return new Selector(view, panel, table);
    }
}
Selector.prototype = {
    constructor: Selector,
    initialize: function(view, panel, table) {
        this.view = view;
        this.panel = panel;
        this.grid = table;

        this.cellWidth = 1;
        this.cellHeight = 25;

        this.grid[0].onselectstart = function () { 
            return false; 
        };

        this.selectionBox = $("<div class='ui-calendar-selector unselectable click-enabled border-highlight' />");
        this.selectionBox.boxTextSpan = $("<span class='ui-calendar-selector-time click-enabled' />");
        this.selectionBox.append(this.selectionBox.boxTextSpan);
        this.panel.append(this.selectionBox);

        this._initEvents();
        this._initAnimator();
    },
    _initEvents: function() {
        this.mouseLeftButtonDownHandler = (function (e) {
            if (e.which !== 1) {
                return;
            }
            $(document).on("mousemove", this.mouseMoveHandler);
            $(document).on("mouseup", this.mouseLeftButtonUpHandler);
            if(this.onMouseDown($(e.target), e.clientX, e.clientY)) {
                this._isBeginSelect = true;
            }
        }).bind(this);
        this.mouseMoveHandler = (function (e) {
            if (!this._isBeginSelect) {
                return;
            }
            this.onMouseMove(e);
        }).bind(this);
        this.mouseLeftButtonUpHandler = (function (e) {
            if (e.which !== 1 || !this._isBeginSelect) {
                return;
            }
            this._isBeginSelect = false;
            $(document).off("mousemove", this.mouseMoveHandler);
            $(document).off("mouseup", this.mouseLeftButtonUpHandler);
            this.onMouseUp(e);
        }).bind(this);
    },
    _initAnimator: function() {
        var that = this;
        this.selectAnimator = ui.animator(this.selectionBox, {
            ease: ui.AnimationStyle.swing,
            onChange: function (val, elem) {
                if (that._selectDirection === "up") {
                    return;
                }
                elem.css("top", val + "px");
            }
        }).addTarget(this.selectionBox, {
            ease: ui.AnimationStyle.swing,
            onChange: function (val, elem) {
                elem.css("left", val + "px");
            }
        }).addTarget(this.selectionBox, {
            ease: ui.AnimationStyle.swing,
            onChange: function (val, elem) {
                elem.css("width", val + "px");
            }
        }).addTarget(this.selectionBox, {
            ease: ui.AnimationStyle.swing,
            onChange: function (val, elem) {
                if (that._selectDirection) {
                    return;
                }
                elem.css("height", val + "px");
            }
        });
        this.selectAnimator.onEnd = function () {
            if(that._isNotCompletedYet) {
                that._isNotCompletedYet = false;
                that.onSelectCompleted();
            }
        };
        this.selectAnimator.duration = 200;
        this.selectAnimator.fps = 60;
    },
    _getSelectedCells: function() {
        var cells = [],
            box = this.selectionBox,
            text, beginIndex, endIndex,
            boxBorderTopWidth, top, left,
            first, count,
            table, row, cell, i;

        if (box.css("display") === "none") {
            return cells;
        }
        text = box.text().split("-");
        beginIndex = ui.str.trim(text[0] || "");
        endIndex = ui.str.trim(text[1] || "");
        if (!beginIndex || !endIndex) {
            return cells;
        }
        beginIndex = this.view.calendar.timeToIndex(beginIndex);
        endIndex = this.view.calendar.timeToIndex(endIndex) - 1;

        boxBorderTopWidth = parseFloat(box.css("border-top-width"));
        top = beginIndex * this.cellHeight + 1;
        left = parseFloat(box.css("left")) + boxBorderTopWidth + 1;
        first = this._getCellByPoint(left, top);
        cells.push(first);

        count = endIndex - beginIndex + 1;
        table = this.grid[0];
        for (i = 1; i < count; i++) {
            row = table.rows[i + first.hourIndex];
            cell = $(row.cells[first.weekIndex]);
            cell.hourIndex = i + first.hourIndex;
            cell.weekIndex = first.weekIndex;
            cells.push(cell);
        }
        return cells;
    },
    _getCellByPoint: function(x, y) {
        var columnIndex, rowIndex, count,
            table, tableRow, tableCell;
        
        columnIndex = Math.ceil(x / this.cellWidth);
        rowIndex = Math.ceil(y / this.cellHeight);
        count = this.view.calendar._getTimeCellCount() * 24;

        if (columnIndex < 1) {
            columnIndex = 1;
        }
        if (columnIndex > 7) {
            columnIndex = 7;
        }
        if (rowIndex < 1) {
            rowIndex = 1;
        }
        if (rowIndex > count) {
            rowIndex = count;
        }

        rowIndex--;
        columnIndex--;

        table = this.grid[0];
        tableRow = table.rows[rowIndex];

        tableCell = $(tableRow.cells[columnIndex]);
        tableCell.hourIndex = rowIndex;
        tableCell.weekIndex = columnIndex;
        return tableCell;
    },
    _selectCell: function(td) {
        var box, 
            cellPosition, endCellPosition,
            beginIndex, endIndex,
            option; 

        box = this.selectionBox;
        cellPosition = this._getPositionAndSize(td);
        beginIndex = td.hourIndex;
        endIndex = td.hourIndex + 1;
        if (arguments.length > 1 && arguments[1]) {
            endIndex = arguments[1].hourIndex + 1;
            endCellPosition = this._getPositionAndSize(arguments[1]);
            cellPosition.height = endCellPosition.top + endCellPosition.height - cellPosition.top;
        }

        this._selectDirection = null;

        //设置选择时间
        this._beginTime = this.view.calendar.indexToTime(beginIndex);
        this._endTime = this.view.calendar.indexToTime(endIndex);
        box.boxTextSpan.text(this._beginTime + " - " + this._endTime);

        this.selectAnimator.stop();
        option = this.selectAnimator[0];
        option.begin = parseFloat(option.target.css("top"));
        option.end = cellPosition.top;

        option = this.selectAnimator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = cellPosition.left;

        option = this.selectAnimator[2];
        option.begin = parseFloat(option.target.css("width"));
        option.end = cellPosition.width;

        option = this.selectAnimator[3];
        option.begin = parseFloat(option.target.css("height"));
        option.end = cellPosition.height;

        box.css("display", "block");
        this._isNotCompletedYet = false;
        return this.selectAnimator.start();
    },
    _autoScrollY: function (value, direction) {
        var currentScrollY,
            bottom;
        
        currentScrollY = this.panel.scrollTop();
        if (direction === "up") {
            if (value < currentScrollY) {
                this.panel.scrollTop(currentScrollY < this.cellHeight ? 0 : currentScrollY - this.cellHeight);
            }
        } else if (direction === "down") {
            bottom = currentScrollY + this.panel.height();
            if (value > bottom) {
                this.panel.scrollTop(currentScrollY + this.cellHeight);
            }
        }
    },
    _isClickInGrid: function(x, y) {
        var position,
            left,
            top,
            right,
            bottom,
            width,
            height;
        
        position = this.panel.offset();
        left = position.left + timeTitleWidth;
        top = position.top;

        width = this.grid.width();
        height = this.panel.height();
        right = left + width - 1;
        bottom = top + height;
        if (height < this.panel[0].scrollHeight) {
            right -= ui.scrollbarWidth;
        }

        return x >= left && x <= right && y >= top && y <= bottom;
    },
    _changeToGridPoint: function(x, y) {
        var position = this.panel.offset();
        position.left = position.left + timeTitleWidth;
        return {
            gridX: x - position.left + this.panel.scrollLeft(),
            gridY: y - position.top + this.panel.scrollTop()
        };
    },
    _getPositionAndSize: function(td) {
        var position = td.position();
        position.left = position.left + timeTitleWidth;
        return {
            top: position.top - 2,
            left: position.left - 2,
            width: td.outerWidth() - 1,
            height: td.outerHeight() - 1
        };
    },

    // 事件处理
    /** 鼠标按下，开始选择 */
    onMouseDown: function(elem, x, y) {
        var td, 
            nodeName, 
            point,
            eventData;
        
        if (!this._isClickInGrid(x, y)) {
            this._clickInGrid = false;
            return;
        }
        this._clickInGrid = true;

        point = this._changeToGridPoint(x, y);
        if(elem.nodeName() != "TD") {
            if(!elem.hasClass("click-enabled")) {
                return;
            }
            td = this._getCellByPoint(point.gridX, point.gridY);
        } else {
            td = elem;
            td.weekIndex = td[0].cellIndex;
            td.hourIndex = td.parent()[0].rowIndex;
        }

        eventData = {
            view: this.view,
            element: this.selectionBox,
            weekIndex: td.weekIndex,
            hourIndex: td.hourIndex,
            originElement: null
        };
        if(this.view.calendar.fire("selecting", eventData) === false) {
            return;
        }

        this._startCell = td;
        this._selectCell(td);

        //确定可选区间
        this.checkSelectable(td);

        this.focusX = point.gridX;
        this.focusY = point.gridY;
        return true;
    },
    /** 鼠标移动 */
    onMouseMove: function (e) {
        var point,
            td, 
            p, p2,
            box,
            begin, end;
        
        point = this._changeToGridPoint(e.clientX, e.clientY);
        td = this._getCellByPoint(this.focusX, point.gridY);

        p = this._getPositionAndSize(td);
        p2 = this._getPositionAndSize(this._startCell);

        if (td.hourIndex < this.selectableMin || td.hourIndex > this.selectableMax) {
            return;
        }

        box = this.selectionBox;
        if (point.gridY > this.focusY) {
            begin = this._startCell;
            end = td;
            box.css({
                "height": (p.top + p.height - p2.top) + "px"
            });
            this._selectDirection = "down";
            this._autoScrollY(p.top + p.height, this._selectDirection);
        } else {
            begin = td;
            end = this._startCell;
            box.css({
                "top": p.top + "px",
                "height": p2.top + p2.height - p.top + "px"
            });
            this._selectDirection = "up";
            this._autoScrollY(p.top, this._selectDirection);
        }

        this._beginTime = this.view.calendar.indexToTime(begin.hourIndex),
        this._endTime = this.view.calendar.indexToTime(end.hourIndex + 1);
        box.boxTextSpan.text(this._beginTime + " - " + this._endTime);
    },
    /** 鼠标释放 */
    onMouseUp: function(e) {
        var that = this;
        if (!this._clickInGrid) {
            return;
        }
        if (this.selectAnimator.isStarted) {
            this._isNotCompletedYet = true;
        } else {
            this.onSelectCompleted();
        }
    },
    /** 选则完成处理 */
    onSelectCompleted: function() {
        var box,
            date, arr,
            beginHour, beginMinute,
            endHour, endMinute,
            that;
        if (arguments.length > 0 && arguments[0]) {
            box = arguments[0];
        } else {
            box = this.selectionBox;
        }

        date = this.getDateByIndex(this._startCell.weekIndex);
        arr = this._beginTime.split(":");
        beginHour = parseInt(arr[0], 10);
        beginMinute = parseInt(arr[1], 10);
        arr = this._endTime.split(":");
        endHour = parseInt(arr[0], 10);
        endMinute = parseInt(arr[1], 10);

        this._startCell = null;
        this._beginTime = null;
        this._endTime = null;

        that = this;
        //保证动画流畅
        setTimeout(function () {
            var selectorInfo, 
                eventData = {
                    view: that.view,
                    beginTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), beginHour, beginMinute, 0),
                    endTime: new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute, 0),
                    originElement: null
                };
            selectorInfo = that.getSelectorInfo();
            eventData.element = selectorInfo.element;
            eventData.top = selectorInfo.top;
            eventData.left = selectorInfo.left;
            eventData.parentWidth = selectorInfo.parentWidth;
            eventData.parentWidth = selectorInfo.parentWidth;
            that.view.calendar.fire("selected", eventData);
        }, 50);
    },
    /** 确定可选择区域 */
    checkSelectable: function(td) {
        var count,
            hours,
            min, max,
            hour, i;

        count = this.view.calendar._getTimeCellCount();
        this.selectableMin = 0;
        this.selectableMax = 24 * count - 1;
        
        if(this.view.singleSelect) {
            hours = this.view._getScheduleInfo(td.weekIndex);
            min = -1;
            max = 24 * count;

            if (hours) {
                for (i = 0; i < hours.length; i++) {
                    hour = hours[i];
                    if (hour.beginRowIndex < td.hourIndex) {
                        if (hour.beginRowIndex > min)
                            min = hour.beginRowIndex;
                    } else {
                        if (hour.beginRowIndex < max)
                            max = hour.beginRowIndex;
                    }
                    if (hour.endRowIndex < td.hourIndex) {
                        if (hour.endRowIndex > min)
                            min = hour.endRowIndex;
                    } else {
                        if (hour.endRowIndex < max)
                            max = hour.endRowIndex;
                    }
                }
            }
            this.selectableMin = min + 1;
            this.selectableMax = max - 1;
        }
    },
    getSelectorInfo: function() {
        var box = this.selectionBox;
        return {
            element: box,
            top: parseFloat(box.css("top")),
            left: parseFloat(box.css("left")),
            parentWidth: this.view.viewPanel.width() - timeTitleWidth,
            parentHeight: this.view.hourTable.outerHeight()
        };
    },
    /** 获取选则的内容 */
    getSelection: function() {
        var result,
            cells,
            unitCount,
            getDateFn,
            i, len;
        
        cells = this._getSelectedCells();
        if(cells.length === 0) {
            return null;
        }

        result = {
            weekIndex: null,
            timeArray: []
        };

        unitCount = this.view.calendar._getTimeCellCount();
        getDateFn = function(hourIndex) {
            var h, m;
            h = Math.floor(hourIndex / unitCount);
            m = (hourIndex / unitCount - h) * 60;
            return {
                hours: h,
                minutes: m,
                seconds: 0
            };
        };

        result.weekIndex = cells[0].weekIndex;
        result.timeArray.push(getDateFn(cells[0].hourIndex));
        for(i = 0, len = cells.length; i < len; i++) {
            result.timeArray.push(getDateFn(cells[i].hourIndex + 1));
        }
        return result;
    },
    /** 根据时间设置选则的区域 */
    setSelectionByTime: function (weekDay, beginTime, endTime) {
        var pointX,
            beginPointY, endPointY,
            begin, end;

        pointX = (weekDay + 1) * this.cellWidth - 1;
        beginPointY = (this.view.calendar.timeToIndex(beginTime) + 1) * this.cellHeight - 1;
        endPointY = this.view.calendar.timeToIndex(endTime) * this.cellHeight - 1;
        begin = this._getCellByPoint(pointX, beginPointY);
        end = this._getCellByPoint(pointX, endPointY);

        this.focusX = pointX;
        this.focusY = beginPointY;

        this.view.setBeginTime(beginTime);

        this._startCell = begin;
        return this._selectCell(begin, end);
    },
    /** 取消选择 */
    cancelSelection: function () {
        var box = this.selectionBox;
        box.css("display", "none");

        this._startCell = null;
        this.focusX = 0;
        this.focusY = 0;

        this.view.calendar.fire("deselected", {
            view: this.view, 
            element: box
        });
    },
    /** 激活选择器 */
    active: function (justEvent) {
        if (!justEvent) {
            this.selectionBox.css("display", "none");
        }
        $(document).on("mousedown", this.mouseLeftButtonDownHandler);
    },
    /** 休眠选择器 */
    dormant: function (justEvent) {
        if (!justEvent) {
            this.cancelSelection();
        }
        $(document).off("mousedown", this.mouseLeftButtonDownHandler);
    }
};

viewTypes = {
    "YEARVIEW": YearView,
    "MONTHVIEW": MonthView,
    "WEEKVIEW": WeekView,
    "DAYVIEW": DayView
};
ui.ctrls.define("ui.ctrls.CalendarView", {
    _defineOption: function() {
        return {
            // 要包含的日历视图，YearView: 年视图, MonthView: 月视图, WeekView: 周视图, DayView: 天视图
            views: ["YearView", "MonthView", "WeekView", "DayView"],
            // 默认显示的视图，如果不写则默认为第一个视图
            defaultView: "WeekView",
            // 周视图和天视图的单位时间
            unitTime: 30,
            // 星期天是否为一周的第一天
            sundayFirst: false,
            // 开始日期
            startDate: null,
            // 年视图是否可以多选
            yearMultipleSelect: false,
            // 月视图是否可以多选
            monthMultipleSelect: false,
            // 周视图已经添加日程的时间段后不能再次选择
            weekSingleSelect: false,
            // 日视图已经添加日程的时间段后不能再次选择
            daySingleSelect: false,
            // 周视图标题格式化器
            formatWeekDayHead: null,
            // 日视图标题格式化器
            formatDayHead: null
        };
    },
    _defineEvents: function() {
        return [
            //日历视图切换前
            "viewChanging", 
            //日历视图切换后
            "viewChanged", 
            //日历内容更新前
            "changing", 
            //日历内容更新后
            "changed", 
            //日历选择前
            "selecting", 
            //日历选择后
            "selected",
            //日历取消选择
            "deselected",
            //周和日视图标题点击
            "weekTitleClick",
            //取消选中
            "cancel"
        ];
    },
    _create: function() {
        var value;
        if (!ui.core.isNumber(this.option.unitTime)) {
            this.option.unitTime = 30;
        } else {
            value = 60 / this.option.unitTime;
            if (value % 2) {
                value -= 1;
                this.option.unitTime = 60 / value;
            }
        }

        this.views = {};

        if(!ui.core.isString(this.option.defaultView) || this.option.defaultView.length === 0) {
            this.option.defaultView = "WeekView";
        }

        if (this.option.startDate instanceof Date) {
            this.currentDate = this.option.startDate;
        } else {
            this.currentDate = new Date();
        }

        this.viewChangeAnimator = ui.animator({
            ease: ui.AnimationStyle.easeTo,
            onChange: function (val, elem) {
                elem.css("left", val + "px");
            }
        });
        this.viewChangeAnimator.addTarget({
            ease: ui.AnimationStyle.easeFrom,
            onChange: function (val, elem) {
                elem.css("opacity", val / 100);
            }
        });
        this.viewChangeAnimator.duration = 500;
    },
    _render: function() {
        var i, len,
            viewName,
            that;

        this.element
            .addClass("ui-calendar-view")
            .css("position", "relative");

        for (i = 0, len = this.option.views.length; i < len; i++) {
            viewName = this.option.views[i];
            if(!ui.core.isString(viewName)) {
                continue;
            }
            viewName = viewName.toUpperCase();
            if (viewTypes.hasOwnProperty(viewName)) {
                this.views[viewName] = viewTypes[viewName](this);
            }
        }

        if(!this.hasView(this.option.defaultView)) {
            for(i in this.views) {
                if(this.views.hasOwnProperty(i)) {
                    this.option.defaultView = i;
                    break;
                }
            }
        }
        that = this;
        // 延迟显示默认视图，给绑定事件留时间
        setTimeout(function() {
            that.changeView(that.option.defaultView, false);
        });
    },
    _getTimeCellCount: function () {
        return Math.floor(60 / this.option.unitTime) || 1;
    },
    _timeToCellNumber: function(time) {
        var arr,
            count,
            hour,
            minute,
            second;
        arr = time.split(":");
        count = this._getTimeCellCount();
        hour = parseInt(arr[0], 10);
        minute = parseInt(arr[1], 10);
        second = parseInt(arr[2], 10);
        return (hour + minute / 60) * count;
    },
    _doChange: function(actionName) {
        if(this.fire("changing", this.currentView, actionName) === false) {
            return;
        }
        this.currentView[actionName].call(this.currentView);
        this.fire("changed", this.currentView, actionName);
    },

    //API
    /** 一周的开始是否是星期天 */
    isSundayFirst: function() {
        return !!this.option.sundayFirst;
    },
    /** 获取一个日期所在周的所有日期 */
    getWeek: function(date) {
        var days = null,
            week, firstDay,
            i, len;
        if(date instanceof Date) {
            date = new Date(date.getTime());
            days = [];
            len = 7;
            if(this.isSundayFirst()) {
                week = date.getDay();
                date.setDate(date.getDate() - week);
            } else {
                week = date.getDay() || len;
                date.setDate(date.getDate() - week + 1);
            }
            firstDay = new Date(date.getTime());
            days.push(firstDay);
            for(i = 1; i < len; i++) {
                days.push(new Date(date.setDate(date.getDate() + 1)));
            }
        }
        return days;
    },
    /** 获取一个日期所在周的第一天日期和最后一天日期 */
    getWeekStartEnd: function(date) {
        var week,
            result = null;
        if(date instanceof Date) {
            date = new Date(date.getTime());
            result = {
                year: date.getFullYear(),
                month: date.getMonth() + 1
            };
            if(this.isSundayFirst()) {
                week = date.getDay();
                date.setDate(date.getDate() - week);
            } else {
                week = date.getDay() || 7;
                date.setDate(date.getDate() - week + 1);
            }

            result.weekStartDate = new Date(date.getTime());
            result.weekStartDay = result.weekStartDate.getDate();
            result.weekEndDate = new Date(date.setDate(date.getDate() + 6));
            result.weekEndDay = result.weekEndDate.getDate();
        }
    },
    /** 获取日期所在的周的列索引 */
    getWeekIndexOf: function(date) {
        var index = null;
        if(date instanceof Date) {
            index = date.getDay();
            if(!this.isSundayFirst()) {
                if(index === 0) {
                    index = 6;
                } else {
                    index--;
                }
            }
        }
        return index;
    },
    /** 获取周末的索引 */
    getWeekendIndexes: function() {
        var result = {
            saturday: 6,
            sunday: 0
        };
        if (!this.isSundayFirst()) {
            result.saturday = 5;
            result.sunday = 6;
        }
        return result;
    },
    /** 判断是否是周末 */
    isWeekend: function(weekDay) {
        if(this.isSundayFirst()) {
            return weekDay === 6 || weekDay === 0;
        } else {
            return weekDay === 5 || weekDay === 6;
        }
    },
    /** 获取月份的索引rowIndex, cellIndex */
    getTableIndexOf: function(date) {
        var first,
            startIndex,
            day,
            result = null;
        if(date instanceof Date) {
            first = new Date(date.getFullYear(), date.getMonth(), 1);
            startIndex = this.getWeekIndexOf(first);
            day = date.getDate() + startIndex - 1;
            result = {
                rowIndex: Math.floor(day / 7),
                cellIndex: 0
            };
            result.cellIndex = day - result.rowIndex * 7;
        }
        return result;
    },
    /** 获取周的名称 */
    getWeekNames: function() {
        if (this.isSundayFirst()) {
            return sundayFirstWeek;
        } else {
            return mondayFirstWeek;
        }
    },
    /** 将周视图和日视图中的索引转换成对应的时间 */
    indexToTime: function(index) {
        var count,
            hour,
            arr,
            text;
        
        count = this._getTimeCellCount();
        hour = twoNumberFormatter(index / count);
        arr = hour.split(".");
        text = arr[0] + ":";
        if(arr.length > 1) {
            text += twoNumberFormatter(parseFloat("0." + arr[1]) * 60);
        } else {
            text += "00";
        }
        return text;
    },
    /** 将时间转换为周视图和日视图的索引 */
    timeToIndex: function(time) {
        if(!time) {
            time = "00:00";
        }
        return Math.ceil(this._timeToCellNumber(time));
    },
    /** 将时间转换为周视图和日视图对应的position */
    timeToPosition: function(time, unitHeight) {
        if(!time) {
            time = "00:00";
        }
        return this._timeToCellNumber(time) * unitHeight;
    },
    /** 显示周视图和日视图的当前时间指示器 */
    showTimeLine: function(parent, unitHourHeight) {
        var updateInterval,
            updateTimeFn,
            that;
        if(!this.currentTimeElement) {
            this.currentTimeElement = $("<div class='ui-current-time border-highlight font-highlight' />");
            this.currentTimeElement.css("width", timeTitleWidth + "px");
            this.element.append(this.currentTimeElement);
        } else {
            this.currentTimeElement.css("display", "block");
        }
        if(this._timeoutHandler) {
            clearTimeout(this._timeoutHandler);
            this._timeoutHandler = null;
        }
        parent.append(this.currentTimeElement);
        // 30秒更新一次
        updateInterval = 30 * 1000;
        that = this;
        updateTimeFn = function() {
            var time,
                index,
                top,
                elem;

            time = formatTime(new Date());
            index = that.timeToIndex(time);
            top = that.timeToPosition(time, unitHourHeight);
            elem = that.currentTimeElement;
            
            elem.html("<span class='ui-current-time-text'>" + time.substring(0, 5) + "</span>");
            if(index <= 1) {
                elem.addClass("ui-current-time-top").css("top", top + "px");
            } else {
                elem.removeClass("ui-current-time-top").css("top", top - currentTimeLineHeight + "px");
            }
            that._timeoutHandler = setTimeout(updateTimeFn, updateInterval);
        };
        this._timeoutHandler = setTimeout(updateTimeFn);
    },
    /** 隐藏周视图和日视图的当前时间指示器 */
    hideTimeLine: function() {
        if(this._timeoutHandler) {
            clearTimeout(this._timeoutHandler);
        }
        if(this.currentTimeElement) {
            this.currentTimeElement.css("display", "none");
        }
    },
    /** 当前视图向前切换 */
    previous: function() {
        this._doChange("previous");
    },
    /** 当前视图向后切换 */
    next: function() {
        this._doChange("next");
    },
    /** 当前视图切换到今天所在 */
    today: function() {
        this._doChange("today");
    },
    /** 判断是否包含view视图 */
    hasView: function(viewName) {
        return this.views.hasOwnProperty((viewName + "").toUpperCase());
    },
    /** 判断视图是否为某个名称的视图 */
    isView: function(view, viewName) {
        if(!view) {
            return false;
        }
        viewName = (viewName + "").toUpperCase();
        return view.toString().toUpperCase().lastIndexOf(viewName) !== -1;
    },
    /** 获取注册的视图 */
    getView: function(viewName) {
        viewName = (viewName + "").toUpperCase();
        if (this.views.hasOwnProperty(viewName)) {
            return this.views[viewName];
        } else {
            return null;
        }
    },
    /** 切换视图 */
    changeView: function(viewName, animation) {
        var view,
            isInitialled,
            isChanged,
            width,
            that,
            option,
            endFn;
        
        view = this.views[(viewName + "").toUpperCase()];
        if(!view) {
            throw new Error(ui.str.format("没有注册名为{0}的视图", viewName));
        }

        if(this.fire("viewChanging", this.currentView, view) === false) {
            return;
        }

        if (this.currentView) {
            this.viewChangeAnimator.stop();
            this.currentView.viewPanel.css({
                "display": "none",
                "opacity": 0
            });
            this.currentView.dormant();
            this.currentView = null;
        }

        this.currentView = view;
        width = this.element.width();
        this.currentView.viewPanel.css({
            "display": "block",
            "left": (width / 3) + "px"
        });

        isInitialled = false;
        if(!view.initialled) {
            view.render();
            isInitialled = true;
        }

        isChanged = view.checkChange();
        view.setSize(this.element.width(), this.element.height());

        that = this;
        endFn = function() {
            that.currentView.active();
            that.fire("viewChanged", that.currentView);
            if (isInitialled || isChanged) {
                that.fire("changed", that.currentView);
            }
        };

        if(animation === false) {
            this.currentView.viewPanel.css({
                "display": "block",
                "left": "0",
                "opacity": 1
            });
            endFn();
            return;
        }
        
        option = this.viewChangeAnimator[0];
        option.target = this.currentView.viewPanel;
        option.begin = width / 3;
        option.end = 0;

        option = this.viewChangeAnimator[1];
        option.target = this.currentView.viewPanel;
        option.begin = 0;
        option.end = 100;

        this.viewChangeAnimator.onEnd = endFn;
        this.viewChangeAnimator.start();
    },
    /** 设置大小 */
    setSize: function(width, height) {
        this.element.css("height", height + "px");
        if(this.currentView) {
            this.currentView.setSize(width, height);
        }
    },
    /** 获取当前视图的标题文字信息 */
    getTitle: function() {
        if(this.currentView) {
            return this.currentView.getTitle();
        } else {
            return "";
        }
    }
});

$.fn.calendarView = function(option) {
    if(this.length === 0) {
        return null;
    }
    if(!isCalendarViewThemeInitialized) {
        initCalendarViewTheme();
    }
    return ui.ctrls.CalendarView(option, this);
};

var themeStyle,
    isCalendarViewThemeInitialized = false;
function initCalendarViewTheme(colorInfo) {
    var baseColor,
        color,
        styleHelper;

    isCalendarViewThemeInitialized = true;
    if(!themeStyle) {
        themeStyle = $("#GlobalThemeChangeStyle");
        if (themeStyle.length === 0) {
            styleHelper = ui.StyleSheet.createStyleSheet("GlobalThemeChangeStyle");
            themeStyle = styleHelper.styleSheet;
        } else {
            styleHelper = ui.StyleSheet(themeStyle);
        }
    } else {
        styleHelper = ui.StyleSheet(themeStyle);
    }
    if(!colorInfo) {
        colorInfo = ui.theme.currentHighlight;
    }

    baseColor = ui.theme.backgroundColor || "#FFFFFF";

    color = ui.color.overlay(colorInfo.Color, baseColor, .4);
    color = ui.color.rgb2hex(color.red, color.green, color.blue);
    styleHelper.setRule(".ui-calendar-selector", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-hour-panel .schedule-item-panel", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-hour-panel .schedule-item-panel:hover", {
        "background-color": colorInfo.Color
    });
    styleHelper.setRule(".ui-calendar-month-day-view .month-days-table .selected", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-year-view .year-month-table .selected", {
        "background-color": color
    });

    color = ui.color.overlay(colorInfo.Color, baseColor, .85);
    color = ui.color.rgb2hex(color.red, color.green, color.blue);
    styleHelper.setRule(".ui-calendar-hour-panel .week-hour-cell-today", {
        "background-color": color
    });

    color = ui.color.overlay(colorInfo.Color, baseColor, .7);
    color = ui.color.rgb2hex(color.red, color.green, color.blue);
    styleHelper.setRule(".ui-calendar-month-day-view .month-days-cell .schedule-item", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-month-day-view .month-days-cell .schedule-border", {
        "background-color": colorInfo.Color
    });
}
ui.page.hlchanged(function(e, colorInfo) {
    initCalendarViewTheme(colorInfo);
});


})(jQuery, ui);

// Source: src/control/view/card-view.js

(function($, ui) {
// CardView

var selectedClass = "ui-card-view-selection",
    itemTitleHeight = 30,
    marginValueLimit = 4,
    frameBorderWidth = 4;

function noop() {}
function prepareGroup(option) {
    var type;
    type = ui.core.type(option);
    if(type === "string") {
        this.option.group = {
            groupField: option,
            itemsField: "_items",
            groupListHandler: defaultGroupListHandler,
            headFormatter: defaultGroupHeadFormatter,
            headRearrangeHandler: defaultHeadRearrangeHandler
        };
    } else if(type === "object") {
        if(!ui.core.isFunction(option.groupListHandler)) {
            option.groupListHandler = defaultGroupListHandler;
        }
        if(!option.groupField) {
            throw new TypeError("the groupField can not be null or empty.");
        }
        if(!option.itemsField) {
            option.itemsField = "_items";
        }
        if(!ui.core.isFunction(option.headFormatter)) {
            option.headFormatter = defaultGroupHeadFormatter;
        }
        if(!ui.core.isFunction(option.headRearrangeHandler)) {
            option.headRearrangeHandler = noop;
        }
    } else {
        this.option.group = false;
    }
}

function defaultGroupListHandler(viewData, groupField, itemsField) {
    var groupList = ui.trans.listToGroup(viewData, groupField, null, itemsField);
    return groupList;
}

function defaultGroupHeadFormatter(groupItem, margin) {
    return ui.str.format(
        "<span style='margin-left:{0}px;margin-right:{0}px' class='item-head-title font-highlight'>{1}</span>", 
        margin, 
        groupItem[this.option.group.groupField]);
}

function defaultHeadRearrangeHandler(itemHead, groupIndex, groupItem, margin) {
    var span = itemHead.children(".item-head-title");
    span.css({
        "margin-left": margin + "px",
        "margin-right": margin + "px"
    });
    if(groupIndex === 0) {
        itemHead.css("margin-top", margin + "px");
    }
}

function preparePager(option) {
    if(option.showPageInfo === true) {
        if(!option.pageInfoFormatter) {
            option.pageInfoFormatter = {
                currentRowNum: function(val) {
                    return "<span>本页" + val + "项</span>";
                },
                rowCount: function(val) {
                    return "<span class='font-highlight'>共" + val + "项</span>";
                },
                pageCount: function(val) {
                    return "<span>" + val + "页</span>";
                }
            };
        }
    }

    this.pager = ui.ctrls.Pager(option);
    this.pageIndex = this.pager.pageIndex;
    this.pageSize = this.pager.pageSize;
}

// 事件处理函数
// 选择事件
function onBodyClick(e) {
    var elem = $(e.target);
    while(!elem.hasClass("view-item")) {
        if(elem.hasClass("ui-card-view-body")) {
            return;
        }
        elem = elem.parent();
    }

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    this._selectItem(elem);
}

ui.ctrls.define("ui.ctrls.CardView", {
    _defineOption: function() {
        return {
            // 视图数据
            viewData: null,
            // 没有数据时显示的提示信息
            promptText: "没有数据",
            // 分组信息 
            /*
                string: 数据按该字段名分组,
                object: { 
                    groupField: string, 
                    itemsField: string, 
                    groupListHandler: function, 
                    headFormatter: function, 
                    headRearrangeHandler: function 
                }
            */
            group: false,
            // 高度
            width: false,
            // 宽度
            height: false,
            // 卡片项宽度
            itemWidth: 200,
            // 卡片项高度
            itemHeight: 200,
            // 卡片格式化器
            renderItemFormatter: null,
            // 分页信息
            pager: {
                // 当前页码，默认从第1页开始
                pageIndex: 1,
                // 记录数，默认30条
                pageSize: 30,
                // 显示按钮数量，默认显示10个按钮
                pageButtonCount: 10,
                // 是否显示分页统计信息，true|false，默认不显示
                showPageInfo: false,
                // 格式化器，包含currentRowNum, rowCount, pageCount的显示
                pageInfoFormatter: null
            },
            // 选择逻辑单选或多选
            selection: {
                multiple: false
            }
        };
    },
    _defineEvents: function() {
        var events = ["selecting", "selected", "deselected", "rebind", "cancel"];
        if(this.option.pager) {
            events.push("pagechanging");
        }
        return events;
    },
    _create: function() {
        this._itemBodyList = [];
        this._selectList = [];
        this._hasPrompt = !!this.option.promptText;
        this._currentMarginInfo = null;

        this.viewBody = null;
        this.pagerHeight = 30;

        if(this.option.group) {
            prepareGroup.call(this, this.option.group);
        }

        if(this.option.pager) {
            preparePager.call(this, this.option.pager);
        }

        if(!ui.core.isNumber(this.option.width) || this.option.width <= 0) {
            this.option.width = false;
        }
        if(!ui.core.isNumber(this.option.height) || this.option.height <= 0) {
            this.option.height = false;
        }

        /// 事件处理程序
        // 项目选中处理程序
        this.onBodyClickHandler = onBodyClick.bind(this);
    },
    _render: function() {
        if(!this.element.hasClass("ui-card-view")) {
            this.element.addClass("ui-card-view");
        }

        this._initBorderWidth();

        this.viewBody = $("<div class='ui-card-view-body' />");
        this._initDataPrompt();
        this.element.append(this.viewBody);
        if(this.option.selection) {
            this.viewBody.click(this.onBodyClickHandler);
        }
        this._initPagerPanel();

        this.setSize(this.option.width, this.option.height);
        // 修正selection设置项
        if(!this.option.selection) {
            this.option.selection = false;
        } else {
            if(this.option.selection.type === "disabled") {
                this.option.selection = false;
            }
        }

        if(Array.isArray(this.option.viewData)) {
            this.fill(this.option.viewData, this.option.viewData.length);
        }
    },
    _initBorderWidth: function() {
        var getBorderWidth = function(key) {
            return parseInt(this.element.css(key), 10) || 0;
        };
        this.borderWidth = 0;
        this.borderHeight = 0;

        this.borderWidth += getBorderWidth.call(this, "border-left-width");
        this.borderWidth += getBorderWidth.call(this, "border-right-width");

        this.borderHeight += getBorderWidth.call(this, "border-top-width");
        this.borderHeight += getBorderWidth.call(this, "border-bottom-width");
    },
    _initDataPrompt: function() {
        var text;
        if(this._hasPrompt) {
            this._dataPrompt = $("<div class='data-prompt' />");
            text = this.option.promptText;
            if (ui.core.isString(text) && text.length > 0) {
                this._dataPrompt.html("<span class='font-highlight'>" + text + "</span>");
            } else if (ui.core.isFunction(text)) {
                text = text();
                this._dataPrompt.append(text);
            }
            this.viewBody.append(this._dataPrompt);
        }
    },
    _initPagerPanel: function() {
        if(this.pager) {
            this.gridFoot = $("<div class='ui-card-view-foot clear' />");
            this.element.append(this.gridFoot);
            
            this.pager.pageNumPanel = $("<div class='page-panel' />");
            if (this.option.pager.displayDataInfo) {
                this.pager.pageInfoPanel = $("<div class='data-info' />");
                this.gridFoot.append(this.pager.pageInfoPanel);
            } else {
                this.pager.pageNumPanel.css("width", "100%");
            }

            this.gridFoot.append(this.pager.pageNumPanel);
            this.pager.pageChanged(function(pageIndex, pageSize) {
                this.pageIndex = pageIndex;
                this.pageSize = pageSize;
                this.fire("pagechanging", pageIndex, pageSize);
            }, this);
        }
    },
    _rasterizeItems: function(isCreate, fn) {
        var marginInfo,
            arr,
            isGroup,
            groupOption,
            that,
            head, body,
            elements,
            isFunction;

        arr = this.getViewData();
        if(arr.length === 0) {
            return;
        }
        isGroup = this.isGroup();
        if(isGroup) {
            if(!this._groupData) {
                groupOption = this.option.group;
                this._groupData = groupOption.groupListHandler.call(this, arr, groupOption.groupField, groupOption.itemsField);
            }
            arr = this._groupData;
        }
        marginInfo = this._getMargin(arr);
        this._currentMarginInfo = marginInfo;
        if(marginInfo.count === 0) return;
        
        isFunction = ui.core.isFunction(fn);
        elements = [];
        that = this;

        this._viewDataIndex = -1;
        if(isGroup) {
            arr.forEach(function(item, groupIndex) {
                body = that._getItemBody(groupIndex, isGroup, elements, marginInfo.margin);
                that._fillItemBody(item[that.option.group.itemsField], groupIndex, body, marginInfo, isFunction, fn);
            });
        } else {
            body = this._getItemBody(0, isGroup, elements, marginInfo.margin);
            this._fillItemBody(arr, 0, body, marginInfo, isFunction, fn);
        }
        delete this._viewDataIndex;

        if(elements.length > 0) {
            that.viewBody.append(elements);
        }
    },
    _getItemBody: function(groupIndex, isGroup, elements, margin) {
        var itemBody,
            itemHead;
        itemBody = this._itemBodyList[groupIndex];
        if(!itemBody) {
            if(isGroup) {
                itemHead = $("<div class='item-head' />");
                itemHead.append(this.option.group.headFormatter.call(this, this._groupData[groupIndex], margin));
                if(elements.length === 0) {
                    itemHead.css("margin-top", margin + "px");
                }
                elements.push(itemHead);
            }
            itemBody = $("<div class='item-body' />");
            elements.push(itemBody);
            this._itemBodyList.push(itemBody);
        } else {
            if(isGroup) {
                itemHead = itemBody.prev();
                this.option.group.headRearrangeHandler.call(this, itemHead, groupIndex, this._groupData[groupIndex], margin);
            }
        }
        return itemBody;
    },
    _fillItemBody: function(arr, groupIndex, itemBody, marginInfo, isFunction, fn) {
        var rows, 
            i, j,
            index,
            top, left,
            item;

        rows = Math.floor((arr.length + marginInfo.count - 1) / marginInfo.count);
        itemBody.css("height", (rows * (this.option.itemHeight + marginInfo.margin) + marginInfo.margin) + "px");
        for(i = 0; i < rows; i++) {
            for(j = 0; j < marginInfo.count; j++) {
                index = (i * marginInfo.count) + j;
                if(index >= arr.length) {
                    return;
                }
                this._viewDataIndex++;
                top = (i + 1) * marginInfo.margin + (i * this.option.itemHeight);
                left = (j + 1) * marginInfo.margin + (j * this.option.itemWidth);
                item = arr[index];
                item._group = {
                    index: groupIndex,
                    itemIndex: index
                };
                if(isFunction) {
                    fn.call(this, itemBody, item, this._viewDataIndex, top, left);
                }
            }
        }
    },
    _getMargin: function(groupList, scrollHeight) {
        var currentWidth,
            currentHeight,
            result,
            restWidth,
            flag,
            isGroup,
            checkOverflow;

        currentWidth = this.viewBody.width();
        currentHeight = this.viewBody.height();
        isGroup = this.isGroup();
        checkOverflow = function(list, res) {
            // scroll height 避免同名
            var sh, 
                i, 
                len;
            if(res.count === 0) {
                return res;
            }

            if(isGroup) {
                sh = res.margin;
                for(i = 0, len = list.length; i < len; i++) {
                    sh += itemTitleHeight;
                    sh += Math.floor((list[i][this.option.group.itemsField].length + res.count - 1) / res.count) * (res.margin + this.option.itemHeight) + res.margin;
                }
            } else {
                sh = Math.floor((list.length + res.count - 1) / res.count) * (res.margin + this.option.itemHeight) + res.margin;
            }

            if(sh > currentHeight) {
                return this._getMargin(len, sh);
            } else {
                return res;
            }
        };

        if(scrollHeight) {
            flag = true;
            if(scrollHeight > currentHeight) {
                currentWidth -= ui.scrollbarWidth;
            }
        }
        result = {
            count: Math.floor(currentWidth / this.option.itemWidth),
            margin: 0
        };
        restWidth = currentWidth - result.count * this.option.itemWidth;
        result.margin = Math.floor(restWidth / (result.count + 1));
        if(result.margin >= marginValueLimit) {
            return flag ? result : checkOverflow.call(this, groupList, result);
        }
        result.margin = marginValueLimit;

        result.count = Math.floor((currentWidth - ((result.count + 1) * result.margin)) / this.option.itemWidth);
        restWidth = currentWidth - result.count * this.option.itemWidth;
        result.margin = Math.floor(restWidth / (result.count + 1));

        return flag ? result : checkOverflow.call(this, groupList, result);
    },
    _createItem: function(itemData, index) {
        var div = $("<div class='view-item' />");
        div.css({
            "width": this.option.itemWidth + "px",
            "height": this.option.itemHeight + "px"
        });
        div.attr("data-index", index);
        return div;
    },
    _renderItem: function(itemElement, itemData, index) {
        var elem, frame, formatter;

        formatter = this.option.renderItemFormatter;
        if(ui.core.isFunction(formatter)) {
            elem = formatter.call(this, itemData, index);
            if(elem) {
                itemElement.append(elem);
            }
        }
        frame = $("<div class='frame-panel border-highlight'/>");
        frame.css({
            "width": this.option.itemWidth - (frameBorderWidth * 2) + "px",
            "height": this.option.itemHeight - (frameBorderWidth * 2) + "px"
        });
        itemElement.append(frame);
        itemElement.append("<i class='check-marker border-highlight'></i>");
        itemElement.append("<i class='check-icon fa fa-check'></i>");
    },
    _renderPageList: function(rowCount) {
        if (!this.pager) {
            return;
        }
        this.pager.data = this.option.viewData;
        this.pager.pageIndex = this.pageIndex;
        this.pager.pageSize = this.pageSize;
        this.pager.renderPageList(rowCount);
    },
    _rearrangeItems: function() {
        var i, len,
            childrenList;
        if(this._itemBodyList.length === 0)
            return;
        
        childrenList = [];
        for(i = 0, len = this._itemBodyList.length; i < len; i++) {
            childrenList.push(this._itemBodyList[i].children());
        }
        this._rasterizeItems(false, function(itemBody, item, index, top, left) {
            var elem,
                group;

            group = item._group;
            elem = childrenList[group.index][group.itemIndex];
            $(elem).css({
                "top": top + "px",
                "left": left + "px"
            });
        });
    },
    _getSelectionData: function(elem) {
        var groupIndex,
            itemIndex,
            index,
            data,
            viewData;

        index = parseInt(elem.attr("data-index"), 10);
        viewData = this.getViewData();
        data = {
            itemIndex: index,
            itemData: viewData[index]
        };
        if(this.isGroup()) {
            data.group = {
                index: data.itemData._group.index,
                itemIndex: data.itemData._group.itemIndex
            };
        }
        return data;
    },
    _selectItem: function(elem) {
        var eventData,
            result,
            i, len;

        eventData = this._getSelectionData(elem);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        result = this.fire("selecting", eventData);
        if(result === false) {
            return;
        }

        if(this.isMultiple()) {
            if(elem.hasClass(selectedClass)) {
                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if(this._selectList[i] === elem[0]) {
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
                elem.removeClass(selectedClass);
                this.fire("deselected", eventData);
            } else {
                this._selectList.push(elem[0]);
                elem.addClass(selectedClass);
                this.fire("selected", eventData);
            }
        } else {
            if(this._current) {
                this._current.removeClass(selectedClass);
                if(this_current[0] === elem[0]) {
                    this._current = null;
                    this.fire("deselected", eventData);
                    return;
                }
                this._current = elem;
                elem.addClass(selectedClass);
                this.fire("selected", eventData);
            }
        }
    },
    _getItemElement: function(index) {
        var group,
            viewData,
            itemBody,
            items,
            item;

        viewData = this.getViewData();
        if(viewData.length === 0) {
            return null;
        }
        item = viewData[index];
        group = item._group;

        itemBody = this._itemBodyList[group.index];
        if(!itemBody) {
            return null;
        }

        items = itemBody.children();
        item = items[group.itemIndex];
        if(item) {
            return $(item);
        }
        return null;
    },
    _updateIndexes: function(groupIndex, itemIndex, viewDataStartIndex) {
        var itemBody,
            viewData,
            children,
            item,
            i, j;
        viewData = this.getViewData();
        for(i = groupIndex; i < this._itemBodyList.length; i++) {
            itemBody = this._itemBodyList[i];
            children = itemBody.children();
            for(j = itemIndex; j < children.length; j++) {
                $(children[j]).attr("data-index", viewDataStartIndex);
                item = viewData[viewDataStartIndex];
                item._group = {
                    index: i,
                    itemIndex: j
                };
                viewDataStartIndex++;
            }
            itemIndex = 0;
        }
    },
    _removeGroup: function(itemBody) {
        var itemHead;
        itemHead = itemBody.prev();
        if(itemHead.length > 0 && itemHead.hasClass("item-head")) {
            itemHead.remove();
        }
        itemBody.remove();
    },
    _promptIsShow: function() {
        return this._hasPrompt && this._dataPrompt.css("display") === "block";
    },
    _setPromptLocation: function() {
        var height = this._dataPrompt.height();
        this._dataPrompt.css("margin-top", -(height / 2) + "px");
    },
    _showDataPrompt: function() {
        if(!this._hasPrompt) return;
        this._dataPrompt.css("display", "block");
        this._setPromptLocation();
    },
    _hideDataPrompt: function() {
        if(!this._hasPrompt) return;
        this._dataPrompt.css("display", "none");
    },

    /// API
    /** 数据填充 */
    fill: function(viewData, rowCount) {
        var isRebind;

        isRebind = false;
        if(this._itemBodyList.length > 0) {
            isRebind = true;
            this.viewBody.scrollTop(0);
            this.clear(false);
        }

        if(!Array.isArray(viewData)) {
            viewData = [];
        }
        this.option.viewData = viewData;

        if(viewData.length === 0) {
            this._showDataPrompt();
            return;
        } else {
            this._hideDataPrompt();
        }

        this._rasterizeItems(true, function(itemBody, itemData, index, top, left) {
            var elem = this._createItem(itemData, index);
            elem.css({
                "top": top + "px",
                "left": left + "px"
            });
            this._renderItem(elem, itemData, index);
            itemBody.append(elem);
        });

        //update page numbers
        if ($.isNumeric(rowCount)) {
            this._renderPageList(rowCount);
        }

        if (isRebind) {
            this.fire("rebind");
        }
    },
    /** 获取选中的数据，单选返回单个对象，多选返回数组 */
    getSelection: function() {
        var result,
            i, len;
        if(!this.isSelectable()) {
            return null;
        }

        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                result.push(this._getSelectionData($(this._selectList[i])));
            }
        } else {
            result = null;
            if(this._current) {
                result = this._getSelectionData(this._current);
            }
        }
        return result;
    },
    /** 取消选中项 */
    cancelSelection: function() {
        var i, len, elem;
        if(!this.isSelectable()) {
            return;
        }

        if(this.isMultiple()) {
            if(this._selectList.length === 0) {
                return;
            }
            for(i = 0, len = this._selectList.length; i < len; i++) {
                elem = $(this._selectList[i]);
                fn.call(this, elem);
            }
            this._selectList = [];
        } else {
            if(!this._current) {
                return;
            }
            fn.call(this, this._current);
            this._current = null;    
        }
        this.fire("cancel");
    },
    /** 根据索引移除项目 */
    removeAt: function() {
        var elem,
            viewData,
            index,
            indexes,
            i, len, j,
            group;

        viewData = this.getViewData();
        if(viewData.length === 0) {
            return;
        }
        len = arguments.length;
        if(len === 0) {
            return;
        }
        indexes = [];
        for(i = 0; i < len; i++) {
            index = arguments[i];
            if(ui.core.isNumber(index) && index >= 0 && index < viewData.length) {
                indexes.push(index);
            }
        }
        len = indexes.length;
        if(len > 0) {
            indexes.sort(function(a, b) {
                return b - a;
            });
            for(i = 0; i < len; i++) {
                index = indexes[i];
                elem = this._getItemElement(index);
                if(!elem) {
                    continue;
                }
                group = viewData[index]._group;
                this.option.viewData.splice(index, 1);
                if(this.isGroup()) {
                    if(this._groupData[group.index][this.option.group.itemsField].length === 1) {
                        this._groupData.splice(group.index, 1);
                        this._itemBodyList.splice(group.index, 1);
                        this._removeGroup(elem.parent());
                    } else {
                        this._groupData[group.index][this.option.group.itemsField].splice(group.index, 1);
                        elem.remove();
                    }
                } else {
                    elem.remove();
                }

                if(this.isSelectable()) {
                    if(this.isMultiple()) {
                        for(j = 0; j < this._selectList.length; j++) {
                            if(this._selectList[j] === elem[0]) {
                                this._selectList.splice(j, 1);
                                break;
                            }
                        }
                    } else {
                        if(this._current && this._current[0] === elem[0]) {
                            this._current = null;
                        }
                    }
                }
            }
            this._updateIndexes(group.index, group.itemIndex, index);
            this._rearrangeItems();
        }
    },
    /** 根据索引更新项目 */
    updateItem: function(index, itemData) {
        var elem;

        if(!ui.core.isNumber(index) || index < 0 || index >= this.count()) {
            return;
        }

        elem = this._getItemElement(index);
        if(elem) {
            elem.empty();
            this.option.viewData[index] = itemData;
            this._renderItem(elem, itemData, index);
        }
    },
    /** 添加项目 */
    addItem: function(itemData) {
        var viewData,
            elem,
            groupIndex,
            groupKey,
            itemBody,
            newGroupItem,
            newGroup,
            newGroupElements,
            i, len;

        if(!itemData) {
            return;
        }

        viewData = this.option.viewData;
        if(!Array.isArray(viewData) || viewData.length === 0) {
            if (this.bodyPanel) {
                this.bodyPanel.remove();
                this.bodyPanel = null;
            }
            this.fill([itemData]);
            return;
        }

        newGroup = {};
        if(this.isGroup()) {
            groupKey = itemData[this.option.group.groupField] + "";
            groupIndex = -1;
            for(i = 0, len = this._groupData.length; i < len; i++) {
                if(this._groupData[i][this.option.group.groupField] === groupKey) {
                    groupIndex = i;
                    break;
                }
            }

            if(groupIndex === -1) {
                // 新分组
                newGroup.index = this._groupData.length;
                newGroup.itemIndex = 0;
    
                newGroupItem = {};
                newGroupItem[this.option.group.groupField] = groupKey;
                newGroupItem[this.option.group.itemsField] = [itemData];
                this._groupData.push(newGroupItem);
    
                newGroupElements = [];
                itemBody = this._getItemBody(newGroup.index, true, newGroupElements, this._currentMarginInfo.margin);
                this.viewBody.append(newGroupElements);
            } else {
                // 老分组追加
                itemBody = this._itemBodyList[groupIndex];
                newGroup.index = groupIndex;
                newGroup.itemIndex = this._groupData[groupIndex][this.option.group.itemsField].length;
                this._groupData[groupIndex][this.option.group.itemsField].push(itemData);
            }
        } else {
            newGroup.index = 0;
            newGroup.itemIndex = viewData.length;
            itemBody = this._itemBodyList[newGroup.index];
        }

        itemData._group = newGroup;
        elem = this._createItem(itemData, viewData.length);
        this._renderItem(elem, itemData, viewData.length);

        viewData.push(itemData);
        itemBody.append(elem);

        this._rearrangeItems();
    },
    /** 插入项目 */
    insertItem: function(index, itemData) {
        var elem,
            newGroup,
            oldItem,
            viewData;
        if(!itemData) {
            return;
        }
        viewData = this.option.viewData;
        if (!Array.isArray(viewData) || viewData.length === 0) {
            this.addItem(itemData);
            return;
        }
        if (index < 0) {
            index = 0;
        }
        if(index >= 0 && index < viewData.length) {
            newGroup = {};
            if(this.isGroup()) {
                oldItem = viewData[index];
                if(oldItem[this.option.group.groupField] !== itemData[this.option.group.groupField]) {
                    throw new Error("the data not belong to the destination group.");
                }
                newGroup.index = oldItem._group.index;
                newGroup.itemIndex = oldItem._group.itemIndex;
                this._groupData[newGroup.index][this.option.group.itemsField].splice(newGroup.itemIndex, 0, itemData);
            } else {
                newGroup.index = 0;
                newGroup.itemIndex = index;
            }

            itemData._group = newGroup;
            elem = this._createItem(itemData, index);
            this._renderItem(elem, itemData, index);

            this._getItemElement(index).before(elem);
            viewData.splice(index, 0, itemData);
            
            this._updateIndexes(newGroup.index, newGroup.itemIndex, index);
            this._rearrangeItems();
        } else {
            this.addItem(itemData);
        }
    },
    /** 获取视图数据 */
    getViewData: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData : [];
    },
    /** 获取当前尺寸下一行能显示多少个元素 */
    getColumnCount: function() {
        return this._currentMarginInfo ? this._currentMarginInfo.count : 0;
    },
    /** 获取当前尺寸下每个元素的边距 */
    getItemMargin: function() {
        return this._currentMarginInfo ? this._currentMarginInfo.margin : 0;
    },
    /** 获取项目数 */
    count: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData.length : 0;
    },
    /** 是否可以选择 */
    isSelectable: function() {
        return !!this.option.selection;
    },
    /** 是否支持多选 */
    isMultiple: function() {
        return this.option.selection.multiple === true;
    },
    /** 是否是分组形式 */
    isGroup: function() {
        return !!this.option.group;
    },
    /** 清空表格数据 */
    clear: function() {
        var that;
        if (this._itemBodyList.length > 0) {
            that = this;
            this._itemBodyList.forEach(function(item) {
                that._removeGroup(item);
            });
            if(this.isGroup()) {
                this._groupData = null;
            }
            this._itemBodyList = [];
            this.option.viewData = [];
            this._selectList = [];
            this._current = null;
        }
        if (this.pager) {
            this.pager.empty();
        }
        if (arguments[0] !== false) {
            this._showDataPrompt();
        }
    },
    /** 设置表格的尺寸, width: 宽度, height: 高度 */
    setSize: function(width, height) {
        var needRecompose = false;
        if(arguments.length === 1) {
            height = width;
            width = null;
        }
        if(ui.core.isNumber(height)) {
            height -= this.borderHeight;
            if(this.pager) {
                height -= this.pagerHeight;
            }
            this.viewBody.css("height", height + "px");
            needRecompose = true;
        }
        if(ui.core.isNumber(width)) {
            width -= this.borderWidth;
            this.element.css("width", width + "px");
            needRecompose = true;
        }
        if(needRecompose) {
            this._rearrangeItems();
        }
        if(this._promptIsShow()) {
            this._setPromptLocation();
        }
    }
});

$.fn.cardView = function(option) {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.CardView(option, this);
};


})(jQuery, ui);

// Source: src/control/view/fold-view.js

(function($, ui) {
// 折叠视图
function onFoldTitleClick(e) {
    var elem,
        nodeName,
        dd, icon;
    
    elem = $(e.target);
    while((nodeName = elem.nodeName()) !== "DT" || 
            !elem.hasClass("ui-fold-view-title")) {

        if(elem.hasClass("ui-fold-view")) {
            return;
        }
        elem = elem.parent();
    }
    icon = elem.children(".ui-fold-view-icon");
    dd = elem.next();
    if(dd.css("display") === "none") {
        icon.removeClass("background-highlight")
            .addClass("font-highlight")
            .html("<i class='fa fa-angle-up' />");
        dd.css("display", "block");
    } else {
        icon.removeClass("font-highlight")
            .addClass("background-highlight")
            .html("<i class='fa fa-angle-down' />");
        dd.css("display", "none");
    }
}
function FoldView(element) {
    if(this instanceof FoldView) {
        this.initialize(element);
    } else {
        return new FoldView(element);
    }
}
FoldView.prototype = {
    constructor: FoldView,
    initialize: function(element) {
        this.element = element;
        this.onFoldTitleClickHandler = $.proxy(onFoldTitleClick, this);
    },
    _render: function() {
        var dtList,
            dt, div, text,
            i, len;
        dtList = this.element.children("dt");
        len = dtList.length;
        if(len > 0) {
            this.element.click(this.onFoldTitleClickHandler);
        }
        for(i = 0; i < len; i++) {
            dt = $(dtList[i]);
            text = dt.text();
            dt.addClass("ui-fold-view-title");
            div = $("<div class='ui-fold-view-icon border-highlight' />");
            if(dt.next().css("display") === "none") {
                div.addClass("background-highlight")
                    .html("<i class='fa fa-angle-down' />");
            } else {
                div.addClass("font-highlight")
                    .html("<i class='fa fa-angle-up' />");
            }
            dt.empty();
            dt.append(div)
                .append("<span class='font-highlight'>" + text + "</span>");
        }
    }
};

$.fn.foldView = function() {
    var i,
        elem,
        foldView;
    if(this.length === 0) {
        return;
    }
    for(i = 0; i < this.length; i++) {
        elem = $(this[i]);
        if(!elem.isNodeName("dl") || !elem.hasClass("ui-fold-view")) {
            continue;
        }
        foldView = FoldView(elem);
        foldView._render();
        elem[0].foldView = foldView;
    }
};


})(jQuery, ui);

// Source: src/control/view/grid-view-group.js

(function($, ui) {
// GridViewGroup

function defaultCreateGroupItem(groupKey) {
    return {
        groupText: groupKey
    };
}
function isGroupItem() {
    return ui.core.type(this.itemIndexes) === "array";
}
function renderGroupItemCell(data, column, index, td) {
    td.isFinale = true;
    td.attr("colspan", this.option.columns.length);
    td.click(this.group.onGroupRowClickHandler);
    this.group["_last_group_index_"] = data.groupIndex;
    return this.group.groupItemFormatter.apply(this, arguments);
}

function onGropRowClick(e) {
    var viewData,
        td,
        groupItem;

    e.stopPropagation();
    td = $(e.target);
    while(!td.isNodeName("td")) {
        if(td.isNodeName("tr")) {
            return;
        }
        td = td.parent();
    }

    viewData = this.gridview.getViewData();
    groupItem = viewData[td.parent()[0].rowIndex];
    if(td.hasClass("group-fold")) {
        td.removeClass("group-fold");
        this._operateChildren(groupItem.itemIndexes, function(item, row) {
            $(row).css("display", "table-row");
        });
    } else {
        td.addClass("group-fold");
        this._operateChildren(groupItem.itemIndexes, function(item, row) {
            $(row).css("display", "none");
        });
    }
}

function GridViewGroup() {
    if(this instanceof GridViewGroup) {
        this.initialize();
    } else {
        return new GridViewGroup();
    }
}
GridViewGroup.prototype = {
    constructor: GridViewGroup,
    initialize: function() {
        this.gridview = null;
        this.onGroupRowClickHandler = onGropRowClick.bind(this);
    },
    _operateChildren: function (list, action) {
        var viewData,
            rowIndex,
            rows, item, result,
            i, len;

        viewData = this.gridview.getViewData();
        rows = this.gridview.tableBody[0].rows;
        for (i = 0, len = list.length; i < len; i++) {
            rowIndex = list[i];
            item = viewData[rowIndex];
            action.call(this, item, rows[rowIndex]);
        }
    },

    /// API
    /** 绑定GridView */
    setGridView: function(gridview) {
        if(gridview instanceof ui.ctrls.GridView) {
            this.gridview = gridview;
            this.gridview.group = this;
        }
    },
    /** 数据结构转换 */
    listGroup: function(list, groupField, createGroupItem) {
        var groupList = [];
        var dict = {};
        
        if(!Array.isArray(list) || list.length === 0) {
            return groupList;
        }
        createGroupItem = $.isFunction(createGroupItem) ? createGroupItem : defaultCreateGroupItem;
        var i = 0,
            len = list.length;
        var item,
            groupKey,
            groupItem;
        for(; i < len; i++) {
            item = list[i];
            groupKey = item[groupField];
            if(!dict.hasOwnProperty(groupKey)) {
                groupItem = createGroupItem.call(item, groupKey);
                groupItem.itemIndexes = [i];
                dict[groupKey] = groupItem;
            } else {
                dict[groupKey].itemIndexes.push(i);
            }
        }
        for(groupKey in dict) {
            groupItem = dict[groupKey];
            groupList.push(groupItem);
            groupItem.groupIndex = groupList.length - 1;
            for(i = 0, len = groupItem.itemIndexes.length; i < len; i++) {
                groupList.push(list[groupItem.itemIndexes[i]]);
                groupItem.itemIndexes[i] = groupList.length - 1;
            }
        }
        return groupList;
    },
    /** 分组行号格式化器，每个分组都会自动调用分组格式化器，并从1开始 */
    rowNumber: function(value, column, index, td) {
        var viewData,
            data;

        viewData = this.getViewData();
        data = viewData[index];

        if(isGroupItem.call(data)) {
            return renderGroupItemCell.call(this, data, column, index, td);
        } else {
            return "<span>" + (index - this.group["_last_group_index_"]) + "</span>";
        }
    },
    /** 分组文本格式化器，每次开始新分组都会自动调用分组格式化器 */
    formatText: function(value, column, index, td) {
        var viewData,
            data;
        
        viewData = this.getViewData();
        data = viewData[index];
        
        if(isGroupItem.call(data)) {
            return renderGroupItemCell.call(this, data, column, index, td);
        } else {
            return ui.ColumnStyle.cfn.defaultText.apply(this, arguments);
        }
    },
    /** 分组单元格格式化器，外部需要重写 */
    groupItemFormatter: function(val, col, idx, td) {
        return null;
    }
};

ui.ctrls.GridViewGroup = GridViewGroup;


})(jQuery, ui);

// Source: src/control/view/grid-view-tree.js

(function($, ui) {
// GridViewTree

var childrenField = "_children",
    parentField = "_parent",
    flagField = "_fromList";

function getValue(field) {
    return this[field];
}
function isTreeNode (item) {
    return !!item[childrenField];
}
function onFoldButtonClick(e) {
    var btn,
        rowIndex,
        rowData;

    e.stopPropagation();

    btn = $(e.target),
    rowIndex = btn.parent().parent()[0].rowIndex;
    rowData = this.gridview.getRowData(rowIndex);

    if (btn.hasClass("unfold")) {
        rowData._isFolded = true;
        btn.removeClass("unfold")
            .removeClass("fa-angle-down")
            .addClass("fa-angle-right");
        this._hideChildren(rowData, rowIndex);
    } else {
        rowData._isFolded = false;
        btn.addClass("unfold")
            .removeClass("fa-angle-right")
            .addClass("fa-angle-down");
        this._showChildren(rowData, rowIndex);
    }
}

function GridViewTree() {
    if(this instanceof GridViewTree) {
        this.initialize();
    } else {
        return new GridViewTree();
    }
}
GridViewTree.prototype = {
    constructor: GridViewTree,
    initialize: function() {
        this.lazy = false;
        this.loadChildrenHandler = null;
        this.gridview = null;
        this.isTreeNode = isTreeNode;
        
        this.onFoldButtonClickHandler = onFoldButtonClick.bind(this);
    },
    //修正父级元素的子元素索引
    _fixParentIndexes: function (rowData, rowIndex, count) {
        var parent = rowData[parentField];
        if (!parent)
            return;
        var children = parent[childrenField],
            len = children.length,
            i = 0;
        for (; i < len; i++) {
            if (children[i] > rowIndex) {
                children[i] = children[i] + count;
            }
        }
        rowIndex = children[0] - 1;
        if (rowIndex >= 0) {
            this._fixParentIndexes(parent, rowIndex, count);
        }
    },
    //修正所有的子元素索引
    _fixTreeIndexes: function (startIndex, endIndex, viewData, count) {
        var i = startIndex,
            len = endIndex;
        var item,
            children,
            j;
        for (; i < len; i++) {
            item = viewData[i];
            if (this.isTreeNode(item)) {
                children = item[childrenField];
                if (!children) {
                    continue;
                }
                for (j = 0; j < children.length; j++) {
                    children[j] = children[j] + count;
                }
            }
        }
    },
    _showChildren: function (rowData, rowIndex) {
        if (!rowData[childrenField]) {
            if (this.lazy && $.isFunction(this.loadChildrenHandler)) {
                this.loadChildrenHandler(rowData, rowIndex);
            }
        } else {
            this._operateChildren(rowData[childrenField], function (item, row) {
                $(row).css("display", "table-row");
                if (item._isFolded === true) {
                    return false;
                }
            });
        }
    },
    _hideChildren: function (rowData) {
        if (rowData[childrenField]) {
            this._operateChildren(rowData[childrenField], function (item, row) {
                $(row).css("display", "none");
            });
        }
    },
    _operateChildren: function (list, action) {
        var viewData,
            rowIndex,
            rows, item,
            result,
            i, len;

        if (!list) {
            return;
        }
        
        viewData = this.gridview.getViewData();
        rows = this.gridview.tableBody[0].rows;
        for (i= 0, len = list.length; i < len; i++) {
            rowIndex = list[i];
            item = viewData[rowIndex];
            result = action.call(this, item, rows[rowIndex]);
            if (result === false) {
                continue;
            }
            if (item[childrenField]) {
                this._operateChildren(item[childrenField], action);
            }
        }
    },
    _changeLevel: function(rowIndex, cellIndex, rowData, value) {
        var level = rowData._level + value;
        if(level < 0)
            level = 0;
        rowData._level = level;
        
        var	column = this.gridview.option.columns[cellIndex],
            cell = $(this.gridview.tableBody.get(0).rows[rowIndex].cells[cellIndex]);
        cell.empty();
        cell.append(
            column.handler.call(
                this.gridview, 
                this.gridview.prepareValue(rowData, column), 
                column, 
                rowIndex, 
                cell));
    },
    _sortListTree: function (tree, listTree, parent, level) {
        var i = 0,
            len = tree.length,
            item;
        for (; i < len; i++) {
            item = tree[i];
            delete item[flagField];
            item._level = level;
            item[parentField] = parent;
            listTree.push(item);
            tree[i] = listTree.length - 1;
            if (item[childrenField].length > 0) {
                this._sortListTree(item[childrenField], listTree, item, level + 1);
            } else {
                delete item[childrenField];
            }
        }
    },

    /// API
    /** 绑定gridview */
    setGridView: function (gridview) {
        if(gridview instanceof ui.ctrls.GridView) {
            this.gridview = gridview;
            this.gridview.tree = this;
        }
    },
    /** 转换数据结构 */
    listTree: function (list, parentField, valueField) {
        var listTree = [];
        var getParentValue = getValue,
            getChildValue = getValue;
        if (!Array.isArray(list) || list.length === 0)
            return listTree;

        if ($.isFunction(parentField)) {
            getParentValue = parentField;
        }
        if ($.isFunction(valueField)) {
            getChildValue = valueField;
        }

        var tempList = {}, temp, root,
            item, i, id, pid;
        for (i = 0; i < list.length; i++) {
            item = list[i];
            pid = getParentValue.call(item, parentField) + "" || "__";
            if (tempList.hasOwnProperty(pid)) {
                temp = tempList[pid];
                temp[childrenField].push(item);
            } else {
                temp = {};
                temp[childrenField] = [];
                temp[childrenField].push(item);
                tempList[pid] = temp;
            }
            id = getChildValue.call(item, valueField) + "";
            if (tempList.hasOwnProperty(id)) {
                temp = tempList[id];
                item[childrenField] = temp[childrenField];
                tempList[id] = item;
                item[flagField] = true;
            } else {
                item[childrenField] = [];
                item[flagField] = true;
                tempList[id] = item;
            }
        }
        for (var key in tempList) {
            if(tempList.hasOwnProperty(key)) {
                temp = tempList[key];
                if (!temp.hasOwnProperty(flagField)) {
                    root = temp;
                    break;
                }
            }
        }
        
        this._sortListTree(root[childrenField], listTree, null, 0);
        return listTree;
    },
    /** 根据层级转换数据结构 */
    listTreeByLevel: function(list, parentField, valueField) {
        var listTree = [];
        var getParentValue = getValue,
            getChildValue = getValue;
        if (!Array.isArray(list) || list.length === 0)
            return listTree;
        
        var parents = [],
            rootChildren = [],
            i, 
            item,
            parentItem,
            level;
        for(i = 0; i < list.length; i++) {
            item = list[i];
            item[childrenField] = [];
            item[parentField] = null;
            
            if(i > 0) {
                if(item._level - list[i - 1]._level > 1) {
                    item._level = list[i - 1]._level + 1;
                }
            } else {
                item._level = 0; 
            }
            
            level = item._level;
            parents[level] = item;
            if(level === 0) {
                rootChildren.push(item);
                continue;
            }
            parentItem = parents[level - 1];
            parentItem[childrenField].push(item);
            item[parentField] = getParentValue.call(parentItem, valueField);
        }
        
        this._sortListTree(rootChildren, listTree, null, 0);
        return listTree;
    },
    /** 树格式化器 */
    treeNode: function (val, col, idx, td) {
        var viewData,
            item,
            span, 
            fold;
        
        if (!val) {
            return null;
        }

        viewData = this.getViewData();
        item = viewData[idx];
        if (!$.isNumeric(item._level)) {
            item._level = 0;
        }
        span = $("<span />").text(val);
        if (this.tree.isTreeNode(item)) {
            item._isFolded = false;
            span = [null, span[0]];
            if (this.tree.lazy) {
                fold = $("<i class='fold font-highlight-hover fa fa-angle-right' />");
            } else {
                fold = $("<i class='fold unfold font-highlight-hover fa fa-angle-down' />");
            }
            fold.css("margin-left", (item._level * (12 + 5) + 5) + "px");
            fold.click(this.tree.onFoldButtonClickHandler);
            span[0] = fold[0];
        } else {
            span.css("margin-left", ((item._level + 1) * (12 + 5) + 5) + "px");
        }
        return span;
    },
    /** 层级格式化器 */
    levelNode: function(val, col, idx, td) {
        var viewData,
            item,
            span;

        if (!val) {
            return null;
        }

        viewData = this.getViewData();
        item = viewData[idx];
        if (!ui.type.isNumber(item._level)) {
            item._level = 0;
        }
        
        span = $("<span />").text(val);
        span.css("margin-left", ((item._level + 1) * (12 + 5) + 5) + "px");
        return span;
    },
    /** 异步添加子节点 */
    addChildren: function (rowData, rowIndex, children) {
        var viewData,
            item,
            currRowIndex = rowIndex + 1,
            row,
            i, len;

        rowData[childrenField] = [];
        viewData = this.gridview.getViewData();
        for (i = 0, len = children.length; i < len; i++) {
            item = children[i];
            item._level = rowData._level + 1;
            item[parentField] = rowData;
            rowData[childrenField].push(currRowIndex);

            row = $("<tr />");
            viewData.splice(currRowIndex, 0, item);
            this.gridview._createRowCells(row, item, currRowIndex);
            if (currRowIndex < viewData.length - 1) {
                $(this.gridview.tableBody[0].rows[currRowIndex]).before(row);
            } else {
                this.gridview.tableBody.append(row);
            }

            currRowIndex++;
        }
        this.gridview._updateScrollState();
        this.gridview._refreshRowNumber(currRowIndex - 1);

        this._fixParentIndexes(rowData, rowIndex, len);
        this._fixTreeIndexes(
            rowIndex + 1 + len, 
            viewData.length,
            viewData, 
            len);
    },
    /** 调整节点的缩进 */
    changeLevel: function(rowIndex, cellIndex, value, changeChildrenLevel) {
        var rowData,
            viewData, 
            level,
            i;
        
        viewData = this.gridview.getViewData();
        if(ui.core.type(rowIndex) !== "number" || rowIndex < 0 || rowIndex >= viewData.length) {
            return;
        }
        
        rowData = viewData[rowIndex];
        changeChildrenLevel = !!changeChildrenLevel;
        
        level = rowData._level;
        this._changeLevel(rowIndex, cellIndex, rowData, value); 
        if(changeChildrenLevel) {
            i = rowIndex + 1;
            while(i < viewData.length) {
                rowData = viewData[i];
                if(rowData._level <= level) {
                    return;
                }
                this._changeLevel(i, cellIndex, rowData, value);
                i++;
            }
        }
    }
};
ui.ctrls.GridViewTree = GridViewTree;


})(jQuery, ui);

// Source: src/control/view/grid-view.js

(function($, ui) {
// grid view

var cellCheckbox = "grid-checkbox",
    cellCheckboxAll = "grid-checkbox-all",
    lastCell = "last-cell",
    sortClass = "fa-sort",
    asc = "fa-sort-asc",
    desc = "fa-sort-desc";

var tag = /^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/,
    attributes = /\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/;

var columnCheckboxAllFormatter = ui.ColumnStyle.cnfn.checkAll,
    checkboxFormatter = ui.ColumnStyle.cfn.check,
    columnTextFormatter = ui.ColumnStyle.cnfn.columnText,
    textFormatter = ui.ColumnStyle.cfn.text,
    rowNumberFormatter = ui.ColumnStyle.cfn.rowNumber;

var defaultPageSize = 100;

function preparePager(option) {
    if(option.showPageInfo === true) {
        if(!option.pageInfoFormatter) {
            option.pageInfoFormatter = {
                currentRowNum: function(val) {
                    return "<span>本页" + val + "行</span>";
                },
                rowCount: function(val) {
                    return "<span class='font-highlight'>共" + val + "行</span>";
                },
                pageCount: function(val) {
                    return "<span>" + val + "页</span>";
                }
            };
        }
    }

    this.pager = ui.ctrls.Pager(option);
    this.pageIndex = this.pager.pageIndex;
    this.pageSize = this.pager.pageSize;
}
function reverse(arr1, arr2) {
    var temp,
        i = 0, 
        j = arr1.length - 1,
        len = arr1.length / 2;
    for (; i < len; i++, j--) {
        temp = arr1[i];
        arr1[i] = arr1[j];
        arr1[j] = temp;

        temp = arr2[i];
        arr2[i] = arr2[j];
        arr2[j] = temp;
    }
}
function sorting(v1, v2) {
    var column,
        fn,
        val1, val2;
    column = this._lastSortColumn;
    fn = column.sort;
    if(!ui.core.isFunction(fn)) {
        fn = defaultSortFn;
    }

    val1 = this._prepareValue(v1, column);
    val2 = this._prepareValue(v2, column);
    return fn(val1, val2);
}
function defaultSortFn(v1, v2) {
    var val, i, len;
    if (Array.isArray(v1)) {
        val = 0;
        for (i = 0, len = v1.length; i < len; i++) {
            val = defaultSorting(v1[i], v2[i]);
            if (val !== 0) {
                return val;
            }
        }
        return val;
    } else {
        return defaultSorting(v1, v2);
    }
}
function defaultSorting(v1, v2) {
    if (typeof v1 === "string") {
        return v1.localeCompare(v2);
    }
    if (v1 < v2) {
        return -1;
    } else if (v1 > v2) {
        return 1;
    } else {
        return 0;
    }
}
function resetColumnState() {
    var fn, key;
    for(key in this.resetColumnStateHandlers) {
        if(this.resetColumnStateHandlers.hasOwnProperty(key)) {
            fn = this.resetColumnStateHandlers[key];
            if(ui.core.isFunction(fn)) {
                try {
                    fn.call(this);
                } catch (e) { }
            }
        }
    }
}
function resetSortColumnState (tr) {
    var icon, 
        cells,
        i, 
        len;

    if (!tr) {
        tr = this.tableHead.find("tr");
    }

    cells = tr.children();
    for (i = 0, len = this._sorterIndexes.length; i < len; i++) {
        icon = $(cells[this._sorterIndexes[i]]);
        icon = icon.find("i");
        if (!icon.hasClass(sortClass)) {
            icon.attr("class", "fa fa-sort");
            return;
        }
    }
}
function setChecked(cbx, checked) {
    if(checked) {
        cbx.removeClass("fa-square")
            .addClass("fa-check-square").addClass("font-highlight");
    } else {
        cbx.removeClass("fa-check-square").removeClass("font-highlight")
            .addClass("fa-square");
    }
}
function changeChecked(cbx) {
    var checked = !cbx.hasClass("fa-check-square"),
        colIndex;
    setChecked(cbx, checked);
    if(!this._gridCheckboxAll) {
        colIndex = this._getColumnIndexByFormatter(columnCheckboxAllFormatter, "text");
        if(colIndex === -1) {
            return;
        }
        this._gridCheckboxAll = 
            $(this.tableHead[0].tHead.rows[0].cells[colIndex])
                .find("." + cellCheckboxAll);
    }
    if(checked) {
        this._checkedCount++;
    } else {
        this._checkedCount--;
    }
    if(this._checkedCount === this.count()) {
        setChecked(this._gridCheckboxAll, true);
    } else {
        setChecked(this._gridCheckboxAll, false);
    }
}

// 事件处理函数
// 排序点击事件处理
function onSort(e) {
    var viewData,
        elem,
        nodeName,
        columnIndex, column,
        fn, isSelf,
        tempTbody, rows, icon;

    e.stopPropagation();
    viewData = this.option.viewData;
    if (!Array.isArray(viewData) || viewData.length === 0) {
        return;
    }
    elem = $(e.target);
    while ((nodeName = elem.nodeName()) !== "TH") {
        if (nodeName === "TR") {
            return;
        }
        elem = elem.parent();
    }

    columnIndex = elem[0].cellIndex;
    column = this.option.columns[columnIndex];

    if (this._lastSortColumn !== column) {
        resetSortColumnState.call(this, elem.parent());
    }

    fn = sorting.bind(this);
    isSelf = this._lastSortColumn == column;
    this._lastSortColumn = column;

    tempTbody = this.tableBody.children("tbody");
    rows = tempTbody.children().get();
    if (!Array.isArray(rows) || rows.length != viewData.length) {
        throw new Error("data row error");
    }

    icon = elem.find("i");
    if (icon.hasClass(asc)) {
        reverse(viewData, rows);
        icon.removeClass(sortClass).removeClass(asc).addClass(desc);
    } else {
        if (isSelf) {
            reverse(viewData, rows);
        } else {
            this.sorter.items = rows;
            this.sorter.sort(viewData, fn);
        }
        icon.removeClass(sortClass).removeClass(desc).addClass(asc);
    }
    tempTbody.append(rows);
    this._refreshRowNumber();
}
// 表格内容点击事件处理
function onTableBodyClick(e) {
    var elem, tagName, selectedClass,
        exclude, result,
        nodeName;

    if(!this.isSelectable()) {
        return;
    }
    
    elem = $(e.target);
    exclude = this.option.selection.exclude;
    if(exclude) {
        result = true;
        if(ui.core.isString(exclude)) {
            result = this._excludeElement(elem, exclude);
        } else if(ui.core.isFunction(exclude)) {
            result = exclude.call(this, elem);
        }
        if(result === false) return;
    }

    if(elem.hasClass(cellCheckbox)) {
        // 如果checkbox和选中行不联动
        if(!this.option.selection.isRelateCheckbox) {
            changeChecked.call(this, elem);
            return;
        }
    }

    tagName = this.option.selection.type === "cell" ? "TD" : "TR";
    selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
    while((nodeName = elem.nodeName()) !== tagName) {
        if(nodeName === "TBODY") {
            return;
        }
        elem = elem.parent();
    }

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    this._selectItem(elem, selectedClass);
}
// 横向滚动条跟随事件处理
function onScrollingX(e) {
    this.gridHead.scrollLeft(
        this.gridBody.scrollLeft());
}
// 全选按钮点击事件处理
function onCheckboxAllClick(e) {
    var cbxAll, cbx, cell,
        checkedValue, cellIndex,
        rows, selectedClass, fn, 
        i, len;

    e.stopPropagation();

    cbxAll = $(e.target);
    cellIndex = cbxAll.parent().prop("cellIndex");
    if(cellIndex === -1) {
        return;
    }

    checkedValue = !cbxAll.hasClass("fa-check-square");
    setChecked.call(this, cbxAll, checkedValue);

    if(this.option.selection.isRelateCheckbox === true && this.isMultiple()) {
        selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
        if(checkedValue) {
            // 如果是要选中，需要同步行状态
            fn = function(td, checkbox) {
                var elem;
                if(this.option.selection.type === "cell") {
                    elem = td;
                } else {
                    elem = td.parent();
                }
                elem.context = checkbox[0];
                this._selectItem(elem, selectedClass, checkedValue);
            };
        } else {
            // 如果是取消选中，直接清空选中行状态
            for(i = 0, len = this._selectList.length; i < len; i++) {
                $(this._selectList[i])
                    .removeClass(selectedClass)
                    .removeClass("background-highlight");
            }
            this._selectList = [];
        }
    }

    rows = this.tableBody[0].tBodies[0].rows;
    for(i = 0, len = rows.length; i < len; i++) {
        cell = $(rows[i].cells[cellIndex]);
        cbx = cell.find("." + cellCheckbox);
        if(cbx.length > 0) {
            if(ui.core.isFunction(fn)) {
                fn.call(this, cell, cbx);
            } else {
                setChecked.call(this, cbx, checkedValue);
            }
        }
    }
    if(checkedValue) {
        this._checkedCount = this.count();
    } else {
        this._checkedCount = 0;
    }
}


ui.ctrls.define("ui.ctrls.GridView", {
    _defineOption: function() {
        return {
            /*
                column property
                text:       string|function     列名，默认为null
                column:     string|Array        绑定字段名，默认为null
                len:        number              列宽度，默认为auto
                align:      center|left|right   列对齐方式，默认为left(但是表头居中)
                formatter:  function            格式化器，默认为null
                sort:       boolean|function    是否支持排序，true支持，false不支持，默认为false
            */
            columns: [],
            // 视图数据
            viewData: null,
            // 没有数据时显示的提示信息
            promptText: "没有数据",
            // 高度
            height: false,
            // 宽度
            width: false,
            // 默认格式化器
            textFormatter: null,
            // 分页参数
            pager: {
                // 当前页码，默认从第1页开始
                pageIndex: 1,
                // 记录数，默认100条
                pageSize: defaultPageSize,
                // 显示按钮数量，默认显示10个按钮
                pageButtonCount: 10,
                // 是否显示分页统计信息，true|false，默认不显示
                showPageInfo: false,
                // 格式化器，包含currentRowNum, rowCount, pageCount的显示
                pageInfoFormatter: null
            },
            // 选择设置
            selection: {
                // cell|row|disabled
                type: "row",
                // string 排除的标签类型，标记后点击这些标签将不会触发选择事件
                exclude: false,
                // 是否可以多选
                multiple: false,
                // 多选时是否和checkbox关联
                isRelateCheckbox: true
            }
        };
    },
    _defineEvents: function() {
        var events = ["selecting", "selected", "deselected", "rebind", "cancel"];
        if(this.option.pager) {
            events.push("pagechanging");
        }
        return events;
    },
    _create: function() {
        this._selectList = [];
        this._sorterIndexes = [];
        this._hasPrompt = !!this.option.promptText;
        // 存放列头状态重置方法
        this.resetColumnStateHandlers = {};
        
        this.gridHead = null;
        this.gridBody = null;
        this.columnHeight = 30;
        this.pagerHeight = 30;
        
        if(this.option.pager) {
            preparePager.call(this, this.option.pager);
        } else {
            this.pageIndex = 1;
            this.pageSize = defaultPageSize;
        }

        // 修正selection设置项
        if(!this.option.selection) {
            this.option.selection = {
                type: "disabled"
            };
        } else {
            if(ui.core.isString(this.option.selection.type)) {
                this.option.selection.type = this.option.selection.type.toLowerCase();
            } else {
                this.option.selection.type = "disabled";
            }
            if(!this.option.selection.multiple) {
                this.option.selection.isRelateCheckbox = false;
            }
        }

        if(!ui.core.isNumber(this.option.width) || this.option.width <= 0) {
            this.option.width = false;
        }
        if(!ui.core.isNumber(this.option.height) || this.option.height <= 0) {
            this.option.height = false;
        }

        // 排序器
        this.sorter = ui.Introsort();
        // checkbox勾选计数器
        this._checkedCount = 0;

        // event handlers
        // 排序按钮点击事件
        this.onSortHandler = onSort.bind(this);
        // 行或者单元格点击事件
        this.onTableBodyClickHandler = onTableBodyClick.bind(this);
        // 全选按钮点击事件
        this.onCheckboxAllClickHandler = onCheckboxAllClick.bind(this);
        // 横向滚动条同步事件
        this.onScrollingXHandler = onScrollingX.bind(this);
    },
    _render: function() {
        if(!this.element.hasClass("ui-grid-view")) {
            this.element.addClass("ui-grid-view");
        }
        this._initBorderWidth();

        // 表头
        this.gridHead = $("<div class='ui-grid-head' />");
        this.element.append(this.gridHead);
        // 表体
        this.gridBody = $("<div class='ui-grid-body' />");
        this._initDataPrompt();
        this.gridBody.scroll(this.onScrollingXHandler);
        this.element.append(this.gridBody);
        // 分页栏
        this._initPagerPanel();
        // 设置容器大小
        this.setSize(this.option.width, this.option.height);

        // 创建表头
        this.createGridHead();
        // 创建表体
        if (Array.isArray(this.option.viewData)) {
            this.createGridBody(
                this.option.viewData, this.option.viewData.length);
        } else {
            this.option.viewData = [];
        }
    },
    _initBorderWidth: function() {
        var getBorderWidth = function(key) {
            return parseInt(this.element.css(key), 10) || 0;
        };
        this.borderWidth = 0;
        this.borderHeight = 0;

        this.borderWidth += getBorderWidth.call(this, "border-left-width");
        this.borderWidth += getBorderWidth.call(this, "border-right-width");

        this.borderHeight += getBorderWidth.call(this, "border-top-width");
        this.borderHeight += getBorderWidth.call(this, "border-bottom-width");
    },
    _initDataPrompt: function() {
        var text;
        if(this._hasPrompt) {
            this._dataPrompt = $("<div class='data-prompt' />");
            text = this.option.promptText;
            if (ui.core.isString(text) && text.length > 0) {
                this._dataPrompt.html("<span class='font-highlight'>" + text + "</span>");
            } else if (ui.core.isFunction(text)) {
                text = text();
                this._dataPrompt.append(text);
            }
            this.gridBody.append(this._dataPrompt);
        }
    },
    _initPagerPanel: function() {
        if(this.pager) {
            this.gridFoot = $("<div class='ui-grid-foot clear' />");
            this.element.append(this.gridFoot);
            
            this.pager.pageNumPanel = $("<div class='page-panel' />");
            if (this.option.pager.displayDataInfo) {
                this.pager.pageInfoPanel = $("<div class='data-info' />");
                this.gridFoot.append(this.pager.pageInfoPanel);
            } else {
                this.pager.pageNumPanel.css("width", "100%");
            }

            this.gridFoot.append(this.pager.pageNumPanel);
            this.pager.pageChanged(function(pageIndex, pageSize) {
                this.pageIndex = pageIndex;
                this.pageSize = pageSize;
                this.fire("pagechanging", pageIndex, pageSize);
            }, this);
        }
    },
    // 创建一行的所有单元格
    _createRowCells: function(tr, rowData, rowIndex) {
        var i, len, 
            c, cval, td, el,
            formatter,
            isRowHover;
        
        isRowHover = this.option.selection.type !== "cell";
        if(isRowHover) {
            tr.addClass("table-body-row-hover");
        }
        for (i = 0, len = this.option.columns.length; i < len; i++) {
            c = this.option.columns[i];
            formatter = c.formatter;
            // 自定义格式化器
            if (!ui.core.isFunction(c.formatter)) {
                formatter = this.option.textFormatter;
            }
            // option默认格式化器
            if(!ui.core.isFunction(formatter)) {
                formatter = textFormatter;
            }
            cval = this._prepareValue(rowData, c);
            td = this._createCell("td", c);
            td.addClass("ui-table-body-cell");
            if(!isRowHover) {
                td.addClass("table-body-cell-hover");
            }
            el = formatter.call(this, cval, c, rowIndex, td);
            if (td.isAnnulment) {
                continue;
            }
            if (el) {
                td.append(el);
            }
            if (i === len - 1) {
                td.addClass(lastCell);
            }
            tr.append(td);
            if(td.isFinale) {
                td.addClass(lastCell);
                break;
            }
        }
    },
    // 获得并组装值
    _prepareValue: function(rowData, c) {
        var value,
            i, len;
        if (Array.isArray(c.column)) {
            value = {};
            for (i = 0, len = c.column.length; i < len; i++) {
                value[i] = value[c.column[i]] = 
                    this._getValue(rowData, c.column[i], c);
            }
        } else {
            value = this._getValue(rowData, c.column, c);
        }
        return value;
    },
    // 获取值
    _getValue: function(rowData, column, c) {
        var arr, i = 0, value;
        if (!ui.core.isString(column)) {
            return null;
        }
        if (!c._columnKeys.hasOwnProperty(column)) {
            c._columnKeys[column] = column.split(".");
        }
        arr = c._columnKeys[column];
        value = rowData[arr[i]];
        for (i = 1; i < arr.length; i++) {
            value = value[arr[i]];
            if (value === undefined || value === null) {
                return value;
            }
        }
        return value;
    },
    _createCol: function(column) {
        var col = $("<col />");
        if (ui.core.isNumber(column.len)) {
            col.css("width", column.len + "px");
        }
        return col;
    },
    _createCell: function(tagName, column) {
        var cell = $("<" + tagName + " />"),
            css = {};
        if (column.align) {
            css["text-align"] = column.align;
        }
        cell.css(css);

        return cell;
    },
    _setSorter: function(cell, column, index) {
        if (column.sort === true || ui.core.isFunction(column.sort)) {
            cell.click(this.onSortHandler);
            cell.addClass("sorter");
            cell.append("<i class='fa fa-sort' />");
            this._sorterIndexes.push(index);
        }
    },
    _renderPageList: function(rowCount) {
        if (!this.pager) {
            return;
        }
        this.pager.data = this.option.viewData;
        this.pager.pageIndex = this.pageIndex;
        this.pager.pageSize = this.pageSize;
        this.pager.renderPageList(rowCount);
    },
    _updateScrollState: function() {
        if (!this.tableHead) return;
        if(this.gridBody[0].scrollHeight > this.gridBody.height()) {
            this._headScrollCol.css("width", ui.scrollbarWidth + 0.1 + "px");
        } else {
            this._headScrollCol.css("width", "0");
        }
    },
    _refreshRowNumber: function(startRowIndex, endRowIndex) {
        var viewData,
            colIndex, rowNumber,
            rows, cell,
            column, i, len;

        viewData = this.option.viewData;
        if(!viewData || viewData.length === 0) {
            return;
        }

        rowNumber = rowNumberFormatter;
        colIndex = this._getColumnIndexByFormatter(rowNumber);
        
        if (colIndex == -1) return;
        if (!ui.core.isNumber(startRowIndex)) {
            startRowIndex = 0;
        }
        rows = this.tableBody[0].rows;
        column = this.option.columns[colIndex];
        len = ui.core.isNumber(endRowIndex) ? endRowIndex + 1 : rows.length;
        for (i = startRowIndex; i < len; i++) {
            cell = $(rows[i].cells[colIndex]);
            cell.html("");
            cell.append(rowNumber.call(this, null, column, i));
        }
    },
    _getColumnIndexByFormatter: function(formatter, field) {
        var i, 
            len = this.option.columns.length;
        if(!field) {
            field = "formatter";
        }
        for(i = 0; i < len; i++) {
            if(this.option.columns[i][field] === formatter) {
                return i;
            }
        }
        return -1;
    },
    _getSelectionData: function(elem) {
        var data = {};
        if(this.option.selection.type === "cell") {
            data.rowIndex = elem.parent().prop("rowIndex");
            data.cellIndex = elem.prop("cellIndex");
            data.rowData = this.option.viewData[data.rowIndex];
            data.column = this.option.columns[data.cellIndex].column;
        } else {
            data.rowIndex = elem.prop("rowIndex");
            data.rowData = this.option.viewData[data.rowIndex];
        }
        return data;
    },
    _excludeElement: function(elem, exclude) {
        var tagName = elem.nodeName().toLowerCase(),
            exArr = exclude.split(","),
            ex, match,
            i, len;
        for(i = 0, len = exArr.length; i < len; i++) {
            ex = ui.str.trim(exArr[i]);
            match = ex.match(attributes);
            if(match) {
                ex = ex.match(tag)[1];
                if(ex === tagName) {
                    return elem.attr(match[1]) !== match[4];
                }
            } else {
                if(ex.toLowerCase() === tagName) {
                    return false;
                }
            }
        }
    },
    _selectItem: function(elem, selectedClass, selectValue) {
        var eventData, result,
            colIndex, checkbox,
            i, len;

        eventData = this._getSelectionData(elem);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        result = this.fire("selecting", eventData);
        if(result === false) {
            return;
        }

        if(this.isMultiple()) {
            // 多选
            if(elem.hasClass(selectedClass)) {
                // 现在要取消
                // 如果selectValue定义了选中，则不要执行取消逻辑
                if(selectValue === true) {
                    return;
                }
                selectValue = false;

                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if(this._selectList[i] === elem[0]) {
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
                elem.removeClass(selectedClass).removeClass("background-highlight");
                this.fire("deselected", eventData);
            } else {
                // 现在要选中
                // 如果selectValue定义了取消，则不要执行选中逻辑
                if(selectValue === false) {
                    return;
                }
                selectValue = true;

                this._selectList.push(elem[0]);
                elem.addClass(selectedClass).addClass("background-highlight");
                this.fire("selected", eventData);
            }

            // 同步checkbox状态
            if(this.option.selection.isRelateCheckbox) {
                // 用过用户点击的是checkbox则保存变量，不用重新去获取了
                if(eventData.originElement && eventData.originElement.hasClass(cellCheckbox)) {
                    checkbox = eventData.originElement;
                }
                // 如果用户点击的不是checkbox则找出对于的checkbox
                if(!checkbox) {
                    colIndex = this._getColumnIndexByFormatter(checkboxFormatter);
                    if(colIndex > -1) {
                        checkbox = this.option.selection.type === "cell" ? 
                            $(elem.parent()[0].cells[colIndex]) : 
                            $(elem[0].cells[colIndex]);
                        checkbox = checkbox.find("." + cellCheckbox);
                    }
                }
                if(checkbox && checkbox.length > 0) {
                    setChecked.call(this, checkbox, selectValue);
                }
            }
        } else {
            // 单选
            if(this._current) {
                this._current.removeClass(selectedClass).removeClass("background-highlight");
                if(this._current[0] === elem[0]) {
                    this._current = null;
                    this.fire("deselected", eventData);
                    return;
                }
            }
            this._current = elem;
            elem.addClass(selectedClass).addClass("background-highlight");
            this.fire("selected", eventData);
        }
    },
    _promptIsShow: function() {
        return this._hasPrompt && this._dataPrompt.css("display") === "block";
    },
    _setPromptLocation: function() {
        var height = this._dataPrompt.height();
        this._dataPrompt.css("margin-top", -(height / 2) + "px");
    },
    _showDataPrompt: function() {
        if(!this._hasPrompt) return;
        this._dataPrompt.css("display", "block");
        this._setPromptLocation();
    },
    _hideDataPrompt: function() {
        if(!this._hasPrompt) return;
        this._dataPrompt.css("display", "none");
    },


    /// API
    /** 创建表头 */
    createGridHead: function(columns) {
        var colGroup, thead,
            tr, th,
            c, i;

        if(Array.isArray(columns)) {
            this.option.columns = columns;
        } else {
            columns = this.option.columns;
        }

        if (!this.tableHead) {
            this.tableHead = $("<table class='ui-table-head' cellspacing='0' cellpadding='0' />");
            this.gridHead.append(this.tableHead);
        } else {
            this.tableHead.html("");
        }

        colGroup = $("<colgroup />");
        thead = $("<thead />");
        tr = $("<tr />");
        for (i = 0; i < columns.length; i++) {
            c = columns[i];
            if (!c._columnKeys) {
                c._columnKeys = {};
            }
            colGroup.append(this._createCol(c));
            th = this._createCell("th", c);
            th.addClass("ui-table-head-cell");
            if (ui.core.isFunction(c.text)) {
                th.append(c.text.call(this, c, th));
            } else {
                if(c.text) {
                    th.append(columnTextFormatter.call(this, c, th));
                }
            }
            this._setSorter(th, c, i);
            if (i == columns.length - 1) {
                th.addClass(lastCell);
            }
            tr.append(th);
        }

        this._headScrollCol = $("<col style='width:0' />");
        colGroup.append(this._headScrollCol);
        tr.append($("<th class='ui-table-head-cell scroll-cell' />"));
        thead.append(tr);

        this.tableHead.append(colGroup);
        this.tableHead.append(thead);
    },
    /** 创建内容 */
    createGridBody: function(viewData, rowCount) {
        var colGroup, tbody,
            tr, i, j, c,
            isRebind = false;
        
        if (!this.tableBody) {
            this.tableBody = $("<table class='ui-table-body' cellspacing='0' cellpadding='0' />");
            this.tableBody.click(this.onTableBodyClickHandler);
            this.gridBody.append(this.tableBody);
        } else {
            this.gridBody.scrollTop(0);
            this.clear(false);
            isRebind = true;
        }

        if(!Array.isArray(viewData)) {
            viewData = [];
        }
        this.option.viewData = viewData;

        if(viewData.length === 0) {
            this._showDataPrompt();
            return;
        } else {
            this._hideDataPrompt();
        }

        colGroup = $("<colgroup />"),
        tbody = $("<tbody />");
        this.tableBody.append(colGroup);

        for (j = 0; j < this.option.columns.length; j++) {
            c = this.option.columns[j];
            colGroup.append(this._createCol(c));
        }
        for (i = 0; i < viewData.length; i++) {
            tr = $("<tr />");
            this._createRowCells(tr, viewData[i], i);
            tbody.append(tr);
        }
        this.tableBody.append(tbody);

        this._updateScrollState();
        //update page numbers
        if (ui.core.isNumber(rowCount)) {
            this._renderPageList(rowCount);
        }

        if (isRebind) {
            this.fire("rebind");
        }
    },
    /** 获取checkbox勾选项的值 */
    getCheckedValues: function() {
        var columnIndex, rows, elem,
            checkboxClass = "." + cellCheckbox,
            result = [],
            i, len;

        columnIndex = this._getColumnIndexByFormatter(checkboxFormatter);
        if(columnIndex === -1) {
            return result;
        }

        rows = this.gridBody[0].tBodies[0].rows;
        for(i = 0, len = rows.length; i < len; i++) {
            elem = $(rows[i].cells[columnIndex]).find(checkboxClass);
            if(elem.length > 0) {
                result.push(ui.str.htmlDecode(elem.attr("data-value")));
            }
        }
        return result;
    },
    /** 获取选中的数据，单选返回单个对象，多选返回数组 */
    getSelection: function() {
        var result,
            i, len;
        if(!this.isSelectable()) {
            return null;
        }
        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                result.push(this._getSelectionData($(this._selectList[i])));
            }
        } else {
            result = null;
            if(this._current) {
                result = this._getSelectionData(this._current);
            }
        }
        return result;
    },
    /** 取消选中项 */
    cancelSelection: function() {
        var selectedClass, elem, 
            columnIndex, checkboxClass, fn,
            i, len;

        if (!this.isSelectable()) {
            return;
        }

        selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
        if(this.option.selection.isRelateCheckbox) {
            checkboxClass = "." + cellCheckbox;
            columnIndex = this._getColumnIndexByFormatter(checkboxFormatter);
            fn = function(elem) {
                var checkbox;
                if(columnIndex !== -1) {
                    checkbox = this.option.selection.type === "cell" ? 
                        $(elem.parent()[0].cells[columnIndex]) : 
                        $(elem[0].cells[columnIndex]);
                    checkbox = checkbox.find(checkboxClass);
                    setChecked(checkbox, false);
                }
                elem.removeClass(selectedClass).removeClass("background-highlight");
            };
        } else {
            fn = function(elem) {
                elem.removeClass(selectedClass).removeClass("background-highlight");
            };
        }

        if(this.isMultiple()) {
            if(this._selectList.length === 0) {
                return;
            }
            for(i = 0, len = this._selectList.length; i < len; i++) {
                elem = $(this._selectList[i]);
                fn.call(this, elem);
            }
            this._selectList = [];
        } else {
            if(!this._current) {
                return;
            }
            fn.call(this, this._current);
            this._current = null;    
        }
        this.fire("cancel");
    },
    /** 移除行 */
    removeRowAt: function() {
        var rowIndex,
            indexes,
            viewData,
            row,
            i, len,
            isMultiple,
            type,
            removeSelectItemFn;

        viewData = this.option.viewData;
        if(!viewData) {
            return;
        }
        len = arguments.length;
        if(len === 0) {
            return;
        }
        indexes = [];
        for(i = 0; i < len; i++) {
            rowIndex = arguments[i];
            if(ui.core.isNumber(rowIndex) && rowIndex >= 0 && rowIndex < viewData.length) {
                indexes.push(rowIndex);
            }
        }
        len = indexes.length;
        if(len > 0) {
            indexes.sort(function(a, b) {
                return b - a;
            });
            type = this.option.selection.type;
            isMultiple = this.isMultiple();
            if(type === "row") {
                removeSelectItemFn = function(idx) {
                    var i, len, selectItem;
                    if(isMultiple) {
                        for(i = 0, len = this._selectList.length; i < len; i++) {
                            selectItem = this._selectList[i];
                            if(idx === selectItem.rowIndex) {
                                this._selectList.splice(i, 1);
                                return;
                            }
                        }
                    } else {
                        if(this._current && this._current[0].rowIndex === idx) {
                            this._current = null;
                        }
                    }
                };
            } else if(type === "cell") {
                removeSelectItemFn = function(idx) {
                    var i, len, row;
                    if(isMultiple) {
                        for(i = 0, len = this._selectList.length; i < len; i++) {
                            row = this._selectList[i];
                            row = row.parentNode;
                            if(idx === row.rowIndex) {
                                this._selectList.splice(i, 1);
                                return;
                            }
                        }
                    } else {
                        if(this._current) {
                            row = this._current.parent();
                            if(row[0].rowIndex === idx) {
                                this._current = null;
                            }
                        }
                    }
                };
            }
            for(i = 0; i < len; i++) {
                rowIndex = indexes[i];
                row = $(this.tableBody[0].rows[rowIndex]);
                row.remove();
                viewData.splice(rowIndex, 1);
                if(removeSelectItemFn) {
                    removeSelectItemFn.call(this, rowIndex);
                }
            }
            this._updateScrollState();
            this._refreshRowNumber(rowIndex);
        }
    },
    /** 更新行 */
    updateRow: function(rowIndex, rowData) {
        var viewData,
            row;

        viewData = this.option.viewData;
        if(!viewData) {
            return;
        }
        if(rowIndex < 0 || rowIndex > viewData.length) {
            return;
        }

        row = $(this.tableBody[0].rows[rowIndex]);
        if(row.length === 0) {
            return;
        }
        row.empty();
        viewData[rowIndex] = rowData;
        this._createRowCells(row, rowData, rowIndex);
    },
    /** 增加行 */
    addRow: function(rowData) {
        var viewData,
            row;
        if(!rowData) return;
        viewData = this.option.viewData;

        if(!Array.isArray(viewData) || viewData.length === 0) {
            if(this.tableBody) {
                this.tableBody.remove();
                this.tableBody = null;
            }
            this.createGridBody([rowData]);
            return;
        }

        row = $("<tr />");
        this._createRowCells(row, rowData, viewData.length);
        $(this.tableBody[0].tBodies[0]).append(row);
        viewData.push(rowData);
        this._updateScrollState();
    },
    /** 插入行 */
    insertRow: function(rowIndex, rowData) {
        var viewData,
            row;
        if(!rowData) return;
        viewData = this.option.viewData;

        if(!Array.isArray(viewData) || viewData.length === 0) {
            this.addRow(rowData);
            return;
        }
        if(rowIndex < 0) {
            rowIndex = 0;
        }
        if(rowIndex < viewData.length) {
            row = $("<tr />");
            this._createRowCells(row, rowData, rowIndex);
            $(this.tableBody[0].rows[rowIndex]).before(row);
            viewData.splice(rowIndex, 0, rowData);
            this._updateScrollState();
            this._refreshRowNumber();
        } else {
            this.addRow(rowData);
        }
    },
    /** 当前行上移 */
    currentRowUp: function() {
        var data;
        if(this.isMultiple()) {
            throw new Error("The currentRowUp can not support for multiple selection");
        }
        if(this.option.selection.type === "cell") {
            throw new Error("The currentRowUp can not support for cell selection");
        }
        
        data = this.getSelection();
        if(!data || data.rowIndex === 0) {
            return;
        }
        this.moveRow(data.rowIndex, data.rowIndex - 1);
    },
    /** 当前行下移 */
    currentRowDown: function() {
        var data;
        if(this.isMultiple()) {
            throw new Error("The currentRowDown can not support for multiple selection");
        }
        if(this.option.selection.type === "cell") {
            throw new Error("The currentRowDown can not support for cell selection");
        }
        
        data = this.getSelection();
        if(!data || data.rowIndex >= this.count()) {
            return;
        }
        this.moveRow(data.rowIndex, data.rowIndex + 1);
    },
    /** 移动行 */
    moveRow: function(sourceIndex, destIndex) {
        var viewData,
            rows,
            destRow,
            tempData;
        
        viewData = this.option.viewData;
        if(viewData.length === 0) {
            return;
        }
        if(destIndex < 0) {
            destIndex = 0;
        } else if(destIndex >= viewData.length) {
            destIndex = viewData.length - 1;
        }

        if(sourceIndex === destIndex) {
            return;
        }

        rows = this.tableBody[0].tBodies[0].rows;
        destRow = $(rows[destIndex]);
        if(destIndex > rowIndex) {
            destRow.after($(rows[sourceIndex]));
            this._refreshRowNumber(sourceIndex, destIndex);
        } else {
            destRow.before($(rows[sourceIndex]));
            this._refreshRowNumber(destIndex, sourceIndex);
        }
        tempData = viewData[sourceIndex];
        viewData.splice(sourceIndex, 1);
        viewData.splice(destIndex, 0, tempData);
    },
    /** 获取行数据 */
    getRowData: function(rowIndex) {
        var viewData = this.option.viewData;
        if(!Array.isArray(viewData) || viewData.length === 0) {
            return null;
        }
        if(!ui.core.isNumber(rowIndex) || rowIndex < 0 || rowIndex >= viewData.length) {
            return null;
        }
        return viewData[rowIndex];
    },
    /** 获取视图数据 */
    getViewData: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData : [];
    },
    /** 获取项目数 */
    count: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData.length : 0;
    },
    /** 是否可以选择 */
    isSelectable: function() {
        var type = this.option.selection.type;
        return type === "row" || type === "cell";
    },
    /** 是否支持多选 */
    isMultiple: function() {
        return this.option.selection.multiple === true;
    },
    /** 清空表格数据 */
    clear: function() {
        if (this.tableBody) {
            this.tableBody.html("");
            this.option.listView = null;
            this._selectList = [];
            this._current = null;
            resetColumnState.call(this);
        }
        if (this.tableHead) {
            resetSortColumnState.call(this);
            this._lastSortColumn = null;
        }
        if (this.pager) {
            this.pager.empty();
        }
        if (arguments[0] !== false) {
            this._showDataPrompt();
        }
    },
    /** 设置表格的尺寸, width: 宽度, height: 高度 */
    setSize: function(width, height) {
        if(arguments.length === 1) {
            height = width;
            width = null;
        }
        if(ui.core.isNumber(height)) {
            height -= this.columnHeight + this.borderHeight;
            if(this.pager) {
                height -= this.pagerHeight;
            }
            this.gridBody.css("height", height + "px");
        }
        if(ui.core.isNumber(width)) {
            width -= this.borderWidth;
            this.element.css("width", width + "px");
        }
        this._updateScrollState();
        if(this._promptIsShow()) {
            this._setPromptLocation();
        }
    }
});

$.fn.gridView = function(option) {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.GridView(option, this);
};


})(jQuery, ui);

// Source: src/control/view/list-view.js

(function($, ui) {
//list view

var indexAttr = "data-index";
var selectedClass = "ui-list-view-selection";
// 默认的格式化器
function defaultItemFormatter(item, index) {
    return "<span class='ui-list-view-item-text'>" + item + "</span>";
}
// 默认排序逻辑
function defaultSortFn(a, b) {
    var text1 = defaultItemFormatter(a),
        text2 = defaultItemFormatter(b);
    return text1.localeCompare(text2);
}
// 点击事件处理函数
function onListItemClick(e) {
    var elem,
        isCloseButton,
        index,
        data;

    elem = $(e.target);
    isCloseButton = elem.hasClass("ui-item-view-remove");
    while(!elem.isNodeName("li")) {
        if(elem.hasClass("ui-list-view-ul")) {
            return;
        }
        elem = elem.parent();
    }

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    index = this._getItemIndex(elem[0]);
    if(this.option.hasRemoveButton && isCloseButton) {
        this._removeItem(elem, index);
    } else {
        this._selectItem(elem, index);
    }
}

ui.ctrls.define("ui.ctrls.ListView", {
    _defineOption: function() {
        return {
            // 支持多选
            multiple: false,
            // 数据集
            viewData: null,
            // 数据项格式化器 返回HTML Text或者 { css: "", class: [], html: ""}，样式会作用到每一个LI上面
            itemFormatter: false,
            // 是否要显示删除按钮
            hasRemoveButton: false,
            // 是否开启动画效果
            animatable: true,
            // 启用分页
            pager: false
        };
    },
    _defineEvents: function() {
        var events = ["selecting", "selected", "deselected", "cancel", "removing", "removed"];
        if(this.option.pager) {
            events.push("pageChanging");
        }
        return events;
    },
    _create: function() {
        this._selectList = [];
        this.sorter = new ui.Introsort();

        if(!ui.core.isFunction(this.option.itemFormatter)) {
            this.option.itemFormatter = defaultItemFormatter;
        }

        this.option.hasRemoveButton = !!this.option.hasRemoveButton;
        this.onListItemClickHandler = onListItemClick.bind(this);
    },
    _render: function() {
        this.element.addClass("ui-list-view");

        this.listPanel = $("<ul class='ui-list-view-ul' />");
        this.listPanel.click(this.onListItemClickHandler);
        this.element.append(this.listPanel);

        if(this.option.pager) {
            this._initPager(this.option.pager);
        }

        this._initAnimator();
        this.setViewData(this.option.viewData);
    },
    _initPager: function(pager) {
        this.pagerPanel = $("<div class='ui-list-view-pager clear' />");
        this.element.append(this.pagerPanel);
        this.listPanel.addClass("ui-list-view-pagelist");

        this.pager = ui.ctrls.Pager(pager);
        this.pageIndex = this.pager.Index;
        this.pageSize = this.pager.pageSize;
        this.pager.pageNumPanel = this.pagerPanel;
        this.pager.pageChanged(function(pageIndex, pageSize) {
            this.pageIndex = pageIndex;
            this.pageSize = pageSize;
            this.fire("pagechanging", pageIndex, pageSize);
        }, this);
    },
    _initAnimator: function() {
        // 删除动画
        this.removeFirstAnimator = ui.animator({
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("margin-left", val + "px");
            }
        });
        this.removeFirstAnimator.duration = 300;
        this.removeSecondAnimator = ui.animator({
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("height", val + "px");
            }
        });
        this.removeSecondAnimator.duration = 300;
    },
    _fill: function(data) {
        var i, len,
            itemBuilder = [],
            item;

        this.listPanel.empty();
        this.option.viewData = [];
        for(i = 0, len = data.length; i < len; i++) {
            item = data[i];
            if(item === null || item === undefined) {
                continue;
            }
            this._createItemHtml(itemBuilder, item, i);
            this.option.viewData.push(item);
        }
        this.listPanel.html(itemBuilder.join(""));
    },
    _createItemHtml: function(builder, item, index) {
        var content,
            idx,
            temp;
        builder.push("<li ", indexAttr, "='", index, "' class='ui-list-view-item'>");
        content = this.option.itemFormatter.call(this, item, index);
        if(ui.core.isString(content)) {
            builder.push("<div class='ui-list-view-container'>");
            builder.push(content);
            builder.push("</div>");
        } else if(ui.core.isPlainObject(content)) {
            temp = builder[builder.length - 1];
            idx = temp.lastIndexOf("'");
            builder[builder.length - 1] = temp.substring(0, idx);
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

            builder.push("<div class='ui-list-view-container'>");
            // 放入html
            if(content.html) {
                builder.push(content.html);
            }
            builder.push("</div>");
        }
        this._appendOperateElements(builder);
        builder.push("</li>");
    },
    _createItem: function(item, index) {
        var builder = [],
            li = $("<li class='ui-list-view-item' />"),
            container = $("<div class='ui-list-view-container' />"),
            content = this.option.itemFormatter.call(this, item, index);
        
        li.attr(indexAttr, index);

        if(ui.core.isString(content)) {
            container.append(content);
        } else if(ui.core.isPlainObject(content)) {
            // 添加class
            if(ui.core.isString(content.class)) {
                li.addClass(content.class);
            } else if(Array.isArray(content.class)) {
                li.addClass(content.class.join(" "));
            }
            // 添加style
            if(content.style && !ui.core.isEmptyObject(content.style)) {
                li.css(content.style);
            }

            // 添加内容
            if(content.html) {
                container.html(content.html);
            }
        }
        
        this._appendOperateElements(builder);
        container.append(builder.join(""));
        li.append(container);

        return li;
    },
    _appendOperateElements: function(builder) {
        builder.push("<b class='ui-list-view-b background-highlight' />");
        if(this.option.hasRemoveButton) {
            builder.push("<a href='javascript:void(0)' class='closable-button ui-item-view-remove'>×</a>");
        }
    },
    _indexOf: function(item) {
        var i, len,
            viewData = this.getViewData();
        for(i = 0, len = viewData.length; i < len; i++) {
            if(item === viewData[i]) {
                return i;
            }
        }
        return -1;
    },
    _getItemIndex: function(li) {
        return parseInt(li.getAttribute(indexAttr), 10);
    },
    _itemIndexAdd: function(li, num) {
        this._itemIndexSet(li, this._getItemIndex(li) + num);
    },
    _itemIndexSet: function(li, index) {
        li.setAttribute(indexAttr, index);
    },
    _getSelectionData: function(li) {
        var index = this._getItemIndex(li),
            data = {},
            viewData = this.getViewData();
        data.itemData = viewData[index];
        data.itemIndex = index;
        return data;
    },
    _removeItem: function(elem, index) {
        var that = this,
            doRemove,
            eventData,
            result,
            option,
            viewData;
        
        viewData = this.getViewData();

        eventData = this._getSelectionData(elem[0]);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        result = this.fire("removing", eventData);
        if(result === false) return;

        if(arguments.length === 1) {
            index = this._getItemIndex(elem[0]);
        }
        doRemove = function() {
            var nextLi = elem.next(),
                i;
            // 修正索引
            while(nextLi.length > 0) {
                this._itemIndexAdd(nextLi[0], -1);
                nextLi = nextLi.next();
            }
            // 检查已选择的项目
            if(this.isMultiple()) {
                for(i = 0; i < this._selectList.length; i++) {
                    if(elem[0] === this._selectList[i]) {
                        this._selectList(i, 1);
                        break;
                    }
                }
            } else {
                if(this._current && this._current[0] === elem[0]) {
                    this._current = null;
                }
            }
            
            this.fire("removed", eventData);
            elem.remove();
            viewData.splice(index, 1);
        };

        if(this.option.animatable === false) {
            doRemove.call(this);
            return;
        }

        option = this.removeFirstAnimator[0];
        option.target = elem;
        option.begin = 0;
        option.end = -(option.target.width());

        option = this.removeSecondAnimator[0];
        option.target = elem;
        option.begin = option.target.height();
        option.end = 0;
        option.target.css({
            "height": option.begin + "px",
            "overflow": "hidden"
        });

        this.removeFirstAnimator
            .start()
            .then(function() {
                return that.removeSecondAnimator.start();
            })
            .then(function() {
                doRemove.call(that);
            });
    },
    _selectItem: function(elem, index, checked, isFire) {
        var eventData,
            result,
            i;
        eventData = this._getSelectionData(elem[0]);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        result = this.fire("selecting", eventData);
        if(result === false) return;

        if(arguments.length === 2) {
            // 设置点击的项接下来是要选中还是取消选中
            // 因为还没有真正作用，所以取反
            checked = !elem.hasClass(selectedClass);
        } else {
            checked = !!checked;
        }

        if(this.isMultiple()) {
            if(checked) {
                this._selectList.push(elem[0]);
                elem.addClass(selectedClass);
            } else {
                for(i = 0; i < this._selectList.length; i++) {
                    if(this._selectList[i] === elem[0]) {
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
                elem.removeClass(selectedClass);
            }
        } else {
            if(checked) {
                if(this._current) {
                    this._current
                        .removeClass(selectedClass);
                }
                this._current = elem;
                this._current
                    .addClass(selectedClass);
            } else {
                elem.removeClass(selectedClass);
                this._current = null;
            }
        }

        if(isFire === false) {
            return;
        }
        if(checked) {
            this.fire("selected", eventData);
        } else {
            this.fire("deselected", eventData);
        }
    },

    /// API
    /** 添加 */
    add: function(item) {
        var li;
        if(!item) {
            return;
        }

        li = this._createItem(item, this.option.viewData.length);
        this.listPanel.append(li);
        this.option.viewData.push(item);
    },
    /** 根据数据项移除 */
    remove: function(item) {
        var type = ui.core.type(item);
        if(type !== "undefined" || type !== "null") {
            this.removeAt(this._indexOf(item));
        }
    },
    /** 根据索引移除 */
    removeAt: function(index) {
        var li,
            liList,
            that = this,
            doRemove,
            eventData;
        if(index < 0 || index >= this.count()) {
            return;
        }
        
        li = $(this.listPanel.children()[index]);
        this._removeItem(li);
    },
    /** 插入数据项 */
    insert: function(item, index) {
        var li, 
            liList,
            newLi, 
            i;
        if(index < 0) {
            index = 0;
        }
        if(index >= this.option.viewData.length) {
            this.add(item);
            return;
        }

        newLi = this._createItem(item, index);
        liList = this.listPanel.children();
        li = $(liList[index]);
        for(i = index; i < liList.length; i++) {
            this._itemIndexAdd(liList[i], 1);
        }
        newLi.insertBefore(li);
        this.option.viewData.splice(index, 0, item);
    },
    /** 上移 */
    currentUp: function() {
        var sourceIndex;
        if(this.isMultiple()) {
            throw new Error("The currentUp can not support for multiple selection");
        }
        if(this._current) {
            sourceIndex = this._getItemIndex(this._current[0]);
            if(sourceIndex > 0) {
                this.moveTo(sourceIndex, sourceIndex - 1);
            }
        }
    },
    /** 下移 */
    currentDown: function() {
        var sourceIndex;
        if(this.isMultiple()) {
            throw new Error("The currentDown can not support for multiple selection");
        }
        if(this._current) {
            sourceIndex = this._getItemIndex(this._current[0]);
            if(sourceIndex < this.count() - 1) {
                this.moveTo(sourceIndex, sourceIndex + 1);
            }
        }
    },
    /** 将元素移动到某个位置 */
    moveTo: function(sourceIndex, destIndex) {
        var liList,
            sourceLi,
            destLi,
            viewData,
            size, item, i;

        viewData = this.getViewData();
        size = this.count();
        if(size === 0) {
            return;
        }
        if(sourceIndex < 0 || sourceIndex >= size) {
            return;
        }
        if(destIndex < 0 || destIndex >= size) {
            return;
        }
        if(sourceIndex === destIndex) {
            return;
        }

        liList = this.listPanel.children();
        sourceLi = $(liList[sourceIndex]);
        destLi = $(liList[destIndex]);
        
        if(sourceIndex < destIndex) {
            // 从前往后移
            for(i = destIndex; i > sourceIndex; i--) {
                this._itemIndexAdd(liList[i], -1);
            }
            this._itemIndexSet(sourceLi[0], destIndex);
            destLi.after(sourceLi);
        } else {
            // 从后往前移
            for(i = destIndex; i < sourceIndex; i++) {
                this._itemIndexAdd(liList[i], 1);
            }
            this._itemIndexSet(sourceLi[0], destIndex);
            destLi.before(sourceLi);
        }
        item = viewData[sourceIndex];
        viewData.splice(sourceIndex, 1);
        viewData.splice(destIndex, 0, item);
    },
    /** 获取选中项 */
    getSelection: function() {
        var result = null,
            i;
        if(this.isMultiple()) {
            result = [];
            for(i = 0; i < this._selectList.length; i++) {
                result.push(
                    this._getSelectionData(this._selectList[i]));
            }
        } else {
            if(this._current) {
                result = this._getSelectionData(this._current);
            }
        }
        return result;
    },
    /** 设置选中项 */
    setSelection: function(indexes) {
        var i, 
            len,
            index,
            liList,
            li;
        this.cancelSelection();
        if(this.isMultiple()) {
            if(!Array.isArray(indexes)) {
                indexes = [indexes];
            }
        } else {
            if(Array.isArray(indexes)) {
                indexes = [indexes[0]];
            } else {
                indexes = [indexes];
            }
        }

        liList = this.listPanel.children();
        for(i = 0, len = indexes.length; i < len; i++) {
            index = indexes[i];
            li = liList[index];
            if(li) {
                this._selectItem($(li), index, true, (i >= len - 1));
            }
        }
    },
    /** 取消选中 */
    cancelSelection: function() {
        var li,
            i,
            len;
        if(this.isMultiple()) {
            for(i = 0, len = this._selectList.length; i < len; i++) {
                li = $(this._selectList[i]);
                li.removeClass(selectedClass);
            }
            this._selectList = [];
        } else {
            if(this._current) {
                this._current
                    .removeClass(selectedClass);
                this._current = null;
            }
        }
        this.fire("cancel");
    },
    /** 排序 */
    sort: function(fn) {
        var liList,
            fragment,
            i, 
            len;
        if(this.count() === 0) {
            return;
        }
        if(!ui.core.isFunction(fn)) {
            fn = defaultSortFn;
        }
        liList = this.listPanel.children();
        this.sorter.items = liList;
        this.sorter.sort(this.option.viewData, fn);

        fragment = document.createDocumentFragment();
        for(i = 0, len = liList.length; i < len; i++) {
            this._itemIndexSet(liList[i], i);
            fragment.appendChild(liList[i]);
        }
        this.listPanel.empty();
        this.listPanel[0].appendChild(fragment);
    },
    /** 设置视图数据 */
    setViewData: function(viewData) {
        if(Array.isArray(viewData)) {
            this._fill(viewData);
        }
    },
    /** 获取视图数据 */
    getViewData: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData : [];
    },
    /** 获取项目数 */
    count: function() {
        return this.option.viewData.length;
    },
    /** 是否可以多选 */
    isMultiple: function() {
        return this.option.multiple === true;
    },
    /** 清空列表 */
    clear: function() {
        this.option.viewData = [];
        this.listPanel.empty();
        this._current = null;
        this._selectList = [];
    }
});

$.fn.listView = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.ListView(option, this);
};


})(jQuery, ui);

// Source: src/control/view/report-view.js

(function($, ui) {
// Report View

var cellCheckbox = "grid-checkbox",
    cellCheckboxAll = "grid-checkbox-all",
    lastCell = "last-cell",
    sortClass = "fa-sort",
    asc = "fa-sort-asc",
    desc = "fa-sort-desc",
    emptyRow = "empty-row";

var DATA_BODY = "DataBody",
    // 默认行高30像素
    rowHeight = 30,
    // 最小不能小于40像素
    defaultFixedCellWidth = 40;

var tag = /^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/,
    attributes = /\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/;

var columnCheckboxAllFormatter = ui.ColumnStyle.cnfn.checkAll,
    checkboxFormatter = ui.ColumnStyle.cfn.check,
    columnTextFormatter = ui.ColumnStyle.cnfn.columnText,
    textFormatter = ui.ColumnStyle.cfn.text,
    rowNumberFormatter = ui.ColumnStyle.cfn.rowNumber;

function preparePager(option) {
    if(option.showPageInfo === true) {
        if(!option.pageInfoFormatter) {
            option.pageInfoFormatter = {
                currentRowNum: function(val) {
                    return "<span>本页" + val + "行</span>";
                },
                rowCount: function(val) {
                    return "<span class='font-highlight'>共" + val + "行</span>";
                },
                pageCount: function(val) {
                    return "<span>" + val + "页</span>";
                }
            };
        }
    }

    this.pager = ui.ctrls.Pager(option);
    this.pageIndex = this.pager.pageIndex;
    this.pageSize = this.pager.pageSize;
}
function reverse(arr1, arr2) {
    var temp,
        i = 0, 
        j = arr1.length - 1,
        len = arr1.length / 2;
    for (; i < len; i++, j--) {
        temp = arr1[i];
        arr1[i] = arr1[j];
        arr1[j] = temp;

        temp = arr2[i];
        arr2[i] = arr2[j];
        arr2[j] = temp;
    }
}
function sorting(v1, v2) {
    var column,
        fn,
        val1, val2;
    column = this._lastSortColumn;
    fn = column.sort;
    if(!ui.core.isFunction(fn)) {
        fn = defaultSortFn;
    }

    val1 = this._prepareValue(v1, column);
    val2 = this._prepareValue(v2, column);
    return fn(val1, val2);
}
function defaultSortFn(v1, v2) {
    var val, i, len;
    if (Array.isArray(v1)) {
        val = 0;
        for (i = 0, len = v1.length; i < len; i++) {
            val = defaultSorting(v1[i], v2[i]);
            if (val !== 0) {
                return val;
            }
        }
        return val;
    } else {
        return defaultSorting(v1, v2);
    }
}
function defaultSorting(v1, v2) {
    if (typeof v1 === "string") {
        return v1.localeCompare(v2);
    }
    if (v1 < v2) {
        return -1;
    } else if (v1 > v2) {
        return 1;
    } else {
        return 0;
    }
}
function resetColumnState() {
    var fn, key;
    for(key in this.resetColumnStateHandlers) {
        if(this.resetColumnStateHandlers.hasOwnProperty(key)) {
            fn = this.resetColumnStateHandlers[key];
            if(ui.core.isFunction(fn)) {
                try {
                    fn.call(this);
                } catch (e) { }
            }
        }
    }
}
function resetSortColumnState() {
    var cells, cells1, cells2,
        icon, i, len,
        lastIndex, index;

    if (this.tableFixedHead) {
        cells1 = this.fixedColumns;
    }
    if (this.tableDataHead) {
        cells2 = this.dataColumns;
    }

    cells = cells1;
    if(!cells) {
        cells = cells2;
    }
    if(!cells) {
        return;
    }

    lastIndex = -1;
    for (i = 0, len = this._sorterIndexes.length; i < len; i++) {
        index = this._sorterIndexes[i];
        if (index <= lastIndex || !cells[index]) {
            cells = cells2;
            lastIndex = -1;
        } else {
            lastIndex = index;
        }

        icon = cells[index].cell;
        icon = icon.find("i");
        if (!icon.hasClass(sortClass)) {
            icon.attr("class", "fa fa-sort");
            return;
        }
    }
}
function setChecked(cbx, checked) {
    if(checked) {
        cbx.removeClass("fa-square")
            .addClass("fa-check-square").addClass("font-highlight");
    } else {
        cbx.removeClass("fa-check-square").removeClass("font-highlight")
            .addClass("fa-square");
    }
}
function changeChecked(cbx) {
    var checked = !cbx.hasClass("fa-check-square"),
        colIndex;
    setChecked(cbx, checked);
    if(!this._gridCheckboxAll) {
        colIndex = this._getColumnIndexAndTableByFormatter(columnCheckboxAllFormatter, "text");
        if(colIndex === -1) {
            return;
        }
        this._gridCheckboxAll = 
            $(this.tableHead[0].tBodies[0].rows[0].cells[colIndex])
                .find("." + cellCheckboxAll);
    }
    if(checked) {
        this._checkedCount++;
    } else {
        this._checkedCount--;
    }
    if(this._checkedCount === this.count()) {
        setChecked(this._gridCheckboxAll, true);
    } else {
        setChecked(this._gridCheckboxAll, false);
    }
}
function getExcludeValue(elem) {
    var exclude = this.option.selection.exclude,
        result = true;
    if(exclude) {
        if(ui.core.isString(exclude)) {
            result = this._excludeElement(elem, exclude);
        } else if(ui.core.isFunction(exclude)) {
            result = exclude.call(this, elem);
        }
    }
    return result;
}

/// 事件函数
// 排序点击事件处理
function onSort(e) {
    var viewData,
        elem, nodeName,
        table, columnIndex, column,
        fn, isSelf,
        tempTbody, icon, 
        rows, oldRows, 
        newRows, i, len;

    e.stopPropagation();
    viewData = this.option.viewData;
    if (!Array.isArray(viewData) || viewData.length === 0) {
        return;
    }
    elem = $(e.target);
    while ((nodeName = elem.nodeName()) !== "TH") {
        if (nodeName === "TR") {
            return;
        }
        elem = elem.parent();
    }

    table = elem.parent().parent().parent();
    columnIndex = elem.data("data-columnIndex") || elem[0].cellIndex;
    if(table.hasClass("table-fixed-head")) {
        column = this.fixedColumns[columnIndex];
    } else {
        column = this.dataColumns[columnIndex];
    }

    if (this._lastSortColumn !== column) {
        resetSortColumnState.call(this, elem.parent());
    }

    fn = sorting.bind(this);
    isSelf = this._lastSortColumn == column;
    this._lastSortColumn = column;

    if(this.tableFixedBody) {
        // 如果有固定列表，则先排固定列表
        tempTbody = this.tableFixedBody.children("tbody");
    } else {
        tempTbody = this.tableDataBody.children("tbody");
    }
    rows = tempTbody.children().get();
    if (!Array.isArray(rows) || rows.length != viewData.length) {
        throw new Error("data row error");
    }
    // 保留排序前的副本，以后根据索引和rowIndex调整其它表格的顺序
    oldRows = rows.slice(0);

    icon = elem.find("i");
    if (icon.hasClass(asc)) {
        reverse(viewData, rows);
        icon.removeClass(sortClass).removeClass(asc).addClass(desc);
    } else {
        if (isSelf) {
            reverse(viewData, rows);
        } else {
            this.sorter.items = rows;
            this.sorter.sort(viewData, fn);
        }
        icon.removeClass(sortClass).removeClass(desc).addClass(asc);
    }
    tempTbody.append(rows);

    if(this.tableFixedBody) {
        // 根据排好序的固定列表将数据列表也排序
        if(this.tableDataBody) {
            tempTbody = this.tableDataBody.find("tbody");
            rows = tempTbody.children().get();
            newRows = new Array(rows.length);
            for(i = 0, len = oldRows.length; i < len; i++) {
                newRows[oldRows[i].rowIndex] = rows[i];
            }
            tempTbody.append(newRows);
        }
    }
    
    // 刷新行号
    this._refreshRowNumber();
}
// 滚动条同步事件
function onScrolling(e) {
    this.reportDataHead.scrollLeft(
        this.reportDataBody.scrollLeft());
    this.reportFixedBody.scrollTop(
        this.reportDataBody.scrollTop());
}
// 全选按钮点击事件处理
function onCheckboxAllClick(e) {
    var cbxAll, cbx, 
        checkedValue, columnInfo,
        rows, dataRows, dataCell,
        selectedClass, fn, 
        i, len;

    e.stopPropagation();

    columnInfo = this._getColumnIndexAndTableByFormatter(columnCheckboxAllFormatter, "text");
    if(!columnInfo) {
        return;
    }

    cbxAll = $(e.target);
    checkedValue = !cbxAll.hasClass("fa-check-square");
    setChecked.call(this, cbxAll, checkedValue);

    if(this.option.selection.isRelateCheckbox === true && this.isMultiple()) {
        selectedClass = this.option.seletion.type === "cell" ? "cell-selected" : "row-selected";
        
        if(checkedValue) {
            // 如果是要选中，需要同步行状态
            fn = function(td, checkbox) {
                var elem;
                if(this.option.selection.type === "cell") {
                    elem = td;
                } else {
                    elem = td.parent();
                }
                elem.context = checkbox[0];
                this._selectItem(elem, selectedClass, checkedValue);
            };
        } else {
            // 如果是取消选中，直接清空选中行状态
            for(i = 0, len = this._selectList.length; i < len; i++) {
                $(this._selectList[i])
                    .removeClass(selectedClass)
                    .removeClass("background-highlight");
            }
            this._selectList = [];
        }
    }
    
    rows = columnInfo.bodyTable[0].tBodies[0].rows;
    for(i = 0, len = rows.length; i < len; i++) {
        cbx = $(rows[i].cells[columnInfo.columnIndex]).find("." + cellCheckbox);
        if(cbx.length > 0) {
            if(ui.core.isFunction(fn)) {
                if(!dataRows) {
                    dataRows = this.tableDataBody[0].tBodies[0].rows; 
                }
                dataCell = $(dataRows[i].cells[0]);
                fn.call(this, dataCell, cbx);
            } else {
                setChecked.call(this, cbx, checkedValue);
            }
        }
    }
    if(checkedValue) {
        this._checkedCount = this.count();
    } else {
        this._checkedCount = 0;
    }
}
// 固定行点击事件
function onTableFixedBodyClick(e) {
    var elem,
        rowIndex,
        nodeName;

    elem = $(e.target);
    // 如果该元素已经被标记为排除项
    if(getExcludeValue.call(this, elem) === false) {
        return;
    }

    if(elem.hasClass(cellCheckbox)) {
        // 如果checkbox和选中行不联动
        if(!this.option.selection.isRelateCheckbox) {
            changeChecked.call(this, elem);
            return;
        }
    }

    // 如果是单元格选择模式则不用设置联动
    if (this.option.selection.type === "cell") {
        return;
    }

    if(this.tableDataBody) {
        while((nodeName = elem.nodeName()) !== "TR") {
            if(nodeName === "TBODY") {
                return;
            }
            elem = elem.parent();
        }
        rowIndex = elem[0].rowIndex;
        elem = $(this.tableDataBody[0].rows[rowIndex]);
        elem.context = e.target;

        this._selectItem(elem, "row-selected");
    }
}
// 数据行点击事件
function onTableDataBodyClick(e) {
    var elem, 
        tagName, 
        selectedClass,
        nodeName;
    
    elem = $(e.target);
    // 如果该元素已经被标记为排除项
    if(getExcludeValue.call(this, elem) === false) {
        return;
    }

    if(elem.hasClass(cellCheckbox)) {
        // 如果checkbox和选中行不联动
        if(!this.option.selection.isRelateCheckbox) {
            changeChecked.call(this, elem);
            return;
        }
    }

    tagName = this.option.selection.type === "cell" ? "TD" : "TR";
    selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
    while((nodeName = elem.nodeName()) !== tagName) {
        if(nodeName === "TBODY") {
            return;
        }
        elem = elem.parent();
    }

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    this._selectItem(elem, selectedClass);
}

ui.ctrls.define("ui.ctrls.ReportView", {
    _defineOption: function() {
        return {
                /*
                column property
                text:       string|function     列名，默认为null
                column:     string|Array        绑定字段名，默认为null
                len:        number              列宽度，默认为auto
                align:      center|left|right   列对齐方式，默认为left(但是表头居中)
                formatter:  function            格式化器，默认为null
                sort:       boolean|function    是否支持排序，true支持，false不支持，默认为false
            */
            // 固定列
            fixedGroupColumns: null,
            // 数据列
            dataGroupColumns: null,
            // 视图数据
            viewData: null,
            // 没有数据时显示的提示信息
            promptText: "没有数据",
            // 高度
            height: false,
            // 宽度
            width: false,
            // 调节列宽
            suitable: true,
            // 默认格式化器
            textFormatter: null,
            // 分页参数
            pager: {
                // 当前页码，默认从第1页开始
                pageIndex: 1,
                // 记录数，默认100条
                pageSize: 100,
                // 显示按钮数量，默认显示10个按钮
                pageButtonCount: 10,
                // 是否显示分页统计信息，true|false，默认不显示
                showPageInfo: false,
                // 格式化器，包含currentRowNum, rowCount, pageCount的显示
                pageInfoFormatter: null
            },
            // 选择设置
            selection: {
                // cell|row|disabled
                type: "row",
                // string 排除的标签类型，标记后点击这些标签将不会触发选择事件
                exclude: false,
                // 是否可以多选
                multiple: false,
                // 多选时是否和checkbox关联
                isRelateCheckbox: true
            }
        };
    },
    _defineEvents: function() {
        var events = ["selecting", "selected", "deselected", "rebind", "cancel"];
        if(this.option.pager) {
            events.push("pagechanging");
        }
        return events;
    },
    _create: function() {
        this._selectList = [];
        this._sorterIndexes = [];
        this._hasPrompt = !!this.option.promptText;
        // 存放列头状态重置方法
        this.resetColumnStateHandlers = {};

        // 列头对象
        this.reportHead = null;
        this.reportFixedHead = null;
        this.reportDataHead = null;
        // 表体对象
        this.reportBody = null;
        this.reportFixedBody = null;
        this.reportDataBody = null;

        this.columnHeight = this.rowHeight = rowHeight;
        this.pagerHeight = 30;

        if(this.option.pager) {
            preparePager.call(this, this.option.pager);
        }

        // 修正selection设置项
        if(!this.option.selection) {
            this.option.selection = {
                type: "disabled"
            };
        } else {
            if(ui.core.isString(this.option.selection.type)) {
                this.option.selection.type = this.option.selection.type.toLowerCase();
            } else {
                this.option.selection.type = "disabled";
            }
            if(!this.option.selection.multiple) {
                this.option.selection.isRelateCheckbox = false;
            }
        }

        if(!ui.core.isNumber(this.option.width) || this.option.width <= 0) {
            this.option.width = false;
        }
        if(!ui.core.isNumber(this.option.height) || this.option.height <= 0) {
            this.option.height = false;
        }

        // 排序器
        this.sorter = ui.Introsort();
        // checkbox勾选计数器
        this._checkedCount = 0;

        // 事件初始化
        // 排序按钮点击事件
        this.onSortHandler = onSort.bind(this);
        // 全选按钮点击事件
        this.onCheckboxAllClickHandler = onCheckboxAllClick.bind(this);
        // 滚动条同步事件
        this.onScrollingHandler = onScrolling.bind(this);
        // 固定行点击事件
        this.onTableFixedBodyClickHandler = onTableFixedBodyClick.bind(this);
        // 数据行点击事件
        this.onTableDataBodyClickHandler = onTableDataBodyClick.bind(this);
    },
    _render: function() {
        if(!this.element.hasClass("ui-report-view")) {
            this.element.addClass("ui-report-view");
        }

        this._initBorderWidth();

        // 表头
        this.reportHead = $("<div class='ui-report-head' />");
        this.reportFixedHead = $("<div class='fixed-head' />");
        this.reportDataHead = $("<div class='data-head'>");
        this.reportHead
            .append(this.reportFixedHead)
            .append(this.reportDataHead);
        this.element.append(this.reportHead);
        // 定义列宽调整
        this._initSuitable();
        // 表体
        this.reportBody = $("<div class='ui-report-body' />");
        this.reportFixedBody = $("<div class='fixed-body' />");
        this._fixedBodyScroll = $("<div class='fixed-body-scroll' />")
            .css("height", ui.scrollbarHeight);
        this.reportDataBody = $("<div class='data-body' />");
        this._initDataPrompt();
        this.reportDataBody.scroll(this.onScrollingHandler);
        this.reportBody
            .append(this.reportFixedBody)
            .append(this._fixedBodyScroll)
            .append(this.reportDataBody);
        this.element.append(this.reportBody);
        // 分页栏
        this._initPagerPanel();
        // 设置容器大小
        this.setSize(this.option.width, this.option.height);

        // 创建表头
        this.createReportHead(
            this.option.fixedGroupColumns, 
            this.option.dataGroupColumns);
        // 创建表体
        if (Array.isArray(this.option.viewData)) {
            this.createReportBody(
                this.option.viewData, 
                this.option.viewData.length);
        }
        
    },
    _initBorderWidth: function() {
        var getBorderWidth = function(key) {
            return parseInt(this.element.css(key), 10) || 0;
        };
        this.borderWidth = 0;
        this.borderHeight = 0;

        this.borderWidth += getBorderWidth.call(this, "border-left-width");
        this.borderWidth += getBorderWidth.call(this, "border-right-width");

        this.borderHeight += getBorderWidth.call(this, "border-top-width");
        this.borderHeight += getBorderWidth.call(this, "border-bottom-width");
    },
    _initDataPrompt: function() {
        var text;
        if(this._hasPrompt) {
            this._dataPrompt = $("<div class='data-prompt' />");
            text = this.option.promptText;
            if (ui.core.isString(text) && text.length > 0) {
                this._dataPrompt.html("<span class='font-highlight'>" + text + "</span>");
            } else if (ui.core.isFunction(text)) {
                text = text();
                this._dataPrompt.append(text);
            }
            this.reportDataBody.append(this._dataPrompt);
        }
    },
    _initSuitable: function() {
        if(!this.option.suitable) {
            return;
        }
        this._fitLine = $("<hr class='fit-line background-highlight' />");
        this.element.append(this._fitLine);
        this.dragger = ui.MouseDragger({
            context: this,
            target: this._fitLine,
            handle: this.reportDataHead,
            onBeginDrag: function(arg) {
                var elem, that, option,
                    elemOffset, panelOffset, left;
                
                elem = $(arg.target);
                if(!elem.isNodeName("b")) {
                    return false;
                }

                option = this.option;
                that = option.context;
                elemOffset = elem.offset();
                panelOffset = that.element.offset();
                left = elemOffset.left - panelOffset.left + elem.width();

                option.th = elem.parent();
                option.beginLeft = left;
                option.endLeft = left;
                option.leftLimit = panelOffset.left;
                option.rightLimit = panelOffset.left + that.element.outerWidth();
                
                option.target.css({
                    "left": left + "px",
                    "display": "block"
                });
            },
            onMoving: function(arg) {
                var option,
                    that,
                    left;
                
                option = this.option;
                that = option.context;

                left = parseFloat(option.target.css("left"));
                left += arg.x;

                if (left < option.leftLimit) {
                    left = option.leftLimit;
                } else if (left > option.rightLimit) {
                    left = option.rightLimit;
                }
                option.endLeft = left;
                option.target.css("left", left + "px");
            },
            onEndDrag: function(arg) {
                var option,
                    that,
                    colIndex, column,
                    width, col,
                    setWidthFn;

                option = this.option;
                that = option.context;
                option.target.css("display", "none");

                colIndex = option.th.data("data-columnIndex");
                column = that.dataColumns[colIndex];
                if(!column) {
                    return;
                }
                if(option.endLeft === option.beginLeft) {
                    return;
                }
                width = column.len + (option.endLeft - option.beginLeft);
                if(width < 30) {
                    width = 30;
                }
                column.len = width;
                setWidthFn  = function(container) {
                    var col;
                    if(container) {
                        col = container.children("colgroup").children()[colIndex];
                        if(col) {
                            col = $(col);
                            col.css("width", column.len + "px");
                        }
                    }
                };
                setWidthFn(that.tableDataHead);
                setWidthFn(that.tableDataBody);
                that._updateScrollState();
            }
        });
        this.dragger.on();
    },
    _initPagerPanel: function() {
        if(this.pager) {
            this.reportFoot = $("<div class='ui-report-foot clear' />");
            this.element.append(this.reportFoot);
            
            this.pager.pageNumPanel = $("<div class='page-panel' />");
            if (this.option.pager.displayDataInfo) {
                this.pager.pageInfoPanel = $("<div class='data-info' />");
                this.reportFoot.append(this.pager.pageInfoPanel);
            } else {
                this.pager.pageNumPanel.css("width", "100%");
            }

            this.reportFoot.append(this.pager.pageNumPanel);
            this.pager.pageChanged(function(pageIndex, pageSize) {
                this.pageIndex = pageIndex;
                this.pageSize = pageSize;
                this.fire("pagechanging", pageIndex, pageSize);
            }, this);
        }
    },
    _createFixedHead: function (fixedColumns, fixedGroupColumns) {
        if (!this.tableFixedHead) {
            this.tableFixedHead = $("<table class='table-fixed-head' cellspacing='0' cellpadding='0' />");
            this.reportFixedHead.append(this.tableFixedHead);
        } else {
            this.tableFixedHead.html("");
        }
        this._fixedColumnWidth = 0;
        this._createHeadTable(this.tableFixedHead, fixedColumns, fixedGroupColumns,
            function (c) {
                if (!c.len) {
                    c.len = defaultFixedCellWidth;
                }
                this._fixedColumnWidth += c.len + 1;
            }
        );
        this.reportFixedHead.css("width", this._fixedColumnWidth + "px");
    },
    _createDataHead: function (dataColumns, dataGroupColumns) {
        if (!this.tableDataHead) {
            this.tableDataHead = $("<table class='table-data-head' cellspacing='0' cellpadding='0' />");
            this.reportDataHead.append(this.tableDataHead);
            this.reportDataHead.css("left", this._fixedColumnWidth + "px");
        } else {
            this.tableDataHead.html("");
        }
        this._createHeadTable(this.tableDataHead, dataColumns, dataGroupColumns,
            // 创建最后的列
            function (c, th, cidx, len) {
                if (cidx == len - 1) {
                    th.addClass(lastCell);
                }
            },
            // 创建滚动条适应列
            function(headTable, tr, colGroup) {
                var rows,
                    rowspan,
                    th;

                this._dataHeadScrollCol = $("<col style='width:0' />");
                colGroup.append(this._dataHeadScrollCol);

                rows = tr.parent().children();
                rowspan = rows.length;
                th = $("<th class='ui-report-head-cell scroll-cell' />");
                if (rowspan > 1) {
                    th.attr("rowspan", rowspan);
                }
                $(rows[0]).append(th);
            });
    },   
    _createFixedBody: function (viewData, columns) {
        if (!this.tableFixedBody) {
            this.tableFixedBody = $("<table class='table-fixed-body' cellspacing='0' cellpadding='0' />");
            if (this.isSelectable()) {
                this.tableFixedBody.click(this.onTableFixedBodyClickHandler);
            }
            this.reportFixedBody.append(this.tableFixedBody);
        } else {
            this.reportFixedBody.scrollTop(0);
            this._emptyFixed();
        }

        if (viewData.length === 0) {
            return;
        }

        this._createBodyTable(this.tableFixedBody, viewData, columns);

        this.reportFixedBody.css("width", this._fixedColumnWidth + "px");
        this._fixedBodyScroll.css("width", this._fixedColumnWidth + "px");
    },
    _createDataBody: function (viewData, columns, rowCount) {
        var isRebind = false;
        if (!this.tableDataBody) {
            this.tableDataBody = $("<table class='table-data-body' cellspacing='0' cellpadding='0' />");
            if (this.isSelectable()) {
                this.tableDataBody.click(this.onTableDataBodyClickHandler);
            }
            this.reportDataBody.append(this.tableDataBody);
            this.reportDataBody.css("left", this._fixedColumnWidth + "px");
        } else {
            this.reportDataBody.scrollTop(0);
            this._emptyData();
            isRebind = true;
        }

        if (viewData.length === 0) {
            this._showDataPrompt();
            return;
        } else {
            this._hideDataPrompt();
        }

        this._createBodyTable(this.tableDataBody, viewData, columns, { type: DATA_BODY });

        this._updateScrollState();
        //update page numbers
        if (ui.core.isNumber(rowCount)) {
            this._renderPageList(rowCount);
        }

        if (isRebind) {
            this.fire("rebind");
        }
    },
    _createHeadTable: function (headTable, columns, groupColumns, eachFn, colFn) {
        var hasFn,
            colGroup, thead,
            tr, th, c, el,
            i, j, row,
            cHeight = 0,
            args, columnIndex, isDataHeadTable;
        
        hasFn = ui.core.isFunction(eachFn);
        isDataHeadTable = headTable.hasClass("table-data-head");

        thead = $("<thead />");
        if (Array.isArray(groupColumns)) {
            for (i = 0; i < groupColumns.length; i++) {
                row = groupColumns[i];
                tr = $("<tr />");
                if (!row || row.length === 0) {
                    tr.addClass(emptyRow);
                }
                columnIndex = 0;
                for (j = 0; j < row.length; j++) {
                    c = row[j];
                    th = this._createCell("th", c);
                    th.addClass("ui-report-head-cell");
                    if (ui.core.isFunction(c.text)) {
                        el = c.text.call(this, c, th);
                    } else {
                        if(c.text) {
                            el = columnTextFormatter.call(this, c, th);
                        }
                    }
                    if (el) {
                        th.append(el);
                    }

                    if (c.column || ui.core.isFunction(c.formatter)) {
                        if (!c._columnKeys) {
                            c._columnKeys = {};
                        }
                        while (columns[columnIndex]) {
                            columnIndex++;
                        }
                        this._setSorter(th, c, columnIndex);

                        delete c.rowspan;
                        delete c.colspan;
                        th.data("data-columnIndex", columnIndex);
                        c.cell = th;
                        c.columnIndex = columnIndex;
                        columns[columnIndex] = c;
                    }
                    if(this.option.fitColumns && isDataHeadTable) {
                        th.append("<b class='fit-column-handle' />");
                    }
                    tr.append(th);

                    columnIndex += c.colspan || 1;
                }
                thead.append(tr);
                cHeight += this.rowHeight;
            }
        }

        colGroup = $("<colgroup />");
        for (i = 0; i < columns.length; i++) {
            c = columns[i];
            c.cellIndex = i;
            colGroup.append(this._createCol(c));

            args = [c, c.cell];
            if (hasFn) {
                args.push(i);
                args.push(columns.length);
                eachFn.apply(this, args);
            }
        }
        if (ui.core.isFunction(colFn)) {
            colFn.call(this, headTable, tr, colGroup);
        }
        if (cHeight > this.columnHeight) {
            this.columnHeight = cHeight;
        }
        
        headTable.append(colGroup);
        headTable.append(thead);
    },
    _createBodyTable: function (bodyTable, viewData, columns, tempData, afterFn) {
        var colGroup, tbody,
            obj, tr, c, i, j,
            columnLength,
            lastCellFlag;

        columnLength = columns.length;
        lastCellFlag = (tempData && tempData.type === DATA_BODY);
        this._tempHandler = null;

        colGroup = $("<colgroup />");
        for (j = 0; j < columnLength; j++) {
            c = columns[j];
            colGroup.append(this._createCol(c));
        }

        tbody = $("<tbody />");
        for (i = 0; i < viewData.length; i++) {
            tr = $("<tr />");
            obj = viewData[i];
            this._createRowCells(tr, obj, i, columns, lastCellFlag);
            tbody.append(tr);
        }

        bodyTable.append(colGroup);
        bodyTable.append(tbody);

        if (ui.core.isFunction(afterFn)) {
            afterFn.call(this, bodyTable);
        }
    },
    _createRowCells: function (tr, rowData, rowIndex, columns, lastCellFlag) {
        var columnLength,
            formatter,
            isRowHover,
            i, c, cval, td, el;

        isRowHover = this.option.selection.type !== "cell";
        if(isRowHover) {
            tr.addClass("table-body-row-hover");
        }

        columnLength = columns.length;
        for (i = 0; i < columnLength; i++) {
            c = columns[i];
            formatter = c.formatter;
            // 自定义格式化器
            if (!ui.core.isFunction(c.formatter)) {
                formatter = this.option.textFormatter;
            }
            // option默认格式化器
            if(!ui.core.isFunction(formatter)) {
                formatter = textFormatter;
            }
            cval = this._prepareValue(rowData, c);
            td = this._createCell("td", c);
            td.addClass("ui-table-body-cell");
            if(!isRowHover) {
                td.addClass("table-body-cell-hover");
            }
            el = formatter.call(this, cval, c, rowIndex, td);
            if (td.isAnnulment) {
                continue;
            }
            if (el) {
                td.append(el);
            }
            if (lastCellFlag && i === columnLength - 1) {
                td.addClass(lastCell);
            }
            tr.append(td);
        }
    },
    // 获得并组装值
    _prepareValue: function (rowData, c) {
        var value,
            i, len;
        if (Array.isArray(c.column)) {
            value = {};
            for (i = 0, len = c.column.length; i < len; i++) {
                value[i] = value[c.column[i]] = 
                    this._getValue(rowData, c.column[i], c);
            }
        } else {
            value = this._getValue(rowData, c.column, c);
        }
        return value;
    },
    // 获取值
    _getValue: function(rowData, column, c) {
        var arr, i = 0, value;
        if (!ui.core.isString(column)) {
            return null;
        }
        if (!c._columnKeys.hasOwnProperty(column)) {
            c._columnKeys[column] = column.split(".");
        }
        arr = c._columnKeys[column];
        value = rowData[arr[i]];
        for (i = 1; i < arr.length; i++) {
            value = value[arr[i]];
            if (value === undefined || value === null) {
                return value;
            }
        }
        return value;
    },
    _createCol: function(column) {
        var col = $("<col />");
        if (ui.core.isNumber(column.len)) {
            col.css("width", column.len + "px");
        }
        return col;
    },
    _createCell: function(tagName, column) {
        var cell = $("<" + tagName + " />"),
            css = {};
        if (ui.core.isNumber(column.colspan)) {
            cell.prop("colspan", column.colspan);
        }
        if (ui.core.isNumber(column.rowspan)) {
            cell.prop("rowspan", column.rowspan);
            if(column.rowspan > 1) {
                cell.css("height", column.rowspan * this.rowHeight - 1);
            }
        }
        if (column.align) {
            css["text-align"] = column.align;
        }
        cell.css(css);

        return cell;
    },
    _setSorter: function(cell, column, index) {
        if (column.sort === true || ui.core.isFunction(column.sort)) {
            cell.click(this.onSortHandler);
            cell.addClass("sorter");
            cell.append("<i class='fa fa-sort' />");
            this._sorterIndexes.push(index);
        }
    },
    _renderPageList: function(rowCount) {
        if (!this.pager) {
            return;
        }
        this.pager.data = this.option.viewData;
        this.pager.pageIndex = this.pageIndex;
        this.pager.pageSize = this.pageSize;
        this.pager.renderPageList(rowCount);
    },
    _updateScrollState: function() {
        var h, w, sh, sw;
        if (!this.reportDataBody || !this.tableDataHead) {
            return;
        }

        h = this.reportDataBody.height();
        w = this.reportDataBody.width();
        sh = this.reportDataBody[0].scrollHeight;
        sw = this.reportDataBody[0].scrollWidth;

        if (sh > h) {
            //滚动条默认是17像素，在IE下会显示为16.5，有效值为16。为了修正此问题设置为17.1
            this._dataHeadScrollCol.css("width", ui.scrollbarWidth + 0.1 + "px");
        } else {
            this._dataHeadScrollCol.css("width", "0");
        }

        if (sw > w) {
            this.reportFixedBody.css("height", h - ui.scrollbarWidth + "px");
            this._fixedBodyScroll.css("display", "block");
        } else {
            this.reportFixedBody.css("height", h + "px");
            this._fixedBodyScroll.css("display", "none");
        }
    },
    _refreshRowNumber: function(startRowIndex, endRowIndex) {
        var viewData,
            columnInfo, rowNumber,
            rows, cell,
            column, i, len;

        viewData = this.option.viewData;
        if(!viewData || viewData.length === 0) {
            return;
        }

        rowNumber = rowNumberFormatter;
        columnInfo = this._getColumnIndexAndTableByFormatter(rowNumber);
        
        if (!columnInfo) return;
        if (!ui.core.isNumber(startRowIndex)) {
            startRowIndex = 0;
        }
        rows = columnInfo.bodyTable[0].rows;
        column = columnInfo.columns[columnInfo.columnIndex];
        len = ui.core.isNumber(endRowIndex) ? endRowIndex + 1 : rows.length;
        for (i = startRowIndex; i < len; i++) {
            cell = $(rows[i].cells[columnInfo.columnIndex]);
            cell.html("");
            cell.append(rowNumber.call(this, null, column, i));
        }
    },
    _emptyFixed: function() {
        if (this.tableFixedBody) {
            this.tableFixedBody.html("");
            resetColumnState.call(this);
            this._lastSortColumn = null;
        }
    },
    _emptyData: function() {
        if (this.tableDataBody) {
            this.tableDataBody.html("");
            this._selectList = [];
            this._current = null;
        }
        if (this.pager) {
            this.pager.empty();
        }
    },
    _getColumnIndexAndTableByFormatter: function(formatter, field) {
        var result, i, len;
        result = {
            columnIndex: -1,
            columns: null,
            headTable: null,
            bodyTable: null
        };

        if(!field) {
            field = "formatter";
        }

        if(this.fixedColumns) {
            for(i = 0, len = this.fixedColumns.length; i < len; i++) {
                if(this.fixedColumns[i][field] === formatter) {
                    result.columnIndex = i;
                    result.columns = this.fixedColumns;
                    result.headTable = this.tableFixedHead;
                    result.bodyTable = this.tableFixedBody;
                    return result;
                }
            }
        }
        if(this.dataColumns) {
            for(i = 0, len = this.dataColumns.length; i < len; i++) {
                if(this.dataColumns[i][field] === formatter) {
                    result.columnIndex = i;
                    result.columns = this.dataColumns;
                    result.headTable = this.tableDataHead;
                    result.bodyTable = this.tableDataBody;
                    return result;
                }
            }
        }
        if(result.columnIndex === -1) {
            return null;
        }
    },
    _getSelectionData: function(elem) {
        var data = {};
        if(this.option.selection.type === "cell") {
            data.rowIndex = elem.parent().prop("rowIndex");
            data.cellIndex = elem.prop("cellIndex");
            data.rowData = this.option.viewData[data.rowIndex];
            data.column = this.option.columns[data.cellIndex].column;
        } else {
            data.rowIndex = elem.prop("rowIndex");
            data.rowData = this.option.viewData[data.rowIndex];
        }
        return data;
    },
    _excludeElement: function(elem, exclude) {
        var tagName = elem.nodeName().toLowerCase(),
            exArr = exclude.split(","),
            ex, match,
            i, len;
        for(i = 0, len = exArr.length; i < len; i++) {
            ex = ui.str.trim(exArr[i]);
            match = ex.match(attributes);
            if(match) {
                ex = ex.match(tag)[1];
                if(ex === tagName) {
                    return elem.attr(match[1]) !== match[4];
                }
            } else {
                if(ex.toLowerCase() === tagName) {
                    return false;
                }
            }
        }
    },
    _selectItem: function(elem, selectedClass, selectValue) {
        var eventData, result,
            columnInfo, checkbox,
            i, len;

        eventData = this._getSelectionData(elem);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        result = this.fire("selecting", eventData);
        if(result === false) {
            return;
        }

        if(this.isMultiple()) {
            // 多选
            if(elem.hasClass(selectedClass)) {
                // 现在要取消
                // 如果selectValue定义了选中，则不要执行取消逻辑
                if(selectValue === true) {
                    return;
                }
                selectValue = false;

                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if(this._selectList[i] === elem[0]) {
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
                elem.removeClass(selectedClass).removeClass("background-highlight");
                this.fire("deselected", eventData);
            } else {
                // 现在要选中
                // 如果selectValue定义了取消，则不要执行选中逻辑
                if(selectValue === false) {
                    return;
                }
                selectValue = true;

                this._selectList.push(elem[0]);
                elem.addClass(selectedClass).addClass("background-highlight");
                this.fire("selected", eventData);
            }

            // 同步checkbox状态
            if(this.option.selection.isRelateCheckbox) {
                // 用过用户点击的是checkbox则保存变量，不用重新去获取了
                if(eventData.originElement && eventData.originElement.hasClass(cellCheckbox)) {
                    checkbox = eventData.originElement;
                }
                // 如果用户点击的不是checkbox则找出对于的checkbox
                if(!checkbox) {
                    columnInfo = this._getColumnIndexAndTableByFormatter(checkboxFormatter);
                    if(columnInfo) {
                        checkbox = this.option.selection.type === "cell" ? 
                            $(elem.parent()[0].cells[colIndex]) : 
                            $(elem[0].cells[colIndex]);
                        checkbox = checkbox.find("." + cellCheckbox);
                    }
                }
                if(checkbox && checkbox.length > 0) {
                    setChecked.call(this, checkbox, selectValue);
                }
            }
        } else {
            // 单选
            if(this._current) {
                this._current.removeClass(selectedClass).removeClass("background-highlight");
                if(this._current[0] === elem[0]) {
                    this._current = null;
                    this.fire("deselected", eventData);
                    return;
                }
            }
            this._current = elem;
            elem.addClass(selectedClass).addClass("background-highlight");
            this.fire("selected", eventData);
        }
    },
    _promptIsShow: function() {
        return this._hasPrompt && this._dataPrompt.css("display") === "block";
    },
    _setPromptLocation: function() {
        var height = this._dataPrompt.height();
        this._dataPrompt.css("margin-top", -(height / 2) + "px");
    },
    _showDataPrompt: function() {
        if(!this._hasPrompt) return;
        this._dataPrompt.css("display", "block");
        this._setPromptLocation();
    },
    _hideDataPrompt: function() {
        if(!this._hasPrompt) return;
        this._dataPrompt.css("display", "none");
    },


    /// API
    /** 创建表头 */
    createReportHead: function(fixedGroupColumns, dataGroupColumns) {
        if(Array.isArray(fixedGroupColumns)) {
            this.fixedColumns = [];
            if(!Array.isArray(fixedGroupColumns[0])) {
                fixedGroupColumns = [fixedGroupColumns];
            }
            this._createFixedHead(this.fixedColumns, fixedGroupColumns);
        }

        if (Array.isArray(dataGroupColumns)) {
            this.dataColumns = [];
            if(!Array.isArray(dataGroupColumns[0])) {
                dataGroupColumns = [dataGroupColumns];
            }
            this._createDataHead(this.dataColumns, dataGroupColumns);
        }

        this.reportFixedHead.css("height", this.columnHeight + "px");
        this.reportDataHead.css("height", this.columnHeight + "px");
        this.reportHead.css("height", this.columnHeight + "px");
    },
    /** 创建表体 */
    createReportBody: function(viewData, rowCount) {
        if(!Array.isArray(viewData)) {
            viewData = [];
        }
        this.option.viewData = viewData;
        if (this.fixedColumns && Array.isArray(this.fixedColumns)) {
            this._createFixedBody(viewData, this.fixedColumns);
        }

        if (this.dataColumns && Array.isArray(this.dataColumns)) {
            this._createDataBody(viewData, this.dataColumns, rowCount);
        }
    },
    /** 获取checkbox勾选项的值 */
    getCheckedValues: function() {
        var columnInfo, rows, elem,
            checkboxClass = "." + cellCheckbox,
            result = [],
            i, len;

        columnInfo = this._getColumnIndexAndTableByFormatter(checkboxFormatter);
        if(!columnInfo) {
            return result;
        }

        rows = columnInfo.bodyTable[0].tBodies[0].rows;
        for(i = 0, len = rows.length; i < len; i++) {
            elem = $(rows[i].cells[columnInfo.columnIndex]).find(checkboxClass);
            if(elem.length > 0) {
                result.push(ui.str.htmlDecode(elem.attr("data-value")));
            }
        }
        return result;
    },
    /** 获取选中的数据，单选返回单个对象，多选返回数组 */
    getSelection: function() {
        var result,
            i, len;
        if(!this.isSelectable()) {
            return null;
        }
        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                result.push(this._getSelectionData($(this._selectList[i])));
            }
        } else {
            result = null;
            if(this._current) {
                result = this._getSelectionData(this._current);
            }
        }
        return result;
    },
    /** 取消选中项 */
    cancelSelection: function() {
        var selectedClass, elem, 
            columnInfo, checkboxClass, fn,
            i, len;

        if (!this.isSelectable()) {
            return;
        }

        selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
        if(this.option.selection.isRelateCheckbox) {
            checkboxClass = "." + cellCheckbox;
            columnInfo = this._getColumnIndexAndTableByFormatter(checkboxFormatter);
            fn = function(elem) {
                var checkbox,
                    rowIndex,
                    tr;
                if(columnInfo) {
                    rowIndex = this.option.selection.type === "cell" ? elem.parent()[0].rowIndex : elem[0].rowIndex;
                    tr = $(columnInfo.bodyTable[0].tBodies[0].rows[rowIndex]);
                    checkbox = $(tr[0].cells[columnInfo.columnIndex]);
                    checkbox = checkbox.find(checkboxClass);
                    setChecked(checkbox, false);
                }
                elem.removeClass(selectedClass).removeClass("background-highlight");
            };
        } else {
            fn = function(elem) {
                elem.removeClass(selectedClass).removeClass("background-highlight");
            };
        }

        if(this.isMultiple()) {
            if(this._selectList.length === 0) {
                return;
            }
            for(i = 0, len = this._selectList.length; i < len; i++) {
                elem = $(this._selectList[i]);
                fn.call(this, elem);
            }
            this._selectList = [];
        } else {
            if(!this._current) {
                return;
            }
            fn.call(this, this._current);
            this._current = null;    
        }
        this.fire("cancel");
    },
    /** 移除行 */
    removeRowAt: function() {
        var rowIndex,
            indexes,
            viewData,
            row,
            i, len,
            isMultiple,
            type,
            removeSelectItemFn;

        viewData = this.option.viewData;
        if(!viewData) {
            return;
        }
        len = arguments.length;
        if(len === 0) {
            return;
        }
        indexes = [];
        for(i = 0; i < len; i++) {
            rowIndex = arguments[i];
            if(ui.core.isNumber(rowIndex) && rowIndex >= 0 && rowIndex < viewData.length) {
                indexes.push(rowIndex);
            }
        }
        len = indexes.length;
        if(len > 0) {
            indexes.sort(function(a, b) {
                return b - a;
            });
            type = this.option.selection.type;
            isMultiple = this.isMultiple();
            if(type === "row") {
                removeSelectItemFn = function(idx) {
                    var i, len, selectItem;
                    if(isMultiple) {
                        for(i = 0, len = this._selectList.length; i < len; i++) {
                            selectItem = this._selectList[i];
                            if(idx === selectItem.rowIndex) {
                                this._selectList.splice(i, 1);
                                return;
                            }
                        }
                    } else {
                        if(this._current && this._current[0].rowIndex === idx) {
                            this._current = null;
                        }
                    }
                };
            } else if(type === "cell") {
                removeSelectItemFn = function(idx) {
                    var i, len, row;
                    if(isMultiple) {
                        for(i = 0, len = this._selectList.length; i < len; i++) {
                            row = this._selectList[i];
                            row = row.parentNode;
                            if(idx === row.rowIndex) {
                                this._selectList.splice(i, 1);
                                return;
                            }
                        }
                    } else {
                        if(this._current) {
                            row = this._current.parent();
                            if(row[0].rowIndex === idx) {
                                this._current = null;
                            }
                        }
                    }
                };
            }
            for(i = 0; i < len; i++) {
                rowIndex = indexes[i];
                row = $(this.tableDataBody[0].rows[rowIndex]);
                row.remove();
                if(this.tableFixedBody) {
                    $(this.tableFixedBody[0].rows[rowIndex]).remove();
                }
                viewData.splice(rowIndex, 1);
                if(removeSelectItemFn) {
                    removeSelectItemFn.call(this, rowIndex);
                }
            }
            this._updateScrollState();
            this._refreshRowNumber(rowIndex);
        }
    },
    /** 更新行 */
    updateRow: function(rowIndex, rowData) {
        var viewData,
            fixedRow,
            row;

        viewData = this.option.viewData;
        if(!viewData) {
            return;
        }
        if(rowIndex < 0 || rowIndex > viewData.length) {
            return;
        }

        row = $(this.tableBody[0].rows[rowIndex]);
        if(row.length === 0) {
            return;
        }
        if(thsi.tableFixedBody) {
            fixedRow = $(this.tableFixedBody[0].rows[rowIndex]);
            fixedRow.empty();
            this._createRowCells(fixedRow, rowData, rowIndex, this.fixedColumns);
        }
        row.empty();
        viewData[rowIndex] = rowData;
        this._createRowCells(row, rowData, rowIndex, this.dataColumns, true);
    },
    /** 增加行 */
    addRow: function(rowData) {
        var viewData,
            row;
        if(!rowData) return;
        viewData = this.option.viewData;

        if(!Array.isArray(viewData) || viewData.length === 0) {
            if (this.tableFixedBody) {
                this.tableFixedBody.remove();
                this.tableFixedBody = null;
            }
            if (this.tableDataBody) {
                this.tableDataBody.remove();
                this.tableDataBody = null;
            }
            this.createReportBody([data]);
            return;
        }

        if(this.tableFixedBody) {
            row = $("<tr />");
            this._createRowCells(row, rowData, viewData.length, this.fixedColumns);
            $(this.tableFixedBody[0].tBodies[0]).append(row);
        }
        if(this.tableDataBody) {
            row = $("<tr />");
            this._createRowCells(row, rowData, viewData.length, this.dataColumns, true);
            $(this.tableDataBody[0].tBodies[0]).append(row);
        }
        viewData.push(rowData);
        this._updateScrollState();
    },
    /** 插入行 */
    insertRow: function(rowIndex, rowData) {
        var viewData,
            row;
        if(!rowData) return;
        viewData = this.option.viewData;

        if(!Array.isArray(viewData) || viewData.length === 0) {
            this.addRow(rowData);
            return;
        }
        if(rowIndex < 0) {
            rowIndex = 0;
        }
        if(rowIndex < viewData.length) {
            if(this.tableFixedBody) {
                row = $("<tr />");
                this._createRowCells(row, rowData, rowIndex, this.fixedColumns);
                $(this.tableFixedBody[0].rows[rowIndex]).before(row);
                viewData.splice(rowIndex, 0, rowData);
            }
            if(this.tableDataBody) {
                row = $("<tr />");
                this._createRowCells(row, rowData, rowIndex, this.dataColumns, true);
                $(this.tableDataBody[0].rows[rowIndex]).before(row);
                viewData.splice(rowIndex, 0, rowData);
            }
            this._updateScrollState();
            this._refreshRowNumber();
        } else {
            this.addRow(rowData);
        }
    },
    /** 当前行上移 */
    currentRowUp: function() {
        var data;
        if(this.isMultiple()) {
            throw new Error("The currentRowUp can not support for multiple selection");
        }
        if(this.option.selection.type === "cell") {
            throw new Error("The currentRowUp can not support for cell selection");
        }
        
        data = this.getSelection();
        if(!data || data.rowIndex === 0) {
            return;
        }
        this.moveRow(data.rowIndex, data.rowIndex - 1);
    },
    /** 当前行下移 */
    currentRowDown: function() {
        var data;
        if(this.isMultiple()) {
            throw new Error("The currentRowDown can not support for multiple selection");
        }
        if(this.option.selection.type === "cell") {
            throw new Error("The currentRowDown can not support for cell selection");
        }
        
        data = this.getSelection();
        if(!data || data.rowIndex >= this.count()) {
            return;
        }
        this.moveRow(data.rowIndex, data.rowIndex + 1);
    },
    /** 移动行 */
    moveRow: function(sourceIndex, destIndex) {
        var viewData,
            rows,
            destRow,
            tempData;
        
        viewData = this.option.viewData;
        if(viewData.length === 0) {
            return;
        }
        if(destIndex < 0) {
            destIndex = 0;
        } else if(destIndex >= viewData.length) {
            destIndex = viewData.length - 1;
        }

        if(sourceIndex === destIndex) {
            return;
        }

        if(destIndex > rowIndex) {
            if(this.tableFixedBody) {
                rows = this.tableFixedBody[0].tBodies[0].rows;
                destRow = $(rows[destIndex]);
                destRow.after($(rows[sourceIndex]));
            }
            if(thsi.tableDataBody) {
                rows = this.tableDataBody[0].tBodies[0].rows;
                destRow = $(rows[destIndex]);
                destRow.after($(rows[sourceIndex]));
            }
            this._refreshRowNumber(sourceIndex, destIndex);
        } else {
            if(this.tableFixedBody) {
                rows = this.tableFixedBody[0].tBodies[0].rows;
                destRow = $(rows[destIndex]);
                destRow.before($(rows[sourceIndex]));
            }
            if(thsi.tableDataBody) {
                rows = this.tableDataBody[0].tBodies[0].rows;
                destRow = $(rows[destIndex]);
                destRow.before($(rows[sourceIndex]));
            }
            this._refreshRowNumber(destIndex, sourceIndex);
        }
        tempData = viewData[sourceIndex];
        viewData.splice(sourceIndex, 1);
        viewData.splice(destIndex, 0, tempData);
    },
    /** 获取行数据 */
    getRowData: function(rowIndex) {
        var viewData = this.option.viewData;
        if(!Array.isArray(viewData) || viewData.length === 0) {
            return null;
        }
        if(!ui.core.isNumber(rowIndex) || rowIndex < 0 || rowIndex >= viewData.length) {
            return null;
        }
        return viewData[rowIndex];
    },
    /** 获取视图数据 */
    getViewData: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData : [];
    },
    /** 获取项目数 */
    count: function() {
        return Array.isArray(this.option.viewData) ? 0 : this.option.viewData.length;
    },
    /** 是否可以选择 */
    isSelectable: function() {
        var type = this.option.selection.type;
        return type === "row" || type === "cell";
    },
    /** 是否支持多选 */
    isMultiple: function() {
        return this.option.selection.multiple === true;
    },
    /** 清空表格数据 */
    clear: function() {
        this.option.viewData = [];
        this._checkedCount = 0;

        this._emptyFixed();
        this._emptyData();

        resetSortColumnState.call(this);
        this._showDataPrompt();
    },
    /** 设置表格的尺寸, width: 宽度, height: 高度 */
    setSize: function(width, height) {
        if(arguments.length === 1) {
            height = width;
            width = null;
        }
        if(ui.core.isNumber(height)) {
            height -= this.columnHeight + this.borderHeight;
            if(this.pager) {
                height -= this.pagerHeight;
            }
            this.reportBody.css("height", height + "px");
            this.reportFixedBody.css("height", height + "px");
            this.reportDataBody.css("height", height + "px");
        }
        if(ui.core.isNumber(width)) {
            width -= this.borderWidth;
            this.element.css("width", width + "px");
        }
        this._updateScrollState();
        if(this._promptIsShow()) {
            this._setPromptLocation();
        }
    }
});

$.fn.reportView = function(option) {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.ReportView(option, this);
};


})(jQuery, ui);

// Source: src/control/view/tab-view.js

(function($, ui) {
// TabView

var selectedClass = "ui-tab-selection";

function noop() {}
// 视图模式
function View(tabView) {
    if(this instanceof View) {
        this.initialize(tabView);
    } else {
        return new View(tabView);
    }
}
View.prototype = {
    constructor: View,
    initialize: function(tabView) {
        var that;

        this.tabView = tabView;
        this.animationCssItem = tabView.isHorizontal ? "left": "top";

        that = this;
        this.animator = ui.animator({
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
        this.animator.onEnd = function() {
            that.currentIndex = that.nextIndex;
            tabView._current.css("display", "none");
            tabView._current = that.nextView;
            that.nextIndex = null;
            that.nextView = null;

            tabView.fire("changed", that.currentIndex);
        };

        if(ui.core.isNumber(tabView.option.duration)) {
            this.animator.duration = tabView.option.duration;
        } else {
            this.animator.duration = 500;
        }

        this._initBodies();
    },
    _initBodies: function() {
        var tabView,
            i, len;

        tabView = this.tabView;
        tabView._current = $(tabView.bodies[0]);
        for(i = 1, len = tabView.bodies.length; i < len; i++) {
            $(tabView.bodies[i]).css("display", "none");
        }
    },
    _setCurrent: function(view, index, animation) {
        var tabView,
            option,
            currentValue,
            cssValue;

        tabView = this.tabView;
        currentValue = 0;

        // 将正在进行的动画停下来
        if(this.animator.isStarted) {
            this.animator.stop();
            currentValue = parseFloat(tabView._current.css(this.animationCssItem));
            option = this.animator[1];
            if(option.target) {
                option.target.css("display", "none");
            }
        }

        if(this.currentIndex === index) {
            tabView._current.css(this.animationCssItem, 0);
            this.nextIndex = null;
            this.nextView = null;
            return;
        }

        if(tabView.fire("changing", index) === false) {
            return;
        }

        if(animation === false) {
            this.bodySet(index);
            tabView.fire("changed", index);
            return;
        }
        
        cssValue = tabView.isHorizontal ? tabView.bodyWidth : tabView.bodyHeight;
        if(currentValue === 0) {
            // 更新动画的方向
            this.animator.isNext = index > this.currentIndex;
        }
        this.nextIndex = index;
        this.nextView = view;
        if(this.animator.isNext) {
            this.nextView.css(this.animationCssItem, (cssValue + currentValue) + "px");
        } else {
            this.nextView.css(this.animationCssItem, (-cssValue + currentValue) + "px");
        }

        option = this.animator[0];
        option.target = tabView._current;
        option.begin = currentValue;
        if(this.animator.isNext) {
            option.end = -cssValue;
        } else {
            option.end = cssValue;
        }
        option = this.animator[1];
        option.target = this.nextView;
        option.begin = parseFloat(option.target.css(this.animationCssItem));
        option.end = 0;
        option.target.css("display", "block");

        this.animator.start();
    },
    bodySet: function(index) {
        var views,
            tabView;

        tabView = this.tabView;
        views = tabView.bodies;
        
        if(tabView._current) {
            tabView._current
                .removeClass(selectedClass)
                .css("display", "none");
        }
        this.currentIndex = index;
        tabView._current = $(views[index]);
        tabView._current.css({
            "display": "block",
            "top": "0",
            "left": "0"
        });
    },
    showIndex: function(index, animation) {
        var tabView,
            views;

        tabView = this.tabView;
        views = tabView.bodies;
        if(index >= 0 && index < views.length) {
            this._setCurrent($(views[index]), index, animation);
        }
    },
    putBodies: function(width, height) {
        // 无需处理
    },
    restore: function(animation) {
        // 无需处理
    }
};

// 标签模式
function Tab(tabView) {
    if(this instanceof Tab) {
        this.initialize(tabView);
    } else {
        return new Tab(tabView);
    }
}
Tab.prototype = {
    constructor: Tab,
    initialize: function(tabView) {
        var that;

        this.tabView = tabView;
        this.animator = ui.animator({
            target: tabView.bodyPanel,
            ease: ui.AnimationStyle.easeFromTo
        });
        if(ui.core.isNumber(tabView.option.duration)) {
            this.animator.duration = tabView.option.duration;
        } else {
            this.animator.duration = 800;
        }

        that = this;
        if(tabView.isHorizontal) {
            this.animator[0].onChange = function(val) {
                tabView.bodyPanel.scrollLeft(val);
            };
            this.bodyShow = function(index) {
                that.animator.stop();
                that.animator[0].begin = tabView.bodyPanel.scrollLeft();
                that.animator[0].end = index * tabView.bodyWidth;
                return that.animator.start();
            };
        } else {
            this.animator[0].onChange = function(val) {
                tabView.bodyPanel.scrollTop(val);
            };
            this.bodyShow = function(index) {
                that.animator.stop();
                that.animator[0].begin = tabView.bodyPanel.scrollTop();
                that.animator[0].end = index * tabView.bodyHeight;
                return that.animator.start();
            };
        }

        this._initTabs();
        this._initBodies();
    },
    _initTabs: function() {
        var that,
            tabView;
        
        tabView = this.tabView;
        if(!tabView.tabPanel || tabView.tabPanel.length === 0) {
            return;
        }

        tabView.tabs = tabView.tabPanel.find(".ui-tab-button");
        tabView.tabs.addClass("font-highlight-hover");

        that = this;
        tabView.tabPanel.click(function(e) {
            var elem = $(e.target);
            while(!elem.hasClass("ui-tab-button")) {
                if(elem[0] === tabView.tabPanel[0]) {
                    return;
                }
                elem = elem.parent();
            }
            that._setCurrent(elem);
        });
    },
    _initBodies: function() {
        // 暂时没有需要初始化的地方
    },
    _setCurrent: function(view, index, animation) {
        var tabView,
            result;

        tabView = this.tabView;
        if(tabView._current && tabView._current[0] === view[0]) {
            return;
        }

        if(!ui.core.isNumber(index)) {
            index = tabView.getViewIndex(view);
        }

        result = tabView.fire("changing", index);
        if(result === false) {
            return;
        }

        if(tabView._current && tabView.tabs) {
            tabView._current
                .removeClass(selectedClass)
                .removeClass("border-highlight")
                .removeClass("font-highlight");
        }

        tabView._current = view;
        tabView._current.addClass(selectedClass);
        if(tabView.tabs) {
            tabView._current
                .addClass("border-highlight")
                .addClass("font-highlight");
        }

        if(animation === false) {
            this.bodySet(index);
            tabView.fire("changed", index);
        } else {
            this.bodyShow(index).then(function() {
                tabView.fire("changed", index);
            });
        }
    },
    bodySet: function(index) {
        var tabView = this.tabView;
        if(tabView.isHorizontal) {
            tabView.bodyPanel.scrollLeft(tabView.bodyWidth * index);
        } else {
            tabView.bodyPanel.scrollTop(tabView.bodyHeight * index);
        }
    },
    showIndex: function(index, animation) {
        var tabView,
            views;

        tabView = this.tabView;
        views = tabView.tabs || tabView.bodies;
        if(index >= 0 && index < views.length) {
            this._setCurrent($(views[index]), index, animation);
        }
    },
    putBodies: function(width, height) {
        var tabView,
            value = 0,
            i, len, 
            elem;
        
        tabView = this.tabView;
        if(tabView.isHorizontal) {
            for(i = 0, len = tabView.bodies.length; i < len; i++) {
                elem = $(tabView.bodies[i]);
                elem.css("left", value + "px");
                value += width || 0;
            }
        } else {
            for(i = 0, len = tabView.bodies.length; i < len; i++) {
                elem = $(tabView.bodies[i]);
                elem.css("top", value + "px");
                value += height || 0;
            }
        }
    },
    restore: function(animation) {
        var index,
            tabView;
        tabView = this.tabView;
        if(tabView._current) {
            index = tabView.getViewIndex(tabView._current);
            if(animation === false) {
                this.bodySet(index);
            } else {
                this.bodyShow(index);
            }
        }
    }
};

ui.ctrls.define("ctrls.TabView", {
    _defineOption: function() {
        return {
            /*
                类型
                view: 视图模式，适合较小显示区域切换，适用于弹出层，侧滑面板
                tab: 标签模式，适合大面积显示区域切换
            */
            type: "tab",
            // 标签容器 id | dom | $(dom)
            tabPanel: null,
            // 视图容器 id | dom | $(dom)
            bodyPanel: null,
            // 视图集合
            bodies: null,
            // 切换方向 横向 horizontal | 纵向 vertical
            direction: "horizontal",
            // 切换速度
            duration: 800
        };
    },
    _defineEvents: function() {
        return ["changing", "changed"];
    },
    _create: function() {
        this.tabPanel = null;
        this.bodyPanel = null;
        if(this.option.tabPanel) {
            this.tabPanel = ui.getJQueryElement(this.option.tabPanel);
        }
        if(this.option.bodyPanel) {
            this.bodyPanel = ui.getJQueryElement(this.option.bodyPanel);
        }

        this.bodies = this.option.bodies;
        if (!this.bodies) {
            this.bodies = this.bodyPanel.children(".ui-tab-body");
        } else {
            if(!this.bodyPanel) {
                this.bodyPanel = this.bodies.parent();
            }
        }

        this.isHorizontal = this.option.direction !== "vertical";
    },
    _render: function() {
        if(this.option.type === "view") {
            this.model = View(this);
        } else {
            this.model = Tab(this);
        }
    },

    /// API
    /** 获取当前显示视图页的索引 */
    getCurrentIndex: function() {
        return this.getViewIndex(this._current);
    },
    /** 获取视图的索引 */
    getViewIndex: function(view) {
        var i, 
            len,
            tabs;

        tabs = this.tabs || this.bodies;
        view = view || this._current;
        if(tabs && view) {
            for(i = 0, len = tabs.length; i < len; i++) {
                if(tabs[i] === view[0]) {
                    return i;
                }
            }
        }
        return 0;
    },
    /** 根据索引显示视图 */
    showIndex: function(index, animation) {
        if(!ui.core.isNumber(index)) {
            index = 0;
        }
        if(animation !== false) {
            animation = true;
        }
        this.model.showIndex(index, animation);
    },
    /** 放置视图 */
    putBodies: function(width, height) {
        if(!ui.core.isNumber(width)) {
            width = this.bodyPanel.width();
        }
        if(!ui.core.isNumber(height)) {
            height = this.bodyPanel.height();
        }
        this.bodyWidth = width;
        this.bodyHeight = height;

        this.model.putBodies(width, height);
    },
    /** 还原 */
    restore: function() {
        this.model.restore();
    }
});

// 缓存数据，切换工具栏按钮
function TabManager(tabView, changingHandler, changedHandler) {
    if(this instanceof TabManager) {
        this.initialize(tabView, changingHandler, changedHandler);
    } else {
        return new TabManager(tabView, changingHandler, changedHandler);
    }
}
TabManager.prototype = {
    constructor: TabManager,
    initialize: function(tabView, changingHandler, changedHandler) {
        this.tabView = tabView;
        this.tabTools = [];
        this.tabLoadStates = [];
        
        if(!ui.core.isFunction(changedHandler)) {
            changedHandler = changingHandler;
            changingHandler = null;
        }
        if(!ui.core.isFunction(changingHandler)) {
            changingHandler = function(e, index) {
                this.showTools(index);
            };
        }

        if(this.tabView) {
            this.tabView.changing(changingHandler.bind(this));
            if(ui.core.isFunction(changedHandler)) {
                this.tabView.changed(changedHandler.bind(this));
            }
        }
    },
    addTools: function() {
        var i, len,
            elem, id, j;
        for (i = 0, len = arguments.length; i < len; i++) {
            id = arguments[i];
            if (ui.core.isString(id)) {
                elem = $("#" + id);
                if (elem.length === 0) {
                    elem = undefined;
                }
            } else if (Array.isArray(id)) {
                elem = [];
                for (j = 0; j < id.length; j++) {
                    elem.push($("#" + id[j]));
                    if (elem[elem.length - 1].length === 0) {
                        elem.pop();
                    }
                }
                if (elem.length === 1) {
                    elem = elem[0];
                }
            }
            this.tabTools.push(elem);
        }
    },
    showTools: function(index) {
        var i, len, j,
            elem, cssValue;
        for(i = 0, len = this.tabTools.length; i < len; i++) {
            elem = this.tabTools[i];
            if(!elem) {
                continue;
            }
            if (i === index) {
                cssValue = "block";
            } else {
                cssValue = "none";
            }
            if (Array.isArray(elem)) {
                for (j = 0; j < elem.length; j++) {
                    elem[j].css("display", cssValue);
                }
            } else {
                elem.css("display", cssValue);
            }
        }
    },
    callWithCache: function(index, fn, caller) {
        var args,
            i, len;
        if(!ui.core.isFunction(fn)) {
            return;
        }
        
        args = [];
        len = arguments.length;
        for(i = 3; i < len; i++) {
            args.push(arguments[i]);
        }
        if(!this.tabLoadStates[index]) {
            fn.apply(caller, args);
            this.tabLoadStates[index] = true;
        }
    },
    resetAt: function(index) {
        if(index < 0 || index >= this.tabLoadStates.length) {
            return;
        }
        this.tabLoadStates[index] = false;
    },
    reset: function() {
        var i, len;
        for(i = 0, len = this.tabLoadStates.length; i < len; i++) {
            this.tabLoadStates[i] = false;
        }
    }
};

ui.ctrls.TabView.TabManager = TabManager;


})(jQuery, ui);

// Source: src/control/view/tree-view.js

(function($, ui) {

/**
 * 树形列表
 */

ui.ctrls.define("ui.ctrls.TreeView", ui.ctrls.SelectionTree, {
    _render: function() {
        var position;

        this.treePanel = this.element;
        position = this.treePanel.css("position");
        
        this.treePanel
            .addClass("ui-selection-tree-panel")
            .addClass("ui-tree-view-panel")
            .css("position", position);
        this.treePanel.click(this.onTreeItemClickHandler);

        if (Array.isArray(this.option.viewData)) {
            this._fill(this.option.viewData);
        }
    }
});

$.fn.treeView = function(option) {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.TreeView(option, this);
};


})(jQuery, ui);

// Source: src/control/tools/confirm-button.js

(function($, ui) {
/* 确认按钮 */

function noop() {}
// 事件
function onButtonClick(e) {
    var checkHandler = this.option.checkHandler,
        that = this;

    if(this.disabled) {
        return;
    }

    clearTimeout(this.backTimeHandler);
    if(ui.core.isFunction(checkHandler)) {
        if(checkHandler.call(this) === false) {
            return;
        }
    }
    if(this.state === 0) {
        this._next();
        this.backTimeHandler = setTimeout(function() {
            that._back();
        }, this.option.backTime);
    } else if(this.state === 1) {
        this._next();
        this.option.handler.call(this);
    }
}

ui.ctrls.define("ui.ctrls.ConfirmButton", {
    _defineOption: function () {
        return {
            disabled: false,
            backTime: 3000,
            checkHandler: false,
            handler: false,
            /** 确认按钮文字颜色 */
            color: "#fff",
            /** 确认按钮背景颜色 */
            backgroundColor: "#990000"
        };
    },
    _create: function() {
        this.state = 0;
        if(ui.core.type(this.option.backTime) !== "number" || this.option.backTime <= 0) {
            this.option.backTime = 5000;
        }

        if(!ui.core.isFunction(this.option.handler)) {
            this.option.handler = noop;
        }

        this.option.disabled = !!this.option.disabled;

        // 事件处理函数
        this.onButtonClickHandler = $.proxy(onButtonClick, this);

        this.defineProperty("disabled", this.getDisabled, this.setDisabled);
        this.defineProperty("text", this.getText, this.setText);
    },
    _render: function() {
        var text,
            textState,
            confirmState;

        text = this.element.text().trim();
        textState = $("<span class='text-state' />");
        confirmState = $("<i class='confirm-state' />");
        
        textState.text(text);
        confirmState.text("确定");
        if(this.option.backgroundColor) {
            confirmState.css("background-color", this.option.backgroundColor);
        }
        if(this.option.color) {
            confirmState.css("color", this.option.color);
        }
        this.element.addClass("confirm-button");
        this.element.css("width", this.element.width() + "px");
        this.element
            .empty()
            .append(textState)
            .append(confirmState);
        this.element.click(this.onButtonClickHandler);
        
        this._initAnimation(textState, confirmState);
        
        this.disabled = this.option.disabled;
    },
    _initAnimation: function(textState, confirmState) {
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
    },
    _back: function() {
        var that,
            option;

        if(this.changeAnimator.isStarted) {
            return;
        }
        this.state = 0;

        option = this.changeAnimator[0];
        option.target.css("margin-left", "-200%");
        option.begin = -200;
        option.end = 0;
        option = this.changeAnimator[1];
        option.target.css("left", "0%");
        option.begin = 0;
        option.end = 100;
        
        this.changeAnimator.start();
    },
    _next: function(state) {
        var that,
            option;

        if(this.changeAnimator.isStarted) {
            return;
        }
        if(this.state === 0) {
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
        
        this.changeAnimator.start();
    },
    getDisabled: function() {
        return this.option.disabled;
    },
    setDisabled: function(value) {
        this.option.disabled = !!value;
        if(this.option.disabled) {
            this.element.attr("disabled", "disabled");
        } else {
            this.element.removeAttr("disabled");
        }
    },
    getText: function() {
        var span = this.element.children(".text-state");
        return span.text();
    },
    setText: function(value) {
        var span = this.element.children(".text-state");
        span.text(ui.str.trim(value + ""));
    }
});
$.fn.confirmClick = function(option) {
    if (!this || this.length === 0) {
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

// Source: src/control/tools/extend-button.js

(function($, ui) {
/* 扩展按钮 */
ui.ctrls.define("ui.ctrls.ExtendButton", {
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
        return ["showing", "shown", "hiding", "hidden"];
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
            this.centerIcon = $("<a class='center-icon closable-button font-highlight' style='font-size:24px !important;' title='关闭'>×</a>");
        } else if(this.option.centerIcon === "none") {
            this.centerIcon = $("<a class='center-icon center-none border-highlight' />");
            this.backgroundColorPanel = $("<div class='background-panel' />");
            this.buttonPanelBackground.append(this.backgroundColorPanel);
            this.buttonPanelBackground.append(this.centerIcon);
            this.buttonPanelBackground.css("background-color", "transparent");
        } else {
            this.centerIcon = $("<a class='center-icon' />");
            if(!ui.str.isEmpty(this.option.centerIcon)) {
                this.centerIcon.append(this.option.centerIcon);
            }
        }
        
        this._createAnimator();
    },
    _render: function() {
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
        
        this.element.click(function(e) {
            e.stopPropagation();
            that.show();
        });
        if(this.hasCloseButton) {
            this.centerIcon.click(function(e) {
                that.hide();
            });
        } else {
            ui.page.htmlclick(function(e) {
                that.hide();
            });
        }
        this.buttonPanel.click(function(e) {
            e.stopPropagation();
        });
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
    _getElementCenter: function() {
        var position = this.isBodyInside ? this.element.offset() : this.element.position();
        position.left = position.left + this.element.outerWidth() / 2;
        position.top = position.top + this.element.outerHeight()/ 2;
        return position;
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
        var center = this._getElementCenter();
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
        if(ui.str.isEmpty(button.title)) {
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
                that.buttonAnimator.start().then(function() {
                    that.fire("shown");
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
                that.buttonPanelAnimator.start().then(function() {
                    that.buttonPanel.css("display", "none");
                    that.fire("hidden");
                });
            }, 100);
        }
    }
});

$.fn.extendButton = function(option) {
    if (this.length === 0) {
        return null;
    }
    return ui.ctrls.ExtendButton(option, this);
};


})(jQuery, ui);

// Source: src/control/tools/filter-tool.js

(function($, ui) {
/* 内容过滤选择器 */
var prefix = "filter_tool",
    filterCount = 0;

function onItemClick (e) {
    var elem = $(e.target);
    var nodeName;
    while ((nodeName = elem.nodeName()) !== "LABEL") {
        if (nodeName === "DIV") {
            return;
        }
        elem = elem.parent();
    }
    this._selectItem(elem);
}

ui.ctrls.define("ui.ctrls.FilterTool", {
    _defineOption: function () {
        //data item is { text: "", value: "" }
        return {
            viewData: [],
            defaultIndex: 0,
            filterCss: null
        };
    },
    _defineEvents: function () {
        return ["selected", "deselected"];
    },
    _create: function () {
        var i, len, 
            item,
            viewData;

        this.filterPanel = $("<div class='filter-tools-panel'>");
        this.parent = this.element;
        this.radioName = prefix + "_" + (filterCount++);
        this._current = null;

        this.onItemClickHandler = $.proxy(onItemClick, this);

        viewData = this.getViewData();
        for (i = 0, len = viewData.length; i < len; i++) {
            item = viewData[i];
            if (item.selected === true) {
                this.option.defaultIndex = i;
            }
            this._createTool(item, i);
        }
        if (this.option.filterCss) {
            this.filterPanel.css(this.option.filterCss);
        }
        this.filterPanel.click(this.onItemClickHandler);
        this.parent.append(this.filterPanel);

        if (!ui.core.isNumber(this.option.defaultIndex) || this.option.defaultIndex >= len || this.option.defaultIndex < 0) {
            this.option.defaultIndex = 0;
        }
        this.setIndex(this.option.defaultIndex);
    },
    _createTool: function (item, index) {
        var label,
            radio,
            span;

        if (!ui.core.isPlainObject(item)) {
            return;
        }

        label = $("<label class='filter-tools-item' />");
        radio = $("<input type='radio' class='filter-tools-item-radio' name='" + this.radioName + "'/>");
        span = $("<span class='filter-tools-item-text' />");
        label.append(radio).append(span);

        label.attr("data-index", index);
        if (index === 0) {
            label.addClass("filter-tools-item-first");
        }
        label.addClass("font-highlight").addClass("border-highlight");

        radio.prop("value", item.value || "");
        span.text(item.text || "tool" + index);

        this.filterPanel.append(label);
    },
    _getSelectionData: function(elem) {
        var index = parseInt(elem.attr("data-index"), 10);
        return {
            itemIndex: index,
            itemData: this.getViewData()[index]
        };
    },
    _selectItem: function (label) {
        var eventData;
        if (this._current) {
            if (label[0] === this._current[0]) {
                return;
            }

            this._current
                .addClass("font-highlight")
                .removeClass("background-highlight");
            eventData = this._getSelectionData(this._current);
            this.fire("deselected", eventData);
        }

        this._current = label;
        label.find("input").prop("checked", true);
        this._current
            .addClass("background-highlight")
            .removeClass("font-highlight");

        eventData = this._getSelectionData(this._current);
        this.fire("selected", eventData);
    },
    _getIndexByValue: function(value) {
        var viewData,
            index, 
            i;

        viewData = this.getViewData();
        index = -1;
        for (i = viewData.length - 1; i >= 0; i--) {
            if (viewData[i].value === value) {
                index = i;
                break;
            }
        }
        return index;
    },
    _setDisplayIndex: function(index, isHide) {
        var viewData, 
            label;

        viewData = this.getViewData();
        if (viewData.length === 0) {
            return;
        }
        if (!ui.core.isNumber(index)) {
            index = 0;
        }
        if (index >= 0 && index < viewData.length) {
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
        var children,
            i, len,
            label,
            firstLabel;
        
        children = this.filterPanel.children();
        for(i, len = children.length; i < len; i++) {
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
    getViewData: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData : [];
    },
    getSelection: function () {
        if (this._current) {
            return this._getSelectionData(this._current);
        }
        return null;
    },
    setIndex: function (index) {
        var viewData,
            label;

        viewData = this.getViewData();
        if (viewData.length === 0) {
            return;
        }
        if (!$.isNumeric(index)) {
            index = 0;
        }
        if (index >= 0 && index < viewData.length) {
            label = $(this.filterPanel.children()[index]);
            this._selectItem(label);
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
    }
});
$.fn.filterTool = function (option) {
    if (this.length === 0) {
        return null;
    }
    return ui.ctrls.FilterTool(option, this);
};


})(jQuery, ui);

// Source: src/control/tools/hover-view.js

(function($, ui) {
/* 悬停视图 */
var guid = 1;
// 鼠标移动处理事件
function onDocumentMousemove (e) {
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
}


ui.ctrls.define("ui.ctrls.HoverView", {
    buffer: 30,
    _defineOption: function () {
        return {
            width: 160,
            height: 160
        };
    },
    _defineEvents: function () {
        return ["showing", "shown", "hiding", "hidden"];
    },
    _create: function () {
        this.viewPanel = $("<div class='hover-view-panel border-highlight' />");
        this.viewPanel.css({
            "width": this.option.width + "px",
            "max-height": this.option.height + "px"
        });
        $(document.body).append(this.viewPanel);

        this.width = this.viewPanel.outerWidth();
        this.height = this.viewPanel.outerHeight();

        this.target = null;
        this.targetWidth = null;
        this.targetHeight = null;

        this.hasDocMousemoveEvent = false;

        this.animating = false;
        this.isShow = false;

        if (!ui.core.isNumber(this.option.width) || this.option.width <= 0) {
            this.option.width = 160;
        }
        if (!ui.core.isNumber(this.option.height) || this.option.height <= 0) {
            this.option.height = 160;
        }

        this.onDocumentMousemoveHander = onDocumentMousemove.bind(this);
        this.onDocumentMousemoveHander.guid = "hoverView" + (guid++);
    },
    clear: function () {
        this.viewPanel.empty();
        return this;
    },
    append: function (elem) {
        this.viewPanel.append(elem);
        return this;
    },
    addDocMousemove: function () {
        if (this.hasDocMousemoveEvent) {
            return;
        }
        this.hasDocMousemoveEvent = true;
        $(document).on("mousemove", this.onDocumentMousemoveHander);
    },
    removeDocMousemove: function () {
        if (!this.hasDocMousemoveEvent) {
            return;
        }
        this.hasDocMousemoveEvent = false;
        $(document).off("mousemove", this.onDocumentMousemoveHander);
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
                css["filter"] = "Alpha(opacity=100)";
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
            view.fire("shown");
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
            view.fire("hidden");
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

// Source: src/control/tools/slidebar.js

(function($, ui) {
// Slidebar

function prepareMove(arg) {
    var option = arg.option,
        lengthValue;
    if(this.isHorizontal()) {
        lengthValue = this.track.width();
    } else {
        lengthValue = this.track.height();
    }
    option.lengthValue = lengthValue;
}
function moving(arg) {
    var option = arg.option,
        location,
        extend,
        result;

    extend = this.thumb.width() / 2;
    if(this.isHorizontal()) {
        moveHorizontal.call(this, arg.x, extend, option.lengthValue);
    } else {
        moveVertical.call(this, arg.y, extend, option.lengthValue);
    }
}
function moveHorizontal(changeVal, extend, lengthValue) {
    var percent,
        location;

    location = parseFloat(this.thumb.css("left")) || 0;
    location += changeVal;
    percent = calculatePercent.call(this, location + extend, 0, lengthValue);
    
    if(this.percent !== percent) {
        this.percent = percent;
        this.valuebar.css("width", this.percent + "%");
        this.thumb.css("left", (lengthValue * (this.percent / 100) - extend) + "px");

        this.fire("changed", percent);
    }
}
function moveVertical(changeVal, extend, lengthValue) {
    var percent,
        location;

    location = parseFloat(this.thumb.css("top")) || 0;
    location += changeVal;
    percent = calculatePercent.call(this, location + extend, 0, lengthValue);

    if(this.percent !== percent) {
        this.percent = 100 - percent;
        this.valuebar.css({
            "top": percent + "%",
            "height": this.percent + "%"
        });
        this.thumb.css("top", (lengthValue * (percent / 100) - extend) + "px");

        this.fire("changed", percent);
    }
}
function calculatePercent(location, min, max) {
    var percent;
    if(location > max) {
        percent = 100;
    } else if(location < min) {
        percent = 0;
    } else {
        percent = ui.fixedNumber((location / max) * 100, 2);
    }
    return percent;
}

ui.ctrls.define("ui.ctrls.Slidebar", {
    _defineOption: function() {
        return {
            // 方向 横向 horizontal | 纵向 vertical
            direction: "horizontal",
            // 界面中是否需要屏蔽iframe
            iframeShield: false,
            // 滑动条的粗细
            thickness: 8,
            // 是否是只读的 默认false
            readonly: false,
            // 是否是禁用的 默认false
            disabled: false
        };
    },
    _defineEvents: function() {
        return ["changed"];
    },
    _create: function() {
        var position;
        this.percent = 0;
        
        position = this.element.css("position");
        if(position !== "absolute" && position !== "relative" && position !== "fixed") {
            this.element.css("position", "relative");
        }
        this.element.addClass("ui-slidebar");
        
        this.defineProperty("readonly", this.getReadonly, this.setReadonly);
        this.defineProperty("disabled", this.getDisabled, this.setDisabled);
        this.defineProperty("percentValue", this.getPercent, this.setPercent);
    },
    _render: function() {
        this.track = $("<div class='ui-slidebar-track' />");
        this.valuebar = $("<div class='ui-slidebar-value' />");
        this.thumb = $("<b class='ui-slidebar-thumb' />");

        this.track.append(this.valuebar);
        this.element.append(this.track).append(this.thumb);

        this._initScale();
        this._initMouseDragger();

        this.readonly = this.option.readonly;
        this.disabled = this.option.disabled;
    },
    _initScale: function() {
        var thickness = this.option.thickness,
            size = thickness * 2;

        this.thumb.css({
            "width": size + "px",
            "height": size + "px"
        });

        if(this.isHorizontal()) {
            this.track.css({
                "width": "100%",
                "height": thickness + "px",
                "top": (size - thickness) / 2 + "px"
            });
            this.valuebar.css("width", "0");
            this.thumb.css("left", -(size / 2) + "px");
            this.element.css("height", size + "px");
        } else {
            this.track.css({
                "width": thickness + "px",
                "height": "100%",
                "left": (size - thickness) / 2 + "px"
            });
            this.valuebar.css({
                "top": "100%",
                "height": "0"
            });
            this.thumb.css("top", this.track.height() - (size / 2) + "px");
            this.element.css("width", size + "px");
        }
    },
    _initMouseDragger: function() {
        var option = {
            target: this.thumb,
            handle: this.thumb,
            context: this,
            onBeginDrag: function(arg) {
                var option = arg.option,
                    context = option.context;
                prepareMove.call(context, arg);
            },
            onMoving: function(arg) {
                var option = arg.option,
                    context = option.context;
                moving.call(context, arg); 
            }
        };
        this.mouseDragger = new ui.MouseDragger(option);
    },

    // API
    isHorizontal: function() {
        return this.option.direction === "horizontal";
    },
    getReadonly: function() {
        return this.option.readonly;
    },
    setReadonly: function(value) {
        this.option.readonly = !!value;
        if(this.option.readonly) {
            this.mouseDragger.off();
            this.valuebar.removeClass("background-highlight");
            this.thumb.removeClass("background-highlight");
        } else {
            this.mouseDragger.on();
            this.valuebar.addClass("background-highlight");
            this.thumb.addClass("background-highlight");
        }
    },
    /** 获取禁用状态 */
    getDisabled: function() {
        return this.option.disabled;
    },
    /** 设置禁用状态 */
    setDisabled: function(value) {
        this.option.disabled = !!value;
        if(this.option.disabled) {
            this.mouseDragger.off();
            this.valuebar.removeClass("background-highlight");
            this.thumb.removeClass("background-highlight");
        } else {
            this.mouseDragger.on();
            this.valuebar.addClass("background-highlight");
            this.thumb.addClass("background-highlight");
        }
    },
    /** 获取值 */
    getPercent: function() {
        return this.percent;
    },
    /** 设置值 */
    setPercent: function(value) {
        var extend,
            percent,
            arg = {
                option: {}
            };
        percent = value;
        extend = this.thumb.width() / 2;
        if(ui.core.isNumber(percent)) {
            if(percent < 0) {
                percent = 0;
            } else if(percent > 100) {
                percent = 100;
            }
            if(this.isHorizontal()) {
                arg.option.lengthValue = this.track.width();
                arg.x = arg.option.lengthValue * percent / 100;
            } else {
                arg.option.lengthValue = this.track.height();
                arg.y = arg.option.lengthValue * (0 - percent) / 100;
            }
            moving.call(this, arg);
        }
    }
});

$.fn.slidebar = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Slidebar(option, this);
};


})(jQuery, ui);

// Source: src/control/tools/switch-button.js

(function($, ui) {
/* 开关按钮 */

var normalStyle,
    lollipopStyle,
    marshmallowStyle;

normalStyle = {
    open: function() {
        var option;

        this.animator.stop();
        this.switchBox.addClass("switch-open");
        this.inner
            .addClass("border-highlight")
            .addClass("background-highlight");
        
        option = this.animator[0];
        option.beginColor = this.option.thumbColor;
        option.endColor = "#FFFFFF";
        option.begin = 0;
        option.end = 100;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = this.width - this.thumbSize - 4;
        this.animator.start();
    },
    close: function() {
        var option;
        
        this.animator.stop();
        this.switchBox.removeClass("switch-open");
        this.inner
            .removeClass("border-highlight")
            .removeClass("background-highlight");
        
        option = this.animator[0];
        option.beginColor = "#FFFFFF";
        option.endColor = this.option.thumbColor;
        option.begin = 0;
        option.end = 100;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = 4;
        
        this.animator.start();
    },
    thumbSize: 16
};

lollipopStyle = {
    init: function() {
        this.switchBox.addClass("switch-lollipop");
    },
    open: function() {
        var option;
        
        this.animator.stop();
        this.switchBox.addClass("switch-open");
        this.inner.addClass("background-highlight");
        this.thumb
            .addClass("border-highlight")
            .addClass("background-highlight");
        
        option = this.animator[0];
        option.begin = 0;
        option.end = 0;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = this.option.width - this.thumbSize;

        this.animator.start();
    },
    close: function() {
        var option;
        
        this.animator.stop();
        this.switchBox.removeClass("switch-open");
        this.inner.removeClass("background-highlight");
        this.thumb
            .removeClass("border-highlight")
            .removeClass("background-highlight");
        
        option = this.animator[0];
        option.begin = 0;
        option.end = 0;
        
        option = this.animator[1];
        option.begin = parseFloat(option.target.css("left"));
        option.end = 0;
        
        this.animator.start();
    },
    thumbSize: 24
};

marshmallowStyle = {
    init: function() {
        this.switchBox.addClass("switch-marshmallow");
    },
    open: lollipopStyle.open,
    close: lollipopStyle.close,
    thumbSize: 24
};

ui.ctrls.define("ui.ctrls.SwitchButton", {
    _defineOption: function() {
        return {
            width: 44,
            height: 24,
            thumbColor: null,
            readonly: false,
            style: null
        };
    },
    _defineEvents: function() {
        return ["changed"];
    },
    _create: function() {
        var that,
            style;
        
        this.switchBox = $("<label class='ui-switch-button' />");
        this.inner = $("<div class='switch-inner' />");
        this.thumb = $("<div class='switch-thumb' />");
        
        if(ui.core.isString(this.option.style)) {
            if(this.option.style === "lollipop") {
                style = lollipopStyle;
            } else if(this.option.style === "marshmallow") {
                style = marshmallowStyle;
            } else {
                style = normalStyle;
            }
        } else if(ui.core.isObject(this.option.style)) {
            style = this.option.style;
        } else {
            style = normalStyle;
        }

        if(ui.core.isFunction(style.init)) {
            style.init.call(this);
        }
        this._open = style.open;
        this._close = style.close;
        this.thumbSize = style.thumbSize;

        this._createAnimator();
        
        this.element.wrap(this.switchBox);
        this.switchBox = this.element.parent();
        this.switchBox
            .append(this.inner)
            .append(this.thumb);

        if(this.option.thumbColor) {
            this.thumb.css("background-color", this.option.thumbColor);
        } else {
            this.option.thumbColor = this.thumb.css("background-color");
        }
        
        this.width = this.option.width || parseFloat(this.switchBox.css("width"));
        this.height = this.option.height || parseFloat(this.switchBox.css("height"));
        
        that = this;
        this.element.change(function(e) {
            that.onChange();
        });

        this.defineProperty("readonly", this.getReadonly, this.setReadonly);
        this.defineProperty("value", this.getValue, this.setValue);
        this.defineProperty("checked", this.getChecked, this.setChecked);
        
        this.readonly = !!this.option.readonly;
        if(this.checked) {
            this._open();
        }
    },
    _createAnimator: function() {
        this.animator = ui.animator({
            target: this.thumb,
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                var color = ui.color.overlay(this.beginColor, this.endColor, val / 100);
                color = ui.color.rgb2hex(color.red, color.green, color.blue);
                this.target.css("background-color", color);
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
        if(this.readonly) {
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
    _isOpen: function() {
        return this.switchBox.hasClass("switch-open");  
    },

    getReadonly: function() {
        return !!this.option.readonly;
    },
    setReadonly: function(value) {
        this.option.readonly = !!value;
        if(this.option.readonly) {
            this.element.attr("readonly", "readonly");
        } else {
            this.element.removeAttr("readonly");
        }
    },
    getValue: function() {
        return this.element.val();
    },
    setValue: function(value) {
        this.element.val(value);
    },
    getChecked: function() {
        return this.element.prop("checked");
    },
    setChecked: function(value) {
        var checked = this.element.prop("checked");
        if((!!arguments[0]) !== checked) {
            this.element.prop("checked", arguments[0]);
            this.onChange();
        } else {
            //修正checkbox和当前样式不一致的状态，可能是手动给checkbox赋值或者是reset导致
            if(checked && !this._isOpen()) {
                this._open();
            } else if(!checked && this._isOpen()) {
                this._close();
            }
        }
    }
});
$.fn.switchButton = function(option) {
    if (this.length === 0) {
        return null;
    }
    if(this.nodeName() !== "INPUT" && this.prop("type") !== "checkbox") {
        throw new TypeError("the element is not checkbox");
    }
    return ui.ctrls.SwitchButton(option, this);
};


})(jQuery, ui);

// Source: src/control/tools/uploader.js

(function($, ui) {
// uploader
/**
 * HTML上传工具，提供ajax和iframe两种机制，自动根据当前浏览器特性进行切换
 * 这个工具需要配合后台接口完成，可以接入自定义的后台
 */

// 用于生成Id
var counter = 0,
    global = ui.core.global(),
    fouceText,
    getChunk,
    initUploader;

function noop() {}

function getErrorMessage(status) {
    if(status === 400) {
        return "上传文件请求格式错误";
    } else if(status === 401) {
        return "需要登录以后才能上传文件";
    } else if(status === 403) {
        return "您没有上传文件的权限，请联系管理员";
    } else if(status === 404) {
        return "上传地址不存在，请联系管理员";
    } else {
        return "上传文件发生错误";
    }
}

if(global.FormData) {
    initUploader = function() {
        var that = this;

        function doUpload(fileName, index, file, total, fileId) {
            var isEnd, end, chunk,
                xhr, context;
    
            that.percent = Math.floor(index / total * 1000) / 10;
            that.fire("progressing", that.percent);
    
            isEnd = false;
    
            if(getChunk === noop) {
                isEnd = true;
                end = total;
                chunk = file;
            } else {
                end = index + that.chunkSize;
                chunk = null;
                if (end >= total) {
                    end = total;
                    isEnd = true;
                }
                chunk = getChunk.call(file, index, end);
            }
            context = {
                fileInfo: {
                    isEnd: isEnd,
                    isAbort: that.isAbort,
                    fileName: fileName,
                    index: index,
                    end: end,
                    total: total,
                    fileId: fileId || ""
                },
                file: file
            };
    
            ui.upload(
                that.option.url,
                chunk,
                context.fileInfo,
                function(ajaxResult) {
                    successHandler(ajaxResult.data, ajaxResult.ajaxRequest, context);
                },
                function(ajaxError) {
                    var status,
                        errorMessage;
                    status = ajaxError.ajaxRequest.status;
                    errorMessage = getErrorMessage(status);
                    that.fire();
                },
                "json"
            );
        }

        function successHandler(data, ajaxRequest, context) {
            var errorMessage,
                fileInfo,
                json = ajaxRequest.getResponseHeader("X-Responded-JSON");
            if(!ui.str.isEmpty(json)) {
                try {
                    json = JSON.parse(json);
                    errorMessage = getErrorMessage(json.status);
                } catch(e) {
                    json = null;
                    errorMessage = getErrorMessage();
                }
                return;
            }

            if (context.isEnd) {
                that.percent = 100.0;
                that.fire("progressing", that.percent);
                that.fire("uploaded", data);
            } else {
                fileInfo = context.fileInfo;
                if(fileInfo.isAbort) {
                    this.fire("uploaded", fileInfo);
                } else {
                    fileInfo.fileId = data.fileId;
                    doUpload(fileInfo.fileName, fileInfo.end, fileInfo.file, fileInfo.total, fileInfo.fileId);
                }
            }
        }

        this._upload = function() {
            var files, file,
                fileName, index, total,
                i, key, sliceNames;
        
            files = this._inputFile[0].files;
            file = files[0];
            if (!files || files.length === 0) {
                return;
            }

            fileName = file.fileName || file.name;
            index = 0;
            total = file.size;

            if(!getChunk) {
                sliceNames = ["slice", "webkitSlice", "mozSlice"];
                for(i = 0; i < sliceNames.length; i++) {
                    key = sliceNames[i];
                    if(key in file) {
                        getChunk = function(index, end) {
                            return this[key](index, end);
                        };
                        break;
                    }
                }
                if(!getChunk) {
                    getChunk = noop;
                }
            }

            doUpload(fileName, index, file, total);
        };
    };
} else {
    // 浏览器不支持FormData，用iFrame实现无刷新上传
    initUploader = function() {
        var div = $("<div class='ui-uploader-panel' />"),
            iframeId = "uploadFrameId_" + this._uploaderId;

        this._iframe = $("<iframe class='form-upload-iframe' />");
        this._iframe.prop("id", iframeId);
        this._iframe.prop("name", iframeId);

        this._form = $("<form />");
        this._form.attr("method", "post");
        this._form.attr("action", this.option.url);
        this._form.attr("enctype", "multipart/form-data");
        this._form.attr("target", iframeId);

        this._form.append(this._inputFile);

        div.append(this._iframe);
        div.append(this._form);
        $(document.body).append(div);

        this._iframe[0].onload = (function () {
            var contentWindow,
                fileInfo,
                errorMsg;

            this.percent = 100.0;
            this.fire("progressing", this.percent);
    
            contentWindow = this._iframe[0].contentWindow;
            fileInfo = contentWindow.fileInfo;
            errorMsg = contentWindow.error;
            if (!fileInfo && !errorMsg) {
                this.fire("error", getErrorMessage());
                return;
            }
            if (errorMsg) {
                errorMsg = error.errorMessage || getErrorMessage();
                this.fire("error", errorMsg);
            } else {
                this.fire("uploaded", fileInfo);
            }
        }).bind(this);

        if(!fouceText) {
            fouceText = $("<input type='text' value='' style='position:absolute;left:-99px;top:-1px;width:0;height:0;' />");
            (document.body || document.documentElement).insertBefore(fouceText[0], null);
        }
        this._upload = function() {
            // 为了让视觉效果好一点，直接从20%起跳
            this.percent = 20.0;
            this.fire("progressing", this.percent);
            
            this._form.submit();
            fouceText.focus();
        };
    };
}

function onInputFileChange(e) {
    this._reset();
    this.fire("selected", this._inputFile[0]);
    if(this.option.autoUpload) {
        this.upload();
    }
}

ui.ctrls.define("ui.ctrls.Uploader", {
    _defineOption: function() {
        return {
            // 上传文件服务的路径
            url: null,
            // 用户选择文件后是否自动上传
            autoUpload: true,
            // 上传文件分块大小，默认为512k，降级时无效
            chunkSize: 512,
            // 文件过滤器，默认可以上传所有文件。例：*.txt|*.docx|*.xlsx|*.pptx
            filter: "*.*"
        };
    },
    _defineEvents: function() {
        return ["selected", "uploading", "uploaded", "progressing", "error"];
    },
    _create: function() {
        this._uploaderId = ++counter;
        this._form = null;
        this._inputFile = null;

        // upload file size
        this.chunkSize = this.option.chunkSize * 1024 || 512 * 1024;

        // 初始化事件处理函数
        this.onInputFileChangeHandler = onInputFileChange.bind(this);

        this._reset();
    },
    _render: function() {
        this._initUploadButton();
        initUploader.call(this);
    },
    _initUploadButton: function() {
        var inputFileId = "inputFile_" + this._uploaderId;

        if(!this.element) {
            this.element = $("<label />");
        }
        if(this.element.nodeName() !== "LABEL") {
            throw TypeError("the element must be label element");
        }

        this.element.addClass("ui-uploader-button");
        this.element.prop("for", inputFileId);

        this._inputFile = $("<input type='file' class='ui-uploader-input-file' value='' />");
        this._inputFile.prop("id", inputFileId);
        this._inputFile.prop("name", this._uploaderId);
        this._inputFile.change(this.onInputFileChangeHandler);

        this.element.append(this._inputFile);
    },
    _reset: function() {
        this.filePath = null;
        this.extension = null;
        this.fileName = null;
        this.percent = 0.0;
        // 是否取消
        this.isAbort = false;
    },

    /// API
    /**
     * @public
     * 检查文件类型是否符合要求
     * @param path{String} 选择文件的路径
     */
    checkFile: function(path) {
        var index = path.lastIndexOf(".");
        if (index === -1) {
            return false;
        }
        this.fileName = path.substring(path.lastIndexOf("\\") + 1, index);
        this.extension = path.substring(index).toLowerCase().trim();

        if (this.option.filter === "*.*") {
            return true;
        }
        
        return this.option.filter.indexOf(this.extension) !== -1;
    },
    /**
     * @public
     * 开始上传
     */
    upload: function() {
        var path = this._inputFile.val();
        if (path.length === 0) {
            this.fire("error", "没有选择要上传的文件");
            return;
        }
        if (!this.checkFile(path)) {
            this.fire("error", "不支持上传当前选择的文件格式");
            return;
        }

        if(!this.option.url) {
            throw new TypeError("the upload url is null.");
        }

        if(this.fire("uploading", path) === false) {
            return;
        }
        this._upload();
        
        this._inputFile.val("");
    },
    /**
     * @public
     * 取消上传
     */
    abort: function() {
        this.isAbort = true;
    }
});

$.fn.uploader = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Uploader(option, this);
};


})(jQuery, ui);

// Source: src/control/images/image-preview.js

(function($, ui) {
//图片预览视图

function onChooserItemClick(e) {
    var elem = $(e.target),
        nodeName = elem.nodeName(),
        index;
    if(elem.hasClass("chooser-queue")) {
        return;
    }
    if(nodeName === "IMG") {
        elem = elem.parent();
    }
    index = parseInt(elem.attr("data-index"), 10);
    if(this.fire("changing", index) === false) {
        return;
    }
    if(this.selectItem(index) === false) {
        return;
    }
    this.imageViewer.showImage(index);
}

ui.ctrls.define("ui.ctrls.ImagePreview", {
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
        
        if(this.viewer.length === 0) {
            throw new TypeError("需要设置一个class为image-view-panel的元素");
        }
        if(this.chooser.length === 0) {
            throw new TypeError("需要设置一个class为image-preview-chooser的元素");
        }
        
        this.isHorizontal = this.option.direction === "horizontal";
        if(!ui.core.type(this.option.chooserButtonSize) || this.option.chooserButtonSize < 2) {
            this.option.chooserButtonSize = 16;
        }
        this.item = [];

        this._onChooserItemClickHandler = onChooserItemClick.bind(this);
    },
    _render: function () {
        var buttonSize,
            showCss,
            that;
        
        this.chooserQueue = $("<div class='chooser-queue' />");
        this.chooserPrev = $("<a href='javascript:void(0)' class='chooser-button font-highlight-hover'></a>");
        this.chooserNext = $("<a href='javascript:void(0)' class='chooser-button font-highlight-hover'></a>");
        this.chooser.append(this.chooserPrev)
            .append(this.chooserQueue)
            .append(this.chooserNext);
        
        that = this;
        this.chooserPrev.click(function(e) {
            that.beforeItems();
        });
        this.chooserNext.click(function(e) {
            that.afterItems();
        });
        
        this.chooserAnimator = ui.animator({
            target: this.chooserQueue,
            ease: ui.AnimationStyle.easeFromTo
        });
        
        buttonSize = this.option.chooserButtonSize;
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
        this.chooserQueue.click(this._onChooserItemClickHandler);
        
        this.setImages(this.option.images);
    },
    _initImages: function(images) {
        var width, 
            height,
            marginValue, 
            i, len, image,
            item, img,
            css;

        marginValue = 0;
        height = this.smallImageSize - 4;
        width = height;

        this.imageSource = images;
        for(i = 0, len = images.length; i < len; i++) {
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
    _getImageDisplay: function(width, height, originalWidth, originalHeight) {
        var context = {
            width: width,
            height: height,
            originalWidth: originalWidth,
            originalHeight: originalHeight
        };
        ui.ImageLoader.centerCrop.call(context);
        
        return {
            "width": context.displayWidth + "px",
            "height": context.displayHeight + "px",
            "top": context.marginTop + "px",
            "left": context.marginLeft + "px"
        };

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
    clear: function() {
        this.items = [];
        this.chooserQueue.empty();
        
        if(this.imageViewer) {
            this.imageViewer.clear();
        }
    },
    setImages: function(images) {
        var that;
        if(!Array.isArray(images) || images.length === 0) {
            return;
        }
        this.clear();
        
        this.option.images = images;
        if(!this.imageViewer) {
            this.imageViewer = this.viewer.imageViewer(this.option);
            that = this;
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
                beforeCount = Math.floor(count / 2),
                scrollCount = index - beforeCount;
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
        var option;
        if(isNaN(scrollValue.to)) {
            return;
        }
        this.chooserAnimator.stop();
        option = this.chooserAnimator[0];
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
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.ImagePreview(option, this);
};


})(jQuery, ui);

// Source: src/control/images/image-viewer.js

(function($, ui) {
//图片轮播视图
ui.ctrls.define("ui.ctrls.ImageViewer", {
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
        if(!ui.core.isNumber(this.option.interval) || this.option.interval <= 0) {
            this.isAutoView = false;
        } else {
            this.isAutoView = true;
        }
        this.stopAutoView = false;
        this.currentIndex = -1;
        this.images = [];
        
        this.isHorizontal = this.option.direction === "horizontal";
        this.animationCssItem = this.isHorizontal ? "left" : "top";
    },
    _render: function () {
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
        if(arguments.length === 0) {
            return;
        }
        this.clear();
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
        if(images.length === 0) {
            return;
        }
        
        if(this.option.hasSwitchButtom === true) {
            this.prevBtn = $("<a href='javascript:void(0)' class='image-switch-button switch-button-prev font-highlight-hover'><i class='fa fa-angle-left'></i></a>");
            this.nextBtn = $("<a href='javascript:void(0)' class='image-switch-button switch-button-next font-highlight-hover'><i class='fa fa-angle-right'></i></a>");
            this.prevBtn.click((function(e) {
                this.prev();
            }).bind(this));
            this.nextBtn.click((function(e) {
                this.next();
            }).bind(this));
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
        Promise.all(promises).then(function(result) {
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
        if(ui.core.type(src) !== "string" || src.length === 0) {
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
        option.begin = parseFloat(option.target.css(this.animationCssItem));
        if(isNext) {
            option.end = -cssValue;
        } else {
            option.end = cssValue;
        }
        option = this.viewAnimator[1];
        option.target = this.nextView;
        option.begin = parseFloat(option.target.css(this.animationCssItem));
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
        if(this.images.length === 0) {
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
    clear: function() {
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
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.ImageViewer(option, this);
};


})(jQuery, ui);

// Source: src/control/images/image-watcher.js

(function($, ui) {
//图片局部放大查看器
ui.ctrls.define("ui.ctrls.ImageWatcher", {
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
    },
    _render: function() {
        this._initImage();
        this._initZoomer();
    },
    _initImage: function() {
        this.image = $(this.element.children("img")[0]);
        if(this.image.length === 0) {
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
        if(!ui.core.isNumber(this.option.zoomHeight)) {
            this.zoomHeight = this.element.height();
        }
        if(!ui.core.isNumber(this.option.zoomWidth)) {
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
        var top, left;
        if(this.focusView.css("display") === "none") {
            this.zoomView.css("display", "none");
            return;
        }
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
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.ImageWatcher(option, this);
};


})(jQuery, ui);

// Source: src/control/images/image-zoomer.js

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
        var reimg = new Image(),
            size = {
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
ui.ctrls.define("ui.ctrls.ImageZoomer", {
    _defineOption: function () {
        return {
            parentContent: $(document.body),
            getNext: null,
            getPrev: null,
            hasNext: null,
            hasPrev: null,
            getLargeImageSrc: null
        };
    },
    _defineEvents: function () {
        return ["hided"];
    },
    _create: function () {
        var that;

        this.parentContent = this.option.parentContent;
        this.closeButton = null;
        this.mask = null;
        this.width = null;
        this.height = null;

        this.target = null;
        this.targetTop = null;
        this.targetLeft = null;

        if($.isFunction(this.option.getLargeImageSrc)) {
            this._getLargeImageSrc = this.option.getLargeImageSrc;
        } else {
            this._getLargeImageSrc = getLargeImageSrc;
        }

        that = this;
        ["getNext", "getPrev", "hasNext", "hasPrev"].forEach(function(key) {
            var fn = that.option[key];
            if(ui.core.isFunction(fn)) {
                that.option[key] = fn.bind(that);
            } else {
                that.option[key] = null;
            }
        });
    },
    _render: function () {
        var that = this;
        
        this.imagePanel = $("<div class='show-image-panel' />");
        this.currentView = $("<div class='image-view-panel' style='display:none;' />");
        this.nextView = $("<div class='image-view-panel' style='display:none;' />");
        this.currentView.append("<img class='image-view-img' />");
        this.nextView.append("<img class='image-view-img' />");
        this.closeButton = $("<a class='closable-button font-highlight-hover' href='javascript:void(0)'>×</a>");
        
        this.closeButton.click(function () {
            that.hide();
        });
        
        this.imagePanel
            .append(this.currentView)
            .append(this.nextView)
            .append(this.closeButton);
        if(this.option.getNext) {
            this.nextButton = $("<a class='next-button font-highlight-hover disabled-button' style='right:10px;' href='javascript:void(0)'><i class='fa fa-angle-right'></i></a>");
            this.nextButton.click(function(e) {
                that._doNextView();
            });
            this.imagePanel.append(this.nextButton);
        }
        if(this.option.getPrev) {
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
        if(this.option.hasNext) {
            if(this.option.hasNext()) {
                this.nextButton.removeClass("disabled-button");
            } else {
                this.nextButton.addClass("disabled-button");
            }
        }
        if(this.option.hasPrev) {
            if(this.option.hasPrev()) {
                this.prevButton.removeClass("disabled-button");
            } else {
                this.prevButton.addClass("disabled-button");
            }
        }
    },
    show: function (target) {
        var img,
            that,
            left, top;

        this.target = target;
        var content = this._setImageSize();
        if (!content) {
            return;
        }
        
        img = this.currentView.children("img");
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
        left = (content.parentW - this.width) / 2;
        top = (content.parentH - this.height) / 2;
        
        that = this;
        ui.mask.open({
            opacity: 0.8
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
        var nextImg;
        if(this.changeViewAnimator.isStarted) {
            return;
        }
        nextImg = this.option.getNext();
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
        prevImg = this.option.getPrev();
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
        var temp,
            largeSrc,
            content,
            img,
            option,
            that;

        temp = this.currentView;
        this.currentView = this.nextView;
        this.nextView = temp;
        
        largeSrc = this._getLargeImageSrc(this.target);
        content = this._setImageSize();
        if (!content) {
            return;
        }
        img = this.currentView.children("img");
        img.prop("src", largeSrc);
        img.css({
            "left": (content.parentW - this.width) / 2 + "px",
            "top": (content.parentH - this.height) / 2 + "px",
            "width": this.width + "px",
            "height": this.height + "px"
        });
        this.currentView.css("display", "block");
        this.currentView.css("left", (-changeValue) + "px");
        
        option = this.changeViewAnimator[0];
        option.target = this.nextView;
        option.begin = 0;
        option.end = changeValue;
        
        option = this.changeViewAnimator[1];
        option.target = this.currentView;
        option.begin = -changeValue;
        option.end = 0;
        
        that = this;
        this.changeViewAnimator.start().then(function() {
            that.nextView.css("display", "none");
        });
        
    },
    resizeZoomImage: function () {
        var content,
            left,
            top,
            img;

        content = this._setImageSize();
        if (!content) {
            return;
        }
        left = (content.parentW - this.width) / 2;
        top = (content.parentH - this.height) / 2;
        
        this.imagePanel.css({
            "width": content.parentW + "px",
            "height": content.parentH + "px",
        });

        img = this.currentView.children("img");
        img.css({
            "left": left + "px",
            "top": top + "px",
            "width": this.width + "px",
            "height": this.height + "px"
        });
    },
    _getActualSize: function (img) {
        var largeSize = img.data("LargeSize"),
            mem, w, h;
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
        var img,
            size,
            parentW, parentH,
            imageW, imageH,
            location, parentLocation;

        if (!this.currentView) {
            return;
        }
        if (!this.target) {
            return;
        }
        
        img = this.currentView.children("img");
        img.stop();
        
        size = this._getActualSize(this.target);

        parentH = this.parentContent.height();
        parentW = this.parentContent.width();
        imageW = size.width;
        imageH = size.height;
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
        location = this.target.offset();
        parentLocation = this.parentContent.offset();
        this.targetTop = location.top - parentLocation.top;
        this.targetLeft = location.left - parentLocation.left;

        return {
            parentW: parentW,
            parentH: parentH,
            parentLoc: parentLocation
        };
    }
});

$.fn.addImageZoomer = function (zoomer) {
    if (this.length === 0) {
        return;
    }
    if (zoomer instanceof ui.ctrls.ImageZoomer) {
        this.click(function(e) {
            var target = $(e.target);
            var largeSize = target.data("LargeSize");
            if(largeSize) {
                zoomer.show(target);
            } else {
                loadImageSize(zoomer._getLargeImageSrc(target))
                    .then(
                        //success
                        function(size) {
                            target.data("LargeSize", size);
                            zoomer.show(target);
                        },
                        //failed
                        function(size) {
                            zoomer.show(target);
                        }
                    );
            }
        });
    }
};


})(jQuery, ui);
