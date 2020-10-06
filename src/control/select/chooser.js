
/**
 * 选择器
 */

var selectedClass = "ui-chooser-selection-item";

var sizeInfo = {
        S: 3,
        M: 5,
        L: 9
    },
    borderWidth = 1,
    defaultMargin = 0,
    defaultItemSize = 32,
    defaultSize = "M",
    minWidth = 120,
    chooserTypes;

function noop() {}
function addZero (val) {
    return val < 10 ? "0" + val : "" + val;
}
function getText(val) {
    return val + "";
}
function getList(begin, end, formatter) {
    var i, data, args;

    args = [];
    args.push(null);
    for(i = 3; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    data = [];
    for(i = begin; i <= end; i++) {
        args[0] = i;
        data.push(formatter.apply(this, args));
    }
    return data;
}
function getTimeData(hasHour, hasMinute, hasSecond) {
    var data, item;

    data = [];
    if(hasHour) {
        // 时
        item = {
            title: "时"
        };
        item.list = getList.call(this, 0, 23, addZero);
        data.push(item);
    }
    if(hasMinute) {
        // 分
        item = {
            title: "分"
        };
        item.list = getList.call(this, 0, 59, addZero);
        data.push(item);
    }
    if(hasSecond) {
        //秒
        item = {
            title: "秒"
        };
        item.list = getList.call(this, 0, 59, addZero);
        data.push(item);
    }
    return data;
}

chooserTypes = {
    hourMinute: function() {
        var data;

        data = getTimeData(true, true, false);
        this.option.spliter = ":";
        this.defaultValue = function () {
            var now = new Date();
            return [
                addZero(now.getHours()), 
                addZero(now.getMinutes())
            ];
        };
        this.getValue = this.getText = getText;
        return data;
    },
    time: function() {
        var data;

        data = getTimeData(true, true, true);
        this.option.spliter = ":";
        this.defaultValue = function () {
            var now = new Date();
            return [
                addZero(now.getHours()), 
                addZero(now.getMinutes()),
                addZero(now.getSeconds())
            ];
        };
        this.getValue = this.getText = getText;
        return data;
    },
    yearMonth: function() {
        var data, begin, end, item;
        
        data = [];
        // 年
        begin = (new Date()).getFullYear() - 49;
        end = begin + 99;
        item = {
            title: "年"
        };
        item.list = getList.call(this, begin, end, getText);
        data.push(item);
        // 月
        begin = 1;
        end = 12;
        item = {
            title: "月"
        };
        item.list = getList.call(this, begin, end, addZero);
        data.push(item);

        this.option.spliter = "-";
        this.defaultValue = function () {
            var now = new Date();
            return [
                addZero(now.getFullYear()),
                addZero(now.getMonth() + 1)
            ];
        };
        this.getValue = this.getText = getText;
        return data;
    }
};

// 动画处理
function easeTo(pos) {
    return Math.pow(pos, .25);
}
function startScroll(item) {
    var that, fps, ease,
        animationFn;

    if (item.beginAnimation) {
        item.duration = 200;
        item.startTime = (new Date()).getTime();
        return;
    }

    item.startTime = (new Date()).getTime();
    item.duration = 160;
    item.beginAnimation = true;

    that = this;
    fps = 60;
    ease = easeTo;

    animationFn = function() {
        //当前帧开始的时间
        var newTime = new Date().getTime(),
            //逝去时间
            timestamp = newTime - item.startTime,
            delta = ease(timestamp / item.duration),
            change = item.scrollEnd - item.scrollBegin,
            currVal = Math.ceil(item.scrollBegin + delta * change);
        item.target.scrollTop(currVal);
        if (item.duration <= timestamp) {
            item.target.scrollTop(item.scrollEnd);
            stopScroll.call(that, item);
            that._selectItem(item);
        }
    };

    this._deselectItem(item);
    animationFn();
    item.stopScrollHandler = setInterval(animationFn, 1000 / fps);
}
function stopScroll(item) {
    clearInterval(item.stopScrollHandler);
    item.beginAnimation = false;
}
function setScrollTop(elem, index) {
    if(index < 0) {
        index = 0;
    }
    elem.scrollTop(index * (this.option.itemSize + this.option.margin));
}

// 事件处理函数
function onFocus(e) {
    ui.hideAll(this);
    this.show();
    this._updateSelectionState();
}
function onItemClick(e) {
    var elem, nodeName,
        index, item;

    e.stopPropagation();
    elem = $(e.target);
    while((nodeName = elem.nodeName()) !== "LI") {
        if(elem.hasClass("ui-chooser-list")) {
            return;
        }
    }
    if(elem.hasClass("ui-chooser-empty-item")) {
        return;
    }
    if(elem.hasClass(selectedClass)) {
        return;
    }

    index = parseInt(elem.attr("data-index"), 10);
    item = this.scrollData[parseInt(elem.parent().parent().attr("data-index"), 10)];
    this._chooseItem(item, index);
}
function onMousewheel(e) {
    var div, index, item, 
        val, change, direction,
        delta;
    e.stopPropagation();

    div = e.data.target;
    index = parseInt(div.attr("data-index"), 10);
    item = this.scrollData[index];
    val = this.option.itemSize + this.option.margin;
    delta = Math.trunc(e.deltaY || -(e.wheelDelta));
    change = delta * val;
    direction = delta > 0;
    if(item.lastDirection === null) {
        item.lastDirection = direction;
    }
    if(item.lastDirection !== direction) {
        item.lastDirection = direction;
        stopScroll.call(this, item);
    }
    if(!item.beginAnimation) {
        item.scrollBegin = div.scrollTop();
        item.scrollEnd = parseInt((item.scrollBegin + change) / val, 10) * val;
    } else {
        item.scrollBegin = div.scrollTop();
        item.scrollEnd = parseInt((item.scrollEnd + change) / val, 10) * val;
    }

    startScroll.call(this, item);
    return false; 
}

ui.ctrls.define("ui.ctrls.Chooser", ui.ctrls.DropDownBase, {
    _defineOption: function() {
        return {
            // 选择器类型，支持yearMonth, time, hourMinute，也可以自定义
            type: false,
            // 显示标题，如果数据中没有单独设置则会显示这个内容
            title: null,
            // 视图数据 [{title: 时, list: [1, 2, ...]}, ...]
            viewData: null,
            // 分隔符常用于日期格式，时间格式
            spliter: "",
            // 候选项的间隔距离
            margin: defaultMargin,
            // 候选项的显示个数 S: 3, M: 5, L: 9
            size: defaultSize,
            // 候选项的大小
            itemSize: defaultItemSize
        };
    },
    _defineEvents: function() {
        return ["changing", "changed", "cancel", "listChanged"];
    },
    _create: function() {
        var rect;

        this._super();

        // 存放当前的选择数据
        this.scrollData = null;
        if (sizeInfo.hasOwnProperty(this.option.size)) {
            this.size = sizeInfo[this.option.size];
        } else {
            this.size = sizeInfo[defaultSize];
        }

        if (!ui.core.isNumber(this.option.margin) || this.option.margin < 0) {
            this.option.margin = defaultMargin;
        }

        if (!ui.core.isNumber(this.option.itemSize) || this.option.itemSize <= 0) {
            this.option.itemSize = defaultItemSize;
        }

        rect = this.element.getBoundingClientRect();
        this.width = rect.width - borderWidth * 2;
        if (this.width < this.itemSize + (this.margin * 2)) {
            this.width = minWidth;
        }

        this.onFocusHandler = onFocus.bind(this);
        this.onItemClickHandler = onItemClick.bind(this);
        this.onMousewheelHandler = onMousewheel.bind(this);
    },
    _render: function() {
        this.chooserPanel = $("<div class='ui-chooser-panel border-highlight' />");
        this.chooserPanel.css("width", this.width + "px");

        this._itemTitlePanel = $("<div class='ui-chooser-title-panel' />");
        this._itemListPanel = $("<div class='ui-chooser-list-panel' />");
        this._itemListPanel.append(this._createFocusElement());
        this._createItemList(this._itemTitlePanel, this._itemListPanel);

        this.chooserPanel
            .append(this._itemTitlePanel)
            .append(this._itemListPanel);

        this._selectTextClass = "ui-select-text";
        this._showClass = "ui-chooser-show";
        this._clearClass = "ui-clear-text";
        this._clear = function () {
            this.cancelSelection();
        };
        this.wrapElement(this.element, this.chooserPanel);
        this._super({
            focus: this.onFocusHandler
        });
        this.chooserPanel.on("click", function (e) {
            e.stopPropagation();
        });
    },
    _createFocusElement: function() {
        var div = $("<div class='focus-choose-element' />");
        div.addClass("border-highlight");
        div.css("top", this.option.itemSize * ((this.size - 1) / 2));
        return div;
    },
    _createItemList: function(itemTitlePanel, itemListPanel) {
        var sizeData = this._fillList(itemTitlePanel, itemListPanel);
        this.chooserPanel.css("width", sizeData.width + "px");
        itemListPanel.css("height", sizeData.height + "px");
    },
    _fillList: function(itemTitlePanel, itemListPanel) {
        var sizeData, div, css, ul,
            item, i, len, tsd, isClassifiableTitle,
            tempWidth,
            surWidth,
            temp;
        
        sizeData = {
            width: 0,
            height: this.size * (this.option.itemSize + this.option.margin) + this.option.margin
        };

        if(ui.core.isString(this.option.type)) {
            if(chooserTypes.hasOwnProperty(this.option.type)) {
                this.scrollData = chooserTypes[this.option.type].call(this);
            }
        } else if(ui.core.isFunction(this.option.type)) {
            this.scrollData = this.option.type.call(this);
        }

        if(!this.scrollData) {
            this.scrollData = this.option.viewData;
        }
        if(!Array.isArray(this.scrollData) || this.scrollData.length === 0) {
            return sizeData;
        }

        len = this.scrollData.length;
        tempWidth = Math.floor(this.width / len);
        surWidth = this.width - tempWidth * len;

        //设置标题
        isClassifiableTitle = false;
        for(i = 0; i < len; i++) {
            if(this.scrollData[i].title) {
                isClassifiableTitle = true;
                break;
            }
        }
        if(!isClassifiableTitle) {
            itemTitlePanel.append("<span class='font-highlight'>" + this.option.title + "</span>");
        }

        for(i = 0; i < len; i++) {
            item = this.scrollData[i];
            if(surWidth > 0) {
                temp = 1;
                surWidth--;
            } else {
                temp = 0;
            }
            css = {
                "left": sizeData.width + "px",
                "width": (tempWidth + temp) + "px"
            };

            if(isClassifiableTitle) {
                div = $("<div class='ui-chooser-title-item font-highlight' />");
                div.css(css);
                div.text(item.title || "");
                itemTitlePanel.append(div);
            }

            div = $("<div class='ui-chooser-list' />");
            div.css(css);
            div.attr("data-index", i);

            tsd = this.scrollData[i];
            tsd.target = div;
            tsd.lastDirection = null;

            sizeData.width += tempWidth + temp + this.option.margin;

            div.on("wheel", { target: div }, this.onMousewheelHandler);
            div.on("click", this.onItemClickHandler);
            
            ul = this._createList(item);
            div.append(ul);
            itemListPanel.append(div);
        }
        return sizeData;
    },
    _createList: function(listItem) {
        var list, headArr, footArr,
            ul, li, 
            attachmentCount,
            i, len;

        // 计算需要附加的空元素个数
        attachmentCount = this._getAttachmentCount();
        // 在头尾添加辅助元素
        list = listItem.list;
        headArr = [];
        footArr = [];
        for(i = 0; i < attachmentCount; i++) {
            headArr.push(null);
            footArr.push(null);
        }
        list = headArr.concat(list, footArr);

        ul = $("<ul class='ui-chooser-list-ul' />");
        for(i = 0, len = list.length; i < len; i++) {
            li = this._createItem(list[i]);
            // 默认选中第一个
            if(i - attachmentCount === 0) {
                listItem._current = li;
                li.addClass(selectedClass).addClass("font-highlight");
            }
            li.attr("data-index", i);
            ul.append(li);
        }
        li.css("margin-bottom", this.option.margin + "px");
        return ul;
    },
    _createItem: function(text) {
        var li, css;

        li = $("<li class='ui-chooser-list-li' />");
        css = {
            width: this.option.itemSize + "px",
            height: this.option.itemSize + "px"
        };
        li.addClass("ui-chooser-item");
        if (text) {
            li.text(this.getText(text));
        } else {
            li.addClass("ui-chooser-empty-item");
        }
        return li;
    },
    _getAttachmentCount: function() {
        return Math.floor((this.size - 1) / 2);
    },
    _getIndexes: function(fn) {
        var attachmentCount,
            indexes,
            i, len, item, index;
        
        attachmentCount = this._getAttachmentCount();
        indexes = [];
        if(!ui.core.isFunction(fn)) {
            fn = noop;
        }
        for(i = 0, len = this.scrollData.length; i < len; i++) {
            item = this.scrollData[i];
            if(item._current) {
                index = parseInt(item._current.attr("data-index"), 10);
                index -= attachmentCount;
                indexes.push(index);
                fn.call(this, item.list[index]);
            } else {
                indexes.push(-1);
                fn.call(this, null);
            }
        }
        return indexes;
    },
    _getValues: function() {
        var values,
            indexes;
        
        values = [];
        indexes = this._getIndexes(function(item) {
            if(item) {
                values.push(this.getValue(item));
            } else {
                values.push("");
            }
        });

        return {
            values: values,
            indexes: indexes
        };
    },
    _setValues: function(values) {
        var i, j, len, 
            item, indexArray;

        if(!Array.isArray(values)) {
            return;
        }

        indexArray = [];
        for (i = 0; i < values.length; i++) {
            item = this.scrollData[i];
            if (!item) {
                continue;
            }
            indexArray[i] = 0;
            for (j = 0, len = item.list.length; j < len; j++) {
                if (this.getValue(item.list[j]) === values[i]) {
                    indexArray[i] = j;
                    break;
                }
            }
        }
        this._setSelectionState(indexArray);
    },
    _setSelectionState: function(indexArray) {
        var item, index, i, len;
        
        if (indexArray.length != this.scrollData.length) {
            return;
        }
        for (i = 0, len = indexArray.length; i < len; i++) {
            index = indexArray[i];
            item = this.scrollData[i];
            this._deselectItem(item);
            setScrollTop.call(this, item.target, index);
            this._selectItem(item);
        }
    },
    _updateSelectionState: function() {
        var i, indexArray;

        indexArray = this._getIndexes();
        for(i = indexArray.length - 1; i >= 0; i--) {
            if(indexArray[i] === -1) {
                indexArray.splice(i, 1);
            }
        }
        if (indexArray.length > 0) {
            this._setSelectionState(indexArray);
        } else if (ui.core.isFunction(this.defaultValue)) {
            this._setValues(this.defaultValue());
        } else {
            indexArray = [];
            for (i = 0; i < this.scrollData.length; i++) {
                indexArray.push(0);
            }
            this._setSelectionState(indexArray);
        }
    },
    _chooseItem: function(item, index) {
        if(item.beginAnimation) {
            stopScroll.call(this, item);
        }
        index -= this._getAttachmentCount();
        item.scrollBegin = item.target.scrollTop();
        item.scrollEnd = index * (this.option.itemSize + this.option.margin);
        startScroll.call(this, item);
    },
    _selectItem: function(item) {
        var ul,
            scrollTop,
            index, i, len,
            that,
            eventData;

        for (i = 0, len = this.scrollData.length; i < len; i++) {
            if (this.scrollData[i].beginAnimation) {
                return;
            }
        }
        
        ul = item.target.find("ul");
        scrollTop = item.target.scrollTop();
        index = parseInt((scrollTop + this.option.itemSize * .3) / (this.option.itemSize + this.option.margin), 10);

        eventData = {
            listItem: item,
            itemIndex: index 
        };
        this.fire("listChanged", eventData);

        item._current = $(ul.children()[index + this._getAttachmentCount()]);
        item._current
            .addClass(selectedClass)
            .addClass("font-highlight");

        eventData = this._getValues();
        eventData.text = "";
        if(Array.isArray(eventData.values)) {
            that = this;
            eventData.text = eventData.values.map(function(item) {
                return that.getText(item);
            }).join(this.option.spliter);
        }

        if (this.fire("changing", eventData) === false) {
            return;
        }

        this._selectedItems = eventData.indexes;
        this.fire("changed", eventData);
    },
    _deselectItem: function(item) {
        if(item._current) {
            item._current
                .removeClass(selectedClass)
                .removeClass("font-highlight");
        }
    },
    /** 获取当前选中项 */
    getSelection: function() {
        var selectionItem,
            values = [],
            i;
        selectionItem = this._getValues();
        for(i = 0; i < selectionItem.indexes.length; i++) {
            if(selectionItem.indexes[i] === -1) {
                values.push(null);
            } else {
                values.push(selectionItem.values[i]);
            }
        }
        return values;
    },
    /** 设置选中项 */
    setSelection: function(values) {
        this._setValues(values);
    },
    /** 清除选择 */
    cancelSelection: function(isFire) {
        this.scrollData.forEach(function(item) {
            item._current = null;
        });
        if(isFire !== false) {
            this.fire("cancel");
        }
    }
});

// 扩展选择器类型
ui.ctrls.Chooser.extendType = function(type, fn) {
    if(!ui.core.isFunction(fn)) {
        return;
    }
    if(ui.core.isString(type) && !chooserTypes.hasOwnProperty(type)) {
        chooserTypes[type] = fn;
    }
};

$.fn.chooser = function(option) {
    if(this.length === 0) {
        return null;
    }
    return ui.ctrls.Chooser(option, this);
};
