/*
    SOONUI 主命名空间声明
 */
(function(global, factory) {
	if (typeof module === "object" && typeof module.exports === "object") {

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get SOONUI.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var soonui = require("SOONUI")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory(global, true) :
			function(w) {
				if (!w.document) {
					throw new Error("SOONUI requires a window with a document");
				}
				return factory(w);
			};
	} else {
		factory(global, true);
	}
// Pass this if window is not defined yet
})(typeof window !== "undefined" ? window : this, function(window, noGlobal) {

/**
 * 严格模式
 * 变量必须声明后再使用
 * 函数的参数不能有同名属性，否则报错
 * 不能使用with语句
 * 不能对只读属性赋值，否则报错
 * 不能使用前缀0表示八进制数，否则报错
 * 不能删除不可删除的属性，否则报错
 * 不能删除变量delete prop，会报错，只能删除属性delete global[prop]
 * eval不会在它的外层作用域引入变量
 * eval和arguments不能被重新赋值
 * arguments不会自动反映函数参数的变化
 * 不能使用arguments.callee
 * 不能使用arguments.caller
 * 禁止this指向全局对象
 * 不能使用fn.caller和fn.arguments获取函数调用的堆栈
 * 增加了保留字（比如protected、static和interface）
 */
"use strict";

var ui = {};

// 常规的浏览器导入
if(noGlobal) {
	window.ui = ui;
	window.SOONUI = ui;
}

var $ = null;
function init_$() {
	$ = ui.$ || window.$;
	if(!$) {
		$ = require("jquery");
	}
	if(!window.$) {
		window.$ = $ || undefined;
	}
}

ui.version = '3.5.0';

// Source: src/core/core.js

(function(ui, $) {
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



})(ui, $);

// Source: src/core/i18n.js

(function(ui, $) {
// Internationalization

var locale = "zh-CN",
    language = {},
    defaultNote = "common";

ui.i18n = function() {
    var i, len, 
        propertyNameArr,    
        propertyName,
        langObj;

    len = arguments.length;
    if(len === 0) {
        return language[defaultNote];
    } else if(len === 1) {
        propertyNameArr = [arguments[0]];
    } else {
        propertyNameArr = Array.from(arguments);
    }

    langObj = language[propertyNameArr[0]] || language[defaultNote];
    for(i = 1, len = propertyNameArr.length; i < len; i++) {
        propertyName = propertyNameArr[i] || "";
        langObj = langObj[propertyName];
        if(!langObj) {
            break;
        }
    }
    if(langObj === language || !langObj) {
        return null;
    }
    return langObj;
};

ui.i18n.locale = locale;
ui.i18n.language = language;
// common language text

ui.i18n.language.common = {
    
};

// language of component

// language of control

ui.i18n.language.control = {};

ui.i18n.language.control["ui.ctrls.DateChooser"] = {
    dateFormat: "yyyy-mm-dd",
    year: "年份",
    month: "月份",
    weeks: ["日", "一", "二", "三", "四", "五", "六"],
    months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
};

ui.i18n.language.control["ui.ctrls.CalendarView"] = {
    sundayFirstWeek: ["日", "一", "二", "三", "四", "五", "六"],
    mondayFirstWeek: ["一", "二", "三", "四", "五", "六", "日"],
    yearUnit: "年",
    monthUnit: "月"
};

// language of core

// language of effect

// language of viewpage


})(ui, $);

// Source: src/shims/ES5-Array-shims.js

(function(ui, $) {
// 为ECMAScript3 添加ECMAScript6的方法

function isFunction(fn) {
    return ui.core.isFunction(fn);
}

// Array.prototype
// isArray
if(!isFunction(Array.isArray)) {
    Array.isArray = function(obj) {
        return ui.core.type(obj) === "array";
    };
}
// forEach
if(!isFunction(Array.prototype.forEach)) {
    Array.prototype.forEach = function(fn, caller) {
        var i, len;
        if(!isFunction(fn)) {
            return;
        }
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            fn.call(caller, this[i], i, this);
        }
    };
}
// map
if(!isFunction(Array.prototype.map)) {
    Array.prototype.map = function(fn, caller) {
        var i, len,
            result;
        if(!isFunction(fn)) {
            return;
        }
        result = new Array(this.length);
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            result[i] = fn.call(caller, this[i], i, this);
        }
        return result;
    };
}
// filter
if(!isFunction(Array.prototype.filter)) {
    Array.prototype.filter = function(fn, caller) {
        var i, len,
            result;
        if(!isFunction(fn)) {
            return;
        }
        result = [];
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            if(fn.call(caller, this[i], i, this)) {
                result.push(this[i]);
            }
        }
        return result;
    };
}
// every
if(!isFunction(Array.prototype.every)) {
    Array.prototype.every = function(fn, caller) {
        var i, len;
        if(!isFunction(fn)) {
            return;
        }
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            if(!fn.call(caller, this[i], i, this)) {
                return false;
            }
        }
        return true;
    };
}
// some
if(!isFunction(Array.prototype.some)) {
    Array.prototype.some = function(fn, caller) {
        var i, len;
        if(!isFunction(fn)) {
            return;
        }
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            if(fn.call(caller, this[i], i, this)) {
                return true;
            }
        }
        return false;
    };
}
// reduce
if(!isFunction(Array.prototype.reduce)) {
    Array.prototype.reduce = function(fn, defaultValue) {
        var i, len,
            result;

        if(!isFunction(fn)) {
            return;
        }
        
        i = 0;
        len = this.length;
        if(arguments.length < 2) {
            if(len === 0) {
                throw new TypeError("Reduce of empty array with no initial value");
            }
            result = this[i];
            i++;
        } else {
            result = defaultValue;
        }
        for(; i < len; i++) {
            if(!(i in this)) continue;
            result = fn.call(null, result, this[i], i, this);
        }
        return result;
    };
}
// reduceRight
if(!isFunction(Array.prototype.reduceRight)) {
    Array.prototype.reduceRight = function(fn, defaultValue) {
        var i, len,
            result;

        if(!isFunction(fn)) {
            return;
        }

        len = this.length;
        i = len - 1;
        if(arguments.length < 2) {
            if(len === 0) {
                throw new TypeError("Reduce of empty array with no initial value");
            }
            result = this[i];
            i--;
        } else {
            result = defaultValue;
        }
        for(; i >= 0; i--) {
            if(!(i in this)) continue;
            result = fn.call(null, result, this[i], i, this);
        }
        return result;
    };
}
// indexOf
if(!isFunction(Array.prototype.indexOf)) {
    Array.prototype.indexOf = function(value, startIndex) {
        var i, len,
            index;
        if(!startIndex) {
            startIndex = 0;
        }
        
        len = this.length;
        index = -1;
        if(len > 0) {
            while(startIndex < 0) {
                startIndex = len + startIndex;
            }
            
            for(i = startIndex; i < len; i++) {
                if(this[i] === value) {
                    index = i;
                    break;
                }
            }
        }
        return index;
    };
}
// lastIndexOf
if(!isFunction(Array.prototype.lastIndexOf)) {
    Array.prototype.lastIndexOf = function(value, startIndex) {
        var i, len,
            index;

        if(!startIndex) {
            startIndex = 0;
        }
        
        len = this.length;
        i = len - 1;
        index = -1;
        if(len > 0) {
            while(startIndex < 0)
                startIndex = len + startIndex;
            
            for(i = startIndex; i >= 0; i--) {
                if(this[i] === value) {
                    index = i;
                    break;
                }
            }
        }
        return index;
    };
}


})(ui, $);

// Source: src/shims/ES6-Array-shims.js

(function(ui, $) {
// 为ECMAScript3 添加ECMAScript6的方法

function isFunction(fn) {
    return ui.core.isFunction(fn);
}

// find
if(!isFunction(Array.prototype.find)) {
    Array.prototype.find = function(fn, caller) {
        var i, len;
        if(!isFunction(fn)) {
            return;
        }
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            if(fn.call(caller, this[i], i, this)) {
                return this[i];
            }
        }
    };
}
// findIndex
if(!isFunction(Array.prototype.findIndex)) {
    Array.prototype.findIndex = function(fn, caller) {
        var i, len;
        if(!isFunction(fn)) {
            return -1;
        }
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            if(fn.call(caller, this[i], i, this)) {
                return i;
            }
        }
        return -1;
    };
}
// fill
if(!isFunction(Array.prototype.fill)) {
    Array.prototype.fill = function(value) {
        var i, len;
        for(i = 0, len = this.length; i < len; i++) {
            this[i] = value;
        }
    };
}
// includes
if(!isFunction(Array.prototype.includes)) {
    Array.prototype.includes = function(value) {
        return this.some(function(item) {
            return item === value;
        });
    };
}

// Array.from
if(!isFunction(Array.from)) {
    Array.from = function(arrayLike, fn) {
        var i, len,
            itemFn,
            result = [];

        if(arrayLike && arrayLike.length) {
            itemFn = fn;
            if(!isFunction(itemFn)) {
                itemFn = function(item) { 
                    return item; 
                };
            }
            for(i = 0, len = arrayLike.length; i < len; i++) {
                result.push(itemFn.call(null, arrayLike[i], i));
            }
        }
        return result;
    };
}

// Array.of
if(!isFunction(Array.of)) {
    Array.of = function() {
        return [].slice.call(arguments);
    };
}


})(ui, $);

// Source: src/shims/ES5-String-shims.js

(function(ui, $) {
// 为ECMAScript3 添加ECMAScript5的方法

var rtrim;

function isFunction(fn) {
    return ui.core.isFunction(fn);
}

// String.prototype
// trim
if(!isFunction(String.prototype.trim)) {
    // Support: Android<4.1, IE<9
    // Make sure we trim BOM and NBSP
    rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.protocol.trim = function() {
        return text == null ? "" : (text + "").replace(rtrim, "");
    };
}



})(ui, $);

// Source: src/shims/ES6-String-shims.js

(function(ui, $) {
// 为String对象添加ES6的一些方法

var toString = Object.prototype.toString;

function isFunction(fn) {
    return ui.core.isFunction(fn);
}

function ensureInteger(position) {
	var index = position ? Number(position) : 0;
	if(isNaN(index)) {
		index = 0;
	}
	return index;
}

// at
if(!isFunction(String.prototype.at)) {
	String.prototype.at = function(position) {
		var str,
			index,
			endIndex,
			len,
			firstChar, secondChar;

		if(this === null || this === undefined) {
			throw new TypeError("String.prototype.indexOf called on null or undefined");
		}

		index = ensureInteger(position);
		index = Math.max(index, 0);

		str = toString.call(this);
		len = str.length;
		if(index <= -1 || index >= len) {
			return "";
		}

		firstChar = str.charCodeAt(index);
		endIndex = index + 1;
		if (firstChar >= 0xD800 && firstChar <= 0xDBFF && endIndex < len) {
			secondChar = str.charCodeAt(endIndex);
			if(secondChar >= 0xDC00 && secondChar <= 0xDFFF) {
				endIndex = index + 2;
			}
		}

		return str.slice(index, endIndex);
	};
}

// includes
if(!isFunction(String.prototype.includes)) {
	String.prototype.includes = function() {
		return String.prototype.indexOf.apply(this, arguments) !== -1;
	};
}

// startsWith
if(!isFunction(String.prototype.startsWith)) {
	String.prototype.startsWith = function(searchStr) {
		var str,
			search,
			startIndex;

		if(ui.core.isRegExp(searchStr)) {
			throw new TypeError("Cannot call method \"startsWith\" with a regex");
		}

		if(this === null || this === undefined) {
			throw new TypeError("String.prototype.indexOf called on null or undefined");
		}

		str = toString.call(this);
		search = toString.call(searchStr);

		if(arguments.length > 1) {
			startIndex = ensureInteger(arguments[1]);
		} else {
			startIndex = 0;
		}
		startIndex = Math.max(startIndex, 0);
		
		return str.slice(startIndex, startIndex + search.length) === search;
	};
}

// endsWith
if(!isFunction(String.prototype.endsWith)) {
	String.prototype.endsWith = function(searchStr) {
		var str,
			search,
			endIndex;

		if(ui.core.isRegExp(searchStr)) {
			throw new TypeError("Cannot call method \"startsWith\" with a regex");
		}

		if(this === null || this === undefined) {
			throw new TypeError("String.prototype.indexOf called on null or undefined");
		}

		str = toString.call(this);
		search = toString.call(searchStr);

		if(arguments.length > 1) {
			endIndex = ensureInteger(arguments[1]);
		} else {
			endIndex = str.length;
		}
		endIndex = Math.min(Math.max(endIndex, 0), str.length);
		
		return str.slice(endIndex - search.length, endIndex) === search;
	};
}


})(ui, $);

// Source: src/shims/ES5-Function-shims.js

(function(ui, $) {
// 为ECMAScript3 添加ECMAScript5的方法

function isFunction(fn) {
    return ui.core.isFunction(fn);
}

// Function.prototype
// bind
if(!isFunction(Function.prototype.bind)) {
    Function.prototype.bind = function(o) {
        var self = this,
            boundArgs = arguments;
        return function() {
            var args = [],
                i;
            for(i = 1; i < boundArgs.length; i++) {
                args.push(boundArgs[i]);
            }
            for(i = 0; i < arguments.length; i++) {
                args.push(arguments[i]);
            }
            return self.apply(o, args);
        };
    };
}


})(ui, $);

// Source: src/shims/ES5-JSON-shims.js

(function(ui, $) {
// json2

// 判断浏览器是否原生支持JSON对象
var hasJSON = (Object.prototype.toString.call(window.JSON) === "[object JSON]" && 
        ui.core.isFunction(window.JSON.parse) && 
        ui.core.isFunction(window.JSON.stringify));
if (hasJSON) {
    return;
}

var JSON = {
    fake: true
};

var rx_one = /^[\],:{}\s]*$/;
var rx_two = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
var rx_three = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
var rx_four = /(?:^|:|,)(?:\s*\[)+/g;
var rx_escapable = /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
var rx_dangerous = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

function f(n) {
    return n < 10 ? "0" + n : n;
}
function this_value() {
    return this.valueOf();
}
if (typeof Date.prototype.toJSON !== "function") {
    Date.prototype.toJSON = function () {
        return (isFinite(this.valueOf()) ? (this.getUTCFullYear() + "-" + 
                    f(this.getUTCMonth() + 1) + "-" + 
                    f(this.getUTCDate()) + "T" + 
                    f(this.getUTCHours()) + ":" + 
                    f(this.getUTCMinutes()) + ":" + 
                    f(this.getUTCSeconds()) + "Z") : null);
    };
    Boolean.prototype.toJSON = this_value;
    Number.prototype.toJSON = this_value;
    String.prototype.toJSON = this_value;
}

var gap;
var indent;
var meta;
var rep;

function quote(string) {
    rx_escapable.lastIndex = 0;
    return rx_escapable.test(string) ? 
        ("\"" + string.replace(rx_escapable, function (a) {
            var c = meta[a];
            return (typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4));
        }) + "\"") : 
        ("\"" + string + "\"");
}
function str(key, holder) {
    var i;          // The loop counter.
    var k;          // The member key.
    var v;          // The member value.
    var length;
    var mind = gap;
    var partial;
    var value = holder[key];
    if (value && typeof value === "object" &&
            typeof value.toJSON === "function") {
        value = value.toJSON(key);
    }
    if (typeof rep === "function") {
        value = rep.call(holder, key, value);
    }
    switch (typeof value) {
        case "string":
            return quote(value);

        case "number":
            return isFinite(value) ? String(value) : "null";

        case "boolean":

        case "null":
            return String(value);

        case "object":
            if (!value) {
                return "null";
            }
            gap += indent;
            partial = [];
            if (Object.prototype.toString.apply(value) === "[object Array]") {
                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || "null";
                }
                v = (partial.length === 0 ? "[]" : gap) ? 
                        "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : 
                        "[" + partial.join(",") + "]";
                gap = mind;
                return v;
            }
            if (rep && typeof rep === "object") {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === "string") {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ": " : ":") + v);
                        }
                    }
                }
            } else {
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ": " : ":") + v);
                        }
                    }
                }
            }
            v = (partial.length === 0 ? "{}" : gap) ? 
                    "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : 
                    "{" + partial.join(",") + "}";
            gap = mind;
            return v;
    }
}

// JSON.stringify & JSON.parse
meta = {
    "\b": "\\b",
    "\t": "\\t",
    "\n": "\\n",
    "\f": "\\f",
    "\r": "\\r",
    "\"": "\\\"",
    "\\": "\\\\"
};
JSON.stringify = function (value, replacer, space) {
    var i;
    gap = "";
    indent = "";
    if (typeof space === "number") {
        for (i = 0; i < space; i += 1) {
            indent += " ";
        }
    } else if (typeof space === "string") {
        indent = space;
    }
    rep = replacer;
    if (replacer && typeof replacer !== "function" &&
            (typeof replacer !== "object" ||
            typeof replacer.length !== "number")) {
        throw new Error("JSON.stringify");
    }
    return str("", {"": value});
};
JSON.parse = function (text, reviver) {
    var j;
    function walk(holder, key) {
        var k;
        var v;
        var value = holder[key];
        if (value && typeof value === "object") {
            for (k in value) {
                if (Object.prototype.hasOwnProperty.call(value, k)) {
                    v = walk(value, k);
                    if (v !== undefined) {
                        value[k] = v;
                    } else {
                        delete value[k];
                    }
                }
            }
        }
        return reviver.call(holder, key, value);
    }
    text = String(text);
    rx_dangerous.lastIndex = 0;
    if (rx_dangerous.test(text)) {
        text = text.replace(rx_dangerous, function (a) {
            return "\\u" +
                    ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
        });
    }
    if (
        rx_one.test(
            text
                .replace(rx_two, "@")
                .replace(rx_three, "]")
                .replace(rx_four, "")
        )
    ) {
        j = eval("(" + text + ")");
        return (typeof reviver === "function") ? walk({"": j}, "") : j;
    }
    throw new SyntaxError("JSON.parse");
};

})(ui, $);

// Source: src/shims/ES6-Number-shims.js

(function(ui, $) {
// 为Number对象添加ES6的一些方法

function isFunction(fn) {
    return ui.core.isFunction(fn);
}

function isNumber(value) {
    return ui.core.type(value) === "number";
}

// Number.isFinite
if(!isFunction(Number.isFinite)) {
    Number.isFinite = function(num) {
        return isNumber(num) && (num > -Infinity && num < Infinity);
    };
}

// Number.isNaN
if(!isFunction(Number.isNaN)) {
    Number.isNaN = isNaN;
}

// Number.parseInt
if(!isFunction(Number.parseInt)) {
    Number.parseInt = parseInt;
}

// Number.parseFloat
if(!isFunction(Number.parseFloat)) {
    Number.parseFloat = parseFloat;
}


})(ui, $);

// Source: src/shims/ES5-Object-shims.js

(function(ui, $) {
// 为String对象添加ES6的一些方法

var prototypeOfObject = Object.prototype,
	hasOwnProperty = prototypeOfObject.hasOwnProperty,
	isEnumerable = prototypeOfObject.propertyIsEnumerable,

	supportsAccessors,
	defineGetter,
	defineSetter,
	lookupGetter,
	lookupSetter;

supportsAccessors = hasOwnProperty.call(prototypeOfObject, "__defineGetter__");
if(supportsAccessors) {
	defineGetter = prototypeOfObject.__defineGetter__;
	defineSetter = prototypeOfObject.__defineSetter__;
	lookupGetter = prototypeOfObject.__lookupGetter__;
	lookupSetter = prototypeOfObject.__lookupSetter__;
}
	

function isFunction(fn) {
	return ui.core.isFunction(fn);
}

function isPrimitive(obj) {
	return typeof obj !== 'object' && typeof obj !== 'function' || obj === null;
}

// 返回一个由一个给定对象的自身可枚举属性组成的数组
if(!isFunction(Object.keys)) {
	Object.keys = function(obj) {
		var result,
			property;

		if (isPrimitive(obj)) {
			throw new TypeError('Object.keys called on non-object');
		}

		result = [];
		for(property in obj) {
			if(hasOwnProperty.call(obj, property)) {
				result.push(property);
			}
		}
		return result;
	};
}

// 获取原型
if(!isFunction(Object.getPrototypeOf)) {
	Object.getPrototypeOf = function(obj) {
		var type,
			proto;

		type = ui.core.type(obj);
		if(type === "null" || type === "undefined") {
			throw new TypeError("Cannot convert undefined or null to object");
		}

		proto = obj.__proto__;
		if(proto || proto === null) {
			return proto;
		} else if(isFunction(obj.constructor)) {
			return obj.constructor.prototype;
		} else if(obj instanceof Object) {
			return prototypeOfObject;
		} else {
			// Object.create(null) or { __proto__: null }
			return null;
		}
	};
}

// 返回一个由指定对象的所有自身属性的属性名（包括不可枚举属性
if(!isFunction(Object.getOwnPropertyNames)) {
	Object.getOwnPropertyNames = function(obj) {
		return Object.keys(obj);
	};
}

// 检查getOwnPropertyDescriptor是否需要修复
var getOwnPropertyDescriptorFallback = null;
function doesGetOwnPropertyDescriptorWork(obj) {
	try {
		object.sentinel = 0;
		return Object.getOwnPropertyDescriptor(object, 'sentinel').value === 0;
	} catch (e) {
		return false;
	}
}
if(Object.getOwnPropertyDescriptor) {
	if(!doesGetOwnPropertyDescriptorWork({}) || 
		!(typeof document === "undefined" || doesGetOwnPropertyDescriptorWork(document.createElement("div")))) {
		getOwnPropertyDescriptorFallback = Object.getOwnPropertyDescriptor;
	}
}
if(!isFunction(Object.getOwnPropertyDescriptor) || getOwnPropertyDescriptorFallback) {
	Object.getOwnPropertyDescriptor = function(obj, property) {
		var descriptor,
			originalPrototype,
			notPrototypeOfObject,
			getter,
			setter;

		if(isPrimitive(obj)) {
			throw new TypeError("Object.getOwnPropertyDescriptor called on non-object");
		}

		// 尝试使用原始的getOwnPropertyDescriptor方法 for IE8
		if(getOwnPropertyDescriptorFallback) {
			try {
				return getOwnPropertyDescriptorFallback.call(Object, obj, property);
			} catch(e) {
				// 如果没用，那就用模拟方法
			}
		}

		if(!hasOwnProperty.call(obj, property)) {
			return descriptor;
		}

		descriptor = {
            enumerable: isEnumerable.call(obj, property),
            value: obj[property],
            configurable: true,
            writable: true
        };
		
		if(supportsAccessors) {
			originalPrototype = obj.__proto__;

			notPrototypeOfObject = originalPrototype !== prototypeOfObject;
			if(notPrototypeOfObject) {
				obj.__proto__ = prototypeOfObject;
			}

			getter = lookupSetter.call(obj, property);
			setter = lookupSetter.call(obj, property);

			if(notPrototypeOfObject) {
				obj.__proto__ = originalPrototype;
			}

			if(getter || setter) {
				if(getter) {
					descriptor.get = getter;
				}
				if(setter) {
					descriptor.set = setter;
				}
			}
		}

        return descriptor;
	};
}

// 检查defineProperty是否需要修复
var definePropertyFallback = null,
	definePropertiesFallback = null;
function doesDefinePropertyWork(object) {
	try {
		Object.defineProperty(object, 'sentinel', {});
		return 'sentinel' in object;
	} catch (exception) {
		return false;
	}
}
if(Object.defineProperty) {
	if(!doesDefinePropertyWork({}) || 
		!(typeof document === "undefined" || doesDefinePropertyWork(document.createElement("div")))) {
		definePropertyFallback = Object.defineProperty;
		definePropertiesFallback = Object.defineProperties;
	}
}
if(!isFunction(Object.defineProperty) || definePropertyFallback) {
	Object.defineProperty = function(obj, property, descriptor) {
		var originalPrototype,
			notPrototypeOfObject,
			hasGetter,
			hasSetter;

		if(isPrimitive(obj) || isPrimitive(property)) {
			throw new TypeError("Object.defineProperty called on non-object");
		}

		// 尝试使用原始的defineProperty方法 for IE8
		if(definePropertyFallback) {
			try {
				return definePropertyFallback.call(Object, obj, property, descriptor);
			} catch(e) {
				// 如果没用，那就用模拟方法
			}
		}

		if("value" in descriptor) {
			if(supportsAccessors && (lookupGetter.call(obj, property) || lookupSetter.call(obj, property))) {
				originalPrototype = obj.__proto__;
				obj.__proto__ = prototypeOfObject;
				
				delete obj[prototype];
				obj[prototype] = descriptor.value;

				obj.__proto__ = originalPrototype;
			} else {
				obj[prototype] = descriptor.value;
			}
		} else {
			hasGetter = "get" in descriptor && isFunction(descriptor.get);
			hasSetter = "set" in descriptor && isFunction(descriptor.set);
			if(!supportsAccessors && (hasGetter || hasSetter)) {
				throw new TypeError("getters & setters can not be defined on this javascript engine");
			}

			if(hasGetter) {
				defineGetter.call(obj, property, descriptor.get);
			}
			if(hasSetter) {
				defineSetter.call(obj, property, descriptor.set);
			}
		}
	};
}

// 检查defineProperties是否需要修复
if(!isFunction(Object.defineProperties) || definePropertiesFallback) {
	Object.defineProperties = function(obj, properties) {
		if(definePropertiesFallback) {
			try {
				return definePropertiesFallback.call(obj, properties);
			} catch(e) {
				// 如果没用，那就用模拟方法
			}
		}

		Object.keys(obj).forEach(function(prop) {
			if(prop !== "__proto__") {
				Object.defineProperty(obj, prop);
			}
		});
		return obj;
	};
}

// 检查isExtensible是否需要修复
if(!isFunction(Object.isExtensible)) {
	Object.isExtensible = function(obj) {
		var tmpPropertyName,
			returnValue;
		if(ui.core.isObject(obj)) {
			throw new TypeError("Object.isExtensible can only be called on Objects.");
		}

		tmpPropertyName = "_tmp";
		while(hasOwnProperty(obj, tmpPropertyName)) {
			tmpPropertyName += "_";
		}

		obj[tmpPropertyName] = true;
		returnValue = hasOwnProperty(obj, tmpPropertyName);
		delete obj[tmpPropertyName];

		return returnValue;
	};
}

// 检查getPrototypeOf是否需要修复
if(!isFunction(Object.getPrototypeOf)) {
	Object.getPrototypeOf = function(obj) {
		var type,
			prototype;
		
		type = ui.core.type(obj);
		if(type === "null" || type === "undefined") {
			throw new TypeError("Cannot convert undefined or null to object");
		}

		prototype = obj.__proto__;
		if(property || prototype === null) {
			return prototype;
		} else if(ui.core.isFunction(property.constructor)) {
			return prototype.constructor.prototype;
		} else if(obj instanceof Object) {
			return prototypeOfObject;
		} else {
			return null;
		}
	};
}

// 检查create是否需要修复
var createEmpty,
	supportsProto,
	shouldUseActiveX,
	getEmptyViaActiveX,
	getEmptyViaIFrame;
if(!isFunction(Object.create)) {
	supportsProto = !({ __proto__: null } instanceof Object);
	shouldUseActiveX = function () {
		if (!document.domain) {
			return false;
		}
		try {
			return !!new ActiveXObject('htmlfile');
		} catch (e) {
			return false;
		}
	};
	getEmptyViaActiveX = function() {
		var empty,
			script,
			xDoc;

        xDoc = new ActiveXObject('htmlfile');
		script = 'script';
		xDoc.write('<' + script + '></' + script + '>');
		xDoc.close();
		empty = xDoc.parentWindow.Object.prototype;
		xDoc = null;
		return empty;
	};
	getEmptyViaIFrame = function() {
		var iframe = document.createElement('iframe'),
			parent = document.body || document.documentElement,
			empty;

		iframe.style.display = 'none';
		parent.appendChild(iframe);

		// eslint-disable-next-line no-script-url
		iframe.src = 'javascript:';
		empty = iframe.contentWindow.Object.prototype;
		parent.removeChild(iframe);
		iframe = null;
		return empty;
	};

	if(supportsProto || typeof document === "undefined") {
		createEmpty = function () {
			return {
				__proto__: null
			};	
		};
	} else {
		createEmpty = (function() {
			var emptyPrototype = shouldUseActiveX() ? getEmptyViaActiveX() : getEmptyViaIFrame();

			delete emptyPrototype.constructor;
			delete emptyPrototype.hasOwnProperty;
			delete emptyPrototype.propertyIsEnumerable;
			delete emptyPrototype.isPrototypeOf;
			delete emptyPrototype.toLocalString;
			delete emptyPrototype.toString;
			delete emptyPrototype.valueOf;

			function Empty() {}
			Empty.prototype = empty;

			return function() {
				return new Empty();
			};
		})();
	}

	Object.create = function(prototype, properties) {
		var obj;

		function Type() {}

		if(prototype === null) {
			return createEmpty();
		} else {
			if(isPrimitive(prototype)) {
				throw TypeError("Object prototype may only be an Object or null");
			}
			Type.prototype = prototype;
			obj = new Type();
			obj.__proto__ = prototype;
		}

		if(properties !== undefined) {
			Object.defineProperties(obj, properties);
		}

		return obj;
	};
}


})(ui, $);

// Source: src/shims/ES6-Promise.shims.js

(function(ui, $) {

var PromiseShim = null,
    isFunction,
    global;

isFunction = ui.core.isFunction;

function noop() {}

function _finally(onFinally) {
    var P;
    onFinally = isFunction(onFinally) ? onFinally : noop;

    P = this.constructor;

    return this.then(
        function(value) {
            P.resolve(onFinally()).then(function() {
                return value;
            });
        },
        function (reason) {
            P.resolve(onFinally()).then(function() {
                throw reason;
            });
        }
    );
}

// 提案，暂不实现
function _try() {}

ui.PromiseEmpty = {
    then: noop,
    catch: noop
};

if(typeof Promise !== "undefined" && ui.core.isNative(Promise)) {
    // 原生支持Promise
    if(!isFunction(Promise.prototype.finally)) {
        Promise.prototype.finally = _finally;
    }
    if(!isFunction(Promise.prototype.try)) {
        // 增加Promise.try提案的方法
        Promise.prototype.try = _try;
    }
    return;
}

// 生成Promise垫片

// 确定Promise对象的状态，并且执行回调函数
function fire(promise, value, isResolved) {
    promise._result = value;
    promise._state = isResolved ? "resolved" : "rejected";
    ui.setMicroTask(function() {
        var data, i, len;
        for(i = 0, len = promise._callbacks.length; i < len; i++) {
            data = promise._callbacks[i];
            promise._fire(data.onSuccess, data.onFail);
        }
    });
}

function some(any, iterable) {
    var n = 0, 
        result = [], 
        end,
        i, len;
    
    iterable = ui.core.type(iterable) === "array" ? iterable : [];
    return new PromiseShim(function (resolve, reject) {
        // 空数组直接resolve
        if (!iterable.length) {
            resolve();
        }
        function loop(promise, index) {
            promise.then(
                function (ret) {
                    if (!end) {
                        result[index] = ret;
                        //保证回调的顺序
                        n++;
                        if (any || n >= iterable.length) {
                            resolve(any ? ret : result);
                            end = true;
                        }
                    }
                }, 
                function (e) {
                    end = true;
                    reject(e);
                }
            );
        }
        for (i = 0, len = iterable.length; i < len; i++) {
            loop(iterable[i], i);
        }
    });
}

function success(value) {
    return value;
}

function failed(reason) {
    throw reason;
}

PromiseShim = function(executor) {
    var promise;

    if (typeof this !== "object") {
        throw new TypeError("Promises must be constructed via new");
    }
    if (!isFunction(executor)) {
        throw new TypeError("the executor is not a function");
    }

    // Promise共有三个状态
    // 'pending' 还处在等待状态，并没有明确最终结果
    // 'resolved' 任务已经完成，处在成功状态
    // 'rejected' 任务已经完成，处在失败状态
    this._state = "pending";
    this._callbacks = [];

    promise = this;
    executor(
        // resolve
        function (value) {
            var method;
            if (promise._state !== "pending") {
                return;
            }
            if (value && isFunction(value.then)) {
                // thenable对象使用then，Promise实例使用_then
                method = value instanceof PromiseShim ? "_then" : "then";
                // 如果value是Promise对象则把callbacks转移到value的then当中
                value[method](
                    function (val) {
                        fire(promise, val, true);
                    },
                    function (reason) {
                        fire(promise, reason, false);
                    }
                );
            } else {
                fire(promise, value, true);
            }
        }, 
        // reject
        function (reason) {
            if (promise._state !== "pending") {
                return;
            }
            fire(promise, reason, false);
        }
    );
};
PromiseShim.prototype = {
    constructor: PromiseShim,
    // 处理then方法的回调函数
    _then: function(onSuccess, onFail) {
        var that = this;
        if (this._state !== "pending") {
            // 如果Promise状态已经确定则异步触发回调
            ui.setMicroTask(function() {
                that._fire(onSuccess, onFail);
            });
        } else {
            this._callbacks.push({
                onSuccess: onSuccess, 
                onFail: onFail
            });
        }
    },
    _fire: function(onSuccess, onFail) {
        if (this._state === "rejected") {
            if (typeof onFail === "function") {
                onFail(this._result);
            } else {
                throw this._result;
            }
        } else {
            if (typeof onSuccess === "function") {
                onSuccess(this._result);
            }
        }
    },
    then: function(onSuccess, onFail) {
        var that = this,
            nextPromise;

        onSuccess = isFunction(onSuccess) ? onSuccess : success;
        onFail = isFunction(onFail) ? onFail : failed;

        // 用于衔接then，实现promise.then().catch()
        nextPromise = new PromiseShim(function (resolve, reject) {
            that._then(
                function (value) {
                    try {
                        value = onSuccess(value);
                    } catch (e) {
                        // https://promisesaplus.com/#point-55
                        reject(e);
                        return;
                    }
                    resolve(value);
                }, 
                function (value) {
                    try {
                        value = onFail(value);
                    } catch (e) {
                        reject(e);
                        return;
                    }
                    resolve(value);
                }
            );
        });

        return nextPromise;
    },
    catch: function(onFail) {
        //添加出错回调
        return this.then(success, onFail);
    },
    finally: _finally,
    try: _try
};

PromiseShim.all = function(iterable) {
    return some(false, iterable);
};

PromiseShim.race = function(iterable) {
    return some(true, iterable);
};

PromiseShim.resolve = function(value) {
    return new PromiseShim(function (resolve) {
        resolve(value);
    });
};

PromiseShim.reject = function(reason) {
    return new PromiseShim(function (resolve, reject) {
        reject(reason);
    });
};

global = ui.core.global();
global.Promise = PromiseShim;


})(ui, $);

// Source: src/core/array-like.js

(function(ui, $) {
// ArrayLike

var arrayInstance = [];
function ArrayLike () {
    this.setArray(this.makeArray(arguments));
}
ArrayLike.prototype = {
    constructor: ArrayLike,
    setArray: function (elems) {
        this.length = 0;
        //设置length以及重排索引
        Array.prototype.push.apply(this, elems);
        return this;
    },
    makeArray: function (arr) {
        //把传入参数变成数组
        var ret = [],
            i;
        if (arr !== null) {
            i = arr.length;
            //单个元素，但window, string、 function有 'length'的属性，加其它的判断
            if (i === null || arr.split || arr.setInterval || arr.call) {
                ret[0] = arr;
            } else {
                try {
                    ret = Array.prototype.slice.call(arr);
                } catch (e) {
                    //Clone数组
                    while (i) ret[--i] = arr[i];
                }
            }
        }
        return ret;
    },
    toArray: function() {
        return Array.from(this);
    },
    toString: function () {
        //返回一个字符串
        var array = Array.prototype.slice.call(this);
        return array.toString();
    },
    valueOf: function () {
        return Array.prototype.slice.call(this);
    },
    get: function (num) {
        return num === undefined ? Array.prototype.slice.call(this) : this[num];
    },
    shift: arrayInstance.shift,
    push: arrayInstance.push,
    sort: arrayInstance.sort,
    pop: arrayInstance.pop,
    splice: arrayInstance.splice,
    concat: arrayInstance.concat,
    slice: arrayInstance.slice,
    forEach: arrayInstance.forEach,
    map: arrayInstance.map,
    filter: arrayInstance.filter,
    every: arrayInstance.every,
    some: arrayInstance.some,
    reduce: arrayInstance.reduce,
    reduceRight: arrayInstance.reduceRight,
    indexOf: arrayInstance.indexOf,
    lastIndexOf: arrayInstance.lastIndexOf,
    find: arrayInstance.find,
    findIndex: arrayInstance.findIndex,
    fill: arrayInstance.fill,
    includes: arrayInstance.includes
};

ui.ArrayLike = ArrayLike;


})(ui, $);

// Source: src/core/keyarray.js

(function(ui, $) {
/*
    字典数组，同时支持索引和hash访问数组元素
 */
var arrayInstance = [],
    base = ui.ArrayLike.prototype;
function rebuildIndex(obj, key) {
    var flag = false;
    for (var k in obj) {
        if (k === key) {
            flag = true;
            continue;
        }
        if (!flag) {
            continue;
        }
        obj[k] = --obj[k];
    }
}

function KeyArray () {
    if(this instanceof KeyArray) {
        this.initialize();
    } else {
        return new KeyArray();
    }
}
KeyArray.prototype = {
    constructor: KeyArray,
    isArray: base.isArray,
    setArray: base.setArray,
    makeArray: base.makeArray,
    forEach: base.forEach,
    filter: base.filter,
    toArray: base.toArray,
    toString: base.toString,
    valueOf: base.valueOf
};

// 初始化
KeyArray.prototype.initialize = function() {
    ui.ArrayLike.apply(this);
    this._keys = {};
};
/** 判断是否存在key */
KeyArray.prototype.containsKey = function (key) {
    return this._keys.hasOwnProperty(key);
};
/** 判断是否存在value */
KeyArray.prototype.containsValue = function(value) {
    var i, len = this.length;
    for(i = 0; i < len; i++) {
        if(this[i] === value) {
            return true;
        }
    }
    return false;
};
/** 设置值，如果没有则添加 */
KeyArray.prototype.set = function (key, value) {
    if (typeof key !== "string") {
        throw new TypeError("the key must be string");
    }
    if (this.containsKey(key)) {
        this[this._keys[key]] = value;
    } else {
        arrayInstance.push.apply(this, [value]);
        this._keys[key] = this.length - 1;
    }
};
/** 根据key获取value */
KeyArray.prototype.get = function (key) {
    if (this.containsKey(key)) {
        return this[this._keys[key]];
    } else {
        return null;
    }
};
/** 根据key移除value */
KeyArray.prototype.remove = function (key) {
    var index;
    if (this.containsKey(key)) {
        index = this._keys[key];
        arrayInstance.splice.call(this, index, 1);
        rebuildIndex(this._keys, key);
        delete this._keys[key];
    }
};
/** 根据索引移除value */
KeyArray.prototype.removeAt = function (index) {
    var key, flag, k;
    if (index >= 0 && index < this.length) {
        flag = false;
        for (k in this._keys) {
            if (this._keys[k] === index) {
                flag = true;
                key = k;
            }
            if (!flag) {
                continue;
            }
            this._keys[k] = --this._keys[k];
        }
        delete this._keys[key];
        arrayInstance.splice.apply(this, [index, 1]);
    }
};
/** 枚举所有的key值并用数组返回 */
KeyArray.prototype.keys = function() {
    return Object.keys(this._keys);
};
/** 清空 */
KeyArray.prototype.clear = function () {
    arrayInstance.splice.apply(this, [0, this.length]);
    this._keys = {};
};

ui.KeyArray = KeyArray;


})(ui, $);

// Source: src/core/linked-list.js

(function(ui, $) {
// LinkedList

function Node(element) {
    if(this instanceof Node) {
        this.initialize(element);
    } else {
        return new Node(element);
    }
}
Node.prototype = {
    constructor: Node,
    initialize: function(element) {
        this.element = element;
        this.next = null;
        this.previous = null;
    },
    hasNext: function() {
        return !!this.next;
    },
    hasProvious: function() {
        return !!this.previous;
    }
};

function LinkedList() {
    if(this instanceof LinkedList) {
        this.initialize();
    } else {
        return new LinkedList();
    }
}
LinkedList.prototype = {
    constructor: LinkedList,
    initialize: function() {
        this._first = null;
        this._last = null;
    },
    isEmpty: function() {
        return !this._first;
    },
    clear: function() {
        this._first = null;
        this._last = null;
    },
    /** 先进后出，返回最后一个元素，并移除 */
    pop: function() {
        return getAndRemove.call(this, true);
    },
    /** 将元素添加到末尾 */
    push: function(element) {
        insert.call(this, element, true);
    },
    /** 先进先出，返回第一个元素，并移除 */
    shift: function(element) {
        return getAndRemove.call(this, false);
    },
    /** 将元素添加到开头 */
    unshift: function() {
        insert.call(this, element, false);
    },
    /** 移除元素 */
    remove: function(element) {
        var anchor,
            currentNode;
        for (currentNode = this._first; currentNode instanceof Node; currentNode = currentNode.next) {
            if(currentNode.element !== element) {
                continue;
            }
            if (currentNode.prev && currentNode.next) {
                // middle
                anchor = currentNode.prev;
                anchor.next = currentNode.next;
                currentNode.next.prev = anchor;

            } else if (!currentNode.prev && !currentNode.next) {
                // only node
                this._first = null;
                this._last = null;

            } else if (!currentNode.next) {
                // last
                this._last = this._last.prev;
                this._last.next = null;

            } else if (!currentNode.prev) {
                // first
                this._first = this._first.next;
                this._first.prev = null;
            }
        }
    },
    /** 遍历 */
    forEach: function(fn, caller) {
        var currentNode,
            index;
        if(!ui.core.isFunction(fn)) {
            return;
        }
        index = 0;
        for(currentNode = this._first; 
            currentNode instanceof Node; 
            currentNode = currentNode.next, index++) {

            fn.call(caller, currentNode.element, index, this);
        }
    },
    /** 转换为数组 */
    toArray: function() {
        var arr = [];
        this.forEach(function(element) {
            arr.push(element);
        });
        return arr;
    }
};

function insert(element, atTheEnd) {
    var newNode = new Node(element),
        oldFirst,
        oldLast;

    if(this.isEmpty()) {
        this._first = newNode;
        this._last = newNode;
    } else if(atTheEnd) {
        // push
        oldLast = this._last;
        this._last = newNode;
        newNode.previous = oldLast;
        oldLast.next = newNode;
    } else {
        // unshift
        oldFirst = this._first;
        this._first = newNode;
        newNode.next = oldFirst;
        oldFirst.previous = newNode;
    }
}

function getAndRemove(atTheEnd) {
    var oldFirst,
        oldLast;
    if(this.isEmpty()) {
        return null;
    } else if(atTheEnd) {
        // pop
        oldLast = this._last;
        this._last = this._last.previous;
        return oldLast;
    } else {
        // shift
        oldFirst = this._first;
        this._first = this._first.next;
        return oldFirst;
    }
}

ui.LinkedList = LinkedList;

})(ui, $);

// Source: src/shims/jQuery/zepto.js

(function(ui, $) {
//     Zepto.js
//     (c) 2010-2017 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var Zepto = (function() {
  var undefined, key, $, classList, emptyArray = [], concat = emptyArray.concat, filter = emptyArray.filter, slice = emptyArray.slice,
    document = window.document,
    elementDisplay = {}, classCache = {},
    cssNumber = { 'column-count': 1, 'columns': 1, 'font-weight': 1, 'line-height': 1,'opacity': 1, 'z-index': 1, 'zoom': 1 },
    fragmentRE = /^\s*<(\w+|!)[^>]*>/,
    singleTagRE = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,
    tagExpanderRE = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
    rootNodeRE = /^(?:body|html)$/i,
    capitalRE = /([A-Z])/g,

    // special attributes that should be get/set via method calls
    methodAttributes = ['val', 'css', 'html', 'text', 'data', 'width', 'height', 'offset'],

    adjacencyOperators = [ 'after', 'prepend', 'before', 'append' ],
    table = document.createElement('table'),
    tableRow = document.createElement('tr'),
    containers = {
      'tr': document.createElement('tbody'),
      'tbody': table, 'thead': table, 'tfoot': table,
      'td': tableRow, 'th': tableRow,
      '*': document.createElement('div')
    },
    simpleSelectorRE = /^[\w-]*$/,
    class2type = {},
    toString = class2type.toString,
    zepto = {},
    camelize, uniq,
    tempParent = document.createElement('div'),
    propMap = {
      'tabindex': 'tabIndex',
      'readonly': 'readOnly',
      'for': 'htmlFor',
      'class': 'className',
      'maxlength': 'maxLength',
      'cellspacing': 'cellSpacing',
      'cellpadding': 'cellPadding',
      'rowspan': 'rowSpan',
      'colspan': 'colSpan',
      'usemap': 'useMap',
      'frameborder': 'frameBorder',
      'contenteditable': 'contentEditable'
    },
    isArray = Array.isArray ||
      function(object){ return object instanceof Array }

  zepto.matches = function(element, selector) {
    if (!selector || !element || element.nodeType !== 1) return false
    var matchesSelector = element.matches || element.webkitMatchesSelector ||
                          element.mozMatchesSelector || element.oMatchesSelector ||
                          element.matchesSelector
    if (matchesSelector) return matchesSelector.call(element, selector)
    // fall back to performing a selector:
    var match, parent = element.parentNode, temp = !parent
    if (temp) (parent = tempParent).appendChild(element)
    match = ~zepto.qsa(parent, selector).indexOf(element)
    temp && tempParent.removeChild(element)
    return match
  }

  function type(obj) {
    return obj == null ? String(obj) :
      class2type[toString.call(obj)] || "object"
  }

  function isFunction(value) { return type(value) == "function" }
  function isWindow(obj)     { return obj != null && obj == obj.window }
  function isDocument(obj)   { return obj != null && obj.nodeType == obj.DOCUMENT_NODE }
  function isObject(obj)     { return type(obj) == "object" }
  function isPlainObject(obj) {
    return isObject(obj) && !isWindow(obj) && Object.getPrototypeOf(obj) == Object.prototype
  }

  function likeArray(obj) {
    var length = !!obj && 'length' in obj && obj.length,
      type = $.type(obj)

    return 'function' != type && !isWindow(obj) && (
      'array' == type || length === 0 ||
        (typeof length == 'number' && length > 0 && (length - 1) in obj)
    )
  }

  function compact(array) { return filter.call(array, function(item){ return item != null }) }
  function flatten(array) { return array.length > 0 ? $.fn.concat.apply([], array) : array }
  camelize = function(str){ return str.replace(/-+(.)?/g, function(match, chr){ return chr ? chr.toUpperCase() : '' }) }
  function dasherize(str) {
    return str.replace(/::/g, '/')
           .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
           .replace(/([a-z\d])([A-Z])/g, '$1_$2')
           .replace(/_/g, '-')
           .toLowerCase()
  }
  uniq = function(array){ return filter.call(array, function(item, idx){ return array.indexOf(item) == idx }) }

  function classRE(name) {
    return name in classCache ?
      classCache[name] : (classCache[name] = new RegExp('(^|\\s)' + name + '(\\s|$)'))
  }

  function maybeAddPx(name, value) {
    return (typeof value == "number" && !cssNumber[dasherize(name)]) ? value + "px" : value
  }

  function defaultDisplay(nodeName) {
    var element, display
    if (!elementDisplay[nodeName]) {
      element = document.createElement(nodeName)
      document.body.appendChild(element)
      display = getComputedStyle(element, '').getPropertyValue("display")
      element.parentNode.removeChild(element)
      display == "none" && (display = "block")
      elementDisplay[nodeName] = display
    }
    return elementDisplay[nodeName]
  }

  function children(element) {
    return 'children' in element ?
      slice.call(element.children) :
      $.map(element.childNodes, function(node){ if (node.nodeType == 1) return node })
  }

  function Z(dom, selector) {
    var i, len = dom ? dom.length : 0
    for (i = 0; i < len; i++) this[i] = dom[i]
    this.length = len
    this.selector = selector || ''
  }

  // `$.zepto.fragment` takes a html string and an optional tag name
  // to generate DOM nodes from the given html string.
  // The generated DOM nodes are returned as an array.
  // This function can be overridden in plugins for example to make
  // it compatible with browsers that don't support the DOM fully.
  zepto.fragment = function(html, name, properties) {
    var dom, nodes, container

    // A special case optimization for a single tag
    if (singleTagRE.test(html)) dom = $(document.createElement(RegExp.$1))

    if (!dom) {
      if (html.replace) html = html.replace(tagExpanderRE, "<$1></$2>")
      if (name === undefined) name = fragmentRE.test(html) && RegExp.$1
      if (!(name in containers)) name = '*'

      container = containers[name]
      container.innerHTML = '' + html
      dom = $.each(slice.call(container.childNodes), function(){
        container.removeChild(this)
      })
    }

    if (isPlainObject(properties)) {
      nodes = $(dom)
      $.each(properties, function(key, value) {
        if (methodAttributes.indexOf(key) > -1) nodes[key](value)
        else nodes.attr(key, value)
      })
    }

    return dom
  }

  // `$.zepto.Z` swaps out the prototype of the given `dom` array
  // of nodes with `$.fn` and thus supplying all the Zepto functions
  // to the array. This method can be overridden in plugins.
  zepto.Z = function(dom, selector) {
    return new Z(dom, selector)
  }

  // `$.zepto.isZ` should return `true` if the given object is a Zepto
  // collection. This method can be overridden in plugins.
  zepto.isZ = function(object) {
    return object instanceof zepto.Z
  }

  // `$.zepto.init` is Zepto's counterpart to jQuery's `$.fn.init` and
  // takes a CSS selector and an optional context (and handles various
  // special cases).
  // This method can be overridden in plugins.
  zepto.init = function(selector, context) {
    var dom
    // If nothing given, return an empty Zepto collection
    if (!selector) return zepto.Z()
    // Optimize for string selectors
    else if (typeof selector == 'string') {
      selector = selector.trim()
      // If it's a html fragment, create nodes from it
      // Note: In both Chrome 21 and Firefox 15, DOM error 12
      // is thrown if the fragment doesn't begin with <
      if (selector[0] == '<' && fragmentRE.test(selector))
        dom = zepto.fragment(selector, RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // If it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // If a function is given, call it when the DOM is ready
    else if (isFunction(selector)) return $(document).ready(selector)
    // If a Zepto collection is given, just return it
    else if (zepto.isZ(selector)) return selector
    else {
      // normalize array if an array of nodes is given
      if (isArray(selector)) dom = compact(selector)
      // Wrap DOM nodes.
      else if (isObject(selector))
        dom = [selector], selector = null
      // If it's a html fragment, create nodes from it
      else if (fragmentRE.test(selector))
        dom = zepto.fragment(selector.trim(), RegExp.$1, context), selector = null
      // If there's a context, create a collection on that context first, and select
      // nodes from there
      else if (context !== undefined) return $(context).find(selector)
      // And last but no least, if it's a CSS selector, use it to select nodes.
      else dom = zepto.qsa(document, selector)
    }
    // create a new Zepto collection from the nodes found
    return zepto.Z(dom, selector)
  }

  // `$` will be the base `Zepto` object. When calling this
  // function just call `$.zepto.init, which makes the implementation
  // details of selecting nodes and creating Zepto collections
  // patchable in plugins.
  $ = function(selector, context){
    return zepto.init(selector, context)
  }

  function extend(target, source, deep) {
    for (key in source)
      if (deep && (isPlainObject(source[key]) || isArray(source[key]))) {
        if (isPlainObject(source[key]) && !isPlainObject(target[key]))
          target[key] = {}
        if (isArray(source[key]) && !isArray(target[key]))
          target[key] = []
        extend(target[key], source[key], deep)
      }
      else if (source[key] !== undefined) target[key] = source[key]
  }

  // Copy all but undefined properties from one or more
  // objects to the `target` object.
  $.extend = function(target){
    var deep, args = slice.call(arguments, 1)
    if (typeof target == 'boolean') {
      deep = target
      target = args.shift()
    }
    args.forEach(function(arg){ extend(target, arg, deep) })
    return target
  }

  // `$.zepto.qsa` is Zepto's CSS selector implementation which
  // uses `document.querySelectorAll` and optimizes for some special cases, like `#id`.
  // This method can be overridden in plugins.
  zepto.qsa = function(element, selector){
    var found,
        maybeID = selector[0] == '#',
        maybeClass = !maybeID && selector[0] == '.',
        nameOnly = maybeID || maybeClass ? selector.slice(1) : selector, // Ensure that a 1 char tag name still gets checked
        isSimple = simpleSelectorRE.test(nameOnly)
    return (element.getElementById && isSimple && maybeID) ? // Safari DocumentFragment doesn't have getElementById
      ( (found = element.getElementById(nameOnly)) ? [found] : [] ) :
      (element.nodeType !== 1 && element.nodeType !== 9 && element.nodeType !== 11) ? [] :
      slice.call(
        isSimple && !maybeID && element.getElementsByClassName ? // DocumentFragment doesn't have getElementsByClassName/TagName
          maybeClass ? element.getElementsByClassName(nameOnly) : // If it's simple, it could be a class
          element.getElementsByTagName(selector) : // Or a tag
          element.querySelectorAll(selector) // Or it's not simple, and we need to query all
      )
  }

  function filtered(nodes, selector) {
    return selector == null ? $(nodes) : $(nodes).filter(selector)
  }

  $.contains = document.documentElement.contains ?
    function(parent, node) {
      return parent !== node && parent.contains(node)
    } :
    function(parent, node) {
      while (node && (node = node.parentNode))
        if (node === parent) return true
      return false
    }

  function funcArg(context, arg, idx, payload) {
    return isFunction(arg) ? arg.call(context, idx, payload) : arg
  }

  function setAttribute(node, name, value) {
    value == null ? node.removeAttribute(name) : node.setAttribute(name, value)
  }

  // access className property while respecting SVGAnimatedString
  function className(node, value){
    var klass = node.className || '',
        svg   = klass && klass.baseVal !== undefined

    if (value === undefined) return svg ? klass.baseVal : klass
    svg ? (klass.baseVal = value) : (node.className = value)
  }

  // "true"  => true
  // "false" => false
  // "null"  => null
  // "42"    => 42
  // "42.5"  => 42.5
  // "08"    => "08"
  // JSON    => parse if valid
  // String  => self
  function deserializeValue(value) {
    try {
      return value ?
        value == "true" ||
        ( value == "false" ? false :
          value == "null" ? null :
          +value + "" == value ? +value :
          /^[\[\{]/.test(value) ? $.parseJSON(value) :
          value )
        : value
    } catch(e) {
      return value
    }
  }

  $.type = type
  $.isFunction = isFunction
  $.isWindow = isWindow
  $.isArray = isArray
  $.isPlainObject = isPlainObject

  $.isEmptyObject = function(obj) {
    var name
    for (name in obj) return false
    return true
  }

  $.isNumeric = function(val) {
    var num = Number(val), type = typeof val
    return val != null && type != 'boolean' &&
      (type != 'string' || val.length) &&
      !isNaN(num) && isFinite(num) || false
  }

  $.inArray = function(elem, array, i){
    return emptyArray.indexOf.call(array, elem, i)
  }

  $.camelCase = camelize
  $.trim = function(str) {
    return str == null ? "" : String.prototype.trim.call(str)
  }

  // plugin compatibility
  $.uuid = 0
  $.support = { }
  $.expr = { }
  $.noop = function() {}

  $.map = function(elements, callback){
    var value, values = [], i, key
    if (likeArray(elements))
      for (i = 0; i < elements.length; i++) {
        value = callback(elements[i], i)
        if (value != null) values.push(value)
      }
    else
      for (key in elements) {
        value = callback(elements[key], key)
        if (value != null) values.push(value)
      }
    return flatten(values)
  }

  $.each = function(elements, callback){
    var i, key
    if (likeArray(elements)) {
      for (i = 0; i < elements.length; i++)
        if (callback.call(elements[i], i, elements[i]) === false) return elements
    } else {
      for (key in elements)
        if (callback.call(elements[key], key, elements[key]) === false) return elements
    }

    return elements
  }

  $.grep = function(elements, callback){
    return filter.call(elements, callback)
  }

  if (window.JSON) $.parseJSON = JSON.parse

  // Populate the class2type map
  $.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
    class2type[ "[object " + name + "]" ] = name.toLowerCase()
  })

  // Define methods that will be available on all
  // Zepto collections
  $.fn = {
    constructor: zepto.Z,
    length: 0,

    // Because a collection acts like an array
    // copy over these useful array functions.
    forEach: emptyArray.forEach,
    reduce: emptyArray.reduce,
    push: emptyArray.push,
    sort: emptyArray.sort,
    splice: emptyArray.splice,
    indexOf: emptyArray.indexOf,
    concat: function(){
      var i, value, args = []
      for (i = 0; i < arguments.length; i++) {
        value = arguments[i]
        args[i] = zepto.isZ(value) ? value.toArray() : value
      }
      return concat.apply(zepto.isZ(this) ? this.toArray() : this, args)
    },

    // `map` and `slice` in the jQuery API work differently
    // from their array counterparts
    map: function(fn){
      return $($.map(this, function(el, i){ return fn.call(el, i, el) }))
    },
    slice: function(){
      return $(slice.apply(this, arguments))
    },

    ready: function(callback){
      // don't use "interactive" on IE <= 10 (it can fired premature)
      if (document.readyState === "complete" ||
          (document.readyState !== "loading" && !document.documentElement.doScroll))
        setTimeout(function(){ callback($) }, 0)
      else {
        var handler = function() {
          document.removeEventListener("DOMContentLoaded", handler, false)
          window.removeEventListener("load", handler, false)
          callback($)
        }
        document.addEventListener("DOMContentLoaded", handler, false)
        window.addEventListener("load", handler, false)
      }
      return this
    },
    get: function(idx){
      return idx === undefined ? slice.call(this) : this[idx >= 0 ? idx : idx + this.length]
    },
    toArray: function(){ return this.get() },
    size: function(){
      return this.length
    },
    remove: function(){
      return this.each(function(){
        if (this.parentNode != null)
          this.parentNode.removeChild(this)
      })
    },
    each: function(callback){
      emptyArray.every.call(this, function(el, idx){
        return callback.call(el, idx, el) !== false
      })
      return this
    },
    filter: function(selector){
      if (isFunction(selector)) return this.not(this.not(selector))
      return $(filter.call(this, function(element){
        return zepto.matches(element, selector)
      }))
    },
    add: function(selector,context){
      return $(uniq(this.concat($(selector,context))))
    },
    is: function(selector){
      return typeof selector == 'string' ? this.length > 0 && zepto.matches(this[0], selector) : 
          selector && this.selector == selector.selector
    },
    not: function(selector){
      var nodes=[]
      if (isFunction(selector) && selector.call !== undefined)
        this.each(function(idx){
          if (!selector.call(this,idx)) nodes.push(this)
        })
      else {
        var excludes = typeof selector == 'string' ? this.filter(selector) :
          (likeArray(selector) && isFunction(selector.item)) ? slice.call(selector) : $(selector)
        this.forEach(function(el){
          if (excludes.indexOf(el) < 0) nodes.push(el)
        })
      }
      return $(nodes)
    },
    has: function(selector){
      return this.filter(function(){
        return isObject(selector) ?
          $.contains(this, selector) :
          $(this).find(selector).size()
      })
    },
    eq: function(idx){
      return idx === -1 ? this.slice(idx) : this.slice(idx, + idx + 1)
    },
    first: function(){
      var el = this[0]
      return el && !isObject(el) ? el : $(el)
    },
    last: function(){
      var el = this[this.length - 1]
      return el && !isObject(el) ? el : $(el)
    },
    find: function(selector){
      var result, $this = this
      if (!selector) result = $()
      else if (typeof selector == 'object')
        result = $(selector).filter(function(){
          var node = this
          return emptyArray.some.call($this, function(parent){
            return $.contains(parent, node)
          })
        })
      else if (this.length == 1) result = $(zepto.qsa(this[0], selector))
      else result = this.map(function(){ return zepto.qsa(this, selector) })
      return result
    },
    closest: function(selector, context){
      var nodes = [], collection = typeof selector == 'object' && $(selector)
      this.each(function(_, node){
        while (node && !(collection ? collection.indexOf(node) >= 0 : zepto.matches(node, selector)))
          node = node !== context && !isDocument(node) && node.parentNode
        if (node && nodes.indexOf(node) < 0) nodes.push(node)
      })
      return $(nodes)
    },
    parents: function(selector){
      var ancestors = [], nodes = this
      while (nodes.length > 0)
        nodes = $.map(nodes, function(node){
          if ((node = node.parentNode) && !isDocument(node) && ancestors.indexOf(node) < 0) {
            ancestors.push(node)
            return node
          }
        })
      return filtered(ancestors, selector)
    },
    parent: function(selector){
      return filtered(uniq(this.pluck('parentNode')), selector)
    },
    children: function(selector){
      return filtered(this.map(function(){ return children(this) }), selector)
    },
    contents: function() {
      return this.map(function() { return this.contentDocument || slice.call(this.childNodes) })
    },
    siblings: function(selector){
      return filtered(this.map(function(i, el){
        return filter.call(children(el.parentNode), function(child){ return child!==el })
      }), selector)
    },
    empty: function(){
      return this.each(function(){ this.innerHTML = '' })
    },
    // `pluck` is borrowed from Prototype.js
    pluck: function(property){
      return $.map(this, function(el){ return el[property] })
    },
    show: function(){
      return this.each(function(){
        this.style.display == "none" && (this.style.display = '')
        if (getComputedStyle(this, '').getPropertyValue("display") == "none")
          this.style.display = defaultDisplay(this.nodeName)
      })
    },
    replaceWith: function(newContent){
      return this.before(newContent).remove()
    },
    wrap: function(structure){
      var func = isFunction(structure)
      if (this[0] && !func)
        var dom   = $(structure).get(0),
            clone = dom.parentNode || this.length > 1

      return this.each(function(index){
        $(this).wrapAll(
          func ? structure.call(this, index) :
            clone ? dom.cloneNode(true) : dom
        )
      })
    },
    wrapAll: function(structure){
      if (this[0]) {
        $(this[0]).before(structure = $(structure))
        var children
        // drill down to the inmost element
        while ((children = structure.children()).length) structure = children.first()
        $(structure).append(this)
      }
      return this
    },
    wrapInner: function(structure){
      var func = isFunction(structure)
      return this.each(function(index){
        var self = $(this), contents = self.contents(),
            dom  = func ? structure.call(this, index) : structure
        contents.length ? contents.wrapAll(dom) : self.append(dom)
      })
    },
    unwrap: function(){
      this.parent().each(function(){
        $(this).replaceWith($(this).children())
      })
      return this
    },
    clone: function(){
      return this.map(function(){ return this.cloneNode(true) })
    },
    hide: function(){
      return this.css("display", "none")
    },
    toggle: function(setting){
      return this.each(function(){
        var el = $(this)
        ;(setting === undefined ? el.css("display") == "none" : setting) ? el.show() : el.hide()
      })
    },
    prev: function(selector){ return $(this.pluck('previousElementSibling')).filter(selector || '*') },
    next: function(selector){ return $(this.pluck('nextElementSibling')).filter(selector || '*') },
    html: function(html){
      return 0 in arguments ?
        this.each(function(idx){
          var originHtml = this.innerHTML
          $(this).empty().append( funcArg(this, html, idx, originHtml) )
        }) :
        (0 in this ? this[0].innerHTML : null)
    },
    text: function(text){
      return 0 in arguments ?
        this.each(function(idx){
          var newText = funcArg(this, text, idx, this.textContent)
          this.textContent = newText == null ? '' : ''+newText
        }) :
        (0 in this ? this.pluck('textContent').join("") : null)
    },
    attr: function(name, value){
      var result
      return (typeof name == 'string' && !(1 in arguments)) ?
        (0 in this && this[0].nodeType == 1 && (result = this[0].getAttribute(name)) != null ? result : undefined) :
        this.each(function(idx){
          if (this.nodeType !== 1) return
          if (isObject(name)) for (key in name) setAttribute(this, key, name[key])
          else setAttribute(this, name, funcArg(this, value, idx, this.getAttribute(name)))
        })
    },
    removeAttr: function(name){
      return this.each(function(){ this.nodeType === 1 && name.split(' ').forEach(function(attribute){
        setAttribute(this, attribute)
      }, this)})
    },
    prop: function(name, value){
      name = propMap[name] || name
      return (typeof name == 'string' && !(1 in arguments)) ?
        (this[0] && this[0][name]) :
        this.each(function(idx){
          if (isObject(name)) for (key in name) this[propMap[key] || key] = name[key]
          else this[name] = funcArg(this, value, idx, this[name])
        })
    },
    removeProp: function(name){
      name = propMap[name] || name
      return this.each(function(){ delete this[name] })
    },
    data: function(name, value){
      var attrName = 'data-' + name.replace(capitalRE, '-$1').toLowerCase()

      var data = (1 in arguments) ?
        this.attr(attrName, value) :
        this.attr(attrName)

      return data !== null ? deserializeValue(data) : undefined
    },
    val: function(value){
      if (0 in arguments) {
        if (value == null) value = ""
        return this.each(function(idx){
          this.value = funcArg(this, value, idx, this.value)
        })
      } else {
        return this[0] && (this[0].multiple ?
           $(this[0]).find('option').filter(function(){ return this.selected }).pluck('value') :
           this[0].value)
      }
    },
    offset: function(coordinates){
      if (coordinates) return this.each(function(index){
        var $this = $(this),
            coords = funcArg(this, coordinates, index, $this.offset()),
            parentOffset = $this.offsetParent().offset(),
            props = {
              top:  coords.top  - parentOffset.top,
              left: coords.left - parentOffset.left
            }

        if ($this.css('position') == 'static') props['position'] = 'relative'
        $this.css(props)
      })
      if (!this.length) return null
      if (document.documentElement !== this[0] && !$.contains(document.documentElement, this[0]))
        return {top: 0, left: 0}
      var obj = this[0].getBoundingClientRect()
      return {
        left: obj.left + window.pageXOffset,
        top: obj.top + window.pageYOffset,
        width: Math.round(obj.width),
        height: Math.round(obj.height)
      }
    },
    css: function(property, value){
      if (arguments.length < 2) {
        var element = this[0]
        if (typeof property == 'string') {
          if (!element) return
          return element.style[camelize(property)] || getComputedStyle(element, '').getPropertyValue(property)
        } else if (isArray(property)) {
          if (!element) return
          var props = {}
          var computedStyle = getComputedStyle(element, '')
          $.each(property, function(_, prop){
            props[prop] = (element.style[camelize(prop)] || computedStyle.getPropertyValue(prop))
          })
          return props
        }
      }

      var css = ''
      if (type(property) == 'string') {
        if (!value && value !== 0)
          this.each(function(){ this.style.removeProperty(dasherize(property)) })
        else
          css = dasherize(property) + ":" + maybeAddPx(property, value)
      } else {
        for (key in property)
          if (!property[key] && property[key] !== 0)
            this.each(function(){ this.style.removeProperty(dasherize(key)) })
          else
            css += dasherize(key) + ':' + maybeAddPx(key, property[key]) + ';'
      }

      return this.each(function(){ this.style.cssText += ';' + css })
    },
    index: function(element){
      return element ? this.indexOf($(element)[0]) : this.parent().children().indexOf(this[0])
    },
    hasClass: function(name){
      if (!name) return false
      return emptyArray.some.call(this, function(el){
        return this.test(className(el))
      }, classRE(name))
    },
    addClass: function(name){
      if (!name) return this
      return this.each(function(idx){
        if (!('className' in this)) return
        classList = []
        var cls = className(this), newName = funcArg(this, name, idx, cls)
        newName.split(/\s+/g).forEach(function(klass){
          if (!$(this).hasClass(klass)) classList.push(klass)
        }, this)
        classList.length && className(this, cls + (cls ? " " : "") + classList.join(" "))
      })
    },
    removeClass: function(name){
      return this.each(function(idx){
        if (!('className' in this)) return
        if (name === undefined) return className(this, '')
        classList = className(this)
        funcArg(this, name, idx, classList).split(/\s+/g).forEach(function(klass){
          classList = classList.replace(classRE(klass), " ")
        })
        className(this, classList.trim())
      })
    },
    toggleClass: function(name, when){
      if (!name) return this
      return this.each(function(idx){
        var $this = $(this), names = funcArg(this, name, idx, className(this))
        names.split(/\s+/g).forEach(function(klass){
          (when === undefined ? !$this.hasClass(klass) : when) ?
            $this.addClass(klass) : $this.removeClass(klass)
        })
      })
    },
    scrollTop: function(value){
      if (!this.length) return
      var hasScrollTop = 'scrollTop' in this[0]
      if (value === undefined) return hasScrollTop ? this[0].scrollTop : this[0].pageYOffset
      return this.each(hasScrollTop ?
        function(){ this.scrollTop = value } :
        function(){ this.scrollTo(this.scrollX, value) })
    },
    scrollLeft: function(value){
      if (!this.length) return
      var hasScrollLeft = 'scrollLeft' in this[0]
      if (value === undefined) return hasScrollLeft ? this[0].scrollLeft : this[0].pageXOffset
      return this.each(hasScrollLeft ?
        function(){ this.scrollLeft = value } :
        function(){ this.scrollTo(value, this.scrollY) })
    },
    position: function() {
      if (!this.length) return

      var elem = this[0],
        // Get *real* offsetParent
        offsetParent = this.offsetParent(),
        // Get correct offsets
        offset       = this.offset(),
        parentOffset = rootNodeRE.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset()

      // Subtract element margins
      // note: when an element has margin: auto the offsetLeft and marginLeft
      // are the same in Safari causing offset.left to incorrectly be 0
      offset.top  -= parseFloat( $(elem).css('margin-top') ) || 0
      offset.left -= parseFloat( $(elem).css('margin-left') ) || 0

      // Add offsetParent borders
      parentOffset.top  += parseFloat( $(offsetParent[0]).css('border-top-width') ) || 0
      parentOffset.left += parseFloat( $(offsetParent[0]).css('border-left-width') ) || 0

      // Subtract the two offsets
      return {
        top:  offset.top  - parentOffset.top,
        left: offset.left - parentOffset.left
      }
    },
    offsetParent: function() {
      return this.map(function(){
        var parent = this.offsetParent || document.body
        while (parent && !rootNodeRE.test(parent.nodeName) && $(parent).css("position") == "static")
          parent = parent.offsetParent
        return parent
      })
    }
  }

  // for now
  $.fn.detach = $.fn.remove

  // Generate the `width` and `height` functions
  ;['width', 'height'].forEach(function(dimension){
    var dimensionProperty =
      dimension.replace(/./, function(m){ return m[0].toUpperCase() })

    $.fn[dimension] = function(value){
      var offset, el = this[0]
      if (value === undefined) return isWindow(el) ? el['inner' + dimensionProperty] :
        isDocument(el) ? el.documentElement['scroll' + dimensionProperty] :
        (offset = this.offset()) && offset[dimension]
      else return this.each(function(idx){
        el = $(this)
        el.css(dimension, funcArg(this, value, idx, el[dimension]()))
      })
    }
  })

  function traverseNode(node, fun) {
    fun(node)
    for (var i = 0, len = node.childNodes.length; i < len; i++)
      traverseNode(node.childNodes[i], fun)
  }

  // Generate the `after`, `prepend`, `before`, `append`,
  // `insertAfter`, `insertBefore`, `appendTo`, and `prependTo` methods.
  adjacencyOperators.forEach(function(operator, operatorIndex) {
    var inside = operatorIndex % 2 //=> prepend, append

    $.fn[operator] = function(){
      // arguments can be nodes, arrays of nodes, Zepto objects and HTML strings
      var argType, nodes = $.map(arguments, function(arg) {
            var arr = []
            argType = type(arg)
            if (argType == "array") {
              arg.forEach(function(el) {
                if (el.nodeType !== undefined) return arr.push(el)
                else if ($.zepto.isZ(el)) return arr = arr.concat(el.get())
                arr = arr.concat(zepto.fragment(el))
              })
              return arr
            }
            return argType == "object" || arg == null ?
              arg : zepto.fragment(arg)
          }),
          parent, copyByClone = this.length > 1
      if (nodes.length < 1) return this

      return this.each(function(_, target){
        parent = inside ? target : target.parentNode

        // convert all methods to a "before" operation
        target = operatorIndex == 0 ? target.nextSibling :
                 operatorIndex == 1 ? target.firstChild :
                 operatorIndex == 2 ? target :
                 null

        var parentInDocument = $.contains(document.documentElement, parent)

        nodes.forEach(function(node){
          if (copyByClone) node = node.cloneNode(true)
          else if (!parent) return $(node).remove()

          parent.insertBefore(node, target)
          if (parentInDocument) traverseNode(node, function(el){
            if (el.nodeName != null && el.nodeName.toUpperCase() === 'SCRIPT' &&
               (!el.type || el.type === 'text/javascript') && !el.src){
              var target = el.ownerDocument ? el.ownerDocument.defaultView : window
              target['eval'].call(target, el.innerHTML)
            }
          })
        })
      })
    }

    // after    => insertAfter
    // prepend  => prependTo
    // before   => insertBefore
    // append   => appendTo
    $.fn[inside ? operator+'To' : 'insert'+(operatorIndex ? 'Before' : 'After')] = function(html){
      $(html)[operator](this)
      return this
    }
  })

  zepto.Z.prototype = Z.prototype = $.fn

  // Export internal API functions in the `$.zepto` namespace
  zepto.uniq = uniq
  zepto.deserializeValue = deserializeValue
  $.zepto = zepto

  return $
})()

// If `$` is not yet defined, point it to `Zepto`
window.Zepto = Zepto
// window.$ === undefined && (window.$ = Zepto)

// jQuery initialize
ui.$ = Zepto
// 兼容 isJQueryObject
ui.$.fn.jquery = "zepto"
init_$(ui.$)


})(ui, $);

// Source: src/shims/jQuery/style.js

(function(ui, $) {
$.fn.getBoundingClientRect = function() {
  if(this.length === 0) {
    return undefined;
  }

  return this[0].getBoundingClientRect();
};

ui.core.each("Width, Height", function(name) {
  $.fn["outer" + name] = function() {
    var elem, docElem;
    if(this.length === 0) {
      return 0;
    }
    elem = this[0];
    if(ui.core.isWindow(elem)) {
      return elem["inner" + name];
    }
    if(elem.nodeType === 9) {
      docElem = elem.documentElement;
      return Math.max(
        elem.body["scroll" + name], 
        docElem["scroll" + name],
        elem.body["offset" + name], 
        docElem["offset" + name],
        docElem["client" + name]
      );
    }

    return this.getBoundingClientRect()[name.toLowerCase()];
  };
});


})(ui, $);

// Source: src/shims/jQuery/event.js

(function(ui, $) {
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

var _zid = 1, undefined,
    slice = Array.prototype.slice,
    isFunction = $.isFunction,
    isString = function(obj){ return typeof obj == 'string' },
    handlers = {},
    specialEvents={},
    focusinSupported = 'onfocusin' in window,
    focus = { focus: 'focusin', blur: 'focusout' },
    hover = { mouseenter: 'mouseover', mouseleave: 'mouseout' }

specialEvents.click = specialEvents.mousedown = specialEvents.mouseup = specialEvents.mousemove = 'MouseEvents'

function zid(element) {
  return element._zid || (element._zid = _zid++)
}
function findHandlers(element, event, fn, selector) {
  event = parse(event)
  if (event.ns) var matcher = matcherFor(event.ns)
  return (handlers[zid(element)] || []).filter(function(handler) {
    return handler
      && (!event.e  || handler.e == event.e)
      && (!event.ns || matcher.test(handler.ns))
      && (!fn       || zid(handler.fn) === zid(fn))
      && (!selector || handler.sel == selector)
  })
}
function parse(event) {
  var parts = ('' + event).split('.')
  return {e: parts[0], ns: parts.slice(1).sort().join(' ')}
}
function matcherFor(ns) {
  return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)')
}

function eventCapture(handler, captureSetting) {
  return handler.del &&
    (!focusinSupported && (handler.e in focus)) ||
    !!captureSetting
}

function realEvent(type) {
  return hover[type] || (focusinSupported && focus[type]) || type
}

function add(element, events, fn, data, selector, delegator, capture){
  var id = zid(element), set = (handlers[id] || (handlers[id] = []))
  events.split(/\s/).forEach(function(event){
    if (event == 'ready') return $(document).ready(fn)
    var handler   = parse(event)
    handler.fn    = fn
    handler.sel   = selector
    // emulate mouseenter, mouseleave
    if (handler.e in hover) fn = function(e){
      var related = e.relatedTarget
      if (!related || (related !== this && !$.contains(this, related)))
        return handler.fn.apply(this, arguments)
    }
    handler.del   = delegator
    var callback  = delegator || fn
    handler.proxy = function(e){
      e = compatible(e)
      if (e.isImmediatePropagationStopped()) return
      e.data = data
      var result = callback.apply(element, e._args == undefined ? [e] : [e].concat(e._args))
      if (result === false) e.preventDefault(), e.stopPropagation()
      return result
    }
    handler.i = set.length
    set.push(handler)
    if ('addEventListener' in element)
      element.addEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
  })
}
function remove(element, events, fn, selector, capture){
  var id = zid(element)
  ;(events || '').split(/\s/).forEach(function(event){
    findHandlers(element, event, fn, selector).forEach(function(handler){
      delete handlers[id][handler.i]
    if ('removeEventListener' in element)
      element.removeEventListener(realEvent(handler.e), handler.proxy, eventCapture(handler, capture))
    })
  })
}

$.event = { add: add, remove: remove }

$.proxy = function(fn, context) {
  var args = (2 in arguments) && slice.call(arguments, 2)
  if (isFunction(fn)) {
    var proxyFn = function(){ return fn.apply(context, args ? args.concat(slice.call(arguments)) : arguments) }
    proxyFn._zid = zid(fn)
    return proxyFn
  } else if (isString(context)) {
    if (args) {
      args.unshift(fn[context], fn)
      return $.proxy.apply(null, args)
    } else {
      return $.proxy(fn[context], fn)
    }
  } else {
    throw new TypeError("expected function")
  }
}

$.fn.bind = function(event, data, callback){
  return this.on(event, data, callback)
}
$.fn.unbind = function(event, callback){
  return this.off(event, callback)
}
$.fn.one = function(event, selector, data, callback){
  return this.on(event, selector, data, callback, 1)
}

var returnTrue = function(){return true},
    returnFalse = function(){return false},
    ignoreProperties = /^([A-Z]|returnValue$|layer[XY]$|webkitMovement[XY]$)/,
    eventMethods = {
      preventDefault: 'isDefaultPrevented',
      stopImmediatePropagation: 'isImmediatePropagationStopped',
      stopPropagation: 'isPropagationStopped'
    }

function compatible(event, source) {
  if (source || !event.isDefaultPrevented) {
    source || (source = event)

    $.each(eventMethods, function(name, predicate) {
      var sourceMethod = source[name]
      event[name] = function(){
        this[predicate] = returnTrue
        return sourceMethod && sourceMethod.apply(source, arguments)
      }
      event[predicate] = returnFalse
    })

    try {
      event.timeStamp || (event.timeStamp = Date.now())
    } catch (ignored) { }

    if (source.defaultPrevented !== undefined ? source.defaultPrevented :
        'returnValue' in source ? source.returnValue === false :
        source.getPreventDefault && source.getPreventDefault())
      event.isDefaultPrevented = returnTrue
  }
  return event
}

function createProxy(event) {
  var key, proxy = { originalEvent: event }
  for (key in event)
    if (!ignoreProperties.test(key) && event[key] !== undefined) proxy[key] = event[key]

  return compatible(proxy, event)
}

$.fn.delegate = function(selector, event, callback){
  return this.on(event, selector, callback)
}
$.fn.undelegate = function(selector, event, callback){
  return this.off(event, selector, callback)
}

$.fn.live = function(event, callback){
  $(document.body).delegate(this.selector, event, callback)
  return this
}
$.fn.die = function(event, callback){
  $(document.body).undelegate(this.selector, event, callback)
  return this
}

$.fn.on = function(event, selector, data, callback, one){
  var autoRemove, delegator, $this = this
  if (event && !isString(event)) {
    $.each(event, function(type, fn){
      $this.on(type, selector, data, fn, one)
    })
    return $this
  }

  if (!isString(selector) && !isFunction(callback) && callback !== false)
    callback = data, data = selector, selector = undefined
  if (callback === undefined || data === false)
    callback = data, data = undefined

  if (callback === false) callback = returnFalse

  return $this.each(function(_, element){
    if (one) autoRemove = function(e){
      remove(element, e.type, callback)
      return callback.apply(this, arguments)
    }

    if (selector) delegator = function(e){
      var evt, match = $(e.target).closest(selector, element).get(0)
      if (match && match !== element) {
        evt = $.extend(createProxy(e), {currentTarget: match, liveFired: element})
        return (autoRemove || callback).apply(match, [evt].concat(slice.call(arguments, 1)))
      }
    }

    add(element, event, callback, data, selector, delegator || autoRemove)
  })
}
$.fn.off = function(event, selector, callback){
  var $this = this
  if (event && !isString(event)) {
    $.each(event, function(type, fn){
      $this.off(type, selector, fn)
    })
    return $this
  }

  if (!isString(selector) && !isFunction(callback) && callback !== false)
    callback = selector, selector = undefined

  if (callback === false) callback = returnFalse

  return $this.each(function(){
    remove(this, event, callback, selector)
  })
}

$.fn.trigger = function(event, args){
  event = (isString(event) || $.isPlainObject(event)) ? $.Event(event) : compatible(event)
  event._args = args
  return this.each(function(){
    // handle focus(), blur() by calling them directly
    if (event.type in focus && typeof this[event.type] == "function") this[event.type]()
    // items in the collection might not be DOM elements
    else if ('dispatchEvent' in this) this.dispatchEvent(event)
    else $(this).triggerHandler(event, args)
  })
}

// triggers event handlers on current element just as if an event occurred,
// doesn't trigger an actual event, doesn't bubble
$.fn.triggerHandler = function(event, args){
  var e, result
  this.each(function(i, element){
    e = createProxy(isString(event) ? $.Event(event) : event)
    e._args = args
    e.target = element
    $.each(findHandlers(element, event.type || event), function(i, handler){
      result = handler.proxy(e)
      if (e.isImmediatePropagationStopped()) return false
    })
  })
  return result
}

// shortcut methods for `.bind(event, fn)` for each event type
;('focusin focusout focus blur load resize scroll unload click dblclick '+
'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave '+
'change select keydown keypress keyup error').split(' ').forEach(function(event) {
  $.fn[event] = function(callback) {
    return (0 in arguments) ?
      this.bind(event, callback) :
      this.trigger(event)
  }
})

$.Event = function(type, props) {
  if (!isString(type)) props = type, type = props.type
  var event = document.createEvent(specialEvents[type] || 'Events'), bubbles = true
  if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
  event.initEvent(type, bubbles, true)
  return compatible(event)
}


})(ui, $);

// Source: src/shims/jQuery/ie.js

(function(ui, $) {
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

;(function(){
  // getComputedStyle shouldn't freak out when called
  // without a valid element as argument
  try {
    getComputedStyle(undefined)
  } catch(e) {
    var nativeGetComputedStyle = getComputedStyle
    window.getComputedStyle = function(element, pseudoElement){
      try {
        return nativeGetComputedStyle(element, pseudoElement)
      } catch(e) {
        return null
      }
    }
  }
})()


})(ui, $);

// Source: src/shims/jQuery/data.js

(function(ui, $) {
//     Zepto.js
//     (c) 2010-2016 Thomas Fuchs
//     Zepto.js may be freely distributed under the MIT license.

// The following code is heavily inspired by jQuery's $.fn.data()

var data = {}, 
    dataAttr = $.fn.data, 
    camelize = $.camelCase,
    exp = $.expando = 'Zepto' + (+new Date()), 
    emptyArray = []

  // Get value from node:
  // 1. first try key as given,
  // 2. then try camelized key,
  // 3. fall back to reading "data-*" attribute.
  function getData(node, name) {
    var id = node[exp], store = id && data[id]
    if (name === undefined) return store || setData(node)
    else {
      if (store) {
        if (name in store) return store[name]
        var camelName = camelize(name)
        if (camelName in store) return store[camelName]
      }
      return dataAttr.call($(node), name)
    }
  }

  // Store value under camelized key on node
  function setData(node, name, value) {
    var id = node[exp] || (node[exp] = ++$.uuid),
      store = data[id] || (data[id] = attributeData(node))
    if (name !== undefined) store[camelize(name)] = value
    return store
  }

  // Read all "data-*" attributes from a node
  function attributeData(node) {
    var store = {}
    $.each(node.attributes || emptyArray, function(i, attr){
      if (attr.name.indexOf('data-') == 0)
        store[camelize(attr.name.replace('data-', ''))] =
          $.zepto.deserializeValue(attr.value)
    })
    return store
  }

  $.fn.data = function(name, value) {
    return value === undefined ?
      // set multiple values via object
      $.isPlainObject(name) ?
        this.each(function(i, node){
          $.each(name, function(key, value){ setData(node, key, value) })
        }) :
        // get value from first element
        (0 in this ? getData(this[0], name) : undefined) :
      // set value on all elements
      this.each(function(){ setData(this, name, value) })
  }

  $.data = function(elem, name, value) {
    return $(elem).data(name, value)
  }

  $.hasData = function(elem) {
    var id = elem[exp], store = id && data[id]
    return store ? !$.isEmptyObject(store) : false
  }

  $.fn.removeData = function(names) {
    if (typeof names == 'string') names = names.split(/\s+/)
    return this.each(function(){
      var id = this[exp], store = id && data[id]
      if (store) $.each(names || store, function(key){
        delete store[names ? camelize(this) : key]
      })
    })
  }

  // Generate extended `remove` and `empty` functions
  ;['remove', 'empty'].forEach(function(methodName){
    var origFn = $.fn[methodName]
    $.fn[methodName] = function() {
      var elements = this.find('*')
      if (methodName === 'remove') elements = elements.add(this)
      elements.removeData()
      return origFn.call(this)
    }
  })


})(ui, $);

// Source: src/shims/jQuery/jQuery-extend.js

(function(ui, $) {
// jQuery extends

var rword = /[^, ]+/g,
    ieVersion,
    DOC = document;
//判断IE版本
function IE() {
    if (window.VBArray) {
        var mode = DOC.documentMode;
        return mode ? mode : (window.XMLHttpRequest ? 7 : 6);
    } else {
        return 0;
    }
}
ieVersion = IE();

/** 为jquery添加一个获取元素标签类型的方法 */
$.fn.nodeName = function () {
    var nodeName = this.prop("nodeName");
    if(this.length === 0 || !nodeName) {
        return null;
    }
    return nodeName;
};

/** 判断元素的tagName，不区分大小写 */
$.fn.isNodeName = function(nodeName) {
    return this.nodeName() === (nodeName + "").toUpperCase();
};

/** 判断一个元素是否出现了横向滚动条 */
$.fn.hasHorizontalScroll = function() {
    var overflowValue = this.css("overflow");
    if(overflowValue === "visible" || overflowValue === "hidden") {
        return false;
    } else if(overflowValue === "scroll") {
        return true;
    } else {
        return this.get(0).scrollWidth > this.width();
    }
};

/** 判断一个元素是否出现了纵向滚动条 */
$.fn.hasVerticalScroll = function() {
    var overflowValue = this.css("overflow");
    if(overflowValue === "visible" || overflowValue === "hidden") {
        return false;
    } else if(overflowValue === "scroll") {
        return true;
    } else {
        return this.get(0).scrollHeight > this.height();
    }
};

/** 填充select下拉框的选项 */
$.fn.bindOptions = function (arr, valueField, textField) {
    if (this.nodeName() !== "SELECT") {
        return this;
    }
    if (!valueField) {
        valueField = "value";
    }
    if (!textField) {
        textField = "text";
    }
    if (!arr.length) {
        return this;
    }
    var i, len = arr.length,
        item, options = [];
    for (i = 0; i < len; i++) {
        item = arr[i];
        if (!item) {
            continue;
        }
        options.push("<option value='", item[valueField], "'>", item[textField], "</option>");
    }
    this.html(options.join(""));
    return this;
};

/** 获取一个select元素当前选中的value和text */
$.fn.selectOption = function () {
    if (this.nodeName() !== "SELECT") {
        return null;
    }
    var option = {
        value: this.val(),
        text: null
    };
    option.text = this.children("option[value='" + option.value + "']").text();
    return option;
};

/** 为jquery添加鼠标滚轮事件 */
/*
$.fn.mousewheel = function (data, fn) {
    var mouseWheelEventName = eventSupported("mousewheel", this) ? "mousewheel" : "DOMMouseScroll";
    return arguments.length > 0 ?
        this.on(mouseWheelEventName, null, data, fn) :
        this.trigger(mouseWheelEventName);
};
if($.fn.jquery >= "3.0.0") {
    "mousewheel DOMMouseScroll".replace(rword, function (name) {
        $.event.special[ name ] = {
            delegateType: name,
            bindType: name,
            handle: function( event ) {
                var delta = 0,
                    originalEvent = event.originalEvent,
                    ret,
                    handleObj = event.handleObj;

                fixMousewheelDelta(event, originalEvent);
                ret = handleObj.handler.apply( this, arguments );
                return ret;
            }
        };
    });
} else {
    "mousewheel DOMMouseScroll".replace(rword, function (name) {
        $.event.fixHooks[name] = {
            filter: fixMousewheelDelta
        };
    });
}
function fixMousewheelDelta(event, originalEvent) {
    var delta = 0;
    if (originalEvent.wheelDelta) {
        delta = originalEvent.wheelDelta / 120;
        //opera 9x系列的滚动方向与IE保持一致，10后修正 
        if (window.opera && window.opera.version() < 10)
            delta = -delta;
    } else if (originalEvent.detail) {
        delta = -originalEvent.detail / 3;
    }
    event.delta = Math.round(delta);
    return event;
}
function eventSupported(eventName, elem) {
    if (ui.core.isDomObject(elem)) {
        elem = $(elem);
    } else if (ui.core.isJQueryObject(elem) && elem.length === 0) {
        return false;
    }
    eventName = "on" + eventName;
    var isSupported = (eventName in elem[0]);
    if (!isSupported) {
        elem.attr(eventName, "return;");
        isSupported = ui.core.type(elem[eventName]) === "function";
    }
    return isSupported;
}
*/

if(ieVersion) {
    $(DOC).on("selectionchange", function(e) {
        var el = DOC.activeElement;
        if (el && typeof el.uiEventSelectionChange === "function") {
            el.uiEventSelectionChange();
        }
    });
}
/** 为jquery添加文本框输入事件 */
$.fn.textinput = function(data, fn) {
    var eventData,
        composing,
        eventMock,
        nodeName;

    if(this.length === 0) {
        return;
    }
    if(ui.core.isFunction(data)) {
        fn = data;
        data = null;
    }
    if(!ui.core.isFunction(fn)) {
        return;
    }

    eventMock = { data: data, target: this[0] };
    composing = false;
    nodeName = this.nodeName();
    if(nodeName !== "INPUT" && nodeName !== "TEXTAREA") {
        return;
    }

    if(ieVersion) {
        //监听IE点击input右边的X的清空行为
        if(ieVersion === 9) {
            //IE9下propertychange不监听粘贴，剪切，删除引发的变动
            this[0].uiEventSelectionChange = function() {
                fn(eventMock);
            };
        }
        if (ieVersion > 8) {
            //IE9使用propertychange无法监听中文输入改动
            this.on("input", null, data, fn);
        } else {
            //IE6-8下第一次修改时不会触发,需要使用keydown或selectionchange修正
            this.on("propertychange", function(e) {
                var propertyName = e.originalEvent ? e.originalEvent.propertyName : e.propertyName;
                if (propertyName === "value") {
                    fn(eventMock);
                }
            });
            this.on("dragend", null, data, function (e) {
                setTimeout(function () {
                    fn(e);
                });
            });
        }
    } else {
        this.on("input", null, data, function(e) {
            //处理中文输入法在maxlengh下引发的BUG
            if(composing) {
                return;
            }
            fn(e);
        });
        //非IE浏览器才用这个
        this.on("compositionstart", function(e) {
            composing = true;
        });
        this.on("compositionend", function(e) {
            composing = false;
            fn(e);
        });
    }
    return this;
};


})(ui, $);

// Source: src/core/utils/util.js

(function(ui, $) {
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
    return box;
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

//将元素移动到目标元素下方
ui.setDown = function (target, panel) {
    setLocation(ui.getDownLocation, target, panel);
};

//将元素移动到目标元素左边
ui.setLeft = function (target, panel) {
    setLocation(ui.getLeftLocation, target, panel);
};

//获取目标元素下方的坐标信息
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

//获取目标元素左边的坐标信息
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


})(ui, $);

// Source: src/core/utils/util-string.js

(function(ui, $) {
// string util

var textEmpty = "";
// text format
var textFormatReg = /\\?\{([^{}]+)\}/gm;
var htmlEncodeSpan;
// base64
var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function _utf8_encode(string) {
    var utftext = textEmpty,
        c;
    string = string.replace(/\r\n/g, "\n");
    for (var n = 0; n < string.length; n++) {
        c = string.charCodeAt(n);
        if (c < 128) {
            utftext += String.fromCharCode(c);
        }
        else if ((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
        }
    }
    return utftext;
}
function _utf8_decode (utftext) {
    var string = textEmpty;
    var i = 0,
        c = 0, 
        c3 = 0, 
        c2 = 0;
    while (i < utftext.length) {
        c = utftext.charCodeAt(i);
        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        }
        else if ((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i + 1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = utftext.charCodeAt(i + 1);
            c3 = utftext.charCodeAt(i + 2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }
    }
    return string;
}

ui.str = {
    /** 空字符串 */
    empty: textEmpty,
    /** 字符串遍历，通过[ ]和[,]分割 */
    each: ui.core.each,
    /** 修剪字符串，支持自定义修剪的字符，默认是空格，性能并不是最优，所以如果只是想trim的话推荐使用String.prototype.trim */
    trim: function (str, trimChar) {
        if (typeof str !== "string") {
            return str;
        }
        if (!trimChar) {
            trimChar = "\\s";
        }
        return str.replace(
            new RegExp("(^" + trimChar + "*)|(" + trimChar + "*$)", "g"), textEmpty);
    },
    /** 修剪字符串左边的字符 */
    trimLeft: function (str, trimChar) {
        if (typeof str !== "string") {
            return str;
        }
        if (!trimChar) {
            trimChar = "\\s";
        }
        return str.replace(
            new RegExp("(^" + trimChar + "*)", "g"), textEmpty);
    },
    /** 修剪字符串右边的字符 */
    trimRight: function (str, trimChar) {
        if (typeof str !== "string") {
            return str;
        }
        if (!trimChar) {
            trimChar = "\\s";
        }
        return str.replace(
            new RegExp("(" + trimChar + "*$)", "g"), textEmpty);
    },
    /** 判断是否为空 null, undefined, empty return true */
    isEmpty: function (str) {
        return str === undefined || str === null || 
                (typeof str === "string" && str.length === 0);
    },
    /** 判断是否全是空白 null, undefined, empty, blank return true */
    isBlank: function(str) {
        var i, len;
        if(str === undefined || str === null) {
            return true;
        }
        if(ui.core.isString(str)) {
            for(i = 0, len = str.length; i < len; i++) {
                if(str.charCodeAt(i) != 32) {
                    return false;
                }
            }
            return true;
        }
    },
    /** 格式化字符串，Format("He{0}{1}o", "l", "l") 返回 Hello */
    format: function (str, params) {
        var Arr_slice = Array.prototype.slice;
        var array = Arr_slice.call(arguments, 1);
        if(!str) {
            return textEmpty;
        }
        return str.replace(textFormatReg, function (match, name) {
            var index;
            if (match.charAt(0) == '\\') {
                return match.slice(1);
            }
            index = Number(name);
            if (index >= 0) {
                return array[index];
            }
            if (params && params[name]) {
                return params[name];
            }
            return '';
        });
    },
    /** base64编码 */
    base64Encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        if(!input) {
            return input;
        }
        input = _utf8_encode(input);

        while (i < input.length) {
            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);
            
            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }
            output = output +
                _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
                _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
        }
        return output;
    },
    /** base64解码 */
    base64Decode: function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        if(!input) {
            return input;
        }

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {
            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = _utf8_decode(output);
        return output;
    },
    /** html编码 */
    htmlEncode: function(str) {
        if (this.isEmpty(str)) {
            return textEmpty;
        }
        var i, index, len,
            arr = [], code;
        i = index = 0;
        len = str.length;
        for(; i < len; i++) {
            code = str.charAt(i);
            switch(code) {
                case ">" :
                    arr.push(str.substring(index, i), "&gt;");
                    index = i + 1;
                    break;
                case "<" :
                    arr.push(str.substring(index, i), "&lt;");
                    index = i + 1;
                    break;
                case "&" :
                    arr.push(str.substring(index, i), "&amp;");
                    index = i + 1;
                    break;
                case "'" :
                    arr.push(str.substring(index, i), "&#39;");
                    index = i + 1;
                    break;
                case '"' :
                    arr.push(str.substring(index, i), "&quot;");
                    index = i + 1;
                    break;
            }
        }
        if(index < len) {
            arr.push(str.substring(index));
        }
        return arr.join("");
    },
    /** html解码 */
    htmlDecode: function(str) {
        if (this.isEmpty(str)) {
            return textEmpty;
        }
        if(!htmlEncodeSpan) {
            htmlEncodeSpan = document.createElement("span");
        }
        htmlEncodeSpan.innerHTML = str;
        return htmlEncodeSpan.innerText;
    },
    /** 格式化小数位数 */
    numberScaleFormat: function (num, zeroCount) {
        var integerText,
            scaleText,
            index,
            i, len;
        if (isNaN(num))
            return null;
        if (isNaN(zeroCount))
            zeroCount = 2;
        num = ui.fixedNumber(num, zeroCount);
        integerText = num + textEmpty;
        index = integerText.indexOf(".");
        if (index < 0) {
            scaleText = textEmpty;
        } else {
            scaleText = integerText.substring(index + 1);
            integerText = integerText.substring(0, index);
        }

        for (i = 0, len = zeroCount - scaleText.length; i < len; i++) {
            scaleText += "0";
        }
        return integerText + "." + scaleText;
    },
    /** 格式化整数位数 */
    integerFormat: function (num, count) {
        var numText, i, len;
        num = parseInt(num, 10);
        if (isNaN(num)) {
            return NaN;
        }
        if (isNaN(count)) {
            count = 8;
        }
        numText = num + textEmpty;
        for (i = 0, len = count - numText.length; i < len; i++) {
            numText = "0" + numText;
        }
        return numText;
    },
    /** 货币格式化，每千位插入一个逗号 */
    moneyFormat: function (value, symbol) {
        var content,
            arr,
            index,
            result,
            i;
        if (!symbol) {
            symbol = "￥";
        }
        content = ui.str.numberScaleFormat(value, 2);
        if (!content) {
            return content;
        }
        arr = content.split(".");
        content = arr[0];
        index = 0;
        result = [];
        for (i = content.length - 1; i >= 0; i--) {
            if (index == 3) {
                index = 0;
                result.push(",");
            }
            index++;
            result.push(content.charAt(i));
        }
        result.push(symbol);
        result.reverse();
        result.push(".", arr[1]);
        return result.join(textEmpty);
    }
};


})(ui, $);

// Source: src/core/utils/util-date.js

(function(ui, $) {
// ISO 8601日期和时间表示法 https://en.wikipedia.org/wiki/ISO_8601

/*
 'yyyy': 4位数字年份，会补零 (e.g. AD 1 => 0001, AD 2010 => 2010)
 'yy': 2位数字年份 (e.g. AD 2001 => 01, AD 2010 => 10)
 'y': 不固定位数年份, e.g. (AD 1 => 1, AD 199 => 199)
 'MMMM': 完整月份 (January-December)
 'MMM': 简写月份 (Jan-Dec)
 'MM': 2位数字月份, padded (01-12)
 'M': 不固定位数月份 (1-12)
 'dd': 2位数字日期, padded (01-31)
 'd': 不固定位数日期 (1-31)
 'EEEE': 完整星期表示,(Sunday-Saturday)
 'EEE': 简写星期表示, (Sun-Sat)
 'HH': 2位数字小时, padded (00-23)
 'H': 不固定位数小时 (0-23)
 'hh': 2位数字12小时表示, padded (01-12)
 'h': 不固定位数12小时表示, (1-12)
 'mm': 2位数字分钟, padded (00-59)
 'm': 不固定位数分钟 (0-59)
 'ss': 2位数字秒, padded (00-59)
 's': 不固定位数秒 (0-59)
 'S': 毫秒数 (0-999)
 't': AM和PM的第一个字符(A/P)
 'tt': AM/PM
 'Z': 时区格式化如(+08:00)
 格式化别名:
 
 'default': 'yyyy-MM-dd HH:mm:ss'
 'medium': 'yyyy-MM-dd HH:mm'
 'date': 'yyyy-MM-dd'
 'longDate': 'yyyy-MM-dd EEEE',
 'shortDate': 'y-M'
 'time': 'HH:mm:ss'
 'shortTime': 'HH:mm'
 'time12': 'h:m:s tt'
 'shortTime12': 'h:m tt'
 */

var formatters,
    parsers,
    locale;
var rFormat = /((?:[^yMdHhmsStZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|S|t+|Z))(.*)/,
    rAspNetFormat = /^\/Date\((\d+)\)\/$/;
var lastFormat,
    lastParts;

function noop() {}

function toInt(str) {
    return parseInt(str, 10) || 0;
}

function padNumber(num, digits, isTrim) {
    var negative = "";
    if(num < 0) {
        negative = "-";
        num = -num;
    }
    num += "";
    while(num.length < digits) {
        num = "0" + num;
    }
    if(isTrim && num.length > digits) {
        num = num.substring(num.length - digits);
    }
    return negative + num;
}

function dateGetter(name, len, offset, isTrim) {
    return function(date) {
        var value = date["get" + name]();
        if(offset > 0 || value > -offset) {
            value += offset;
        }
        if(value === 0 && offset === -12) {
            // 如果是0点，并且是12个小时制，则将0点改为12点
            value = 12;
        }
        return padNumber(value, len, isTrim);
    };
}

function dateStrGetter(name, shortForm) {
    return function(date, formats) {
        var value = date["get" + name](),
            key = (shortForm ? ("SHORT" + name) : name).toUpperCase();
        return formats[key][value];
    };
}

function getTimeZone(date) {
    var zone,
        result;

    zone = date.getTimezoneOffset();
    if(zone === 0) {
        return "Z";
    }

    zone *= -1;
    result = "";
    if(zone >= 0) {
        result += "+";
    }
    if(zone > 0) {
        result += padNumber(Math.floor(zone / 60), 2);
    } else {
        result += padNumber(Math.ceil(zone / 60), 2);
    }
    result += ":" + padNumber(Math.abs(zone % 60), 2);

    return result;
}

function ampmGetter(len) {
    return function(date) {
        var value = date.getHours(),
            result = value > 12 ? "PM" : "AM";
        if(result.length > len) {
            result = result.substring(0, len);
        }
        return result;
    };
}

formatters = {
    "yyyy": dateGetter("FullYear", 4),
    "yy": dateGetter("FullYear", 2, 0, true),
    "y": dateGetter("FullYear", 1),
    "MMMM": dateStrGetter("Month"),
    "MMM": dateStrGetter("Month", true),
    "MM": dateGetter("Month", 2, 1),
    "M": dateGetter("Month", 1, 1),
    "dd": dateGetter("Date", 2),
    "d": dateGetter("Date", 1),
    "EEEE": dateStrGetter("Day"),
    "EEE": dateStrGetter("Day", true),
    "HH": dateGetter("Hours", 2),
    "H": dateGetter("Hours", 1),
    "hh": dateGetter("Hours", 2, -12),
    "h": dateGetter("Hours", 1, -12),
    "mm": dateGetter("Minutes", 2),
    "m": dateGetter("Minutes", 1),
    "ss": dateGetter("Seconds", 2),
    "s": dateGetter("Seconds", 1),
    "S": dateGetter("Milliseconds", 3),
    "t": ampmGetter(1),
    "tt": ampmGetter(2),
    "Z": getTimeZone
};

function getDateParser(name) {
    return function(value, dateInfo) {
        dateInfo[name] = toInt(value);
    };
}

function ampmParser(value, dateInfo) {
    value = value.toUpperCase();
    if(value === "P" || value === "PM") {
        dateInfo.AMPM = "PM";
    } else {
        dateInfo.AMPM = "AM";
    }

    if(dateInfo.hours > 0) {
        hour12Parser(dateInfo.hours, dateInfo);
    }
}

function hour12Parser(value, dateInfo) {
    dateInfo.hours = toInt(value);
    if(dateInfo.hasOwnProperty("AMPM")) {
        if(dateInfo.AMPM === "PM" && dateInfo.hours > 0) {
            dateInfo.hours += 12;
            if(dateInfo.hours >= 24) {
                dateInfo.hours = 0;
            }
        }
    }
}

function monthTextParser(value, dateInfo, parts, index) {
    var part, name;
    part = parts[index];
    name = (part.length === 4 ? "" : "SHORT") + "MONTH_MAPPING";
    if(!locale[name]) {
        dateInfo.month = NaN;
        return;
    }
    dateInfo.month = locale[name][value] || NaN;
}

function parseTimeZone(dateStr, startIndex, dateInfo, parts, index) {
    var part = parts[index],
        datePart,
        timeZonePart,
        hour, minute,
        skip = startIndex,
        char,
        i;

    for(i = startIndex; i < dateStr.length; i++) {
        char = dateStr.charAt(i);
        if(char === 'Z' || char === '+' || char === '-') {
            datePart = dateStr.substring(startIndex, i);
            if(char === 'Z') {
                timeZonePart = dateStr.substring(i, i + 1);
            } else {
                timeZonePart = dateStr.substring(i, i + 6);
            }
            break;
        }
    }

    if(datePart && parsers[part]) {
        skip += datePart.length;
        parsers[part](datePart, dateInfo, parts, index);
    }
    if(timeZonePart && timeZonePart !== "Z") {
        skip += timeZonePart.length;
        char = timeZonePart.charAt(0);
        minute = timeZonePart.substring(1).split(":");
        hour = toInt(minute[0]);
        minute = toInt(minute[1]);

        dateInfo.timezone = hour * 60;
        dateInfo.timezone += minute;
        if(char === '-' && dateInfo.timezone > 0) {
            dateInfo.timezone = -dateInfo.timezone;
        }
    }
    return skip;
}

parsers = {
    "yyyy": getDateParser("year"),
    "yy": noop,
    "y": getDateParser("year"),
    "MMMM": monthTextParser,
    "MMM": monthTextParser,
    "MM": getDateParser("month"),
    "M": getDateParser("month"),
    "dd": getDateParser("date"),
    "d": getDateParser("date"),
    "EEEE": noop,
    "EEE": noop,
    "HH": getDateParser("hours"),
    "H": getDateParser("hours"),
    "hh": hour12Parser,
    "h": hour12Parser,
    "mm": getDateParser("minutes"),
    "m": getDateParser("minutes"),
    "ss": getDateParser("seconds"),
    "s": getDateParser("seconds"),
    "S": getDateParser("milliseconds"),
    "t": ampmParser,
    "tt": ampmParser,
    "Z": noop
};

locale = {
    "MONTH": ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    "DAY": ["星期天", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"],
    "SHORTDAY": ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
    "MONTH_MAPPING": {
        "一月": 1,
        "二月": 2,
        "三月": 3,
        "四月": 4,
        "五月": 5,
        "六月": 6,
        "七月": 7,
        "八月": 8,
        "九月": 9,
        "十月": 10,
        "十一月": 11,
        "十二月": 12
    },

    default: "yyyy-MM-dd HH:mm:ss",
    medium: "yyyy-MM-dd HH:mm",
    date: "yyyy-MM-dd",
    longDate: "yyyy-MM-dd EEEE",
    shortDate: "y-M",
    time: "HH:mm:ss",
    shortTime: "HH:mm",
    time12: "h:m:s tt",
    shortTime12: "h:m tt",
    json: "yyyy-MM-ddTHH:mm:ss.SZ"
};
locale["SHORTMONTH"] = locale["MONTH"];
locale["SHORTMONTH_MAPPING"] = locale["MONTH_MAPPING"];

function getParts(format) {
    var parts,
        match;
    if(format === lastFormat) {
        parts = lastParts;
    } else {
        parts = [];
        while(format) {
            match = rFormat.exec(format);
            if(match) {
                parts.push(match[1]);
                format = match[2];
            } else {
                parts.push(format);
                break;
            }
        }
        if(parts.length > 0) {
            lastFormat = format;
            lastParts = parts;
        }
    }
    return parts;
}

function parseJSON(dateStr) {
    var date;

    dateStr = dateStr.trim();
    if(dateStr.length === 0) {
        return null;
    }

    if(/^\d+$/.test(dateStr)) {
        // 如果全是数字
        return new Date(toInt(dateStr));
    } else {
        // 尝试ISO 8601
        date = new Date(dateStr);
        if(isNaN(date)) {
            // 尝试AspNet的格式
            date = rAspNetFormat.exec(dateStr);
            if(date !== null) {
                date = new Date(Number(date[1]));
            }
        }
        return isNaN(date) ? null : date;
    }
}

ui.date = {
    format: function(date, format) {
        var dateValue,
            formatValue,
            match,
            parts,
            result;

        if(ui.core.isString(date)) {
            dateValue = parseJSON(date);
        } else {
            dateValue = date;
        }

        if(ui.core.isNumber(dateValue)) {
            dateValue = new Date(dateValue);
        }

        result = [];

        formatValue = (ui.core.isString(format) ? format.trim() : format) || "default";
        formatValue = locale[formatValue] || formatValue;
        
        if(dateValue instanceof Date) {
            parts = getParts(formatValue);
            parts.forEach(function(p) {
                var formatter = formatters[p];
                if(formatter) {
                    result.push(formatter(dateValue, locale));
                } else {
                    result.push(p);
                }
            });
        }

        return result.join("");
    },
    parseJSON: function(dateStr) {
        if(ui.core.isString(dateStr)) {
            return parseJSON(dateStr);
        } else if(dateStr instanceof Date) {
            return dateStr;
        } else {
            return null;
        }
    },
    parse: function(dateStr, format) {
        var formatValue,
            parts,
            part,
            nextPart,
            timeZoneParser,
            startIndex, endIndex, index,
            i, len,
            dateInfo,
            result;

        if(typeof dateStr !== "string" || !dateStr) {
            return null;
        }

        formatValue = (ui.core.isString(format) ? format.trim() : format) || "default";
        formatValue = locale[formatValue] || formatValue;

        dateInfo = {
            year: 1970,
            month: 1,
            date: 1,
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0
        };

        parts = getParts(formatValue);
        startIndex = 0;
        for(i = 0, len = parts.length; i < len;) {
            part = parts[i];
            nextPart = "";
            index = i;
            if(!parsers.hasOwnProperty(part)) {
                i++;
                startIndex += part.length;
                continue;
            }

            i++;
            if(i < len) {
                nextPart = parts[i];
                if(nextPart === "Z") {
                    // 对时区做特殊处理
                    i++;
                    timeZoneParser = parsers[nextPart];
                    if(timeZoneParser === noop || !ui.core.isFunction(timeZoneParser)) {
                        timeZoneParser = parseTimeZone;
                    }
                    startIndex += timeZoneParser(dateStr, startIndex, dateInfo, parts, index);
                    continue;
                } else {
                    if(parsers.hasOwnProperty(nextPart)) {
                        return null;
                    }
                    i++;
                    endIndex = dateStr.indexOf(nextPart, startIndex);
                    if(endIndex === -1) {
                        return null;
                    }
                }
            } else {
                endIndex = dateStr.length;
            }

            if(parsers[part]) {
                parsers[part](
                    dateStr.substring(startIndex, endIndex), 
                    dateInfo, 
                    parts, 
                    index);
            }
            startIndex = endIndex + nextPart.length;
        }

        result = new Date(
            dateInfo.year,
            dateInfo.month - 1,
            dateInfo.date,
            dateInfo.hours,
            dateInfo.minutes,
            dateInfo.seconds,
            dateInfo.milliseconds);
        if(dateInfo.timezone) {
            result.setMinutes(result.getMinutes() + dateInfo.timezone);
        }
        return result;
    },
    locale: locale
};


})(ui, $);

// Source: src/core/utils/util-object.js

(function(ui, $) {
//object

function _ignore(ignore) {
    var ignoreType,
        prefix;
    
    ignoreType = ui.core.type(ignore);
    if(ignoreType !== "function") {
        if(ignoreType === "string") {
            prefix = ignore;
            ignore = function() {
                return index.indexOf(prefix) > -1;  
            };
        } else {
            ignore = function() {
                return this.indexOf("_") > -1;  
            };
        }
    }
    return ignore;
}

ui.obj = {
    /** 浅克隆 */
    clone: function (source, ignore) {
        var result,
            type,
            key;

        ignore = _ignore(ignore);
        type = ui.core.type(source);
        
        if(type === "object") {
            result = {};
        } else if(type === "array") {
            result = [];
        } else {
            return source;
        }
        
        for (key in source) {
            if(ignore.call(key)) {
                continue;
            }
            result[key] = source[key];
        }
        return result;
    },
    /** 深克隆对象 */
    deepClone: function (source, ignore) {
        var result,
            type,
            copy,
            key;

        type = ui.core.type(source);
        if(type === "object") {
            result = {};
        } else if(type === "array") {
            result = [];
        } else {
            return source;
        }
        
        ignore = _ignore(ignore);
        for (key in source) {
            if(ignore.call(key)) {
                continue;
            }
            copy = source[key];
            if (result === copy)
                continue;
            type = ui.core.type(copy);
            if ((type === "object" && ui.core.isPlainObject(copy)) || type === "array") {
                result[key] = this.deepClone(copy, ignore);
            } else {
                result[key] = copy;
            }
        }
        return result;
    }
};


})(ui, $);

// Source: src/core/utils/util-url.js

(function(ui, $) {
//url

var url_rquery = /\?/,
    r20 = /%20/g;

ui.url = {
    /** 获取url的各种信息 */
    urlInfo: function (url) {
        var a = document.createElement('a');
        a.href = url;
        return {
            source: url,
            protocol: a.protocol.replace(':', ''),
            host: a.hostname,
            port: a.port,
            search: a.search,
            params: (function () {
                var ret = {},
                    seg = a.search.replace(/^\?/, '').split('&'),
                    len = seg.length, i = 0, s;
                for (; i < len; i++) {
                    if (!seg[i]) { continue; }
                    s = seg[i].split('=');
                    ret[s[0]] = s[1];
                }
                return ret;
            })(),
            file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
            hash: a.hash.replace('#', ''),
            path: a.pathname.replace(/^([^\/])/, '/$1'),
            relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
            segments: a.pathname.replace(/^\//, '').split('/')
        };
    },
    /** 取得URL的参数，以对象形式返回 */
    getParams: function (url) {
        var result = {};
        var param = /([^?=&]+)=([^&]+)/ig;
        var match;
        while ((match = param.exec(url)) !== null) {
            result[match[1]] = match[2];
        }
        return result;
    },
    /** 修改url的参数 */
    setParams: function(url, params) {
        var currentParam,
            key,
            index,
            arr;
        if(!params) {
            return;
        }
        currentParam = this.getParams(url);
        for(key in params) {
            if(params.hasOwnProperty(key)) {
                currentParam[key] = params[key] + "";
            }
        }
        index = url.indexOf("?");
        if(index >= 0) {
            url = url(0, index);
        }
        arr = [];
        for(key in currentParam) {
            if(currentParam.hasOwnProperty(key)) {
                arr.push(key + "=" + currentParam[key]);
            }
        }
        return url + "?" + arr.join("&");
    },
    /** 为url添加参数 */
    appendParams: function (url, data) {
        var s = [],
            add = function (key, value) {
                value = ui.core.isFunction(value) ? value() : (value == null ? "" : value);
                s[s.length] = encodeURIComponent(key) + "=" + encodeURIComponent(value);
            },
            i, t, key;
        if ($.isArray(data)) {
            for (i = 0; i < data.length; i++) {
                t = data[i];
                if (t.hasOwnProperty("name")) {
                    add(t.name, t.value);
                }
            }
        } else if ($.isPlainObject(data)) {
            for (key in data) {
                add(key, data[key]);
            }
        }

        if (s.length > 0) {
            return url + (url_rquery.test(url) ? "&" : "?") + s.join("&").replace(r20, "+");
        } else {
            return url;
        }
    },
    /** 获取地址栏参数值 */
    getLocationParam: function (name) {
        var sUrl = window.location.search.substr(1);
        var r = sUrl.match(new RegExp("(^|&)" + name + "=([^&]*)(&|$)"));
        return (r === null ? null : unescape(r[2]));
    }
};

})(ui, $);

// Source: src/core/utils/util-structure-transform.js

(function(ui, $) {
// 数据结构转换

var flagFieldKey = "_from-list";

function getFieldMethod(field, fieldName) {
    if (!ui.core.isFunction(field)) {
        if (ui.core.isString(field)) {
            return function () {
                return this[field];
            };
        } else {
            throw new TypeError(ui.str.format("the {0} is not String or Function.", fieldName));
        }
    }
    return field;
}

ui.trans = {
    /** Array结构转Tree结构 */
    listToTree: function (list, parentField, valueField, childrenField) {
        var tempList = {}, 
            temp, root,
            item, i, len, id, pid,
            flagField = flagFieldKey,
            key;

        if (!Array.isArray(list) || list.length === 0) {
            return null;
        }

        parentField = getFieldMethod(parentField, "parentField");
        valueField = getFieldMethod(valueField, "valueField");
        childrenField = ui.core.isString(childrenField) ? childrenField : "children";

        for (i = 0, len = list.length; i < len; i++) {
            item = list[i];
            if(item === null || item === undefined) {
                continue;
            }
            pid = parentField.call(item) + "" || "__";
            if (tempList.hasOwnProperty(pid)) {
                temp = tempList[pid];
                if(!temp[childrenField]) {
                    temp[childrenField] = [];
                }
                temp[childrenField].push(item);
            } else {
                temp = {};
                temp[childrenField] = [];
                temp[childrenField].push(item);
                tempList[pid] = temp;
                temp[flagField] = true;
            }
            id = valueField.call(item) + "";
            if (tempList.hasOwnProperty(id)) {
                temp = tempList[id];
                item[childrenField] = temp[childrenField];
                tempList[id] = item;
            } else {
                item[childrenField] = null;
                tempList[id] = item;
            }
        }
        for (key in tempList) {
            if(tempList.hasOwnProperty(key)) {
                temp = tempList[key];
                if (temp.hasOwnProperty(flagField)) {
                    root = temp;
                    break;
                }
            }
        }
        return root[childrenField];
    },
    /** Array结构转分组结构(两级树结构) */
    listToGroup: function(list, groupField, createGroupItemFn, itemsField) {
        var temp = {},
            i, len, key, 
            groupKey, item, result;

        if (!Array.isArray(list) || list.length === 0) {
            return null;
        }
        
        groupKey = ui.core.isString(groupField) ? groupField : "text";
        groupField = getFieldMethod(groupField, "groupField");
        itemsField = ui.core.isString(itemsField) ? itemsField : "children";
        
        for (i = 0, len = list.length; i < len; i++) {
            item = list[i];
            if(item === null || item === undefined) {
                continue;
            }
            key = groupField.call(item) + "" || "__";
            if(!temp.hasOwnProperty(key)) {
                temp[key] = {};
                temp[key][groupKey] = key;
                temp[key][itemsField] = [];
                if(ui.core.isFunction(createGroupItemFn)) {
                    createGroupItemFn.call(this, temp[key], item, key);
                }
            }
            temp[key][itemsField].push(item);
        }

        result = [];
        for(key in temp) {
            if(temp.hasOwnProperty(key)) {
                result.push(temp[key]);
            }
        }
        return result;
    },
    /** 遍历树结构 */
    treeEach: function(list, childrenField, fn) {
        var i, len,
            node,
            isNodeFn;

        if(!Array.isArray(list)) {
            return;
        }
        if(!ui.core.isFunction(fn)) {
            return;
        }
        childrenField = ui.core.isString(childrenField) ? childrenField : "children";
        isNodeFn = function() {
            return Array.isArray(this[childrenField]) && this[childrenField].length > 0;
        };
        
        for(i = 0, len = list.length; i < len; i++) {
            node = list[i];
            node.isNode = isNodeFn;
            fn.call(null, node);
            delete node.isNode;
            if(isNodeFn.call(node)) {
                ui.trans.treeEach(node[childrenField], childrenField, fn);
            }
        }
    }
};


})(ui, $);

// Source: src/core/utils/util-random.js

(function(ui, $) {

var random = {
    /** 获取一定范围内的随机数 */
    getNum: function(min, max) {
        var val = null;
        if (isNaN(min)) {
            min = 0;
        }
        if (isNaN(max)) {
            max = 100;
        }
        if (max == min) {
            return min;
        }
        var temp;
        if (max < min) {
            temp = max;
            max = min;
            min = temp;
        }
        var range = max - min;
        val = min + Math.floor(Math.random() * range);
        return val;
    }
};

// uuid
var _time = new Date(),
    getBits = function(val, start, end) {
        val = val.toString(36).split('');
        start = (start / 4) | 0;
        end = (end / 4) | 0;
        for(var i = start; i <= end; i++) {
            if(!val[i]) { 
                (val[i] = 0);
            }
        }
        return val.slice(start,end + 1).join(''); 
    },
    rand = function (max) {
        return Math.random() * (max + 1) | 0;
    },
    hnv1a = function (key) {
        key = key.replace(/./g, function (m) {
            return m.charCodeAt();
        }).split('');
        var p = 16777619, hash = 0x811C9DC5, l = key.length;
        for(var i=0; i< l; i++) {
            hash = (hash ^ key[i]) * p;
        }
        hash += hash << 13;
        hash ^= hash >> 7;
        hash += hash << 3;
        hash ^= hash >> 17;
        hash += hash << 5;
        hash = hash & 0x7FFFFFFF; //取正.
        hash = hash.toString(36);
        if(hash.length < 6) {
            (hash += (l % 36).toString(36));
        }
        return hash;
    },
    info = [
        screen.width, 
        screen.height,
        navigator.plugins.length,
        navigator.javaEnabled(),
        screen.colorDepth,
        location.href,
        navigator.userAgent
    ].join('');

random.uuid = function () {
    var s = new Date(),
        t = (+s +  0x92f3973c00).toString(36),
        m = getBits(rand(0xfff),0,7) +
            getBits(rand(0x1fff),0,7) +
            getBits(rand(0x1fff),0,8),
        // random from 50 - 300
        c = Math.random() * (251) + 50 | 0,
        a = [];
    if(t.length < 9) {
        (t += (s % 36).toString(36));
    }
    for (; c--;) {
        //借助不定次数,多次随机，打散客户端，因软硬环境类似，导致产生随机种子的线性规律性，以及重复性.
        a.push(Math.random());
    }

    return (
        //增加物理维度分流.
        hnv1a(info) +
        //增加用户随机性分流.
        hnv1a([
            document.documentElement.offsetWidth, document.documentElement.offsetHeight,                       , 
            history.length, 
            (new Date()) - _time
            ].join('')) +
        t +
        m + 
        hnv1a(a.slice(0, 10).join('')) +
        hnv1a(a.slice(c - 9).join(''))
    );
};

// 随机颜色
var rgb =  function () {
    return Math.floor(Math.random()*256);
};
random.hex = function() {
    return  '#' + ('00000' + (Math.random() * 0x1000000 << 0).toString(16)).slice(-6);
};
random.hsb = function() {
    return "hsb(" + Math.random()  + ", 1, 1)";
};
random.rgb = function() {
    return "rgb(" + [ rgb(), rgb(), rgb() ] + ")";
};
random.vivid = function(ranges) {
    if (!ranges) {
        ranges = [
            [150,256],
            [0, 190],
            [0, 30]
        ];
    }
    var g = function() {
        //select random range and remove
        var range = ranges.splice(Math.floor(Math.random()*ranges.length), 1)[0];
        //pick a random number from within the range
        return Math.floor(Math.random() * (range[1] - range[0])) + range[0];
    };
    return "rgb(" + g() + "," + g() + "," + g() +")";
};

ui.random = random;


})(ui, $);

// Source: src/core/parser.js

(function(ui, $) {
var open = "{",
    close = "}",
    formatterOperator = "|";
function bindTemplate(data, converter) {
    var indexes = this.braceIndexes,
        parts,
        name,
        index, value,
        i, len;
    if(!converter) {
        converter = {};
    }
    if(Array.isArray(indexes)) {
        parts = [].concat(this.parts)
        for(i = 0, len = indexes.length; i < len; i++) {
            index = indexes[i];
            name = parts[index];
            if(ui.str.isEmpty(name)) {
                parts[index] = "";
            } else {
                value = getValue(name, data, converter);
                if(ui.str.isEmpty(value)) {
                    value = "";
                }
                parts[index] = value;
            }
        }
    } else {
        parts = this.parts;
    }
    return parts.join("");
}
function getValue(name, data, converter) {
    var index,
        formatterName,
        names, type,
        value;

    if(!data) {
        return null;
    }
    
    index = name.indexOf(formatterOperator);
    if(index >= 0) {
        formatterName = name.substring(index + 1).trim();
        name = name.substring(0, index).trim();
    }

    names = name.split(".");
    value = names.reduce(function(o, n) {
        if(!o) {
            return null;
        }
        return o[n];
    }, data);

    type = ui.core.type(value);
    if(type === "null" || type === "undefined") {
        return null;
    }
    
    if(formatterName && converter && ui.core.isFunction(converter[formatterName])) {
        return converter[formatterName].call(data, value, name);
    }

    return value;
}
function parseTemplate(template) {
    var index, 
        openIndex,
        closeIndex,
        builder,
        parts;
    parts = [];
    builder = {
        parts: parts,
        braceIndexes: [],
        statusText: "",
        bind: bindTemplate
    };
    if(typeof template !== "string" || template.length === 0) {
        parts.push(template);
        builder.statusText = "template error";
        return builder;
    }
    index = 0;
    while(true) {
        openIndex = template.indexOf(open, index);
        closeIndex = template.indexOf(close, (openIndex > -1 ? openIndex : index));
        // 没有占位符
        if(openIndex < 0 && closeIndex < 0) {
            parts.push(template.substring(index));
            break;
        }
        // 可是要输出'}'标记符
        if(closeIndex > -1 && (closeIndex < openIndex || openIndex === -1)) {
            if(template.charAt(closeIndex + 1) !== close) {
                throw new TypeError("字符'}'， index:" + closeIndex + "， 标记符输出格式错误，应为}}");
            }
            parts.push(template.substring(index, closeIndex + 1));
            index = closeIndex + 2;
            continue;
        }
        // 处理占位符
        parts.push(template.substring(index, openIndex));
        index = openIndex + 1;
        if(template.charAt(index) === open) {
            // 说明要输出'{'标记符
            parts.push(template.charAt(index));
            index += 1;
            continue;
        }
        if(closeIndex === -1) {
            throw new TypeError("缺少闭合标记，正确的占位符应为{text}");
        }
        parts.push(template.substring(index, closeIndex).trim());
        builder.braceIndexes.push(parts.length - 1);
        index = closeIndex + 1;
    }
    return builder;
}

function parseXML(data) {
    var xml, tmp;
	if (!data || typeof data !== "string") {
		return null;
	}
	try {
		if (window.DOMParser) { 
            // Standard
			tmp = new DOMParser();
			xml = tmp.parseFromString(data, "text/xml");
		} else { 
            // IE
			xml = new ActiveXObject("Microsoft.XMLDOM");
			xml.async = "false";
			xml.loadXML(data);
		}
	} catch(e) {
		xml = undefined;
	}
	if (!xml || !xml.documentElement || xml.getElementsByTagName("parsererror").length) {
		throw new TypeError("Invalid XML: " + data);
	}
	return xml;
}

function parseHTML(html) {
    return html;
}

ui.parseTemplate = parseTemplate;
ui.parseXML = parseXML;
ui.parseHTML = parseHTML;
ui.parseJSON = JSON.parse;

})(ui, $);

// Source: src/core/task.js

(function(ui, $) {
/*

JavaScript中分为MacroTask和MicroTask
Promise\MutationObserver\Object.observer 属于MicroTask
setImmediate\setTimeout\setInterval 属于MacroTask
    另外：requestAnimationFrame\I/O\UI Rander 也属于MacroTask，但会优先执行

每次Tick时都是一个MacroTask，在当前MacroTask执行完毕后都会检查MicroTask的队列，并执行MicroTask。
所以MicroTask可以保证在同一个Tick执行，而setImmediate\setTimeout\setInterval会创建成新的MacroTask，下一次执行。
另外在HTML5的标准中规定了setTimeout和setInterval的最小时间变成了4ms，这导致了setTimeout(fn, 0)也会有4ms的延迟，
而setImmediate没有这样的限制，但是setImmediate只有IE实现了，其它浏览器都不支持，所以可以采用MessageChannel代替。

MicroTask和MacroTask的区别请看这里
https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/
*/

var callbacks,
    pedding,
    isFunction,

    channel, port,
    resolvePromise,
    MutationObserver, observer, textNode, counter,

    task,
    microTask;

isFunction = ui.core.isFunction;

function set(fn) {
    var index;
    if(isFunction(fn)) {
        this.callbacks.push(fn);
        index = this.callbacks.length - 1;

        if(!this.pedding) {
            this.pedding = true;
            this.run();
        }
        return index;
    }
    return -1;
}

function clear(index) {
    if(typeof index === "number" && index >= 0 && index < this.callbacks.length) {
        this.callbacks[index] = false;
    }
}

function run() {
    var copies,
        i, len;

    this.pedding = false;
    copies = this.callbacks;
    this.callbacks = [];

    for(i = 0, len = copies.length; i < len; i++) {
        if(copies[i]) {
            try {
                copies[i]();
            } catch(e) {
                ui.handleError(e);
            }
        }
    }
}

task = {
    callbacks: [],
    pedding: false,
    run: null
};

// 如果原生支持setImmediate
if(typeof setImmediate !== "undefined" && ui.core.isNative(setImmediate)) {
    // setImmediate
    task.run = function() {
        setImmediate(function() {
            run.call(task);
        });
    };
} else if(MessageChannel && 
            (ui.core.isNative(MessageChannel) || MessageChannel.toString() === "[object MessageChannelConstructor]")) {
    // MessageChannel & postMessage
    channel = new MessageChannel();
    channel.port1.onmessage = function() {
        run.call(task);
    };
    port = channel.port2;
    task.run = function() {
        port.postMessage(1);
    };
} else {
    // setTimeout
    task.run = function() {
        setTimeout(function() {
            run.call(task);
        }, 0);
    };
}

microTask = {
    callbacks: [],
    pedding: false,
    run: null
};

if(typeof Promise !== "undefined" && ui.core.isNative(Promise)) {
    // Promise
    resolvePromise = Promise.resolve();
    microTask.run = function() {
        resolvePromise.then(function() {
            run.call(microTask);
        });
    };
} else {
    MutationObserver = window.MutationObserver || 
                        window.WebKitMutationObserver || 
                        window.MozMutationObserver || 
                        null;

    if(MutationObserver && ui.core.isNative(MutationObserver)) {
        // MutationObserver
        counter = 1;
        observer = new MutationObserver(function() {
            run.call(microTask);
        });
        textNode = document.createTextNode(String(counter));
        observer.observe(textNode, {
            characterData: true
        });
        microTask.run = function() {
            counter = (counter + 1) % 2;
            textNode.data = String(counter);
        };
    } else {
        microTask.run = task.run;
    }
}

ui.setTask = function(fn) {
    return set.call(task, fn);
};
ui.clearTask = function(index) {
    clear.call(task, index);
};
ui.setMicroTask = function(fn) {
    return set.call(microTask, fn);
};
ui.clearMicroTask = function(index) {
    clear.call(microTask, index);
};


})(ui, $);

// Source: src/core/cookie.js

(function(ui, $) {
// cookie 操作

function parseCookieValue(s) {
    if (s.indexOf('"') === 0) {
        // This is a quoted cookie as according to RFC2068, unescape...
        s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    try {
        //处理加号
        return decodeURIComponent(s.replace(/\+/g, ' '));
    } catch (e) {
        return s;
    }
}

ui.cookie = {
    stringify: function(name, val, opts) {
        var pairs = [name + "=" + encodeURIComponent(val)];
        if (isFinite(opts) && typeof opts === "number") {
            pairs.push("Max-Age=" + opts);
        } else {
            opts = opts || {};
            if (opts.maxAge)
                pairs.push("Max-Age=" + opts.maxAge);
            if (opts.domain)
                pairs.push("Domain=" + opts.domain);
            if (opts.path)
                pairs.push("Path=" + opts.path);
            if (opts.expires)
                pairs.push("Expires=" + opts.expires.toUTCString());
            if (opts.httpOnly)
                pairs.push("HttpOnly");
            if (opts.secure)
                pairs.push("Secure");
        }
        return pairs.join("; ");
    },
    forEach: function(callback) {
        var pairs = String(document.cookie).split(/; */);
        pairs.forEach(function(pair) {
            var index = pair.indexOf('=');
            if (index === -1) {
                return;
            }
            var key = pair.substr(0, index).trim();
            var val = pair.substr(++index, pair.length).trim();
            callback(key, parseCookieValue(val));
        });
    },
    get: function(name) {
        var ret;
        try {
            this.forEach(function(key, value) {
                if (key === name) {
                    ret = value;
                    throw "";
                }
            });
        } catch (e) {
        }
        return ret;
    },
    getAll: function() {
        var obj = {};
        this.forEach(function(key, value) {
            if (!(key in obj)) {
                obj[key] = value;
            }
        });
        return obj;
    },
    set: function(key, val, opts) {
        document.cookie = this.stringify.apply(0, arguments);
    },
    remove: function(key, opt) {
        opt = opt || {};
        if (!opt.expires) {
            opt.expires = new Date(1970, 0, 1);
        }
        this.set(key, '', opt);
    },
    clear: function() {
        var that = this;
        this.forEach(function(key, value) {
            that.remove(key);
        });
    }
};

})(ui, $);

// Source: src/core/style-sheet.js

(function(ui, $) {

// 样式表操作
function getRules() {
    var rules = this.prop("cssRules") || this.prop("rules");
    return rules;
}
function eachRules(rules, action) {
    var i = 0,
        len = rules.length,
        rule;
    for(; i < len; i++) {
        rule = rules[i];
        // 跳过@import和非样式规则
        if(!rule.selectorText) {
            continue;
        }
        if(action.call(this, rule, i) === false) {
            break;
        }
    }
}
    
function StyleSheet(elem) {
    var nodeName,
        styleElement;
    if(!(this instanceof StyleSheet)) {
        return new StyleSheet(elem);
    }

    this.styleSheet = null;
    if(ui.core.isString(elem) && elem.length > 0) {
        //通过ID获取
        styleElement = $("#" + elem);
        nodeName = styleElement.nodeName();
        if (nodeName === "STYLE" || nodeName === "LINK") {
            this.styleSheet = styleElement.prop("sheet");
            if (!this.styleSheet) {
                this.styleSheet = styleElement.prop("styleSheet");
            }
            if (this.styleSheet) {
                this.styleSheet = $(this.styleSheet);
            }
        }
    } else if(ui.core.isJQueryObject(elem)) {
        this.styleSheet = elem;
    } else if(ui.core.isDomObject(elem)) {
        this.styleSheet = $(elem);
    }
}
StyleSheet.prototype = {
    constructor: StyleSheet,
    disabled: function() {
        if(arguments.length === 0) {
            return this.styleSheet.prop("disabled");
        }

        this.styleSheet.prop("disabled", !!arguments[0]);
        
    },
    getRule: function(selector) {
        var rules,
            result = null;
        if(ui.str.isEmpty(selector)) {
            return null;
        }
        if(!this.styleSheet || this.styleSheet.length === 0) {
            return null;
        }

        selector = selector.toLowerCase();
        rules = getRules.call(this.styleSheet);
        eachRules(rules, function(rule, index) {
            if(rule.selectorText.toLowerCase() === selector) {
                result = rule;
                return false;
            }
        });
        return result;
    },
    setRule: function(selector, styles) {
        var rules,
            rule,
            index;
        if(ui.str.isEmpty(selector)) {
            return;
        }
        if(!styles) {
            return;
        }

        rule = this.getRule(selector);
        if(!rule) {
            selector = selector.toLowerCase();
            rules = getRules.call(this.styleSheet);
            index = rules.length;
            if(ui.core.isFunction(this.styleSheet[0].insertRule)) {
                this.styleSheet[0].insertRule(selector + " {}", index);
            } else if(ui.core.isFunction(this.styleSheet[0].addRule)) {
                this.styleSheet[0].addRule(selector, " ", index);
            } else {
                return;
            }
            rules = getRules.call(this.styleSheet);
            rule = rules[index];
        }
        $(rule).css(styles);
    },
    removeRule: function(selector) {
        var rules;
        var removeFn;
        if(ui.str.isEmpty(selector)) {
            return;
        }
        if(!this.styleSheet || this.styleSheet.length === 0) {
            return;
        }

        removeFn = this.styleSheet[0].deleteRule;
        if(!ui.core.isFunction(removeFn)) {
            removeFn = this.styleSheet[0].removeRule;
        }

        selector = selector.toLowerCase();
        rules = getRules.call(this.styleSheet);
        eachRules(rules, function(rule, index) {
            if(rule.selectorText.toLowerCase() === selector) {
                if(ui.core.isFunction(removeFn)) {
                    removeFn.call(this.styleSheet[0], index);
                }
                return false;
            }
        });
    }
};
StyleSheet.createStyleSheet = function(id) {
    var styleElem,
        styleSheet,
        head;

    // IE专有，IE11以后不再支持
    if(ui.core.isFunction(document.createStyleSheet)) {
        styleSheet = document.createStyleSheet();
        styleElem = styleSheet.ownerNode || styleSheet.owningElement;
    } else {
        head = document.getElementsByTagName("head")[0];
        styleElem = document.createElement("style");
        head.appendChild(styleElem);
        styleSheet = document.styleSheets[document.styleSheets.length - 1];
    }
    if(!ui.str.isEmpty(id)) {
        styleElem.id = id;
    }

    return new StyleSheet($(styleSheet));
};

ui.StyleSheet = StyleSheet;


})(ui, $);


// 兼容AMD
if(typeof define === "function" && define.amd) {
	define("SOONUI", [], function() {
		return ui;
	});
}

return ui;

});
