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