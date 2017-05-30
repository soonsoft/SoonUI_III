/*
    SoonUI 主命名空间声明
 */
( function( global, factory ) {

	"use strict";

	if ( typeof module === "object" && typeof module.exports === "object" ) {

		// For CommonJS and CommonJS-like environments where a proper `window`
		// is present, execute the factory and get SoonUI.
		// For environments that do not have a `window` with a `document`
		// (such as Node.js), expose a factory as module.exports.
		// This accentuates the need for the creation of a real `window`.
		// e.g. var ui = require("ui")(window);
		// See ticket #14549 for more info.
		module.exports = global.document ?
			factory( global, true ) :
			function( w ) {
				if ( !w.document ) {
					throw new Error( "SoonUI requires a window with a document" );
				}
				return factory( w );
			};
	} else {
		factory( global, true );
	}

// Pass this if window is not defined yet
} )( typeof window !== "undefined" ? window : this, function( window, noGlobal ) {

    var ui = {};
    if(noGlobal) {
        window.ui = ui;
        window.soonUI = ui;
    }
    return ui;
} );

// Source: ui/core.js

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

var core = ui.core = {};

var DOC = document;
//切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
var rword = /[^, ]+/g;
var arrayInstance = [];
var class2type = {};
var oproto = Object.prototype;
var ohasOwn = oproto.hasOwnProperty;
var W3C = window.dispatchEvent;
var root = DOC.documentElement;
var serialize = oproto.toString;
var aslice = arrayInstance.slice;
var head = DOC.head || DOC.getElementsByTagName("head")[0];
var rwindow = /^[\[]object (Window|DOMWindow|global)[\]]$/;
var isTouchAvailable = "ontouchstart" in window;

// 简单的字符串遍历方法，通过[ ]或者[,]分割字符串
core.each = function(text, fn) {
    text.replace(rword, fn);
};

// 数据类型处理
var typeStr = "Boolean Number String Function Array Date RegExp Object Error";
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
    core["is" + name] = function() {
        return core.type.apply(core, arguments) === name.toLowerCase();
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
    for ( name in obj ) {
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

// 判断浏览器是否支持canvas对象
core.isSupportCanvas = function () {
    return !!document.createElement("canvas").getContext;
};

// 判断是否支持触摸操作
core.isTouchAvailable = function() {
    return isTouchAvailable;  
};



})(jQuery, ui);

// Source: ui/ecmascript-extends.js

(function($, ui) {
// 为ECMAScript3 添加ECMAScript5的方法

// Array.prototype
// isArray
if(typeof Array.isArray !== "function") {
    Array.isArray = function(obj) {
        return ui.core.type(obj) === "array";
    };
}
// forEach
if(typeof Array.prototype.forEach !== "function") {
    Array.prototype.forEach = function(fn, caller) {
        if(typeof fn !== "function") {
            return;
        }
        var i = 0,
            len = this.length;
        for(; i < len; i++) {
            if(!(i in this)) continue;
            fn.call(caller, this[i], i, this);
        }
    };
}
// map
if(typeof Array.prototype.map !== "function") {
    Array.prototype.map = function(fn, caller) {
        if(typeof fn !== "function") {
            return;
        }
        var result = new Array(this.length);
        var i = 0,
            len = this.length;
        for(; i < len; i++) {
            if(!(i in this)) continue;
            result[i] = fn.call(caller, this[i], i, this);
        }
        return result;
    };
}
// filter
if(typeof Array.prototype.filter !== "function") {
    Array.prototype.filter = function(fn, caller) {
        if(typeof fn !== "function") {
            return;
        }
        var result = [];
        var i = 0,
            len = this.length;
        for(; i < len; i++) {
            if(!(i in this)) continue;
            if(fn.call(caller, this[i], i, this)) {
                result.push(this[i]);
            }
        }
        return result;
    };
}
// every
if(typeof Array.prototype.every !== "function") {
    Array.prototype.every = function(fn, caller) {
        if(typeof fn !== "function") {
            return;
        }
        var i = 0,
            len = this.length;
        for(; i < len; i++) {
            if(!(i in this)) continue;
            if(!fn.call(caller, this[i], i, this)) {
                return false;
            }
        }
        return true;
    };
}
// some
if(typeof Array.prototype.some !== "function") {
    Array.prototype.some = function(fn, caller) {
        if(typeof fn !== "function") {
            return;
        }
        var i = 0,
            len = this.length;
        for(; i < len; i++) {
            if(!(i in this)) continue;
            if(fn.call(caller, this[i], i, this)) {
                return true;
            }
        }
        return false;
    };
}
// reduce
if(typeof Array.prototype.reduce !== "function") {
    Array.prototype.reduce = function(fn, defaultValue) {
        if(typeof fn !== "function") {
            return;
        }
        var i = 0,
            len = this.length;
        var result;
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
if(typeof Array.prototype.reduceRight !== "function") {
    Array.prototype.reduceRight = function(fn, defaultValue) {
        if(typeof fn !== "function") {
            return;
        }
        var len = this.length,
            i = len - 1;
        var result;
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
if(typeof Array.prototype.indexOf !== "function") {
    Array.prototype.indexOf = function(value, startIndex) {
        if(!startIndex) startIndex = 0;
        var i, len = this.length,
            index = -1;
        if(len > 0) {
            while(startIndex < 0)
                startIndex = len + startIndex;
            
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
if(typeof Array.prototype.lastIndexOf !== "function") {
    Array.prototype.lastIndexOf = function(value, startIndex) {
        if(!startIndex) startIndex = 0;
        var len = this.length,
            i = len - 1, 
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

// String.prototype
// trim
if(typeof String.prototype.trim !== "function") {
    String.protocol.trim = function() {
        return ui.str.trim(this);
    };
}

// Function.prototype
// bind
if(typeof Function.prototype.bind !== "function") {
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

// Source: ui/promise.js

(function($, ui) {
// promise

//chrome36的原生Promise还多了一个defer()静态方法，允许不通过传参就能生成Promise实例，
//另还多了一个chain(onSuccess, onFail)原型方法，意义不明
//目前，firefox24, opera19也支持原生Promise(chrome32就支持了，但需要打开开关，自36起直接可用)
//本模块提供的Promise完整实现ECMA262v6 的Promise规范
//2015.3.12 支持async属性
function ok(val) {
    return val;
}
function ng(e) {
    throw e;
}

function done(onSuccess) {
    //添加成功回调
    return this.then(onSuccess, ng);
}
function fail(onFail) {
    //添加出错回调
    return this.then(ok, onFail);
}
function defer() {
    var ret = {};
    ret.promise = new this(function (resolve, reject) {
        ret.resolve = resolve;
        ret.reject = reject;
    });
    return ret;
}

var uiPromise = function (executor) {
    this._callbacks = [];
    var me = this;
    if (typeof this !== "object")
        throw new Error("Promises must be constructed via new");
    if (typeof executor !== "function")
        throw new Error("not a function");

    executor(function (value) {
        _resolve(me, value);
    }, function (reason) {
        _reject(me, reason);
    });
};
function fireCallbacks(promise, fn) {
    var isAsync;
    if (ui.core.type(promise.async) === "boolean") {
        isAsync = promise.async;
    } else {
        isAsync = promise.async = true;
    }
    if (isAsync) {
        window.setTimeout(fn, 0);
    } else {
        fn();
    }
}
//返回一个已经处于`resolved`状态的Promise对象
uiPromise.resolve = function (value) {
    return new uiPromise(function (resolve) {
        resolve(value);
    });
};
//返回一个已经处于`rejected`状态的Promise对象
uiPromise.reject = function (reason) {
    return new uiPromise(function (resolve, reject) {
        reject(reason);
    });
};

uiPromise.prototype = {
    //一个Promise对象一共有3个状态：
    //- `pending`：还处在等待状态，并没有明确最终结果
    //- `resolved`：任务已经完成，处在成功状态
    //- `rejected`：任务已经完成，处在失败状态
    constructor: uiPromise,
    _state: "pending",
    _fired: false, //判定是否已经被触发
    _fire: function (onSuccess, onFail) {
        if (this._state === "rejected") {
            if (typeof onFail === "function") {
                onFail(this._value);
            } else {
                throw this._value;
            }
        } else {
            if (typeof onSuccess === "function") {
                onSuccess(this._value);
            }
        }
    },
    _then: function (onSuccess, onFail) {
        if (this._fired) {//在已有Promise上添加回调
            var me = this;
            fireCallbacks(me, function () {
                me._fire(onSuccess, onFail);
            });
        } else {
            this._callbacks.push({onSuccess: onSuccess, onFail: onFail});
        }
    },
    then: function (onSuccess, onFail) {
        onSuccess = typeof onSuccess === "function" ? onSuccess : ok;
        onFail = typeof onFail === "function" ? onFail : ng;
        //在新的Promise上添加回调
        var me = this;
        var nextPromise = new uiPromise(function (resolve, reject) {
            me._then(function (value) {
                try {
                    value = onSuccess(value);
                } catch (e) {
                    // https://promisesaplus.com/#point-55
                    reject(e);
                    return;
                }
                resolve(value);
            }, function (value) {
                try {
                    value = onFail(value);
                } catch (e) {
                    reject(e);
                    return;
                }
                resolve(value);
            });
        });
        for (var i in me) {
            if (!personal[i]) {
                nextPromise[i] = me[i];
            }
        }
        return nextPromise;
    },
    "done": done,
    "catch": fail,
    "fail": fail
};
var personal = {
    _state: 1,
    _fired: 1,
    _value: 1,
    _callbacks: 1
};
function _resolve(promise, value) {
    //触发成功回调
    if (promise._state !== "pending")
        return;
    if (value && typeof value.then === "function") {
        //thenable对象使用then，Promise实例使用_then
        var method = value instanceof uiPromise ? "_then" : "then";
        value[method](function (val) {
            _transmit(promise, val, true);
        }, function (reason) {
            _transmit(promise, reason, false);
        });
    } else {
        _transmit(promise, value, true);
    }
}
function _reject(promise, value) {
    //触发失败回调
    if (promise._state !== "pending")
        return;
    _transmit(promise, value, false);
}
//改变Promise的_fired值，并保持用户传参，触发所有回调
function _transmit(promise, value, isResolved) {
    promise._fired = true;
    promise._value = value;
    promise._state = isResolved ? "fulfilled" : "rejected";
    fireCallbacks(promise, function () {
        var data;
        for(var i = 0, len = promise._callbacks.length; i < len; i++) {
            data = promise._callbacks[i];
            promise._fire(data.onSuccess, data.onFail);
        }
    });
}
function _some(any, iterable) {
    iterable = ui.core.type(iterable) === "array" ? iterable : [];
    var n = 0, result = [], end;
    return new uiPromise(function (resolve, reject) {
        // 空数组直接resolve
        if (!iterable.length)
            resolve();
        function loop(a, index) {
            a.then(function (ret) {
                if (!end) {
                    result[index] = ret;
                    //保证回调的顺序
                    n++;
                    if (any || n >= iterable.length) {
                        resolve(any ? ret : result);
                        end = true;
                    }
                }
            }, function (e) {
                end = true;
                reject(e);
            });
        }
        for (var i = 0, l = iterable.length; i < l; i++) {
            loop(iterable[i], i);
        }
    });
}

uiPromise.all = function (iterable) {
    return _some(false, iterable);
};
uiPromise.race = function (iterable) {
    return _some(true, iterable);
};
uiPromise.defer = defer;

ui.Promise = uiPromise;
var nativePromise = window.Promise;
if (/native code/.test(nativePromise)) {
    nativePromise.prototype.done = done;
    nativePromise.prototype.fail = fail;
    if (!nativePromise.defer) { 
        //chrome实现的私有方法
        nativePromise.defer = defer;
    }
}
return window.Promise = nativePromise || uiPromise;

})(jQuery, ui);

// Source: ui/array-faker.js

(function($, ui) {
// Array Faker

var arrayInstance = [];
function ArrayFaker () {
    this.setArray(this.makeArray(arguments));
    return this;
}
ArrayFaker.prototype = {
    constructor: ArrayFaker,
    isArray: function (obj) {
        return ui.core.isArray(obj);
    },
    setArray: function (elems) {
        this.length = 0;
        //设置length以及重排索引
        Array.prototype.push.apply(this, elems);
        return this;
    },
    makeArray: function (arr) {
        //把传入参数变成数组
        var ret = [];
        if (arr !== null) {
            var i = arr.length;
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
    inArray: function (elem, array) {
        for (var i = 0, length = array.length; i < length; i++) {
            // Use === because on IE, window == document
            if (array[i] === elem) {
                return i;
            }
        }
        return -1;
    },
    index: function (el) { 
        return this.inArray(el, this); 
    },
    toString: function () {
        //返回一个字符串
        var array = Array.prototype.slice.call(this);
        return array.toString();
    },
    valueOf: function () {
        return Array.prototype.slice.call(this);
    },
    shift: arrayInstance.shift,
    push: arrayInstance.push,
    sort: arrayInstance.sort,
    pop: arrayInstance.pop,
    splice: arrayInstance.splice,
    concat: arrayInstance.concat,
    slice: arrayInstance.slice,
    constructor: ui.ArrayFaker,
    get: function (num) {
        return num === undefined ? Array.prototype.slice.call(this) : this[num];
    }
};

ui.ArrayFaker = ArrayFaker;


})(jQuery, ui);

// Source: ui/keyarray.js

(function($, ui) {
/*
    字典数组，同时支持索引和hash访问数组元素
 */
var arrayInstance = [];
var rebuildIndex = function (obj, key) {
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
};

function KeyArray () {
    if(this instanceof KeyArray) {
        this.initialize();
    } else {
        return new KeyArray();
    }
};
KeyArray.prototype = $.extend({
    constructor: KeyArray
}, ui.ArrayFaker.prototype);
delete KeyArray.prototype.shift;
delete KeyArray.prototype.push;
delete KeyArray.prototype.sort;
delete KeyArray.prototype.pop;
delete KeyArray.prototype.splice;
delete KeyArray.prototype.concat;
delete KeyArray.prototype.slice;

// 初始化
KeyArray.prototype.initialize = function() {
    ui.ArrayFaker.apply(this);
    this._keys = {};
};
// 判断是否存在key
KeyArray.prototype.containsKey = function (key) {
    return this._keys.hasOwnProperty(key);
};
KeyArray.prototype.containsValue = function(value) {
    var i, len = this.length;
    for(i = 0; i < len; i++) {
        if(this[i] === value) {
            return true;
        }
    }
    return false;
};
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
KeyArray.prototype.get = function (key) {
    if (this.containsKey(key)) {
        return this[this._keys[key]];
    } else {
        return null;
    }
};
KeyArray.prototype.remove = function (key) {
    var index;
    if (this.containsKey(key)) {
        index = this._keys[key];
        arrayInstance.splice.apply(this, [index, 1]);
        rebuildIndex(this._keys, key);
        delete this._keys[key];
    }
};
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
KeyArray.prototype.clear = function () {
    arrayInstance.splice.apply(this, [0, this.length]);
    this._keys = {};
};
KeyArray.prototype.toArray = function () {
    var arr = [];
    var i = this.length - 1;
    for (; i >= 0 ; i--) {
        arr[i] = this[i];
    }
    return arr;
};

ui.KeyArray = KeyArray;


})(jQuery, ui);

// Source: ui/introsort.js

(function($, ui) {
// sorter introsort
var core = ui.core,
    size_threshold = 16;
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
        this.comparer = function (a, b) {
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
        };
    },
    sort: function (arr) {
        if (ui.core.isFunction(arr)) {
            this.comparer = arr;
        } else {
            this.keys = arr;
            if (ui.core.isFunction(arguments[1])) {
                this.comparer = arguments[1];
            }
        }
        if (Array.isArray(this.keys)) {
            return;
        }
        if (this.keys.length < 2) {
            return;
        }
        if (Array.isArray(this.items)) {
            this.items = null;
        }
        this._introsort(0, this.keys.length - 1, 2 * this._floorLog2(this.keys.length));
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
            }
            else {
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

// Source: ui/util.js

(function($, ui) {
// util

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
ui.mask = {
    maskId: "#ui_mask_rectangle",
    isOpen: function() {
        return $(this.maskId).css("display") === "block";
    },
    open: function() {
        var mask = $(this.maskId),
            body = $(document.body),
            offset;
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
                top: "0px",
                left: "0px",
                width: root.clientWidth + "px",
                height: root.clientHeight + "px"
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
            this._mask_animator.start().done(function() {
                mask.css("display", "none");
            });
        } else {
            mask.css("display", "none");
        }
    }
};


})(jQuery, ui);

// Source: ui/util-string.js

(function($, ui) {
// string util

var textEmpty = "";
// text format
var textFormatReg = /\\?\{([^{}]+)\}/gm;
var textFormatReplaceFn = function (match, name) {
    if (match.charAt(0) == '\\')
        return match.slice(1);
    var index = Number(name);
    if (index >= 0)
        return array[index];
    if (params && params[name])
        return params[name];
    return '';
};
// dateFormat
var defaultWeekFormatFn = function() {
    var name = "日一二三四五六";
    return "周" + name.charAt(week);
};
// base64
var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var _utf8_encode = function (string) {
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
};
var _utf8_decode = function (utftext) {
    var string = textEmpty;
    var i = 0;
    var c = 0, 
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
};

ui.str = {
    /** 空字符串 */
    empty: textEmpty,
    /** 字符串遍历，通过[ ]和[,]分割 */
    each: ui.core.each,
    /** 去空格 */
    trim: function (str) {
        if (!ui.core.isString(str)) {
            return str;
        }
        var c = arguments[1];
        if (!c) {
            c = "\\s";
        }
        var r = new RegExp("(^" + c + "*)|(" + c + "*$)", "g");
        return str.replace(r, this.empty);
    },
    /** 去掉左边空格 */
    lTrim: function (str) {
        if (!ui.core.isString(str)) {
            return str;
        }
        var c = arguments[1];
        if (!c) {
            c = "\\s";
        }
        var r = new RegExp("(^" + c + "*)", "g");
        return str.replace(r, this.empty);
    },
    /** 去掉右边空格 */
    rTrim: function (str) {
        if (!ui.core.isString(str)) {
            return str;
        }
        var c = arguments[1];
        if (!c) {
            c = "\\s";
        }
        var r = new RegExp("(" + c + "*$)", "g");
        return str.replace(r, this.empty);
    },
    /** 判断是否为空 null, undefined, empty return true */
    isEmpty: function (str) {
        return str === undefined 
            || str === null
            || (ui.core.isString(str) && str.length === 0);
    },
    /** 判断是否全是空白 null, undefined, empty, blank return true */
    isBlank: function(str) {
        var i;
        if(str === undefined || str === null) {
            return true;
        }
        if(ui.core.isString(str)) {
            for(i = 0; i < str.length; i++) {
                if(str.charCodeAt(i) != 32) {
                    return false;
                }
            }
            return true;
        }
    },
    //格式化字符串，Format("He{0}{1}o", "l", "l") 返回 Hello
    textFormat: function (str, params) {
        var Arr_slice = Array.prototype.slice;
        var array = Arr_slice.call(arguments, 1);
        return str.replace(textFormatReg, textFormatReplaceFn);
    },
    //格式化日期: y|Y 年; M 月; d|D 日; H|h 小时; m 分; S|s 秒; ms|MS 毫秒; wk|WK 星期;
    dateFormat: function (date, format, weekFormat) {
        if (!date) {
            return ui.str.empty;
        } else if (typeof date === "string") {
            format = date;
            date = new Date();
        }
        if (!$.isFunction(weekFormat))
            weekFormat = defaultWeekFormatFn;

        var zero = "0";
        format = format.replace(/y+/i, function ($1) {
            var year = date.getFullYear() + "";
            return year.substring(year.length - $1.length);
        });
        var tempVal = null;
        var formatFunc = function ($1) {
            return ($1.length > 1 && tempVal < 10) ? zero + tempVal : tempVal;
        };
        tempVal = date.getMonth() + 1;
        format = format.replace(/M+/, formatFunc);
        tempVal = date.getDate();
        format = format.replace(/d+/i, formatFunc);
        tempVal = date.getHours();
        format = format.replace(/H+/, formatFunc);
        format = format.replace(/h+/, function ($1) {
            var ampmHour = tempVal % 12 || 12;
            return ((tempVal > 12) ? "PM" : "AM") + (($1.length > 1 && ampmHour < 10) ? zero + ampmHour : ampmHour);
        });
        tempVal = date.getMinutes();
        format = format.replace(/m+/, formatFunc);
        tempVal = date.getSeconds();
        format = format.replace(/S+/i, formatFunc);
        format = format.replace(/ms/i, date.getMilliseconds());
        format = format.replace(/wk/i, weekFormat(date.getDay()));
        return format;
    },
    convertDate: function (dateStr, format) {
        var year = 1970,
            month = 0,
            day = 1,
            hour = 0,
            minute = 0,
            second = 0,
            ms = 0;
        var result = /y+/i.exec(format);
        if (result !== null) {
            year = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
        }
        result = /M+/.exec(format);
        if (result !== null) {
            month = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10) - 1;
        }
        result = /d+/i.exec(format);
        if (result !== null) {
            day = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
        }
        result = /H+/.exec(format);
        if (result !== null) {
            hour = parseInt(dateStr.substring(result.index, result.index + result.index + result[0].length), 10);
        }
        result = /h+/.exec(format);
        if (result !== null) {
            hour = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
            if (dateStr.substring(result.index - 2, 2) === "PM")
                hour += 12;
        }
        result = /m+/.exec(format);
        if (result !== null) {
            minute = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
        }
        result = /S+/i.exec(format);
        if (result !== null) {
            second = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
        }
        result = /ms/i.exec(format);
        if (result !== null) {
            ms = parseInt(dateStr.substring(result.index, result.index + result[0].length), 10);
        }
        return new Date(year, month, day, hour, minute, second, ms);
    },
    jsonnetToDate: function (jsonDate) {
        if (!jsonDate) {
            return null;
        }
        var val = /Date\(([^)]+)\)/.exec(jsonDate)[1];
        return new Date(Number(val));
    },
    jsonToDate: function (jsonDate) {
        var date = new Date(jsonDate);
        var val = null;
        if (isNaN(date)) {
            val = /Date\(([^)]+)\)/.exec(jsonDate);
            if (val != null) {
                date = new Date(Number(val[1]));
            } else {
                date = this.convertDate(jsonDate, "yyyy-MM-ddTHH:mm:ss");
            }
        }
        return date;
    },
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
                this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
        }
        return output;
    },
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
    htmlEncode: function(str) {
        if (this.isNullOrEmpty(str)) {
            return this.empty;
        }
        return $("<span />").append(document.createTextNode(str)).html();
    },
    htmlDecode: function(str) {
        if (this.isNullOrEmpty(str)) {
            return this.empty;
        }
        return $("<span />").html(str).text();
    },
    numberFormatScale: function (num, zeroCount) {
        if (isNaN(num))
            return null;
        if (isNaN(zeroCount))
            zeroCount = 2;
        num = ui.fixedNumber(num, zeroCount);
        var integerText = num + ui.str.empty;
        var scaleText;
        var index = integerText.indexOf(".");
        if (index < 0) {
            scaleText = ui.str.empty;
        } else {
            scaleText = integerText.substring(index + 1);
            integerText = integerText.substring(0, index);
        }
        var len = zeroCount - scaleText.length;
        var i;
        for (i = 0; i < len; i++) {
            scaleText += "0";
        }
        return integerText + "." + scaleText;
    },
    integerFormat: function (num, count) {
        num = parseInt(num, 10);
        if (isNaN(num))
            return NaN;
        if (isNaN(count))
            count = 8;
        var numText = num + ui.str.empty;
        var len = count - numText.length;
        var i;
        for (i = 0; i < len; i++) {
            numText = "0" + numText;
        }
        return numText;
    },
    formatMoney: function (value, symbol) {
        if (!symbol) {
            symbol = "￥";
        }
        var content = ui.str.numberFormatScale(value, 2);
        if (!content) {
            return content;
        }
        var arr = content.split(".");
        content = arr[0];
        var index = 0;
        var result = [];
        for (var i = content.length - 1; i >= 0; i--) {
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
        return result.join(ui.str.empty);
    }
};


})(jQuery, ui);

// Source: ui/util-object.js

(function($, ui) {
//object

function _ignore(ignore) {
    var ignoreType = ui.core.type(ignore);
    var prefix;
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
    //浅克隆
    clone: function (source, ignore) {
        var result,
            type = ui.core.type(source);
        ignore = _ignore(ignore);
        
        if(type === "object") {
            result = {};
        } else if(type === "array") {
            result = [];
        } else {
            return source;
        }
        for (var key in source) {
            if(ignore.call(key)) {
                continue;
            }
            result[key] = source[key];
        }
        return result;
    },
    //深克隆对象
    deepClone: function (source, ignore) {
        var result,
            type = ui.core.type(source);
        if(type === "object") {
            result = {};
        } else if(type === "array") {
            result = [];
        } else {
            return source;
        }
        
        ignore = _ignore(ignore);
        var copy = null;
        for (var key in source) {
            if(ignore.call(key)) {
                continue;
            }
            copy = source[key];
            if (result === copy)
                continue;
            type = ui.core.type(copy);
            if (type === "object" || type === "array") {
                result[key] = arguments.callee.call(this, copy, ignore);
            } else {
                result[key] = copy;
            }
        }
        return result;
    }
};

})(jQuery, ui);

// Source: ui/util-url.js

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
                value = ui.core.isFunction(value) 
                            ? value() 
                            : (value === null ? "" : value);
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

// Source: ui/util-structure-transform.js

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
            throw new TypeError(ui.str.textFormat("the {0} is not String or Function.", fieldName));
        }
    }
    return field;
}

ui.trans = {
    // Array结构转Tree结构
    listToTree: function (list, parentField, valueField, childrenField) {
        if (!$.isArray(list) || list.length === 0)
            return null;
        var tempList = {}, temp, root,
            item, i, len, id, pid,
            flagField = flagFieldKey,
            key;

        parentField = getFieldMethod(parentField, "parentField");
        valueField = getFieldMethod(valueField, "valueField");
        childrenField = ui.core.isString(childrenField) 
                    ? childrenField 
                    : "children";

        for (i = 0, len = list.length; i < len; i++) {
            item = list[i];
            if(item === null || item === undefined) {
                continue;
            }
            pid = parentField.call(item) + "" || "__";
            if (tempList.hasOwnProperty(pid)) {
                temp = tempList[pid];
                temp[childrenField].push(item);
            } else {
                temp = {};
                temp[childrenField] = [];
                temp[childrenField].push(item);
                tempList[pid] = temp;
            }
            id = valueField.call(item) + "";
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
        for (key in tempList) {
            if(tempList.hasOwnProperty(key)) {
                temp = tempList[key];
                if (!temp.hasOwnProperty(flagField)) {
                    root = temp;
                    break;
                }
            }
        }
        return root[childrenField];
    },
    // Array结构转分组结构(两级树结构)
    listToGroup: function(list, groupField, createGroupItemFn, childrenField) {
        if (!$.isArray(list) || list.length === 0)
            return null;

        var temp = {},
            i, len, key, 
            groupKey, item, result;
        
        groupKey = ui.core.isString(groupField) ? groupField : "text";
        groupField = getFieldMethod(groupField, "groupField");
        childrenField = ui.core.isString(childrenField) 
                    ? childrenField 
                    : "children";
        
        for (i = 0, len = list.length; i < len; i++) {
            item = list[i];
            if(item === null || item === undefined) {
                continue;
            }
            key = groupField.call(item) + "" || "__";
            if(!temp.hasOwnProperty(key)) {
                temp[key] = {};
                temp[key][groupKey] = key;
                temp[key][childrenField] = [];
                if(ui.core.isFunction(createGroupItemFn)) {
                    createGroupItemFn.call(this, item, key);
                }
            }
            temp[key][childrenField].push(item);
        }

        result = [];
        for(key in temp) {
            if(temp.hasOwnProperty(key)) {
                result.push(temp[key]);
            }
        }
        return result;
    }
};


})(jQuery, ui);

// Source: ui/animation.js

(function($, ui) {
/*
    animation javascript 动画引擎
 */

//初始化动画播放器
var prefix = ["ms", "moz", "webkit", "o"],
    i = 0;
var requestAnimationFrame,
    cancelAnimationFrame;
for (; i < prefix.length && !requestAnimationFrame; i++) {
    requestAnimationFrame = window[prefix[i] + "RequestAnimationFrame"];
    cancelAnimationFrame = window[prefix[i] + "CancelAnimationFrame"] || window[prefix[i] + "CancelRequestAnimationFrame"];
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

//动画效果
ui.AnimationStyle = {
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
var Animator = function () {
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
};
Animator.prototype = new ui.ArrayFaker();
Animator.prototype.addTarget = function (target, option) {
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
Animator.prototype.removeTarget = function (option) {
    var index = -1;
    if (ui.core.type(option) !== "number") {
        for (var i = 0; i < this.length; i++) {
            if (this[i] === option) {
                index = i;
                break;
            }
        }
    } else {
        index = option;
    }
    if (index < 0) {
        return;
    }
    this.splice(index, 1);
};
Animator.prototype.doAnimation = function () {
    if (this.length === 0) {
        return;
    }

    this.isStarted = true;
    var duration = parseInt(this.duration, 10) || 500,
        fps = parseInt(this.fps, 10) || 60,
        that = this,
        i = 0,
        len = this.length;
    //开始执行的时间
    var startTime = new Date().getTime();
    this.stopHandle = null;
    (function () {
        var option = null;
        that.stopHandle = requestAnimationFrame(function () {
            //当前帧开始的时间
            var newTime = new Date().getTime(),
                //逝去时间
                timestamp = newTime - startTime,
                delta;
            for (i = 0; i < len; i++) {
                option = that[i];
                if (option.disabled) {
                    continue;
                }
                try {
                    delta = option.ease(timestamp / duration);
                    option.current = Math.ceil(option.begin + delta * option.change);
                    option.onChange(option.current, option.target, that);
                } catch(e) {
                    that.promise._reject(e);
                }
            }
            if (duration <= timestamp) {
                for (i = 0; i < len; i++) {
                    option = that[i];
                    try {
                        option.onChange(option.end, option.target, that);
                    } catch(e) {
                        that.promise._reject(e);
                    }
                }

                that.isStarted = false;
                that.stopHandle = null;
                if ($.isFunction(that.onEnd)) {
                    that.onEnd.call(that);
                }
            } else {
                that.stopHandle = requestAnimationFrame(arguments.callee);
            }
        }, 1000 / fps);
    })();
};
Animator.prototype._prepare = function () {
    var i = 0,
        option = null,
        disabledCount = 0;
    for (; i < this.length; i++) {
        option = this[i];
        if (!option) {
            this.splice(i, 1);
            i--;
        }

        option.disabled = false;
        //开始位置
        option.begin = option.begin || 0;
        //结束位置
        option.end = option.end || 0;
        //变化量
        option.change = option.end - option.begin;
        //当前值
        option.current = option.begin;
        if (option.change === 0) {
            option.disabled = true;
            disabledCount++;
            continue;
        }
        //必须指定，基本上对top,left,width,height这个属性进行设置
        option.onChange = option.onChange || ui.core.noop;
        //要使用的缓动公式
        option.ease = option.ease || ui.AnimationStyle.easeFromTo;
    }
    return this.length == disabledCount;
};
Animator.prototype.start = function (duration) {
    var flag,
        fn,
        that = this;
    this.onBegin = $.isFunction(this.onBegin) ? this.onBegin : ui.core.noop;
    this.onEnd = $.isFunction(this.onEnd) ? this.onEnd : ui.core.noop;
    
    var _resolve, _reject;
    var promise = new Promise(function(resolve, reject) {
        _resolve = resolve;
        _reject = reject;
    });
    this.promise = promise;
    this.promise._resolve = _resolve;
    this.promise._reject = _reject;

    if (!this.isStarted) {
        if(ui.core.type(duration) === "number" && duration > 0) {
            this.duration = duration;
        }
        flag = this._prepare();
        this.onBegin.call(this);

        if (flag) {
            setTimeout(function() {
                that.onEnd.call(that);
                promise._resolve(that);
            });
        } else {
            fn = this.onEnd;
            this.onEnd = function () {
                this.onEnd = fn;
                fn.call(this);
                promise._resolve(this);
            };
            this.doAnimation();
        }
    }
    return promise;
};
Animator.prototype.stop = function () {
    cancelAnimationFrame(this.stopHandle);
    this.isStarted = false;
    this.stopHandle = null;
    
    if(this.promise) {
        this.promise = null;
    }
};

ui.animator = function (target, option) {
    var list = new Animator();
    list.addTarget.apply(list, arguments);
    return list;
};


})(jQuery, ui);

// Source: ui/custom-event.js

(function($, ui) {
// custom event
function CustomEvent (target) {
    this._listeners = {};
    this._eventTarget = target || this;
}
CustomEvent.prototype = {
    constructor: CustomEvent,
    addEventListener: function (type, callback, scope, priority) {
        if (isFinite(scope)) {
            priority = scope;
            scope = null;
        }
        priority = priority || 0;
        var list = this._listeners[type], index = 0, listener, i;
        if (!list) {
            this._listeners[type] = list = [];
        }
        i = list.length;
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
            scope: scope,
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
        var list = this._listeners[type];
        if (list && list.length > 0) {
            var target = this._eventTarget,
                args = Array.apply([], arguments),
                i = list.length,
                listener;
            var result;
            while (--i > -1) {
                listener = list[i];
                target = listener.scope || target;
                args[0] = {
                    type: type,
                    target: target
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
        if (!target) {
            target = this._eventTarget;
        }
        if (!events) {
            events = target.events;
        }
        if (!Array.isArray(events) || events.length === 0) {
            return;
        }

        var that = this;
        target.on = function (type, callback, scope, priority) {
            that.addEventListener(type, callback, scope, priority);
        };
        target.off = function (type, callback) {
            that.removeEventListener(type, callback);
        };
        target.fire = function (type) {
            var args = Array.apply([], arguments);
            return that.dispatchEvent.apply(that, args);
        };

        var i = 0, 
            len = events.length, 
            eventName;
        for (; i < len; i++) {
            eventName = events[i];
            target[eventName] = this._createEventFunction(eventName, target);
        }
    },
    _createEventFunction: function (type, target) {
        var eventName = type;
        return function (callback, scope, priority) {
            if (arguments.length > 0) {
                target.on(eventName, callback, scope, priority);
            }
        };
    }
};

ui.CustomEvent = CustomEvent;


})(jQuery, ui);

// Source: ui/json.js

(function($, ui) {
// json2

// 判断浏览器是否原生支持JSON对象
var hasJSON = (Object.prototype.toString.call(window.JSON) === "[object JSON]" 
        && ui.core.isFunction(window.JSON.parse) 
        && ui.core.isFunction(window.JSON.stringify));
if (hasJSON) {
    return;
}

var JSON = {
    fake: true
};

"use strict";
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
        return (isFinite(this.valueOf()) ? (this.getUTCFullYear() + "-" 
                    + f(this.getUTCMonth() + 1) + "-" 
                    + f(this.getUTCDate()) + "T" 
                    + f(this.getUTCHours()) + ":" 
                    + f(this.getUTCMinutes()) + ":" 
                    + f(this.getUTCSeconds()) + "Z") : null);
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
                v = partial.length === 0
                    ? "[]"
                    : gap
                        ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]"
                        : "[" + partial.join(",") + "]";
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
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            } else {
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (
                                gap
                                    ? ": "
                                    : ":"
                            ) + v);
                        }
                    }
                }
            }
            v = partial.length === 0
                ? "{}"
                : gap
                    ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}"
                    : "{" + partial.join(",") + "}";
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
        return (typeof reviver === "function")
            ? walk({"": j}, "")
            : j;
    }
    throw new SyntaxError("JSON.parse");
};

})(jQuery, ui);

// Source: ui/ajax.js

(function($, ui) {
// ajax
var responsedJson = "X-Responded-JSON";
function unauthorized(xhr, context) {
    var json = null;
    if(xhr.status == 401) {
        return unauthorizedHandler(context);
    } else if(xhr.status == 403) {
        return forbiddenHandler(context);
    } else if(xhr.status == 200) {
        json = xhr.getResponseHeader(responsedJson);
        if(!ui.str.isNullOrEmpty(json)) {
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
    var url = location.href;
    var index;
    alert("等待操作超时，您需要重新登录");
    index = url.indexOf("#");
    if(index > 0) {
        url = url.substring(0, index);
    }
    location.replace();
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
function successHandler(context, data, textStatus, xhr) {
    var result = unauthorized(xhr, context);
    if(result === false) {
        return;
    }
    context.successFn(data);
}
function errorHandler(context, xhr, textStatus, errorThrown) {
    var result = unauthorized(xhr, context);
    if(result === false) {
        return;
    }
    if(textStatus === "parsererror") {
        context.error.message = "没能获取预期的数据类型，转换json发生错误";
        context.error.responseText = xhr.responseText;
    } else {
        try {
            result = JSON.parse(xhr.responseText);
            context.error.message = result.Message;
        } catch(e) {
            context.error.message = xhr.responseText;
        }
    }
    context.errorFn(context.error);
}
function buildKeyValueParameters(args) {
    var builder = [],
        add = function(key, valueOrFunction) {
            if(!key) return;
            var value = (ui.core.isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction);
            builder.push(encodeURIComponent(key) + "=" + encodeURIComponent(value === null ? "" : value));
        },
        i;
    if(Array.isArray(args)) {
        for(i = 0; i < args.length; i++) {
            add(args[i].name, args[i].value);
        }
    } else {
        for(i in args) {
            if(args.hasOwnProperty(i)) {
                add(i, args[i]);
            }
        }
    }
    return builder.join("&");
}
function buildJsonParameters(args) {
    return JSON.stringify(args);
}
function ajaxCall(method, url, args, successFn, errorFn, option) {
    var type,
        paramFn,
        ajaxOption,
        context = {
            error: {}
        };
    if ($.isFunction(args)) {
        errorFn = successFn;
        successFn = args;
        args = null;
    }

    ajaxOption = {
        type: method.toUpperCase() === "GET" ? "GET" : "POST",
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        url: url,
        async: true,
        data: args
    };
    if (option) {
        ajaxOption = $.extend(ajaxOption, option);
    }
    
    //准备参数
    type = ui.core.type(args);
    if(ajaxOption.contentType.indexOf("application/json") > -1) {
        paramFn = buildJsonParameters;
    } else {
        paramFn = buildKeyValueParameters;
    }
    if (type !== "string") {
        if (type === "array" || ui.core.isPlainObject(args)) {
            args = paramFn(args);
        } else if(args === null || args === undefined || isNaN(args)) {
            args = "";
        } else {
            args = args + "";
        }
    }

    if ($.isFunction(successFn)) {
        context.successFn = successFn;
        ajaxOption.success = function(d, s, r) {
            successHandler(context, d, s, r);
        };
    }
    if ($.isFunction(errorFn)) {
        context.errorFn = errorFn;
        ajaxOption.error = function(r, s, t) {
            errorHandler(context, r, s, t);
        }
    }
    return $.ajax(ajaxOption);
}

ui.ajax = {
    ajaxGet: function (url, args, success, failure, option) {
        if(!option) option = {};
        option.contentType = "application/x-www-form-urlencoded";
        return ajaxCall("GET", url, args, success, failure, option);
    },
    ajaxPost: function (url, args, success, failure, option) {
        return ajaxCall("POST", url, args, success, failure, option);
    },
    ajaxPostForm: function(url, args, success, failure, option) {
        if(!option) option = {};
        option.contentType = "application/x-www-form-urlencoded";
        return ajaxCall("POST", url, args, success, failure, option);
    },
    ajaxPostOnce: function (btn, url, args, success, failure, option) {
        btn = ui.getJQueryElement(btn);
        if(!btn) {
            throw new Error("没有正确设置要禁用的按钮");
        }
        if(!option) {
            option = {};
        }

        var text = null,
            textFormat = "正在{0}...",
            func;
        if(option.textFormat) {
            textFormat = option.textFormat;
            delete option.textFormat;
        }
        btn.attr("disabled", "disabled");
        func = function() {
            btn.removeAttr("disabled");
        };
        if(btn.isNodeName("input")) {
            text = btn.val();
            if(text.length > 0) {
                btn.val(ui.str.stringFormat(textFormat, text));
            } else {
                btn.val(ui.str.stringFormat(textFormat, "处理"));
            }
            func = function() {
                btn.val(text);
                btn.removeAttr("disabled");
            };
        } else {
            text = btn.html();
            if(!ui._rhtml.test(text)) {
                btn.text(ui.str.stringFormat(textFormat, text));
                func = function() {
                    btn.text(text);
                    btn.removeAttr("disabled");
                };
            }
        }
        
        option.complete = func;
        return ajaxCall("POST", url, args, success, failure, option);
    },
    ajaxAll: function () {
        var promises;
        if (arguments.length == 1) {
            promises = [arguments[0]];
        } else if (arguments.length > 1) {
            promises = [].slice.call(arguments, 0);
        } else {
            return;
        }
        var promise = Promise.all(promises);
        promise._then_old = promise.then;

        promise.then = function () {
            var context;
            if (arguments.length > 1 && $.isFunction(arguments[1])) {
                context = {
                    error: {},
                    errorFn: arguments[1]
                };
                arguments[1] = function(xhr) {
                    errorHandler(context, xhr);
                };
            }
            return this._then_old.apply(this, arguments);
        };
        return promise;
    }
};

})(jQuery, ui);

// Source: ui/cookie.js

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
            Cookie.forEach(function(key, value) {
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
        Cookie.forEach(function(key, value) {
            if (!(key in obj)) {
                obj[key] = value;
            }
        });
        return obj;
    },
    set: function(key, val, opts) {
        document.cookie = Cookie.stringify.apply(0, arguments);
    },
    remove: function(key, opt) {
        opt = opt || {};
        if (!opt.expires) {
            opt.expires = new Date(1970, 0, 1);
        }
        Cookie.set(key, '', opt);
    },
    clear: function() {
        Cookie.forEach(function(key, value) {
            Cookie.remove(key);
        });
    }
};

})(jQuery, ui);

// Source: ui/browser.js

(function($, ui) {
// browser

var pf = (navigator.platform || "").toLowerCase(),
    ua = navigator.userAgent.toLowerCase(),
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
    target = ui[target];
    target.name = name;
    target.version = ver;
    target[name] = ver;
}

// 提供三个对象,每个对象都有name, version(version必然为字符串)
// 取得用户操作系统名字与版本号，如果是0表示不是此操作系统

// 平台
ui.platform = {
    name: (window.orientation !== undefined) ? 'iPod' : (pf.match(/mac|win|linux/i) || ['unknown'])[0],
    version: 0,
    iPod: 0,
    iPad: 0,
    iPhone: 0,
    ios: 0,
    android: 0,
    windowsPhone: 0,
    win: 0,
    linux: 0,
    mac: 0
};
(s = ua.match(/windows ([\d.]+)/)) ? updateProperty("platform", "win", toFixedVersion(s[1])) :
        (s = ua.match(/windows nt ([\d.]+)/)) ? updateProperty("platform", "win", toFixedVersion(s[1])) :
        (s = ua.match(/linux ([\d.]+)/)) ? updateProperty("platform", "linux", toFixedVersion(s[1])) :
        (s = ua.match(/mac ([\d.]+)/)) ? updateProperty("platform", "mac", toFixedVersion(s[1])) :
        (s = ua.match(/ipod ([\d.]+)/)) ? updateProperty("platform", "iPod", toFixedVersion(s[1])) :
        (s = ua.match(/ipad[\D]*os ([\d_]+)/)) ? updateProperty("platform", "iPad", toFixedVersion(s[1])) :
        (s = ua.match(/iphone[\D]*os ([\d_]+)/)) ? updateProperty("platform", "iPhone", toFixedVersion(s[1])) :
        (s = ua.match(/android ([\d.]+)/)) ? updateProperty("platform", "android", toFixedVersion(s[1])) : 
        (s = ua.match(/windows phone ([\d.]+)/)) ? updateProperty("platform", "windowsPhone", toFixedVersion(s[1])) : 0;
if(ui.platform.iphone || ui.platform.iPad) {
    ui.platform.ios = ui.platform.iphone || ui.platform.iPad;
}

//============================================
//取得用户的浏览器名与版本,如果是0表示不是此浏览器
ui.browser = {
    name: "unknown",
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
(s = ua.match(/edge\/([\d.]+)/)) ? updateProperty("browser", "edge", toFixedVersion(s[1])) :
        (s = ua.match(/trident.*; rv\:([\d.]+)/)) ? updateProperty("browser", "ie", toFixedVersion(s[1])) : 
        (s = ua.match(/msie ([\d.]+)/)) ? updateProperty("browser", "ie", toFixedVersion(s[1])) :
        (s = ua.match(/firefox\/([\d.]+)/)) ? updateProperty("browser", "firefox", toFixedVersion(s[1])) :
        (s = ua.match(/chrome\/([\d.]+)/)) ? updateProperty("browser", "chrome", toFixedVersion(s[1])) :
        (s = ua.match(/opera.([\d.]+)/)) ? updateProperty("browser", "opera", toFixedVersion(s[1])) :
        (s = ua.match(/adobeair\/([\d.]+)/)) ? updateProperty("browser", "adobeAir", toFixedVersion(s[1])) :
        (s = ua.match(/version\/([\d.]+).*safari/)) ? updateProperty("browser", "safari", toFixedVersion(s[1])) : 0;
//下面是各种微调
//mobile safari 判断，可与safari字段并存
(s = ua.match(/version\/([\d.]+).*mobile.*safari/)) ? updateProperty("browser", "mobileSafari", toFixedVersion(s[1])) : 0;

if (ui.platform.iPad) {
    updateProperty("browser", 'mobileSafari', '0.0');
}

if (ui.browser.ie) {
    if (!document.documentMode) {
        document.documentMode = Math.floor(ui.browser.ie);
        //http://msdn.microsoft.com/zh-cn/library/cc817574.aspx
        //IE下可以通过设置 <meta http-equiv="X-UA-Compatible" content="IE=8"/>改变渲染模式
        //一切以实际渲染效果为准
    } else if (document.documentMode !== Math.floor(ui.browser.ie)) {
        updateProperty("browser", "ie", toFixedVersion(document.documentMode));
    }
}

//============================================
//取得用户浏览器的渲染引擎名与版本,如果是0表示不是此浏览器
ui.engine = {
    name: 'unknown',
    version: 0,
    trident: 0,
    gecko: 0,
    webkit: 0,
    presto: 0
};

(s = ua.match(/trident\/([\d.]+)/)) ? updateProperty("engine", "trident", toFixedVersion(s[1])) :
        (s = ua.match(/gecko\/([\d.]+)/)) ? updateProperty("engine", "gecko", toFixedVersion(s[1])) :
        (s = ua.match(/applewebkit\/([\d.]+)/)) ? updateProperty("engine", "webkit", toFixedVersion(s[1])) :
        (s = ua.match(/presto\/([\d.]+)/)) ? updateProperty("engine", "presto", toFixedVersion(s[1])) : 0;

if (ui.browser.ie) {
    if (ui.browser.ie == 6) {
        updateProperty("engine", "trident", toFixedVersion("4"));
    } else if (ui.browser.ie == 7 || ui.browser.ie == 8) {
        updateProperty("engine", "trident", toFixedVersion("5"));
    }
}

})(jQuery, ui);

// Source: ui/image-loader.js

(function($, ui) {
// image loader

function ImageLoader() {
    if(this instanceof ImageLoader) {
        this.initialize();
    } else {
        return new ImageLoader();
    }
}
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
            this.marginLeft = Math.floor((this.width - width) / 2);
        } else {
            // 图片比显示区域小，显示到中心
            this.marginLeft = Math.floor((this.width - this.displayWidth) / 2);
            this.marginTop = Math.floor((this.height - this.displayHeight) / 2);
        }
    }
};
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
            reimg.src = src;
        });
        return promise;
    }
};

ui.ImageLoader = ImageLoader;


})(jQuery, ui);

// Source: ui/jquery-extends.js

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
    return this.prop("nodeName");
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
    if (core.isDomObject(elem)) {
        elem = $(elem);
    } else if (core.isJQueryObject(elem) && elem.length === 0) {
        return false;
    }
    eventName = "on" + eventName;
    var isSupported = (eventName in elem[0]);
    if (!isSupported) {
        elem.attr(eventName, "return;");
        isSupported = core.type(elem[eventName]) === "function";
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

// Source: ui/define.js

(function($, ui) {

function getNamespace(namespace) {
    var spaces,
        spaceRoot,
        spaceName;
    var i, len;

    spaces = namespace.split(".");
    spaceRoot = window;
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
        constructorInfo.name = name;
        existingConstructor = window[constructorInfo.name];
        constructorInfo.constructor = window[constructorInfo.name] = constructor;
    } else {
        constructorInfo.namespace = name.substring(0, index);
        constructorInfo.name = name.substring(index + 1);
        namespace = getNamespace(constructorInfo.namespace);
        existingConstructor = namespace[constructorInfo.name];
        constructorInfo.constructor = namespace[constructorInfo.name] = constructor;
    }

    if(existingConstructor) {
        $.extend(constructor, constructorInfo.constructor);
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
        basePrototype = new base();
    } else {
        basePrototype = {};
        basePrototype.namespace = "";
    }
    basePrototype.option = $.extend({}, basePrototype.option);

    // 方法重写
    $.each(prototype, function (prop, value) {
        if (!$.isFunction(value)) {
            return;
        }
        var func = base.prototype[prop];
        if (!$.isFunction(func)) {
            return;
        }
        delete prototype[prop];
        proxiedPrototype[prop] = (function () {
            var _super = function () {
                return base.prototype[prop].apply(this, arguments);
            },
            _superApply = function (args) {
                return base.prototype[prop].apply(this, args);
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
    constructorInfo.constructor.prototype = $.extend(
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

function CtrlBase() {
}
CtrlBase.prototype = {
    constructor: CtrlBase,
    ctrlName: "CtrlBase",
    namespace: "ui.ctrls",
    version: ui.version,
    option: {},
    extend: function(target) {
        var input = Array.prototype.slice.call(arguments, 1),
            i = 0, len = input.length,
            option, key, value;
        for (; i < len; i++) {
            option = input[i];
            for (key in option) {
                value = option[key];
                if (option.hasOwnProperty(key) && value !== undefined) {
                    // Clone objects
                    if (ui.core.isPlainObject(value)) {
                        target[key] = ui.core.isPlainObject(target[key]) 
                            ? this.extend({}, target[key], value) 
                            // Don't extend strings, arrays, etc. with objects
                            : this.extend({}, value);
                    // Copy everything else by reference
                    } else {
                        if (value !== null && value !== undefined) {
                            target[key] = value;
                        }
                    }
                }
            }
        }
        return target;
    },
    mergeEvents: function(originEvents, newEvents) {
        var temp,
            i;
        if(!Array.isArray(originEvents)) {
            return newEvents;
        }

        temp = {};
        for(i = 0, len = originEvents.length; i < len; i++) {
            if(!temp.hasOwnProperty(originEvents[i])) {
                temp[originEvents[i]] = true;
            }
        }

        for(i = 0, len = newEvents.length; i < len; i++) {
            if(!temp.hasOwnProperty(newEvents[i])) {
                temp[newEvents[i]] = true;
            }
        }

        newEvents = [];
        for(i in temp) {
            if(temp.hasOwnProperty(i)) {
                newEvents.push(i);
            }
        }

        return newEvents;
    },
    _initialize: function(option, element) {
        var events;

        this.document = document;
        this.window = window;
        this.element = element || null;

        // 配置项初始化
        this.option = this.extend({}, 
            this.option,
            this._defineOption(),
            option);
        // 事件初始化
        events = this._defineEvents();
        if(Array.isArray(events) && events.length > 0) {
            this.eventTarget = new ui.EventTarget(this);
            this.eventTarget.initEvents(events);
        }

        this._create();
        return this;
    },
    _defineOption: ui.core.noop,
    _defineEvents: ui.core.noop,
    _create: ui.core.noop,
    toString: function() {
        return this.fullName;
    }
};
ui.ctrls = {
    CtrlBase: CtrlBase
};

ui.define = function(name, base, prototype) {
    var index,
        constructor;

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
        base = ui.ctrls.CtrlBase;
    }

    constructor = define(name, base, prototype, function(option, element) {
        if (this instanceof ui.ctrls.CtrlBase) {
            if (arguments.length) {
                this._initialize(option, element);
            }
        } else {
            return new constructor(option, element);
        }
    });
    return constructor;
};


})(jQuery, ui);

// Source: ui/draggable.js

(function($, ui) {

var doc = document;
var body = $(doc.body);
var defaultOption = {
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
        this.doc = document;
        this.shield = null;

        this.option = $.extend(defaultOption, option);
        if(this.option.hasIframe === true) {
            this.shield = $("<div>");
            this.shield.css({
                "position": "fixed",
                "top": "0px",
                "left": "0px",
                "width": "100%",
                "height": "100%",
                "z-index": "999999",
                "background-color": "#ffffff",
                "filter": "Alpha(opacity=1)",
                "opacity": ".1"    
            });
        }

        this.onMouseDown = $.proxy(this.mouseDownHandler, this);
        this.onMouseMove = $.proxy(this.mouseMoveHandler, this);
        this.onMouseUp = $.proxy(this.mouseUpHandler, this);
    },
    on: function() {
        var target = this.option.target,
            handle = this.option.handle,
            parent = this.option.parent;
        if(!parent.isNodeName("body")) {
            this.option.originParentPosition = parent.css("position");
            if (position !== "absolute" && position !== "relative" && position !== "fixed") {
                parent.css("position", "relative");
            }
        }
        this.option.targetPosition = target.css("position");
        if (this.option.targetPosition !== "absolute") {
            target.css("position", "absolute");
        }

        this.doc.on("mousedown", this, this.onMouseDown);
        if(this.option.target)
            this.option.target.data("mouse-dragger", this);
    },
    off: function() {
        this.option.target
            .off("mousedown", this.onMouseDown)
            .css("position", this.option.originPosition);
        this.option.parent.css("position", this.option.originParentPosition);
    },
    mouseDownHandler: function(e) {
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
        doc.on("mousemove", this.onMouseMove)
            .on("mouseup", this.onMouseUp)
            .on("mouseleave", this.onMouseUp);
        doc.onselectstart = function() { return false; };
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
    },
    mouseMoveHandler: function(e) {
        var eventArg = {
            target: e.target,
            option: this.option
        };
        if(!this._isDragStart) return;
        
        eventArg.x = e.pageX - this.currentX;
        eventArg.y = e.pageY - this.currentY;
        eventArg.currentX = this.currentX = e.pageX;
        eventArg.currentY = this.currentY = e.pageY;

        if(ui.core.isFunction(this.option.onMoving)) {
            this.option.onMoving.call(this, eventArg);
        }
    },
    mouseUpHandler: function(e) {
        var eventArg = {
            target: e.target,
            option: this.option
        };
        if (e.which !== 1) return;
        if(!this._isDragStart) return;

        this._isDragStart = false;
        this.currentX = this.currentY = null;

        doc.onselectstart = null;
        this.option.target.removeClass("cancel-user-select");

        if(ui.core.isFunction(this.option.onEndDrag)) {
            this.option.onEndDrag.call(this, eventArg);
        }

        if(this.shield) {
            this.shield.remove();
        }
    }
};

ui.MouseDragger = MouseDragger;

/** 拖动效果 */
$.fn.draggable = function(option) {
    var dragger;
    if (!option || !option.target || !option.parent) {
        return;
    }
    if (!core.isDomObject(this[0]) || elem.nodeName() === "BODY") {
        return;
    }

    option.getParentCssNum = function(prop) {
        return parseFloat(option.parent.css(prop)) || 0;
    };
    option.onBeginDrag = function(arg) {
        var option = this.option;
            p = option.parent.offset();
        if(!p) p = { top: 0, left: 0 };

        option.topLimit = p.top + option.getParentCssNum("border-top") + option.getParentCssNum("padding-top");
        option.leftLimit = p.left + option.getParentCssNum("border-left") + option.getParentCssNum("padding-left");
        option.rightLimit = p.left + (option.parent.outerWidth() || option.parent.width());
        option.bottomLimit = p.top + (option.parent.outerHeight() || option.parent.height());
        
        option.targetWidth = option.target.outerWidth();
        option.targetHeight = option.target.outerHeight();
    };
    option.onMoving = function(arg) {
        var option = this.option,
            p = option.target.position();
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

// Source: ui/style-sheet.js

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
    if(this instanceof StyleSheet) {
        this.initialize(elem);
    } else {
        return new StyleSheet(elem);
    }
}
StyleSheet.prototype = {
    constructor: StyleSheet,
    initialize: function(elem) {
        var nodeName,
            styleElement;

        this.styleSheet = null;
        if(ui.core.isString(elem) && elem.length > 0) {
            //通过ID获取
            styleElement = $("#" + elem);
            nodeName = styleElement.nodeName();
            if (nodeName === "STYLE" || nodeName === "LINK") {
                this.styleSheet = styleElement.prop("sheet");
                if (!this.styleSheet)
                    this.styleSheet = styleElement.prop("styleSheet");
                if (this.styleSheet) {
                    this.styleSheet = $(this.styleSheet);
                }
            }
        } else if(ui.core.isJQueryObject(elem)) {
            this.styleSheet = elem;
        } else if(ui.core.isDomObject(elem)) {
            this.styleSheet = $(elem);
        }
    },
    disabled: function() {
        if(arguments.length == 0) {
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
        if(!this.styleSheet || this.styleSheet.length == 0) {
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
            rule;
        if(ui.str.isEmpty(selector)) {
            return;
        }
        if(!styles) {
            return;
        }

        rule = this.getRule(selector);
        if(rule) {
            $(rule).css(styles);
        } else {
            selector = selector.toLowerCase();
            rules = getRules.call(this.styleSheet);
            if(ui.core.isFunction(this.styleSheet[0].insertRule)) {
                this.styleSheet[0].insertRule(selector, styles, rules.length);
            } else if(ui.core.isFunction(this.styleSheet[0].addRule)) {
                this.styleSheet[0].addRule(selector, styles, rules.length);
            }
        }
    },
    removeRule: function(selector) {
        var rules;
        var removeFn;
        if(ui.str.isEmpty(selector)) {
            return;
        }
        if(!this.styleSheet || this.styleSheet.length == 0) {
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
        head = document.getElementsByTagNames("head")[0];
        styleElem = document.createElement("style");
        head.appendChild(styleElem);
        styleSheet = document.styleSheets[document.styleSheets.length - 1];
    }
    if(!ui.str.isNullOrEmpty(id)) {
        styleElem.id = id;
    }

    return new StyleSheet($(styleSheet));
};

ui.StyleSheet = StyleSheet;


})(jQuery, ui);

// Source: ui/theme.js

(function($, ui) {

//主题
ui.theme = {
    /** 当前的主题背景色 */
    background: "Light",
    /** 默认主题色 */
    defaultThemeId: "Default",
    /** 主题文件StyleID */
    themeSheetId: "theme",
    /** 用户当前设置的主题 */
    currentTheme: null,
    /** 获取主题 */
    getTheme: function (themeId) {
        if (!themeId)
            themeId = defaultThemeId;
        var info;
        var themeInfo = null;
        if (Array.isArray(this.Colors)) {
            for (var i = 0, l = this.Colors.length; i < l; i++) {
                info = this.Colors[i];
                if (info.Id === themeId) {
                    themeInfo = info;
                    break;
                }
            }
        }
        return themeInfo;
    },
    /** 修改主题 */
    changeTheme: function(url, color) {
        ui.ajax.ajaxPost(url, 
            { themeId: color.Id },
            function(success) {
                var sheet,
                    url,
                    urlObj;
                if(success.Result) {
                    sheet = $("#" + this.currentTheme);
                    if(sheet.length > 0) {
                        url = sheet.prop("href");
                        url = ui.url.setParams({
                            themeId: color.Id
                        });
                        sheet.prop("href", url);
                    }
                    ui.theme.currentTheme = color;
                    ui.page.fire("themeChanged", color);
                }
            },
            function(error) {
                ui.msgshow("修改主题失败，" + error.message, true);
            }
        );
    }
};

})(jQuery, ui);

// Source: ui/page.js

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
    events: [
        "themechanged", 
        "ready", 
        "docclick", 
        "docmouseup", 
        "resize", 
        "hashchange"
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
        page.fire("docclick");
    });

$(window)
    //注册全局resize事件
    .on("resize", function (e) {
        page.fire("resize", 
            document.documentElement.clientWidth, 
            document.documentElement.clientHeight);
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

// Source: ui/control/base/dropdown-base.js

(function($, ui) {
var docClickHideHandler = [],
    hideCtrls = function (currentCtrl) {
        var handler, retain;
        if (docClickHideHandler.length === 0) {
            return;
        }
        retain = [];
        while (handler = docClickHideHandler.shift()) {
            if (currentCtrl && currentCtrl === handler.ctrl) {
                continue;
            }
            if (handler.func.call(handler.ctrl) === "retain") {
                retain.push(handler);
            }
        }

        docClickHideHandler.push.apply(docClickHideHandler, retain);
    };

// 注册document点击事件
ui.page.docclick(function (e) {
    hideCtrls();
});
// 添加隐藏的处理方法
ui.addHideHandler = function (ctrl, func) {
    if (ctrl && ui.core.isFunction(func)) {
        docClickHideHandler.push({
            ctrl: ctrl,
            func: func
        });
    }
};
// 隐藏所有显示出来的下拉框
ui.hideAll = function (currentCtrl) {
    hideCtrls(currentCtrl);
};

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
            ui.hideAll(that);
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
        if(!ui.core.isNumber(width)) {
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


})(jQuery, ui);

// Source: ui/control/common/column-style.js

(function($, ui) {
// column style 默认提供的GridView和ReportView的格式化器
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
    var date = val;
    if(!date) {
        return null;
    }
    if(ui.core.isString(val)) {
        date = ui.str.jsonToDate(date);
    }
    return date;
}

var columnFormatter,
    cellFormatter,
    cellParameterFormatter;

var progressError = new Error("column.len或width设置太小，无法绘制进度条！");

// 列头格式化器
columnFormatter = {
    columnCheckboxAll: function (col) {
        var checkbox = $("<i class='fa fa-square grid-checkbox-all' />");
        checkbox.click(this.onCheckboxAllClickHandler);
        this.resetColumnStateHandlers.checkboxAllCancel = function () {
            checkbox.removeClass("fa-check-square").addClass("fa-square");
            this._checkedCount = 0;
        };
        return checkbox;
    },
    columnText: function (col) {
        var span = $("<span class='table-cell-text' />"),
            value = col.text;
        if (value === undefined || value === null) {
            return null;
        }
        span.text(value);
        return span;
    },
    empty: function (col) {
        return null;
    }
};

// 单元格格式化器
cellFormatter = {
    text: function (val, col) {
        var span;
        if (val === undefined || val === null || isNaN(val)) {
            return null;
        }
        span = $("<span class='table-cell-text' />");
        span.text(t + "");
        return span;
    },
    empty: function (val, col) {
        return null;
    },
    rowNumber: function (val, col, idx) {
        var span;
        if(val === "no-count") {
            return null;
        }
        span = $("<span />");
        span.text((this.pageIndex - 1) * this.pageSize + (idx + 1));
        return span;
    },
    checkbox: function(val, col) {
        var checkbox = $("<i class='fa fa-square grid-checkbox' />");
        checkbox.attr("data-value", ui.str.htmlEncode(value));
        return checkbox;
    },
    paragraph: function (val, col) {
        var p;
        if(val === undefined || val === null || isNaN(val)) {
            return null;
        }
        p = $("<p class='table-cell-block' />")
        p.text(val + "");
        return p;
    },
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
            span.text([date.getFullYeaer(), "-",
                addZero(date.getMonth() + 1), "-",
                addZero(date.getDate())].join(""));
        }
        return span;
    },
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
    money: function(val, col) {
        return getMoney("￥", val);
    },
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
    rowspan: function(val, col, idx, td) {
        var ctx,
            span,
            key = "__temp$TdContext-" + col.column;
        if (idx === 0) {
            ctx = this[key] = {
                rowSpan: 1,
                value: val,
                td: td
            };
        } else {
            ctx = this[key];
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
    getBooleanFormatter: function(trueText, falseText, nullText) {
        var width = 16,
            trueWidth,
            falseWidth;
        trueText += "";
        falseText += "";
        if (arguments.length === 2) {
            nullText = "";
        }

        trueWidth = width * trueText.length || width,
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
    getNumberFormatter: function(decimalLen) {
        return function(val, col) {
            if(!ui.core.isNumber(val)) {
                return null;
            }
            return $("<span />").text(ui.str.numberScaleFormat(val, decimalLen));
        };
    },
    getMoneyFormatter: function(symbol) {
        return function(val, col) {
            return getMoney(symbol, col);
        };
    },
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
            var div, 
                barDiv, progressDiv, percentDiv,
                percent;

            if(ui.core.isNumber(val.value)) {
                val.total = totalValue || 0;
            } else {
                val = {
                    value: val,
                    total: totalValue || 0
                };
            }
            if(!ui.core.isNumber(val.total)) {
                val.total = val.value;
            }
            if(val.total === 0) {
                val.total = 1;
            }
            if(!ui.core.isNumber(val.value)) {
                val.value = 0;
            }

            percent = val.value / val.total;
            if(isNaN(percent)) {
                percent = 0;
            }
            percent = ui.str.numberScaleFormat(percent * 100, 2) + "%";
            div = $("<div class='cell-progress-panel' />");
            barDiv = $("<div class='cell-progress-bar' />");
            progressDiv = $("<div class='cell-progress-value background-highlight' />");
            progressDiv.css("width", percent);
            barDiv.append(progressDiv);

            percentDiv = $("<div class='cell-progress-text font-highlight'/>");
            percentDiv.append("<span>" + percent + "</span>");

            div.append(barDiv);
            div.append(percentDiv);
            div.append("<br clear='all' />");
            
            return div;
        };
    },
    getRowspanFormatter: function(index, key, createFn) {
        var columnKey = "__temp$TdContext-" + key;
        return function(val, col, idx, td) {
            var ctx;
            if (idx === 0) {
                ctx = this[key] = {
                    rowSpan: 1,
                    value: val,
                    td: td
                };
            } else {
                ctx = this[key];
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
            return createFn.apply(this, arguments);
        };
    },
    getImageFormatter: function(width, height, prefix, defaultSrc, fillMode) {
        var imageZoomer;
        if(ui.core.isNumber(width) || width <= 0) {
            width = 120;
        }
        if(ui.core.isNumber(height) || width <= 0) {
            height = 90;
        }
        if(!prefix) {
            prefix = "";
        } else {
            prefix += "";
        }
        
        if(!ui.images) {
            throw new ReferenceError("require ui.images");
        }
        imageZoomer = ui.ctrls.ImageZoomer({
            getNext: function(val) {
                var img = this.target;
                var cell = img.parent().parent();
                var row = cell.parent();
                var tableBody = row.parent();
                var rowCount = tableBody[0].rows.length;
                
                var rowIndex = row[0].rowIndex + val;
                var imgPanel = null;
                do {
                    if(rowIndex < 0 || rowIndex >= rowCount) {
                        return false;
                    }
                    imgPanel = $(tableBody[0].rows[rowIndex].cells[cell[0].cellIndex]).children();
                    img = imgPanel.children("img");
                    rowIndex += val;
                } while(imgPanel.hasClass("failed-image"));
                return img;
            },
            onNext: function() {
                return this.option.getNext.call(this, 1) || null;
            },
            onPrev: function() {
                return this.option.getNext.call(this, -1) || null;
            },
            hasNext: function() {
                return !!this.option.getNext.call(this, 1);
            },
            hasPrev: function() {
                return !!this.option.getNext.call(this, -1);
            }
        });
        return function(imageSrc, column, index, td) {
            if(!imageSrc) {
                return "<span>暂无图片</span>";
            }
            var imagePanel = $("<div class='grid-small-image' style='overflow:hidden;' />");
            var image = $("<img style='cursor:crosshair;' />");
            imagePanel.css({
                "width": width + "px",
                "height": height + "px"
            });
            imagePanel.append(image);
            image.setImage(prefix + imageSrc, width, height, fillMode)
                .then(
                    function(result) {
                        image.addImageZoomer(imageZoomer);
                    }, 
                    function(e) {
                        image.attr("alt", "请求图片失败");
                        if(defaultSrc) {
                            image.prop("src", defaultSrc);
                            image.addClass("default-image");
                        }
                        imagePanel.addClass("failed-image");
                    });
            return imagePanel;
        };
    }
};

ui.ColumnStyle = {
    cnfn: columnFormatter,
    cfn: cellFormatter,
    cfnp: cellParameterFormatter
};


})(jQuery, ui);

// Source: ui/control/common/pager.js

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

// Source: ui/control/common/sidebar.js

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

// Source: ui/control/select/chooser.js

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
        this.defaultSelectValue = function () {
            var now = new Date();
            return [
                addZero(now.getHours()), 
                addZero(now.getMinutes())
            ];
        };
        return data;
    },
    time: function() {
        var data;

        data = getTimeData(true, true, true);
        this.option.spliter = ":";
        this.defaultSelectValue = function () {
            var now = new Date();
            return [
                addZero(now.getHours()), 
                addZero(now.getMinutes()),
                addZero(now.getSeconds())
            ];
        };
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
        this.defaultSelectValue = function () {
            var now = new Date();
            return [
                addZero(now.getFullYear()),
                addZero(now.getMonth() + 1)
            ];
        };

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

ui.define("ui.ctrls.Chooser", ui.ctrls.DropDownBase, {
    _defineOption: function() {
        return {
            // 选择器类型，支持yearMonth, time, hourMinute，也可以自定义
            type: false,
            // 显示标题，如果数据中没有单独设置则会显示这个内容
            title: null,
            // 视图数据 [{title: 时, list: [1, 2, ...]}, ...]
            viewData: null,
            // 分隔符常用于日期格式，时间格式
            spliter: ".",
            // 候选项的间隔距离
            margin: defaultMargin,
            // 候选项的显示个数 S: 3, M: 5, L: 9
            size: defaultSize,
            // 候选项的大小
            itemSize: defaultItemSize
        };
    },
    _defineEvents: function() {
        return ["selecting", "selected"];
    },
    _create: function() {
        this._super();

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

        this.width = this.element.width();
        if (this.width < this.itemSize + (this.margin * 2)) {
            this.width = minWidth;
        }

        this.onFocusHandler = $.proxy(onFocus, this);
        this.onItemClickHandler = $.proxy(onItemClick, this);
        this.onMousewheelHandler = $.proxy(onMousewheel, this);

        this._init();
    },
    _init: function() {
        this.chooserPanel = $("<div class='ui-chooser-panel border-highlight' />");
        this.chooserPanel.css("width", this.width + "px");

        this._itemTitlePanel = $("<div class='ui-chooser-title-panel' />");
        this._itemListPanel = $("<div class='ui-chooser-list-panel' />");
        this._itemListPanel.append(this._createFocusElement());
        this._createItemList(this._itemTitlePanel, this._itemListPanel);

        this.chooserPanel
            .append(this._itemTitlePanel)
            .append(this._itemListPanel);

        this._selectTextClass = "select-text";
        this._showClass = "ui-chooser-show";
        this._clearClass = "ui-chooser-clear";
        this._clear = function () {
            this.element.val("");
        };
        this.wrapElement(this.element, this.chooserPanel);
        this._super();

        this.element
            .off("focus")
            .on("focus", this.onFocusHandler);
        this.chooserPanel.click(function (e) {
            e.stopPropagation();
        });
    },
    _createFocusElement: function() {
        var div = $("<div class='focus-choose-element' />");
        div.addClass("border-highlight");
        div.css("top", this.itemSize * ((this.size - 1) / 2));
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
            surwidth,
            temp;
        
        sizeData = {
            width: 0,
            height: this.size * (this.option.itemSize + this.option.margin) + this.option.margin
        };

        this.scrollData = null;
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

            sizeData.width += tempWidth + temp + this.margin;

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
            li.text(text);
        } else {
            li.addClass("ui-chooser-empty-item");
        }
        return li;
    },
    _getAttachmentCount: function() {
        return Math.floor((this.option.size - 1) / 2);
    },
    _getValues: function() {
        var attachmentCount,
            values,
            i, len, item, index;
        
        attachmentCount = this._getAttachmentCount();
        for(i = 0, len = this.scrollData.length; i < len; i++) {
            item = this.scrollData[i];
            if(item_current) {
                index = parseInt(item_current.attr("data-index"), 10);
                index -= attachmentCount;
                values.push(this.scrollData[i].list[index]);
            } else {
                values.push("");
            }
        }
        return values;
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
                if (item.list[j] === values[i]) {
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
        var val = this.element.val(), 
            i, indexArray;
        if (val.length > 0) {
            this._setValues(val.split(this.option.spliter));
        } else if (ui.core.isFunction(this.defaultSelectValue)) {
            this._setValues(this.defaultSelectValue());
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
            eventData;

        for (i = 0, len = this.scrollData.length; i < len; i++) {
            if (this.scrollData[i].beginAnimation) {
                return;
            }
        }
        
        ul = item.target.find("ul");
        scrollTop = item.target.scrollTop();
        index = parseInt(scrollTop / (this.option.itemSize + this.option.margin), 10);
        item._current = $(ul.children()[index + this._getAttachmentCount()]);
        item._current
            .addClass(selectedClass)
            .addClass("font-highlight");

        eventData = {};
        eventData.values = this._getValues();
        eventData.text = eventData.join(this.option.spliter);

        if (this.fire("selecting", eventData) === false) {
            return;
        }

        this.element.val(eventData.text);
        this.fire("selected", eventData);
    },
    _deselectItem: function(item) {
        if(item._current) {
            item._current
                .removeClass(selectedClass)
                .removeClass("font-highlight");
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

// Source: ui/control/select/color-picker.js

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
    fb.eventTarget = new ui.EventTarget(fb);
    fb.eventTarget.initEvents(events);

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
    }
    fb.updateValue = function (event) {
        if (this.value && this.value != fb.color) {
            fb.setColor(this.value);
        }
    }

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
    }

    /**
     * Change color with HSL triplet [0..1, 0..1, 0..1]
     */
    fb.setHSL = function (hsl) {
        fb.hsl = hsl;
        fb.rgb = fb.HSLToRGB(hsl);
        fb.color = fb.pack(fb.rgb);
        fb.updateDisplay();
        return this;
    }

    /////////////////////////////////////////////////////

    /**
     * Retrieve the coordinates of the given event relative to the center
     * of the widget.
     */
    fb.widgetCoords = function (event) {
        var x, y;
        var el = event.target || event.srcElement;
        var reference = fb.wheel;
        var pos;

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
            var offset = { x: 0, y: 0 }
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
        }
        else {
            // Use absolute coordinates
            pos = fb.absolutePosition(reference);
            x = (event.pageX || 0 * (event.clientX + $('html').get(0).scrollLeft)) - pos.x;
            y = (event.pageY || 0 * (event.clientY + $('html').get(0).scrollTop)) - pos.y;
        }
        // Subtract distance to middle
        return { x: x - fb.width / 2, y: y - fb.width / 2 };
    }

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
    }

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
    }

    /**
     * Mouseup handler
     */
    fb.mouseup = function () {
        // Uncapture mouse
        $(document).unbind('mousemove', fb.mousemove);
        $(document).unbind('mouseup', fb.mouseup);
        document.dragging = false;
    }

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

        this.fire(selected, fb.color);
    }

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
    }

    fb.unpack = function (color) {
        if (color.length == 7) {
            return [parseInt('0x' + color.substring(1, 3)) / 255,
                parseInt('0x' + color.substring(3, 5)) / 255,
                parseInt('0x' + color.substring(5, 7)) / 255];
        }
        else if (color.length == 4) {
            return [parseInt('0x' + color.substring(1, 2)) / 15,
                parseInt('0x' + color.substring(2, 3)) / 15,
                parseInt('0x' + color.substring(3, 4)) / 15];
        }
    }

    fb.HSLToRGB = function (hsl) {
        var m1, m2;
        var h = hsl[0], s = hsl[1], l = hsl[2];
        m2 = (l <= 0.5) ? l * (s + 1) : l + s - l * s;
        m1 = l * 2 - m2;
        return [this.hueToRGB(m1, m2, h + 0.33333),
            this.hueToRGB(m1, m2, h),
            this.hueToRGB(m1, m2, h - 0.33333)];
    }

    fb.hueToRGB = function (m1, m2, h) {
        h = (h < 0) ? h + 1 : ((h > 1) ? h - 1 : h);
        if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
        if (h * 2 < 1) return m2;
        if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
        return m1;
    }

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
    }

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
        color = ui.color.rgb2Hex(color).toLowerCase();
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
    colorPicker._init();
    oldHideFn = colorPicker.hide;

    createFarbtastic(colorPickerPanel, this);
    colorPicker.farbtastic = this.colorPickerPanel[0].farbtastic;
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

// Source: ui/control/select/date-chooser.js

(function($, ui) {

var language,
    selectedClass = "";

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
    months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
    seasons: ["一季", "二季", "三季", "四季"]
};
//英文
language["en-US"] = {
    dateFormat: "yyyy-mm-dd",
    year: "Year",
    month: "Month",
    weeks: ["S", "M", "T", "W", "T", "F", "S"],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    seasons: ["S I", "S II", "S III", "S IV"]
};

// 格式化器
function twoNumberFormatter(number) {
    return number < 10 ? "0" + number : "" + number;
}
function calendarTitleFormatter(year, month) {
    month += 1;
    return year + "-" + twoNumberFormatter.call(this, number) + "&nbsp;▼";
} 

// 事件处理函数
function onYearChanged(e) {

}
function onYearSelected(e) {

}
function onMonthSelected(e) {

}
function onApplyYearMonth(e) {

}
function onCancelYearMonth(e) {
    
}
function onMonthChanged(e) {

}
function onCalendarTitleClick(e) {

}

ui.define("ui.ctrls.DateChooser", {
    _defineOption: function() {
        return {
            dateFormat: "yyyy-MM-dd",
            language: "zh-CN",
            calendarPanel: null,
            isDateTime: false
        };
    },
    _defineEvents: function() {
        return ["selecting", "selected", "cancel"];
    },
    _create: function() {
        var defaultFormat;
        this._super();

        defaultFormat = "yyyy-MM-dd";
        if(this.isDateTime()) {
            defaultFormat = "yyyy-MM-dd hh:mm:ss";
        }
        // 日期格式化
        this.option.defaultFormat = this.option.defaultFormat || defaultFormat;

        // 日期参数
        this._now = new Date();
        this._year = this._now.getFullYear();
        this._month = this._now.getMonth();
        this._selDay = this._now.getDate();

        // 文字显示
        this._language = language[this.option.language];
        if (!this._language) {
            this._language = language["zh-CN"];
        }

        // 事件
        /* 年月选择面板相关事件 */
        // 年切换处理
        this.onYearChangedHandler = $.proxy(onYearChanged, this);
        // 年选中事件
        this.onYearSelectedHandler = $.proxy(onYearSelected, this);
        // 月选中事件
        this.onMonthSelectedHandler = $.proxy(onMonthSelected, this);
        // 选中年月应用事件
        this.onApplyYearMonthHandler = $.proxy(onApplyYearMonth, this);
        // 取消事件
        this.onCancelYearMonthHandler = $.proxy(onCancelYearMonth, this);
        /* 日历面板相关事件 */
        // 月切换处理
        this.onMonthChangedHandler = $.proxy(onMonthChanged, this);
        // 日历标题点击事件
        this.onCalendarTitleClickHandler = $.proxy(onCalendarTitleClick, this);

        this._init();
    },
    _init: function() {
        this._calendarPanel = ui.getJQueryElement(this.option.calendarPanel);
        if(!this._calendarPanel) {
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
        this._selectTextClass = "date-text";
        this._clearClass = "ui-date-chooser-clear";
        this._clear = $.proxy(function () {
            this.cancelSelection();
        }, this);
        

        // 创建日历内容面板
        this._initCalendarPanel();
        // 创建年月选择面板
        this._initYearMonthPanel();
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
        // 标题文字
        yearTitle.append("<div class='date-chooser-title'><span id='yearTitle'>" + this._language.year + "</span></div>");
        // 前进
        next = $("<div class='date-chooser-next'/>");
        next.click({ value: 10 }, this.onYearChangedHandler);
        yearTitle.append(next);
        // 清除浮动
        yearTitle.append($("<br clear='left' />"));
        // 年
        this._settingPanel.append(this._createYearPanel());
        // 月标题
        monthTitle = $("<div class='set-title font-highlight' style='text-align:center;height:27px;line-height:27px;' />");
        html = [];
        html.push("<fieldset class='title-fieldset border-highlight'>");
        html.push("<legend class='title-legend font-highlight'>", this._language.month, "</legend>");
        html.push("</fieldset>")
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
        this._yearsTable = $("<table class='date-chooser-year-table' cellpadding='0' cellspacing='0' />");
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
        this._monthsTable = $("<table class='date-chooser-month-table' cellpadding='0' cellspacing='0' />");
        this._monthsTable.click(this.onMonthSelectedHandler);
        tbody = $("<tbody />");
        index = 0;
        for (i = 0; i < 3; i++) {
            tr = $("<tr />");
            for (j = 0; j < 4; j++) {
                td = $("<td class='date-chooser-month-td' />");
                td.html(this._language.months[index]);
                    td.data("month", index++);
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
    _createCalendarPanel: function() {
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
        prev.click({ month: -1 }, this.onMonthChangedHandler);
        titlePanel.append(prev);
        // 标题
        dateTitle = $("<div class='date-chooser-title' />");
        this._linkBtn = $("<a href='javascript:void(0)' class='date-chooser-title-text font-highlight' />");
        this._linkBtn.html(calendarTitleFormatter.call(this, this._year, this._month));
        this._linkBtn.click(this.onCalendarTitleClickHandler);
        titlePanel.append(dateTitle);
        // 前进
        next = $("<div class='date-chooser-next' />");
        next.click({ month: 1 }, this.onMonthChangedHandler);
        titlePanel.append(next);

        return titlePanel;
    },
    _createDatePanel: function() {

    },
    _createCtrlPanel: function() {

    },

    _createButton: function (eventFn, innerHtml, className, css) {
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
        btn.click(eventFn);
        return btn;
    },

    // API
    isDateTime: function() {
        return !!this.option.isDateTime;
    }
});

$.fn.dateChooser = function() {

};


})(jQuery, ui);

// Source: ui/control/select/selection-list.js

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
    value = this[arr[i]];
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
function defaultItemFormatter() {
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
    while((nodeName = elem.nodeName()) !== "LI" 
            && !elem.hasClass("ui-selection-list-li")) {

        if(elem.hasClass("ui-selection-list-panel")) {
            return;
        }
        elem = elem.parent();
    }
    this._selectItem(elem);
}

ui.define("ui.ctrls.SelectionList", ui.ctrls.DropDownBase, {
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
            itemFormatter: null
        };
    },
    _defineEvents: function() {
        return ["selecting", "selected", "cancel"];
    },
    _create: function() {
        var fields, fieldMethods;
        this._super();

        this._current = null;
        this._selectList = [];

        fields = [this.option.valueField, this.option.textField],
        fieldMethods = ["_getValue", "_getText"];

        fields.forEach(function(item) {
            if(Array.isArray(item, index)) {
                this[fieldMethods[index]] = getArrayValue;
            } else if($.isFunction(item)) {
                this[fieldMethods[index]] = item;
            } else {
                this[fieldMethods[index]] = getValue;
            }
        }, this);

        //事件函数初始化
        this.onItemClickHandler = $.proxy(this.onItemClick);

        this._init();
    },
    _init: function() {
        this.listPanel = $("<div class='ui-selection-list-panel border-highlight' />");
        this.listPanel.click(this.onItemClickHandler);

        this.wrapElement(this.element, this.listPanel);

        this._showClass = "ui-selection-list-show";
        this._clearClass = "ui-selection-list-clear";
        this._clear = function() {
            this.cancelSelection();
        };
        this._selectTextClass = "select-text";

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
        return parseInt(li.getAttribute(indexAttr), 10);
    },
    _getSelectionData: function(li) {
        var index = this._getItemIndex(li),
            data = {},
            viewData = this.getViewData();
        data.itemData = viewData[index];
        data.itemIndex = index;
        return data;
    },
    _selectItem: function(elem, selectionStatus, isFire) {
        var eventData,
            checkbox,
            i, len;

        eventData = this._getSelectionData(elem[0]);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;
        
        // 当前是要选中还是取消选中
        if(ui.core.isBoolean(selectionStatus)) {
            eventData.selectionStatus = selectionStatus;
        } else {
            if(this.isMultiple()) {
                eventData.selectionStatus = !elem.hasClass(selectedClass);
            } else {
                eventData.selectionStatus = true;
            }
        }
        
        if(this.fire("selecting", eventData) === false) {
            return;
        }

        if(this.isMultiple()) {
            // 多选
            checkbox = elem.find("." + checkboxClass);
            if(!eventData.selectionStatus) {
                // 当前要取消选中，如果本来就没选中则不用取消选中状态了
                if(!isChecked.call(this, checkbox)) {
                    return;
                }
                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if(this._selectList[i] === elem[0]) {
                        setChecked.call(this, checkbox, false);
                        this._selectList.splice(i, 1);
                        return;
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
                    .removeClass(selectionClass)
                    .removeClass("background-highlight");
            }
            this.current = elem;
            this._current
                .addClass(selectionClass)
                .addClass("background-highlight");
        }

        if(isFire === false) {
            return;
        }
        this.fire("selected", eventData);
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
            return this._getValue.call(item, this.option.valueField) === this._getValue.call(value, this.option.valueField)
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
            this.fire("selected", eventData);
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
                    .removeClass(selectionClass)
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
        return Array.isArray(this.option.viewData) 
            ? this.option.viewData 
            : [];
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

// Source: ui/control/select/selection-tree.js

(function($, ui) {
/**
 * 树形下拉列表，可以完美的解决多级联动下拉列表的各种弊端
 * 支持单项选择和多项选择
 */

var selectedClass = "ui-selection-tree-selected",
    checkboxClass = "ui-selection-tree-checkbox",
    flodClass = "fold-button",
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
    value = this[arr[i]];
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
        nodeData;

    if(this.isMultiple()) {
        e.stopPropagation();
    }

    elem = $(e.target);
    if(elem.hasClass(foldClass)) {
        this.onTreeFoldClickHandler(e);
        return;
    }

    while((nodeName = elem.nodeName()) !== "DT"
            && !elem.hasClass("ui-selection-tree-dt")) {
        
        if(elem.hasClass("ui-selection-tree-panel")) {
            return;
        }
        elem = elem.parent();
    }

    nodeData = this._getNodeData(elem);
    if(this.option.nodeSelectable === true || !this._hasChildren(nodeData)) {
        this._selectItem(elem, nodeData);
    } else {
        e.stopPropagation();
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

ui.define("ui.ctrls.SelectionTree", {
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
            // 是否只能选择叶节点
            nodeSelectable: false,
            // 默认展开的层级，false|0：显示第一层级，true：显示所有层级，数字：显示的层级值(0表示根级别，数值从1开始)
            defaultExpandLevel: false,
            // 是否延迟加载，只有用户展开这个节点才会渲染节点下面的数据（对大数据量时十分有效）
            lazy: false,
            // 内容格式化器，可以自定义内容
            itemFormatter: null
        };
    },
    _defineEvents: function() {
        return ["selecting", "selected", "cancel"];
    },
    _create: function() {
        var fields, fieldMethods;

        this._super();
        this._current = null;
        this._selectList = [];
        this._treePrefix = "selectionTree_" + (++instanceCount) + "_";
        
        fields = [this.option.valueField, this.option.textField, this.option.parentField];
        fieldMethods = ["_getValue", "_getText", "_getParent"];
        fields.forEach(function(item) {
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
                    this.option.defaultExpandLevel <= 0
                        ? 0 
                        : this.option.defaultExpandLevel;
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

            this.onTreeFoldClickHandler = $.proxy(onTreeFoldLazyClick, this);
            this.option.lazy = true;
        } else {
            this.onTreeFoldClickHandler = $.proxy(onTreeFoldClick, this);
            this.option.lazy = false;
        }

        if(!ui.core.isFunction(this.option.itemFormatter)) {
            this.option.itemFormatter = defaultItemFormatter;
        }

        this.onTreeItemClickHandler = $.proxy(onTreeItemClick, this);

        this._init();
    },
    
    _init: function() {
        this.treePanel = $("<div class='ui-selection-tree-panel border-highlight' />");
        this.treePanel.click(this.onTreeItemClickHandler);
        this.wrapElement(this.element, this.treePanel);

        this._showClass = "ui-selection-tree-show";
        this._clearClass = "ui-selection-tree-clear";
        this._clear = function() {
            this.cancelSelection();
        };
        this._selectTextClass = "select-text";

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
            dt.prop("id", id);
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
                    cbx.css("margin-left", tempMargin + flodButtonLeft + "px");
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
        var children = this._getChildren(nodeData);
        this._appendChildren(dt, dd, nodeData, children);
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
        return data;
    },
    _selectItem: function(elem, nodeData, selectionStatus, isFire) {
        var eventData,
            checkbox,
            i, len;

        eventData = this._getSelectionData(elem, nodeData);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        // 当前是要选中还是取消选中
        if(ui.core.isBoolean(selectionStatus)) {
            eventData.selectionStatus = selectionStatus;
        } else {
            if(this.isMultiple()) {
                eventData.selectionStatus = !elem.hasClass(selectedClass);
            } else {
                eventData.selectionStatus = true;
            }
        }

        if(this.fire("selecting", eventData) === false) {
            return;
        }

        if(this.isMultiple()) {
            // 多选
            checkbox = elem.find("." + checkboxClass);
            if(!eventData.selectionStatus) {
                // 当前要取消选中，如果本来就没选中则不用取消选中状态了
                if(!isChecked.call(this, checkbox)) {
                    return;
                }
                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if(this._selectList[i] === elem[0]) {
                        setChecked.call(this, checkbox, false);
                        this._selectList.splice(i, 1);
                        return;
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
                    .removeClass(selectionClass)
                    .removeClass("background-highlight");
            }
            this.current = elem;
            this._current
                .addClass(selectionClass)
                .addClass("background-highlight");
        }

        if(isFire === false) {
            return;
        }
        this.fire("selected", eventData);
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

        for(i = 0, len = viewData.length; i < len; i++) {
            item = viewData[i];
            id = path ? (path + "_" + i) : ("" + i);
            
            for(j = 0; j < values.length; j++) {
                if(this._equalValue(item, values[j])) {
                    outArguments.dt = this._selectNodeByValue(item, id);
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
        var dt, tempId, needAppendElements, athArray,
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
                tempId = "#" + this._treePrefix + pathArray.join("_")
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
        while (treeNodeDD.nodeName() === "DD" 
                && treeNodeDD.hasClass("ui-selection-tree-dd")) {

            treeNodeDT = treeNodeDD.prev();
            if (treeNodeDD.css("display") === "none") {
                this._setChildrenExpandStatus(treeNodeDT, true);
            }
            treeNodeDD = treeNodeDT.parent().parent();
        }
        this._selectItem(dt, nodeData, true, false);
        return dt;
    },
    _selectChildNode: function (nodeData, dt, selectionStatus) {
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
            this._selectItem(dt, nodeData, selectionStatus, false);
            this._selectChildNode(nodeData, dt, selectionStatus);
        }
    },
    _selectParentNode: function (nodeData, nodeId, selectionStatus) {
        var parentNodeData, parentId,
            elem, nextElem, dtList, 
            i, len, checkbox;

        parentNodeData = nodeData[parentNode];
        if (!parentNodeData) {
            return;
        }
        parentId = nodeId.substring(0, nodeId.lastIndexOf("_"));
        elem = $("#" + parentId);
        if (!selectionStatus) {
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
        this._selectItem(elem, parentNodeData, selectionStatus, false);
        this._selectParentNode(parentNodeData, parentId, selectionStatus);
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
        viewData = this.getViewData();
        this._selectTreeByValues(viewData, values, 0, null, outArguments);
        if(outArguments.elem) {
            eventData = this._getSelectionData(outArguments.elem);
            eventData.element = outArguments.elem;
            eventData.originElement = null;
            this.fire("selected", eventData);
        }
    },
    /** 选择一个节点的所有子节点 */
    selectChildNode: function(nodeElement, selectionStatus) {
        var nodeData;
        if(arguments.length === 1) {
            selectionStatus = true;
        } else {
            selectionStatus = !!selectionStatus;
        }

        nodeData = this._getNodeData(nodeElement);
        if(nodeData) {
            return;
        }
        if(!this.isMultiple() || this.option.nodeSelectable !== true) {
            return;
        }
        this._selectChildNode(nodeData, nodeElement, selectionStatus);
    },
    /** 选择一个节点的所有父节点 */
    selectParentNode: function(nodeElement) {
        var nodeData,
            nodeId;
        if(arguments.length === 1) {
            selectionStatus = true;
        } else {
            selectionStatus = !!selectionStatus;
        }

        nodeData = this._getNodeData(nodeElement);
        if(nodeData) {
            return;
        }
        if(!this.isMultiple() || this.option.nodeSelectable !== true) {
            return;
        }
        nodeId = nodeElement.prop("id");
        this._selectParentNode(nodeData, nodeId, selectionStatus);
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
                    .removeClass(selectionClass)
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
        return Array.isArray(this.option.viewData) 
            ? this.option.viewData 
            : [];
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

// Source: ui/control/select/selection-tree4autocomplete.js

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

    while((nodeName = elem.nodeName()) !== "DT" 
            && !elem.hasClass("autocomplete-dt")) {
        
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


ui.define("ui.ctrls.AutocompleteSelectionTree", ui.ctrls.SelectionTree, {
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
        this.onFocusHandler = $.proxy(onFocus, this);
        this.onKeyupHandler = $.proxy(onKeyup, this);
        this.onMouseoverHandler = $.proxy(onMouseover, this);
        this.onClickHandler = $.proxy(onClick, this);
        this.onTextinputHandler = $.proxy(onTextinput, this);

        this._super();
    },
    _init: function() {
        var oldFireFn;

        this._super();
        this.element
            .off("focus")
            .on("focus", this.onFocusHandler)
            .on("keyup", this.onKeyupHandler);

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
            nodeData = data[i];
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
            html.push("<dt data-path='" + info[i].path + "'>");
            html.push("<span class='normal-text'>");
            textHtml = this._getText.call(info[i].nodeData, this.option.textField);
            textHtml = textHtml.replace(re, hintHtml);
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
                this.fire("selected", dt, this._getSelectionData(this._getNodeData(dt)));
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
    return ui.ctrls.autocompleteSelectionTree(option, this);
};


})(jQuery, ui);

// Source: ui/control/view/calendar-view.js

(function($, ui) {
// CalendarView


})(jQuery, ui);

// Source: ui/control/view/card-view.js

(function($, ui) {
// CardView

var selectedClass = "ui-card-view-selection";
    frameBorderWidth = 4;

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
    this._selectItem(elem);
}

ui.define("ui.ctrls.CardView", {
    _defineOption: function() {
        return {
            // 视图数据
            viewData: null,
            // 没有数据时显示的提示信息
            promptText: "没有数据",
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
        var events = ["selecting", "selected", "deselected", "rebind", "cencel"];
        if(this.option.pager) {
            events.push("pagechanging");
        }
        return events;
    },
    _create: function() {
        this._selectList = [];
        this._hasPrompt = !!this.option.promptText;
        this._columnCount = 0;

        this.viewBody = null;
        this.pagerHeight = 30;

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
        this.onBodyClickHandler = $.proxy(onBodyClick, this);

        this._init();
    },
    _init: function() {
        if(!this.element || this.element.length === 0) {
            return;
        }

        this._initBorderWidth();
        this._initDataPrompt();

        this.viewBody = $("<div class='ui-card-view-body' />");
        this.element.append(this.viewBody);
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
            this.gridBody.append(this._dataPrompt);
        }
    },
    _initPagerPanel: function() {
        if(this.pager) {
            this.gridFoot = $("<div class='ui-card-view-foot clear' />");
            this.element.append(this.gridFoot);
            
            this.pager.pageNumPanel = $("<div class='page-panel' />");
            if (this.option.pager.displayDataInfo) {
                this.pager.pageInfoPanel = $("<div class='data-info' />");
                this.gridFoot.append(this.pager.pageInfoPanel)
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
    _rasterizeItems: function(arr, fn) {
        var marginInfo,
            i, j,
            index,
            top, left,
            isFunction,
            rows;

        if(arr.length == 0) {
            return;
        }
        marginInfo = this._getMargin(arr.length);
        this._columnCount = marginInfo.count;
        if(marginInfo.count == 0) return;
        
        isFunction = ui.core.isFunction(fn);
        rows = Math.floor((arr.length + marginInfo.count - 1) / marginInfo.count);
        this.viewPanel.css("height", (rows * (this.option.itemHeight + marginInfo.margin) + marginInfo.margin) + "px");
        for(i = 0; i < rows; i++) {
            for(j = 0; j < marginInfo.count; j++) {
                index = (i * marginInfo.count) + j;
                if(index >= arr.length) {
                    return;
                }
                top = (i + 1) * marginInfo.margin + (i * this.option.itemHeight);
                left = (j + 1) * marginInfo.margin + (j * this.option.itemWidth);
                if(isFunction) {
                    fn.call(this, arr[index], index, top, left);
                }
            }
        }
    },
    _getMargin: function(length, scrollHeight) {
        var currentWidth = this.viewBody.width(),
            currentHeight = this.viewBody.height(),
            result,
            restWidth,
            flag,
            checkOverflow = function(len, res) {
                if(res.count == 0) {
                    return res;
                }
                var sh = Math.floor((len + res.count - 1) / res.count) * (res.margin + this.option.itemHeight) + res.margin;
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
        if(result.margin >= 3) {
            return flag ? result : checkOverflow.call(this, length, result);
        }
        result.margin = 3;

        result.count = Math.floor((currentWidth - ((result.count + 1) * result.margin)) / this.option.itemWidth);
        restWidth = currentWidth - result.count * this.option.itemWidth;
        result.margin = Math.floor(restWidth / (result.count + 1));

        return flag ? result : checkOverflow.call(this, length, result);
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
    _recomposeItems: function() {
        var arr;
        if(!this.bodyPanel)
            return;
        
        arr = this.bodyPanel.children();
        this._rasterizeItems(arr, function(item, index, top, left) {
            $(item).css({
                "top": top + "px",
                "left": left + "px"
            });
        });
    },
    _getSelectionData: function(elem) {
        var index,
            data,
            viewData;

        index = parseInt(elem.attr("data-index"), 10);
        viewData = this.getViewData();
        data = {
            itemIndex: index,
            itemData: viewData[index]
        };
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
        if(!this.bodyPanel) {
            return null;
        }
        var items = this.bodyPanel.children();
        var item = items[index];
        if(item) {
            return $(item);
        }
        return null;
    },
    _updateIndexes: function(start) {
        if(start < 0) {
            start = 0;
        }
        children = this.bodyPanel.children();
        for(var i = start, len = children.length; i < len; i++) {
            $(children[i]).attr("data-index", i);
        }
    },
    _promptIsShow: function() {
        return this._hasPrompt 
            && this._dataPrompt.css("display") === "block";
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
    /** */
    fill: function(viewData, rowCount) {
        var isRebind;

        isRebind = false;
        if(!this.bodyPanel) {
            this.bodyPanel = $("<div class='body-panel'/>");
            if(this.option.selection)
                this.bodyPanel.click(this.onBodyClickHandler);
            this.viewBody.append(this.bodyPanel);
        } else {
            this.viewBody.scrollTop(0);
            this.clear(false);
            isRebind = true;
        }

        if(!Array.isArray(viewData)) {
            viewData = [];
        }
        this.option.viewData = viewData;

        if(viewData.length == 0) {
            this._showDataPrompt();
            return;
        } else {
            this._hideDataPrompt();
        }

        this._rasterizeItems(viewData, function(itemData, index, top, left) {
            var elem = this._createItem(itemData, index);
            elem.css({
                "top": top + "px",
                "left": left + "px"
            });
            this._renderItem(elem, itemData, index);
            this.bodyPanel.append(elem);
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
        var i, len;
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
    removeAt: function(index) {
        var elem;

        if(!ui.core.isNumber(index) || index < 0 || index >= this.count()) {
            return;
        }

        elem = this._getItemElement(index);
        if(elem) {
            if(this._current && this._current[0] === elem[0]) {
                this._current = null;
            }
            item.remove();
            this._updateIndexes(index);

            this.option.viewData.splice(index, 1);
            this._recomposeItems();
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
            elem;
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

        elem = this._createItem(itemData, viewData.length);
        this._renderItem(elem, itemData, viewData.length);
        this.bodyPanel.append(elem);
        viewData.push(itemData);
        this._recomposeItems();
    },
    /** 插入项目 */
    insertItem: function(index, itemData) {
        var elem,
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
            elem = this._createItem(itemData, index);
            this._renderItem(elem, itemData, index);
            this._getItemElement(index).before(elem);
            viewData.splice(index, 0, itemData);
            
            this._updateIndexes();
            this._recomposeItems();
        } else {
            this.addItem(itemData);
        }
    },
    /** 获取视图数据 */
    getViewData: function() {
        return Array.isArray(this.option.viewData) 
            ? this.option.viewData 
            : [];
    },
    /** 获取当前尺寸下一行能显示多少个元素 */
    getColumnCount: function() {
        return this._columnCount;
    },
    /** 获取项目数 */
    count: function() {
        return Array.isArray(this.option.viewData)
            ? 0
            : this.option.viewData.length;
    },
    /** 是否可以选择 */
    isSelectable: function() {
        return !!this.option.selection;
    },
    /** 是否支持多选 */
    isMultiple: function() {
        return this.option.selection.multiple === true;
    },
    /** 清空表格数据 */
    clear: function() {
        if (this.bodyPanel) {
            this.bodyPanel.html("");
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
            height -= this.columnHeight + this.borderHeight;
            if(this.pager) {
                height -= this.pagerHeight;
            }
            this.gridBody.css("height", height + "px");
            needRecompose = true;
        }
        if(ui.core.isNumber(width)) {
            width -= this.borderWidth;
            this.element.css("width", width + "px");
            needRecompose = true;
        }
        if(needRecompose) {
            this._recomposeItems();
        }
        if(this._promptIsShow()) {
            this._setPromptLocation();
        }
    }
});

$.fn.cardView = function() {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.CardView(option, this);
};


})(jQuery, ui);

// Source: ui/control/view/grid-view-group.js

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
        this.onGroupRowClickHandler = $.proxy(onGropRowClick, this);
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
        
        if(!Array.isArray(list) || list.length == 0) {
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

// Source: ui/control/view/grid-view-tree.js

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
    rowIndex = btn.parent().parent()[0].rowIndex,
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
        
        this.onFoldButtonClickHandler = $.proxy(onFoldButtonClick, this);
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
            arguments.callee.call(this, parent, rowIndex, count);
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
            if (isTreeNode(item)) {
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
            row, item,
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
                arguments.callee.call(this, item[childrenField], action);
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
                arguments.callee.call(this, item[childrenField], listTree, item, level + 1);
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
        if (!Array.isArray(list) || list.length == 0)
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
        if (!Array.isArray(list) || list.length == 0)
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
            if(level == 0) {
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
        if (isTreeNode(item)) {
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
            this.gridview._createCells(row, item, currRowIndex);
            if (currRowIndex < viewData.length - 1) {
                $(this.gridview.tableBody[0].rows[currRowIndex]).before(row);
            } else {
                this.gridview.tableBody.append(row);
            }

            currRowIndex++;
        }
        this.gridview._updateScrollState();
        this.gridview.refreshRowNumber(currRowIndex - 1);

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

// Source: ui/control/view/grid-view.js

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

var columnCheckboxAllFormatter = ui.ColumnStyle.cnfn.columnCheckboxAll,
    checkboxFormatter = ui.ColumnStyle.cfn.checkbox,
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
        colIndex = this._getColumnIndexByFormatter(columnCheckboxAllFormatter);
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
    if (!Array.isArray(viewData) || viewData.length == 0) {
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

    fn = $.proxy(sorting, this);
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

    cellIndex = cbxAll.parent().prop("cellIndex");
    if(cellIndex === -1) {
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
                    elem = elem.parent();
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


ui.define("ui.ctrls.GridView", {
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
        var events = ["selecting", "selected", "deselected", "rebind", "cencel"];
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
        this.onSortHandler = $.proxy(onSort, this);
        // 行或者单元格点击事件
        this.onTableBodyClickHandler = $.proxy(onTableBodyClick, this);
        // 全选按钮点击事件
        this.onCheckboxAllClickHandler = $.proxy(onCheckboxAllClick, this);
        // 横向滚动条同步事件
        this.onScrollingXHandler = $.proxy(onScrollingX, this);

        this._init();
    },
    _init: function() {
        if(!this.element.hasClass("ui-grid-view")) {
            this.element.addClass("ui-grid-view");
        }
        this._initBorderWidth();
        this._initDataPrompt();

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
        }

        // 表头
        this.gridHead = $("<div class='ui-grid-head' />");
        this.element.append(this.gridHead);
        // 表体
        this.gridBody = $("<div class='ui-grid-body' />");
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
                this.gridFoot.append(this.pager.pageInfoPanel)
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
            c = this.gridColumns[i];
            formatter = c.formatter;
            if (!ui.core.isFunction(c.formatter)) {
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
                value[c.column[i]] = this._getValue(rowData, c.column[i], c);
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
        var value = rowData[arr[i]];
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
    _createCell: function() {
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
            this.sorterIndexes.push(index);
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
        } else {
            startRowIndex += 1;
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
    _getColumnIndexByFormatter: function(formatter) {
        var i, 
            len = this.option.columns.length;
        for(i = 0; i < len; i++) {
            if(this.option.columns[i].formatter === rowNumber) {
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
            match = ex.match(atttibutes);
            if(match) {
                ex = ex.match(tag)[1];
                if(ex === tagName) {
                    return !(elem.attr(match[1]) === match[4]);
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
                        checkbox = this.option.selection.type === "cell"
                            ? $(elem.parent()[0].cells[colIndex])
                            : $(elem[0].cells[colIndex]);
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
                if(this_current[0] === elem[0]) {
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
        return this._hasPrompt 
            && this._dataPrompt.css("display") === "block";
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
            if ($.isFunction(c.text)) {
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
        tr.append($("<th class='scroll-cell' />"));
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
            if (this.isSelectable()) {
                this.tableBody.click(this.onTableBodyClickHandler);
            }
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

        if(viewData.length == 0) {
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

        columnIndex = this._getColumnIndexByFormatter(columnCheckboxAllFormatter);
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
            columnIndex = this._getColumnIndexByFormatter(columnCheckboxAllFormatter);
            fn = function(elem) {
                var checkbox;
                if(columnIndex !== -1) {
                    checkbox = this.option.selection.type === "cell"
                        ? $(elem.parent()[0].cells[columnIndex])
                        : $(elem[0].cells[columnIndex]);
                    checkbox = checkbox.find(checkboxClass);
                    setChecked(checkbox, false);
                }
                elem.removeClass(selectedClass).removeClass("background-highlight");
            };
        } else {
            fn = function(elem) {
                elem.removeClass(selectedClass).removeClass("background-highlight");
            }
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
    removeRowAt: function(rowIndex) {
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
        if(this._current && this._current[0] === row[0]) {
            this_current = null;
        }
        row.remove();
        viewData.splice(rowIndex, 1);
        this._updateScrollState();
        this._refreshRowNumber();
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
        this._createCell(row, rowData, viewData.length);
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
            this._refreshRowNumber(sourceIndex - 1, destIndex);
        } else {
            destRow.before($(rows[sourceIndex]));
            this._refreshRowNumber(destIndex - 1, sourceIndex);
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
        return Array.isArray(this.option.viewData) 
            ? this.option.viewData 
            : [];
    },
    /** 获取项目数 */
    count: function() {
        return Array.isArray(this.option.viewData)
            ? 0
            : this.option.viewData.length;
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

// Source: ui/control/view/list-view.js

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
    if(text1 < text2) {
        return -1;
    } else if(text1 > text2) {
        return 1;
    } else {
        return 0;
    }
}
// 点击事件处理函数
function onListItemClick(e) {
    var elem,
        isCloseButton,
        index,
        data;

    elem = $(e.target);
    isCloseButton = elem.hasClass("close-button");
    while(!elem.isNodeName("li")) {
        if(elem.hasClass("ui-list-view-ul")) {
            return;
        }
        elem = elem.parent();
    }

    index = this._getItemIndex(elem[0]);
    if(this.option.hasRemoveButton && isCloseButton) {
        this._removeItem(elem, index);
    } else {
        this._selectItem(elem, index);
    }
}

ui.define("ui.ctrls.ListView", {
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
        this.sorter = Introsort();

        if(!ui.core.isFunction(this.option.itemFormatter)) {
            this.option.itemFormatter = defaultItemFormatter;
        }

        this.option.hasRemoveButton = !!this.option.hasRemoveButton;
        this.onListItemClickHandler = $.proxy(onListItemClick, this);

        this._init();
    },
    _init: function() {
        this.element.addClass("ui-list-view");

        this.listPanel = $("<ul class='ui-list-view-ul' />");
        this.listPanel.click(this.onListItemClickHandler);
        this.element.append(this.listPanel);

        if(this.option.pager) {
            this._initPager(this.option.pager);
        }

        this._initAnimator();
        this.setData(this.option.viewData);
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
            this._createItemHtml(builder, item, i);
            this.option.viewData.push(item);
        }
        this.listPanel.html(itemBuilder.join(""));
    },
    _createItemHtml: function(builder, item, index) {
        var content,
            index,
            temp;
        builder.push("<li ", indexAttr, "='", index, "' class='ui-list-view-item'>");
        content = this.option.itemFormatter.call(this, item, index);
        if(ui.core.isString(content)) {
            builder.push("<div class='ui-list-view-container'>");
            builder.push(content);
            builder.push("</div>");
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
            builder.push("<a href='javascript:void(0)' class='close-button ui-item-view-remove'>×</a>");
        }
    },
    _indexOf: function(item) {
        var i, len,
            viewData = this.getViewData();
        for(i = 0, len = viewData.length; i > len; i++) {
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
        this._itemIndexSet(indexAttr, this._getItemIndex(li) + num);
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
            .done(function() {
                return that.removeSecondAnimator.start();
            })
            .done(function() {
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
        if(!item) {
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
        if(size == 0) {
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
                    this._getSelectionData(this._selectItem[i]));
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
                this._selectItem($(li), index, true, !(i < len - 1));
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
        return Array.isArray(this.option.viewData) 
            ? this.option.viewData 
            : [];
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

// Source: ui/control/view/report-view.js

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

var columnCheckboxAllFormatter = ui.ColumnStyle.cnfn.columnCheckboxAll,
    checkboxFormatter = ui.ColumnStyle.cfn.checkbox,
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
        colIndex = this._getColumnIndexByFormatter(columnCheckboxAllFormatter);
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
    if (!Array.isArray(viewData) || viewData.length == 0) {
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

    fn = $.proxy(sorting, this);
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

    columnInfo = this._getColumnIndexAndTableByFormatter(columnCheckboxAllFormatter);
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

    this._selectItem(elem, selectedClass);
}

ui.define("ui.ctrls.ReportView", {
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
        var events = ["selecting", "selected", "deselected", "rebind", "cencel"];
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
        // 全选按钮点击事件
        this.onCheckboxAllClickHandler = $.proxy(onCheckboxAllClick, this);
        // 滚动条同步事件
        this.onScrollingHandler = $.proxy(onScrolling, this);
        // 固定行点击事件
        this.onTableFixedBodyClickHandler = $.proxy(onTableFixedBodyClick);
        // 数据行点击事件
        this.onTableDataBodyClickHandler = $.proxy(onTableDataBodyClick, this);

        this._init();
    },
    _init: function() {
        if(!this.element.hasClass("ui-report-view")) {
            this.element.addClass("ui-report-view");
        }

        this._initBorderWidth();
        this._initDataPrompt();

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
        }

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
            this.gridBody.append(this._dataPrompt);
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
            onBeginDrag: function() {
                var elem, that, option,
                    elemOffset, panelOffset, left;
                
                elem = $(this.taget);
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
            onMoving: function() {
                var option,
                    that,
                    left;
                
                option = this.option;
                that = option.context;

                left = parseFloat(option.target.css("left"));
                left += this.x;

                if (left < option.leftLimit) {
                    left = option.leftLimit;
                } else if (left > option.rightLimit) {
                    left = option.rightLimit;
                }
                option.endLeft = left;
                option.target.css("left", left + "px");
            },
            onEndDrag: function() {
                var option,
                    that,
                    colIndex, column,
                    width, col;

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
                if(that.tableDataBody) {
                    col = that.tableDataBody.children("colgroup").children()[colIndex];
                    if(col) {
                        col = $(col);
                        col.css("width", width + "px");
                    }
                }
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
                this.reportFoot.append(this.pager.pageInfoPanel)
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
                th = $("<th class='scroll-cell' />");
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
                if (!row || row.length == 0) {
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

                    if (c.column || ui.core.isFunction(c.handler)) {
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
            colGroup.append(this.createCol(c));

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
            colGroup.append(this.createCol(c));
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
            if (!ui.core.isFunction(formatter)) {
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
                value[c.column[i]] = this._getValue(rowData, c.column[i], c);
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
        var value = rowData[arr[i]];
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
            this.sorterIndexes.push(index);
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
            this.dataHeadScrollCol.css("width", ui.scrollbarWidth + 0.1 + "px");
        } else {
            this.dataHeadScrollCol.css("width", "0");
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
        } else {
            startRowIndex += 1;
        }
        rows = columnInfo.tableBody[0].rows;
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
    _getColumnIndexAndTableByFormatter: function(formatter) {
        var result, i, len;
        result = {
            columnIndex: -1,
            columns: null,
            headTable: null,
            bodyTable: null
        };

        if(this.fixedColumns) {
            for(i = 0, len = this.fixedColumns.length; i < len; i++) {
                if(this.fixedColumns[i].formatter === formatter) {
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
                if(this.dataColumns[i].formatter === formatter) {
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
                        checkbox = this.option.selection.type === "cell"
                            ? $(elem.parent()[0].cells[colIndex])
                            : $(elem[0].cells[colIndex]);
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
                if(this_current[0] === elem[0]) {
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
        return this._hasPrompt 
            && this._dataPrompt.css("display") === "block";
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

        columnInfo = this._getColumnIndexAndTableByFormatter(columnCheckboxAllFormatter);
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
            columnInfo = this._getColumnIndexAndTableByFormatter(columnCheckboxAllFormatter);
            fn = function(elem) {
                var checkbox,
                    rowIndex,
                    tr;
                if(columnInfo) {
                    rowIndex = this.option.selection.type === "cell"
                        ? elem.parent()[0].rowIndex
                        : elem[0].rowIndex;
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
            }
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
    removeRowAt: function(rowIndex) {
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
        if(this._current && this._current[0] === row[0]) {
            this_current = null;
        }
        if(this.tableFixedBody) {
            $(this.tableFixedBody[0].rows[rowIndex]).remove();
        }
        row.remove();
        viewData.splice(rowIndex, 1);
        this._updateScrollState();
        this._refreshRowNumber();
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
            this._refreshRowNumber(sourceIndex - 1, destIndex);
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
            this._refreshRowNumber(destIndex - 1, sourceIndex);
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
        return Array.isArray(this.option.viewData) 
            ? this.option.viewData 
            : [];
    },
    /** 获取项目数 */
    count: function() {
        return Array.isArray(this.option.viewData)
            ? 0
            : this.option.viewData.length;
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

// Source: ui/control/view/tab-view.js

(function($, ui) {
// TabView

var selectedClass = "ui-tab-selection";

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
            tabView._current.css("display", "none");
            tabView._current = that.nextView;
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
        var that,
            tabView,
            option,
            isNext,
            cssValue;

        tabView = this.tabView;
        if(this.currentIndex === index) {
            return;
        }

        result = tabView.fire("changing", index);
        if(result === false) {
            return;
        }

        if(animation === false) {
            this.bodySet(index);
            this.fire("changed", index);
            return;
        }

        this.nextView = view;
        cssValue = tabView.isHorizontal ? tabView.bodyWidth : tabView.bodyHeight;
        if(index > this.currentIndex) {
            this.nextView.css(this.animationCssItem, cssValue + "px");
            isNext = true;
        } else {
            this.nextView.css(this.animationCssItem, -cssValue + "px");
            isNext = false;
        }

        option = this.animator[0];
        option.target = tabView._current;
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
        tavView._current.css({
            "display": "block",
            "top": "0",
            "left": "0"
        });
    },
    showIndex: function(index, animation) {
        var tabView;
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
function Tab() {
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
        this.tabPanel.click(function(e) {
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

        tabView = this.tabView;
        if(tabView._current && tabView.tabs) {
            tabView._current
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
            this.bodyShow(index).done(function() {
                that.fire("changed", index);
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
        var tabView;
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

ui.define("ctrls.TabView", {
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
        this._init();
    },
    _init: function() {
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
                if(tab[i] === view[0]) {
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
        this.showIndex(index, !!animation);
    },
    /** 放置视图 */
    putBodies: function(width, height) {
        if(!ui.core.isNumber(width)) {
            width = tabView.bodyPanel.width();
        }
        if(!ui.core.isNumber(height)) {
            height = tabView.bodyPanel.height();
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
function TabManager() {
    if(this instanceof TabManager) {
        this.initialize();
    } else {
        return new TabManager();
    }
}
TabManager.prototype = {
    constructor: TabManager,
    initialize: function() {
        this.tabTools = [];
        this.tabLoadStates = [];
        this.tabChanging = function (e, index) {
            this.showTools(index);
        };
        this.tabChanged = null;
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
                    if (elem[elem.length - 1].length == 0) {
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
        i = 3, len = arguments.length;
        for(; i < len; i++) {
            args.push(arguments[i]);
        }
        if(!this.tabLoadStates[index]) {
            func.apply(caller, args);
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

// Source: ui/control/view/tree-view.js

(function($, ui) {

/**
 * 树形列表
 */

ui.define("ui.ctrls.TreeView", {
    _init: function() {
        var position;

        this.treePanel = this.element;
        position = this.treePanel.css(position);
        
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

// Source: ui/control/tools/uploader.js

(function($, ui) {
// uploader
/**
 * HTML上传工具，提供ajax和iframe两种机制，自动根据当前浏览器特性进行切换
 * 这个工具需要配合后台接口完成，可以接入自定义的后台
 */

// 用于生成Id
var counter = 0;

// ajax上传
function ajaxUpload() {
    var upload,
        completed,
        that = this;

    completed = function (xhr, context) {
        var errorMsg = null,
            fileInfo;
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                fileInfo = JSON.parse(xhr.responseText);
                if (context.isEnd) {
                    that.percent = 100.0;
                    that.fire("progressing", that.percent);
                    that.fire("uploaded", getEventData.call(that, fileInfo));
                } else {
                    upload(context.fileName, context.end, context.file, context.total, fileInfo.FileId);
                }
            } else {
                try {
                    errorMsg = $.parseJSON(xhr.responseText);
                    errorMsg = errorMsg.ErrorMessage || errorMsg.errorMessage || errorMsg.message;
                    if(!errorMsg) 
                        errorMsg = "服务器没有返回错误信息。";
                } catch(e) {
                    errorMsg = "服务器返回的错误信息不是JSON格式，无法解析。";
                }
                if (xhr.status == 404) {
                    errorMsg = "请求地址不存在，" + errorMsg;
                } else if (xhr.status == 401) {
                    errorMsg = "没有登录，" + errorMsg;
                } else if (xhr.status == 403) {
                    errorMsg = "没有上传权限，" + errorMsg;
                } else {
                    errorMsg = "上传错误，" + errorMsg;
                }
                that.fire(error, errorMsg);
            }
        }
    };

    upload = function (fileName, index, file, total, fileId) {
        var isEnd, end, chunk,
            xhr, context;

        that.percent = Math.floor(index / total * 1000) / 10;
        that.fire(progressing, that.percent);

        isEnd = false;
        end = index + that.chunkSize;
        chunk = null;
        if (end >= total) {
            end = total;
            isEnd = true;
        }

        if ("mozSlice" in file) {
            chunk = file.mozSlice(index, end);
        } else if ("webkitSlice" in file) {
            chunk = file.webkitSlice(index, end);
        } else {
            chunk = file.slice(index, end);
        }

        xhr = new XMLHttpRequest();
        context = {
            isEnd: isEnd,
            fileName: fileName,
            index: index,
            end: end,
            file: file,
            total: total
        };
        xhr.onload = function() {
            completed.call(arguments.callee.caller, xhr, context);
        };
        xhr.open("POST", that.option.url, true);
        xhr.setRequestHeader("X-Request-With", "XMLHttpRequest");
        xhr.setRequestHeader("X-File-Index", index);
        xhr.setRequestHeader("X-File-End", end);
        xhr.setRequestHeader("X-File-Total", total);
        xhr.setRequestHeader("X-File-IsEnd", isEnd + ui.str.empty);
        xhr.setRequestHeader("X-File-Name", encodeURIComponent(fileName));
        if (fileId) {
            xhr.setRequestHeader("X-File-Id", fileId);
        }
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.send(chunk);
    };

    this.doUpload = function () {
        var files = this.inputFile[0].files,
            file = files[0];
        if (!files || files.length == 0) {
            return;
        }
        var fileName = file.fileName || file.name,
            index = 0,
            total = file.size;
        upload(fileName, index, file, total);
    };
}
// 表单无刷新上传
function fromUpload() {
    var div = $("<div class='ui-uploader-panel' />"),
        iframeId = "uploadFrameId_" + this._uploaderId;
    this._iframe = $("<iframe class='form-upload-iframe' />");

    this._form = $("<form />");
    this._form.attr("method", "post");
    this._form.attr("action", this.option.url);
    this._form.attr("enctype", "multipart/form-data");
    this._form.attr("target", iframeId);

    this._iframe.prop("id", iframeId);
    this._iframe.prop("name", iframeId);

    this._inputText = $("<input type='text' value='' style='position:absolute;left:-9999px;top:-9999px' />");
    (document.body || document.documentElement).insertBefore(this.inputText[0], null);

    div.append(this._iframe);
    div.append(this._form);
    $(document.body).append(div);

    this._iframe.load($.proxy(function () {
        var contentWindow,
            fileInfo,
            errorMsg;

        this.percent = 100.0;
        this.fire("progressing", this.percent);

        contentWindow = this._iframe[0].contentWindow;
        fileInfo = contentWindow.fileInfo,
        errorMsg = contentWindow.error;
        if (!fileInfo && !errorMsg) {
            return;
        }
        if (errorMsg) {
            errorMsg = error.errorMessage || "上传发生错误";
            this.fire(error, errorMsg);
            return;
        } else {
            this.fire("uploaded", getEventData.call(this, fileInfo));
        }
    }, this));
    this.doUpload = function () {
        this._form.append(this._inputFile);

        // 为了让视觉效果好一点，直接从20%起跳
        this.percent = 20.0;
        this.fire("progressing", this.percent);

        this._form.submit();
        this._uploadPanel.append(this._inputFile);
        this._inputText.focus();
    };
}

function getEventData(fileInfo) {
    if(!fileInfo) {
        fileInfo = {};
    }
    fileInfo.extension = this.extension;
    fileInfo.fileName = this.fileName;

    return fileInfo;
}

function onInputFileChange(e) {
    var path;
    
    this._reset();
    path = this._inputFile.val();
    if (path.length === 0) {
        return false;
    }
    if (!this.checkFile(path)) {
        showMessage("文件格式不符合要求，请重新选择");
        this._inputFile.val("");
        return false;
    }
    
    if(this.fire(uploading, path) === false) {
        return;
    }

    this.doUpload();
    this._inputFile.val("");
}

function showMessage(msg) {
    if(ui.core.isFunction(ui.messageShow)) {
        ui.messageShow(msg);
        return;
    }
    if(ui.core.isFunction(ui.msgshow)) {
        ui.msgshow(msg);
        return;
    }
    alert(msg);
}

ui.define("ui.ctrls.Uploader", {
    _defineOption: function() {
        return {
            // 上传文件服务的路径
            url: null,
            // 文件过滤器，默认可以上传所有文件。例：*.txt|*.docx|*.xlsx|*.pptx
            filter: "*.*"
        };
    },
    _defineEvents: function() {
        return ["uploading", "upload", "progressing", "error"];
    },
    _create: function() {
        this._uploaderId = ++id;
        this._form = null;
        this._inputFile = null;

        // 初始化事件处理函数
        this.onInputFileChangeHandler = $.proxy(onInputFileChange, this);

        this._reset();
        this._init();
    },

    _init: function() {
        this._prepareUploadMode();
        this._initUploadButton();
        this._initUpload();
    },
    _prepareUploadMode: function() {
        var xhr = null;
        try {
            xhr = new XMLHttpRequest();
            this._initUpload = ajaxUpload;
            xhr = null;
            //upload file size
            this.chunkSize = 512 * 1024;
        } catch (e) {
            this._initUpload = formUpload;
        }
    },
    _initUploadButton: function() {
        var wrapperCss = {},
            upBtn = this.element,
            wrapper;

        this._inputFile = $("<input type='file' class='ui-uploader-input-file' value='' />");
        this._inputFile.prop("id", "inputFile_" + this._uploaderId);
        this._inputFile
            .attr("name", this._uploaderId)
            .attr("title", "选择上传文件");
        this._inputFile.change(this.onInputFileChangeHandler);
        // 如果不支持文件二进制读取
        if (!this.inputFile[0].files) {
            this._initUpload = formUpload;
        }

        ui.core.each("", function(rule) {
            wrapperCss[rule] = upBtn.css(rule);
        });
        if(wrapperCss.position !== "absolute" 
            && wrapperCss.position !== "relative" 
            && wrapperCss.position !== "fixed") {
            
            wrapperCss.position = "relative";
        }
        wrapperCss["overflow"] = "hidden";
        wrapperCss["width"] = upBtn.outerWidth() + "px";
        wrapperCss["height"] = upBtn.outerHeight() + "px";

        wrapper = $("<div />").css(wrapperCss);
        wrapper = upBtn.css({
            "margin": "0",
            "top": "0",
            "left": "0",
            "right": "auto",
            "bottom": "auto"
        }).wrap(wrapper).parent();

        this._uploadPanel = $("<div class='ui-uploader-file' />");
        this._uploadPanel.append(this._inputFile);
        wrapper.append(this._uploadPanel);
    },
    _reset: function() {
        this.filePath = null;
        this.extension = null;
        this.fileName = null;
        this.percent = 0.0;
    },

    /// API
    // 检查文件类型是否符合
    checkFile: function(path) {
        var index = path.lastIndexOf(".");
        if (index === -1) {
            return false;
        }
        this.fileName = 
            path.substring(path.lastIndexOf("\\") + 1, index),
        this.extension = 
            path.substring(index).toLowerCase().trim();

        if (this.option.filter === "*.*") {
            return true;
        }
        
        return this.option.filter.indexOf(this.extension) !== -1;
    }
});

$.fn.uploader = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Uploader(option, this);
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


// Source: ui/viewpage/master.js

(function($, ui) {
/*
    Master 模板页
 */

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
    //当前页面是否加载了导航菜单
    noMenu: true,
    //内容区域宽度
    contentBodyWidth: 0,
    //内容区域高度
    contentBodyHeight: 0,

    init: function() {
        this.toolbar = {
            height: 40,
            extendHeight: 0
        };
        var that = this;
        ui.page.ready(function (e) {
            that._initElements();
            that._initContentSize();
            that._initUserSettings();
            ui.page.resize(function (e, clientWidth, clientHeight) {
                that._initContentSize();
            }, ui.eventPriority.bodyResize);
            
            if(window.pageLogic) {
                that.pageInit(pageLogic.init, pageLogic);
            }
        }, ui.eventPriority.masterReady);
    },
    _initElements: function () {
    },
    _initContentSize: function() {
        var clientWidth = document.documentElement.clientWidth,
            clientHeight = document.documentElement.clientHeight;
        this.head = $("#head");
        this.body = $("#body");
        if(this.head.length > 0) {
            clientHeight -= this.head.height();
        }
        var bodyMinHeight = clientHeight;
        this.body.css("height", bodyMinHeight + "px");
        this.contentBodyHeight = bodyMinHeight;
        this.contentBodyWidth = clientWidth;
    },
    _initUserSettings: function() {

    },
    /** 初始化页面方法 */
    pageInit: function (initObj, caller) {
        var func = null,
            caller = caller || this;
        var message = ["页面初始化时在[", "", "]阶段发生错误，", ""];
        if (ui.core.isPlainObject(initObj)) {
            for (var key in initObj) {
                func = initObj[key];
                if (ui.core.isFunction(func)) {
                    try {
                        func.call(caller);
                    } catch (e) {
                        message[1] = key;
                        message[3] = e.message;
                        ui.errorShow(message.join(""));
                    }
                }
            }
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
        
    }
};
ui.master = master;


})(jQuery, ui);

// Source: ui/viewpage/sidebar-manager.js

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
        this.sidebars = new ui.keyArray();
        return this;
    },
    setElement: function(name, option, element) {
        if(ui.str.isEmpty(name)) {
            return;
        }
        var sidebar = null,
            that = this;
        if(this.sidebars.contains(name)) {
            sidebar = this.sidebars.get(name);
            if(element) {
                sidebar.set(element);
            }
        } else {
            if(!option || !option.parent) {
                throw new Error("option is null");
            }
            sidebar = ui.ctrls.Sidebar(option, element);
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
        if(this.sidebars.contains(name)) {
            return this.sidebars.get(name);
        }
        return null;
    },
    remove: function(name) {
        if(ui.str.isEmpty(name)) {
            return;
        }
        if(this.sidebars.contains(name)) {
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
        if(this.sidebars.contains(name)) {
            sidebar = this.sidebars.get(name);
            if(sidebar.isShow()) {
                return null;
            }
            if(this.currentBar) {
                return this.currentBar.hide().done(function() {
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
        } else if(this.sidebars.contains(name)) {
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

})(jQuery, ui);

// Source: ui/viewpage/toolbar.js

(function($, ui) {
// toolbar
function Toolbar(option) {
    if(this instanceof Toolbar) {
        this.initialize(option);
    } else {
        return new Toolbar(option);
    }
};
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
                buttons.children(".tool-action-button").addClass("font-highlight-hover")
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
        }).addTarget({
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
        if(this.extendButton.length == 0) {
            moreTool = $("<ul class='tools' style='float:right;margin-left:0px;'></ul>");
            moreActions = $("<li class='action-buttons'></li>");
            moreTool.append(moreActions);
            if(this.tools.length == 0) {
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
            
            this.extendAnimator.start().done(function() {
                that.toolbarPanel.css("overflow", that._cssOverflow);
                option.target.css("display", "none");
            });
        }
    },
    _fireResize: function() {
        ui.fire("resize");
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

})(jQuery, ui);
