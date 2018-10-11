// SelectorSet
// 参考 https://github.com/josh/selector-set/blob/master/selector-set.js
// 针对SOON.UI的代码风格进行了重构
// 修改了部分变量名称，便于自己的理解
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
    getElements: function() {
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
    getElements: function(element) {
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
    getElements: function(element) {
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
    getElements: function(element) {
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
    }
};
