// util

//获取浏览器滚动条的宽度
ui.scrollbarHeight = ui.scrollbarWidth = 17;
ui.tempDiv = $("<div style='position:absolute;left:-1000px;top:-100px;width:100px;height:100px;overflow:auto;' />");
ui.tempInnerDiv = $("<div style='width:100%;height:50px;' />");
ui.tempDiv.append(ui.tempInnerDiv);
document.documentElement.appendChild(ui.tempDiv.get(0));
ui.tempWidth = ui.tempInnerDiv[0].clientWidth;
ui.tempInnerDiv.css("height", "120px");
ui.scrollbarHeight = ui.scrollbarWidth = ui.tempWidth - ui.tempInnerDiv[0].clientWidth;
ui.tempInnerDiv.remove();
ui.tempDiv.remove();
delete ui.tempWidth;
delete ui.tempInnerDiv;
delete ui.tempDiv;

/** 元素是否有滚动条 */
ui.hasScrollBar = function() {
    return false;
}

// TODO 统一的异常处理函数
ui.handleError = function(e) {
    console.log(e);
};

/** jQuery 全局Eval函数 */
ui.globalEval = function(data) {
    if (data && ui.str.trim(data)) {
        // We use execScript on Internet Explorer
        // We use an anonymous function so that context is window
        // rather than jQuery in Firefox
        (window.execScript || function(data) {
            window["eval"].call(window, data); // jscs:ignore requireDotNotation
        })(data);
    }
};

/**
 * 修复javascript中四舍五入方法的bug
 */ 
ui.fixedNumber = function (number, precision) {
    var multiplier,
        b = 1;
    if (isNaN(number)) return number;
    if (number < 0) b = -1;
    if (isNaN(precision)) precision = 0;
    
    multiplier = Math.pow(10, precision);
    return Math.round(Math.abs(number) * multiplier) / multiplier * b;
};

var r20 = /%20/g,
    rbracket = /\[\]$/;
function buildParams(prefix, obj, add) {
    if(Array.isArray(obj)) {
        obj.forEach(function(item, index) {
            if(rbracket.test(prefix)) {
                add(prefix, item);
            } else {
                buildParams(
                    prefix + "[" + (typeof item === "object" ? index : "") + "]", 
                    item, 
                    add);
            }
        });
    } else if(ui.core.isPlainObject(obj)) {
        Object.keys(obj).forEach(function(key) {
            buildParams(prefix + "[" + key + "]", obj[key], add);
        });
    } else {
        add(prefix, obj);
    }
}
/** 将对象转换为[key=value&key=value]格式 */
ui.param = function(obj) {
    var 
        strBuilder = [],
        add = function(key, valueOrFunction) {
            if(!key) return;
            var value = (ui.core.isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction);
            strBuilder.push(encodeURIComponent(key) + "=" + encodeURIComponent(value === null ? "" : value));
        };
    if(Array.isArray(obj)) {
        obj.forEach(function(item) {
            add(item.name, item.value);
        });
    } else {
        Object.keys(obj).forEach(function(key) {
            buildParams(key, obj[key], add);
        });
    }

    /*
        为什么要把 %20 替换成 + 呢？
        按照 RFC3986 ，空格编码后是 %20
        但按照 HTML 标准，application/x-www-form-urlencoded 对空格编码的要求为 +
    */
    return strBuilder.join("&").replace(r20, "+");
};

/** 对象扩展 param[0]: deep, param[1]: target param[2]... */
// TODO Object.assign
ui.extend = function() {
    var options, name, src, copy, copyIsArray, clone,
        target = arguments[0] || {},
        i = 1,
        length = arguments.length,
        deep = false;

    // 是否深拷贝
    if (ui.core.isBoolean(target)) {
        deep = target;
        target = arguments[i] || {};
        i++;
    }

    // 如果target不是一个可以扩展的对象(Object/Array/Function)则设置为object
    if (typeof target !== "object" && !ui.core.isFunction(target)) {
        target = {};
    }

    // 如果只有被扩展对象本身则直接返回
    if (i === length) {
        return target;
    }

    for (; i < length; i++) {
        // 避开 null/undefined
        if ((options = arguments[i]) != null) {
            for (name in options) {
                if(!options.hasOwnProperty(name))  {
                    continue;
                }

                copyIsArray = false;
                src = target[name];
                copy = options[name];

                if ( target === copy ) {
                    continue;
                }

                if (deep && copy && 
                        (ui.core.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
                    // 如果是对象或者是数组，并且是深拷贝
                    if (copyIsArray) {
                        clone = src && Array.isArray(src) ? src : [];
                    } else {
                        clone = src && ui.core.isPlainObject(src) ? src : {};
                    }

                    // 深拷贝
                    target[name] = ui.extend(deep, clone, copy);
                } else if (copy !== undefined && copy !== null) {
                    // 直接设置值
                    target[name] = copy;
                }
            }
        }
    }

    // Return the modified object
    return target;
};

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
    var box;
    if(!elem) {
        return null;
    }
    if(ui.core.isJQueryObject(elem)) {
       elem = elem[0]; 
    }
    box = elem.getBoundingClientRect();
    box.width = box.width || box.right - box.left;
    box.height = box.height || box.bottom - box.top;
    box.x = box.x || box.left;
    box.y = box.y || box.top
    return box;
};

/**
 * 获取元素
 * @param {*} arg 参数，可以是id，也可以是dom element也可以是jQuery element 
 */
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
    }
    return elem;
};

function setLocation(fn, target, panel) {
    var width, 
        height,
        location,
        rect,
        css = {};
    
    if (!target || !panel) {
        return;
    }

    rect = panel.getBoundingClientRect();
    
    width = rect.width;
    height = rect.height;
    
    location = fn.call(ui, target, width, height);
    css.top = location.top + "px";
    css.left = location.left + "px";
    panel.css(css);
}

/**
 * 将元素移动到目标元素下方
 * @param {*} target 目标元素
 * @param {*} panel 要移动的元素
 */
ui.setDown = function (target, panel) {
    setLocation(ui.getDownLocation, target, panel);
};

/**
 * 将元素移动到目标元素左边
 * @param {*} target 目标元素
 * @param {*} panel 要移动的元素
 */
ui.setLeft = function (target, panel) {
    setLocation(ui.getLeftLocation, target, panel);
};

/**
 * 获取目标元素下方的坐标信息
 * @param {*} target 目标元素
 * @param {*} width 要移动元素的宽
 * @param {*} height 要移动元素的高
 */
ui.getDownLocation = function (target, width, height) {
    var location,
        rect,
        documentElement,
        top, left;

    location = {
        left: 0,
        top: 0
    };
    if (!target) {
        return location;
    }
    rect = target.getBoundingClientRect();
    documentElement = document.documentElement;
    top = rect.top + rect.height;
    left = rect.left;
    if ((top + height) > (documentElement.clientHeight + documentElement.scrollTop)) {
        top -= height + rect.height;
    }
    if ((left + width) > documentElement.clientWidth + documentElement.scrollLeft) {
        left = left - (width - rect.width);
    }
    location.top = top;
    location.left = left;
    return location;
};

/**
 * 获取目标元素左边的坐标信息
 * @param {*} target 目标元素
 * @param {*} width 要移动元素的宽
 * @param {*} height 要移动元素的高
 */
ui.getLeftLocation = function (target, width, height) {
    var location,
        rect,
        documentElement,
        top, left;
    
    location = {
        left: 0,
        top: 0
    };
    if (!target) {
        return location;
    }
    rect = target.getBoundingClientRect();
    documentElement = document.documentElement;
    top = rect.top;
    left = rect.left + rect.width;
    if ((top + height) > (documentElement.clientHeight + documentElement.scrollTop)) {
        top -= (top + height) - (documentElement.clientHeight + documentElement.scrollTop);
    }
    if ((left + width) > documentElement.clientWidth + documentElement.scrollLeft) {
        left = rect.left - width;
    }
    location.top = top;
    location.left = left;
    return location;
};
