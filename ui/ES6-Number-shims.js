// 为Number对象添加ES6的一些方法

function isFunction(fn) {
    return ui.core.isFunction(fn);
}

function isNumber(value) {
    return ui.core.type(value) === "number";
}

// Number.isFinite
if(!isFunction(Number.isFinite)) {
    Number.isFinite = function(num) {
        return isNumber(num) && (num > -Infinity && num < Infinity);
    };
}

// Number.isNaN
if(!isFunction(Number.isNaN)) {
    Number.isNaN = isNaN;
}

// Number.parseInt
if(!isFunction(Number.parseInt)) {
    Number.parseInt = parseInt;
}

// Number.parseFloat
if(!isFunction(Number.parseFloat) {
    Number.parseFloat = parseFloat;
}
