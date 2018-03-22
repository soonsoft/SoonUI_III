// Source: src/component/introsort.js

(function($, ui) {
"use strict";
// sorter introsort
var core = ui.core,
    size_threshold = 16;

function isSortItems(items) {
    return items && items.length;
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
        if (!isSortItems(this.keys)) {
            return;
        }
        if (this.keys.length < 2) {
            return;
        }
        if (!isSortItems(this.items)) {
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

// Source: src/component/animation.js

(function($, ui) {
"use strict";
/*
    animation javascript 动画引擎
 */

//初始化动画播放器
var requestAnimationFrame,
    cancelAnimationFrame,
    prefix = ["ms", "moz", "webkit", "o"],
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

ui.getRequestAnimationFrame = function() {
    return requestAnimationFrame;
};
ui.getCancelAnimationFrame = function() {
    return cancelAnimationFrame;
};

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
    onEndFn = ui.core.isFunction(this.onEnd) ? this.onEnd : null;
    
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
            timestamp = newTime - startTime
    
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
                if (onEndFn) {
                    onEndFn.call(that);
                }
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
        option.onChange = option.onChange || noop;
        //要使用的缓动公式
        option.ease = option.ease || ui.AnimationStyle.easeFromTo;
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
    this.promise = promise;
    this.promise._resolve = _resolve;
    this.promise._reject = _reject;

    if (!this.isStarted) {
        if(ui.core.isNumber(duration) && duration > 0) {
            this.duration = duration;
        }
        this.duration = parseInt(this.duration, 10) || 500;

        flag = this._prepare();
        this.onBegin.call(this);

        that = this;
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

// Source: src/component/custom-event.js

(function($, ui) {
"use strict";
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

// Source: src/component/task.js

(function($, ui) {
"use strict";
/*

JavaScript中分为MacroTask和MicroTask
Promise\MutationObserver\Object.observer 属于MicroTask
setImmediate\setTimeout\setInterval 属于MacroTask
    另外：requestAnimationFrame\I/O\UI Rander 也属于MacroTask，但会优先执行

每次Tick时都是一个MacroTask，在当前MacroTask执行完毕后都会检查MicroTask的队列，并执行MicroTask。
所以MicroTask可以保证在同一个Tick执行，而setImmediate\setTimeout\setInterval会创建成新的MacroTask，下一次执行。
另外在HTML5的标准中规定了setTimeout和setInterval的最小时间变成了4ms，这导致了setTimeout(fn, 0)也会有4ms的延迟，
而setImmediate没有这样的限制，但是setImmediate只有IE实现了，其它浏览器都不支持，所以可以采用MessageChannel代替。

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

// Source: src/component/json.js

(function($, ui) {
"use strict";
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

// Source: src/component/ajax.js

(function($, ui) {
"use strict";
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
    if (ui.core.isFunction(args)) {
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

    if (ui.core.isFunction(successFn)) {
        context.successFn = successFn;
        ajaxOption.success = function(d, s, r) {
            successHandler(context, d, s, r);
        };
    }
    if (ui.core.isFunction(errorFn)) {
        context.errorFn = errorFn;
        ajaxOption.error = function(r, s, t) {
            errorHandler(context, r, s, t);
        }
    }
    return $.ajax(ajaxOption);
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
ui.ajax = {
    /** get方式 */
    get: function (url, params, success, failure, option) {
        if(!option) option = {};
        option.contentType = "application/x-www-form-urlencoded";
        return ajaxCall("GET", url, params, success, failure, option);
    },
    /** post方式 */
    post: function (url, params, success, failure, option) {
        if(!option) option = {};
        option.contentType = "application/x-www-form-urlencoded";
        return ajaxCall("POST", url, params, success, failure, option);
    },
    /** post方式，提交数据为为Json格式 */
    postJson: function(url, params, success, failure, option) {
        return ajaxCall("POST", url, params, success, failure, option);
    },
    /** post方式，提交数据为Json格式，在请求期间会禁用按钮，避免多次提交 */
    postOnce: function (btn, url, params, success, failure, option) {
        var text,
            textFormat,
            fn;
        btn = ui.getJQueryElement(btn);
        if(!btn) {
            throw new Error("没有正确设置要禁用的按钮");
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
                btn.val(ui.str.fFormat(textFormat, text));
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
    },
    /** 将多组ajax请求一起发送，待全部完成后才会执行后续的操作 */
    all: function () {
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

        promise.then = function () {
            var context;
            if (arguments.length > 1 && ui.core.isFunction(arguments[1])) {
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

// Source: src/component/color.js

(function($, ui) {
"use strict";
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
        }

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
"use strict";
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
"use strict";
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
"use strict";
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
    }
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
}

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
                notice;
            if(oldVal === newVal || (newVal !== newVal && val !== val)) {
                return;
            }

            if(setter) {
                setter.call(obj, newVal);
            } else {
                val = newVal;
            }

            if(!shallow  && (ui.core.isObject(val) || Array.isArray(val))) {
                notice = new NotifyObject(newVal);
                notice.dependency.depMap = childNotice.dependency.depMap;
                // 更新通知对象
                childNotice = notice;
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
        if((ui.core.isObject(value) || Array.isArray(value)) 
            && value.__notice__ instanceof NotifyObject) {
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
        var propertyName;
        if(binder instanceof Binder) {
            var propertyName,
                binderList,
                i, len;
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
                if(ui.core.isString(propertyName) 
                    && propertyName.length > 0 
                    && this.depMap.hasOwnProperty(propertyName)) {
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
"use strict";
function noop() {
}
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
    i18n: function(key) {
        // TODO: 实现根据key获取对应的本地化文本
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
            config.get = $.proxy(getter, this);
        }
        if(ui.core.isFunction(setter)) {
            config.set = $.proxy(setter, this);
        }

        config.enumerable = false;
        config.configurable = false;
        definePropertyFn(this, propertyName, config);
    },
    /** 默认的toString方法实现，返回类名 */
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

// Source: src/component/draggable.js

(function($, ui) {
"use strict";

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
    
    eventArg.x = e.pageX - this.currentX;
    eventArg.y = e.pageY - this.currentY;
    eventArg.currentX = this.currentX = e.pageX;
    eventArg.currentY = this.currentY = e.pageY;

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

// Source: src/component/uploader.js

(function($, ui) {
"use strict";
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
        if (!files || files.length === 0) {
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

    this._iframe.load((function () {
        var contentWindow,
            fileInfo,
            errorMsg;

        this.percent = 100.0;
        this.fire("progressing", this.percent);

        contentWindow = this._iframe[0].contentWindow;
        fileInfo = contentWindow.fileInfo;
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
    }).bind(this));
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
        this.onInputFileChangeHandler = onInputFileChange.bind(this);

        this._reset();
    },
    _render: function() {
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
        this.fileName = path.substring(path.lastIndexOf("\\") + 1, index);
        this.extension = path.substring(index).toLowerCase().trim();

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

// Source: src/component/theme.js

(function($, ui) {
"use strict";

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
    ui.page.fire("hlchanged", highlight);
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
        sheet = $("#" + ui.theme.highlightSheetId);
        if(sheet.length > 0) {
            styleUrl = sheet.prop("href");
            highlight = ui.url.getParams(styleUrl).highlight;
        }
        this.currentHighlight = this.getHighlight(highlight);
        ui.page.fire("highlightChanged", highlight);
    }
};


})(jQuery, ui);

// Source: src/component/page.js

(function($, ui) {
"use strict";

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
        page.fire("htmlclick");
    });

$(window)
    //注册全局resize事件
    .on("resize", function (e) {
        console.log("resize");
        if(page._resizeTimeoutHandler) {
            clearTimeout(page._resizeTimeoutHandler);
        }
        page._resizeTimeoutHandler = setTimeout(function() {
            console.log("do");
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
