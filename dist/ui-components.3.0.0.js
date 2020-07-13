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
ui.animator.fadeIn = function(target, duration) {
    var display,
        opacity,
        animator;

    if(!target) {
        return;
    }

    if(!duration || duration <= 0) {
        duration = 240;
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
            this.target.css("opacity", val / 100);
        }
    });
    animator.duration = duration;
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

    if(!duration || duration <= 0) {
        duration = 240;
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
            this.target.css("opacity", val / 100);
        }
    });
    animator.onEnd = function() {
        target.css("display", "none");
    };
    animator.duration = duration;
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
    events = ["start", "success", "error", "complete", "stop"],
    
    acceptsAll,
    accepts,
    rquery = /\?/,
    rjsonp = /(=)\?(?=&|$)|\?\?/,
    rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg,
    rnoContent = /^(?:GET|HEAD)$/,
    rnewLine = /\n/g,
    rcarriageReturn = /\r/g,
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
                if(this.option.withCredentials === true) {
                    // https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials
                    // 不同域下的XmlHttpRequest 响应，不论其Access-Control- header 设置什么值，都无法为它自身站点设置cookie值，除非它在请求之前将withCredentials 设为true
                    // withCredentials设置为true，那么服务端response head中Access-Control-Allow-Credentials要设置true，同时Access-Control-Allow-Origin设置为源地址，不能为*
                    this.xhr.withCredentials = true;
                }
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
                this.xhr.timeout = this.option.timeout;
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
        if(!text) {
            return text;
        }
        text = text.replace(rnewLine, "\\\\n").replace(rcarriageReturn, "\\\\r");
        return JSON.parse(text);
    },
    script: function(text) {
        ui.globalEval(text);
        return text;
    },
    jsonp: function() {
        var jsonpData;
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
        /** request method */
        type: "GET",
        /** 默认的contentType，用于描述有request body的请求类型，其中GET HEAD OPTION三种没有body，无需设置 */
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        async: true,
        /** 超时时间设置，单位毫秒，默认没有超时时间 */
        timeout: 0,
        /** jsonp的调用的默认方法名，如：/controller/action?callback=callbackName */
        jsonp: "callback",
        /**
         * 指示了是否该使用类似cookies,authorization headers(头部授权)或者TLS客户端证书这一类资格证书来创建一个跨站点访问控制
         * 这个指示也会被用做响应中cookies 被忽视的标示。默认值是false。
         * 在同一个站点下使用withCredentials属性是无效的
         */
        withCredentials: false
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
    createBinder(viewModel, propertyName, bindData, fn);
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
    var dragger,
        oldBeginDrag,
        oldMoving;
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
    if(ui.core.isFunction(option.onBeginDrag)) {
        oldBeginDrag = option.onBeginDrag;
    }
    option.onBeginDrag = function(arg) {
        var option = this.option,
            p = option.parent.offset();
        if(!p) p = { top: 0, left: 0 };

        if(oldBeginDrag) {
            oldBeginDrag.call(null, arg);
        }

        option.topLimit = p.top + option.getParentCssNum("border-top") + option.getParentCssNum("padding-top");
        option.leftLimit = p.left + option.getParentCssNum("border-left") + option.getParentCssNum("padding-left");
        option.rightLimit = p.left + (option.parent.outerWidth() || option.parent.width());
        option.bottomLimit = p.top + (option.parent.outerHeight() || option.parent.height());
        
        option.targetWidth = option.target.outerWidth();
        option.targetHeight = option.target.outerHeight();

        option.parentTop = p.top;
        option.parentLeft = p.left;
    };

    if(ui.core.isFunction(option.onMoving)) {
        oldMoving = option.onMoving;
    }
    option.onMoving = function(arg) {
        var option = this.option,
            p = option.target.position();

        if(oldMoving) {
            oldMoving.call(null, arg);
        }

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
        ui.post(url, { themeId: color.Id },
            function(success) {
                if(success.Result) {
                    setHighlight(color);
                }
            }, "json"
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
    elementResize: 2,
    ctrlResize: 1
};
function noop() {}
var page = {
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
            "keydown",
            "loaded"
        ],
        $config: {
            // 模型对象
            model: null,
            // 创建
            created: null,
            // 布局处理
            layout: null,
            // 数据加载
            load: null,
            // 销毁
            destroy: null,
            // 错误处理
            error: null
        }
    },
    handlers = {}, 
    ranks = {},
    defaultRankValue = 100;

page.event = new ui.CustomEvent(page);
page.event.initEvents();

function onError(e) {
    if(!this.$errors) {
        this.$errors = [];
    }
    this.$errors.push(e);
}

function getKeys(config) {
    var keys = Object.keys(config);
    keys.sort(function(a, b) {
        var v1 = ranks[a] || defaultRankValue;
        var v2 = ranks[b] || defaultRankValue;
        if(v1 === v2) {
            return 0;
        }
        return v1 < v2 ? -1 : 1;
    });
    return keys;
}

page.init = function(config) {
    var model = this.$config.model,
        readyHandler;
    
    if(ui.core.isPlainObject(config)) {
        model = ui.extend(true, {}, model, config.model);
        delete config.model;
        this.$config = ui.extend({}, this.$config, config);
        this.$config.model = model;
    }

    readyHandler = (function(e) {
        var config = this.$config,
            errorHandler = config.error,
            that = this;

        config.error = null;
        if(!ui.core.isFunction(errorHandler)) {
            errorHandler = onError;
        }

        getKeys(config).forEach(function(key) {
            var item = config[key];
            try {
                if(handlers.hasOwnProperty(key)) {
                    handlers[key].call(that, item);
                } else {
                    if(ui.core.isFunction(item)) {
                        item.call(that);
                    }
                }
            } catch(e) {
                e.cycleName = key;
                errorHandler.call(that, e);
            }
        });

        if(this.$errors) {
            this.$errors.forEach(function(e) {
                var errorMessage = ui.str.format("page init error. [{0}] {1}", e.cycleName, e.message);
                if(ui.errorShow) {
                    ui.errorShow(errorMessage);
                } else {
                    console.error(errorMessage);
                }
            });
            delete this.$errors;
        }
    }).bind(this);

    if(!this.$isInitAlready) {
        this.ready(readyHandler);
        this.$isInitAlready = true;
    }
};
page.plugin = function(plugin) {
    if(!plugin) {
        return;
    }

    if(!plugin.name || !ui.core.isFunction(plugin.handler)) {
        return;
    }

    if(this.$config[plugin.name]) {
        throw new Error("the name " + plugin.name + " is exists.");
    }

    this.$config[plugin.name] = noop;
    handlers[plugin.name] = plugin.handler;
    ranks[plugin.name] = plugin.rank || ++defaultRankValue;
};
page.get = function(pluginName) {
    if(!pluginName) {
        return null;
    }

    var plugin = handlers[pluginName];
    if(!plugin) {
        return null;
    }

    return (function(plugins, ranks, pluginName) {
        return {
            getName: function() {
                return pluginName;
            },
            setHandler: function(handler) {
                if(ui.core.isFunction(handler)) {
                    plugins[pluginName] = handler;
                }
            },
            setRank: function(rank) {
                if(ui.core.isNumber(rank)) {
                    ranks[pluginName] = rank;
                }
            }
        };
    })(handlers, ranks, pluginName);
};
page.watch = function(property, fn) {
    var vm = this.model,
        props, propertyName, i;
    if(!vm || !property || !ui.core.isFunction(fn)) {
        return;
    }

    props = property.split(".");
    for(i = 0; i < props.length; i++) {
        propertyName = props[i];
        vm = vm[propertyName];
        if(!ui.core.isObject(vm)) {
            throw new Error(propertyName + " can not bind watcher.");
        }
    }

    ui.ViewModel.bindOneWay(vm, propertyName, fn);
};

// 模型对象
page.plugin({
    name: "model",
    rank: 1,
    handler: function(arg) {
        var vm;
        if(ui.core.isFunction(arg)) {
            vm = arg.call(this);
        } else {
            vm = arg;
        }

        if(ui.core.isPlainObject(vm)) {
            this.model = ui.ViewModel(vm);
        }
    }
});
// 创建
page.plugin({
    name: "created",
    handler: function(arg) {
        if(ui.core.isFunction(arg)) {
            arg.call(this);
        }
    }
});
// 布局处理
page.plugin({
    name: "layout",
    handler: function(arg) {
        var resizeHandler;
        if(ui.core.isFunction(arg)) {
            resizeHandler = arg.bind(this);
            resizeHandler();
            this.resize(resizeHandler, ui.eventPriority.elementResize);
        }
    }
});
// 数据加载
page.plugin({
    name: "load",
    handler: function(arg) {
        var result,
            onload = (function() {
                this.fire("loaded");
            }).bind(this);
        if(ui.core.isFunction(arg)) {
            result = arg.call(this);
            if(result && ui.core.isFunction(result.then)) {
                result.then(onload, onload);
                return;
            }
        }
        onload();
    }
});
// 销毁
page.plugin({
    name: "destroy",
    handler: function(arg) {
        
    }
});

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
            page.fire("resize");
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

ui.page = page;


})(jQuery, ui);
