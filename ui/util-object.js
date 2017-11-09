//object

function _ignore(ignore) {
    var ignoreType,
        prefix;
    
    ignoreType = ui.core.type(ignore);
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
    /** 浅克隆 */
    clone: function (source, ignore) {
        var result,
            type,
            key;

        ignore = _ignore(ignore);
        type = ui.core.type(source);
        
        if(type === "object") {
            result = {};
        } else if(type === "array") {
            result = [];
        } else {
            return source;
        }
        
        for (key in source) {
            if(ignore.call(key)) {
                continue;
            }
            result[key] = source[key];
        }
        return result;
    },
    /** 深克隆对象 */
    deepClone: function (source, ignore) {
        var result,
            type,
            cope,
            key;

        type = ui.core.type(source);
        if(type === "object") {
            result = {};
        } else if(type === "array") {
            result = [];
        } else {
            return source;
        }
        
        ignore = _ignore(ignore);
        for (key in source) {
            if(ignore.call(key)) {
                continue;
            }
            copy = source[key];
            if (result === copy)
                continue;
            type = ui.core.type(copy);
            if (type === "object" || type === "array") {
                result[key] = this.deepClone(copy, ignore);
            } else {
                result[key] = copy;
            }
        }
        return result;
    }
};
