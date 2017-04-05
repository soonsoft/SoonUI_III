/*
    字典数组，同时支持索引和hash访问数组元素
 */
var arrayInstance = [];
var rebuildIndex = function (obj, key) {
    var flag = false;
    for (var k in obj) {
        if (k === key) {
            flag = true;
            continue;
        }
        if (!flag) {
            continue;
        }
        obj[k] = --obj[k];
    }
};

function KeyArray () {
    if(this instanceof KeyArray) {
        this.initialize();
    } else {
        return new KeyArray();
    }
};
KeyArray.prototype = $.extend({}, ui.ArrayFaker.prototype);
delete KeyArray.prototype.shift;
delete KeyArray.prototype.push;
delete KeyArray.prototype.sort;
delete KeyArray.prototype.pop;
delete KeyArray.prototype.splice;
delete KeyArray.prototype.concat;
delete KeyArray.prototype.slice;

// 初始化
KeyArray.prototype.initialize = function() {
    ui.ArrayFaker.apply(this);
    this._keys = {};
};
// 判断是否存在key
KeyArray.prototype.containsKey = function (key) {
    return this._keys.hasOwnProperty(key);
};
KeyArray.prototype.containsValue = function(value) {
    var i, len = this.length;
    for(i = 0; i < len; i++) {
        if(this[i] === value) {
            return true;
        }
    }
    return false;
};
KeyArray.prototype.set = function (key, value) {
    if (typeof key !== "string") {
        throw new TypeError("the key must be string");
    }
    if (this.contains(key)) {
        this[this._keys[key]] = value;
    } else {
        arrayInstance.push.apply(this, [value]);
        this._keys[key] = this.length - 1;
    }
};
KeyArray.prototype.get = function (key) {
    if (this.contains(key)) {
        return this[this._keys[key]];
    } else {
        return null;
    }
};
KeyArray.prototype.remove = function (key) {
    var index;
    if (this.contains(key)) {
        index = this._keys[key];
        arrayInstance.splice.apply(this, [index, 1]);
        rebuildIndex(this._keys, key);
        delete this._keys[key];
    }
};
KeyArray.prototype.removeAt = function (index) {
    var key, flag, k;
    if (index >= 0 && index < this.length) {
        flag = false;
        for (k in this._keys) {
            if (this._keys[k] === index) {
                flag = true;
                key = k;
            }
            if (!flag) {
                continue;
            }
            this._keys[k] = --this._keys[k];
        }
        delete this._keys[key];
        arrayInstance.splice.apply(this, [index, 1]);
    }
};
KeyArray.prototype.clear = function () {
    arrayInstance.splice.apply(this, [0, this.length]);
    this._keys = {};
};
KeyArray.prototype.toArray = function () {
    var arr = [];
    var i = this.length - 1;
    for (; i >= 0 ; i--) {
        arr[i] = this[i];
    }
    return arr;
};

ui.KeyArray = KeyArray;
