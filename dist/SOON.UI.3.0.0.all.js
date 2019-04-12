/*
    SoonUI 主命名空间声明
 */
(function(global, factory) {
	if (typeof module === "object" && typeof module.exports === "object") {

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get SoonUI.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var ui = require("ui")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory(global, true) :
			function(w) {
				if (!w.document) {
					throw new Error("SOON.UI requires a window with a document");
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
if(noGlobal) {
	window.ui = ui;
	window.SOONUI = ui;
}

// Source: src/core.js

(function($, ui) {
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



})(jQuery, ui);

// Source: src/i18n.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/ES5-Array-shims.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/ES6-Array-shims.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/ES5-String-shims.js

(function($, ui) {
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



})(jQuery, ui);

// Source: src/ES6-String-shims.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/ES5-Function-shims.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/ES5-JSON-shims.js

(function($, ui) {
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

})(jQuery, ui);

// Source: src/ES6-Number-shims.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/ES5-Object-shims.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/ES6-Promise.shims.js

(function($, ui) {

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


})(jQuery, ui);

// Source: src/array-like.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/keyarray.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/linked-list.js

(function($, ui) {
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

})(jQuery, ui);

// Source: src/util.js

(function($, ui) {
// util

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
        css = {};
    
    if (!target || !panel) {
        return;
    }
    
    width = panel.outerWidth();
    height = panel.outerHeight();
    
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
        position,
        documentElement,
        top, left;

    location = {
        left: 0,
        top: 0
    };
    if (!target) {
        return location;
    }
    position = target.offset();
    documentElement = document.documentElement;
    top = position.top + target.outerHeight();
    left = position.left;
    if ((top + height) > (documentElement.clientHeight + documentElement.scrollTop)) {
        top -= height + target.outerHeight();
    }
    if ((left + width) > documentElement.clientWidth + documentElement.scrollLeft) {
        left = left - (width - target.outerWidth());
    }
    location.top = top;
    location.left = left;
    return location;
};

//获取目标元素左边的坐标信息
ui.getLeftLocation = function (target, width, height) {
    var location,
        position,
        documentElement,
        top, left;
    
    location = {
        left: 0,
        top: 0
    };
    if (!target) {
        return location;
    }
    position = target.offset();
    documentElement = document.documentElement;
    top = position.top;
    left = position.left + target.outerWidth();
    if ((top + height) > (documentElement.clientHeight + documentElement.scrollTop)) {
        top -= (top + height) - (documentElement.clientHeight + documentElement.scrollTop);
    }
    if ((left + width) > documentElement.clientWidth + documentElement.scrollLeft) {
        left = position.left - width;
    }
    location.top = top;
    location.left = left;
    return location;
};


})(jQuery, ui);

// Source: src/util-string.js

(function($, ui) {
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
        if(!htmlEncodeSpan) {
            htmlEncodeSpan = $("<span />");
        } else {
            htmlEncodeSpan.html("");
        }
        return htmlEncodeSpan.append(document.createTextNode(str)).html();
    },
    /** html解码 */
    htmlDecode: function(str) {
        if (this.isEmpty(str)) {
            return textEmpty;
        }
        if(!htmlEncodeSpan) {
            htmlEncodeSpan = $("<span />");
        } else {
            htmlEncodeSpan.html("");
        }
        return htmlEncodeSpan.html(str).text();
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


})(jQuery, ui);

// Source: src/util-date.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/util-object.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/util-url.js

(function($, ui) {
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

})(jQuery, ui);

// Source: src/util-structure-transform.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/util-random.js

(function($, ui) {

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


})(jQuery, ui);

// Source: src/parser.js

(function($, ui) {
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

})(jQuery, ui);

// Source: src/task.js

(function($, ui) {
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


})(jQuery, ui);

// Source: src/jquery-extends.js

(function($, ui) {
// jquery extends

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

/** 获取对象的z-index值 */
$.fn.zIndex = function (zIndex) {
    if (zIndex !== undefined) {
        return this.css("zIndex", zIndex);
    }

    if (this.length) {
        var elem = $(this[0]), position, value;
        while (elem.length && elem[0] !== document) {
            // Ignore z-index if position is set to a value where z-index is ignored by the browser
            // This makes behavior of this function consistent across browsers
            // WebKit always returns auto if the element is positioned
            position = elem.css("position");
            if (position === "absolute" || position === "relative" || position === "fixed") {
                // IE returns 0 when zIndex is not specified
                // other browsers return a string
                // we ignore the case of nested elements with an explicit value of 0
                // <div style="z-index: -10;"><div style="z-index: 0;"></div></div>
                value = parseInt(elem.css("zIndex"), 10);
                if (!isNaN(value) && value !== 0) {
                    return value;
                }
            }
            elem = elem.parent();
        }
    }
    return 0;
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
$.fn.mousewheel = function (data, fn) {
    var mouseWheelEventName = eventSupported("mousewheel", this) ? "mousewheel" : "DOMMouseScroll";
    return arguments.length > 0 ?
        this.on(mouseWheelEventName, null, data, fn) :
        this.trigger(mouseWheelEventName);
};
if($.fn.jquery >= "3.0.0") {
    "mousewheel DOMMouseScroll".replace(rword, function (name) {
        jQuery.event.special[ name ] = {
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
        jQuery.event.fixHooks[name] = {
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


})(jQuery, ui);

// Source: src/cookie.js

(function($, ui) {
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

})(jQuery, ui);

// Source: src/style-sheet.js

(function($, ui) {

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


})(jQuery, ui);

// Source: src/component/introsort.js

(function($, ui) {
// sorter introsort
var size_threshold = 16;

function defaultComparer(a, b) {
    if (ui.core.isString(a)) {
        return a.localeCompare(b);
    }
    if (a < b) {
        return -1;
    } else if (b > a) {
        return 1;
    } else {
        return 0;
    }
}

function Introsort () {
    if(this instanceof Introsort) {
        this.initialize();
    } else {
        return new Introsort();
    }
}
Introsort.prototype = {
    constructor: Introsort,
    initialize: function() {
        this.keys = null;
        this.items = null;
        this.comparer = null;
    },
    sort: function (arr, comparer) {
        var len;
        if (ui.core.isFunction(arr)) {
            arr = null;
            comparer = arr;
        } else {
            this.keys = arr;
            if (ui.core.isFunction(arguments[1])) {
                this.comparer = arguments[1];
            }
        }
        this.keys = arr;
        if (!Array.isArray(this.keys)) {
            return;
        }
        if(!ui.core.isFunction(comparer)) {
            comparer = defaultComparer;
        }
        this.comparer = comparer;

        len = this.keys.length;
        if (len < 2) {
            return;
        }
        if (!Array.isArray(this.items)) {
            this.items = null;
        }
        this._introsort(0, len - 1, 2 * this._floorLog2(len));
    },
    //introsort
    _introsort: function (lo, hi, depthLimit) {
        var num;
        while (hi > lo) {
            num = hi - lo + 1;
            if (num <= size_threshold) {
                if (num == 1) {
                    return;
                }
                if (num == 2) {
                    this._compareAndSwap(lo, hi);
                    return;
                }
                if (num == 3) {
                    this._compareAndSwap(lo, hi - 1);
                    this._compareAndSwap(lo, hi);
                    this._compareAndSwap(hi - 1, hi);
                    return;
                }
                this._insertionsort(lo, hi);
                return;
            } else {
                if (depthLimit === 0) {
                    this._heapsort(lo, hi);
                    return;
                }
                depthLimit--;
                num = this.partition(lo, hi);
                this._introsort(num + 1, hi, depthLimit);
                hi = num - 1;
            }
        }
    },
    partition: function (lo, hi) {
        var num = parseInt(lo + (hi - lo) / 2, 10);
        this._compareAndSwap(lo, num);
        this._compareAndSwap(lo, hi);
        this._compareAndSwap(num, hi);

        var a = this.keys[num];
        this._swap(num, hi - 1);

        var i = lo;
        num = hi - 1;
        while (i < num) {
            while (this.comparer(this.keys[++i], a) < 0) {
            }
            while (this.comparer(a, this.keys[--num]) < 0) {
            }
            if (i >= num) {
                break;
            }
            this._swap(i, num);
        }
        this._swap(i, hi - 1);
        return i;
    },
    //Heapsort
    _heapsort: function (lo, hi) {
        var num = hi - lo + 1;
        var i = Math.floor(num / 2), j;
        for (; i >= 1; i--) {
            this._downHeap(i, num, lo);
        }
        for (j = num; j > 1; j--) {
            this._swap(lo, lo + j - 1);
            this._downHeap(1, j - 1, lo);
        }
    },
    _downHeap: function (i, n, lo) {
        var a = this.keys[lo + i - 1];
        var b = (this.items) ? this.items[lo + i - 1] : null;
        var num;
        while (i <= Math.floor(n / 2)) {
            num = 2 * i;
            if (num < n && this.comparer(this.keys[lo + num - 1], this.keys[lo + num]) < 0) {
                num++;
            }
            if (this.comparer(a, this.keys[lo + num - 1]) >= 0) {
                break;
            }
            this.keys[lo + i - 1] = this.keys[lo + num - 1];
            if (this.items !== null) {
                this.items[lo + i - 1] = this.items[lo + num - 1];
            }
            i = num;
        }
        this.keys[lo + i - 1] = a;
        if (this.items !== null) {
            this.items[lo + i - 1] = b;
        }
    },
    //Insertion sort
    _insertionsort: function (lo, hi) {
        var i, num;
        var a, b;
        for (i = lo; i < hi; i++) {
            num = i;
            a = this.keys[i + 1];
            b = (this.items) ? this.items[i + 1] : null;
            while (num >= lo && this.comparer(a, this.keys[num]) < 0) {
                this.keys[num + 1] = this.keys[num];
                if (this.items !== null) {
                    this.items[num + 1] = this.items[num];
                }
                num--;
            }
            this.keys[num + 1] = a;
            if (this.items) {
                this.items[num + 1] = b;
            }
        }
    },
    _swap: function (i, j) {
        var temp = this.keys[i];
        this.keys[i] = this.keys[j];
        this.keys[j] = temp;
        if (this.items) {
            temp = this.items[i];
            this.items[i] = this.items[j];
            this.items[j] = temp;
        }
    },
    _compareAndSwap: function (i, j) {
        if (i != j && this.comparer(this.keys[i], this.keys[j]) > 0) {
            this._swap(i, j);
        }
    },
    _floorLog2: function (len) {
        var num = 0;
        while (len >= 1) {
            num++;
            len /= 2;
        }
        return num;
    }
};

ui.Introsort = Introsort;


})(jQuery, ui);

// Source: src/component/animation.js

(function($, ui) {
/*
    animation javascript 动画引擎
 */

//初始化动画播放器
var requestAnimationFrame,
    cancelAnimationFrame,
    prefix = ["ms", "moz", "webkit", "o"],
    animationEaseStyle,
    bezierStyleMapper,
    i;
    
requestAnimationFrame = window.requestAnimationFrame;
cancelAnimationFrame = window.cancelAnimationFrame;
if(!requestAnimationFrame) {
    for (i = 0; i < prefix.length && !requestAnimationFrame; i++) {
        requestAnimationFrame = window[prefix[i] + "RequestAnimationFrame"];
        cancelAnimationFrame = window[prefix[i] + "CancelAnimationFrame"] || window[prefix[i] + "CancelRequestAnimationFrame"];
    }
}
if (!requestAnimationFrame) {
    requestAnimationFrame = function (callback, fps) {
        fps = fps || 60;
        setTimeout(callback, 1000 / fps);
    };
}
if (!cancelAnimationFrame) {
    cancelAnimationFrame = function (handle) {
        clearTimeout(handle);
    };
}

function noop() { }

bezierStyleMapper = {
    "ease": getBezierFn(.25, .1, .25, 1),
    "linear": getBezierFn(0, 0, 1, 1),
    "ease-in": getBezierFn(.42, 0, 1, 1),
    "ease-out": getBezierFn(0, 0, .58, 1),
    "ease-in-out": getBezierFn(.42, 0, .58, 1)
};

// https://blog.csdn.net/backspace110/article/details/72747886
// bezier缓动函数
function getBezierFn() {
    var points, 
        numbers, 
        i, j, len, n;

    len = arguments.length;
    if(len % 2) {
        throw new TypeError("arguments length error");
    }

    //起点
    points = [{ x: 0,  y: 0 }];
    for(i = 0; i < len; i += 2) {
        points.push({
            x: parseFloat(arguments[i]),
            y: parseFloat(arguments[i + 1])
        });
    }
    //终点
    points.push({ x: 1, y: 1 });

    numbers = [];
    n = points.length - 1;
    for (i = 1; i <= n; i++) {  
        numbers[i] = 1;  
        for (j = i - 1; j >= 1; j--) {
            numbers[j] += numbers[j - 1];  
        }
        numbers[0] = 1;  
    }

    return function(t) {
        var i, p, num, value;
        if(t < 0) {
            t = 0;
        }
        if(t > 1) {
            t = 1;
        }
        value = {
            x: 0,
            y: 0
        };
        for(i = 0; i <= n; i++) {
            p = points[i];
            num = numbers[i];
            value.x += num * p.x * Math.pow(1 - t, n - i) * Math.pow(t, i);
            value.y += num * p.y * Math.pow(1 - t, n - i) * Math.pow(t, i);
        }
        return value.y;
    };
}

//动画效果
animationEaseStyle = {
    easeInQuad: function (pos) {
        return Math.pow(pos, 2);
    },
    easeOutQuad: function (pos) {
        return -(Math.pow((pos - 1), 2) - 1);
    },
    easeInOutQuad: function (pos) {
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 2);
        return -0.5 * ((pos -= 2) * pos - 2);
    },
    easeInCubic: function (pos) {
        return Math.pow(pos, 3);
    },
    easeOutCubic: function (pos) {
        return (Math.pow((pos - 1), 3) + 1);
    },
    easeInOutCubic: function (pos) {
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 3);
        return 0.5 * (Math.pow((pos - 2), 3) + 2);
    },
    easeInQuart: function (pos) {
        return Math.pow(pos, 4);
    },
    easeOutQuart: function (pos) {
        return -(Math.pow((pos - 1), 4) - 1);
    },
    easeInOutQuart: function (pos) {
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 4);
        return -0.5 * ((pos -= 2) * Math.pow(pos, 3) - 2);
    },
    easeInQuint: function (pos) {
        return Math.pow(pos, 5);
    },
    easeOutQuint: function (pos) {
        return (Math.pow((pos - 1), 5) + 1);
    },
    easeInOutQuint: function (pos) {
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 5);
        return 0.5 * (Math.pow((pos - 2), 5) + 2);
    },
    easeInSine: function (pos) {
        return -Math.cos(pos * (Math.PI / 2)) + 1;
    },
    easeOutSine: function (pos) {
        return Math.sin(pos * (Math.PI / 2));
    },
    easeInOutSine: function (pos) {
        return (-.5 * (Math.cos(Math.PI * pos) - 1));
    },
    easeInExpo: function (pos) {
        return (pos === 0) ? 0 : Math.pow(2, 10 * (pos - 1));
    },
    easeOutExpo: function (pos) {
        return (pos === 1) ? 1 : -Math.pow(2, -10 * pos) + 1;
    },
    easeInOutExpo: function (pos) {
        if (pos === 0) return 0;
        if (pos === 1) return 1;
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(2, 10 * (pos - 1));
        return 0.5 * (-Math.pow(2, -10 * --pos) + 2);
    },
    easeInCirc: function (pos) {
        return -(Math.sqrt(1 - (pos * pos)) - 1);
    },
    easeOutCirc: function (pos) {
        return Math.sqrt(1 - Math.pow((pos - 1), 2));
    },
    easeInOutCirc: function (pos) {
        if ((pos /= 0.5) < 1) return -0.5 * (Math.sqrt(1 - pos * pos) - 1);
        return 0.5 * (Math.sqrt(1 - (pos -= 2) * pos) + 1);
    },
    easeOutBounce: function (pos) {
        if ((pos) < (1 / 2.75)) {
            return (7.5625 * pos * pos);
        } else if (pos < (2 / 2.75)) {
            return (7.5625 * (pos -= (1.5 / 2.75)) * pos + .75);
        } else if (pos < (2.5 / 2.75)) {
            return (7.5625 * (pos -= (2.25 / 2.75)) * pos + .9375);
        } else {
            return (7.5625 * (pos -= (2.625 / 2.75)) * pos + .984375);
        }
    },
    easeInBack: function (pos) {
        var s = 1.70158;
        return (pos) * pos * ((s + 1) * pos - s);
    },
    easeOutBack: function (pos) {
        var s = 1.70158;
        return (pos = pos - 1) * pos * ((s + 1) * pos + s) + 1;
    },
    easeInOutBack: function (pos) {
        var s = 1.70158;
        if ((pos /= 0.5) < 1) return 0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s));
        return 0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
    },
    elastic: function (pos) {
        return -1 * Math.pow(4, -8 * pos) * Math.sin((pos * 6 - 1) * (2 * Math.PI) / 2) + 1;
    },
    swingFromTo: function (pos) {
        var s = 1.70158;
        return ((pos /= 0.5) < 1) ? 0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s)) :
            0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2);
    },
    swingFrom: function (pos) {
        var s = 1.70158;
        return pos * pos * ((s + 1) * pos - s);
    },
    swingTo: function (pos) {
        var s = 1.70158;
        return (pos -= 1) * pos * ((s + 1) * pos + s) + 1;
    },
    swing: function (pos) {
        return 0.5 - Math.cos(pos * Math.PI) / 2;
    },
    bounce: function (pos) {
        if (pos < (1 / 2.75)) {
            return (7.5625 * pos * pos);
        } else if (pos < (2 / 2.75)) {
            return (7.5625 * (pos -= (1.5 / 2.75)) * pos + .75);
        } else if (pos < (2.5 / 2.75)) {
            return (7.5625 * (pos -= (2.25 / 2.75)) * pos + .9375);
        } else {
            return (7.5625 * (pos -= (2.625 / 2.75)) * pos + .984375);
        }
    },
    bouncePast: function (pos) {
        if (pos < (1 / 2.75)) {
            return (7.5625 * pos * pos);
        } else if (pos < (2 / 2.75)) {
            return 2 - (7.5625 * (pos -= (1.5 / 2.75)) * pos + .75);
        } else if (pos < (2.5 / 2.75)) {
            return 2 - (7.5625 * (pos -= (2.25 / 2.75)) * pos + .9375);
        } else {
            return 2 - (7.5625 * (pos -= (2.625 / 2.75)) * pos + .984375);
        }
    },
    easeFromTo: function (pos) {
        if ((pos /= 0.5) < 1) return 0.5 * Math.pow(pos, 4);
        return -0.5 * ((pos -= 2) * Math.pow(pos, 3) - 2);
    },
    easeFrom: function (pos) {
        return Math.pow(pos, 4);
    },
    easeTo: function (pos) {
        return Math.pow(pos, 0.25);
    },
    linear: function (pos) {
        return pos;
    },
    sinusoidal: function (pos) {
        return (-Math.cos(pos * Math.PI) / 2) + 0.5;
    },
    reverse: function (pos) {
        return 1 - pos;
    },
    mirror: function (pos, transition) {
        transition = transition || ui.AnimationStyle.sinusoidal;
        if (pos < 0.5)
            return transition(pos * 2);
        else
            return transition(1 - (pos - 0.5) * 2);
    },
    flicker: function (pos) {
        pos = pos + (Math.random() - 0.5) / 5;
        return ui.AnimationStyle.sinusoidal(pos < 0 ? 0 : pos > 1 ? 1 : pos);
    },
    wobble: function (pos) {
        return (-Math.cos(pos * Math.PI * (9 * pos)) / 2) + 0.5;
    },
    pulse: function (pos, pulses) {
        return (-Math.cos((pos * ((pulses || 5) - .5) * 2) * Math.PI) / 2) + .5;
    },
    blink: function (pos, blinks) {
        return Math.round(pos * (blinks || 5)) % 2;
    },
    spring: function (pos) {
        return 1 - (Math.cos(pos * 4.5 * Math.PI) * Math.exp(-pos * 6));
    },
    none: function (pos) {
        return 0;
    },
    full: function (pos) {
        return 1;
    }
};

//动画执行器
function Animator () {
    //动画持续时间
    this.duration = 500;
    //动画的帧，一秒执行多少次
    this.fps = 60;
    //开始回调
    this.onBegin = false;
    //结束回调
    this.onEnd = false;
    //动画是否循环
    this.loop = false;
    //动画是否开始
    this.isStarted = false;
}
Animator.prototype = new ui.ArrayLike();
Animator.prototype.add = function (target, option) {
    if (arguments.length === 1) {
        option = target;
        target = option.target;
    }
    if (option) {
        option.target = target;
        this.push(option);
    }
    return this;
};
Animator.prototype.remove = function (option) {
    var index = -1,
        i;
    if (ui.core.type(option) !== "number") {
        for (i = this.length - 1; i >= 0; i--) {
            if (this[i] === option) {
                index = i;
                break;
            }
        }
    } else {
        index = option;
    }
    if (index < 0 || index >= this.length) {
        return;
    }
    this.splice(index, 1);
};
Animator.prototype.get = function(name) {
    var i, option;
    for(i = this.length - 1; i >= 0; i--) {
        option = this[i];
        if(option.name === name) {
            return option;
        }
    }
    return null;
};
Animator.prototype.doAnimation = function () {
    var fps,
        startTime,
        onEndFn,
        i, len,
        that;

    if (this.length === 0) {
        return;
    }

    fps = parseInt(this.fps, 10) || 60;
    len = this.length;
    onEndFn = this.onEnd;
    
    this.isStarted = true;
    that = this;
    //开始执行的时间
    startTime = new Date().getTime();
    
    (function() {
        var fn;
        fn = function() {
            var newTime,
                timestamp,
                option,
                duration,
                delta;
    
            //当前帧开始的时间
            newTime = new Date().getTime();
            //逝去时间
            timestamp = newTime - startTime;
    
            for (i = 0; i < len; i++) {
                option = that[i];
                duration = option.duration || that.duration;
                if (option.disabled || timestamp < option.delay) {
                    continue;
                }
                try {
                    if(duration + option.delay <= timestamp) {
                        delta = 1;
                        option.disabled = true;
                    } else {
                        delta = option.ease((timestamp - option.delay) / duration);
                    }
                    option.current = Math.ceil(option.begin + delta * option.change);
                    option.onChange(option.current, option.target, that);
                } catch(e) {
                    that.promise._reject(e);
                }
            }
            if (that.duration <= timestamp) {
                that.isStarted = false;
                that.stopHandle = null;
                onEndFn.call(that);
            } else {
                that.stopHandle = requestAnimationFrame(fn);
            }
        };
        that.stopHandle = requestAnimationFrame(fn, 1000 / fps);
    })();
};
Animator.prototype._prepare = function () {
    var i, len,
        option,
        durationValue,
        disabledCount = 0;
    for (i = 0, len = this.length; i < len; i++) {
        option = this[i];
        if (!option) {
            this.splice(i, 1);
            i--;
        }

        // 动画节点是否被禁用
        option.disabled = false;
        //开始位置
        option.begin = option.begin || 0;
        //结束位置
        option.end = option.end || 0;
        //变化量
        option.change = option.end - option.begin;
        //当前值
        option.current = option.begin;

        if (option.disabled || option.change === 0) {
            option.disabled = true;
            disabledCount++;
            continue;
        }
        //必须指定，基本上对top,left,width,height这个属性进行设置
        option.onChange = option.onChange || noop;
        //要使用的缓动公式
        option.ease = 
            (ui.core.isString(option.ease) ? bezierStyleMapper[option.ease] : option.ease) || animationEaseStyle.easeFromTo;
        //动画持续时间
        option.duration = option.duration || 0;
        //延迟时间
        option.delay = option.delay || 0;

        // 更新动画执行时间
        durationValue = option.duration + option.delay;
        if(durationValue > this.duration) {
            this.duration = durationValue;
        }
    }
    return this.length == disabledCount;
};
Animator.prototype.start = function (duration) {
    var _resolve, _reject,
        promise,
        flag, fn,
        that;

    this.onBegin = ui.core.isFunction(this.onBegin) ? this.onBegin : noop;
    this.onEnd = ui.core.isFunction(this.onEnd) ? this.onEnd : noop;
    
    promise = new Promise(function(resolve, reject) {
        _resolve = resolve;
        _reject = reject;
    });
    promise._resolve = _resolve;
    promise._reject = _reject;
    this.promise = promise;

    if (!this.isStarted) {
        if(ui.core.isNumber(duration) && duration > 0) {
            this.duration = duration;
        }
        this.duration = parseInt(this.duration, 10) || 500;

        flag = this._prepare();
        this.onBegin.call(this);

        that = this;
        if (flag) {
            ui.setTask(function() {
                that.onEnd.call(that);
                _resolve.call(null, that);
            });
        } else {
            fn = this.onEnd;
            this.onEnd = function () {
                this.onEnd = fn;
                fn.call(this);
                _resolve.call(null, this);
            };
            this.doAnimation();
        }
    }
    return promise;
};
Animator.prototype.stop = function () {
    var promise;
    cancelAnimationFrame(this.stopHandle);
    this.isStarted = false;
    this.stopHandle = null;
    
    promise = this.promise;
    if(promise) {
        this.promise = null;
        promise.catch(noop);
        promise._reject.call(null, "stop");
    }
};
Animator.prototype.back = function() {
    var i, len,
        option,
        temp;
    for(i = 0, len = this.length; i < len; i++) {
        option = this[i];
        temp = option.begin;
        option.begin = option.current || option.end;
        option.end = temp;
    }
    return this.start();
};

/**
 * 创建一个动画对象
 * @param {动画目标} target 
 * @param {动画参数} option 
 */
ui.animator = function (option) {
    var list = new Animator();
    list.add.apply(list, arguments);
    return list;
};

/** 动画缓函数 */
ui.AnimationStyle = animationEaseStyle;
/** 创建一个基于bezier的缓动函数 */
ui.transitionTiming = function() {
    var args,
        name;

    args = [].slice.call(arguments);
    name = args[0];
    if(!ui.core.isString(name)) {
        name = args.join(",");
    }
    if(bezierStyleMapper.hasOwnProperty(name)) {
        return bezierStyleMapper[name];
    }

    bezierStyleMapper[name] = getBezierFn.apply(this, args);
    return bezierStyleMapper[name];
};

/** 获取当前浏览器支持的动画函数 */
ui.getRequestAnimationFrame = function() {
    return requestAnimationFrame;
};
/** 获取当前浏览器支持的动画函数 */
ui.getCancelAnimationFrame = function() {
    return cancelAnimationFrame;
};

/** 淡入动画 */
ui.animator.fadeIn = function(target) {
    var display,
        opacity,
        animator;

    if(!target) {
        return;
    }

    display = target.css("dispaly");
    if(display === "block") {
        return;
    }

    opacity = parseFloat(target.css("opacity")) * 100;
    if(isNaN(opacity)) {
        opacity = 0;
        target.css("opacity", opacity);
    }
    
    target.css("display", "block");
    if(opacity >= 100) {
        return;
    }

    animator = ui.animator({
        target: target,
        begin: opacity,
        end: 100,
        ease: animationEaseStyle.easeFromTo,
        onChange: function(val) {
            this.target.css("opacity", val);
        }
    });
    animator.duration = 240;
    return animator.start();
};
/** 淡出动画 */
ui.animator.fadeOut = function(target) {
    var display,
        opacity,
        animator;

    if(!target) {
        return;
    }

    display = target.css("dispaly");
    if(display === "none") {
        return;
    }

    opacity = parseFloat(target.css("opacity")) * 100;
    if(isNaN(opacity)) {
        opacity = 100;
        target.css("opacity", opacity);
    }
    if(opacity <= 0) {
        target.css("display", "none");
        return;
    }

    animator = ui.animator({
        target: target,
        begin: opacity,
        end: 0,
        ease: animationEaseStyle.easeFromTo,
        onChange: function(val) {
            this.target.css("opacity", val);
        }
    });
    animator.onEnd = function() {
        target.css("display", "none");
    };
    animator.duration = 240;
    return animator.start();
};


})(jQuery, ui);

// Source: src/component/selector-set.js

(function($, ui) {
// SelectorSet
// 参考 https://github.com/josh/selector-set/blob/master/selector-set.js
// 针对SOON.UI的代码风格进行了重构
// 修改了部分变量名称，便于自己的理解
/*
    数据结构
    [
        {
            name: String,
            getSelector: Function,
            getElementKeys: Function,
            map: Map {
                selector: Array [
                    {
                        id: String,
                        selector: String,
                        data: Object,
                        elements: Array
                    }
                ]
            }
        }
    ]
*/
var 
    // selector匹配
    chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
    // id 匹配
    rid = /^#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g,
    // class 匹配
    rclass = /^\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g,
    // tag 匹配
    rtag = /^((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;

var 
    docElem = document.documentElement,
    matches = (docElem.matches ||
                docElem.webkitMatchesSelector ||
                docElem.mozMatchesSelector ||
                docElem.oMatchesSelector ||
                docElem.msMatchesSelector),
    selectorTypes = [],
    defaultSelectorType;

// 默认值
defaultSelectorType = {
    name: 'UNIVERSAL',
    getSelector: function() {
        return true;
    },
    getElementKeys: function() {
        return [true];
    }
};
// 添加ID匹配器 #id
selectorTypes.push({
    name: "ID",
    getSelector: function(selector) {
        var m = selector.match(rid);
        if (m) {
            // 去掉[#]号
            return m[0].substring(1);
        }
        return null;
    },
    getElementKeys: function(element) {
        if (element.id) {
            return [element.id];
        }
        return null;
    }
});
// 添加Class匹配器 .classname
selectorTypes.push({
    name: "CLASS",
    getSelector: function(selector) {
        var m = selector.match(rclass);
        if (m) {
            // 去掉[.]号
            return m[0].substring(1);
        }
        return null;
    },
    getElementKeys: function(element) {
        var className = element.className;
        if(className) {
            if (typeof className === "string") {
                return className.split(/\s/);
            } else if (typeof className === "object" && "baseVal" in className) {
                // className is a SVGAnimatedString
                // global SVGAnimatedString is not an exposed global in Opera 12
                return className.baseVal.split(/\s/);
            }
        }
        return null;
    }
});
// 添加Tag匹配器 A DIV
selectorTypes.push({
    name: "TAG",
    getSelector: function(selector) {
        var m = selector.match(rtag);
        if (m) {
            return m[0].toUpperCase();
        }
        return null;
    },
    getElementKeys: function(element) {
        return [element.nodeName.toUpperCase()];
    }
});


// 匹配selector
function parseSelectorTypes(allTypes, selector) {
    var i, j, len,
        matches,
        rest,
        key, type,
        types = [],
        shouldCancel;

    allTypes = allTypes.slice(0).concat(allTypes['default']);
    len = allTypes.length;

    rest = selector;
    do {
        // reset index
        chunker.exec('');
        matches = chunker.exec(rest);
        if(matches) {
            rest = matches[3];
            if (matches[2] || !rest) {
                for (i = 0; i < len; i++) {
                    type = allTypes[i];
                    key = type.getSelector(matches[1]);
                    if(key) {
                        j = types.length;
                        shouldCancel = false;
                        while(j--) {
                            if (types[j].type === type && types[j].key === key) {
                                shouldCancel = true;
                                break;
                            }
                        }
                        if(!shouldCancel) {
                            types.push({
                                type: type,
                                key: key
                            });
                        }
                        break;
                    }
                }
            }
        }
    } while(matches);

    return types;
}

function findByPrototype(target, proto) {
    var i, len, item;
    for(i = 0, len = target.length; i < len; i++) {
        item = target[i];
        if(proto.isPrototypeOf(item)) {
            return item;
        }
    }
}

function sortById(a, b) {
    return a.id - b.id;
}

function SelectorSet() {
    if(!(this instanceof SelectorSet)) {
        return new SelectorSet();
    }

    this.count = 0;
    this.uid = 0;

    this.types = Object.create(selectorTypes);
    this.types["default"] = defaultSelectorType;

    this.activeTypes = [];
    this.selectors = [];
}
SelectorSet.prototype = {
    constructor: SelectorSet,
    add: function(selector, data) {
        var types, typeItem,
            activeTypes, activeType,
            i, len,
            target, targets;

        if(!ui.core.isString(selector)) {
            return;
        }

        target = {
            id: this.uid++,
            selector: selector,
            data: data
        };

        types = parseSelectorTypes(this.types, selector);
        activeTypes = this.activeTypes;
        for (i = 0, len = types.length; i < len; i++) {
            typeItem = types[i];
            activeType = findByPrototype(activeTypes, typeItem.type);
            if(!activeType) {
                activeType = Object.create(typeItem.type);
                activeType.map = new Map();
                activeTypes.push(activeType);
            }

            if(typeItem.type === this.types["default"]) {
                // TODO 使用了默认的类型
            }

            targets = activeType.map.get(typeItem.key);
            if(!targets) {
                targets = [];
                activeType.map.set(typeItem.key, targets);
            }
            targets.push(target);
        }

        this.count++;
        this.selectors.push(selector);
    },
    remove: function(selector, data) {
        var types, typeItem,
            activeTypes, activeType,
            i, len, j, k,
            targets, target,
            removeAll,
            removeCount = 0;
        if(!ui.core.isString(selector)) {
            return;
        }

        removeAll = arguments.length === 1;
        types = parseSelectorTypes(this.types, selector);
        activeTypes = this.activeTypes;
        for (i = 0, len = types.length; i < len; i++) {
            typeItem = types[i];
            j = activeTypes.length;
            while(j--) {
                activeType = activeTypes[j];
                if(typeItem.type.isPrototypeOf(activeType)) {
                    targets = activeType.map.get(typeItem.key);
                    if(targets) {
                        k = targets.length;
                        while(k--) {
                            target = targets[k];
                            if(target.selector === selector && (removeAll || target.data === data)) {
                                targets.splice(k, 1);
                                removeCount++;
                            }
                        }
                    }
                }
            }
        }
        this.count -= removeCount;
    },
    matchesSelector: function(element, selector) {
        return matches.call(element, selector);
    },
    querySelectorAll: function(selectors, context) {
        return context.querySelectorAll(selectors);
    },
    queryAll: function(context) {
        var targets, target,
            results,
            elements, element,
            i, len, j, jlen, matches, match;
        if(this.selectors.length === 0) {
            return [];
        }

        targets = {};
        results = [];
        elements = this.querySelectorAll(this.selectors.join[", "], context);

        for(i = 0, len = elements.length; i < len; i++) {
            element = elements[i];
            matches = this.matches(element);
            for(j = 0, jlen = matches.length; j < jlen; j++) {
                match = m[j];
                if(!targets[match.id]) {
                    target = {
                        id: match.id,
                        selector: match.selector,
                        data: match.data,
                        elements: []
                    };
                    targets[match.id] = target;
                    results.push(target);
                } else {
                    target = targets[match.id];
                }
                target.elements.push(element);
            }
        }
        
        return results.sort(sortById);
    },
    matches: function(element) {
        var activeTypes, activeType,
            i, len, j, jlen, k, klen, keys,
            targets, target,
            matchedIds, matches;
        if(!element) {
            return [];
        }

        matchedIds = {};
        matches = [];
        activeTypes = this.activeTypes;
        for (i = 0, len = activeTypes.length; i < len; i++) {
            activeType = activeTypes[i];
            keys = activeType.getElementKeys(element);
            if(keys) {
                for(j = 0, jlen = keys.length; j < jlen; j++) {
                    targets = activeType.map.get(keys[i]);
                    if(targets) {
                        for(k = 0, klen = targets.length; k < klen; k++) {
                            target = targets[k];
                            if (!matchedIds[target.id] && this.matchesSelector(element, target.selector)) {
                                matchedIds[target.id] = true;
                                matches.push(target);
                            }
                        }
                    }
                }
            }
        }
        return matches.sort(sortById);
    }
};

ui.SelectorSet = SelectorSet;


})(jQuery, ui);

// Source: src/component/event-delegate.js

(function($, ui) {
// EventDelegate
// 参考 https://github.com/dgraham/delegated-events/blob/master/delegated-events.js
// 针对SOON.UI的代码风格进行了重构
// 修改了部分变量名称，便于自己的理解

var 
    bubbleEvents = {},
    captureEvents = {},
    currentTargetDescriptor = 
        ui.core.isFunction(Object.getOwnPropertyDescriptor) ?
            Object.getOwnPropertyDescriptor(Event.prototype, "currentTarget") : null;

function before(target, methodName, fn) {
    var sourceFn = target[methodName];
    target[methodName] = function() {
        fn.apply(target, arguments);
        return sourceFn.apply(target, arguments);
    };
    return target;
}

function overrideCurrentTargetProperty(event) {
    var sourceCurrentTarget,
        currentTargetValue = null,
        operator = {};
    if(currentTargetDescriptor) {
        Object.defineProperty(event, "currentTarget", {
            configurable: true,
            enumerable: true,
            get: function() {
                return currentTargetValue;
            }
        });
        operator.update = function(value) {
            currentTargetValue = value;
        };
        operator.reset = function(value) {
            Object.defineProperty(event, "currentTarget", {
                configurable: true,
                enumerable: true,
                get: currentTargetDescriptor.get
            });
        };
    } else {
        sourceCurrentTarget = event.currentTarget;
        operator.update = function(value) {
            event.currentTarget = value;
        };
        operator.reset = function() {
            event.currentTarget = sourceCurrentTarget;
        };
    }
    return operator;
}

function matches(selectorSet, element, reverse) {
    var queue = [],
        node = element,
        matches, matched;

    do {
        if(node.nodeType !== 1) {
            break;
        }
        matches = selectorSet.matches(node);
        if(matches.length > 0) {
            matched = {
                node: node,
                observers: matches
            };
            if(reverse) {
                queue.shift(matched);
            } else {
                queue.push(matched);
            }
        }
        node = node.parentElement;
    } while(node);

    return queue;
}

function dispatch(event) {
    var events = event.eventPhase === 1 ? captureEvents : bubbleEvents,
        selectorSet = events[event.type],
        queue, item,
        i, len, j, jlen,
        propagationStopped = false,
        immediatePropagationStopped = false,
        currentTargetOperator;

    if(!selectorSet) {
        return;
    }

    queue = matches(selectorSet, event.target, event.eventPhase === 1);
    len = queue.length;
    if(len === 0) {
        return;
    }

    before(event, "stopPropagation", function() {
        propagationStopped = true;
    });
    before(event, "stopImmediatePropagation", function() {
        immediatePropagationStopped = true;
    });
    currentTargetOperator = overrideCurrentTargetProperty(event);
    
    for(i = 0; i < len; i++) {
        if(propagationStopped) {
            break;
        }
        item = queue[i];
        currentTargetOperator.update(item.node);
        for(j = 0, jlen = item.observers.length; j < jlen; j++) {
            if(immediatePropagationStopped) {
                break;
            }
            item.observers[j].data.call(item.node, event);
        }
    }

    currentTargetOperator.reset();
}

function on(eventName, selector, fn, option) {
    var capture, events, selectorSet;

    if(!eventName || !selector) {
        return;
    }

    if(!ui.core.isFunction(fn)) {
        return;
    }

    capture = option && option.capture ? true : false,
    events = capture ? captureEvents : bubbleEvents,
    selectorSet = events[eventName];

    if(!selectorSet) {
        selectorSet = new ui.SelectorSet();
        events[eventName] = selectorSet;
        document.addEventListener(eventName, dispatch, capture);
    }
    selectorSet.add(selector, fn);
}

function off(eventName, selector, fn, option) {
    var capture, events, selectorSet;

    if(!eventName || !selector) {
        return;
    }

    capture = option && option.capture ? true : false,
    events = capture ? captureEvents : bubbleEvents,
    selectorSet = events[eventName];
    if(!selectorSet) {
        return;
    }

    selectorSet.remove(selector, fn);
    if(selectorSet.count === 0) {
        delete events[eventName];
        document.removeEventListener(name, dispatch, capture);
    }
}

function fire(target, eventName, detail) {
    return target.dispatchEvent(
        new CustomEvent(eventName, {
            bubbles: true,
            cancelable: true,
            detail: detail
        })
    );
}

ui.on = on;
ui.off = off;
ui.fire = fire;

})(jQuery, ui);

// Source: src/component/custom-event.js

(function($, ui) {
// custom event

function CustomEventArgs(args) {
    if(!(this instanceof CustomEventArgs)) {
        return new CustomEventArgs(args);
    }

    this.copyTo.call(args, this);
}
CustomEventArgs.prototype = {
    constructor: CustomEventArgs,
    copyTo: function(target) {
        if(!target) {
            return;
        }

        var that = this;
        Object.keys(that).forEach(function(key) {
            target[key] = that[key];
        });
    }
};

function CustomEvent (target) {
    this._listeners = {};
    this._eventTarget = target || this;
}
CustomEvent.prototype = {
    constructor: CustomEvent,
    addEventListener: function (type, data, callback, priority) {
        var list, 
            listener, 
            index, i;

        if (ui.core.isNumeric(callback) && isFinite(callback)) {
            priority = callback;
            callback = null;
        }
        if(ui.core.isFunction(data)) {
            callback = data;
            data = null;
        }

        list = this._listeners[type];
        if (!list) {
            this._listeners[type] = list = [];
        }

        i = list.length;
        index = 0;
        priority = priority || 0;
        while (--i > -1) {
            listener = list[i];
            if (listener.callback === callback) {
                list.splice(i, 1);
            } else if (index === 0 && listener.priority < priority) {
                index = i + 1;
            }
        }

        list.splice(index, 0, {
            callback: callback,
            data: data,
            priority: priority
        });
    },
    removeEventListener: function (type, callback) {
        var list = this._listeners[type], i;
        if (list) {
            i = list.length;
            while (--i > -1) {
                if (list[i].callback === callback) {
                    list.splice(i, 1);
                    return;
                }
            }
        }
    },
    dispatchEvent: function (type) {
        var list = this._listeners[type],
            target, args, i,
            listener,
            result;
        if (list && list.length > 0) {
            target = this._eventTarget;
            args = Array.apply([], arguments);
            i = list.length;
            while (--i > -1) {
                listener = list[i];
                args[0] = {
                    type: type,
                    target: target,
                    data: listener.data
                };
                result = listener.callback.apply(target, args);
            }
            return result;
        }
    },
    hasEvent: function (type) {
        var list = this._listeners[type];
        return list && list.length > 0;
    },
    initEvents: function (events, target) {
        var that = this;

        if (!target) {
            target = this._eventTarget;
        }
        if (!events) {
            events = target.events;
        }
        if (!Array.isArray(events) || events.length === 0) {
            return;
        }

        target.on = function (type, data, callback, priority) {
            that.addEventListener(type, data, callback, priority);
        };
        target.off = function (type, callback) {
            that.removeEventListener(type, callback);
        };
        target.fire = function (type) {
            var args = Array.apply([], arguments);
            return that.dispatchEvent.apply(that, args);
        };

        events.forEach(function(eventName) {
            target[eventName] = that._createEventFunction(eventName, target);
        });
    },
    _createEventFunction: function (type, target) {
        var eventName = type;
        return function (data, callback, priority) {
            if (arguments.length > 0) {
                target.on(eventName, data, callback, priority);
            }
        };
    }
};

ui.CustomEvent = CustomEvent;


})(jQuery, ui);

// Source: src/component/ajax.js

(function($, ui) {
// ajax

var msie = 0,
    useOnload,
    /**
     * Cross-Origin Resource Sharing(CORS)是允许来自浏览器的跨域通信的W3C规范。
     * 通过设置XMLHttpRequest的头部，CORS允许开发者使用类似同域中请求惯用的方法
     * https://www.cnblogs.com/linda586586/p/4351452.html
     * http://www.w3.org/TR/cors/
     */
    supportCORS = false,
    // 是否为本地模式
    isLocal = false,
    global = ui.core.global(),
    head,

    HttpRequest,
    httpRequestMethods,
    httpRequestProcessor,
    
    ensureOption,
    ajaxConverter,

    eventDispatcher,
    events = ["start", "end", "success", "error", "complete", "stop"],
    
    acceptsAll,
    accepts,
    rquery = /\?/,
    rjsonp = /(=)\?(?=&|$)|\?\?/,
    rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg,
    rnoContent = /^(?:GET|HEAD)$/,
    requestIDSeed = parseInt((Math.random() + "").substring(2), 10),
    jsonpCallbackSeed = parseInt((Math.random() + "").substring(2), 10);

function noop() {}

head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
// 检测IE的版本
if(global.VBArray) {
    msie = document.documentMode || (global.XMLHttpRequest ? 7 : 6);
}
// 是否使用新的XMLHttpRequest onload事件
useOnload = msie === 0 || msie > 8;
// 检查IE是否支持跨域
if(msie >= 9) {
    supportCORS = typeof (new XMLHttpRequest()).withCredentials === "boolean";
}

try {
    // 如果在IE下如果重置了document.domain，直接访问window.location会抛错，但用document.URL就ok了 
    isLocal = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/.test(location.protocol);
} catch(e) {}

// 获取HttpRequest对象
(function() {
    var 
        types = [
            "XMLHttpRequest",
            "ActiveXObject('MSXML2.XMLHTTP.6.0')",
            "ActiveXObject('MSXML2.XMLHTTP.3.0')",
            "ActiveXObject('MSXML2.XMLHTTP')",
            "ActiveXObject('Microsoft.XMLHTTP')"
        ],
        i, len, type;
    for(i = 0, len = types.length; i < len; i++) {
        type = types[i];
        try {
            if(eval("new " + type)) {
                HttpRequest = new Function("return new " + type);
                break;
            } 
        } catch(e) {}
    }
})();

// 定义HTTP Header中Accept的类型
// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
acceptsAll = "*/".concat( "*" );
accepts = {
    xml: "application/xml, text/xml",
    html: "text/html",
    text: "text/plain",
    json: "application/json, text/javascript",
    script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
};

function isJsonContent(contentType) {
    return contentType.startsWith("application/json") ||
        contentType.startsWith("text/javascript") ||
        contentType.startsWith("text/json") ||
        contentType.startsWith("application/javascript");
}

httpRequestProcessor = {
    ajax: {
        // ajax数据预处理
        prepareData: function() {
            var option = this.option,
                dataType = ui.core.type(option.data),
                appendChar;
            if(dataType === "string") {
                this.querystring = option.data;
            } else {
                if(dataType === "null" || dataType === "undefined") {
                    this.querystring = "";
                } else if(dataType === "array" || dataType === "object") {
                    if(isJsonContent(option.contentType)) {
                        this.querystring = JSON.stringify(option.data);
                    } else {
                        this.querystring = ui.param(option.data);
                    }
                } else {
                    this.querystring = option.data + "";
                }
            }

            // HTTP Method GET和HEAD没有RequestBody
            this.hasRequestBody = !rnoContent.test(option.type);
            if(!this.hasRequestBody) {
                // 请求没有requestBody，把参数放到url上
                appendChar = rquery.test(option.url) ? "&" : "?";
                if(this.querystring) {
                    option.url += appendChar + this.querystring;
                    this.querystring = null;
                }
                if(option.cache === false) {
                    option.url += appendChar + "_time=" + (new Date() - 0);
                }
            }
        },
        // 发起请求
        request: function() {
            var that, i;

            that = this;
            this.xhr = new HttpRequest();
            this.xhr.open(
                this.option.type,
                this.option.url,
                this.option.async,
                this.option.username,
                this.option.password
            );
            if(this.mimeType && this.xhr.overrideMimeType) {
                this.xhr.overrideMimeType(this.mimeType);
            }
            // IE6不能修改xhr的属性
            if(this.option.crossDomain && supportCORS) {
                this.xhr.withCredentials = true;
            }

            if(!this.option.crossDomain) {
                // 设置ajax请求的标识
                // 在 Chrome、Firefox 3.5+ 和 Safari 4+ 下，在进行跨域请求时设置自定义 header，会触发 preflighted requests，会预先发送 method 为 OPTIONS 的请求。
                // 所以只有不跨域的时候设置
                this.requestHeaders["X-Requested-With"] = "XMLHttpRequest";
            }

            // 设置HTTP Headers
            for(i in this.requestHeaders) {
                if(this.requestHeaders.hasOwnProperty(i)) {
                    this.xhr.setRequestHeader(i, this.requestHeaders[i] + "");
                }
            }

            // 进度事件
            if(ui.core.isFunction(this.option.progress)) {
                if(msie === 0 || msie > 9) {
                    this.xhr.onprogress = this.option.progress;
                }
            }

            if("responseType" in this.xhr && /^(blob|arraybuffer|text)$/.test(this.option.dataType)) {
                this.xhr.responseType = this.option.dataType;
                this.useResponseType = true;
            } else {
                this.useResponseType = false;
            }

            // 判断是否采用原生的超时方法
            if(this._timeoutID && this.xhr.timeout === 0) {
                clearTimeout(this._timeoutID);
                delete this._timeoutID;
                this.xhr.timeout = option.timeout;
                this.xhr.ontimeout = function() {
                    that.dispatch(0, "timeout");
                };
            }

            //必须要支持 FormData 和 file.fileList 的浏览器 才能用 xhr 发送
            //标准规定的 multipart/form-data 发送必须用 utf-8 格式， 记得 ie 会受到 document.charset 的影响
            this.xhr.send(this.hasRequestBody && (this.formdata || this.querystring) || null);
            
            //在同步模式中,IE6,7可能会直接从缓存中读取数据而不会发出请求,因此我们需要手动调用响应处理函数
            if(!this.option.async || this.xhr.readyState === 4) {
                this.respond();
            } else {
                if(useOnload) {
                    this.xhr.onload = this.xhr.onerror = function(e) {
                        //that.xhr.readyState = 4;
                        //that.xhr.status = e.type === "load" ? 200 : 500;
                        that.respond();
                    };
                } else {
                    this.xhr.onreadystatechange = function() {
                        if(that.xhr.readyState === 4) {
                            that.respond();
                        }
                    };
                }
            }
        },
        // 处理相应 用于获取原始的responseXMLresponseText 修正status statusText
        respond: function(event, forceAbort) {
            var completed,
                status,
                statusText;
            if(!this.xhr) {
                return;
            }

            try {
                completed = this.xhr.readyState === 4;
                if(completed || forceAbort) {
                    if(!useOnload) {
                        this.xhr.onreadystatechange = noop;
                    } else {
                        this.xhr.onload = this.xhr.onerror = null;
                    }
                    if(forceAbort) {
                        if(!completed && ui.core.isFunction(this.xhr.abort)) {
                            this.xhr.abort();
                        }
                    } else {
                        status = this.xhr.status;
                        this.responseText = 
                            ui.core.isString(this.xhr.responseText) ? this.xhr.responseText : "";
                        // 设置responseXML
                        try {
                            this.responseXML = this.xhr.responseXML.documentElement;
                        } catch(e) {}
                        // 设置response
                        if(this.useResponseType) {
                            this.response = this.xhr.response;
                        }
                        // 设置responseHeadersString
                        this.responseHeadersString = this.xhr.getAllResponseHeaders();

                        try {
                            // 火狐在跨城请求时访问statusText值会抛出异常
                            statusText = this.xhr.statusText;
                        } catch(e) {
                            this.error = e;
                            statusText = "firefoxaccesserror";
                        }

                        // 处理本地请求，只要有数据就算成功
                        if(!status && isLocal && !this.option.crossDomain) {
                            status = this.responseText ? 200 : 404;
                        } else if(status === 1223) {
                            // IE会把204当成1223
                            status = 204;
                        }
                        this.dispatch(status, statusText);
                    }
                }
            } catch(e) {
                if(!forceAbort) {
                    this.dispatch(500, e);
                }
            }
        }
    },
    jsonp: {
        preprocess: function() {
            var callbackName,
                names,
                name, 
                i, len,
                callback;
            
            callbackName = this.option.jsonpCallback || "ui.jsonp_callback_" + (jsonpCallbackSeed--);
            this.jsonpCallbackName = callbackName;
            if(rjsonp.test(this.option.url)) {
                this.option.url = this.option.url.replace(rjsonp, "$1" + callbackName);
            } else {
                this.option.url = this.option.url + 
                    (rquery.test(this.option.url) ? "&" : "?") + 
                    this.option.jsonp + "=" + callbackName;
            }

            // 把jsonp的结果处理成为全局变量
            names = callbackName.split(".");
            callback = global;
            for(i = 0, len = names.length - 1; i < len; i++) {
                name = names[i];
                if(!callback[name]) {
                    callback[name] = {};
                }
                callback = callback[name];
            }

            name = names[len];
            callback[name] = function(data) {
                callback[name] = data;
            };
            this.getJsonpCallBack = function() {
                return callback[name];
            };

            this.finally((function() {
                // 移除jsonp的全局回调函数
                delete callback[name];
                delete this.jsonpCallbackName;
                delete this.getJsonpCallBack;
            }).bind(this));

            // jsonp 类型替换为script
            return "script";
        }
    },
    script: {
        request: function() {
            var that;

            this.xhr = document.createElement("script");
            if(this.option.charset) {
                this.xhr.charset = this.option.charset;
            }
            that = this;
            this.xhr.onerror = this.xhr[useOnload ? "onload" : "onreadystatechange"] = function() {
                that.respond();
            };
            this.xhr.src = this.option.url;
            head.insertBefore(this.xhr, head.firstChild);
        },
        respond: function(event, forceAbort) {
            var isCompleted,
                parent,
                callback,
                args;
            if(!this.xhr) {
                return;
            }

            isCompleted = /loaded|complete|undefined/i.test(this.xhr.readyState);
            if(forceAbort || isCompleted) {
                this.xhr.onerror = 
                    this.xhr.onload = 
                        this.xhr.onreadystatechange = null;
                
                parent = this.xhr.parentNode;
                if(parent) {
                    parent.removeChild(this.xhr);
                }
                if(!forceAbort) {
                    callback = this.jsonpCallbackName;
                    if(callback) {
                        callback = this.getJsonpCallBack();
                        // 此时回调函数应该已经变成了jsonp的数据，如果还是函数，则说明jsonp调用失败了
                        args = ui.core.isFunction(callback) ? [500, "error"] : [200, "success"];
                    } else {
                        args = [200, "success"];
                    }

                    this.dispatch.apply(this, args);
                }
            }
        }
    },
    upload: {
        preprocess: function() {
            // 上传文件使用的是RFC1867
            // contentType = multipart/form-data会自动设置
            // 会自动设置，不要手动设置，因为还需要设置boundary，这个是浏览器自动生成的
            this.option.contentType = "";
        },
        prepareData: function() {
            var files = this.option.files,
                formData,
                data;
            
            data = this.option.data;
            if(data instanceof FormData) {
                formData = this.data;
            } else {
                formData = new FormData();
            }
            
            if(files) {
                if(!Array.isArray(files)) {
                    files = [files];
                }
                files.forEach(function(blob, index) {
                    var i;
                    if(ui.core.isDomObject(blob) && blob.nodeName === "INPUT" && blob.type === "file") {
                        if(blob.files) {
                            if(blob.files.length > 1) {
                                for(i = 0; i < blob.files.length; i++) {
                                    formData.append(blob.name + "[" + i + "]", blob.files[i]);
                                }
                            } else {
                                formData.append(blob.name, blob.files[0]);
                            }
                        }
                    } else if(blob instanceof Blob) {
                        formData.append("file_" + index, blob);
                    }
                });
            }

            // 添加其它文本数据
            if(ui.core.isString(data)) {
                formData.append("fileinfo", data); 
            } else if(ui.core.isPlainObject(data)) {
                Object.keys(data).forEach(function(key) {
                    formData.append(encodeURIComponent(key), encodeURIComponent(data[key]));
                });
            }

            this.formdata = formData;
            this.hasRequestBody = true;
        }
    }
};

// 设置jsonp和script的数据处理函数
httpRequestProcessor.jsonp.prepareData = httpRequestProcessor.ajax.prepareData;
httpRequestProcessor.script.prepareData = httpRequestProcessor.ajax.prepareData;
// 完善jsonp的接口
httpRequestProcessor.jsonp.request = httpRequestProcessor.script.request;
httpRequestProcessor.jsonp.respond = httpRequestProcessor.script.respond;
// 完善upload的接口 upload有自己的数据处理函数
httpRequestProcessor.upload.request = httpRequestProcessor.ajax.request;
httpRequestProcessor.upload.respond = httpRequestProcessor.ajax.respond;

/**
 * ajax数据转换器
 */
ajaxConverter = {
    text: function(text) {
        return text + "";
    },
    xml: function(text, xml) {
        return xml ? xml : ui.parseXML(text);
    },
    html: function(text) {
        // TODO 还没有完成HTML Parser
        return ui.parseHTML(text);
    },
    json: function(text) {
        return JSON.parse(text);
    },
    script: function(text) {
        ui.globalEval(text);
        return text;
    },
    jsonp: function() {
        var jsonpData,
            callback;
        try {
            jsonpData = this.getJsonpCallBack();
        } catch(e) {
            jsonpData = undefined;
            ui.handleError("the jsonp callback is undefined.");
        }

        return jsonpData;
    }
};

/**
 * ajax对象实例方法
 * 伪XMLHttpRequest类,用于屏蔽浏览器差异性
 * var ajax = new(self.XMLHttpRequest||ActiveXObject)("Microsoft.XMLHTTP")
 * ajax.onreadystatechange = function() {
 *     if (ajax.readyState === 4 && ajax.status === 200) {
 *         alert(ajax.responseText)
 *     }
 * }
 * ajax.open("POST", url, true) 
 * ajax.send("key=val&key1=val2") 
 */
httpRequestMethods = {
    setRequestHeader: function (name, value) {
        this.requestHeaders[name] = value;
        return this;
    },
    getAllResponseHeaders: function () {
        return this.readyState === 4 ? this.responseHeadersString : null;
    },
    getResponseHeader: function (name, match) {
        if (this.readyState === 4) {
            while ((match = rheaders.exec(this.responseHeadersString))) {
                this.responseHeaders[match[1]] = match[2];
            }
            match = this.responseHeaders[name];
        }
        return match === undefined ? null : match;
    },
    overrideMimeType: function (type) {
        this.mimeType = type;
        return this;
    },
    // 中止请求
    abort: function (statusText) {
        statusText = statusText || "abort";
        if (this.xhr) {
            this.respond(0, statusText);
        }
        return this;
    },
    /**
     * 用于派发success,error,complete等回调
     * http://www.cnblogs.com/rubylouvre/archive/2011/05/18/2049989.html
     * @param {Number} status 状态码
     * @param {String} statusText 对应的扼要描述
     */
    dispatch: function (status, nativeStatusText) {
        var statusText = nativeStatusText,
            isSuccess,
            dataType,
            that;
        // 防止重复执行
        if (!this.xhr) { // 执行完毕后原生的xhr对象会被删除
            return;
        }

        this.readyState = 4;

        // 200: 成功
        // 201: 创建
        // 202: 已接受
        // 203: 非授权信息，服务器成功执行了请求
        // 204: 空内容，服务器成功执行了请求
        // 205: 重置内容，服务器成功执行了请求，但是但是没有返回内容
        // 206: 部分内容  服务器成功执行了部分请求
        // 304: 来自本地缓存
        isSuccess = status >= 200 && status < 300 || status === 304;
        if(isSuccess) {
            if(status === 204 || this.option.type === "HEAD") {
                statusText = "nocontent";
            } else if(status === 304) {
                statusText = "notmodified";
            } else {
                if(typeof this.response === "undefined") {
                    dataType = this.option.dataType || this.mimeType;
                    if(!dataType && this.responseText || this.responseXML) {
                        //如果没有指定dataType，则根据mimeType或Content-Type进行揣测
                        dataType = this.getResponseHeader("Content-Type") || "";
                        dataType = dataType.match(/json|xml|script|html/i) || ["text"];
                        dataType = dataType[0].toLowerCase();
                    }
                    try {
                        this.response = ajaxConverter[dataType].call(
                            this, 
                            this.responseText || "",
                            this.responseXML);
                    } catch(e) {
                        isSuccess = false;
                        this.error = e;
                        statusText = "parsererror";
                    }
                }
            }
        } else {
            if(!statusText) {
                statusText = "error";
            }
            if(status < 0) {
                status = 0;
            }
        }
        this.status = status;
        this.statusText = statusText + "";

        if(this._timeoutID) {
            // 移除超时回调
            clearTimeout(this._timeoutID);
            delete this._timeoutID;
        }

        that = this;
        if(isSuccess) {
            this._resolve({
                data: this.response, 
                statusText: statusText, 
                ajaxRequest: this
            });
            ui.setTask(function() {
                ui.ajax.global.fire("success", that, that.option, statusText);
            });
        } else {
            this._reject({
                ajaxRequest: this, 
                statusText: statusText, 
                error: this.error
            });
            ui.setTask(function() {
                ui.ajax.global.fire("error", that, that.option, statusText);
            });
        }
        delete this.xhr;
        ui.ajax.global.activeIndex--;
        ui.setTask(function() {
            ui.ajax.global.fire("complete", that, that.option);
        });

        if(ui.ajax.global.activeIndex === 0) {
            // 最后一个ajax执行完毕
            ui.setTask(function() {
                if(ui.ajax.global.activeIndex === 0) {
                    ui.ajax.global.fire("stop");
                }
            });
        }
    }
};

ensureOption = (function() {
    var defaultOption = {
        // request method
        type: "GET",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        async: true,
        timeout: 0,
        jsonp: "callback"
    };
    
    var rprotocol = /^\/\//,
        rhash = /#.*$/,
        rnoContent = /^(?:GET|HEAD)$/;

    var originAnchor = document.createElement("a");
    originAnchor.href = location.href;

    return function(option, ajaxRequest) {
        var urlAnchor;

        option = ui.extend({}, defaultOption, option);

        option.type = option.type.toUpperCase();
        option.contentType = option.contentType.trim();
        option.url = option.url.replace(rhash, "").replace(rprotocol, location.protocol + "//");

        if(!ui.core.isNumeric(option.timeout)|| option.timeout < 0) {
            option.timeout = 0;
        }

        if(!ui.core.isBoolean(option.crossDomain)) {
            // 检查请求是否跨域
            urlAnchor = document.createElement("a");
            try {
                urlAnchor.href = option.url;
                // IE7之前的版本中的getAttribute有第二个参数
                // http://technet.microsoft.com/zh-cn/library/aa752280
                // 0 default 不区分大小写, 1 区分大小写, 2 返回BSTR形式的属性值, 4 返回完整的URL路径，只对URL有效
                urlAnchor.href = !"1"[0] ? urlAnchor.getAttribute("href", 4) : urlAnchor.href;
                option.crossDomain = originAnchor.protocol + "//" + originAnchor.host !== urlAnchor.protocol + "//" + urlAnchor.host;
            } catch(e) {
                option.crossDomain = true;
            }
        }

        return option;
    };
})();

function ajax(option) {
    var ajaxRequest,
        promise, _resolve, _reject,
        dataType;

    if(!option || !option.url) {
        throw new TypeError("参数必须为Object并且拥有url属性");
    }

    ajaxRequest = {
        responseHeadersString: "",
        responseHeaders: {},
        requestHeaders: {},
        querystring: option.querystring,
        readyState: 0,
        uniqueID: requestIDSeed--,
        status: 0
    };

    promise = new Promise(function(resolve, reject) {
        _resolve = resolve;
        _reject = reject;
    });
    promise._resolve = _resolve;
    promise._reject = _reject;

    ajaxRequest = ui.extend(promise, ajaxRequest, httpRequestMethods);
    option = ensureOption(option, ajaxRequest);
    ajaxRequest.option = option;
    ajaxRequest.async = !(option.async === false);

    if((option.crossDomain && !supportCORS || rjsonp.test(option.url)) && 
        option.dataType === "json" && option.type === "GET") {
        option.dataType = "jsonp";
    }
    dataType = option.dataType;
    ui.extend(ajaxRequest, 
        (httpRequestProcessor[option.files ? "upload" : dataType] || 
            httpRequestProcessor.ajax));

    if(ajaxRequest.preprocess) {
        dataType = ajaxRequest.preprocess() || dataType;
    }

    // 1. Content-Type RequestBody的类型
    if(option.contentType) {
        ajaxRequest.setRequestHeader("Content-Type", option.contentType);
    }
    // 2. Accept 客户端希望接受的类型
    ajaxRequest.setRequestHeader(
        "Accept", accepts[dataType] ? accepts[dataType] + ", " + acceptsAll + "; q=0.01" : acceptsAll);
    // 3. 设置参数中的其它headers
    if(option.headers) {
        Object.keys(option.headers).forEach(function(key) {
            ajaxRequest.setRequestHeader(key, option.headers[key]);
        });
    }
    // 4. timeout
    if(option.async && option.timeout > 0) {
        ajaxRequest._timeoutID = setTimeout(function() {
            var statusText = "timeout";
            // 如果是ajax请求，abort方法会自动调用dispatch方法
            ajaxRequest.abort(statusText);
            // 如果不是ajax请求，而是script之类的，那么手动调用dispatch方法
            ajaxRequest.dispatch(0, statusText);
        }, option.timeout);
    }
    // 5. 准备发送数据
    if(ajaxRequest.prepareData) {
        ajaxRequest.prepareData();
    }

    // 设置处理方法
    ajaxRequest
        .then(option.success)
        .catch(option.error)
        .finally(option.complete);

    if(ui.ajax.global.activeIndex === 0) {
        // 第一个活动的ajax
        ui.ajax.global.fire("start");
    }
    ui.ajax.global.fire("send", ajaxRequest, option);
    ui.ajax.global.activeIndex++;

    ajaxRequest.request();
    return ajaxRequest;
}

function getScript(url, callback) {
    return ui.get(url, null, callback, "script");
}

function getJSON(url, data, callback) {
    return ui.get(url, data, callback, "json");
}

function upload(url, files, data, successFn, errorFn, dataType) {
    if (ui.core.isFunction(data)) {
        dataType = errorFn;
        errorFn = successFn;
        successFn = data;
        data = null;
    }
    return ui.ajax({
        url: url,
        type: "post",
        dataType: dataType,
        files: files,
        data: data,
        success: successFn,
        error: errorFn
    });
}

ui.ajax = ajax;
ui.ajax.global = {
    activeIndex: 0
};
eventDispatcher = new ui.CustomEvent(ui.ajax.global);
eventDispatcher.initEvents(events);

["get", "post"].forEach(function(method) {
    ui[method] = function(url, data, callback, type) {
        if(ui.core.isFunction(data)) {
            type = type || callback;
            callback = data;
            data = null;
        }
        return ui.ajax({
            url: url,
            type: method,
            data: data,
            success: callback,
            dataType: type
        });
    };
});

ui.getScript = getScript;
ui.getJSON = getJSON;
ui.upload = upload;

// TODO 扩展Ajax模式
function extendHttpProcessor() {

}

})(jQuery, ui);

// Source: src/component/ajax-extends.js

(function($, ui) {
// ajax 扩展，加入身份验证和权限验证的相关处理逻辑
var responsedJson = "X-Responded-JSON";

function unauthorized(ajaxRequest, context) {
    var json = null;
    if(ajaxRequest.status == 401) {
        return unauthorizedHandler(context);
    } else if(ajaxRequest.status == 403) {
        return forbiddenHandler(context);
    } else if(ajaxRequest.status == 200) {
        json = ajaxRequest.getResponseHeader(responsedJson);
        if(!ui.str.isEmpty(json)) {
            try {
                json = JSON.parse(json);
            } catch(e) {
                json = null;
            }
            if(json) {
                if(json.status == 401)
                    return unauthorizedHandler(context);
                else if (json.status == 403)
                    return forbiddenHandler(context);
            }
        }
    }
    return true;
}
function unauthorizedHandler(context) {
    var url = location.href,
        index;
    alert("由于您长时间未操作，需要重新登录");
    index = url.indexOf("#");
    if(index > 0) {
        url = url.substring(0, index);
        location.href = url;
    } else {
        location.replace();
    }
    return false;
}
function forbiddenHandler(context) {
    var error = {
        message: "您没有权限执行此操作，请更换用户重新登录或联系系统管理员。"
    };
    if(context && context.errorFn) {
        context.errorFn(error);
    }
    return false;
}
function successHandler(context, data, textStatus, ajaxRequest) {
    var result = unauthorized(ajaxRequest, context);
    if(result === false) {
        return;
    }
    context.successFn(data);
}
function errorHandler(context, ajaxRequest, textStatus, errorThrown) {
    var result = unauthorized(ajaxRequest, context);
    if(result === false) {
        return;
    }
    if(textStatus === "parsererror") {
        context.error.message = "没能获取预期的数据类型，转换json发生错误";
        context.error.responseText = ajaxRequest.responseText;
    } else {
        try {
            result = JSON.parse(ajaxRequest.responseText);
            context.error.message = result.message || result.Message || "Unknown Error";
        } catch(e) {
            context.error.message = ajaxRequest.responseText;
        }
    }
    context.errorFn(context.error);
}
function ajaxCall(method, url, args, successFn, errorFn, option) {
    var type,
        paramFn,
        ajaxOption,
        context = {
            error: {}
        };
    if (ui.core.isFunction(args)) {
        errorFn = successFn;
        successFn = args;
        args = null;
    }

    ajaxOption = {
        type: method.toUpperCase() === "GET" ? "GET" : "POST",
        dataType: "json",
        url: url,
        async: true,
        timeout: 3000,
        data: args
    };
    if (option) {
        ajaxOption = ui.extend(ajaxOption, option);
    }
    if(ajaxOption.type === "POST") {
        ajaxOption.contentType = "application/json; charset=utf-8";
    }

    if (ui.core.isFunction(successFn)) {
        context.successFn = successFn;
        ajaxOption.success = function(ajaxResult) {
            successHandler(context, ajaxResult.data, ajaxResult.statusText, ajaxResult.ajaxRequest);
        };
    }
    if (ui.core.isFunction(errorFn)) {
        context.errorFn = errorFn;
        ajaxOption.error = function(ajaxError) {
            errorHandler(context, ajaxError.ajaxRequest, ajaxError.statusText, ajaxError.error);
        };
    }
    return ui.ajax(ajaxOption);
}

/**
 * HttpRequest Method方式共有15种
 * Get URL传参
 * Head 没有ResponseBody，用于获取ResponseHead
 * Post ReqeustBody提交数据
 * Put 将客户端的数据发送到服务器上取代文档内容
 * Delete 删除服务器上的文件
 * Connect
 * Options
 * Trace
 * Patch
 * Move
 * Copy
 * Link
 * Unlink
 * Wrapped
 * Extension-method
 */
if(!ui.ajax) {
    // 如果没有ajax模块则使用jquery的ajax模块
    ui.ajax = function(option) {
        //准备参数
        var type, data,
            sucess,
            error;
        if(ajaxOption.contentType.indexOf("application/json") > -1) {
            data = option.data;
            type = ui.core.type(data);
            if (type !== "string") {
                if (type === "array" || dataType === "object") {
                    data = JSON.stringify(data);
                } else if(data === null || data === undefined || isNaN(data)) {
                    data = "";
                } else {
                    data = data + "";
                }
                option.data = data;
            }
        }
        if(option.success) {
            success = option.success;
            options.success = function(data, statusText, jqXHR) {
                success({
                    data: data, 
                    statusText: statusText, 
                    ajaxRequest: jqXHR
                });
            };
        }
        if(option.error) {
            error = option.error;
            option.error = function(jqXHR, statusText, errorThrown) {
                error({
                    ajaxRequest: jqXHR, 
                    statusText: statusText, 
                    error: errorThrown
                });
            };
        }
        $.ajax(option);
    };
}
/** get方式 */
ui.ajax.get = function (url, params, success, failure, option) {
    if(!option) option = {};
    option.contentType = "application/x-www-form-urlencoded; charset=UTF-8";
    return ajaxCall("GET", url, params, success, failure, option);
};
/** post方式 */
ui.ajax.post = function (url, params, success, failure, option) {
    if(!option) option = {};
    option.contentType = "application/x-www-form-urlencoded; charset=UTF-8";
    return ajaxCall("POST", url, params, success, failure, option);
};
/** post方式，提交数据为为Json格式 */
ui.ajax.postJson = function(url, params, success, failure, option) {
    return ajaxCall("POST", url, params, success, failure, option);
};
/** post方式，提交数据为Json格式，在请求期间会禁用按钮，避免多次提交 */
ui.ajax.postOnce = function (btn, url, params, success, failure, option) {
    var text,
        textFormat,
        fn;
    btn = ui.getJQueryElement(btn);
    if(!btn) {
        throw new TypeError("没有正确设置要禁用的按钮");
    }
    if(!option) {
        option = {};
    }

    textFormat = "正在{0}...";
    if(option.textFormat) {
        textFormat = option.textFormat;
        delete option.textFormat;
    }
    btn.attr("disabled", "disabled");
    fn = function() {
        btn.removeAttr("disabled");
    };
    if(btn.isNodeName("input")) {
        text = btn.val();
        if(text.length > 0) {
            btn.val(ui.str.format(textFormat, text));
        } else {
            btn.val(ui.str.format(textFormat, "处理"));
        }
        fn = function() {
            btn.val(text);
            btn.removeAttr("disabled");
        };
    } else {
        text = btn.html();
        if(!ui._rhtml.test(text)) {
            btn.text(ui.str.format(textFormat, text));
            fn = function() {
                btn.text(text);
                btn.removeAttr("disabled");
            };
        }
    }
    
    option.complete = fn;
    return ajaxCall("POST", url, params, success, failure, option);
};
/** 将多组ajax请求一起发送，待全部完成后才会执行后续的操作 */
ui.ajax.all = function () {
    var promises,
        promise;
    if (arguments.length == 1) {
        promises = [arguments[0]];
    } else if (arguments.length > 1) {
        promises = [].slice.call(arguments, 0);
    } else {
        return;
    }
    promise = Promise.all(promises);
    promise._then_old = promise.then;

    promise.then = function (resolve, reject) {
        var context;
        if (ui.core.isFunction(reject)) {
            context = {
                error: {},
                errorFn: reject
            };
            reject = function(xhr) {
                errorHandler(context, xhr);
            };
        }
        return this._then_old.call(this, resolve, reject);
    };
    return promise;
};

})(jQuery, ui);

// Source: src/component/color.js

(function($, ui) {
// color

// 各种颜色格式的正则表达式
var HEX = /^[\#]([a-fA-F\d]{6}|[a-fA-F\d]{3})$/;
var RGB = /^rgb[\(]([\s]*[\d]{1,3}[\,]{0,1}[\s]*){3}[\)]$/i;
var RGBA = /^rgba[\(]([\s]*[\d]{1,3}[\,][\s]*){3}(([\d])|(([0])?[\.][\d]+))[\)]$/i;
var MATCH_NUMBER = /(([\d]*[\.][\d]+)|([\d]+))/gm;

// 十六进制字母
var hexchars = "0123456789ABCDEF";

function toHex (n) {
    n = n || 0;
    n = parseInt(n, 10);
    if (isNaN(n))
        n = 0;
    n = Math.round(Math.min(Math.max(0, n), 255));
    return hexchars.charAt((n - n % 16) / 16) + hexchars.charAt(n % 16);
}
function toDec (hexchar) {
    return hexchars.indexOf(hexchar.toUpperCase());
}

ui.color = {
    parseRGB: function (rgb) {
        var valArr,
        	color;
        if(!RGB.test(rgb)) {
            return null;
        }
        valArr = rgb.match(MATCH_NUMBER);
        if(!valArr) {
            return null;
        }
        color = {
        	red: parseInt(valArr[0], 10),
        	green: parseInt(valArr[1], 10),
        	blue: parseInt(valArr[2], 10)
        };
        return color;
    },
    parseRGBA: function(rgba) {
        var valArr,
            color;
        if(!RGBA.test(rgba)) {
            return null;
        }
        valArr = rgba.match(MATCH_NUMBER);
        if(!valArr) {
            return null;
        }
        color = {
            red: parseInt(valArr[0], 10),
            green: parseInt(valArr[1], 10),
            blue: parseInt(valArr[2], 10),
            alpha: parseFloat(valArr[3])
        };
        return color;
    },
    parseHex: function(hex) {
        var i,
            fullHex,
            color;
        if(ui.str.isEmpty(hex)) {
            return null;
        }
        if(hex.charAt(0) === "#") {
            hex = hex.substring(1);
        }
        if(hex.length === 3) {
            fullHex = "";
            for(i = 0; i < hex.length; i++) {
                fullHex += hex.charAt(i) + hex.charAt(i);
            }
        } else {
            fullHex = hex;
        }

        color = {};
        hex = fullHex.substring(0, 2);
        color.red = toDec(hex.charAt(0)) * 16 + toDec(hex.charAt(1));
        hex = fullHex.substring(2, 4);
        color.green = toDec(hex.charAt(0)) * 16 + toDec(hex.charAt(1));
        hex = fullHex.substring(4, 6);
        color.blue = toDec(hex.charAt(0)) * 16 + toDec(hex.charAt(1));

        return color;
    },
    rgb2hex: function(red, green, blue) {
        return "#" + toHex(red) + toHex(green) + toHex(blue);
    },
    overlay: function (color1, color2, alpha) {
        var getColor,
            arr1,
            arr2,
            newColor;
        if (isNaN(alpha))
            alpha = .5;

        getColor = function(c) {
            var valArr;
            if(HEX.test(c)) {
                return this.parseHex(c);
            } else if(RGB.test(c) || RGBA.test(c)) {
                valArr = c.match(MATCH_NUMBER);
                return {
                    red: parseInt(valArr[0], 10),
                    green: parseInt(valArr[1], 10),
                    blue: parseInt(valArr[2], 10)
                };
            } else {
                return c;
            }
        };

        color1 = getColor.call(this, color1);
        color2 = getColor.call(this, color2);

        arr1 = [color1.red || 0, color1.green || 0, color1.blue || 0];
        arr2 = [color2.red || 0, color2.green || 0, color2.blue || 0];

        newColor = [];
        for (var i = 0, l = arr1.length; i < l; i++) {
            newColor[i] = Math.floor((1 - alpha) * arr1[i] + alpha * arr2[i]);
        }

        return {
            red: newColor[0],
            green: newColor[1],
            blue: newColor[2]
        };
    }
};


})(jQuery, ui);

// Source: src/component/browser.js

(function($, ui) {
// browser

var pf = (navigator.platform || "").toLowerCase(),
    ua = navigator.userAgent.toLowerCase(),
    UNKNOWN = UNKNOWN,
    platform, browser, engine,
    s;
function toFixedVersion(ver, floatLength) {
    ver = ("" + ver).replace(/_/g, ".");
    floatLength = floatLength || 1;
    ver = String(ver).split(".");
    ver = ver[0] + "." + (ver[1] || "0");
    ver = Number(ver).toFixed(floatLength);
    return ver;
}
function updateProperty(target, name, ver) {
    target.name = name;
    target.version = ver;
    target[name] = ver;
}

// 提供三个对象,每个对象都有name, version(version必然为字符串)
// 取得用户操作系统名字与版本号，如果是0表示不是此操作系统

// 平台
platform = {
    name: (window.orientation !== undefined) ? "iPod" : (pf.match(/mac|win|linux/i) || [UNKNOWN])[0],
    version: 0,
    iPod: 0,
    iPad: 0,
    iPhone: 0,
    iOS: 0,
    android: 0,
    windowsPhone: 0,
    win: 0,
    linux: 0,
    mac: 0
};
(s = ua.match(/windows ([\d.]+)/)) ? updateProperty(platform, "win", toFixedVersion(s[1])) :
        (s = ua.match(/windows nt ([\d.]+)/)) ? updateProperty(platform, "win", toFixedVersion(s[1])) :
        (s = ua.match(/linux ([\d.]+)/)) ? updateProperty(platform, "linux", toFixedVersion(s[1])) :
        (s = ua.match(/mac ([\d.]+)/)) ? updateProperty(platform, "mac", toFixedVersion(s[1])) :
        (s = ua.match(/ipod ([\d.]+)/)) ? updateProperty(platform, "iPod", toFixedVersion(s[1])) :
        (s = ua.match(/ipad[\D]*os ([\d_]+)/)) ? updateProperty(platform, "iPad", toFixedVersion(s[1])) :
        (s = ua.match(/iphone[\D]*os ([\d_]+)/)) ? updateProperty(platform, "iPhone", toFixedVersion(s[1])) :
        (s = ua.match(/android ([\d.]+)/)) ? updateProperty(platform, "android", toFixedVersion(s[1])) : 
        (s = ua.match(/windows phone ([\d.]+)/)) ? updateProperty(platform, "windowsPhone", toFixedVersion(s[1])) : 0;
if(platform.iPhone || platform.iPad) {
    platform.iOS = platform.iPhone || platform.iPad;
}

//============================================
//取得用户的浏览器名与版本,如果是0表示不是此浏览器
browser = {
    name: UNKNOWN,
    version: 0,
    ie: 0,
    edge: 0,
    firefox: 0,
    chrome: 0,
    opera: 0,
    safari: 0,
    mobileSafari: 0,
    //adobe 的air内嵌浏览器
    adobeAir: 0
};
//IE11的UA改变了没有MSIE
(s = ua.match(/edge\/([\d.]+)/)) ? updateProperty(browser, "edge", toFixedVersion(s[1])) :
        (s = ua.match(/trident.*; rv\:([\d.]+)/)) ? updateProperty(browser, "ie", toFixedVersion(s[1])) : 
        (s = ua.match(/msie ([\d.]+)/)) ? updateProperty(browser, "ie", toFixedVersion(s[1])) :
        (s = ua.match(/firefox\/([\d.]+)/)) ? updateProperty(browser, "firefox", toFixedVersion(s[1])) :
        (s = ua.match(/chrome\/([\d.]+)/)) ? updateProperty(browser, "chrome", toFixedVersion(s[1])) :
        (s = ua.match(/opera.([\d.]+)/)) ? updateProperty(browser, "opera", toFixedVersion(s[1])) :
        (s = ua.match(/adobeair\/([\d.]+)/)) ? updateProperty(browser, "adobeAir", toFixedVersion(s[1])) :
        (s = ua.match(/version\/([\d.]+).*safari/)) ? updateProperty(browser, "safari", toFixedVersion(s[1])) : 0;
//下面是各种微调
//mobile safari 判断，可与safari字段并存
(s = ua.match(/version\/([\d.]+).*mobile.*safari/)) ? updateProperty(browser, "mobileSafari", toFixedVersion(s[1])) : 0;

if (platform.iPad) {
    updateProperty(browser, 'mobileSafari', '0.0');
}

if (browser.ie) {
    if (!document.documentMode) {
        document.documentMode = Math.floor(browser.ie);
        //http://msdn.microsoft.com/zh-cn/library/cc817574.aspx
        //IE下可以通过设置 <meta http-equiv="X-UA-Compatible" content="IE=8"/>改变渲染模式
        //一切以实际渲染效果为准
    } else if (document.documentMode !== Math.floor(browser.ie)) {
        updateProperty(browser, "ie", toFixedVersion(document.documentMode));
    }
}

//============================================
//取得用户浏览器的渲染引擎名与版本,如果是0表示不是此浏览器
engine = {
    name: UNKNOWN,
    version: 0,
    trident: 0,
    gecko: 0,
    webkit: 0,
    presto: 0
};

(s = ua.match(/trident\/([\d.]+)/)) ? updateProperty(engine, "trident", toFixedVersion(s[1])) :
        (s = ua.match(/gecko\/([\d.]+)/)) ? updateProperty(engine, "gecko", toFixedVersion(s[1])) :
        (s = ua.match(/applewebkit\/([\d.]+)/)) ? updateProperty(engine, "webkit", toFixedVersion(s[1])) :
        (s = ua.match(/presto\/([\d.]+)/)) ? updateProperty(engine, "presto", toFixedVersion(s[1])) : 0;

if (browser.ie) {
    if (browser.ie == 6) {
        updateProperty(engine, "trident", toFixedVersion("4"));
    } else if (browser.ie == 7 || browser.ie == 8) {
        updateProperty(engine, "trident", toFixedVersion("5"));
    }
}

ui.platform = platform;
ui.browser = browser;
ui.engine = engine;

})(jQuery, ui);

// Source: src/component/image-loader.js

(function($, ui) {
// image loader

function ImageLoader() {
    if(this instanceof ImageLoader) {
        this.initialize();
    } else {
        return new ImageLoader();
    }
}

/** 自适应居中显示 */
ImageLoader.fitCenter = function() {
    this.displayWidth = this.originalWidth;
    this.displayHeight = this.originalHeight;
    this.marginTop = 0;
    this.marginLeft = 0;
    // 显示区域是横着的
    if (this.width > this.height) {
        if(this.originalHeight > this.height) {
            this.displayHeight = this.height;
        }
        this.displayWidth = Math.floor(this.originalWidth * (this.displayHeight / this.originalHeight));
        if (this.displayWidth > this.width) {
            this.displayWidth = this.width;
            this.displayHeight = Math.floor(this.originalHeight * (this.displayWidth / this.originalWidth));
            this.marginTop = Math.floor((this.height - this.displayHeight) / 2);
        } else {
            // 图片比显示区域小，显示到中心
            this.marginLeft = Math.floor((this.width - this.displayWidth) / 2);
            this.marginTop = Math.floor((this.height - this.displayHeight) / 2);
        }
    } else {
        // 显示区域是竖着的
        if(this.displayWidth > this.width) {
            this.displayWidth = this.width;
        }
        this.displayHeight = Math.floor(this.originalHeight * (this.displayWidth / this.originalWidth));
        if (this.displayHeight > this.height) {
            this.displayHeight = this.height;
            this.displayWidth = Math.floor(this.originalWidth * (this.displayHeight / this.originalHeight));
            this.marginLeft = Math.floor((this.width - this.displayWidth) / 2);
        } else {
            // 图片比显示区域小，显示到中心
            this.marginLeft = Math.floor((this.width - this.displayWidth) / 2);
            this.marginTop = Math.floor((this.height - this.displayHeight) / 2);
        }
    }
};
/** 充满中心显示 */
ImageLoader.centerCrop = function() {
    this.displayWidth = this.originalWidth;
    this.displayHeight = this.originalHeight;
    this.marginTop = 0;
    this.marginLeft = 0;
    // 显示区域是横着的
    if (this.width > this.height) {
        this.displayHeight = this.height;
        this.displayWidth = Math.floor(this.originalWidth * (this.displayHeight / this.originalHeight));
        if(this.displayWidth > this.width) {
            this.marginLeft = -(Math.floor((this.displayWidth - this.width) / 2));
        } else if(this.displayWidth < this.width) {
            this.displayWidth = this.width;
            this.displayHeight = Math.floor(this.originalHeight * (this.displayWidth / this.originalWidth));
            this.marginTop = -(Math.floor((this.displayHeight - this.height) / 2));
        }
    } else {
        //显示区域是竖着的
        this.displayWidth = this.width;
        this.displayHeight = Math.floor(this.originalHeight * (this.displayWidth / this.originalWidth));
        if(this.displayHeight > this.height) {
            this.marginTop = -(Math.floor((this.displayHeight - this.height) / 2));
        } else if(this.displayHeight < this.height) {
            this.displayHeight = this.height;
            this.displayWidth = Math.floor(this.originalWidth * (this.displayHeight / this.originalHeight));
            this.marginLeft = -(Math.floor((this.displayWidth - this.width) / 2));
        }
    }
};
ImageLoader.prototype = {
    constructor: ImageLoader,
    initialize: function() {
        //图片路径
        this.src = null;
        //图片显示区域宽
        this.width = 0;
        //图片显示区域高
        this.height = 0;
        //图片显示宽
        this.displayWidth = 0;
        //图片显示高
        this.displayHeight = 0;
        //图片原始宽
        this.originalWidth = 0;
        //图片原始高
        this.originalHeight = 0;
    },
    load: function(src, width, height, fillMode) {
        if (!ui.core.isString(src) || src.length === 0) {
            throw new TypeError("图片src不正确");
        }
        this.src = src;
        this.width = width;
        this.height = height;
        var that = this;
        if(!ui.core.isFunction(fillMode)) {
            fillMode = ImageLoader.fitCenter;
        }
        var promise = new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function () {
                img.onload = null;
                that.originalWidth = img.width;
                that.originalHeight = img.height;
                fillMode.call(that);
                resolve(that);
            };
            img.onerror = function () {
                reject(img);
            };
            img.src = src;
        });
        return promise;
    }
};

ui.ImageLoader = ImageLoader;

/** 动态设置图片的src并自动调整图片的尺寸和位置 */
$.fn.setImage = function (src, width, height, fillMode) {
    var option,
        parent,
        imageLoader,
        image;
    if (this.nodeName() != "IMG") {
        return;
    }
    image = this;
    if(ui.core.isPlainObject(src)) {
        option = src;
        src = option.src;
        width = option.width;
        height = option.height;
        fillMode = option.fillMode;
    }
    parent = this.parent();
    if (arguments.length < 2) {
        if (parent.nodeName() == "BODY") {
            width = root.clientWidth;
            height = root.clientHeight;
        } else {
            width = parent.width();
            height = parent.height();
        }
    } else {
        if (!ui.core.isNumber(width) || !ui.core.isNumber(height)) {
            width = 320;
            height = 240;
        }
    }
    if(!ui.core.isFunction(fillMode)) {
        fillMode = ui.ImageLoader.fitCenter;
    }

    imageLoader = ui.ImageLoader();
    return imageLoader
        .load(src, width, height, fillMode)
        .then(
            function(loader) {
                var style = {
                    "vertical-align": "top"
                };
                style["width"] = loader.displayWidth + "px";
                style["height"] = loader.displayHeight + "px";
                style["margin-top"] = loader.marginTop + "px";
                style["margin-left"] = loader.marginLeft + "px";
                image.css(style);
                image.prop("src", src);

                return loader;
            }, 
            function(loader) {
                image.prop("src", ui.text.empty);
                return loader;
            });
};


})(jQuery, ui);

// Source: src/component/view-model.js

(function($, ui) {
// ViewModel 模型

var arrayObserverPrototype = [],
    overrideMethods = ["push", "pop", "shift", "unshift", "splice", "sort", "reverse"],
    hasProto = '__proto__' in {},
    updatePrototype,
    binderQueue,
    binderId = 0;

// 劫持修改数组的API方法
overrideMethods.forEach(function(methodName) {
    var originalMethod = arrayObserverPrototype[methodName];

    arrayObserverPrototype[methodName] = function() {
        var result,
            insertedItems,
            args = arrayObserverPrototype.slice.call(arguments, 0),
            notice;

        result = originalMethod.apply(this, args);

        switch(methodName) {
            case "push":
            case "unshift":
                insertedItems = args;
                break;
            case "splice":
                insertedItems = args.slice(2);
                break;
        }

        notice = this.__notice__;
        if(insertedItems) {
            notice.arrayNotify(insertedItems);
        }
        notice.dependency.notify();
        return result;
    };
});

if(hasProto) {
    updatePrototype = function(target, prototype, keys) {
        target.__proto__ = prototype;
    };
} else {
    updatePrototype = function(target, prototype, keys) {
        var i, len, key;
        for(i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            target[key] = prototype[key];
        }
    };
}

// 数据绑定执行队列
binderQueue = {
    queue: [],
    queueElementMap: {},
    // 是否正在执行队列中
    isRunning: false,
    // 是否已经注册了nextTick Task
    isWaiting: false,
    // 当前执行的队列索引
    runIndex: 0,

    enqueue: function(binder) {
        var id = binder.id,
            index;
        if(this.queueElementMap[id]) {
            return;
        }

        this.queueElementMap[id] = true;
        if(this.isRunning) {
            // 从后往前插入队列
            index = this.queue.length - 1;
            while(index > this.runIndex && this.queue[index].id > binder.id) {
                index--;
            }
            this.queue.splice(index + 1, 0, binder);
        } else {
            this.queue.push(binder);
        }

        if(!this.isWaiting) {
            this.isWaiting = true;
            ui.setTask((function () {
                this.run();
            }).bind(this));
        }
    },
    run: function() {
        var i,
            binder;
        this.isRunning = true;

        // 排序，让视图更新按照声明的顺序执行
        this.queue.sort(function(a, b) {
            return a.id - b.id;
        });

        // 这里的queue.length可能发生变化，不能缓存
        for(i = 0; i < this.queue.length; i++) {
            this.runIndex = i;
            binder = this.queue[i];
            this.queueElementMap[binder.id] = null;
            binder.execute();
        }

        // 重置队列
        this.reset();
    },
    reset: function() {
        this.runIndex = 0;
        this.queue.length = 0;
        this.queueElementMap = {};
        this.isRunning = this.isWaiting = false;
    }
};

function noop() {}

function defineNotifyProperty(obj, propertyName, val, shallow, path) {
    var descriptor,
        getter,
        setter,
        notice,
        childNotice;

    descriptor = Object.getOwnPropertyDescriptor(obj, propertyName);
    if (descriptor && descriptor.configurable === false) {
        return;
    }

    getter = descriptor.get;
    setter = descriptor.set;

    // 如果深度引用，则将子属性也转换为通知对象
    if(!shallow  && (ui.core.isObject(val) || Array.isArray(val))) {
        childNotice = new NotifyObject(val);
    }

    notice = obj.__notice__;
    Object.defineProperty(obj, propertyName, {
        enumerable: true,
        configurable: true,
        get: function () {
            return getter ? getter.call(obj) : val;
        },
        set: function(newVal) {
            var oldVal = getter ? getter.call(obj) : val,
                newChildNotice;
            if(oldVal === newVal || (newVal !== newVal && val !== val)) {
                return;
            }

            if(setter) {
                setter.call(obj, newVal);
            } else {
                val = newVal;
            }

            if(!shallow  && (ui.core.isObject(newVal) || Array.isArray(newVal))) {
                newChildNotice = new NotifyObject(newVal);
                newChildNotice.dependency.depMap = childNotice.dependency.depMap;
                // 更新通知对象
                childNotice = newChildNotice;
            }
            notice.dependency.notify(propertyName);
        }
    });
}

function createNotifyObject(obj) {
    var isObject,
        isArray,
        notice;

    isObject = ui.core.isObject(obj);
    isArray = Array.isArray(obj);

    if(!isObject && !isArray) {
        return obj;
    }
    if(isObject && ui.core.isEmptyObject(obj)) {
        return obj;
    }

    if(obj.hasOwnProperty("__notice__") && obj.__notice__ instanceof NotifyObject) {
        notice = obj.__notice__;
        // TODO notice.count++;
    } else if((isArray || isObject) && Object.isExtensible(obj)) {
        notice = new NotifyObject(obj);
    }
    // 添加一个手动刷新方法
    obj.refresh = refresh;

    return obj;
}

function refresh() {
    notifyAll(this);
}

function notifyAll(viewModel) {
    var keys = Object.keys(viewModel),
        i, len,
        propertyName,
        value,
        notice,
        notifyProperties = [];

    for(i = 0, len = keys.length; i < len; i++) {
        propertyName = keys[i];
        value = viewModel[propertyName];
        if((ui.core.isObject(value) || Array.isArray(value)) && 
                value.__notice__ instanceof NotifyObject) {
            notifyAll(value);
        } else {
            notifyProperties.push(propertyName);
        }
    }

    notice = viewModel.__notice__;
    notice.dependency.notify.apply(notice.dependency, notifyProperties);
}

function NotifyObject(value) {
    this.value = value;
    this.dependency = new Dependency();
    Object.defineProperty(value, "__notice__", {
        value: this,
        enumerable: false,
        writable: true,
        configurable: true
    });
    if(Array.isArray(value)) {
        updatePrototype(value, arrayObserverPrototype, overrideMethods);
        this.arrayNotify(value);
    } else {
        this.objectNotify(value);
    }
}
NotifyObject.prototype = {
    constructor: NotifyObject,
    arrayNotify: function(array) {
        var i, len;
        for(i = 0, len = array.length; i < len; i++) {
            createNotifyObject(array[i]);
        }
    },
    objectNotify: function(obj) {
        var keys = Object.keys(obj),
            i, len;

        for(i = 0, len = keys.length; i < len; i++) {
            defineNotifyProperty(obj, keys[i], obj[keys[i]]);
        }
    }
};

// 依赖属性
function Dependency() {
    this.depMap = {};
}
Dependency.prototype = {
    constructor: Dependency,
    // 添加依赖处理
    add: function(binder) {
        var propertyName;
        if(binder instanceof Binder) {
            propertyName = binder.propertyName;
            if(!this.depMap.hasOwnProperty(binder.propertyName)) {
                this.depMap[propertyName] = [];
            }
            this.depMap[propertyName].push(binder);
        }
    },
    // 移除依赖处理
    remove: function(binder) {
        var propertyName,
            binderList,
            i, len;
        if(binder instanceof Binder) {
            propertyName = binder.propertyName;
            binderList = this.depMap[propertyName];

            if(Array.isArray(binderList)) {
                for(i = binderList.length - 1; i >= 0; i--) {
                    if(binderList[i] === binder) {
                        binderList.splice(i, 1);
                        break;
                    }
                }
            }
        }
    },
    depend: function() {
    },
    // 变化通知
    notify: function() {
        var keys,
            propertyName,
            delegate,
            errors,
            i, len;
        
        if(arguments.length === 0) {
            keys = Object.keys(this.depMap);
        } else {
            keys = [];
            for(i = 0, len = arguments.length; i < len; i++) {
                propertyName = arguments[i];
                if(ui.core.isString(propertyName) && 
                    propertyName.length > 0 && 
                    this.depMap.hasOwnProperty(propertyName)) {
                        
                    keys.push(propertyName);
                }
            }
        }

        errors = [];
        for(i = 0, len = keys.length; i < len; i++) {
            delegate = this.depMap[keys[i]];
            delegate.forEach(function(binder) {
                try {
                    binder.update();
                } catch(e) {
                    errors.push(e);
                }
            });
        }
        if(errors.length > 0) {
            throw errors.toString();
        }
    }
};

function Binder(option) {
    var propertyName = null; 

    this.id = ++binderId;
    this.viewModel = null;
    this.isActive = true;

    if(option) {
        this.sync = !!option.sync;
        this.lazy = !!option.lazy;
    } else {
        this.sync = this.lazy = false;
    }
    this.value = this.lazy ? null : this.get();

    Object.defineProperty(this, "propertyName", {
        configurable: false,
        enumerable: true,
        get: function() {
            if(!propertyName) {
                return "_";
            }
            return propertyName;
        },
        set: function(val) {
            propertyName = val;
        }
    });
}
Binder.prototype = {
    constructor: Binder,
    update: function() {
        if(!this.isActive) {
            return;
        }

        if(this.sync) {
            this.execute();
        } else {
            binderQueue.enqueue(this);
        }
    },
    execute: function() {
        var oldValue,
            value;

        oldValue = this.value;
        value = this.get();

        if(value !== oldValue) {
            this.value = value;
            try {
                this.action(value, oldValue);
            } catch(e) {
                ui.handleError(e);
            }
        }
    },
    get: function() {
        var value = null;

        if(this.viewModel && this.viewModel.hasOwnProperty(this.propertyName)) {
            value = this.viewModel[this.propertyName];
        }

        return value;
    }
};

function createBinder(viewModel, propertyName, bindData, handler, option) {
    var binder;
    if(!viewModel || !viewModel.__notice__) {
        throw new TypeError("the arguments 'viewModel' is invalid.");
    }
    if(!viewModel.hasOwnProperty(propertyName)) {
        throw new TypeError("the property '" + propertyName + "' not belong to the viewModel.");
    }
    if(ui.core.isFunction(bindData)) {
        handler = bindData;
        bindData = null;
    }
    if(!ui.core.isFunction(handler)) {
        return null;
    }

    binder = new Binder(option);
    binder.propertyName = propertyName;
    binder.viewModel = viewModel;
    binder.action = function(value, oldValue) {
        handler.call(viewModel, value, oldValue, bindData);
    };

    return binder;
}

ui.ViewModel = createNotifyObject;
ui.ViewModel.bindOnce = function(viewModel, propertyName, bindData, fn) {
    var binder = createBinder(viewModel, propertyName, bindData, fn);
};
ui.ViewModel.bindOneWay = function(viewModel, propertyName, bindData, fn, isSync) {
    var binder,
        option,
        notice,
        value;

    option = {
        sync: !!isSync
    };
    binder = createBinder(viewModel, propertyName, bindData, fn, option);
    if(binder) {
        notice = viewModel.__notice__;
        notice.dependency.add(binder);
        value = viewModel[propertyName];
        if(Array.isArray(value)) {
            notice = value.__notice__;
            if(notice) {
                notice.dependency.add(binder);
            }
        }
    }
};
ui.ViewModel.bindTwoWay = function(option) {
    // TODO: 双向绑定实际上只有在做表单的时候才有优势
};


})(jQuery, ui);

// Source: src/component/define.js

(function($, ui) {

// JS类型化

var global = ui.core.global();
function noop() {}
function getNamespace(namespace) {
    var spaces,
        spaceRoot,
        spaceName,
        i, len;

    spaces = namespace.split(".");
    spaceRoot = global;
    for(i = 0, len = spaces.length; i < len; i++) {
        spaceName = spaces[i];
        if(!spaceRoot[spaceName]) {
            spaceRoot[spaceName] = {};
        }
        spaceRoot = spaceRoot[spaceName];
    }
    return spaceRoot;
}
function getConstructor(name, constructor) {
    var namespace,
        constructorInfo = {
            name: null,
            namespace: null,
            fullName: name,
            constructor: constructor
        },
        existingConstructor,
        index;

    index = name.lastIndexOf(".");
    if(index < 0) {
        constructorInfo.namespace = name;
        constructorInfo.name = name;
        existingConstructor = global[constructorInfo.name];
        constructorInfo.constructor = global[constructorInfo.name] = constructor;
    } else {
        constructorInfo.namespace = name.substring(0, index);
        constructorInfo.name = name.substring(index + 1);
        namespace = getNamespace(constructorInfo.namespace);
        existingConstructor = namespace[constructorInfo.name];
        constructorInfo.constructor = namespace[constructorInfo.name] = constructor;
    }

    if(existingConstructor) {
        constructor.getOriginal = function() {
            return existingConstructor;
        };
    }

    return constructorInfo;
}
function define(name, base, prototype, constructor) {
    var constructorInfo,
        // 代理原型
        proxiedPrototype = {},
        basePrototype;

    if(!ui.core.isFunction(constructor)) {
        constructor = function() {};
    }
    constructorInfo = getConstructor(name, constructor);

    // 基类的处理
    if(base) {
        basePrototype = ui.core.isFunction(base) ? base.prototype : base;
        basePrototype = ui.extend({}, basePrototype);
    } else {
        basePrototype = {
            name: "",
            namespace: ""
        };
    }

    // 方法重写
    Object.keys(prototype).forEach(function (prop) {
        var value = prototype[prop];
        if (!ui.core.isFunction(value)) {
            return;
        }
        var func = basePrototype[prop];
        if (!ui.core.isFunction(func)) {
            return;
        }
        delete prototype[prop];
        proxiedPrototype[prop] = (function () {
            var _super = function () {
                return basePrototype[prop].apply(this, arguments);
            },
            _superApply = function (args) {
                return basePrototype[prop].apply(this, args);
            };
            return function () {
                var __super = this._super,
                    __superApply = this._superApply,
                    returnValue;

                this._super = _super;
                this._superApply = _superApply;

                returnValue = value.apply(this, arguments);

                this._super = __super;
                this._superApply = __superApply;

                return returnValue;
            };
        })();
    });

    // 原型合并
    constructorInfo.constructor.prototype = ui.extend(
        {},
        // 基类
        basePrototype,
        // 原型
        prototype,
        // 方法重写代理原型 
        proxiedPrototype, 
        // 附加信息
        constructorInfo
    );
    return constructorInfo.constructor;
}

ui.define = function(name, base, prototype) {
    var index,
        constructor,
        basePrototype,
        events;

    if(!ui.core.isString(name) || name.length === 0) {
        return null;
    }

    if(!prototype) {
        prototype = base;
        base = null;
    }

    // 基类的处理
    if(!base) {
        base = {};
    }
    if(!ui.core.isFunction(base._initialize)) {
        base._initialize = noop;
    }

    constructor = define(name, base, prototype, function(option, element) {
        if (this instanceof constructor) {
            this._initialize(option, element);
        } else {
            return new constructor(option, element);
        }
    });

    return constructor;
};


})(jQuery, ui);

// Source: src/component/draggable.js

(function($, ui) {

var doc = $(document),
    body = $(document.body),
    defaultOption = {
        // 上下文
        context: null,
        // 拖动的目标
        target: null,
        // 把手，拖拽事件附加的元素
        handle: null,
        // 范围元素，默认是$(body)
        parent: body,
        // 是否需要做Iframe屏蔽
        hasIframe: false,
        // 开始拖拽处理函数
        onBeginDrag: null,
        // 移动处理函数 
        onMoving: null,
        // 结束拖拽处理函数
        onEndDrag: null
    };

// 鼠标按下处理事件
function mouseDown(e) {
    var eventArg,
        result;
    if (e.which !== 1) return;

    eventArg = {
        target: e.target,
        option: this.option
    };
    eventArg.currentX = this.currentX = e.pageX;
    eventArg.currentY = this.currentY = e.pageY;

    if(ui.core.isFunction(this.option.onBeginDrag)) {
        result = this.option.onBeginDrag.call(this, eventArg);
        if(result === false) {
            return;
        }
    }
    doc.on("mousemove", this.onMouseMoveHandler)
        .on("mouseup", this.onMouseUpHandler)
        .on("mouseleave", this.onMouseUpHandler);
    document.onselectstart = function() { return false; };
    /*
        .cancel-user-select {
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            user-select: none;    
        }    
    */
    this.option.target.addClass("cancel-user-select");
    this._isDragStart = true;

    if(this.shield) {
        body.append(this.shield);
    }
}
// 鼠标移动事件
function mouseMove(e) {
    var eventArg = {
        target: e.target,
        option: this.option
    };
    if(!this._isDragStart) return;
    
    eventArg.x = e.clientX - this.currentX;
    eventArg.y = e.clientY - this.currentY;
    eventArg.currentX = this.currentX = e.clientX;
    eventArg.currentY = this.currentY = e.clientY;

    if(ui.core.isFunction(this.option.onMoving)) {
        this.option.onMoving.call(this, eventArg);
    }
}
// 鼠标抬起
function mouseUp(e) {
    var eventArg = {
        target: e.target,
        option: this.option
    };
    if (e.which !== 1) return;
    if(!this._isDragStart) return;

    this._isDragStart = false;
    this.currentX = this.currentY = null;

    doc.off("mousemove", this.onMouseMoveHandler)
        .off("mouseup", this.onMouseUpHandler)
        .off("mouseleave", this.onMouseUpHandler);
    document.onselectstart = null;
    this.option.target.removeClass("cancel-user-select");

    if(ui.core.isFunction(this.option.onEndDrag)) {
        this.option.onEndDrag.call(this, eventArg);
    }

    if(this.shield) {
        this.shield.remove();
    }
}

function MouseDragger(option) {
    if(this instanceof MouseDragger) {
        this.initialize(option);
    } else {
        return new MouseDragger(option);
    }
}
MouseDragger.prototype = {
    constructor: MouseDragger,
    initialize: function(option) {
        this.doc = null;
        this.shield = null;
        this.isTurnOn = false;

        this.option = $.extend({}, defaultOption, option);
        this.doc = this.option.doc;
        if(this.option.hasIframe === true) {
            this.shield = $("<div class='drag-shield'>");
            this.shield.css({
                "position": "fixed",
                "top": "0px",
                "left": "0px",
                "width": "100%",
                "height": "100%",
                "z-index": "999999",
                "background-color": "#fff",
                "filter": "Alpha(opacity=1)",
                "opacity": ".01"    
            });
        }

        this.onMouseDownHandler = $.proxy(mouseDown, this);
        this.onMouseMoveHandler = $.proxy(mouseMove, this);
        this.onMouseUpHandler = $.proxy(mouseUp, this);
    },
    on: function() {
        var target = this.option.target,
            handle = this.option.handle,
            parent = this.option.parent,
            position;
        
        if(this.isTurnOn) {
            return;
        }

        this.isTurnOn = true;
        if(!parent.isNodeName("body")) {
            position = parent.css("position");
            this.originParentPosition = position;
            if (position !== "absolute" && position !== "relative" && position !== "fixed") {
                parent.css("position", "relative");
            }
        }
        this.originTargetPosition = target.css("position");
        if (this.originTargetPosition !== "absolute") {
            target.css("position", "absolute");
        }

        handle.on("mousedown", this.onMouseDownHandler);
        if(this.option.target)
            this.option.target.data("mouse-dragger", this);
    },
    off: function() {
        var handle = this.option.handle;
        if(!this.isTurnOn) {
            return;
        }

        this.isTurnOn = false;
        handle
            .off("mousedown", this.onMouseDownHandler)
            .css("position", this.originTargetPosition);
        if(this._isDragStart) {
            this.onMouseUpHandler({
                target: document,
                which: 1
            });
        }
        this.option.parent.css("position", this.originParentPosition);
    }
};

ui.MouseDragger = MouseDragger;

/** 拖动效果 */
$.fn.draggable = function(option) {
    var dragger;
    if (!option || !option.target || !option.parent) {
        return;
    }
    if (!ui.core.isDomObject(this[0]) || this.nodeName() === "BODY") {
        return;
    }

    option.handle = this;
    option.getParentCssNum = function(prop) {
        return parseFloat(option.parent.css(prop)) || 0;
    };
    option.onBeginDrag = function(arg) {
        var option = this.option,
            p = option.parent.offset();
        if(!p) p = { top: 0, left: 0 };

        option.topLimit = p.top + option.getParentCssNum("border-top") + option.getParentCssNum("padding-top");
        option.leftLimit = p.left + option.getParentCssNum("border-left") + option.getParentCssNum("padding-left");
        option.rightLimit = p.left + (option.parent.outerWidth() || option.parent.width());
        option.bottomLimit = p.top + (option.parent.outerHeight() || option.parent.height());
        
        option.targetWidth = option.target.outerWidth();
        option.targetHeight = option.target.outerHeight();

        option.parentTop = p.top;
        option.parentLeft = p.left;
    };
    option.onMoving = function(arg) {
        var option = this.option,
            p = option.target.position();

        p.top = p.top + option.parentTop;
        p.left = p.left + option.parentLeft;

        p.top += arg.y;
        p.left += arg.x;

        if (p.top < option.topLimit) {
            p.top = option.topLimit;
        } else if (p.top + option.targetHeight > option.bottomLimit) {
            p.top = option.bottomLimit - option.targetHeight;
        }
        if (p.left < option.leftLimit) {
            p.left = option.leftLimit;
        } else if (p.left + option.targetWidth > option.rightLimit) {
            p.left = option.rightLimit - option.targetWidth;
        }

        p.top = p.top - option.parentTop;
        p.left = p.left - option.parentLeft;

        option.target.css({
            "top": p.top + "px",
            "left": p.left + "px"
        });
    };

    dragger = ui.MouseDragger(option);
    dragger.on();

    return this;
};
$.fn.undraggable = function() {
    var dragger;
    if(this.length === 0)
        return;
    dragger = this.data("mouse-dragger");
    if(dragger && dragger instanceof MouseDragger) {
        dragger.off();
    }
};


})(jQuery, ui);

// Source: src/component/theme.js

(function($, ui) {

function setHighlight(highlight) {
    var sheet,
        styleUrl;
    sheet = $("#" + ui.theme.highlightSheetId);
    if(sheet.length > 0) {
        styleUrl = sheet.prop("href");
        styleUrl = ui.url.setParams({
            highlight: highlight.Id
        });
        sheet.prop("href", styleUrl);
    }
    ui.theme.currentHighlight = highlight;
    ui.page.fire("hlchanged", ui.theme.currentHighlight);
}

//主题
ui.theme = {
    /** 当前的主题 */
    currentTheme: "Light",
    /** 用户当前设置的主题 */
    currentHighlight: null,
    /** 默认主题色 */
    defaultHighlight: "Default",
    /** 主题文件StyleID */
    highlightSheetId: "highlight",
    /** 获取高亮色 */
    getHighlight: function (highlight) {
        var highlightInfo,
            info,
            i, len;
        if (!highlight) {
            highlight = this.defaultHighlight;
        }
        if (Array.isArray(this.highlights)) {
            for (i = 0, len = this.highlights.length; i < len; i++) {
                info = this.highlights[i];
                if (info.Id === highlight) {
                    highlightInfo = info;
                    break;
                }
            }
        }
        return highlightInfo;
    },
    /** 修改高亮色 */
    changeHighlight: function(url, color) {
        ui.ajax.postJson(url, 
            { themeId: color.Id },
            function(success) {
                if(success.Result) {
                    setHighlight(color);
                }
            },
            function(error) {
                ui.msgshow("修改主题失败，" + error.message, true);
            }
        );
    },
    /** 设置高亮色 */
    setHighlight: function(color) {
        if(color) {
            setHighlight(color);
        }
    },
    /** 初始化高亮色 */
    initHighlight: function() {
        var sheet,
            styleUrl,
            highlight;
        sheet = document.getElementById(this.highlightSheetId);
        if(sheet) {
            styleUrl = sheet.href;
            highlight = ui.url.getParams(styleUrl).highlight;
        }
        this.currentHighlight = this.getHighlight(highlight) || null;
        if(this.currentHighlight) {
            ui.page.fire("hlchanged", this.currentHighlight);
        }
    }
};


})(jQuery, ui);

// Source: src/component/page.js

(function($, ui) {
// 事件优先级
ui.eventPriority = {
    masterReady: 3,
    pageReady: 2,

    bodyResize: 3,
    ctrlResize: 2,
    elementResize: 2
};
var page = ui.page = {
    // resize事件延迟时间
    _resizeDelay: 200,
    _resizeTimeoutHandler: null,
    events: [
        "themechanged",
        "hlchanged", 
        "ready", 
        "htmlclick", 
        "docmouseup", 
        "resize", 
        "hashchange",
        "keydown"
    ]
};
page.event = new ui.CustomEvent(page);
page.event.initEvents();

$(document)
    //注册全局ready事件
    .ready(function (e) {
        page.fire("ready");
    })
    //注册全局click事件
    .click(function (e) {
        page.fire("htmlclick", e.target);
    })

$(window)
    //注册全局resize事件
    .on("resize", function (e) {
        if(page._resizeTimeoutHandler) {
            clearTimeout(page._resizeTimeoutHandler);
        }
        page._resizeTimeoutHandler = setTimeout(function() {
            page._resizeTimeoutHandler = null;
            page.fire("resize", 
                document.documentElement.clientWidth, 
                document.documentElement.clientHeight);
        }, page._resizeDelay);
    })
    //注册全局hashchange事件
    .on("hashchange", function(e) {
        var hash = "";
        if(window.location.hash) {
            hash = window.location.hash;
        }
        page.fire("hashchange", hash);
    });


})(jQuery, ui);

// Source: src/control/base/control-define.js

(function($, ui) {

// 创建命名空间
ui.ctrls = {};
function noop() {}
// 创建控件基础类
ui.define("ui.ctrls.ControlBase", {
    version: ui.version,
    i18n: function() {
        return ui.i18n("control", this.toString());
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
        basePrototype;

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
    dropdownPanelBorderWidth = 1,
    cancelHtmlClickFlag = "cancel-dropdown-html-click";

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
ui.page.htmlclick(function (e, element) {
    var elem = $(element);
    if(elem.isNodeName("body") || elem.hasClass(cancelHtmlClickFlag)) {
        return;
    }
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
            location.top = -panelHeight - 1 // 上移1px留白;
            location.topOffset = height;
        }
    } else {
        // 下移1px留白
        location.top += 1;
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
        var that;
        if(!this.element) {
            return;
        }

        if(!elementEvents) {
            elementEvents = {
                focus: onFocus.bind(this)
            };
        }
        if(!ui.core.isFunction(elementEvents.click)) {
            elementEvents.click = onClick;
        }

        that = this;
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
        var wrapElem = $("<div class='dropdown-wrap cancel-dropdown-html-click' />").css(currentCss);
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
                    // 上移1px留白
                    location.top -= 1;
                    location.topOffset = height;
                } else {
                    // 下移1px留白
                    location.top += 1;
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

        panel
            .css("display", "block")
            .addClass(cancelHtmlClickFlag);
        this.fadeAnimator.onEnd = callback;

        this.fadeAnimator
                .start()
                .then(function() {
                    panel.removeClass(cancelHtmlClickFlag);
                });
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
        var option;
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
                    this.animator.add(arguments[i]);
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
                    this.animator.add(arguments[i]);
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
        //checkbox.click(this.onCheckboxAllClickHandler);
        this.columnResetter.add(function () {
            checkbox.removeClass("fa-check-square").addClass("fa-square");
        });
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
                    this.clear();
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
    emptyColumn: {
        text: columnFormatter.empty,
        formatter: cellFormatter.empty
    },
    multipleEmptyColumn: function(rowSpan) {
        var emptyColumn = {
            text: columnFormatter.empty,
            formatter: cellFormatter.empty
        };
        if(ui.core.isNumber(rowSpan) && rowSpan > 1) {
            emptyColumn.rowspan = rowSpan;
        }
        return emptyColumn;
    },
    isEmpty: function(column) {
        return column === this.emptyColumn || 
            (column && column.text === columnFormatter.empty && column.formatter === cellFormatter.empty);
    },
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
    hideStyles,
    ctrlHandlers;

showStyles = {
    up: function () {
        var parentSize,
            option,
            that;

        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = parentSize.height;
        option.end = (parentSize.height - this.offsetHeight) / 2;
        option.onChange = function (top) {
            that.box.css("top", top + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": option.begin + "px",
            "left": (parentSize.width - this.offsetWidth) / 2 + "px",
            "display": "block"
        });
    },
    down: function () {
        var parentSize,
            option,
            that;

        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = -this.offsetHeight;
        option.end = (parentSize.height - this.offsetHeight) / 2;
        option.onChange = function (top) {
            that.box.css("top", top + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": option.begin + "px",
            "left": (parentSize.width - this.offsetWidth) / 2 + "px",
            "display": "block"
        });
    },
    left: function () {
        var parentSize,
            option,
            that;

        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = -this.offsetWidth;
        option.end = (parentSize.width - this.offsetWidth) / 2;
        option.onChange = function (left) {
            that.box.css("left", left + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": (parentSize.height - this.offsetHeight) / 2 + "px",
            "left": option.begin + "px",
            "display": "block"
        });
    },
    right: function () {
        var parentSize,
            option,
            that;

        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = parentSize.width;
        option.end = (parentSize.width - this.offsetWidth) / 2;
        option.onChange = function (left) {
            that.box.css("left", left + "px");
        };
        this.openMask();
        this.animator.onEnd = function () {
            that.onShown();
        };

        this.box.css({
            "top": (parentSize.height - this.offsetHeight) / 2 + "px",
            "left": option.begin + "px",
            "display": "block"
        });
    },
    fadein: function () {
        var parentSize,
            option,
            that;

        parentSize = this.getParentSize();
        that = this;

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
            "top": (parentSize.height - this.offsetHeight) / 2 + "px",
            "left": (parentSize.width - this.offsetWidth) / 2 + "px",
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
        var parentSize,
            option,
            that;
        
        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = parseFloat(this.box.css("top"), 10);
        option.end = parentSize.height;
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
        var parentSize,
            option,
            that;
        
        parentSize = this.getParentSize();
        that = this;

        option = this.animator[0];
        option.begin = parseFloat(this.box.css("left"), 10);
        option.end = parentSize.width;
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

ctrlHandlers = {
    "closable": function (option) {
        var closeBtn,
            that = this;

        closeBtn = $("<a href='javascript:void(0)'>×</a>");
        closeBtn.attr("class", option.className || "closable-button font-highlight-hover");

        closeBtn.click(function() {
            that.hide();
        });

        return closeBtn;
    },
    "maximizable": function(option) {
        var maximizableButton,
            that = this;

        maximizableButton = $("<a href='javascript:void(0)'><i class='fa fa-window-maximize'></i></a>");
        maximizableButton.attr("class", option.className || "maximizable-button font-highlight-hover");

        maximizableButton.click(function() {
            that._maximize(!that.isMaximizeState, maximizableButton);
        });

        return maximizableButton;
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
            // TODO 父级容器，默认是Body
            parent: null,
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
            // 窗体要显示的控制按钮，"closable" or "maximizable"，默认显示关闭按钮；[{type: "closable", className: "closable-button font-highlight-hover", css: null}]
            boxCtrls: ["closable"]
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
        this.isMaximizeState = false;
        
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
        this.box = $("<div class='ui-dialog-box border-highlight' />");
        this.titlePanel = $("<section class='ui-dialog-box-title' />");
        this.contentPanel = $("<section class='ui-dialog-box-content' />");
        this.operatePanel = null;

        this.box
            .append(this.titlePanel)
            .append(this.contentPanel);

        this._initTitle();
        this._iniBoxCtrlsButton();
        this._initContent();
        this._initOperateButtons();

        this.animator.add({
            target: this.box,
            ease: ui.AnimationStyle.easeFromTo
        });

        this.parent = ui.getJQueryElement(this.option.parent);
        if(this.parent) {
            this.getParentSize = function() {
                return {
                    width: this.parent.width(),
                    height: this.parent.height()  
                };
            };
        } else {
            this.parent = $(document.body);
            this.getParentSize = function() {
                return {
                    width: document.documentElement.clientWidth,
                    height: document.documentElement.clientHeight
                };
            };
        }

        if(this.maskable()) {
            this.mask = $("<div class='ui-dialog-box-mask' />");
            this.parent.append(this.mask);
            this.animator.add({
                target: this.mask,
                ease: ui.AnimationStyle.easeFrom
            });
        }
        this.parent.append(this.box);

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
    _iniBoxCtrlsButton: function() {
        var ctrlButtons,
            that = this;

        ctrlButtons = this.option.boxCtrls;
        if(!Array.isArray(ctrlButtons) || ctrlButtons.length === 0) {
            return;
        }
        
        this.boxCtrls = $("<div class='ui-dialog-box-ctrls' />");
        ctrlButtons.forEach(function(option) {
            var handler,
                btn,
                option;
            if(ui.core.isString(option)) {
                option = {
                    type: option
                };
            } else if(ui.core.isFunction(option)) {
                btn = option.call(that);
                if(btn) {
                    that.boxCtrls.append(btn);
                }
                return;  
            }

            handler = ctrlHandlers[option.type];
            if(!handler) {
                return;
            }
            btn = handler.call(that, option);
            if(ui.core.isPlainObject(option.css)) {
                btn.css(option.css);
            }
            that.boxCtrls.append(btn);
        });

        this.box.append(this.boxCtrls);
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
            parent: this.parent,
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
    _maximize: function(state, maximizableButton) {
        var parentSize = this.getParentSize(),
            option;

        if(state === this.isMaximize) {
            return;
        }
        if(!this.maximizeAnimator) {
            this.maximizeAnimator = ui.animator({
                target: this.box,
                onChange: function(val) {
                    this.target.css("top", val + "px");
                }
            }).add({
                target: this.box,
                onChange: function(val) {
                    this.target.css("left", val + "px");
                }
            }).add({
                target: this.box,
                onChange: function(val) {
                    this.target.css("width", val + "px");
                }
            }).add({
                target: this.box,
                onChange: function(val) {
                    this.target.css("height", val + "px");
                }
            });
            this.maximizeAnimator.onBegin = (function() {
                this.contentPanel.css("display", "none");
                if(this.operatePanel) {
                    this.operatePanel.css("display", "none");
                }
            }).bind(this);
            this.maximizeAnimator.onEnd = (function() {
                this.contentPanel.css("display", "block");
                if(this.operatePanel) {
                    this.operatePanel.css("display", "block");
                }
                this._setSize(
                    this.maximizeAnimator[2].end, 
                    this.maximizeAnimator[3].end);
            }).bind(this);
            this.maximizeAnimator.duration = 500;
        }

        if(this.maximizeAnimator.isStarted) {
            return;
        }

        if(state) {
            this.isMaximizeState = true;
            maximizableButton.html("<i class='fa fa-window-restore'></i>");
            
            if(this.resizeHandle) {
                this.resizeHandle.css("display", "none");
            }

            option = this.maximizeAnimator[0];
            option.begin = parseFloat(this.box.css("top")) || 0;
            option.end = 0;

            option = this.maximizeAnimator[1];
            option.begin = parseFloat(this.box.css("left")) || 0;
            option.end = 0;

            option = this.maximizeAnimator[2];
            option.begin = this.offsetWidth;
            option.end = parentSize.width;

            option = this.maximizeAnimator[3];
            option.begin = this.offsetHeight;
            option.end = parentSize.height;

            this.maximizeAnimator.start();
        } else {
            this.isMaximizeState = false;
            maximizableButton.html("<i class='fa fa-window-maximize'></i>");

            if(this.resizeHandle) {
                this.resizeHandle.css("display", "block");
            }

            this.maximizeAnimator.back();
        }
    },
    _calculateSize: function(parentWidth, parentHeight) {
        var newWidth,
            newHeight,
            parentSize;
        
        parentSize = this.getParentSize();
        if(!ui.core.isNumber(parentWidth)) {
            parentWidth = parentSize.width;
        }
        if(!ui.core.isNumber(parentHeight)) {
            parentHeight = parentSize.height;
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
        var borderTop = Math.floor(parseFloat(this.box.css("border-top-width"))) || 0,
            borderBottom = Math.floor(parseFloat(this.box.css("border-bottom-width"))) || 0,
            borderLeft = Math.floor(parseFloat(this.box.css("border-left-width"))) || 0,
            borderRight = Math.floor(parseFloat(this.box.css("border-right-width"))) || 0;

        if (ui.core.isNumber(newWidth) && newWidth > 0) {
            this.offsetWidth = newWidth;
            this.width = this.offsetWidth - borderLeft - borderRight;
            this.box.css("width", this.width + "px");
            this.contentWidth = this.width;
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
            this.parent.css("overflow", this._oldBodyOverflow);
            this.mask.css("display", "none");
        }
        this.fire("hidden");
    },
    /** 显示遮罩层，显示动画用 */
    openMask: function() {
        var option,
            parentSize = this.getParentSize();
        if (this.maskable()) {
            this._oldBodyOverflow = this.parent.css("overflow");
            this.parent.css("overflow", "hide");
            this.mask.css({
                "display": "block",
                "opacity": 0,
                "height": parentSize.height + "px"
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
        var parentSize = this.getParentSize();
        if(!ui.core.isNumber(parentWidth)) {
            parentWidth = parentSize.width;
        }
        if(!ui.core.isNumber(parentHeight)) {
            parentHeight = parentSize.height;
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
    borderWidth = 1,
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
            ul, li, 
            attachmentCount,
            i, len;

        // 计算需要附加的空元素个数
        attachmentCount = this._getAttachmentCount();
        // 在头尾添加辅助元素
        list = listItem.list;
        headArr = [];
        footArr = [];
        for(i = 0; i < attachmentCount; i++) {
            headArr.push(null);
            footArr.push(null);
        }
        list = headArr.concat(list, footArr);

        ul = $("<ul class='ui-chooser-list-ul' />");
        for(i = 0, len = list.length; i < len; i++) {
            li = this._createItem(list[i]);
            // 默认选中第一个
            if(i - attachmentCount === 0) {
                listItem._current = li;
                li.addClass(selectedClass).addClass("font-highlight");
            }
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
var selectedClass = "date-selected",
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
        this._language = this.i18n();

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
        }).add({
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
    cancelSelection: function(values, isFire) {
        var elem,
            i, len, j,
            itemData, 
            isCanceled;

        if(ui.core.isBoolean(values)) {
            isFire = values;
            values = null;
        }

        if(this.isMultiple()) {
            isCanceled = false;
            if(values) {
                if(Array.isArray(values)) {
                    values = Array.from(values);
                } else {
                    values = [values];
                }
                for(j = this._selectList.length - 1; j >= 0; j--) {
                    if(values.length === 0) {
                        break;
                    }
                    elem = $(this._selectList[j]);
                    itemData = this._getSelectionData(elem[0]).itemData;
                    for(i = 0, len = values.length; i < len; i++) {
                        if(this._equalValue(itemData, values[i])) {
                            this._selectItem(elem, false);
                            values.splice(i, 1);
                            break;
                        }
                    }
                }
            } else {
                for(i = 0, len = this._selectList.length; i < len; i++) {
                    elem = $(this._selectList[i]);
                    setChecked.call(this, elem.find("." + checkboxClass), false);
                }
                this._selectList = [];
            }
            isCanceled = this._selectList.length === 0;
        } else {
            isCanceled = true;
            if(this._current) {
                this._current
                    .removeClass(selectedClass)
                    .removeClass("background-highlight");
                this._current = null;
            }
        }
        if(isFire !== false && isCanceled) {
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
    extensionPropertyName = "_extensions";

var flodButtonLeft = 3,
    flodButtonWidth = 14;

function setExtension(name, value) {
    var extensions = this[extensionPropertyName];
    if(!extensions) {
        extensions = {};
        this[extensionPropertyName] = extensions;
    }

    extensions[name] = value;
}

function getExtension(name) {
    var extensions = this[extensionPropertyName];
    if(extensions) {
        return extensions[name] || null;
    }
    return null;
}

function getParent() {
    return getExtension.call(this, "parentNode");
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
        this._super.apply(this, arguments);
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

            id = path ? (path + "_" + i) : ("" + i);
            text = this._getText.call(item, this.option.textField) || "";

            setExtension.call(item, "parentNode", parentData || null);
            setExtension.call(item, "elementId", id);
            item.getParent = getParent;
            
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
        var level = 0,
            parentData;
        while(parentData = nodeData.getParent()) {
            level++;
            nodeData = parentData;
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
        data.parent = data.nodeData.getParent();
        data.isRoot = !data.parent;
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

        parentNodeData = nodeData.getParent();
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
    cancelSelection: function(values, isFire) {
        var elem,
            i, len, j,
            nodeData,
            isCanceled;

        if(ui.core.isBoolean(values)) {
            isFire = values;
            values = null;
        }

        if(this.isMultiple()) {
            isCanceled = false;
            if(values) {
                if(Array.isArray(values)) {
                    values = Array.from(values);
                } else {
                    values = [values];
                }
                for(j = this._selectList.length - 1; j >= 0; j--) {
                    if(values.length === 0) {
                        break;
                    }
                    elem = $(this._selectList[j]);
                    nodeData = this._getNodeData(elem);
                    for(i = 0, len = values.length; i < len; i++) {
                        if(this._equalValue(nodeData, values[i])) {
                            this._selectItem(elem, nodeData, false);
                            values.splice(i, 1);
                            break;
                        }
                    }
                }
            } else {
                for(i = 0, len = this._selectList.length; i < len; i++) {
                    elem = $(this._selectList[i]);
                    setChecked.call(this, elem.find("." + checkboxClass), false);
                }
                this._selectList = [];
            }
            isCanceled = this._selectList.length === 0;
        } else {
            isCanceled = true;
            if(this._current) {
                this._current
                    .removeClass(selectedClass)
                    .removeClass("background-highlight");
                this._current = null;
            }
        }

        if(isFire !== false && isCanceled) {
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
var controlName = "ui.ctrls.CalendarView",
    timeTitleWidth = 80,
    hourHeight = 25,
    currentTimeLineHeight = 17,
    viewTypes,
    language = ui.i18n("control", controlName);

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
    return (date.getMonth() + 1) + " / " + date.getDate() + "（" + language.sundayFirstWeek[date.getDay()] + "）";
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
                    .append("<span class='font-highlight'>" + (i + 1) + language.monthUnit + "</span>"));
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
        return this.year + language.yearUnit;
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
        }).add(this.selectionBox, {
            ease: ui.AnimationStyle.swing,
            onChange: function (val, elem) {
                elem.css("left", val + "px");
            }
        }).add(this.selectionBox, {
            ease: ui.AnimationStyle.swing,
            onChange: function (val, elem) {
                elem.css("width", val + "px");
            }
        }).add(this.selectionBox, {
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
ui.ctrls.define(controlName, {
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
        this.viewChangeAnimator.add({
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
            return language.sundayFirstWeek;
        } else {
            return language.mondayFirstWeek;
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
        highlightColor,
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
        colorInfo = ui.theme.currentHighlight || { color: "#3E5A99" };
    }

    baseColor = ui.theme.backgroundColor || "#FFFFFF";
    highlightColor = colorInfo.Color || colorInfo.color;

    color = ui.color.overlay(highlightColor, baseColor, .4);
    color = ui.color.rgb2hex(color.red, color.green, color.blue);
    styleHelper.setRule(".ui-calendar-selector", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-hour-panel .schedule-item-panel", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-hour-panel .schedule-item-panel:hover", {
        "background-color": highlightColor
    });
    styleHelper.setRule(".ui-calendar-month-day-view .month-days-table .selected", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-year-view .year-month-table .selected", {
        "background-color": color
    });

    color = ui.color.overlay(highlightColor, baseColor, .85);
    color = ui.color.rgb2hex(color.red, color.green, color.blue);
    styleHelper.setRule(".ui-calendar-hour-panel .week-hour-cell-today", {
        "background-color": color
    });

    color = ui.color.overlay(highlightColor, baseColor, .7);
    color = ui.color.rgb2hex(color.red, color.green, color.blue);
    styleHelper.setRule(".ui-calendar-month-day-view .month-days-cell .schedule-item", {
        "background-color": color
    });
    styleHelper.setRule(".ui-calendar-month-day-view .month-days-cell .schedule-border", {
        "background-color": highlightColor
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
    td.addClass("group-cell");
    this.group["_last_group_index_"] = data.groupIndex;
    return this.group.groupItemFormatter.apply(this, arguments);
}

function onGropRowClick(e, element) {
    var viewData,
        td,
        groupItem;

    td = element;

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
    },
    _operateChildren: function (list, action) {
        var viewData,
            rowIndex,
            rows, item, result,
            i, len;

        viewData = this.gridview.getViewData();
        rows = this.gridview.bodyTable[0].rows;
        for (i = 0, len = list.length; i < len; i++) {
            rowIndex = list[i];
            item = viewData[rowIndex];
            action.call(this, item, rows[rowIndex]);
        }
    },

    /// API
    /** 绑定GridView */
    setGridView: function(gridview) {
        var onBodyClick;
        if(gridview instanceof ui.ctrls.GridView) {
            this.gridview = gridview;
            this.gridview.group = this;
            // 添加分组展开关闭的事件
            if(gridview.clickHandlers) {
                if(gridview.clickHandlers.has("group-cell")) {
                    return;
                }
                // 由于group-cell和ui-table-body-cell重叠，group-cell要先执行，所以要做特殊处理
                onBodyClick = gridview.clickHandlers.classEventMap.get("ui-table-body-cell");
                gridview.clickHandlers.remove("ui-table-body-cell");
                gridview.clickHandlers.add("group-cell", onGropRowClick.bind(this));
                gridview.clickHandlers.add("ui-table-body-cell", onBodyClick);
            }
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
function onFoldButtonClick(e, element) {
    var btn,
        rowIndex,
        rowData;

    btn = element;
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
        rows = this.gridview.bodyTable[0].rows;
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
            cell = $(this.gridview.bodyTable.get(0).rows[rowIndex].cells[cellIndex]);
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
            // 添加节点展开关闭的事件
            if(gridview.clickHandlers) {
                if(gridview.clickHandlers.has("fold")) {
                    return;
                }
                gridview.clickHandlers.add("fold", onFoldButtonClick.bind(this));
            }
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
                $(this.gridview.bodyTable[0].rows[currRowIndex]).before(row);
            } else {
                this.gridview.bodyTable.append(row);
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
    bodyCell = "ui-table-body-cell",
    lastCell = "last-cell",
    sortColumn = "sort-column",
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

// 排序器
function Sorter(view) {
    this.view = view;
    this.currentSortColumn = null;
    this.sorter = new ui.Introsort();
    this.sortAfterFn = null;
    this._resetSortColumnStateHandler = (function() {
        this.resetSortColumnState();
    }).bind(this);
}
Sorter.prototype = {
    constructor: Sorter,
    prepareHead: function() {
        this.sortCells = [];
        this._isAddedResetSortColumnState = false;
        this.view.columnResetter.remove(this._resetSortColumnStateHandler);
    },
    setSortColumn: function(cell, column, index) {
        if (column.sort === true || ui.core.isFunction(column.sort)) {
            cell.addClass(sortColumn);
            cell.append("<i class='fa fa-sort' />");
            this.sortCells.push(cell);
            if(!this._isAddedResetSortColumnState) {
                this.view.columnResetter.add(this._resetSortColumnStateHandler);
                this._isAddedResetSortColumnState = true;
            }
        }
    },
    resetSortColumnState: function() {
        var icon, i, len;
        if(!this.sortCells) {
            return;
        }
        for (i = 0, len = this.sortCells.length; i < len; i++) {
            icon = this.sortCells[i].find("i");
            if (!icon.hasClass(sortClass)) {
                icon.attr("class", "fa fa-sort");
                return;
            }
        }
    },
    sort: function(viewData, elem, column) {
        var view,
            isSelf,
            comparer, fn,
            tempTbody, rows, rowsMapper, icon;

        view = this.view;
        if (viewData.length === 0) {
            return;
        }

        if (this.currentSortColumn !== column) {
            this.resetSortColumnState();
        }

        isSelf = this.currentSortColumn === column;
        this.currentSortColumn = column;

        tempTbody = view.bodyTable.children("tbody");
        rows = tempTbody.children().get();
        if(ui.core.isFunction(this.sortAfterFn)) {
            // 保留排序前的副本，以后根据索引和rowIndex调整其它表格的顺序
            rowsMapper = rows.slice(0);
        }
        if (!Array.isArray(rows) || rows.length !== viewData.length) {
            throw new Error("data row error");
        }

        icon = elem.find("i");
        if (icon.hasClass(asc)) {
            this.reverse(viewData, rows);
            icon.removeClass(sortClass).removeClass(asc).addClass(desc);
        } else {
            if (isSelf) {
                this.reverse(viewData, rows);
            } else {
                fn = column.sort;
                if(!ui.core.isFunction(fn)) {
                    fn = (function(v1, v2) {
                        return this.defaultComparer(v1, v2);
                    }).bind(this);
                }
                comparer = function(v1, v2) {
                    v1 = view._prepareValue(v1, column);
                    v2 = view._prepareValue(v2, column);
                    return fn(v1, v2);
                };

                this.sorter.items = rows;
                this.sorter.sort(viewData, comparer);
            }
            icon.removeClass(sortClass).removeClass(desc).addClass(asc);
        }
        tempTbody.append(rows);

        if(rowsMapper) {
            // 执行排序后的其他操作
            this.sortAfterFn(rowsMapper);
        }

        view._refreshRowNumber();
    },
    defaultComparer: function(v1, v2) {
        var val, i, len;
        if (Array.isArray(v1)) {
            val = 0;
            for (i = 0, len = v1.length; i < len; i++) {
                val = this.sorting(v1[i], v2[i]);
                if (val !== 0) {
                    return val;
                }
            }
            return val;
        } else {
            return this.sorting(v1, v2);
        }
    },
    sorting: function(v1, v2) {
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
    },
    reverse: function(arr1, arr2) {
        var temp, i, j, len;
        for (i = 0, j = arr1.length - 1, len = arr1.length / 2; i < len; i++, j--) {
            temp = arr1[i];
            arr1[i] = arr1[j];
            arr1[j] = temp;

            temp = arr2[i];
            arr2[i] = arr2[j];
            arr2[j] = temp;
        }
    },
    reset: function() {
        this.currentSortColumn = null;
        this.sorter.keys = null;
        this.sorter.items = null;
    }
};

// 列还原器
function ColumnResetter(view) {
    this.handlers = [];
    this.view = view;
}
ColumnResetter.prototype = {
    constructor: ColumnResetter,
    add: function(fn) {
        if(ui.core.isFunction(fn)) {
            this.handlers.push(fn);
        }
    },
    remove: function(fn) {
        var i;
        for(i = this.handlers.length - 1; i >= 0; i--) {
            if(this.handlers[i] === fn) {
                this.handlers.splice(i, 1);
                break;
            }
        }
    },
    reset: function() {
        var view = this.view;
        this.handlers.forEach(function(fn) {
            try {
                fn.call(view);
            } catch(e) { }
        });
    }
};
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
        columnInfo,
        headRows;
    setChecked(cbx, checked);
    if(!this._gridCheckboxAll) {
        columnInfo = this._getColumnIndexByFormatter(columnCheckboxAllFormatter, "text");
        if(columnInfo.columnIndex === -1) {
            return;
        }
        headRows = columnInfo.headTable[0].tHead.rows;
        this._gridCheckboxAll = 
            $(headRows[headRows.length - 1].cells[columnInfo.columnIndex])
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

// 事件代理
function ClassEventDelegate() {
    this.classEventMap = new ui.KeyArray();
    this.length = 0;
}
ClassEventDelegate.prototype = {
    getClassNames: function() {
        return this.classEventMap.keys();
    },
    call: function(className) {
        var args = Array.prototype.slice.call(arguments, 1),
            handler = this.classEventMap.get(className);
        if(Array.isArray(handler)) {
            handler.forEach(function(h) {
                h.apply(null, args);
            });
        } else {
            handler.apply(null, args);
        }
    },
    add: function(className, handler, isMultiple) {
        var old;
        if(!ui.core.isFunction(handler)) {
            throw new TypeError("the delegate event handler is not a function.");
        }

        old = this.classEventMap.get(className);
        if(isMultiple) {
            if(Array.isArray(old)) {
                old.push(handler);
                handler = old;
            } else if(ui.core.isFunction(old)) {
                handler = [old, handler];
            }
        }
        this.classEventMap.set(className, handler);
        this.length = this.classEventMap.length;
    },
    remove: function(className, handler) {
        var old;
        if(ui.core.isFunction(handler)) {
            old = this.classEventMap.get(className);
            if(Array.isArray(old)) {
                this.classEventMap.set(className, old.filter(function(item) {
                    return item === handler;
                }));
            } else {
                this.classEventMap.remove(className);
            }
        } else {
            this.classEventMap.remove(className);
        }
        this.length = this.classEventMap.length;
    },
    has: function(className) {
        return this.classEventMap.containsKey(className);
    }
};

// 事件处理函数
// 点击事件代理
function clickDelegate(e) {
    var elem = $(e.target),
        i, len, classNames, className;
    
    len = this.clickHandlers ? this.clickHandlers.length : 0;
    if(len === 0) {
        return;
    }
    classNames = this.clickHandlers.getClassNames();
    while (true) {
        if (elem.length === 0 || elem.hasClass("ui-grid-view")) {
            return;
        }
        for(i = 0; i < len; i++) {
            className = classNames[i];
            if(elem.hasClass(className)) {
                this.clickHandlers.call(className, e, elem);
                return;
            }
        }
        elem = elem.parent();
    }
}
// 排序点击事件处理
function onSort(e, element) {
    var viewData,
        columnIndex, column;

    viewData = this.getViewData();
    if (viewData.length === 0) {
        return;
    }

    columnIndex = element[0].cellIndex;
    column = this._getColumn(columnIndex);

    this.sorter.sort(viewData, element, column);
}
// 表格内容点击事件处理
function onBodyClick(e, element) {
    var elem, selectedClass,
        exclude, result;

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

    if(this.option.selection.type === "row") {
        element = element.parent();
    }
    selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
    element.context = e.target;

    this._selectItem(element, selectedClass);
}
// 横向滚动条跟随事件处理
function onScrolling(e) {
    this.head.scrollLeft(
        this.body.scrollLeft());
}
// 全选按钮点击事件处理
function onCheckboxAllClick(e) {
    var cbxAll, cbx, cell,
        checkedValue, cellIndex,
        rows, selectedClass, fn, 
        i, len,
        container;

    e.stopPropagation();
    if(this.count() === 0) {
        return;
    }

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

    container = cbxAll.parent();
    while(true) {
        if(container.hasClass("ui-grid-view")) {
            return;
        }
        if(container.hasClass("ui-grid-head")) {
            container = container.next();
            container = container.find("table");
            if(container.length === 0) {
                rows = [];
            } else {
                rows = container[0].tBodies[0].rows;
            }
            break;
        }
        container = container.parent();
    }
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

// 提示信息
function Prompt(view, text) {
    this.view = view;
    this.enabled = true;
    if(!text) {
        this.enabled = false;
    }
    this.element = $("<div class='data-prompt' />");
    this.setText(text);
    this.view.body.append(this.element);
}
Prompt.prototype = {
    constructor: Prompt,
    isShow: function() {
        return this.enabled && this.element.css("display") === "block";
    },
    show: function() {
        if(this.enabled) {
            this.element.css("display", "block");
        }
    },
    hide: function() {
        if(this.enabled) {
            this.element.css("display", "none");
        }
    },
    setText: function(text) {
        if(!this.enabled) {
            return;
        }
        if (ui.core.isString(text) && text.length > 0) {
            this.element.html("<span class='font-highlight'>" + text + "</span>");
        } else if (ui.core.isFunction(text)) {
            text = text();
            this.element.append(text);
        }
    }
};


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
            prompt: "没有数据",
            // 高度
            height: false,
            // 宽度
            width: false,
            // 默认格式化器
            textFormatter: null,
            // 鼠标悬停反馈
            mouseHoverReaction: true,
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

        // 存放列头状态重置器
        this.columnResetter = new ColumnResetter(this);
        // 排序器
        this.sorter = new Sorter(this);
        
        this.head = null;
        this.body = null;
        this.foot = null;
        
        this.rowHeight = 30;
        this.headHeight = this.rowHeight;
        this.bodyHeight = 0;
        this.footHeight = 30;
        // checkbox勾选计数器
        this._checkedCount = 0;
        
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

        // event handlers
        this.clickHandlers = new ClassEventDelegate();
        // 排序列点击事件
        this.clickHandlers.add(sortColumn, onSort.bind(this));
        // 全选按钮点击事件
        this.clickHandlers.add(cellCheckboxAll, onCheckboxAllClick.bind(this));
        // 行或者单元格点击事件
        this.clickHandlers.add(bodyCell, onBodyClick.bind(this));
        
        // 滚动条同步事件
        this.onScrollingHandler = onScrolling.bind(this);
    },
    _render: function() {
        if(!this.element) {
            throw new Error("the element is null.");
        }
        if(!this.element.hasClass("ui-grid-view")) {
            this.element.addClass("ui-grid-view");
        }
        this.element.click((function(e) {
            clickDelegate.call(this, e);
        }).bind(this));
        this._initBorderWidth();

        // 表头
        this.head = $("<div class='ui-grid-head' />");
        this.element.append(this.head);
        // 表体
        this.body = $("<div class='ui-grid-body' />");
        this.body.scroll(this.onScrollingHandler);
        this.element.append(this.body);
        // 信息提示
        this.prompt = new Prompt(this, this.option.prompt);
        // 分页栏
        this._initPagerPanel();

        // 创建表头
        this.createHead(this.option.columns);
        // 创建表体
        if (Array.isArray(this.option.viewData)) {
            this.createBody(
                this.option.viewData, this.option.viewData.length);
        } else {
            this.option.viewData = [];
        }
        // 设置容器大小
        this.setSize(this.option.width, this.option.height);
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
    _initPagerPanel: function() {
        if(this.pager) {
            this.foot = $("<div class='ui-grid-foot clear' />");
            this.element.append(this.foot);
            
            this.pager.pageNumPanel = $("<div class='page-panel' />");
            if (this.option.pager.displayDataInfo) {
                this.pager.pageInfoPanel = $("<div class='data-info' />");
                this.foot.append(this.pager.pageInfoPanel);
            } else {
                this.pager.pageNumPanel.css("width", "100%");
            }

            this.foot.append(this.pager.pageNumPanel);
            this.pager.pageChanged(function(pageIndex, pageSize) {
                this.pageIndex = pageIndex;
                this.pageSize = pageSize;
                this.fire("pagechanging", pageIndex, pageSize);
            }, this);
        }
    },
    // 创建一行的所有单元格
    _createRowCells: function(tr, rowData, rowIndex, columns, filter) {
        var i, len, 
            column, cval, td, el,
            formatter,
            hasFilter,
            isRowHover;
            
        isRowHover = this.option.selection.type !== "cell";
        if(!this._noBodyHover && isRowHover) {
            tr.addClass("table-body-row-hover");
        }

        if(ui.core.isFunction(columns)) {
            columns = null;
            filter = columns;
        }
        if(!Array.isArray(columns)) {
            columns = this.option.columns;
        }
        hasFilter = ui.core.isFunction(filter);
        for (i = 0, len = columns.length; i < len; i++) {
            column = columns[i];
            formatter = column.formatter;
            // 自定义格式化器
            if (!ui.core.isFunction(column.formatter)) {
                formatter = this.option.textFormatter;
            }
            // option默认格式化器
            if(!ui.core.isFunction(formatter)) {
                formatter = textFormatter;
            }
            cval = this._prepareValue(rowData, column);
            td = this._createCell("td", column);
            td.addClass("ui-table-body-cell");
            if(!this._noBodyHover && !isRowHover) {
                td.addClass("table-body-cell-hover");
            }
            el = formatter.call(this, cval, column, rowIndex, td);
            if (td.isAnnulment) {
                continue;
            }
            if(hasFilter) {
                el = filter.call(this, el, column, rowData);
            }
            if (el) {
                td.append(el);
            }
            if (i === len - 1) {
                td.addClass(lastCell);
            }
            tr.append(td);
            // group-table使用，合并一行单元格时使用
            if(td.isFinale) {
                td.addClass(lastCell);
                break;
            }
        }
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
    // 获得并组装值
    _prepareValue: function(rowData, columnObj) {
        var value,
            i, len;
        if (Array.isArray(columnObj.column)) {
            value = {};
            for (i = 0, len = columnObj.column.length; i < len; i++) {
                value[i] = value[columnObj.column[i]] = 
                    this._getValue(rowData, columnObj.column[i], columnObj);
            }
        } else {
            value = this._getValue(rowData, columnObj.column, columnObj);
        }
        return value;
    },
    // 获取值
    _getValue: function(rowData, column, columnObj) {
        var arr, i = 0, value;
        if (!ui.core.isString(column)) {
            return null;
        }
        if (!columnObj._columnKeys.hasOwnProperty(column)) {
            columnObj._columnKeys[column] = column.split(".");
        }
        arr = columnObj._columnKeys[column];
        value = rowData[arr[i]];
        for (i = 1; i < arr.length; i++) {
            value = value[arr[i]];
            if (value === undefined || value === null) {
                return value;
            }
        }
        return value;
    },
    // 获取column对象
    _getColumn: function(index) {
        return this.option.columns[index];
    },
    _renderPageList: function(rowCount) {
        if (!this.pager) {
            return;
        }
        this.pager.data = this.getViewData();
        this.pager.pageIndex = this.pageIndex;
        this.pager.pageSize = this.pageSize;
        this.pager.renderPageList(rowCount);
    },
    _updateScrollState: function() {
        if (!this.headTable) return;
        if(this.body[0].scrollHeight > this.body.height()) {
            this._headScrollCol.css("width", ui.scrollbarWidth + 0.1 + "px");
        } else {
            this._headScrollCol.css("width", "0");
        }
    },
    _refreshRowNumber: function(startRowIndex, endRowIndex) {
        var viewData,
            columnInfo, rowNumber,
            rows, cell,
            column, i, len;

        viewData = this.getViewData();
        if(viewData.length === 0) {
            return;
        }

        rowNumber = rowNumberFormatter;
        columnInfo = this._getColumnIndexByFormatter(rowNumber);
        
        if (columnInfo.columnIndex == -1) return;
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
    _getColumnIndexByFormatter: function(formatter, field) {
        var result, i, len;

        result = {
            columnIndex: -1,
            columns: this.option.columns,
            headTable: this.headTable,
            bodyTable: this.bodyTable
        };
        if(!field) {
            field = "formatter";
        }
        for(i = 0, len = result.columns.length; i < len; i++) {
            if(result.columns[i][field] === formatter) {
                result.columnIndex = i;
                return result;
            }
        }
        return result;
    },
    _getSelectionData: function(elem) {
        var data = {},
            viewData = this.getViewData();
        if(this.option.selection.type === "cell") {
            data.rowIndex = elem.parent().prop("rowIndex");
            data.cellIndex = elem.prop("cellIndex");
            data.rowData = viewData[data.rowIndex];
            data.column = this._getColumn(data.cellIndex).column;
        } else {
            data.rowIndex = elem.prop("rowIndex");
            data.rowData = viewData[data.rowIndex];
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
    _addSelectedState: function(elem, selectedClass, eventData) {
        elem.addClass(selectedClass).addClass("background-highlight");
        if(eventData) {
            this.fire("selected", eventData);
        }
    },
    _removeSelectedState: function(elem, selectedClass, eventData) {
        elem.removeClass(selectedClass).removeClass("background-highlight");
        if(eventData) {
            this.fire("deselected", eventData);
        }
    },
    _selectItem: function(elem, selectedClass, selectValue) {
        var eventData, result,
            columnInfo, checkbox,
            i, len, isFire;

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
                this._removeSelectedState(elem, selectedClass, eventData);
            } else {
                // 现在要选中
                // 如果selectValue定义了取消，则不要执行选中逻辑
                if(selectValue === false) {
                    return;
                }
                selectValue = true;

                this._selectList.push(elem[0]);
                this._addSelectedState(elem, selectedClass, eventData);
            }

            // 同步checkbox状态
            if(this.option.selection.isRelateCheckbox) {
                // 用过用户点击的是checkbox则保存变量，不用重新去获取了
                if(eventData.originElement && eventData.originElement.hasClass(cellCheckbox)) {
                    checkbox = eventData.originElement;
                }
                // 如果用户点击的不是checkbox则找出对应的checkbox
                if(!checkbox) {
                    columnInfo = this._getColumnIndexByFormatter(checkboxFormatter);
                    if(columnInfo.columnIndex > -1) {
                        checkbox = this.option.selection.type === "cell" ? 
                            $(elem.parent()[0].cells[columnInfo.columnIndex]) : 
                            $(elem[0].cells[columnInfo.columnIndex]);
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
                isFire = this._current[0] === elem[0];
                this._removeSelectedState(this._current, selectedClass, (isFire ? eventData : null));
                if(isFire) {
                    this._current = null;
                    return;
                }
            }
            this._current = elem;
            this._addSelectedState(elem, selectedClass, eventData);
        }
    },

    /// API
    /** 创建表头 */
    createHead: function(columns) {
        var colGroup, thead,
            tr, th,
            columnObj, i;

        if(Array.isArray(columns)) {
            this.option.columns = columns;
        }

        this.sorter.prepareHead();
        if (!this.headTable) {
            this.headTable = $("<table class='ui-table-head' cellspacing='0' cellpadding='0' />");
            this.head.append(this.headTable);
        } else {
            this.headTable.html("");
        }

        colGroup = $("<colgroup />");
        thead = $("<thead />");
        tr = $("<tr />");
        for (i = 0; i < columns.length; i++) {
            columnObj = columns[i];
            if (!columnObj._columnKeys) {
                columnObj._columnKeys = {};
            }
            colGroup.append(this._createCol(columnObj));
            th = this._createCell("th", columnObj);
            th.addClass("ui-table-head-cell");
            if (ui.core.isFunction(columnObj.text)) {
                th.append(columnObj.text.call(this, columnObj, th));
            } else {
                if(columnObj.text) {
                    th.append(columnTextFormatter.call(this, columnObj, th));
                }
            }
            this.sorter.setSortColumn(th, columnObj, i);
            if (i == columns.length - 1) {
                th.addClass(lastCell);
            }
            tr.append(th);
        }

        this._headScrollCol = $("<col style='width:0' />");
        colGroup.append(this._headScrollCol);
        tr.append($("<th class='ui-table-head-cell scroll-cell' />"));
        thead.append(tr);

        this.headTable.append(colGroup);
        this.headTable.append(thead);
    },
    /** 创建内容 */
    createBody: function(viewData, rowCount) {
        var colGroup, tbody,
            tr, i, j, len,
            columns, 
            column,
            isRebind = false;
        
        if (!this.bodyTable) {
            this.bodyTable = $("<table class='ui-table-body' cellspacing='0' cellpadding='0' />");
            this.body.append(this.bodyTable);
        } else {
            this.body.scrollTop(0);
            this.clear(false);
            isRebind = true;
        }

        columns = this.option.columns;
        if(!Array.isArray(viewData)) {
            viewData = [];
        }
        this.option.viewData = viewData;

        if(viewData.length === 0) {
            this.prompt.show();
            return;
        } else {
            this.prompt.hide();
        }

        colGroup = $("<colgroup />"),
        tbody = $("<tbody />");
        this.bodyTable.append(colGroup);

        for (j = 0, len = columns.length; j < len; j++) {
            column = columns[j];
            colGroup.append(this._createCol(column));
        }
        for (i = 0, len = viewData.length; i < len; i++) {
            tr = $("<tr />");
            this._createRowCells(tr, viewData[i], i, columns);
            tbody.append(tr);
        }
        this.bodyTable.append(tbody);

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
        var columnInfo, rows, elem,
            checkboxClass = "." + cellCheckbox,
            result = [],
            i, len;

        columnInfo = this._getColumnIndexByFormatter(checkboxFormatter);
        if(columnInfo.columnIndex === -1) {
            return result;
        }
        rows = columnInfo.bodyTable[0].tBodies[0].rows;
        for(i = 0, len = rows.length; i < len; i++) {
            elem = $(rows[i].cells[columnInfo.columnIndex]).find(checkboxClass);
            if(elem.length > 0) {
                result.push(ui.str.htmlEncode(elem.attr("data-value")));
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
            columnInfo = this._getColumnIndexByFormatter(checkboxFormatter);
            fn = function(elem) {
                var checkbox,
                    cell;
                if(columnInfo.columnIndex !== -1) {
                    cell = this.option.selection.type === "cell" ? 
                        $(elem.parent()[0].cells[columnInfo.columnIndex]) : 
                        $(elem[0].cells[columnInfo.columnIndex]);
                    checkbox = cell.find(checkboxClass);
                    setChecked(checkbox, false);
                }
                this._removeSelectedState(elem, selectedClass);
            };
        } else {
            fn = function(elem) {
                this._removeSelectedState(elem, selectedClass);
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
            rowIndex = arguments[i];
            if(ui.core.isNumber(rowIndex) && rowIndex >= 0 && rowIndex < viewData.length) {
                indexes.push(rowIndex);
            }
        }
        len = indexes.length;
        if(len > 0) {
            // 降序
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
                row = $(this.bodyTable[0].rows[rowIndex]);
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
            row,
            _columns = arguments[2],
            _cellFilter = arguments[3];

        viewData = this.getViewData();
        if(viewData.length === 0) {
            return;
        }
        if(rowIndex < 0 || rowIndex > viewData.length) {
            return;
        }

        row = $(this.bodyTable[0].rows[rowIndex]);
        if(row.length === 0) {
            return;
        }
        row.empty();
        viewData[rowIndex] = rowData;
        this._createRowCells(row, rowData, rowIndex, _columns, _cellFilter);
    },
    /** 增加行 */
    addRow: function(rowData) {
        var viewData,
            row,
            len,
            _columns = arguments[1],
            _cellFilter = arguments[2];

        if(!rowData) return;

        viewData = this.getViewData();
        len = viewData.length;
        if(len === 0) {
            if(this.bodyTable) {
                this.bodyTable.remove();
                this.bodyTable = null;
            }
            this.createBody([rowData]);
            return;
        }

        row = $("<tr />");
        this._createRowCells(row, rowData, len, _columns, _cellFilter);
        $(this.bodyTable[0].tBodies[0]).append(row);
        viewData.push(rowData);
        this._updateScrollState();
    },
    /** 插入行 */
    insertRow: function(rowIndex, rowData) {
        var viewData,
            row,
            len,
            _columns = arguments[2],
            _cellFilter = arguments[3];
        if(!rowData) return;

        viewData = this.getViewData();
        len = viewData.length;
        if(len === 0) {
            this.addRow(rowData);
            return;
        }
        if(rowIndex < 0) {
            rowIndex = 0;
        }
        if(rowIndex < viewData.length) {
            row = $("<tr />");
            this._createRowCells(row, rowData, rowIndex, _columns, _cellFilter);
            $(this.bodyTable[0].rows[rowIndex]).before(row);
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
        
        viewData = this.getViewData();
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

        rows = this.bodyTable[0].tBodies[0].rows;
        destRow = $(rows[destIndex]);
        if(destIndex > sourceIndex) {
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
        var viewData = this.getViewData();
        if(viewData.length === 0) {
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
        return this.getViewData().length;
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
        this.option.viewData = null;
        this._selectList = [];
        this._current = null;
        this._checkedCount = 0;

        if (this.bodyTable) {
            this.bodyTable.html("");
        }
        if (this.headTable) {
            this.columnResetter.reset();
        }
        if (this.pager) {
            this.pager.empty();
        }
        this.sorter.reset();
        if (arguments[0] !== false) {
            this.prompt.show();
        }
    },
    /** 设置表格的尺寸, width: 宽度, height: 高度 */
    setSize: function(width, height) {
        if(arguments.length === 1) {
            height = width;
            width = null;
        }
        if(ui.core.isNumber(height)) {
            this.height = height;
            this.innerHeight = height - this.borderHeight;
            height = this.innerHeight - this.headHeight;
            if(this.pager) {
                height -= this.footHeight;
            }
            this.bodyHeight = height;
            this.body.css("height", this.bodyHeight + "px");
        } else {
            this.innerHeight = this.element.height();
            this.height = this.innerHeight + this.borderHeight;
        }
        if(ui.core.isNumber(width)) {
            this.width = width;
            this.innerWidth = width - this.borderWidth;
            this.bodyWidth = this.innerWidth;
            this.element.css("width", this.innerWidth + "px");
        } else {
            this.innerWidth = this.element.width();
            this.width = this.innerWidth + this.borderWidth;
        }
        this._updateScrollState();
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

var lastCell = "last-cell",
    sortColumn = "sort-column",
    emptyRow = "empty-row",
    fixedEmpty = "ui-report-fixed-empty",
    fixedShadow = "border-highlight";
var // 最小不能小于40像素
    defaultFixedCellWidth = 40;

var columnTextFormatter = ui.ColumnStyle.cnfn.columnText,
    textFormatter = ui.ColumnStyle.cfn.text,
    columnStyle = ui.ColumnStyle;

function ReportFixed(view, parent, css) {
    this.view = view;
    this.parent = parent;
    this.panel = $("<div class='ui-report-fixed' />");
    if(css) {
        this.panel.css(css);
    }
    this.head = $("<div class='ui-grid-head ui-report-fixed-head' />");
    this.head.css("height", this.view.headHeight + "px");
    this.body = $("<div class='ui-grid-body ui-report-fixed-body' />");
    this.body.css("height", this.view.bodyHeight + "px");
    this.width = 0;
    this.height = 0;
    // 偏移的列索引
    this.offsetCellIndex = 0;

    this.panel
        .append(this.head)
        .append(this.body);
    this.parent.append(this.panel);
}
ReportFixed.prototype = {
    constructor: ReportFixed,
    setHead: function(groupColumns) {
        var width = 0;
        this.columns = [];
        this.headTable = $("<table class='ui-table-head' cellspacing='0' cellpadding='0' style='left:0' />");
        this.view._createHeadTable(this.headTable, this.columns, groupColumns, true,
            function(column, th, columnIndex, len) {
                if(!column.len) {
                    column.len = defaultFixedCellWidth;
                }
                width += column.len;
            }
        );
        this.width = width;
        this.head.html("").append(this.headTable);
        this.head.css("width", this.width + "px");
    },
    setBody: function(viewData) {
        this.bodyTable = $("<table class='ui-table-body' cellspacing='0' cellpadding='0' style='left:0' />");
        this.view._createBodyTable(this.bodyTable, viewData, this.columns);
        this.body.scrollTop(0);
        this.body.html("").append(this.bodyTable);
        this.body.css("width", this.width + "px");
        this.panel.removeClass(fixedEmpty);
    },
    clear: function() {
        if(this.bodyTable) {
            this.bodyTable.remove();
            delete this.bodyTable;
        }
        this.panel.removeClass(fixedShadow).addClass(fixedEmpty);
    },
    destroy: function() {
        this.panel.remove();
    },
    findColumnInfo: function(formatter, field) {
        var i, len;
        for(i = 0, len = this.columns.length; i < len; i++) {
            if(this.columns[i][field] === formatter) {
                return {
                    columnIndex: i,
                    columns: this.columns,
                    headTable: this.headTable,
                    bodyTable: this.bodyTable
                };
            }
        }
    },
    getElement: function(rowIndex, cellIndex) {
        var element = $(this.bodyTable[0].tBodies[0].rows[rowIndex]);
        if(ui.core.isNumber(cellIndex)) {
            cellIndex = cellIndex - this.offsetCellIndex;
            if(cellIndex < 0 || cellIndex >= element[0].cells.length) {
                element = null;
            } else {
                element = $(element[0].cells[cellIndex]);
            }
        }
        return element;
    },
    updateRow: function(rowIndex, rowData) {
        var row = $(this.bodyTable[0].rows[rowIndex]);
        if(row.length === 0) return;

        row.empty();
        this.view._createRowCells(row, rowData, rowIndex, this.columns);
    },
    appendRow: function(rowData) {
        var row = $("<tr />"),
            len = this.view.count();
        this.view._createRowCells(row, rowData, len, this.columns);
        $(this.bodyTable[0].tBodies[0]).append(row);
    },
    insertRow: function(rowIndex, rowData) {
        var row = $("<tr />");
        this.view._createRowCells(row, rowData, rowIndex, this.columns);
        $(this.bodyTable[0].rows[rowIndex]).before(row);
    },
    moveRow: function(sourceIndex, destIndex) {
        var rows = this.bodyTable[0].tBodies[0].rows,
            sourceRow = $(rows[sourceIndex]),
            destRow = $(rows[destIndex]);
        if(destIndex > sourceIndex) {
            destRow.after(sourceRow);
        } else {
            destRow.before(sourceRow);
        }
    }
};

function ReportFixedWrapper(view) {
    this.view = view;
    this.left = null;
    this.right = null;
}
ReportFixedWrapper.prototype = {
    constructor: ReportFixedWrapper,
    clear: function() {
        if(this.left) {
            this.left.clear();
        }
        if(this.right) {
            this.right.clear();
        }
    },
    setBodyHeight: function(bodyHeight) {
        if(this.left) {
            this.left.body.css("height", bodyHeight + "px");
        }
        if(this.right) {
            this.right.body.css("height", bodyHeight + "px");
        }
    },
    reset: function() {
        if(this.left) {
            this.left.destroy();
            this.left = null;
        }
        if(this.right) {
            this.right.destroy();
            this.right = null;
        }
    },
    findColumnInfo: function(formatter, field) {
        var columnInfo;
        if(this.left) {
            columnInfo = this.left.findColumnInfo(formatter, field);
            if(columnInfo != null) {
                return columnInfo;
            }
        }
        if(this.right) {
            columnInfo = this.right.findColumnInfo(formatter, field);
        }
        return columnInfo;
    },
    syncScroll: function(scrollTop, scrollLeft, scrollWidth) {
        if(this.left) {
            this.left.body.scrollTop(scrollTop);
            if(scrollLeft > 0) {
                this.left.panel.addClass(fixedShadow);
            } else {
                this.left.panel.removeClass(fixedShadow);
            }
        }
        if(this.right) {
            this.right.body.scrollTop(scrollTop);
            if(Math.ceil(this.view.innerWidth + scrollLeft) < scrollWidth) {
                this.right.panel.addClass(fixedShadow);
            } else {
                this.right.panel.removeClass(fixedShadow);
            }
        }
    },
    syncSelectedState: function(dataElement, selectedClass, state) {
        var rowIndex, cellIndex, setStateFn, fn;

        if(!this.left || !this.right) {
            return;
        }
        if(this.view.option.selection.type === "row") {
            rowIndex = dataElement[0].rowIndex;
        } else {
            cellIndex = dataElement[0].cellIndex;
            rowIndex = dataElement.parent()[0].rowIndex;
        }

        setStateFn = function(node, action) {
            var element;
            if(node) {
                element = node.getElement(rowIndex, cellIndex);
                if(element) {
                    action(element);
                }
            }
        };
        
        if(state) {
            fn = function(element) {
                element.addClass(selectedClass).addClass("background-highlight");
            };
            setStateFn(this.left, fn);
            setStateFn(this.right, fn);
        } else {
            fn = function(element) {
                element.removeClass(selectedClass).removeClass("background-highlight");
            };
            setStateFn(this.left, fn);
            setStateFn(this.right, fn);
        }
    },
    sortSync: function(sortMapper) {
        var leftRows, rightRows,
            leftNewRows, rightNewRows,
            leftTbody, rightTbody,
            i, len;
        if(!this.left && !this.right) {
            return;
        }
        if(this.left) {
            leftTbody = this.left.bodyTable.children("tbody");
            leftRows = leftTbody[0].rows;
            leftNewRows = new Array(leftRows.length);
        }
        if(this.right) {
            rightTbody = this.right.bodyTable.children("tbody");
            rightRows = rightTbody[0].rows;
            rightNewRows = new Array(rightRows.length);
        }
        for(i = 0, len = sortMapper.length; i < len; i++) {
            if(leftNewRows) {
                leftNewRows[sortMapper[i].rowIndex] = leftRows[i];
            }
            if(rightNewRows) {
                rightNewRows[sortMapper[i].rowIndex] = rightRows[i];
            }
        }
    }
};

// 排序点击事件处理
function onSort(e, element) {
    var viewData,
        columnIndex, column;

    viewData = this.getViewData();
    if (viewData.length === 0) {
        return;
    }

    columnIndex = parseInt(element.attr("data-columnIndex"), 10) || element[0].cellIndex;
    column = this._getColumn(columnIndex);

    this.sorter.sort(viewData, element, column);
}
// 滚动条同步事件
function onScrolling(e) {
    var scrollTop = this.reportDataBody.scrollTop(),
        scrollLeft = this.reportDataBody.scrollLeft();
    this.reportDataHead.scrollLeft(scrollLeft);
    this.fixed.syncScroll(scrollTop, scrollLeft, this.reportDataBody[0].scrollWidth);
}

ui.ctrls.define("ui.ctrls.ReportView", ui.ctrls.GridView, {
    _defineOption: function() {
        /*
            column property
            text:       string|function     列名，默认为null
            column:     string|Array        绑定字段名，默认为null
            len:        number              列宽度，默认为auto
            align:      center|left|right   列对齐方式，默认为left(但是表头居中)
            formatter:  function            格式化器，默认为null
            sort:       boolean|function    是否支持排序，true-支持，false-不支持，默认为false
            fixed:      boolean             是否为固定列，true-是，false-否，默认否
        */
        var option = this._super();
        // 可调节列宽
        option.adjustable = true;
        return option;
    },
    _create: function() {
        var view = this;
        this._super();

        // 滚动条占位符对象
        this._headScrollColumn = {
            addScrollCol: function(tr, colGroup) {
                var rows,
                    rowspan,
                    th;

                this.scrollCol = $("<col style='width:0' />");
                colGroup.append(this.scrollCol);
            
                rows = tr.parent().children();
                rowspan = rows.length;
                th = $("<th class='ui-table-head-cell scroll-cell' />");
                if (rowspan > 1) {
                    th.attr("rowspan", rowspan);
                }
                $(rows[0]).append(th);
            },
            addFixedScrollColumn: function(div) {
                this.scrollBlock = $("<div class='ui-report-fixed-block' />");
                this.scrollBlock.css({
                    "width": ui.scrollbarWidth + "px",
                    "height": view.headHeight - 2 + "px"
                });
                div.append(this.scrollBlock);
            },
            show: function() {
                if(this.scrollCol) {
                    //滚动条默认是17像素，在IE下会显示为16.5，有效值为16。为了修正此问题设置为17.1
                    this.scrollCol.css("width", ui.scrollbarWidth + 0.1 + "px");
                }
                if(this.scrollBlock) {
                    this.scrollBlock.css("display", "block");
                    view.fixed.right.panel.css("right", (ui.scrollbarWidth + 1) + "px");
                }
            },
            hide: function() {
                if(this.scrollCol) {
                    this.scrollCol.css("width", 0);
                }
                if(this.scrollBlock) {
                    this.scrollBlock.css("display", "none");
                    view.fixed.right.panel.css("right", 0);
                }
            }
        };

        // 固定列管理器
        this.fixed = new ReportFixedWrapper(this);
        // 排序器
        this.sorter.sortAfterFn = (function(rowsMapper) {
            this.fixed.sortSync(rowsMapper);
        }).bind(this);

        // 事件初始化
        // 排序列点击事件
        this.clickHandlers.add(sortColumn, onSort.bind(this));
        // 滚动条同步事件
        this.onScrollingHandler = onScrolling.bind(this);
    },
    _render: function() {
        this._super();

        this.element.addClass("ui-report-view");
        this.head.addClass("ui-report-head");
        this.body.addClass("ui-report-body");
        
        // 定义列宽调整
        this._initAdjustColumn();
    },
    _initAdjustColumn: function() {
        if(!this.option.adjustable) {
            return;
        }
        this._adjustLine = $("<hr class='adjust-line background-highlight' />");
        this.element.append(this._adjustLine);
        this.dragger = ui.MouseDragger({
            context: this,
            target: this._adjustLine,
            handle: this.head,
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
                option.leftLimit = 0;
                option.rightLimit = that.element.width();
                
                option.target.css({
                    "left": left + "px",
                    "display": "block"
                });
            },
            onMoving: function(arg) {
                var option,
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

                colIndex = parseInt(option.th.attr("data-columnIndex"), 10);
                column = that._getColumn(colIndex);
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
                setWidthFn(that.headTable);
                setWidthFn(that.bodyTable);
                that._updateScrollState();
            }
        });
        this.dragger.on();
    },
    _createFixedHead: function (groupColumns) {
        var leftFixedGroupColumns = [],
            rightFixedGroupColumns = [],
            i, len, j, len2,
            columns, leftColumns, rightColumns;
        
        for(i = 0, len = groupColumns.length; i < len; i++) {
            columns = groupColumns[i];
            len2 = columns.length;

            leftColumns = [];
            j = 0;
            while(true) {
                if(j >= len2 || !columns[j].fixed) {
                    break;
                }
                leftColumns.push(columns[j]);
                j++;
            }
            if(leftColumns.length > 0) {
                leftFixedGroupColumns.push(leftColumns);

                if(leftColumns.length < len2) {
                    rightColumns = [];
                    j = len2;
                    while(j >= 0) {
                        j--;
                        if(j < 0) {
                            break;
                        }
                        if(columnStyle.isEmpty(columns[j])) {
                            continue;
                        }
                        if(!columns[j].fixed) {
                            break;
                        }
                        rightColumns.push(columns[j]);
                    }
                    if(rightColumns.length > 0) {
                        rightFixedGroupColumns.push(rightColumns);
                    }
                }
            }
        }

        this._noBodyHover = false;
        if(leftFixedGroupColumns.length > 0) {
            this._noBodyHover = true;
            if(!this.fixed.left) {
                this.fixed.left = new ReportFixed(this, this.element, {
                    "border-right-width": "1px",
                    "border-right-style": "solid",
                    "left": 0
                });
            }
            this.fixed.left.setHead(leftFixedGroupColumns);
        }

        if(rightFixedGroupColumns.length > 0) {
            this._noBodyHover = true;
            if(!this.fixed.right) {
                this.fixed.right = new ReportFixed(this, this.element, {
                    "border-left-width": "1px",
                    "border-left-style": "solid",
                    "right": 0
                });
                // 右边的索引需要一个偏移值能和DataColumns对应
                this.fixed.right.offsetCellIndex = j + 1;
                // 创建滚动条块
                this._headScrollColumn.addFixedScrollColumn(this.head);
            }
            this.fixed.right.setHead(rightFixedGroupColumns);
        }
    },
    _createDataHead: function (columns, groupColumns) {
        if (!this.reportDataHead) {
            this.reportDataHead = $("<div class='data-head'>");
            this.head.append(this.reportDataHead);
        } else {
            this.reportDataHead.html("");
        }

        this.headTable = $("<table class='ui-table-head' cellspacing='0' cellpadding='0' />");
        this._createHeadTable(this.headTable, columns, groupColumns, false, null, 
            // 创建滚动条适应列
            function(table, tr, groupCol) {
                this._headScrollColumn.addScrollCol(tr, groupCol);
            });
        this.reportDataHead.append(this.headTable);
    },   
    _createFixedBody: function (viewData) {
        if (viewData.length === 0) {
            return;
        }

        // 左边的固定列
        if(this.fixed.left) {
            this.fixed.left.setBody(viewData);
        }
        // 右边的固定列
        if(this.fixed.right) {
            this.fixed.right.setBody(viewData);
        }
    },
    _createDataBody: function (viewData, columns, rowCount) {
        var isRebind = false;
        if (!this.reportDataBody) {
            this.reportDataBody = $("<div class='data-body' />");
            this.reportDataBody.scroll(this.onScrollingHandler);
            this.body.append(this.reportDataBody);
        } else {
            this.reportDataBody.html("");
            isRebind = true;
        }

        this.bodyTable = $("<table class='ui-table-body' cellspacing='0' cellpadding='0' />");

        if (viewData.length === 0) {
            this.prompt.show();
            return;
        } else {
            this.prompt.hide();
        }

        this._createBodyTable(this.bodyTable, viewData, columns, 
            function(el, column) {
                return column.fixed ? null : el;
            }
        );
        this.reportDataBody.append(this.bodyTable);

        //update page numbers
        if (ui.core.isNumber(rowCount)) {
            this._renderPageList(rowCount);
        }

        // 初始化滚动条状态
        this._updateScrollState();
        ui.setTask((function() {
            var scrollLeft = this.reportDataBody.scrollLeft(),
                scrollWidth = this.reportDataBody[0].scrollWidth;
            this.fixed.syncScroll(0, scrollLeft, scrollWidth);
        }).bind(this));

        if (isRebind) {
            this.fire("rebind");
        }
    },
    _createHeadTable: function (headTable, columns, groupColumns, renderFixed, eachFn, colFn) {
        var hasFn,
            colGroup, thead,
            tr, th, columnObj, elem,
            i, j, len, row, totalRow,
            args, columnIndex;
        
        hasFn = ui.core.isFunction(eachFn);

        thead = $("<thead />");
        if (Array.isArray(groupColumns)) {
            totalRow = groupColumns.length;
            for (i = 0; i < totalRow; i++) {
                row = groupColumns[i];
                tr = $("<tr />");
                len = row.length;
                if (!row || len === 0) {
                    tr.addClass(emptyRow);
                }
                columnIndex = 0;
                for (j = 0; j < len; j++) {
                    columnObj = row[j];
                    if(columnObj.rowspan > totalRow) {
                        columnObj.rowspan = totalRow;
                    }
                    th = this._createCell("th", columnObj);
                    th.addClass("ui-table-head-cell");
                    if(j === len - 1) {
                        th.addClass(lastCell);
                    }
                    
                    // 计算当前的列索引
                    if ((columnObj.rowspan + i) === totalRow || i === totalRow - 1) {
                        if (!columnObj._columnKeys) {
                            columnObj._columnKeys = {};
                        }
                        while (columns[columnIndex]) {
                            columnIndex++;
                        }

                        if(columnObj.hasOwnProperty("columnIndex")) {
                            th.attr("data-columnIndex", columnObj.columnIndex);
                        } else {
                            th.attr("data-columnIndex", columnIndex);
                            columnObj.columnIndex = columnIndex;
                        }
                        columnObj.cell = th;
                        columns[columnIndex] = columnObj;
                    }

                    if(!columnObj.fixed || renderFixed) {
                        // 设置单元格的值
                        if (ui.core.isFunction(columnObj.text)) {
                            elem = columnObj.text.call(this, columnObj, th);
                        } else {
                            if(columnObj.text) {
                                elem = columnTextFormatter.call(this, columnObj, th);
                            }
                        }
                        if (elem) {
                            th.append(elem);
                        }
                        this.sorter.setSortColumn(th, columnObj, j);
                        // 设置列宽拖动把手
                        if(this.option.adjustable && !renderFixed) {
                            th.append("<b class='adjust-column-handle' />");
                        }
                        
                    }
                    tr.append(th);
                    columnIndex += columnObj.colspan || 1;
                }
                thead.append(tr);
            }
        }

        colGroup = $("<colgroup />");
        for (i = 0, len = columns.length; i < len; i++) {
            columnObj = columns[i];
            colGroup.append(this._createCol(columnObj));

            args = [columnObj, columnObj.cell];
            delete columnObj.cell;
            if (hasFn) {
                args.push(i);
                args.push(len);
                eachFn.apply(this, args);
            }
        }
        if (ui.core.isFunction(colFn)) {
            colFn.call(this, headTable, tr, colGroup);
        }
        
        headTable.append(colGroup);
        headTable.append(thead);
    },
    _createBodyTable: function (bodyTable, viewData, columns, cellFilter, rowFilter) {
        var colGroup, tbody,
            rowData, 
            tr, c, i, j,
            columnLength,
            hasRowFilter;

        columnLength = columns.length;
        hasRowFilter = ui.core.isFunction(rowFilter);

        colGroup = $("<colgroup />");
        for (j = 0; j < columnLength; j++) {
            c = columns[j];
            colGroup.append(this._createCol(c));
        }

        tbody = $("<tbody />");
        for (i = 0; i < viewData.length; i++) {
            tr = $("<tr />");
            rowData = viewData[i];
            this._createRowCells(tr, rowData, i, columns, cellFilter);

            if (hasRowFilter && rowFilter.call(this, tr, rowData) === false) {
                continue;
            }
            tbody.append(tr);
        }

        bodyTable.append(colGroup);
        bodyTable.append(tbody);
    },
    _createCell: function(tagName, column) {
        var cell = this._super(tagName, column);
        if (ui.core.isNumber(column.colspan)) {
            cell.prop("colspan", column.colspan);
        }
        if (ui.core.isNumber(column.rowspan)) {
            cell.prop("rowspan", column.rowspan);
            if(column.rowspan > 1) {
                cell.css("height", column.rowspan * this.rowHeight - 1);
            }
        }
        return cell;
    },
    // 获取column对象
    _getColumn: function(index) {
        return this.dataColumns[index];
    },
    _updateScrollState: function() {
        var width,
            height, 
            scrollWidth,
            scrollHeight;
        if (!this.reportDataBody || !this.headTable) {
            return;
        }

        width = this.reportDataBody.width();
        height = this.reportDataBody.height();
        scrollWidth = this.reportDataBody[0].scrollWidth;
        scrollHeight = this.reportDataBody[0].scrollHeight;

        if (scrollHeight > height) {
            // Y轴滚动条出现
            this._headScrollColumn.show();
        } else {
            this._headScrollColumn.hide();
        }

        if(scrollWidth > width) {
            // X轴滚动条出现
            this.fixed.setBodyHeight(this.bodyHeight - ui.scrollbarWidth);
        } else {
            this.fixed.setBodyHeight(this.bodyHeight);
        }
    },
    _getColumnIndexByFormatter: function(formatter, field) {
        var i, len, columnInfo;

        if(!field) {
            field = "formatter";
        }

        // 从固定列中查找
        columnInfo = this.fixed.findColumnInfo(formatter, field);
        if(columnInfo) {
            return columnInfo;
        }
        
        if(this.dataColumns) {
            // 从数据列中查找
            for(i = 0, len = this.dataColumns.length; i < len; i++) {
                if(this.dataColumns[i][field] === formatter) {
                    return {
                        columnIndex: i,
                        columns: this.dataColumns,
                        headTable: this.headTable,
                        bodyTable: this.bodyTable
                    };
                }
            }
        }
        return {
            columnIndex: -1
        };
    },
    _addSelectedState: function(elem, selectedClass, eventData) {
        this.fixed.syncSelectedState(elem, selectedClass, true);
        this._super(elem, selectedClass, eventData);
    },
    _removeSelectedState: function(elem, selectedClass, eventData) {
        this.fixed.syncSelectedState(elem, selectedClass, false);
        this._super(elem, selectedClass, eventData);
    },
    _selectItem: function(elem, selectedClass, selectValue) {
        var container = elem,
            rowIndex, cellIndex;
        
        while(true) {
            if(container.isNodeName("div")) {
                break;
            }
            container = container.parent();
        }
        if(container.hasClass("ui-report-fixed-body")) {
            if(this.option.selection.type === "row") {
                rowIndex = elem[0].rowIndex;
                elem = $(this.bodyTable[0].tBodies[0].rows[rowIndex]);
            } else {
                rowIndex = elem.parent()[0].rowIndex;
                cellIndex = elem[0].cellIndex;
                if(container[0] === this.fixed.left.body[0]) {
                    cellIndex += this.fixed.left.offsetCellIndex;
                } else if(container[0] === this.fixed.right.body[0]) {
                    cellIndex += this.fixed.right.offsetCellIndex;
                }
                elem = $(this.bodyTable[0].tBodies[0].rows[rowIndex].cells[cellIndex]);
            }
        }
        this._super(elem, selectedClass, selectValue);
    },

    /// API
    /** 创建表头 */
    createHead: function(columns) {
        if (!Array.isArray(columns)) {
            return;
        }

        this.dataColumns = [];
        if(!Array.isArray(columns[0])) {
            columns = [columns];
        }
        this.headHeight = this.rowHeight * columns.length;
        this.fixed.reset();
        this.sorter.prepareHead();
        this._createDataHead(this.dataColumns, columns);
        this._createFixedHead(columns);
        // 删除，避免在生成数据行的时候被影响
        this.dataColumns.forEach(function(columnObj) {
            delete columnObj.rowspan;
            delete columnObj.colspan;
        });

        this.head.css("height", this.headHeight + "px");
    },
    /** 创建表体 */
    createBody: function(viewData, rowCount) {
        if(!Array.isArray(viewData)) {
            viewData = [];
        }
        
        this.clear();
        if(viewData.length === 0) {
            return;
        }
        this.option.viewData = viewData;
        
        if (this.dataColumns && Array.isArray(this.dataColumns)) {
            this._createDataBody(viewData, this.dataColumns, rowCount);
        }

        this._createFixedBody(viewData);
    },
    /** 移除行 */
    removeRowAt: function() {
        var rowIndex,
            indexes,
            i, len;

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
            rowIndex = arguments[i];
            if(ui.core.isNumber(rowIndex) && rowIndex >= 0 && rowIndex < viewData.length) {
                indexes.push(rowIndex);
            }
        }

        len = indexes.length;
        if(len === 0) {
            return;
        }

        // 降序
        indexes.sort(function(a, b) {
            return b - a;
        });
        for(i = 0; i < len; i++) {
            rowIndex = indexes[i];
            if(this.fixed.left) {
                $(this.fixed.left.bodyTable[0].rows[rowIndex]).remove();
            }
            if(this.fixed.right) {
                $(this.fixed.right.bodyTable[0].rows[rowIndex]).remove();
            }
        }
        this._super.apply(this, indexes);
    },
    /** 更新行 */
    updateRow: function(rowIndex, rowData) {
        var viewData,
            len;

        viewData = this.getViewData();
        len = viewData.length;
        if(len === 0) {
            return;
        }
        if(rowIndex < 0 || rowIndex > len) {
            return;
        }

        if(this.fixed.left) {
            this.fixed.left.updateRow(rowIndex, rowData);
        }
        if(this.fixed.right) {
            this.fixed.right.updateRow(rowIndex, rowData);
        }

        this._super(rowIndex, rowData, this.dataColumns, 
            function(el, column) {
                return column.fixed ? null : el;
            }
        );
    },
    /** 增加行 */
    addRow: function(rowData) {
        var viewData;
        if(!rowData) return;
        
        viewData = this.getViewData();
        if(viewData.length === 0) {
            this._super(rowData);
            return;
        }

        if(this.fixed.left) {
            this.fixed.left.appendRow(rowData);
        }
        if(this.fixed.right) {
            this.fixed.right.appendRow(rowData);
        }
        this._super(rowData, this.dataColumns, 
            function(el, column) {
                return column.fixed ? null : el;
            }
        );
    },
    /** 插入行 */
    insertRow: function(rowIndex, rowData) {
        var viewData,
            len;
        if(!rowData) return;

        viewData = this.getViewData();
        len = viewData.length;
        if(len === 0) {
            this.addRow(rowData);
            return;
        }
        if(rowIndex < 0) {
            rowIndex = 0;
        }
        if(rowIndex < len) {
            if(this.fixed.left) {
                this.fixed.left.insertRow(rowIndex, rowData);
            }
            if(this.fixed.right) {
                this.fixed.right.insertRow(rowIndex, rowData);
            }
        }
        this._super(rowIndex, rowData, this.dataColumns, 
            function(el, column) {
                return column.fixed ? null : el;
            }
        );
    },
    /** 移动行 */
    moveRow: function(sourceIndex, destIndex) {
        var viewData;
        
        viewData = this.getViewData();
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

        if(this.fixed.left) {
            this.fixed.left.moveRow(sourceIndex, destIndex);
        }
        if(this.fixed.right) {
            this.fixed.right.moveRow(sourceIndex, destIndex);
        }
        this._super(sourceIndex, destIndex);
    },
    /** 清空表格数据 */
    clear: function() {
        this._super();
        if(this.bodyTable) {
            delete this.bodyTable;
        }
        this.fixed.clear();
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
        }).add({
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
        }).add({
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
                "line-height": this.centerSize - 2 + "px",
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
        }).add({
            target: this.buttonPanelBackground,
            onChange: function(val) {
                this.target.css("left", val + "px");
            }
        }).add({
            target: this.buttonPanelBackground,
            onChange: function(val) {
                this.target.css({
                    "width": val + "px",
                    "height": val + "px"
                });
            }
        }).add({
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
            "line-height": this.buttonSize - 2 + "px"
        });
        this.buttonPanel.append(button.elem);
        
        this.buttonAnimator.add({
            target: button.elem,
            button: button,
            that: this,
            onChange: function(val) {
                var centerLeft = (this.button.centerLeft - this.that.centerLeft) * val / 100 + this.that.centerLeft,
                    centerTop = (this.button.centerTop - this.that.centerTop) * val / 100 + this.that.centerTop,
                    po = this.that._caculatePositionByCenter(centerLeft, centerTop);
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

// Source: src/control/tools/filter-button.js

(function($, ui) {
/* 内容过滤选择器 */
var prefix = "filter_button_",
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

ui.ctrls.define("ui.ctrls.FilterButton", {
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

        this.filterPanel = $("<div class='filter-button-panel'>");
        this.parent = this.element;
        this.radioName = prefix + (filterCount++);
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

        label = $("<label class='filter-button-item' />");
        radio = $("<input type='radio' class='filter-button-item-radio' name='" + this.radioName + "'/>");
        span = $("<span class='filter-button-item-text' />");
        label.append(radio).append(span);

        label.attr("data-index", index);
        if (index === 0) {
            label.addClass("filter-button-item-first");
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
                label.addClass("filter-button-item-hide");
            } else {
                label.removeClass("filter-button-item-hide");
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
            if(label.hasClass("filter-button-item-hide")) {
                continue;
            }
            if(!firstLabel) {
                firstLabel = label;
            } else {
                label.removeClass("filter-button-item-first");
            }
        }
        if(firstLabel) {
            firstLabel.addClass("filter-button-item-first");
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
$.fn.filterButton = function (option) {
    if (this.length === 0) {
        return null;
    }
    return ui.ctrls.FilterButton(option, this);
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
    if (this.animator.isStarted) {
        return;
    }
    var p = this.target.offset(),
        tl = {
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
        "filter": "Alpha(opacity=" + (opacity * 100) + ")"
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

        this.isShow = false;

        if (!ui.core.isNumber(this.option.width) || this.option.width <= 0) {
            this.option.width = 160;
        }
        if (!ui.core.isNumber(this.option.height) || this.option.height <= 0) {
            this.option.height = 160;
        }

        this.onDocumentMousemoveHander = onDocumentMousemove.bind(this);
        this.onDocumentMousemoveHander.guid = "hoverView" + (guid++);

        this.animator = ui.animator({
            target: this.viewPanel,
            ease: ui.AnimationStyle.easeFrom,
            onChange: function(val) {
                this.target.css({
                    "opacity": val / 100,
                    "filter": "Alpha(opacity=" + val + ")"
                });
            }
        }).add({
            target: this.viewPanel,
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css("left", val + "px");
            }
        }).add({
            target: this.viewPanel,
            ease: ui.AnimationStyle.easeTo,
            onChange: function(val) {
                this.target.css("top", val + "px");
            }
        });
        this.animator.duration = 300;
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
        var view = this,
            location,
            option;

        this.target = target;

        if (this.fire("showing") === false) return;

        //update size
        this.targetWidth = this.target.outerWidth();
        this.targetHeight = this.target.outerHeight();
        this.height = this.viewPanel.outerHeight();

        this.animator.stop();
        location = this.getLocation();
        if (this.isShow) {
            option = this.animator[0];
            if (option.current < 100) {
                option.begin = option.current;
                option.end = 100;
            } else {
                option.begin = option.end = 100;
            }
            option = this.animator[1];
            option.begin = parseFloat(this.viewPanel.css("left"));
            option.end = location.left;
            option = this.animator[2];
            option.begin = parseFloat(this.viewPanel.css("top"));
            option.end = location.top;
        } else {
            this.viewPanel.css({
                "top": location.top + "px",
                "left": location.left + "px"
            });
            option = this.animator[0];
            option.begin = 0;
            option.end = 100;
            option = this.animator[1];
            option.begin = option.end = location.left;
            option = this.animator[2];
            option.begin = option.end = location.top;
        }
        this.isShow = true;
        this.viewPanel.css("display", "block");
        this.animator.start().then(function() {
            view.addDocMousemove();
            view.fire("shown");
        });
    },
    hide: function () {
        var view = this,
            option;

        if (this.fire("hiding") === false) return;

        this.removeDocMousemove();
        this.animator.stop();

        option = this.animator[0];
        option.begin = (parseFloat(this.viewPanel.css("opacity")) || 1) * 100;
        option.end = 0;
        option = this.animator[1];
        option.begin = option.end = 0;
        option = this.animator[2];
        option.begin = option.end = 0;

        this.animator.start().then(function() {
            view.isShow = false;
            view.viewPanel.css("display", "none");
            view.fire("hidden");
        });
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

// Source: src/control/tools/progress.js

(function($, ui) {
// Progress

var circlePrototype,
    dashboardPrototype,
    barPrototype,
    svgNameSpace = "http://www.w3.org/2000/svg";

function createSVGElement(tagName) {
    return document.createElementNS(svgNameSpace, tagName);
}
function setAttribute(element, name, value) {
    if(arguments.length === 2 && name) {
        Object.keys(name).forEach(function(key) {
            element.setAttribute(key, name[key]);
        });
    } else if(arguments.length > 2) {
        element.setAttribute(name, value);
    }
}
function setStyle(element, name, value) {
    if(arguments.length === 2 && name) {
        Object.keys(name).forEach(function(key) {
            element.style[key] = name[key];
        });
    } else if(arguments.length > 2) {
        element.style[name] = value;
    }
}
function defaultTextTemplate() {
    return "<span class='ui-progress-indication' style='color:" + this.progressColor + "'>" + this.percent + "%</span>";
}

function ProgressView(option) {
    var that = this;
    Object.keys(option).forEach(function(name) {
        Object.defineProperty(that, name, {
            get: function() {
                return option[name];
            },
            set: function(value) {
                option[name] = value;
                this.update(name);
            },
            enumerable: true,
            configurable: true
        });
    });
}

circlePrototype = {
    render: function() {
        var contianer,
            svg,
            path,
            pathData,
            radius;

        contianer = $("<div class='ui-progress-container' />");
        contianer.css({
            "width": this.size + "px",
            "height": this.size + "px"
        });
        svg = $("<svg viewBox='0 0 100 100'></svg>");
        
        radius = 100 / 2 - Math.max(this.trackWidth, this.progressWidth) / 2;
        this.trackLength = 2 * Math.PI * radius;

        pathData = [
            "M 50,50 m 0,", -radius, 
            " a ", radius, ",", radius, " 0 1 1 0,", radius * 2,
            " a ", radius, ",", radius, " 0 1 1 0,", -radius * 2
        ];
        pathData = pathData.join("");

        path = createSVGElement("path");
        setAttribute(path, {
            "d": pathData,
            "fill-opacity": 0,
            "stroke": this.trackColor,
            "stroke-width": this.trackWidth
        });
        svg.append(path);

        path = createSVGElement("path");
        setAttribute(path, {
            "d": pathData,
            "fill-opacity": 0,
            "stroke-linecap": "round",
            "stroke": this.progressColor,
            "stroke-width": this.progressWidth
        });
        setStyle(path, {
            "stroke-dasharray": this.trackLength + "px," + this.trackLength + "px",
            "stroke-dashoffset": ((100 - this.percent) / 100 * this.trackLength) + "px",
            "transition": "stroke-dashoffset 0.6s ease 0s, stroke 0.6s ease"
        });
        svg.append(path);

        contianer.append(svg);

        this.textElem = $("<div class='ui-progress-text' />");
        this.updateText();
        contianer.append(this.textElem);

        this.contianer = contianer;
        this.progressElem = path;

        return contianer;
    },
    update: function(propertyName) {
        if(propertyName === "percent") {
            setStyle(
                this.progressElem, 
                "stroke-dashoffset",
                ((100 - this.percent) / 100 * this.trackLength) + "px");
            this.updateText();
        } else if(propertyName === "progressColor") {
            setAttribute( this.progressElem, "stroke", this.progressColor);
            this.updateText();
        }
    },
    updateText: function() {
        if(this.textTemplate === false) {
            return;
        }
        if(ui.core.isFunction(this.textTemplate)) {
            this.textElem.html(this.textTemplate());
        } else {
            this.textElem.html(defaultTextTemplate.call(this));
        }
    },
    show: function() {
        this.contianer.css("display", "block");
    },
    hide: function() {
        this.contianer.css("display", "none");
    }
};
dashboardPrototype = {
    render: function() {
        var contianer,
            svg,
            path,
            pathData,
            radius;

        contianer = $("<div class='ui-progress-container' />");
        contianer.css({
            "width": this.size + "px",
            "height": this.size + "px"
        });
        svg = $("<svg viewBox='0 0 100 100'></svg>");
        
        radius = 100 / 2 - Math.max(this.trackWidth, this.progressWidth) / 2;
        this.trackLength = 2 * Math.PI * radius;
        this.gap = 75;

        pathData = [
            "M 50,50 m 0,", radius, 
            " a ", radius, ",", radius, " 0 1 1 0,", -radius * 2,
            " a ", radius, ",", radius, " 0 1 1 0,", radius * 2
        ];
        pathData = pathData.join("");

        path = createSVGElement("path");
        setAttribute(path, {
            "d": pathData,
            "fill-opacity": 0,
            "stroke": this.trackColor,
            "stroke-width": this.trackWidth
        });
        setStyle(path, {
            "stroke-dasharray": this.trackLength - this.gap + "px," + this.trackLength + "px",
            "stroke-dashoffset": -this.gap / 2 + "px",
            "transition": "stroke-dashoffset .3s ease 0s, stroke-dasharray .3s ease 0s, stroke .3s"
        });
        svg.append(path);

        path = createSVGElement("path");
        setAttribute(path, {
            "d": pathData,
            "fill-opacity": 0,
            "stroke-linecap": "butt",
            "stroke": this.progressColor,
            "stroke-width": this.progressWidth
        });
        setStyle(path, {
            "stroke-dasharray": (this.percent / 100) * (this.trackLength - this.gap) + "px," + this.trackLength + "px",
            "stroke-dashoffset": -this.gap / 2 + "px",
            "transition": "stroke-dashoffset .3s ease 0s, stroke-dasharray .6s ease 0s, stroke .6s, stroke-width .06s ease .6s"
        });
        svg.append(path);

        contianer.append(svg);

        this.textElem = $("<div class='ui-progress-text' />");
        this.updateText();
        contianer.append(this.textElem);

        this.contianer = contianer;
        this.progressElem = path;

        return contianer;
    },
    update: function(propertyName) {
        if(propertyName === "percent") {
            setStyle(
                this.progressElem, 
                "stroke-dasharray",
                (percent / 100) * (this.trackLength - this.gap) + "px," + this.trackLength + "px");
            this.updateText();
        } else if(propertyName === "progressColor") {
            setAttribute( this.progressElem, "stroke", this.progressColor);
            this.updateText();
        }
    },
    updateText: circlePrototype.updateText,
    show: circlePrototype.show,
    hide: circlePrototype.hide
};
barPrototype = {
    render: function() {
        var track,
            progressBar;

        track = $("<div class='ui-progress-track' />");
        track.css({
            "width": this.size + "px",
            "height": this.progressWidth + "px"
        });

        progressBar = $("<div class='ui-progress-bar background-highlight' />");
        progressBar.css("width", this.percent + "%");
        track.append(progressBar);

        this.progressElem = progressBar;

        return track;
    },
    update: function(propertyName) {
        if(propertyName === "percent") {
            this.progressElem.css("width", this.percent + "%");
        }
    },
    show: function() {
        this.progressElem.parent().css("display", "block");
    },
    hide: function() {
        this.progressElem.parent().css("display", "none");
    }
};

function createProgressView(option) {
    var view;

    option.type = (option.type || "circle").toLowerCase();
    if(option.type === "circle") {
        ProgressView.prototype = circlePrototype;
        view = new ProgressView(option);
    } else if(option.type === "dashboard") {
        ProgressView.prototype = dashboardPrototype;
        view = new ProgressView(option);
    } else if(option.type === "bar") {
        ProgressView.prototype = barPrototype;
        view = new ProgressView(option);
    } else {
        return null;
    }

    return view;
}

ui.ctrls.define("ui.ctrls.Progress", {
    _defineOption: function() {
        return {
            // 进度条样式 circle: 进度环, dashboard: 仪表盘, bar: 进度条 
            type: "circle",
            // 宽度和高度，单位px
            size: 100,
            // 进度值 0 ~ 100
            percent: 0,
            // 进度条轨道颜色
            trackColor: "#f1f1f1",
            // 进度条轨道宽度
            trackWidth: 5,
            // 进度条颜色
            progressColor: "#ff0066",
            // 进度条宽度
            progressWidth: 6,
            // 显示进度数值
            textTemplate: defaultTextTemplate
        };
    },
    _create: function() {
        if(!ui.core.isNumber(this.option.percent)) {
            this.option.percent = 0;
        }
        this.view = createProgressView(this.option);
        if(!this.view) {
            throw new TypeError("the option.type: " + this.option.type + " is invalid.");
        }
        
        this.defineProperty("percent", this.getPercent, this.setPercent);
    },
    _render: function() {
        this.element.addClass("ui-progress");
        this.element.append(this.view.render());
    },

    // API
    /** 获取百分比 */
    getPercent: function() {
        return this.view.percent;
    },
    /** 设置百分比 */
    setPercent: function(value) {
        if(ui.core.isNumber(value)) {
            this.view.percent = value;
        }
    },
    /** 显示进度条 */
    show: function() {
        this.view.show();
    },
    /** 隐藏进度条 */
    hide: function() {
        this.view.hide();
    }
});

$.fn.progress = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Progress(option, this);
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
        extend;

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
function onMouseup(e) {
    var offset,
        lengthValue,
        arg;

    if(this.mouseDragger._isDragStart) {
        return;
    }
    arg = {};
    offset = this.track.offset();
    if(this.isHorizontal()) {
        lengthValue = this.track.width();
        arg.x = e.pageX - offset.left;
        arg.x -= parseFloat(this.thumb.css("left")) || 0;
    } else {
        lengthValue = this.track.height();
        arg.y = e.pageY - offset.top;
        arg.y -= parseFloat(this.thumb.css("top")) || 0;
    }
    arg.option = {
        lengthValue: lengthValue
    };
    moving.call(this, arg);
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

        this.onMouseupHandler = onMouseup.bind(this);
    },
    _render: function() {
        this.track = $("<div class='ui-slidebar-track' />");
        this.valuebar = $("<div class='ui-slidebar-value' />");
        this.thumb = $("<b class='ui-slidebar-thumb' />");

        this.track.append(this.valuebar);
        this.element.append(this.track).append(this.thumb);

        this._initScale();
        this._initMouseDragger();
        this.track.on("mouseup", this.onMouseupHandler);

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
        var percent,
            arg = {
                option: {}
            };
        percent = value;
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
        }).add({
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
            if (!files || files.length === 0) {
                return;
            }

            file = files[0];
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
        }).add({
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
        var that = this;

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
        // 键盘事件是否有效
        this._isKeydownEnabled = false;

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

        $(document).keydown(function(e) {
            if(!that._isKeydownEnabled) {
                return;
            }

            if(e.which === ui.keyCode.LEFT) {
                that._doPrevView();
            } else if(e.which === ui.keyCode.RIGHT) {
                that._doNextView();
            } else if(e.which === ui.keyCode.ESCAPE) {
                that.hide();
            }   
        });

        this.zoomAnimator = ui.animator({
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(top) {
                this.target.css("top", top + "px");
            }
        }).add({
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(left) {
                this.target.css("left", left + "px");
            }
        }).add({
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(width) {
                this.target.css("width", width + "px");
            }
        }).add({
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(height) {
                this.target.css("height", height + "px");
            }
        });
        this.zoomAnimator.duration = 300;
        
        if(this.prevButton || this.nextButton) {
            this.changeViewAnimator = ui.animator({
                ease: ui.AnimationStyle.easeFromTo,
                onChange: function(val) {
                    this.target.css("left", val + "px");
                }
            }).add({
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
        var img, imgInitial,
            that, option,
            left, top;

        this.target = target;
        var content = this._setImageSize();
        if (!content) {
            return;
        }

        imgInitial = {
            width: this.target.width(),
            height: this.target.height()
        };

        this._isKeydownEnabled = true;
        
        img = this.currentView.children("img");
        img.prop("src", this.target.prop("src"));
        img.css({
            "width": imgInitial.width + "px",
            "height": imgInitial.height + "px",
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

        option = this.zoomAnimator[0];
        option.target = img;
        option.begin = this.targetTop;
        option.end = top;

        option = this.zoomAnimator[1];
        option.target = img;
        option.begin = this.targetLeft;
        option.end = left;

        option = this.zoomAnimator[2];
        option.target = img;
        option.begin = imgInitial.width;
        option.end = this.width;

        option = this.zoomAnimator[3];
        option.target = img;
        option.begin = imgInitial.height;
        option.end = this.height;

        this.zoomAnimator.start().then(function() {
            that._updateButtonState();
        });
    },
    hide: function () {
        var that = this,
            img = this.currentView.children("img"),
            imgInitial, option;

        imgInitial = {
            width: this.target.width(),
            height: this.target.height()
        };

        this._isKeydownEnabled = false;

        ui.mask.close();

        option = this.zoomAnimator[0];
        option.target = img;
        option.begin = parseFloat(img.css("top"));
        option.end = this.targetTop;

        option = this.zoomAnimator[1];
        option.target = img;
        option.begin = parseFloat(img.css("left"));
        option.end = this.targetLeft;

        option = this.zoomAnimator[2];
        option.target = img;
        option.begin = parseFloat(img.css("width"));
        option.end = this.target.width();

        option = this.zoomAnimator[3];
        option.target = img;
        option.begin = parseFloat(img.css("height"));
        option.end = this.target.height();

        this.zoomAnimator.start().then(function() {
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
        this.zoomAnimator.stop();
        
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

// Source: src/viewpage/master.js

(function($, ui) {
/*
    Master 模板页
 */

function partial() {
    initToolbar.call(this);
    initSidebarManager.call(this);
    initMenu.call(this);
}

function initToolbar() {
    this.toolbar = {
        height: 40,
        extendHeight: 0
    };
}

// 初始化边栏管理器
function initSidebarManager() {
    this.sidebarManager = ui.SidebarManager();
}

function initMenu() {
    var that;
    if(this.menuConfig) {
        this.menu = ui.ctrls.Menu(this.menuConfig);
        that = this;
        this.menu.shown(function(e) {
            if(this.isExtrusion()) {
                if(this.isModern()) {
                    that.contentBodyWidth -= this.menuWidth - this.menuNarrowWidth;
                } else {
                    that.contentBodyWidth -= this.menuWidth;
                }
            }
        });
        this.menu.hidden(function(e) {
            if(this.isExtrusion()) {
                if(this.isModern()) {
                    that.contentBodyWidth += this.menuWidth - this.menuNarrowWidth;
                } else {
                    that.contentBodyWidth += this.menuWidth;
                }
            }
        });
    }
}

// 布局尺寸计算
function layoutSize() {
    var clientWidth,
        clientHeight;

    if(this.menu) {
        // 如果菜单屏蔽了布局尺寸计算，那么就不做计算了
        if(this.menu.disableResizeable) {
            return;
        }
    }

    clientWidth = document.documentElement.clientWidth;
    clientHeight = document.documentElement.clientHeight;

    if(this.head && this.head.length > 0) {
        clientHeight -= this.head.height();
    } else {
        this.head = null;
    }
    if(this.foot && this.foot.length > 0) {
        clientHeight -= this.foot.height();
    } else {
        this.foot = null;
    }
    if(this.body && this.body.length > 0) {
        this.body.css("height", clientHeight + "px");
    } else {
        this.body = null;
    }

    this.contentBodyHeight = clientHeight;
    this.contentBodyWidth = clientWidth;

    if(this.menu && this.menu.isShow()) {
        this.menu.resize(this.contentBodyWidth, this.contentBodyHeight);
    }
}

// 用户菜单生成
function userSettings() {
    var userProtrait,
        sidebarElement,
        userInfo,
        highlightPanel,
        operateList,
        htmlBuilder,
        i, len, highlight,
        sidebar,
        config,
        that;

    if(!this.userSettingsConfig) {
        return;
    }

    userProtrait = $("#user");
    if(userProtrait.length === 0) {
        return;
    }

    that = this;
    config = this.userSettingsConfig;

    sidebarElement = $("<section class='user-settings' />");
    userInfo = $("<div class='user-info' />");
    highlightPanel = $("<div class='highlight-panel' />");
    operateList = $("<div class='operate-list' />");

    // 用户信息
    htmlBuilder = [];
    htmlBuilder.push(
        "<div class='protrait-cover'>",
        "<img class='protrait-img' src='", userProtrait.children("img").prop("src"), "' alt='用户头像' /></div>",
        "<div class='user-info-panel'>",
        "<span class='user-info-text' style='font-size:18px;line-height:36px;'>", this.name, "</span><br />",
        "<span class='user-info-text'>", this.department, "</span><br />",
        "<span class='user-info-text'>", this.position, "</span>",
        "</div>",
        "<br clear='left' />"
    );
    userInfo.append(htmlBuilder.join(""));

    //初始化当前用户的主题ID
    if(!ui.theme.currentHighlight) {
        ui.theme.initHighlight();
    }
    // 高亮色
    if(Array.isArray(ui.theme.highlights)) {
        htmlBuilder = [];
        htmlBuilder.push("<h3 class='highlight-group-title font-highlight'>个性色</h3>");
        htmlBuilder.push("<div style='width:100%;height:auto'>");
        for(i = 0, len = ui.theme.highlights.length; i < len; i++) {
            highlight = ui.theme.highlights[i];
            htmlBuilder.push("<a class='highlight-item");
            if(highlight.Id === ui.theme.currentHighlight.Id) {
                htmlBuilder.push(" highlight-item-selected");
            }
            htmlBuilder.push("' href='javascript:void(0)' style='background-color:", highlight.Color, ";");
            htmlBuilder.push("' title='", highlight.Name, "' data-index='", i, "'>");
            htmlBuilder.push("<i class='fa fa-check-circle highlight-item-checker'></i>");
            htmlBuilder.push("</a>");
        }
        htmlBuilder.push("</div>");
        highlightPanel.append(htmlBuilder.join(""));
        ui.setTask(function() {
            that._currentHighlightItem = highlightPanel.find(".highlight-item-selected");
            if(that._currentHighlightItem.length === 0) {
                that._currentHighlightItem = null;
            }
        });
        highlightPanel.click(function(e) {
            var elem,
                highlight;
            elem = $(e.target);
            while(!elem.hasClass("highlight-item")) {
                if(elem.hasClass("highlight-panel")) {
                    return;
                }
                elem = elem.parent();
            }

            highlight = ui.theme.highlights[parseInt(elem.attr("data-index"), 10)];

            if(that._currentHighlightItem) {
                that._currentHighlightItem.removeClass("highlight-item-selected");
            }

            that._currentHighlightItem = elem;
            that._currentHighlightItem.addClass("highlight-item-selected");
            if(ui.core.isFunction(config.changeHighlightUrl)) {
                config.changeHighlightUrl.call(null, highlight);
            } else {
                if(config.changeHighlightUrl) {
                    ui.theme.changeHighlight(config.changeHighlightUrl, highlight);
                }
            }
        });
    }

    // 操作列表
    htmlBuilder = [];
    if(config.operateList && config.operateList.length > 0) {
        htmlBuilder.push("<ul class='operate-list-ul'>");
        config.operateList.forEach(function(item) {
            if(item.text) {
                htmlBuilder.push(
                    "<li class='operate-list-li theme-panel-hover'>",
                    "<span class='operate-text'>", item.text, "</span>",
                    "<a class='operate-list-anchor' href='", item.url, "'></a>",
                    "</li>"
                );
            }
        });
        htmlBuilder.push("</ul>");
    }
    operateList.append(htmlBuilder.join(""));

    sidebarElement
        .append(userInfo)
        .append(highlightPanel)
        .append("<hr class='horizontal' />")
        .append(operateList);

    sidebar = this.sidebarManager.setElement("userSidebar", {
        parent: "body",
        width: 240
    }, sidebarElement);
    sidebar._closeButton.css("color", "#ffffff");
    sidebarElement.before("<div class='user-settings-background title-color' />");
    sidebar.animator[0].ease = ui.AnimationStyle.easeFromTo;
    sidebar.contentAnimator = ui.animator({
        target: sidebarElement,
        begin: 100,
        end: 0,
        ease: ui.AnimationStyle.easeTo,
        onChange: function(val, elem) {
            elem.css("left", val + "%");
        }
    });
    sidebar.contentAnimator.duration = 200;
    sidebar.showing(function() {
        sidebarElement.css("display", "none");
    });
    sidebar.shown(function() {
        sidebarElement.css({
            "display": "block",
            "left": "100%"
        });
        this.contentAnimator.start();
    });
    userProtrait.click(function(e) {
        that.sidebarManager.show("userSidebar");
    });
}

var defaultConfig = {
    // 默认菜单配置
    menuConfig: {
        //style: "modern",
        style: "normal",
        menuPanel: $(".ui-menu-panel"),
        contentContainer: $(".content-container"),
        //extendMethod: "extrusion",
        //contentContainer: null,
        extendMethod: "cover",
        menuButton: $(".ui-menu-button")
    },
    // 默认用户设置配置
    userSettingsConfig: {
        // 请求高亮色css的URL
        changeHighlightUrl: "",
        // 用户操作菜单 [{text: "修改密码", url: "/Account/Password"}, {text: "退出", url: "/Account/LogOff"}]
        operateList: [
            { text: "个性化", url: "###" },
            { text: "修改密码", url: "###" }, 
            { text: "退出", url: "###" }
        ]
    }
};

var master = {
    // 用户姓名
    name: "姓名",
    // 用户所属部门
    department: "部门",
    // 用户职位
    position: "职位",
    // 虚拟目录
    contextUrl: "/",
    //当前是否为起始页
    isHomePage: false,
    //内容区域宽度
    contentBodyWidth: 0,
    //内容区域高度
    contentBodyHeight: 0,

    config: function(name, option) {
        var marginOptions,
            optionName;
        if(ui.str.isEmpty(name)) {
            return;
        }
        optionName = name + "Config";
        marginOptions = defaultConfig[optionName];
        if(marginOptions) {
            option = $.extend({}, marginOptions, option);
        }
        this[optionName] = option;
    },
    init: function(pager, configFn) {
        var global = ui.core.global();

        this.head = $("#head");
        this.body = $("#body");
        this.foot = $("#foot");

        if(ui.core.isFunction(pager)) {
            configFn = pager;
            pager = null;
        }
        if(!pager) {
            pager = {};
        }

        ui.page.ready((function (e) {
            var keys;

            if(ui.core.isFunction(configFn)) {
                configFn.call(this);
            }
            partial.call(this);
            layoutSize.call(this);
            userSettings.call(this);

            ui.page.resize((function () {
                layoutSize.call(this);
            }).bind(this), ui.eventPriority.bodyResize);
            
            if(global.pageLogic) {
                keys = Object.keys(global.pageLogic);
                keys.forEach(function(key) {
                    pager[key] = global.pageLogic[key];
                });
                global.pageLogic = pager;
            }
            this.pageInit(pager.init, pager);

            this.body.css("visibility", "visible");
        }).bind(this), ui.eventPriority.masterReady);

        return pager;
    },
    /** 初始化页面方法 */
    pageInit: function (initFn, caller) {
        caller = caller || this;
        if(!initFn) {
            return;
        }

        function callInitFn(fn) {
            if(ui.core.isFunction(fn)) {
                try {
                    fn.call(caller);
                } catch(e) {
                    ui.errorShow(ui.str.format("页面初始化时发生错误，{0}", e.message));
                }
            }
        }

        if(Array.isArray(initFn)) {
            initFn.forEach(function(f) {
                callInitFn(f);
            });
        } else if(ui.core.isPlainObject(initFn)) {
            Object.keys(initFn).forEach(function(k) {
                callInitFn(initFn[k]);
            });
        } else {
            callInitFn(initFn);
        }
    },
    /** 托管dom ready事件 */
    ready: function (fn) {
        if (ui.core.isFunction(fn)) {
            ui.page.ready(fn, ui.eventPriority.pageReady);
        }
    },
    /** 托管window resize事件 */
    resize: function (fn, autoCall) {
        if (ui.core.isFunction(fn)) {
            ui.page.resize(fn, ui.eventPriority.elementResize);
            if(autoCall !== false) {
                fn.call(ui);
            }
        }
    },
    /** 创建toolbar */
    createToolbar: function(id, extendShow) {
        if(!id) {
            return null;
        }
        return ui.Toolbar({
            toolbarId: id,
            defaultExtendShow: !!extendShow
        });
    },
    /** 获取一个有效的url */
    getUrl: function(url) {
        var char;
        if(!url) {
            return this.contextUrl;
        }
        url = url.trim();
        char = this.contextUrl.charAt(this.contextUrl.length - 1);
        if(char === "/" || char === "\\")  {
            this.contextUrl = this.contextUrl.substring(0, this.contextUrl.length - 1) + "/";
        }

        char = url.charAt(0);
        if(char === "/" || char === "\\") {
            url = url.substring(1);
        }

        return this.contextUrl + url;
    },
    /** 是否有菜单 */
    hasMenu: function() {
        return this.menu;
    }
};
ui.master = master;


})(jQuery, ui);

// Source: src/viewpage/menu.js

(function($, ui) {
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
            this.menuPanelAnimator
                .add({
                    target: this.option.contentContainer,
                    ease: ui.AnimationStyle.easeTo,
                    onChange: function (val, elem) {
                        elem.css("left", val + "px");
                    }
                })
                .add({
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
        }).add({
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


})(jQuery, ui);

// Source: src/viewpage/sidebar-manager.js

(function($, ui) {
//边栏管理器
function SidebarManager() {
    if(this instanceof SidebarManager) {
        this.initialize();
    } else {
        return new SidebarManager();
    }
}
SidebarManager.prototype = {
    constructor: SidebarManager,
    initialize: function() {
        this.sidebars = new ui.KeyArray();
        return this;
    },
    setElement: function(name, option, element) {
        if(ui.str.isEmpty(name)) {
            return;
        }
        var sidebar = null,
            that = this;
        if(this.sidebars.containsKey(name)) {
            sidebar = this.sidebars.get(name);
            if(element) {
                sidebar.set(element);
            }
        } else {
            if(!option || !option.parent) {
                throw new Error("option is null");
            }
            sidebar = ui.ctrls.SidebarBase(option, element);
            sidebar.hiding(function(e) {
                that.currentBar = null;
            });
            this.sidebars.set(name, sidebar);
        }
        return sidebar;
    },
    get: function(name) {
        if(ui.str.isEmpty(name)) {
            return null;
        }
        if(this.sidebars.containsKey(name)) {
            return this.sidebars.get(name);
        }
        return null;
    },
    remove: function(name) {
        if(ui.str.isEmpty(name)) {
            return;
        }
        if(this.sidebars.containsKey(name)) {
            this.sidebars.remove(name);
        }
    },
    isShow: function() {
        return this.currentBar && this.currentBar.isShow();
    },
    show: function(name) {
        if(ui.str.isEmpty(name)) {
            return;
        }
        var sidebar = null,
            that = this;
        if(this.sidebars.containsKey(name)) {
            sidebar = this.sidebars.get(name);
            if(sidebar.isShow()) {
                return null;
            }
            if(this.currentBar) {
                return this.currentBar.hide().then(function() {
                    that.currentBar = sidebar;
                    sidebar.show();
                });
            } else {
                this.currentBar = sidebar;
                return sidebar.show();
            }
        }
        return null;
    },
    hide: function() {
        var sidebar = this.currentBar;
        if(ui.str.isEmpty(name)) {
            sidebar = this.currentBar;
        } else if(this.sidebars.containsKey(name)) {
            sidebar = this.sidebars.get(name);
        }
        if(!sidebar.isShow()) {
            return null;
        }
        if(sidebar) {
            this.currentBar = null;
            return sidebar.hide();
        }
        return null;
    }
};

ui.SidebarManager = SidebarManager;


})(jQuery, ui);

// Source: src/viewpage/tile-view.js

(function($, ui) {
// 动态磁贴

///磁贴组
var tileSize = {
    // 小
    small: { width: 62, height: 62, iconSize: 32, countX: 1, countY: 1 },
    // 中
    medium: { width: 128, height: 128, iconSize: 64, countX: 2, countY: 2 },
    // 宽
    wide: { width: 260, height: 128, iconSize: 64, countX: 4, countY: 2 },
    // 大
    large: { width: 260, height: 260, iconSize: 64, countX: 4, countY: 4 }
};
var tileMargin = 4,
    titleHeight = 24,
    edgeDistance = 48,
    groupTitleHeight = 48;
var defineProperty = ui.ctrls.ControlBase.prototype.defineProperty,
    tileInfoProperties = ["name", "title", "icon", "link", "color"],
    tileUpdater;

tileUpdater = {
    // 翻转更新
    rotate: {
        render: function() {
            this.tileInnerBack = $("<div class='tile-inner' style='display:none'>");
            this.tileInnerBack.css("background-color", this.color);
            
            this.updatePanel = $("<div class='update-panel' />");
            this.tileInnerBack
                    .append(this.updatePanel)
                    .append("<div class='tile-title'><span class='tile-title-text'>" + this.title + "</span></div>");

            this.smallIconImg = $("<img class='tile-small-icon' />");
            this.smallIconImg.prop("src", this.icon);
            this.tileInnerBack.append(this.smallIconImg);
            
            this.tilePanel.append(this.tileInnerBack);

            this.updateStyle._createAnimator.call(this);
        },
        _createAnimator: function() {
            var setRotateFn,
                perspective;
            
            perspective = this.width * 2;
            setRotateFn = function(val) {
                var cssObj = {},
                    prefix = ["-ms-", "-moz-", "-webkit-", "-o-", ""],
                    rotateValue;
                rotateValue = "perspective(" + perspective + "px) rotateX(" + val + "deg)";
                prefix.forEach(function(p) {
                    cssObj[p + "transform"] = rotateValue;
                });
                return cssObj;
            };
            this.animator = ui.animator({
                ease: ui.AnimationStyle.easeFrom,
                begin: 0,
                end: -90,
                duration: 500,
                onChange: function(val) {
                    this.target.css(setRotateFn(val));
                }
            }).add({
                ease: function(pos) {
                    var s = 3;
                    return (pos = pos - 1) * pos * ((s + 1) * pos + s) + 1;
                },
                begin: 90,
                end: 0,
                delay: 500,
                duration: 500,
                onChange: function(val) {
                    var css = setRotateFn(val);
                    css["display"] = "block";
                    this.target.css(css);
                }
            });
            this.animator.onEnd = function() {
                this[0].target.css("display", "none");
            };
        },
        _play: function() {
            var that = this;
            if(this.link) {
                this.link.css("display", "none");
            }
            this.animator.start().then(function() {
                var temp;
                temp = that.tileInnerBack;
                that.tileInnerBack = that.tileInner;
                that.tileInner = temp;
                if(that.link) {
                    that.link.css("display", "block");
                }
            });
        },
        update: function(content) {
            var option;

            if(content) {
                this.updatePanel.html(content);
            }
            if(this.isDynamicChanged) {
                return;
            }

            option = this.animator[0];
            option.target = this.tileInner;
            option.begin = 0;
            option.end = -90;

            option = this.animator[1];
            option.target = this.tileInnerBack;
            option.begin = 90;
            option.end = 0;

            this.updateStyle._play.call(this);
        },
        restore: function() {
            var option;

            if(!this.isDynamicChanged) {
                return;
            }

            option = this.animator[0];
            option.target = this.tileInner;
            option.begin = 0;
            option.end = 90;

            option = this.animator[1];
            option.target = this.tileInnerBack;
            option.begin = -90;
            option.end = 0;

            this.updateStyle._play.call(this);
        }
    },
    // 上升更新
    moveup: {
        render: function() {
            // 动态信息面板
            this.updatePanel = $("<div class='update-panel' />");
            this.updatePanel.css("top", "100%");
            this.contentPanel.append(this.updatePanel);

            this.smallIconImg = $("<img class='tile-small-icon' />");
            this.smallIconImg.prop("src", this.icon);

            this.animator = ui.animator({
                target: this.contentPanel,
                ease: ui.AnimationStyle.easeFromTo,
                duration: 800,
                begin: 0,
                end: this.height,
                onChange: function(val) {
                    this.target.scrollTop(val);
                }
            });
        },
        update: function(content) {
            var option;

            if(content) {
                this.updatePanel
                        .html(content)
                        .append(this.smallIconImg);
            }
            if(this.isDynamicChanged) {
                return;
            }

            this.animator.stop();
            option = this.animator[0];
            option.begin = 0;
            this.animator.start();
        },
        restore: function() {
            var option;

            if(!this.isDynamicChanged) {
                return;
            }
            this.animator.stop();
            option = this.animator[0];
            if(option.target.scrollTop() === 0) {
                return;
            }
            option.begin = option.target.scrollTop();
            option.end = 0;
            this.animator.start();
        }
    }
};

// 磁贴
/*
    tileInfo: {
        name: string 磁贴名称，用于动态更新，不能重复,
        type: string 磁贴类型，small|medium|wide|large,
        color: string 磁贴颜色,
        title: string 磁贴标题,
        icon: string 磁贴图标,
        link: string 磁贴调整的URL，如果为null则点击磁贴不会发生跳转,
        interval: int 动态更新的时间间隔，单位秒,
        updateStyle: moveup|rotate
        updateFn: function 动态更新的方法 参数： tile，isLastTile
    }
 */
function Tile(tileInfo, group) {
    if(this instanceof Tile) {
        this.initialize(tileInfo, group);
    } else {
        return new Tile(tileInfo, group);
    }
}
Tile.prototype = {
    constructor: Tile,
    initialize: function(tileInfo, group) {
        var type,
            that;

        this.type = (tileInfo.type + "").toLowerCase();
        type = tileSize[this.type];
        if(!type) {
            throw new TypeError("Invalid tile type: " + this.type);
        }

        this.group = group;
        this.isDynamic = false;
        this.isActivated = false;
        this.isDynamicChanged = false;

        this.width = type.width;
        this.height = type.height;
        this.iconSize = type.iconSize;
        this.countX = type.countX;
        this.countY = type.countY;

        this.locationX = 0;
        this.locationY = 0;

        this.tileInfo = tileInfo || {};
        that = this;
        tileInfoProperties.forEach(function(propertyName) {
            var getter,
                setter,
                setterName;
            if(tileInfo.hasOwnProperty(propertyName)) {
                getter = function() {
                    return that.tileInfo[propertyName];
                };
                setterName = "_set" + propertyName.charAt(0).toUpperCase() + propertyName.substring(1);
                if(ui.core.isFunction(that[setterName])) {
                    setter = function(value) {
                        that.tileInfo[propertyName] = value;
                        that[setterName](value);
                    };
                }
                defineProperty.call(that, propertyName, getter, setter);
            }
        });

        if(this.tileInfo.updateStyle === "moveup") {
            this.updateStyle = tileUpdater.moveup;
        } else {
            this.updateStyle = tileUpdater.rotate;
        }

        this.updateFn = 
            ui.core.isFunction(this.tileInfo.updateFn) ? this.tileInfo.updateFn : null;
        if(this.updateFn) {
            this.isDynamic = true;
            this.interval = 
                ui.core.isNumber(this.tileInfo.interval) ? this.tileInfo.interval : 60;
            if(this.interval <= 0) {
                this.interval = 60;
            }
        }
        this._render();
    },
    _render: function() {
        this.tilePanel = $("<div class='ui-tile tile-" + this.type + "' />");
        
        this.tileInner = $("<div class='tile-inner' />");
        this._setColor(this.color);
        this.tilePanel.append(this.tileInner);
        
        this.iconImg = $("<img class='tile-icon' />");
        this.iconImg.prop("src", this.icon);
        this.iconImg.css({
            "width": this.iconSize + "px",
            "height": this.iconSize + "px",
            "left": (this.width - this.iconSize) / 2 + "px",
            "top": (this.height - this.iconSize) / 2 + "px"
        });

        this.smallIconImg = null;
        if(this.type !== "small") {
            // 内容面板
            this.contentPanel = $("<div class='tile-content' />");
            this.contentPanel.append(this.iconImg);

            // 磁贴标题
            this.titlePanel = $("<div class='tile-title' />");
            this._setTitle(this.title);
            
            this.tileInner
                    .append(this.contentPanel)
                    .append(this.titlePanel);
            if(this.isDynamic) {
                this.updateStyle.render.call(this);
            }
        } else {
            this.tileInner.append(this.iconImg);
        }

        this.linkAnchor = null;
        if(ui.core.isString(this.link) && this.link.length > 0) {
            this.linkAnchor = $("<a class='tile-link " + this.type + "' />");
            this.linkAnchor.prop("href", this.link);
            this.tilePanel.append(this.linkAnchor);
        }
    },
    _setColor: function(value) {
        if(value && value.length > 0) {
            this.tileInner.css("background-color", value);
        }
    },
    _setTitle: function(value) {
        if(this.titlePanel) {
            this.titlePanel.html("<span class='tile-title-text'>" + value + "</span>");
        }
    },
    /** 更新磁贴 */
    update: function(content) {
        var builder,
            i, len;
        if(ui.core.isString(content)) {
            builder = ["<p class='update-inner'><span>", content, "</span></p>"];
            builder = builder.join("");
        } else if(Array.isArray(content)) {
            builder = [];
            builder.push("<p class='update-inner'>");
            for(i = 0, len = content.length; i < len; i++) {
                builder.push("<span>", content[i], "</span>");
                if(len < len - 1) {
                    builder.push("<br />");
                }
            }
            builder.push("</p>");
            builder = builder.join("");
        } else if(ui.core.isFunction(content)) {
            builder = content.call(this);
        }

        this.isActivated = false;
        if(!this.animator.isStarted) {
            this.updateStyle.update.call(this, builder);
            this.isDynamicChanged = true;
        }
    },
    /** 恢复磁贴的初始样子 */
    restore: function() {
        if(!this.animator.isStarted) {
            this.updateStyle.restore.call(this);
            this.isDynamicChanged = false;
        }
    },
    /** 激活磁贴自动更新 */
    activate: function(needRegister) {
        this.isActivated = true;
        this.activeTime = (new Date()).getTime() + (this.interval * 1000);
        if(needRegister !== false) {
            this.group.container.activateDynamicTile(this);
        }
    }
};

function TileGroup(tileInfos, container) {
    if(this instanceof TileGroup) {
        this.initialize(tileInfos, container);
    } else {
        return new TileGroup(tileInfos, container);
    }
}
TileGroup.prototype = {
    constructor: TileGroup,
    initialize: function(tileInfos, container) {
        var arr = [],
            that = this;
        
        this.container = container;
        tileInfos.forEach(function(tileInfo) {
            var tile = new Tile(tileInfo, that);
            if(tile.isDynamic) {
                that.container.putDynamicTile(tile);
            }
            arr.push(tile);
        });
        
        ui.ArrayLike.prototype.setArray.call(this, arr);
        this.titleHeight = groupTitleHeight;
        this._render();
    },
    _render: function() {
        var i, len;

        this.groupPanel = $("<div class='ui-tile-group' />");
        this.groupPanel.css("visibility", "hidden");
        this.groupTitle = $("<div class='ui-tile-group-title' />");
        this.groupContent = $("<div class='ui-tile-group-content' />");
        this.groupPanel
                .append(this.groupTitle)
                .append(this.groupContent);

        for(i = 0, len = this.length; i < len; i++) {
            this.groupContent.append(this[i].tilePanel);
        }
    }, 
    _calculatePosition: function(size, positionBox, currentPosition, countX, countY) {
        var row, cell, i,
            x, y,
            indexX, xLen, 
            indexY, yLen,
            positionX, positionY;

        x = currentPosition.x;
        y = currentPosition.y;

        for(;;) {
            // 确保有空间
            for(i = 0; i < countY; i++) {
                if(!positionBox[y + i]) {
                    // 用最小单位来作为网格标注，以免浪费空间
                    positionBox[y + i] = new Array(size * tileSize.medium.countX);
                }
            }

            positionX = x;
            positionY = y;

            // 检查合适的空间
            for(indexY = y, yLen = y + countY; indexY < yLen; indexY++) {
                row = positionBox[indexY];
                for(;;) {
                    indexX = x;
                    xLen = x + countX;
                    if(xLen > row.length || indexX >= row.length) {
                        positionX = -1;
                        break;
                    }
                    for(; indexX < xLen; indexX++) {
                        if(row[indexX]) {
                            // 发现起始点已经被使用则位移
                            x = indexX + 1;
                            positionX = -1;
                            break;
                        }
                    }
                    if(positionX !== -1) {
                        break;
                    } else {
                        positionX = x;
                    }
                }
                if(positionX === -1) {
                    break;
                }
            }

            if(positionX !== -1 && positionY !== -1) {
                currentPosition.x = positionX;
                currentPosition.y = positionY;
                // 标记空间已经被使用
                for(indexY = positionY, yLen = positionY + countY; indexY < yLen; indexY++) {
                    row = positionBox[indexY];
                    for(indexX = positionX, xLen = positionX + countX; indexX < xLen; indexX++) {
                        row[indexX] = true;
                    }
                }
                return;
            }
        
            x = 0;
            y += 2;
        }
    },
    /** 对该磁贴组进行布局 */
    arrange: function(size) {
        var i, len,
            standard,
            smallCount, smallX, smallY, smallIndex,
            positionBox, currentPosition, tile;

        if(!ui.core.isNumber(size) || size <= 0) {
            throw new TypeError("the arguments size: " + size + " is invalid.");
        }

        standard = tileSize.medium;
        positionBox = [];
        // 本次的起始位置
        currentPosition = {
            x: 0,
            y: 0
        };
        // 每一次循环都是medium的倍数
        for(i = 0, len = this.length; i < len;) {
            tile = this[i];
            if(tile.countX <= standard.countX && tile.countY <= standard.countY) {
                this._calculatePosition(size, positionBox, currentPosition, standard.countX, standard.countY);
            } else {
                this._calculatePosition(size, positionBox, currentPosition, tile.countX, tile.countY);
            }

            if(tile.type === "small") {
                smallCount = tileSize.medium.countX * tileSize.medium.countY;
                smallX = currentPosition.x;
                smallY = currentPosition.y;
                smallIndex = 1;
                // 获取连续的小磁贴，最多获取4枚，组成一个medium磁贴
                while(smallIndex <= smallCount) {
                    tile = this[i];
                    if(!tile || tile.type !== "small") {
                        break;
                    }
                    tile.tilePanel.css({
                        top: smallY * (tileSize.small.height + tileMargin) + "px",
                        left: smallX * (tileSize.small.width + tileMargin) + "px"
                    });
                    smallIndex++;
                    if(smallX % tileSize.medium.countX === 0) {
                        smallX = currentPosition.x + 1;
                    } else {
                        smallX = currentPosition.x;
                        smallY = currentPosition.y + Math.floor(smallIndex / tileSize.medium.countX);
                    }
                    i++;
                }
                currentPosition.x += tileSize.medium.countX;
            } else {
                tile.tilePanel.css({
                    top: currentPosition.y * (tileSize.small.height + tileMargin) + "px",
                    left: currentPosition.x * (tileSize.small.width + tileMargin) + "px"
                });
                currentPosition.x += tile.countX;
                i++;
            }
        }

        len = positionBox[0].length;
        this.width = len * tileSize.small.width + (len - 1) * tileMargin;
        len = positionBox.length;
        this.height = len * tileSize.small.height + (len - 1) * tileMargin;
        
        this.groupContent.css("height", this.height + "px");
        this.height += this.titleHeight;
        this.groupPanel.css({
            "width": this.width + "px",
            "height": this.height + "px"
        });
    },
    /** 在磁贴组中加入一个新磁贴（会引起重排计算） */
    addTile: function(tileInfo) {
        var tile = new Tile(tileInfo);
        ui.ArrayLike.prototype.push.call(this, tile);
        // 重排，重新布局
        this.container._registerLayoutTask();
    },
    /** 移除一个磁贴（会引起重排计算） */
    removeTile: function(tile) {
        var i, index;

        if(tile instanceof Tile) {
            index = -1;
            for(i = this.length - 1; i >= 0; i--) {
                if(this[i] === tile) {
                    index = i;
                    break;
                }
            }
            if(index !== -1) {
                this.removeAt(index);
            }
        }
    },
    /** 按磁贴的索引移除一个磁贴（会引起重排计算） */
    removeAt: function(index) {
        if(!ui.core.isNumber(index)) {
            throw new TypeError("the arguments index is not a number.");
        }
        if(index < 0 || index >= this.length) {
            return;
        }

        ui.ArrayLike.prototype.splice.call(this, index, 1);
        // 重排，重新布局
        this.container._registerLayoutTask();
    }
};

// 磁贴容器
function TileContainer(containerPanel) {
    if(this instanceof TileContainer) {
        this.initialize(containerPanel);
    } else {
        return new TileContainer(containerPanel);
    }
}
TileContainer.prototype = {
    constructor: TileContainer,
    initialize: function(containerPanel) {
        this.groups = [];
        this.dynamicTiles = ui.KeyArray();
        this.dynamicTiles.activeCount = 0;

        this.container = ui.getJQueryElement(containerPanel);
        if(!this.container) {
            this.container = $("<div class='ui-tile-container' />");
        } else {
            this.container.addClass("ui-tile-container");
        }
        // 如果支持触摸，则添加平滑滚动的样式
        if(ui.core.isTouchAvailable()) {
            this.container.css("-webkit-overflow-scrolling", "touch");
        }
        // 容器的宽度和高度
        this.containerWidth = this.container.width();
        this.containerHeight = this.container.height();
        // 添加底部留白占位符
        this.tileMargin = $("<div class='tile-margin' />");
        this.container.append(this.tileMargin);
    },
    // 注册动态磁贴更新器
    _register: function(interval) {
        var that;
        if(this.dynamicTiles.activeCount <= 0 || this.dynamicDelayHandler) {
            return;
        }
        if(!ui.core.isNumber(interval) || interval <= 0) {
            interval = 1000;
        }
        that = this;
        this.dynamicDelayHandler = setTimeout(function() {
            var i, len,
                tile, currentTime;
            currentTime = (new Date()).getTime();
            that.dynamicDelayHandler = null;
            if(that.dynamicTiles.activeCount > 0) {
                for(i = 0, len = that.dynamicTiles.length; i < len; i++) {
                    tile = that.dynamicTiles[i];
                    if(tile.isActivated && currentTime > tile.activeTime) {
                        tile.isActivated = false;
                        that.dynamicTiles.activeCount--;
                        try {
                            tile.updateFn.call(that, tile);
                        } catch(e) {
                            ui.handleError(e);
                        }
                    }
                }
                if(that.dynamicTiles.activeCount > 0) {
                    that._register();
                }
            }
        }, interval);
    },
    _calculateGroupLayoutInfo: function(containerWidth) {
        var size,
            medium,
            groupCount,
            groupWidth;

        medium = tileSize.medium;
        size = 4;
        groupWidth = size * medium.width + (size - 1) * tileMargin;
        groupCount = Math.floor((containerWidth - edgeDistance) / (groupWidth + edgeDistance));

        if(groupCount > 1 && this.groups.length === 1) {
            groupCount = 1;
        }
        if(groupCount < 1) {
            size = Math.floor(containerWidth / (medium.width + edgeDistance));
            // 最少一行放两个磁贴
            if(size < 2) {
                size = 2;
            }
        } else if(groupCount === 1) {
            size += Math.floor((containerWidth - edgeDistance - groupWidth) / (medium.width + edgeDistance));
            if(size % 2) {
                size--;
            }
        }
        return {
            // 水平放几组
            groupCount: groupCount ? groupCount : 1,
            // 每组一行放几个标准磁贴
            groupSize: size
        };
    },
    // 注册一个异步的layout任务，避免layout多次执行
    _registerLayoutTask: function() {
        if(ui.core.isNumber(this._layoutTaskHandler)) {
            return;
        }
        this._layoutTaskHandler = ui.setMicroTask((function() {
            this._layoutTaskHandler = null;
            this.layout(this.containerWidth, this.containerHeight);
        }).bind(this));
    },
    /** 布局磁贴 */
    layout: function(containerWidth, containerHeight) {
        var groupLayoutInfo,
            groupWholeWidth,
            groupWholeHeight,
            groupEdgeDistance, 
            scrollWidth,
            group,
            groupTemp,
            i, len, j;

        if(!ui.core.isNumber(containerWidth) || containerWidth <= 0) {
            throw new TypeError("the arguments containerWidth: " + containerWidth + " is invalid.");
        }
        if(!ui.core.isNumber(containerHeight) || containerHeight <= 0) {
            throw new TypeError("the arguments containerHeight: " + containerHeight + " is invalid.");
        }

        if(this.groups.length === 0) {
            return;
        }
        this.containerWidth = containerWidth;
        this.containerHeight = containerHeight;
        groupLayoutInfo = this._calculateGroupLayoutInfo(containerWidth);
        
        // 排列每一组磁贴
        groupWholeHeight = [];
        for(i = 0, len = this.groups.length; i < len;) {
            for(j = 0; j < groupLayoutInfo.groupCount; j++) {
                if(i >= len) {
                    break;
                }
                group = this.groups[i];
                group.arrange(groupLayoutInfo.groupSize);
                if(!groupWholeHeight[j]) {
                    groupWholeHeight[j] = 0;
                }
                groupWholeHeight[j] += group.height;
                i++;
            }
        }
        // 获取高度
        j = 0;
        for(i = 0, len = groupWholeHeight.length; i < len; i++) {
            if(j < groupWholeHeight[i]) {
                j = groupWholeHeight[i];
            }
        }
        groupWholeHeight = j;
        // 设置底部留白
        groupWholeHeight += groupTitleHeight;

        scrollWidth = 0;
        if(groupWholeHeight > containerHeight) {
            scrollWidth = ui.scrollbarWidth;
        }
        groupWholeWidth = this.groups[0].width * groupLayoutInfo.groupCount + edgeDistance * (groupLayoutInfo.groupCount - 1);
        groupEdgeDistance = (containerWidth - scrollWidth - groupWholeWidth) / 2;
        
        // 排列组
        groupTemp = {};
        for(i = 0, len = this.groups.length; i < len;) {
            groupTemp.left = groupEdgeDistance;
            for(j = 0; j < groupLayoutInfo.groupCount; j++) {
                if(i >= len) {
                    break;
                }
                group = this.groups[i];
                if(groupTemp[j] === undefined) {
                    groupTemp[j] = 0;
                }
                group.left = groupTemp.left;
                group.top = groupTemp[j];
                group.groupPanel.css({
                    "left": group.left + "px",
                    "top": group.top + "px",
                    "visibility": "visible"
                });
                groupTemp.left += group.width + edgeDistance;
                groupTemp[j] += group.height;
                i++; 
            }
        }

        this.tileMargin.css("top", groupWholeHeight + "px");
    },
    /** 添加组 */
    addGroup: function(groupName, tileInfos) {
        var group;

        if(Array.isArray(groupName)) {
            tileInfos = groupName;
            groupName = null;
        }
        if(!Array.isArray(tileInfos) || tileInfos.length === 0) {
            return;
        }
        group = new TileGroup(tileInfos, this);
        if(groupName) {
            group.groupTitle.html("<span>" + groupName + "</span>");
        }
        this.groups.push(group);
        this.container.append(group.groupPanel);
    },
    /** 放置动态磁贴 */
    putDynamicTile: function(dynamicTile) {
        var tileName,
            dynamicInfo,
            interval;

        tileName = dynamicTile.name;
        if(!tileName) {
            throw new TypeError("tileName can not be null");
        }
        if(this.dynamicTiles.hasOwnProperty(tileName)) {
            throw new TypeError("The dynamicTile is exist which name is '" + tileName + "'");
        }

        this.dynamicTiles.set(tileName, dynamicTile);
        dynamicTile.activate();
    },
    /** 获取动态磁贴 */
    getDynamicTileByName: function(tileName) {
        var dynamicTile;

        dynamicTile = this.dynamicTiles.get(tileName + "");
        if(!dynamicTile) {
            return null;
        }
        return dynamicTile;
    },
    /** 再次激活动态磁贴 */
    activateDynamicTile: function(tile) {
        this.dynamicTiles.activeCount++;
        this._register(); 
    }
};

ui.TileContainer = TileContainer;


})(jQuery, ui);

// Source: src/viewpage/tiles/tile-calendar.js

(function($, ui) {
// 日期动态磁贴
var calendarStyle,
    weekChars;

if(!ui.tiles) {
    ui.tiles = {};
}

weekChars = "日一二三四五六";

function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}

function getNow() {
    var date,
        now;
    date = new Date();
    now = {
        year: date.getFullYear(),
        month: twoNumberFormatter(date.getMonth() + 1),
        day: date.getDate().toString(),
        week: "星期" + weekChars.charAt(date.getDay())
    };
    return now;
}

calendarStyle = {
    medium: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='day-text'>", now.day, "</span>");
        builder.push("<span class='week-text'>", now.week, "</span>");
        builder.push("<span class='year-month-text'>", now.year, ".", now.month, "</span>");

        tile.updatePanel.html(builder.join(""));
        if(!tile.isDynamicChanged) {
            if(tile.smallIconImg) {
                tile.smallIconImg.remove();
                tile.smallIconImg = null;
            }
            tile.update();
        }
    },
    wide: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='day-text'>", now.day, "</span>");
        builder.push("<span class='week-text'>", now.week, "</span>");
        builder.push("<span class='year-month-text'>", now.year, ".", now.month, "</span>");

        tile.updatePanel.html(builder.join(""));
        if(!tile.isDynamicChanged) {
            if(tile.smallIconImg) {
                tile.smallIconImg.remove();
                tile.smallIconImg = null;
            }
            tile.update();
        }
    },
    large: function(tile) {
        calendarStyle.wide.apply(this, arguments);
    }
};

ui.tiles.calendar = function(tile) {
    var now;
    calendarStyle[tile.type].apply(this, arguments);
    now = new Date();
    now = now.getHours() * 60 * 60 + now.getMinutes() * 60 + now.getSeconds();
    tile.interval = 86400 - now;
    tile.activate();
};


})(jQuery, ui);

// Source: src/viewpage/tiles/tile-clock.js

(function($, ui) {
// 时钟动态磁贴
var clockStyle;

if(!ui.tiles) {
    ui.tiles = {};
}

function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}

function getNow() {
    var date,
        now;
    date = new Date();
    now = {
        hour: twoNumberFormatter(date.getHours()),
        minute: twoNumberFormatter(date.getMinutes()),
        spliter: ":"
    };
    return now;
}

clockStyle = {
    medium: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='clock-hour'>", now.hour, "</span>");
        builder.push("<span class='clock-minute'>", now.minute, "</span>");

        tile.updatePanel.html(builder.join(""));

        if(!tile.isDynamicChanged) {
            tile.updatePanel
                .css({ 
                    "text-align": "center", 
                    "height": tile.height + "px"
                });
            if(tile.smallIconImg) {
                tile.smallIconImg.remove();
                tile.smallIconImg = null;
            }
            tile.update();
        }
    },
    wide: function(tile) {
        var now,
            builder;
        now = getNow();
        builder = [];

        builder.push("<span class='clock-hour'>", now.hour, "</span>");
        builder.push("<span class='clock-spliter'></span>");
        builder.push("<span class='clock-minute'>", now.minute, "</span>");

        tile.updatePanel.html(builder.join(""));

        if(!tile.isDynamicChanged) {
            tile.updatePanel
                .css({ 
                    "text-align": "center", 
                    "line-height": tile.height - 8 + "px",
                    "height": tile.height + "px"
                });
            if(tile.smallIconImg) {
                tile.smallIconImg.remove();
                tile.smallIconImg = null;
            }
            tile.update();
        }
    },
    large: function(tile) {
        clockStyle.wide.apply(this, arguments);
    }
};

ui.tiles.clock = function(tile) {
    clockStyle[tile.type].apply(this, arguments);
    tile.activate();
};


})(jQuery, ui);

// Source: src/viewpage/tiles/tile-picture.js

(function($, ui) {
// 图片动态磁贴

if(!ui.tiles) {
    ui.tiles = {};
}

ui.tiles.picture = function(tile, images) {
    var i, len,
        arr;
    if(!Array.isArray(images)) {
        return;
    }
    arr = [];
    for(i = 0, len = images.length; i < len; i++) {
        if(images[i]) {
            arr.push(images[i]);
        }
    }
    if(arr.length === 0) {
        return;
    }

    tile.pictureContext = {
        images: arr,
        currentIndex: 0,
        imageSizeCache: {},
        imageLoader: new ui.ImageLoader()
    };
    initDisplayArea(tile);
    initAnimator(tile);
    showPicture(tile, tile.pictureContext.currentImage, firstPictrue);
};

function initDisplayArea(tile) {
    var context;
    context = tile.pictureContext;

    context.currentImagePanel = $("<div class='tile-picture-container' />");
    context.currentImage = $("<img class='tile-picture' />");
    context.currentImagePanel.append(context.currentImage);

    context.nextImagePanel = $("<div class='tile-picture-container' />");
    context.nextImagePanel.css("display", "none");
    context.nextImage = $("<img class='tile-picture' />");
    context.nextImagePanel.append(context.nextImage);

    tile.updatePanel
            .append(context.currentImagePanel)
            .append(context.nextImagePanel);
}

function initAnimator(tile) {
    var context = tile.pictureContext;
    context.switchAnimator = ui.animator({
        ease: ui.AnimationStyle.easeTo,
        duration: 500,
        begin: 0,
        end: -tile.height,
        onChange: function(val) {
            this.target.css("top", val + "px");
        }
    }).add({
        ease: ui.AnimationStyle.easeTo,
        duration: 500,
        begin: tile.height,
        end: 0,
        onChange: function(val) {
            this.target.css("top", val + "px");
        }
    });
}

function showPicture(tile, currentImg, callback) {
    var imageSrc,
        context,
        setImageFn;

    context = tile.pictureContext;
    if(context.images.length === 0) {
        return;
    }
    imageSrc = context.images[context.currentIndex];
    setImageFn = function(css) {
        currentImg.css(css);
        currentImg.prop("src", imageSrc);
        callback(tile);
    };

    if(context.imageSizeCache.hasOwnProperty(imageSrc)) {
        setImageFn(context.imageSizeCache[imageSrc]);
    } else {
        context.imageLoader
                    .load(imageSrc, tile.width, tile.height, ui.ImageLoader.centerCrop)
                    .then(
                        function(loader) {
                            var css = {
                                "width": loader.displayWidth + "px",
                                "height": loader.displayHeight + "px",
                                "top": loader.marginTop + "px",
                                "left": loader.marginLeft + "px"
                            };
                            context.imageSizeCache[imageSrc] = css;
                            setImageFn(css);
                        }, 
                        function() {
                            context.images.splice(index, 1);
                            if(context.images.length > 0) {
                                moveNext(tile);
                                showPicture(tile, currentImg, callback);
                            }
                        }
                    );
    }
}

function firstPictrue(tile) {
    var context = tile.pictureContext,
        option;
    tile.update();

    setTimeout(function() {
        context.currentImage.addClass("tile-picture-play");
    }, 1000);
    setTimeout(function() {
        if(context.images.length > 1) {
            moveNext(tile);
            showPicture(tile, context.nextImage, nextPicture);
        }
    }, 10000);
}

function nextPicture(tile) {
    var temp,
        context,
        option;
    context = tile.pictureContext;

    temp = context.currentImagePanel;
    context.currentImagePanel = context.nextImagePanel;
    context.nextImagePanel = temp;
    temp = context.currentImage;
    context.currentImage = context.nextImage;
    context.nextImage = temp;

    option = context.switchAnimator[0];
    option.target = context.nextImagePanel;
    option = context.switchAnimator[1];
    option.target = context.currentImagePanel;
    option.target.css({
        "top": tile.height + "px",
        "display": "block"
    });

    context.switchAnimator.start().then(function() {
        context.nextImagePanel.css("display", "none");
        context.nextImage.removeClass("tile-picture-play");
        setTimeout(function() {
            context.currentImage.addClass("tile-picture-play");
            setTimeout(function() {
                if(context.images.length > 1) {
                    moveNext(tile);
                    showPicture(tile, context.nextImage, nextPicture);
                }
            }, 10000);
        }, 500);
    });
}

function moveNext(tile) {
    var context,
        index;

    context = tile.pictureContext;
    index = context.currentIndex + 1;
    if(index >= context.images.length) {
        index = 0;
    }
    context.currentIndex = index;
}


})(jQuery, ui);

// Source: src/viewpage/tiles/tile-weather.js

(function($, ui) {
// 天气可交互磁贴
/*
    cityName: 城市名称
    days: [
        weatherDay: {
            date: yyyy-MM-dd
            type: 天气类型
            temperature: 当前气温
            low: 低温
            high: 高温
            description: 天气描述
            windDirection: 风向
        }
    ]

    晴朗 | 多云 | 阴天 | 雨天 | 雾霾 | 雨雪 | 雪天
 */
var weatherStyle;

if(!ui.tiles) {
    ui.tiles = {};
}

function findToday(days) {
    var i, len,
        weatherDay,
        result = null,
        today;
    if(Array.isArray(days)) {
        today = new Date();
        for(i = 0, len = days.length; i < len; i++) {
            weatherDay = days[i];
            weatherDay.date = ui.date.parseJSON(weatherDay.date);
            if(!weatherDay.date) {
                continue;
            }
            if(weatherDay.date.getFullYear() === today.getFullYear() && 
                weatherDay.date.getMonth() === today.getMonth() && 
                weatherDay.date.getDate() === today.getDate()) {
                result = weatherDay;
            }
        }
    }
    return result;
}
function getDateText(date) {
    var month = date.getMonth() + 1,
        day = date.getDate();
    return (month < 10 ? "0" + month : month) + "/" + (day < 10 ? "0" + day : day);
}
function getWeekday(date) {
    var today = new Date(),
        dayCount,
        weekDayFn;
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    dayCount = parseInt((date.getTime() / 1000 / 60 / 60 / 24) - (today.getTime() / 1000 / 60 / 60 / 24), 10);
    
    weekDayFn = function(week) {
        return "周" + "日一二三四五六".charAt(week);
    };
    if(dayCount < -1) {
        return weekDayFn(date.getDay());
    } else if(dayCount < 0) {
        return "昨天";
    } else if(dayCount < 1) {
        return "今天";
    } else if(dayCount < 2) {
        return "明天";
    } else {
        return weekDayFn(date.getDay());
    }
}
function getWeatherText(type) {
    return "晴朗";
}

function createBuilder(weatherData) {
    return {
        htmlBuilder: [],
        weatherData: weatherData,
        weatherToday: findToday(weatherData.days),
        graph: graph,
        info: info,
        days: days,
        build: build
    };
}
function graph() {
    var builder = this.htmlBuilder;
    builder.push("<div class='weather-graph'>");
    _callChildBuilders.apply(this, arguments);
    builder.push("</div>");
    return this;
}
function info() {
    var builder = this.htmlBuilder;
    builder.push("<div class='weather-info'>");
    _callChildBuilders.apply(this, arguments);
    builder.push("</div>");
    return this;
}
function days() {
    var builder = this.htmlBuilder,
        weatherData = this.weatherData,
        weatherDay,
        i, len;
    if(Array.isArray(weatherData.days)) {
        builder.push("<ul class='weather-days'>");
        for(i = 0, len = weatherData.days.length; i < len; i++) {
            weatherDay = weatherData.days[i];
            builder.push("<li class='weather-day'", i === 0 ? " style='height:150px'" : "", ">");
            builder.push("<div class='weather-item'", i === 0 ? " style='opacity:1'" : "", ">");
            this.graph();
            this.weatherToday = weatherDay;
            this.info(city, temperature, description, windDirection);
            builder.push("</div>");
            builder.push("<div class='weather-handle", i === 0 ? " weather-current-handle" : "", "'>");
            builder.push("<span class='weather-text'>", 
                ui.str.format("{0}&nbsp;({1})&nbsp;{2}&nbsp;&nbsp;{3}",
                    getDateText(weatherDay.date),
                    getWeekday(weatherDay.date), 
                    ui.str.format("{0}℃ - {1}℃", weatherDay.low, weatherDay.high), 
                    getWeatherText(weatherData.type)),
                "</span>");
            builder.push("</div>");
            builder.push("</li>");
        }
        builder.push("</ul>");
    }
    return this;
}
function build() {
    return this.htmlBuilder.join("");
}
function _callChildBuilders() {
    var i, len,
        weatherDay;
    weatherDay = this.weatherToday;
    for(i = 0, len = arguments.length; i < len; i++) {
        if(ui.core.isFunction(arguments[i])) {
            arguments[i].call(this, weatherDay);
        }
    }
}
function city(weatherDay) {
    var builder = this.htmlBuilder,
        weatherData = this.weatherData;
    builder.push("<h6 class='weather-city'>", weatherData.city, "</h6>");
}
function temperature(weatherDay) {
    var builder = this.htmlBuilder;
    builder.push("<h3 class='weather-temperature'>");
    if(weatherDay.temperature) {
        builder.push("<span class='weather-curr-temp'>", weatherDay.temperature, "<span style='font-size:22px;'>℃</span>", "</span>");
    }
    builder.push("<span class='weather-low-high'>", weatherDay.low, "℃ / ", weatherDay.high, "℃", "</span>");
    builder.push("</h3>");
}
function description(weatherDay) {
    var builder = this.htmlBuilder;
    builder.push("<h6 class='weather-description'>", weatherDay.description, "</h6>");
}
function windDirection(weatherDay) {
    var builder = this.htmlBuilder;
    builder.push("<h6 class='weather-wind'>", weatherDay.windDirection, "</h6>");
}

function activeMutualTile(tile) {
    var animator,
        context,
        days;
    context = tile.weatherContext;
    context.changeDayAnimator = ui.animator({
        ease: ui.AnimationStyle.easeFromTo,
        onChange: function(val) {
            this.target.css("height", val + "px");
            this.original.css("height", this.end - (val - this.begin) + "px");
        }
    }).add({
        ease: ui.AnimationStyle.easeTo,
        onChange: function(val) {
            this.target.css("opacity", val / 100);
            this.original.css("opacity", (this.end - val) / 100);
        }
    });
    context.changeDayAnimator.duration = 500;

    days = context.parent.children(".weather-days");
    context.current = $(days.children()[0]);
    days.click(onWeatherHandleClick.bind(tile));
}
function onWeatherHandleClick(e) {
    var context,
        elem,
        item,
        nodeName,
        original,
        target,
        option;
    elem = $(e.target);
    while(!elem.hasClass("weather-handle")) {
        nodeName = elem.nodeName();
        if(nodeName === "LI" || nodeName === "UL") {
            return;
        }
        elem = elem.parent();
    }

    context = this.weatherContext;
    if(elem.parent()[0] === context.current[0]) {
        return;
    }
    if(context.changeDayAnimator.isStarted) {
        return;
    }
    
    original = context.current;
    item = original.children(".weather-item");
    item.removeClass("active-dynamic");
    original.children(".weather-handle")
        .removeClass("weather-current-handle");

    target = elem.parent();
    target.children(".weather-handle")
        .addClass("weather-current-handle");
    context.current = target;

    option = context.changeDayAnimator[0];
    option.original = original;
    option.target = target;
    option.begin = 22;
    option.end = 150;

    option = context.changeDayAnimator[1];
    option.original = item;
    option.target = target.children(".weather-item");
    option.begin = 0;
    option.end = 100;

    item = context.current.children(".weather-item");
    context.changeDayAnimator.start().then(function() {
        var op = this[0];
        item.addClass("active-dynamic");
    });
}

weatherStyle = {
    medium: function(tile, weatherData) {
        var html;
        html = createBuilder(weatherData)
            .graph()
            .info(
                temperature,
                description
            )
            .build();

        tile.weatherContext.parent.html(html);
        tile.update();
    },
    wide: function(tile, weatherData) {
        var html;
        html = createBuilder(weatherData)
            .graph()
            .info(
                city,
                temperature,
                description,
                windDirection
            )
            .build();

        tile.weatherContext.parent.html(html);
        tile.update();
    },
    large: function(tile, weatherData) {
        var html;
        html = createBuilder(weatherData)
            .days()
            .build();

        tile.weatherContext.parent.html(html);
        setTimeout(function() {
            activeMutualTile(tile);
        }, 1000);
        tile.update();
    }
};

ui.tiles.weather = function(tile, weatherData) {
    tile.weatherContext = {
        weatherData: weatherData
    };
    if(tile.tileInfo.updateStyle === "moveup") {
        tile.weatherContext.parent = tile.updatePanel;
        tile.smallIconImg.remove();
        tile.titlePanel.remove();
    } else {
        tile.weatherContext.parent = tile.tileInnerBack;
    }
    weatherStyle[tile.type].apply(this, arguments);
};


})(jQuery, ui);

// Source: src/viewpage/toolbar.js

(function($, ui) {
// toolbar
function Toolbar(option) {
    if(this instanceof Toolbar) {
        this.initialize(option);
    } else {
        return new Toolbar(option);
    }
}
Toolbar.prototype = {
    constructor: Toolbar,
    initialize: function(option) {
        if(!option) {
            option = {};
        }
        this.toolbarPanel = ui.getJQueryElement(option.toolbarId);
        if(!this.toolbarPanel) {
            return;
        }
        this.height = this.toolbarPanel.height();
        this.tools = this.toolbarPanel.children(".tools");
        this.extendPanel = this.toolbarPanel.children(".toolbar-extend");
        if(this.extendPanel.length > 0) {
            this.defaultExtendShow = !!option.defaultExtendShow;
            this._initExtendPanel();
        }
        var i = 0,
            len = this.tools.length,
            buttons;
        for(; i < len; i++) {
            buttons = $(this.tools[i]).children(".action-buttons");
            if(buttons.length > 0) {
                buttons.children(".tool-action-button").addClass("font-highlight-hover");
            }
        }
    },
    _initExtendPanel: function() {
        this.extendHeight = parseFloat(this.extendPanel.css("height"));
        this._wrapExtendPanel();
        this._createExtendAnimator();
        this._initExtendButton();
        this._initPinButton();
        if(this.defaultExtendShow) {
            this.showExtend(false);
            this.pinExtend();
        }
    },
    _wrapExtendPanel: function() {
        var position = this.toolbarPanel.css("position");
        if (position !== "absolute" && position !== "relative" && position !== "fixed") {
            this.toolbarPanel.css("position", "relative");
        }
        this.extendWrapPanel = $("<div style='position:absolute;height:0px;width:100%;display:none;overflow:hidden;'/>");
        this.extendWrapPanel.css("top", this.height + "px");
        this.extendPanel.css("top", (-this.extendHeight) + "px");
        this.extendPanel.addClass("clear");
        this.extendWrapPanel.append(this.extendPanel);
        this.toolbarPanel.append(this.extendWrapPanel);
    },
    _createExtendAnimator: function() {
        this.extendAnimator = ui.animator({
            target: this.extendPanel,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("top", val + "px");
            }
        }).add({
            target: this.extendWrapPanel,
            ease: ui.AnimationStyle.easeFromTo,
            onChange: function(val) {
                this.target.css("height", val + "px");
            }
        });
        this.extendAnimator.duration = 300;
    },
    _initExtendButton: function() {
        this.extendButton = this.toolbarPanel.find(".tool-extend-button");
        var moreTool,
            moreActions;
        if(this.extendButton.length === 0) {
            moreTool = $("<ul class='tools' style='float:right;margin-left:0px;'></ul>");
            moreActions = $("<li class='tool-item action-buttons'></li>");
            moreTool.append(moreActions);
            if(this.tools.length === 0) {
                this.extendPanel.parent().before(moreTool);
            } else {
                $(this.tools[0]).before(moreTool);
            }
            this.tools = this.toolbarPanel.children(".tools");
            this.extendButton = $("<a class='tool-action-button tool-extend-button' href='javascript:void(0)' title='更多'><i class='fa fa-ellipsis-h'></i></a>");
            moreActions.append(this.extendButton);
        }
        
        var that = this;
        this.extendButton.click(function(e) {
            if(that.isExtendShow()) {
                that.hideExtend();
            } else {
                that.showExtend();
            }
        });
    },
    _initPinButton: function() {
        this.pinButton = $("<a class='tool-extend-pin-button font-highlight-hover' href='javascript:void(0)' title='固定扩展区域'><i class='fa fa-thumb-tack'></i></a>");
        this.extendWrapPanel.append(this.pinButton);
        var that = this;
        this.pinButton.click(function(e) {
            if(that.isExtendPin()) {
                that.unpinExtend();
            } else {
                that.pinExtend();
            }
        });
    },
    isExtendShow: function() {
        return this.extendButton.hasClass("extend-show");
    },
    showExtend: function(animation) {
        var option;
        if(this.extendAnimator.isStarted) {
            return;
        }
        this.extendButton
            .addClass("extend-show")
            .removeClass("font-highlight-hover")
            .addClass("background-highlight");
        this._cssOverflow = this.toolbarPanel.css("overflow");
        this.toolbarPanel.css("overflow", "visible");

        if(animation === false) {
            this.extendWrapPanel.css({
                "height": this.extendHeight + "px",
                "display": "block"
            });
            this.extendPanel.css("top", "0px");
        } else {
            option = this.extendAnimator[0];
            option.begin = -this.extendHeight;
            option.end = 0;
            
            option = this.extendAnimator[1];
            option.begin = 0;
            option.end = this.extendHeight;

            option.target.css({
                "height": "0px",
                "display": "block"
            });
            this.extendAnimator.start();
        }
    },
    hideExtend: function(animation) {
        var option, that;
        if(this.extendAnimator.isStarted) {
            return;
        }
        this.extendButton
            .removeClass("extend-show")
            .addClass("font-highlight-hover")
            .removeClass("background-highlight");

        if(animation === false) {
            this.extendWrapPanel.css({
                "height": "0px",
                "display": "none"
            });
            this.extendPanel.css("top", -this.extendHeight + "px");
            this.toolbarPanel.css("overflow", this._cssOverflow);
        } else {
            that = this;

            option = this.extendAnimator[0];
            option.begin = 0;
            option.end = -this.extendHeight;
            
            option = this.extendAnimator[1];
            option.begin = this.extendHeight;
            option.end = 0;
            
            this.extendAnimator.start().then(function() {
                that.toolbarPanel.css("overflow", that._cssOverflow);
                option.target.css("display", "none");
            });
        }
    },
    _fireResize: function() {
        ui.page.fire("resize");
    },
    isExtendPin: function() {
        return this.pinButton.hasClass("extend-pin");  
    },
    pinExtend: function() {
        this.pinButton.addClass("extend-pin");
        this.pinButton.children("i")
            .removeClass("fa-thumb-tack")
            .addClass("fa-angle-up");
        this.extendButton.css("display", "none");
        
        this.height = this.height + this.extendHeight;
        this.toolbarPanel.css("height", this.height + "px");
        this._fireResize();
    },
    unpinExtend: function() {
        this.pinButton.removeClass("extend-pin");
        this.pinButton.children("i")
            .removeClass("fa-angle-up")
            .addClass("fa-thumb-tack");
        this.extendButton.css("display", "inline-block");
            
        this.height = this.height - this.extendHeight;
        this.toolbarPanel.css("height", this.height + "px");
        this._fireResize();
        this.hideExtend();
    }
};

ui.Toolbar = Toolbar;


})(jQuery, ui);


return ui;

});
