# SoonUI_III
用于桌面Web浏览器的UI框架，基于jQuery。
> 这是UI库的3.0版本，本次会对各个UI组件进行重构，使其更加模块化，分层更清晰。同时也更容易的从中分离出一部分用于构建现有的项目。
## 组件
> 待续...
## 控件
> 待续...

function getRules() {
    var rules = this.prop("cssRules") || this.prop("rules");
    return rules;
}
function eachRules(rules, action) {
    var i = 0,
        len = rules.length,
        rule;
    for(; i < len; i++) {
        rule = rules[i];
        // 跳过@import和非样式规则
        if(!rule.selectorText) {
            continue;
        }
        if(action.call(this, rule, i) === false) {
            break;
        }
    }
}
    
function StyleSheet(elem) {
    if(this instanceof StyleSheet) {
        this.initialize(elem);
    } else {
        return new StyleSheet(elem);
    }
}
StyleSheet.prototype = {
    initialize: function(elem) {
        var nodeName,
            styleElement;

        this.styleSheet = null;
        if(ui.core.isString(elem) && elem.length > 0) {
            //通过ID获取
            styleElement = $("#" + elem);
            nodeName = styleElement.nodeName();
            if (nodeName === "STYLE" || nodeName === "LINK") {
                this.styleSheet = styleElement.prop("sheet");
                if (!this.styleSheet)
                    this.styleSheet = styleElement.prop("styleSheet");
                if (this.styleSheet) {
                    this.styleSheet = $(this.styleSheet);
                }
            }
        } else if(ui.core.isJQueryObject(elem)) {
            this.styleSheet = elem;
        } elem if(ui.core.isDomObject(elem)) {
            this.styleSheet = $(elem);
        }
    },
    disabled: function() {
        if(arguments.length == 0) {
            return this.styleSheet.prop("disabled");
        }

        this.styleSheet.prop("disabled", !!arguments[0]);
        
    },
    getRule: function(selector) {
        var rules,
            result = null;
        if(ui.str.isEmpty(selector)) {
            return null;
        }
        if(!this.styleSheet || this.styleSheet.length == 0) {
            return null;
        }

        selector = selector.toLowerCase();
        rules = getRules.call(this.styleSheet);
        eachRules(rules, function(rule, index) {
            if(rule.selectorText.toLowerCase() === selector) {
                result = rule;
                return false;
            }
        });
        return result;
    },
    setRule: function(selector, styles) {
        var rules,
            rule;
        if(ui.str.isEmpty(selector)) {
            return;
        }
        if(!styles) {
            return;
        }

        rule = this.getRule(selector);
        if(rule) {
            $(rule).css(styles);
        } else {
            selector = selector.toLowerCase();
            rules = getRules.call(this.styleSheet);
            if(ui.core.isFunction(this.styleSheet[0].insertRule) {
                this.styleSheet[0].insertRule(selector, styles, rules.length);
            } else if(ui.core.isFunction(this.styleSheet[0].addRule)) {
                this.styleSheet[0].addRule(selector, styles, rules.length);
            }
        }
    },
    removeRule: function(selector) {
        var rules;
        var removeFn;
        if(ui.str.isEmpty(selector)) {
            return;
        }
        if(!this.styleSheet || this.styleSheet.length == 0) {
            return;
        }

        removeFn = this.styleSheet[0].deleteRule;
        if(!ui.core.isFunction(removeFn)) {
            removeFn = this.styleSheet[0].removeRule;
        }

        selector = selector.toLowerCase();
        rules = getRules.call(this.styleSheet);
        eachRules(rules, function(rule, index) {
            if(rule.selectorText.toLowerCase() === selector) {
                if(ui.core.isFunction(removeFn)) {
                    removeFn.call(this.styleSheet[0], index);
                }
                return false;
            }
        });
    }
};

StyleSheet.createStyleSheet = function(id) {
    var styleElem,
        styleSheet,
        head;

    // IE专有，IE11以后不再支持
    if(ui.core.isFunction(document.createStyleSheet)) {
        styleSheet = document.createStyleSheet();
        styleElem = styleSheet.ownerNode || styleSheet.owningElement;
    } else {
        head = document.getElementsByTagNames("head")[0];
        styleElem = document.createElement("style");
        head.appendChild(styleElem);
        styleSheet = document.styleSheets[document.styleSheets.length - 1];
    }
    if(!ui.str.isNullOrEmpty(id)) {
        styleElem.id = id;
    }

    return new StyleSheet($(styleSheet));
};

ui.StyleSheet = StyleSheet;
