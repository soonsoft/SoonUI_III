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
// http://www.cnblogs.com/rubylouvre/archive/2009/09/18/1568794.html
if(typeof String.prototype.trim !== "function") {
    String.protocol.trim = function() {
        var str = this,
            ws = /\s/,
            i;
            
        str = str.replace(/^\s\s*/, '');
        i = str.length - 1;

        while (ws.test(str.charAt(i--)));
        return str.slice(0, i + 1);
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