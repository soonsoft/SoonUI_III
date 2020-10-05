// 为ECMAScript3 添加Map 垫片
var global,
    MapShim,
    uniqueChar = "_";

function createMapIterator(keys, table) {
    var index = -1,
        iterator = {},
        _table = table;
    if(keys.length === 0) {
        return iterator;
    }

    iterator.next = function() {
        var key;
        index++;
        if(index < keys.length) {
            key = keys[index];
            return {
                value: [key, _table[key + uniqueChar]],
                done: false
            };
        }
        return {
            value: undefined,
            done: true
        };
    };
}

if(!ui.core.isFunction(Map)) {
    function MapShim() {
        if(!(this instanceof MapShim)) {
            throw TypeError("Constructor Map requires 'new'");
        }
        this.size = 0;
        this._table = {};
    };
    MapShim.prototype.set = function(key, value) {
        this._table[key + uniqueChar] = value;
        this.size++;
    };
    MapShim.prototype.get = function(key) {
        return this._table[key + uniqueChar];
    };
    MapShim.prototype.delete = function(key) {
        if(this.has(key)) {
            delete this._table[key + uniqueChar];
            this.size--;
            return true;
        }
        return false;
    };
    MapShim.prototype.clear = function() {
        this._table = {};
        this.size = 0;
    };
    MapShim.prototype.has = function(key) {
        return this._table.hasOwnProperty(key + uniqueChar);
    };
    MapShim.prototype.keys = function() {
        var result = [],
            keys = Object.keys(this._table);
        keys.forEach(function(key) {
            result.push(key.substring(0, key.length - 1));
        });
        return result;
    };
    MapShim.prototype.values = function() {
        var result = [],
            _table = this._table,
            keys = Object.keys(_table);
        keys.forEach(function(key) {
            result.push(_table[key]);
        });
        return result;
    };
    MapShim.prototype.entries = function() {
        return createMapIterator(this.keys(), this._table);
    };
    MapShim.prototype.forEach = function(callback, thisArg) {
        var i, len, keys, key;
        if(!isFunction(callback)) {
            return;
        }
        keys = this.keys();
        for(i = 0, len = keys.length; i < len; i++) {
            key = keys[i];
            callback.call(thisArg, this.get(key), key, this);
        }
    };

    global = ui.core.global();
    global.Map = MapShim;
}
