/*
    字典数组，同时支持索引和hash访问数组元素
 */
var arrayInstance = [],
    base = ui.ArrayLike.prototype;
function rebuildIndex(obj, key) {
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
}

function KeyArray () {
    if(this instanceof KeyArray) {
        this.initialize();
    } else {
        return new KeyArray();
    }
}
KeyArray.prototype = {
    constructor: KeyArray,
    isArray: base.isArray,
    setArray: base.setArray,
    makeArray: base.makeArray,
    toArray: base.toArray,
    toString: base.toString,
    valueOf: base.valueOf
};

// 初始化
KeyArray.prototype.initialize = function() {
    ui.ArrayLike.apply(this);
    this._keys = {};
};
/** 判断是否存在key */
KeyArray.prototype.containsKey = function (key) {
    return this._keys.hasOwnProperty(key);
};
/** 判断是否存在value */
KeyArray.prototype.containsValue = function(value) {
    var i, len = this.length;
    for(i = 0; i < len; i++) {
        if(this[i] === value) {
            return true;
        }
    }
    return false;
};
/** 设置值，如果没有则添加 */
KeyArray.prototype.set = function (key, value) {
    if (typeof key !== "string") {
        throw new TypeError("the key must be string");
    }
    if (this.containsKey(key)) {
        this[this._keys[key]] = value;
    } else {
        arrayInstance.push.apply(this, [value]);
        this._keys[key] = this.length - 1;
    }
};
/** 根据key获取value */
KeyArray.prototype.get = function (key) {
    if (this.containsKey(key)) {
        return this[this._keys[key]];
    } else {
        return null;
    }
};
/** 根据key移除value */
KeyArray.prototype.remove = function (key) {
    var index;
    if (this.containsKey(key)) {
        index = this._keys[key];
        arrayInstance.splice.apply(this, [index, 1]);
        rebuildIndex(this._keys, key);
        delete this._keys[key];
    }
};
/** 根据索引移除value */
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
/** 枚举所有的key值并用数组返回 */
KeyArray.prototype.keys = function() {
    return Object.keys(this._keys);
};
/** 清空 */
KeyArray.prototype.clear = function () {
    arrayInstance.splice.apply(this, [0, this.length]);
    this._keys = {};
};

ui.KeyArray = KeyArray;
