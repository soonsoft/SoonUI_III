// core

/*
javascript 异常类型
Error: 基类
    message: 错误描述信息
    fileName: 默认是调用Error构造器代码所在文件的名称
    lineNumber: 行号
EvalError: eval() 方法报错
InternalError: javascript引擎内部异常，如：递归溢出
RangeError: 越界，超出有效的范围
ReferenceError: 无效引用
SyntaxError: eval() 解析过程中发生语法错误
TypeError: 变量或参数不对
URIError: 传递给encodeURI或decodeURI参数无效
*/

//按键常量
ui.keyCode = {
    BACKSPACE: 8,
    COMMA: 188,
    DELETE: 46,
    DOWN: 40,
    END: 35,
    ENTER: 13,
    ESCAPE: 27,
    HOME: 36,
    LEFT: 37,
    NUMPAD_ADD: 107,
    NUMPAD_DECIMAL: 110,
    NUMPAD_DIVIDE: 111,
    NUMPAD_ENTER: 108,
    NUMPAD_MULTIPLY: 106,
    NUMPAD_SUBTRACT: 109,
    PAGE_DOWN: 34,
    PAGE_UP: 33,
    PERIOD: 190,
    RIGHT: 39,
    SPACE: 32,
    TAB: 9,
    UP: 38
};

ui.core = {};

var core = ui.core,
    DOC = document,
    //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
    rword = /[^, ]+/g,
    arrayInstance = [],
    class2type = {},
    oproto = Object.prototype,
    ohasOwn = oproto.hasOwnProperty,
    W3C = window.dispatchEvent,
    root = DOC.documentElement,
    serialize = oproto.toString,
    aslice = arrayInstance.slice,
    head = DOC.head || DOC.getElementsByTagName("head")[0],
    rwindow = /^[\[]object (Window|DOMWindow|global)[\]]$/,
    isTouchAvailable,
    isSupportCanvas,
    typeStr = "Boolean Number String Function Array Date RegExp Object Error";

core.global = function() {
    if (typeof self !== "undefined") { 
        return self; 
    }
    if (typeof window !== "undefined") { 
        return window; 
    }
    if (typeof global !== "undefined") { 
        return global; 
    }
    throw new TypeError('unable to locate global object');
};

// 简单的字符串遍历方法，通过[ ]或者[,]分割字符串
core.each = function(text, fn) {
    text.replace(rword, fn);
};

// 数据类型处理
core.each(typeStr, function (name) {
    class2type["[object " + name + "]"] = name.toLowerCase();
});

// 获取对象的类型
core.type = function(obj) {
    if (obj === null) {
        return String(obj);
    }
    // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
    return typeof obj === "object" || typeof obj === "function" ?
            class2type[serialize.call(obj)] || "object" :
            typeof obj;
};
// 生成isXXX方法
core.each(typeStr, function (name) {
    var lowerName = name.toLowerCase();
    core["is" + name] = function() {
        return core.type.apply(core, arguments) === lowerName;
    };
});

// 重写isNumber实现
core.isNumber = function(obj) {
    var type = core.type(obj);
    return (type === "number" || type === "string") &&
        !isNaN(obj - parseFloat(obj));
};
// 设置一个别名，符合jquery的习惯
core.isNumeric = core.isNumber;

// 判断null，null或undefined都返回true
core.isNull = function(obj) {
    var type = this.type(obj);
    return type === "undefined" || type === "null";
};

// window对象判断
core.isWindow = function (obj) {
    if (!obj)
        return false;
    if (obj === window)
        return true;
    // 利用IE678 window == document为true,document == window竟然为false的神奇特性
    // 标准浏览器及IE9，IE10等使用 正则检测
    return obj == obj.document && obj.document != obj;
};
function isWindow(obj) {
    return rwindow.test(serialize.call(obj));
}
if (!isWindow(window)) {
    core.isWindow = isWindow;
}

//判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例
core.isPlainObject = function (obj) {
    if (this.type(obj) !== "object" || obj.nodeType || this.isWindow(obj)) {
        return false;
    }
    try {
        if (obj.constructor && !ohasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
            return false;
        }
    } catch (e) {
        return false;
    }
    return true;
};
if (/\[native code\]/.test(Object.getPrototypeOf)) {
    core.isPlainObject = function (obj) {
        return obj && typeof obj === "object" && Object.getPrototypeOf(obj) === oproto;
    };
}

// 判断是否是一个空的对象
core.isEmptyObject = function (obj) {
    var name;
    for (name in obj) {
        return false;
    }
    return true;
};

// 判断是否为Dom对象
core.isDomObject = function (obj) {
    return !!obj && !!obj.nodeType && obj.nodeType == 1;
};

// 判断是否为jQuery对象
core.isJQueryObject = function (obj) {
    return this.type(obj) === "object" && this.type(obj.jquery) === "string";
};

// 判断是否为原生函数
core.isNative = function(obj) {
    return this.type(obj) === "function" && /native code/.test(obj.toString());
};

// 判断浏览器是否支持canvas对象
core.isSupportCanvas = function () {
    if(core.type(isSupportCanvas) !== "boolean") {
        isSupportCanvas = !!document.createElement("canvas").getContext;
    }
    return isSupportCanvas;
};

// 判断是否支持触摸操作
core.isTouchAvailable = function() {
    if(core.type(isTouchAvailable) !== "boolean") {
        isTouchAvailable = "ontouchstart" in window;
    }
    return isTouchAvailable;
};

