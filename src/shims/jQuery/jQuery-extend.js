// jQuery extends

var rword = /[^, ]+/g,
    ieVersion,
    DOC = document;
//判断IE版本
function IE() {
    if (window.VBArray) {
        var mode = DOC.documentMode;
        return mode ? mode : (window.XMLHttpRequest ? 7 : 6);
    } else {
        return 0;
    }
}
ieVersion = IE();

/** 为jquery添加一个获取元素标签类型的方法 */
$.fn.nodeName = function () {
    var nodeName = this.prop("nodeName");
    if(this.length === 0 || !nodeName) {
        return null;
    }
    return nodeName;
};

/** 判断元素的tagName，不区分大小写 */
$.fn.isNodeName = function(nodeName) {
    return this.nodeName() === (nodeName + "").toUpperCase();
};

/** 判断一个元素是否出现了横向滚动条 */
$.fn.hasHorizontalScroll = function() {
    var overflowValue = this.css("overflow");
    if(overflowValue === "visible" || overflowValue === "hidden") {
        return false;
    } else if(overflowValue === "scroll") {
        return true;
    } else {
        return this.get(0).scrollWidth > this.width();
    }
};

/** 判断一个元素是否出现了纵向滚动条 */
$.fn.hasVerticalScroll = function() {
    var overflowValue = this.css("overflow");
    if(overflowValue === "visible" || overflowValue === "hidden") {
        return false;
    } else if(overflowValue === "scroll") {
        return true;
    } else {
        return this.get(0).scrollHeight > this.height();
    }
};

/** 填充select下拉框的选项 */
$.fn.bindOptions = function (arr, valueField, textField) {
    if (this.nodeName() !== "SELECT") {
        return this;
    }
    if (!valueField) {
        valueField = "value";
    }
    if (!textField) {
        textField = "text";
    }
    if (!arr.length) {
        return this;
    }
    var i, len = arr.length,
        item, options = [];
    for (i = 0; i < len; i++) {
        item = arr[i];
        if (!item) {
            continue;
        }
        options.push("<option value='", item[valueField], "'>", item[textField], "</option>");
    }
    this.html(options.join(""));
    return this;
};

/** 获取一个select元素当前选中的value和text */
$.fn.selectOption = function () {
    if (this.nodeName() !== "SELECT") {
        return null;
    }
    var option = {
        value: this.val(),
        text: null
    };
    option.text = this.children("option[value='" + option.value + "']").text();
    return option;
};

/** 为jquery添加鼠标滚轮事件 */
/*
$.fn.mousewheel = function (data, fn) {
    var mouseWheelEventName = eventSupported("mousewheel", this) ? "mousewheel" : "DOMMouseScroll";
    return arguments.length > 0 ?
        this.on(mouseWheelEventName, null, data, fn) :
        this.trigger(mouseWheelEventName);
};
if($.fn.jquery >= "3.0.0") {
    "mousewheel DOMMouseScroll".replace(rword, function (name) {
        $.event.special[ name ] = {
            delegateType: name,
            bindType: name,
            handle: function( event ) {
                var delta = 0,
                    originalEvent = event.originalEvent,
                    ret,
                    handleObj = event.handleObj;

                fixMousewheelDelta(event, originalEvent);
                ret = handleObj.handler.apply( this, arguments );
                return ret;
            }
        };
    });
} else {
    "mousewheel DOMMouseScroll".replace(rword, function (name) {
        $.event.fixHooks[name] = {
            filter: fixMousewheelDelta
        };
    });
}
function fixMousewheelDelta(event, originalEvent) {
    var delta = 0;
    if (originalEvent.wheelDelta) {
        delta = originalEvent.wheelDelta / 120;
        //opera 9x系列的滚动方向与IE保持一致，10后修正 
        if (window.opera && window.opera.version() < 10)
            delta = -delta;
    } else if (originalEvent.detail) {
        delta = -originalEvent.detail / 3;
    }
    event.delta = Math.round(delta);
    return event;
}
function eventSupported(eventName, elem) {
    if (ui.core.isDomObject(elem)) {
        elem = $(elem);
    } else if (ui.core.isJQueryObject(elem) && elem.length === 0) {
        return false;
    }
    eventName = "on" + eventName;
    var isSupported = (eventName in elem[0]);
    if (!isSupported) {
        elem.attr(eventName, "return;");
        isSupported = ui.core.type(elem[eventName]) === "function";
    }
    return isSupported;
}
*/

if(ieVersion) {
    $(DOC).on("selectionchange", function(e) {
        var el = DOC.activeElement;
        if (el && typeof el.uiEventSelectionChange === "function") {
            el.uiEventSelectionChange();
        }
    });
}
/** 为jquery添加文本框输入事件 */
$.fn.textinput = function(data, fn) {
    var eventData,
        composing,
        eventMock,
        nodeName;

    if(this.length === 0) {
        return;
    }
    if(ui.core.isFunction(data)) {
        fn = data;
        data = null;
    }
    if(!ui.core.isFunction(fn)) {
        return;
    }

    eventMock = { data: data, target: this[0] };
    composing = false;
    nodeName = this.nodeName();
    if(nodeName !== "INPUT" && nodeName !== "TEXTAREA") {
        return;
    }

    if(ieVersion) {
        //监听IE点击input右边的X的清空行为
        if(ieVersion === 9) {
            //IE9下propertychange不监听粘贴，剪切，删除引发的变动
            this[0].uiEventSelectionChange = function() {
                fn(eventMock);
            };
        }
        if (ieVersion > 8) {
            //IE9使用propertychange无法监听中文输入改动
            this.on("input", null, data, fn);
        } else {
            //IE6-8下第一次修改时不会触发,需要使用keydown或selectionchange修正
            this.on("propertychange", function(e) {
                var propertyName = e.originalEvent ? e.originalEvent.propertyName : e.propertyName;
                if (propertyName === "value") {
                    fn(eventMock);
                }
            });
            this.on("dragend", null, data, function (e) {
                setTimeout(function () {
                    fn(e);
                });
            });
        }
    } else {
        this.on("input", null, data, function(e) {
            //处理中文输入法在maxlengh下引发的BUG
            if(composing) {
                return;
            }
            fn(e);
        });
        //非IE浏览器才用这个
        this.on("compositionstart", function(e) {
            composing = true;
        });
        this.on("compositionend", function(e) {
            composing = false;
            fn(e);
        });
    }
    return this;
};
