// util

/**
 * 修复javascript中四舍五入方法的bug
 */ 
ui.fixedNumber = function (number, precision) {
    var b = 1;
    if (isNaN(number)) return number;
    if (number < 0) b = -1;
    if (isNaN(precision)) precision = 0;
    var multiplier = Math.pow(10, precision);
    return Math.round(Math.abs(number) * multiplier) / multiplier * b;
};

//获取浏览器滚动条的宽度
ui.scrollbarHeight = ui.scrollbarWidth = 17;
ui.tempDiv = $("<div style='position:absolute;left:-1000px;top:-100px;width:100px;height:100px;overflow:auto;' />");
ui.tempInnerDiv = $("<div style='width:100%;height:50px;' />");
ui.tempDiv.append(ui.tempInnerDiv);
document.documentElement.appendChild(ui.tempDiv.get(0));
ui.tempWidth = ui.tempInnerDiv.width();
ui.tempInnerDiv.css("height", "120px");
ui.scrollbarHeight = ui.scrollbarWidth = ui.tempWidth - ui.tempInnerDiv.width();
ui.tempInnerDiv.remove();
ui.tempDiv.remove();
delete ui.tempWidth;
delete ui.tempInnerDiv;
delete ui.tempDiv;

/**
 * 以一个对象的scrollLeft和scrollTop属性的方式返回滚动条的偏移量
 */
ui.getScrollOffsets = function(w) {
    var result,
        doc;
    w = w || window;
    doc = w.document;

    result = {};
    if(w.pageXOffset !== null) {
        result.scrollLeft = w.pageXOffset;
        result.scrollTop = w.pageYOffset;
        return result;
    }

    if(document.compatMode === "CSS1Compat") {
        result.scrollLeft = doc.documentElement.scrollLeft;
        result.scrollTop = doc.documentElement.scrollTop;
        return result;
    }

    result.scrollLeft = doc.body.scrollLeft;
    result.scrollTop = doc.body.scrollTop;
    return result;
};

/**
 * 获取当前显示区域的尺寸
 */
ui.getViewportSize = function(w) {
    var result = {};
    var doc;
    w = w || window;
    doc = w.document;

    if(w.innerWidth !== null) {
        result.clientWidth = w.innerWidth;
        result.clientHeight = w.innerHeight;
    }
    if(document.compatMode === "CSS1Compat") {
        result.scrollLeft = doc.documentElement.clientWidth;
        result.scrollTop = doc.documentElement.clientHeight;
        return result;
    }

    result.scrollLeft = doc.body.clientWidth;
    result.scrollTop = doc.body.clientHeight;
    return result;
};

/**
 * 获取一个元素的尺寸
 */
ui.getBoundingClientRect = function(elem) {

};

//获取元素
ui.getJQueryElement = function(arg) {
    var elem = null;
    if(ui.core.type(arg) === "string") {
        elem = $("#" + arg);
    } else if(ui.core.isJQueryObject(arg)) {
        elem = arg;
    } else if(ui.core.isDomObject(arg)) {
        elem = $(arg);
    }
    
    if(!elem || elem.length === 0) {
        return null;
    } else {
        return elem;
    }
};

//将元素移动到目标元素下方
ui.setDown = function (target, panel) {
    if (!target || !panel) {
        return;
    }
    var width = panel.outerWidth(),
        height = panel.outerHeight();
    var css = ui.getDownLocation(target, width, height);
    css.top += "px";
    css.left += "px";
    panel.css(css);
};

//将元素移动到目标元素左边
ui.setLeft = function (target, panel) {
    if (!target || !panel) {
        return;
    }
    var width = panel.outerWidth(),
        height = panel.outerHeight();
    var css = ui.getLeftLocation(target, width, height);
    css.top += "px";
    css.left += "px";
    panel.css(css);
};

//获取目标元素下方的坐标信息
ui.getDownLocation = function (target, width, height) {
    var location = {
        left: 0,
        top: 0
    };
    if (!target) {
        return location;
    }
    var p = target.offset();
    var docel = ui.core.root;
    var top = p.top + target.outerHeight(),
        left = p.left;
    if ((top + height) > (docel.clientHeight + docel.scrollTop)) {
        top -= height + target.outerHeight();
    }
    if ((left + width) > docel.clientWidth + docel.scrollLeft) {
        left = left - (width - target.outerWidth());
    }
    location.top = top;
    location.left = left;
    return location;
};

//获取目标元素左边的坐标信息
ui.getLeftLocation = function (target, width, height) {
    var location = {
        left: 0,
        top: 0
    };
    if (!target) {
        return location;
    }
    var p = target.offset();
    var docel = ui.core.root;
    var tw = target.outerWidth(),
        top = p.top,
        left = p.left + tw;
    if ((top + height) > (docel.clientHeight + docel.scrollTop)) {
        top -= (top + height) - (docel.clientHeight + docel.scrollTop);
    }
    if ((left + width) > docel.clientWidth + docel.scrollLeft) {
        left = p.left - width;
    }
    location.top = top;
    location.left = left;
    return location;
};

//全局遮罩
var maskPanelId = "#ui_maskPanel";
//全局遮罩是否开启
ui.isMaskOpened = function() {
    var mask = $(maskPanelId);
    return mask.css("display") === "block";
};
//开启遮罩
ui.openMask = function (target, option) {
    var mask = $(maskPanelId),
        body = $(document.body);
    if(this.core.isPlainObject(target)) {
        option = target;
        target = null;
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
        mask = $("<div id='ui_maskPanel' class='mask-panel' />");
        body.append(mask);
        ui.resize(function (e, width, height) {
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
            top: "0px",
            left: "0px",
            width: root.clientWidth + "px",
            height: root.clientHeight + "px"
        });
    } else {
        var offset = target.offset();
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
};
//关闭遮罩
ui.closeMask = function () {
    var mask = $(maskPanelId);
    if (mask.length === 0) {
        return;
    }
    var data = this._mask_data;
    if(data.target.nodeName() === "BODY") {
        data.target.css("overflow", data.overflow);
    }
    if(data.option.animate) {
        this._mask_animator[0].begin = 60;
        this._mask_animator[0].end = 0;
        this._mask_animator.start().done(function() {
            mask.css("display", "none");
        });
    } else {
        mask.css("display", "none");
    }
};
