/*
    字典数组，同时支持索引和hash访问数组元素
 */

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

ui.keyArray = function () {
    ui.ArrayFaker.apply(this);
    this._keys = {};
    return this;
};
ui.keyArray.prototype = $.extend({}, ui.ArrayFaker.prototype);
delete ui.keyArray.prototype.shift;
delete ui.keyArray.prototype.push;
delete ui.keyArray.prototype.sort;
delete ui.keyArray.prototype.pop;
delete ui.keyArray.prototype.splice;
delete ui.keyArray.prototype.concat;
delete ui.keyArray.prototype.slice;

$.extend(ui.keyArray.prototype, {
    contains: function (key) {
        return this._keys.hasOwnProperty(key);
    },
    set: function (key, value) {
        if (typeof key !== "string") {
            throw new TypeError("the key must be string");
        }
        if (this.contains(key)) {
            this[this._keys[key]] = value;
        } else {
            arrayInstance.push.apply(this, [value]);
            this._keys[key] = this.length - 1;
        }
    },
    get: function (key) {
        if (this.contains(key)) {
            return this[this._keys[key]];
        } else {
            return null;
        }
    },
    remove: function (key) {
        if (this.contains(key)) {
            var index = this._keys[key];
            arrayInstance.splice.apply(this, [index, 1]);
            rebuildIndex(this._keys, key);
            delete this._keys[key];
        }
    },
    removeAt: function (index) {
        if (index >= 0 && index < this.length) {
            var key, flag = false;
            for (var k in this._keys) {
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
    },
    clear: function () {
        arrayInstance.splice.apply(this, [0, this.length]);
        this._keys = {};
    },
    toArray: function () {
        var arr = [];
        var i = this.length - 1;
        for (; i >= 0 ; i--) {
            arr[i] = this[i];
        }
        return arr;
    }
});