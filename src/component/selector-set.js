// SelectorSet
// 参考 https://github.com/josh/selector-set/blob/master/selector-set.js
// 针对SOON.UI的代码风格进行了重构
// 修改了部分变量名称，便于自己的理解
/*
    数据结构
    [
        {
            name: String,
            getSelector: Function,
            getElementKeys: Function,
            map: Map {
                selector: Array [
                    {
                        id: String,
                        selector: String,
                        data: Object,
                        elements: Array
                    }
                ]
            }
        }
    ]
*/
var 
    // selector匹配
    chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
    // id 匹配
    rid = /^#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g,
    // class 匹配
    rclass = /^\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g,
    // tag 匹配
    rtag = /^((?:[\w\u00c0-\uFFFF\-]|\\.)+)/g;

var 
    docElem = document.documentElement,
    matches = (docElem.matches ||
                docElem.webkitMatchesSelector ||
                docElem.mozMatchesSelector ||
                docElem.oMatchesSelector ||
                docElem.msMatchesSelector),
    selectorTypes = [],
    defaultSelectorType;

// 默认值
defaultSelectorTypes = {
    name: 'UNIVERSAL',
    getSelector: function() {
        return true;
    },
    getElementKeys: function() {
        return [true];
    }
};
// 添加ID匹配器 #id
selectorTypes.push({
    name: "ID",
    getSelector: function(selector) {
        var m = selector.match(rid);
        if (m) {
            // 去掉[#]号
            return m[0].substring(1);
        }
        return null;
    },
    getElementKeys: function(element) {
        if (element.id) {
            return [element.id];
        }
        return null;
    }
});
// 添加Class匹配器 .classname
selectorTypes.push({
    name: "CLASS",
    getSelector: function(selector) {
        var m = selector.match(rclass);
        if (m) {
            // 去掉[.]号
            return m[0].substring(1);
        }
        return null;
    },
    getElementKeys: function(element) {
        var className = element.className;
        if(className) {
            if (typeof className === "string") {
                return className.split(/\s/);
            } else if (typeof className === "object" && "baseVal" in className) {
                // className is a SVGAnimatedString
                // global SVGAnimatedString is not an exposed global in Opera 12
                return className.baseVal.split(/\s/);
            }
        }
        return null;
    }
});
// 添加Tag匹配器 A DIV
selectorTypes.push({
    name: "TAG",
    getSelector: function(selector) {
        var m = selector.match(rtag);
        if (m) {
            return m[0].toUpperCase();
        }
        return null;
    },
    getElementKeys: function(element) {
        return [element.nodeName.toUpperCase()];
    }
});


// 匹配selector
function parseSelectorTypes(allTypes, selector) {
    var i, j, len,
        matches,
        rest,
        key, type,
        types = [],
        shouldCancel;

    allTypes = allTypes.slice(0).concat(allTypes['default']);
    len = allTypes.length;

    rest = selector;
    do {
        // reset index
        chunker.exec('');
        matches = chunker.exec(rest);
        if(matches) {
            rest = matches[3];
            if (matches[2] || !rest) {
                for (i = 0; i < len; i++) {
                    type = allTypes[i];
                    key = type.getSelector(m[1]);
                    if(key) {
                        j = types.length;
                        shouldCancel = false;
                        while(j--) {
                            if (types[j].type === type && types[j].key === key) {
                                shouldCancel = true;
                                break;
                            }
                        }
                        if(!shouldCancel) {
                            types.push({
                                type: type,
                                key: key
                            });
                        }
                        break;
                    }
                }
            }
        }
    } while(matches);

    return types;
}

function findByPrototype(target, proto) {
    var i, len, item;
    for(i = 0, len = target.length; i < len; i++) {
        item = target[i];
        if(proto.isPrototypeOf(item)) {
            return item;
        }
    }
}

function sortById(a, b) {
    return a.id - b.id;
}

function SelectorSet() {
    if(!(this instanceof SelectorSet)) {
        return new SelectorSet();
    }

    this.count = 0;
    this.uid = 0;

    this.types = Object.create(selectorTypes);
    this.types["default"] = defaultSelectorType;

    this.activeTypes = [];
    this.selectors = [];
}
SelectorSet.prototype = {
    constructor: SelectorSet,
    add: function(selector, data) {
        var types, typeItem,
            activeTypes, activeType,
            i, len,
            target, targets;

        if(!ui.core.isString(selector)) {
            return;
        }

        target = {
            id: this.uid++,
            selector: selector,
            data: data
        };

        types = parseSelectorTypes(this.types, selector);
        activeTypes = this.activeTypes;
        for (i = 0, len = types.length; i < len; i++) {
            typeItem = types[i];
            activeType = findByPrototype(activeTypes, typeItem.type);
            if(!activeType) {
                activeType = Object.create(typeItem.type);
                activeType.map = new Map();
                activeTypes.push(activeType);
            }

            if(typeItem.type === this.types["default"]) {
                // TODO 使用了默认的类型
            }

            targets = activeType.map.get(typeItem.key);
            if(!targets) {
                targets = [];
                activeType.map.set(typeItem.key, targets);
            }
            targets.push(target);
        }

        this.count++;
        this.selectors.push(selector);
    },
    remove: function(selector, data) {
        var types, typeItem,
            activeTypes, activeType,
            i, len, j, k,
            targets, target,
            removeAll,
            removeCount = 0;
        if(!ui.core.isString(selector)) {
            return;
        }

        removeAll = arguments.length === 1;
        types = parseSelectorTypes(this.types, selector);
        activeTypes = this.activeTypes;
        for (i = 0, len = types.length; i < len; i++) {
            typeItem = types[i];
            j = activeTypes.length;
            while(j--) {
                activeType = activeTypes[j];
                if(typeItem.type.isPrototypeOf(activeType)) {
                    targets = activeType.map.get(typeItem.key);
                    if(targets) {
                        k = targets.length;
                        while(k--) {
                            target = targets[k];
                            if(target.selector === selector && (removeAll || target.data === data)) {
                                target.splice(k, 1);
                                removeCount++;
                            }
                        }
                    }
                }
            }
        }
        this.count -= removeCount;
    },
    matchesSelector: function(element, selector) {
        return matches.call(element, selector);
    },
    querySelectorAll: function(selectors, context) {
        return context.querySelectorAll(selectors);
    },
    queryAll: function(context) {
        var targets, target,
            results,
            elements, element,
            i, len, j, jlen, matches, match;
        if(this.selectors.length === 0) {
            return [];
        }

        targets = {};
        results = [];
        elements = this.querySelectorAll(this.selectors.join[", "], context);

        for(i = 0, len = elements.length; i < len; i++) {
            element = elements[i];
            matches = this.matches(element);
            for(j = 0, jlen = matches.length; j < jlen; j++) {
                match = m[j];
                if(!targets[match.id]) {
                    target = {
                        id: match.id,
                        selector: match.selector,
                        data: match.data,
                        elements: []
                    };
                    targets[match.id] = target;
                    results.push(target);
                } else {
                    target = targets[match.id];
                }
                target.elements.push(element);
            }
        }
        
        return results.sort(sortById);
    },
    matches: function(element) {
        var activeTypes, activeType,
            i, len, j, jlen, k, klen, keys,
            targets, target,
            matchedIds, matches;
        if(!element) {
            return [];
        }

        matchedIds = {};
        matches = [];
        activeTypes = this.activeTypes;
        for (i = 0, len = activeTypes.length; i < len; i++) {
            activeType = activeTypes[i];
            keys = activeType.getElementKeys(element);
            if(keys) {
                for(j = 0, jlen = keys.length; j < jlen; j++) {
                    targets = activeType.map.get(keys[i]);
                    if(targets) {
                        for(k = 0, klen = targets.length; k < klen; k++) {
                            target = targets[k];
                            if (!matchedIds[id] && this.matchesSelector(element, target.selector)) {
                                matchedIds[id] = true;
                                matches.push(obj);
                            }
                        }
                    }
                }
            }
        }
        return matches.sort(sortById);
    }
};

ui.SelectorSet = SelectorSet;
