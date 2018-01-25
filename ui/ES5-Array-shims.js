// 为ECMAScript3 添加ECMAScript5的方法

function isFunction(fn) {
    return ui.core.isFunction(fn);
}

// Array.prototype
// isArray
if(!isFunction(Array.isArray)) {
    Array.isArray = function(obj) {
        return ui.core.type(obj) === "array";
    };
}
// forEach
if(!isFunction(Array.prototype.forEach)) {
    Array.prototype.forEach = function(fn, caller) {
        var i, len;
        if(!isFunction(fn)) {
            return;
        }
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            fn.call(caller, this[i], i, this);
        }
    };
}
// map
if(!isFunction(Array.prototype.map)) {
    Array.prototype.map = function(fn, caller) {
        var i, len,
            result;
        if(!isFunction(fn)) {
            return;
        }
        result = new Array(this.length);
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            result[i] = fn.call(caller, this[i], i, this);
        }
        return result;
    };
}
// filter
if(!isFunction(Array.prototype.filter)) {
    Array.prototype.filter = function(fn, caller) {
        var i, len,
            result;
        if(!isFunction(fn)) {
            return;
        }
        result = [];
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            if(fn.call(caller, this[i], i, this)) {
                result.push(this[i]);
            }
        }
        return result;
    };
}
// every
if(!isFunction(Array.prototype.every)) {
    Array.prototype.every = function(fn, caller) {
        var i, len;
        if(!isFunction(fn)) {
            return;
        }
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            if(!fn.call(caller, this[i], i, this)) {
                return false;
            }
        }
        return true;
    };
}
// some
if(!isFunction(Array.prototype.some)) {
    Array.prototype.some = function(fn, caller) {
        var i, len;
        if(!isFunction(fn)) {
            return;
        }
        for(i = 0, len = this.length; i < len; i++) {
            if(!(i in this)) continue;
            if(fn.call(caller, this[i], i, this)) {
                return true;
            }
        }
        return false;
    };
}
// reduce
if(!isFunction(Array.prototype.reduce)) {
    Array.prototype.reduce = function(fn, defaultValue) {
        var i, len,
            result;

        if(!isFunction(fn)) {
            return;
        }
        
        i = 0;
        len = this.length;
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
if(!isFunction(Array.prototype.reduceRight)) {
    Array.prototype.reduceRight = function(fn, defaultValue) {
        var i, len,
            result;

        if(!isFunction(fn)) {
            return;
        }

        len = this.length;
        i = len - 1;
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
if(!isFunction(Array.prototype.indexOf)) {
    Array.prototype.indexOf = function(value, startIndex) {
        var i, len,
            index;
        if(!startIndex) {
            startIndex = 0;
        }
        
        len = this.length;
        index = -1;
        if(len > 0) {
            while(startIndex < 0) {
                startIndex = len + startIndex;
            }
            
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
if(!isFunction(Array.prototype.lastIndexOf)) {
    Array.prototype.lastIndexOf = function(value, startIndex) {
        var i, len,
            index;

        if(!startIndex) {
            startIndex = 0;
        }
        
        len = this.length;
        i = len - 1;
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
