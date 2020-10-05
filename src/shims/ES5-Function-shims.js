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
