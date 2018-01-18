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
    this.stopHandle = null;
    that = this;
    
    //开始执行的时间
    startTime = new Date().getTime();
    (function () {
        var fn = function () {
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
