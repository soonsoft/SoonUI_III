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
