// 为ECMAScript3 添加ECMAScript5的方法

function isFunction(fn) {
    return ui.core.isFunction(fn);
}

// String.prototype
// trim
if(!isFunction(String.prototype.trim)) {
    String.protocol.trim = function() {
        return ui.str.trim(this);
    };
}

