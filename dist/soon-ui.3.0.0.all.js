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

// 数据类型处理
var typeStr = "Boolean Number String Function Array Date RegExp Object Error";
typeStr.replace(rword, function (name) {
    class2type["[object " + name + "]"] = name.toLowerCase();
});
core.type = function(obj) {
    if (obj === null) {
        return String(obj);
    }
    // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
    return typeof obj === "object" || typeof obj === "function" ?
            class2type[serialize.call(obj)] || "object" :
            typeof obj;
};
typeStr.replace(rword, function (name) {
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
// text

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
    if (!$.isFunction(field)) {
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
        if (list === null) {
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

var rword = /[^, ]+/g;;

//为jquery添加一个获取元素标签类型的方法
$.fn.nodeName = function () {
    return this.prop("nodeName");
};

//判断元素的tagName，不区分大小写
$.fn.isNodeName = function(nodeName) {
    return this.nodeName() === (nodeName + "").toUpperCase();
};

//判断一个元素是否出现了横向滚动条
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

//判断一个元素是否出现了纵向滚动条
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

//获取对象的z-index值
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

//填充select下拉框的选项
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

//获取一个select元素当前选中的value和text
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

//动态设置图片的src并自动调整图片的尺寸和位置
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

//为jquery添加mousewheel事件
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
    // 拖动的目标
    target: null,
    // 把手，拖拽事件附加的元素
    handle: null,
    // 范围元素，默认是$(body)
    parent: body,
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
        var eventArg = {};
        if (e.which !== 1) return;

        eventArg.currentX = this.currentX = e.pageX;
        eventArg.currentY = this.currentY = e.pageY;

        if(ui.core.isFunction(this.option.onBeginDrag)) {
            this.option.onBeginDrag.call(this, eventArg);
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
        var eventArg = {};
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
        var eventArg = {};
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
        ui.fire("resize", 
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


