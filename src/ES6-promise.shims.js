
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

if(typeof Promise !== "undefined" && ui.core.isNative(Promise)) {
    // 原生支持Promise
    if(!isFunction(Promise.prototype.finally)) {
        Promise.prototype.finally = _finally;
    }
    if(!isFunction(Promise.prototype.try)) {
        // 增加Promise.try提案的方法
        Promise.prototype.try = _try;
    }
}

// 生成Promise垫片

// 确定Promise对象的状态，并且执行回调函数
function transmit(promise, value, isResolved) {
    promise._result = value;
    promise._state = isResolved ? "fulfilled" : "rejected";
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
                    transmit(promise, val, true);
            }, 
            function (reason) {
                transmit(promise, reason, false);
            }
            );
        } else {
            transmit(promise, value, true);
        }
        }, 
        // reject
        function (reason) {
        if (promise._state !== "pending") {
            return;
        }
        transmit(promise, reason, false);
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

        // 用于衔接then
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
