// 为ECMAScript3 添加ECMAScript5的方法

var rtrim;

function isFunction(fn) {
    return ui.core.isFunction(fn);
}

// String.prototype
// trim
if(!isFunction(String.prototype.trim)) {
    // Support: Android<4.1, IE<9
    // Make sure we trim BOM and NBSP
    rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.protocol.trim = function() {
        return text == null ? "" : (text + "").replace(rtrim, "");
    };
}

