// Array Faker

var arrayInstance = [];
function ArrayFaker () {
    this.setArray(this.makeArray(arguments));
    return this;
}
ArrayFaker.prototype = {
    constructor: ArrayFaker,
    isArray: function (obj) {
        return ui.core.isArray(obj);
    },
    setArray: function (elems) {
        this.length = 0;
        //设置length以及重排索引
        Array.prototype.push.apply(this, elems);
        return this;
    },
    makeArray: function (arr) {
        //把传入参数变成数组
        var ret = [];
        if (arr !== null) {
            var i = arr.length;
            //单个元素，但window, string、 function有 'length'的属性，加其它的判断
            if (i === null || arr.split || arr.setInterval || arr.call) {
                ret[0] = arr;
            } else {
                try {
                    ret = Array.prototype.slice.call(arr);
                } catch (e) {
                    //Clone数组
                    while (i) ret[--i] = arr[i];
                }
            }
        }
        return ret;
    },
    inArray: function (elem, array) {
        for (var i = 0, length = array.length; i < length; i++) {
            // Use === because on IE, window == document
            if (array[i] === elem) {
                return i;
            }
        }
        return -1;
    },
    index: function (el) { 
        return this.inArray(el, this); 
    },
    toString: function () {
        //返回一个字符串
        var array = Array.prototype.slice.call(this);
        return array.toString();
    },
    valueOf: function () {
        return Array.prototype.slice.call(this);
    },
    shift: arrayInstance.shift,
    push: arrayInstance.push,
    sort: arrayInstance.sort,
    pop: arrayInstance.pop,
    splice: arrayInstance.splice,
    concat: arrayInstance.concat,
    slice: arrayInstance.slice,
    forEach: arrayInstance.forEach,
    map: arrayInstance.map,
    filter: arrayInstance.filter,
    every: arrayInstance.every,
    some: arrayInstance.some,
    reduce: arrayInstance.reduce,
    reduceRight: arrayInstance.reduceRight,
    indexOf: arrayInstance.indexOf,
    lastIndexOf: arrayInstance.lastIndexOf,
    constructor: ui.ArrayFaker,
    get: function (num) {
        return num === undefined ? Array.prototype.slice.call(this) : this[num];
    }
};

ui.ArrayFaker = ArrayFaker;
