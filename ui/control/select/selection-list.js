
/**
 * 自定义下拉列表
 * 可以支持多选
 */

var selectedClass = "",
    checkboxClass = "ui-selection-list-checkbox";

// 获取值
function getValue(field) {
    var value,
        arr,
        i, len;
    
    arr = field.split(".");
    value = this[arr[i]];
    for(i = 1, len = arr.length; i < len; i++) {
        value = value[arr[i]];
        if(value === undefined || value === null) {
            break;
        }
    }
    if(value === undefined) {
        value = null;
    }
    return value;
}
// 获取多个字段的值并拼接
function getArrayValue(fieldArray) {
    var result = [],
        value,
        i = 0;
    for(; i < fieldArray.length; i++) {
        value = this[fieldArray[i]];
        if(value === undefined) {
            value = null;
        }
        result.push(value + "");
    }
    return result.join("_");
}
function defaultItemFormatter() {
    var text = "";
    if (ui.core.isString(item)) {
        text = item;
    } else if (item) {
        text = this._getText.call(item, this.option.textField);
    }
    return $("<span />").text(text);
}

// 项目点击事件
function onItemClick(e) {
    var elem,
        nodeName,
        isCheckbox;

    if(this.isMultiple()) {
        e.stopPropagation();
    }

    elem = $(e.target);
    isCheckbox = elem.hasClass(checkboxClass);
    while((nodeName = elem.nodeName()) !== "LI") {
        if(elem.hasClass("ui-selection-list-panel")) {
            return;
        }
        elem = elem.parent();
    }
    //viewData = this.getViewData();
    //index = parseInt(elem.attr("data-index"), 10);
    //data = viewData
    this._selectItem(elem, isCheckbox);
}

ui.define("ui.ctrls.SelectionList", ui.ctrls.DropDownBase, {
    _defineOption: function() {
        return {
            // 是否支持多选
            multiple: false,
            // 获取值的属性名称，可以用多个值进行组合，用数组传入["id", "name"], 可以支持子属性node.id，可以支持function
            valueField: null,
            // 获取文字的属性名称，可以用多个值进行组合，用数组传入["id", "name"], 可以支持子属性node.id，可以支持function
            textField: null,
            // 数据集
            viewData: null,
            // 内容格式化器，可以自定义内容
            itemFormatter: null
        };
    },
    _defineEvents: function() {
        return ["selecting", "selected", "canceled"];
    },
    _create: function() {
        this._super();

        this._current = null;
        this._selectList = [];

        if(Array.isArray(this.option.valueField)) {
            this._getValue = getArrayValue;
        } else if(ui.core.isFunction(this.option.valueField)) {
            this._getValue = this.option.valueField;
        } else {
            this._getValue = getValue;
        }
        if(Array.isArray(this.option.textField)) {
            this._getText = getArrayValue;
        } else if(ui.core.isFunction(this.option.textField)) {
            this._getText = this.option.textField;
        } else {
            this._getText = getValue;
        }

        //事件函数初始化
        this.onItemClickHandler = $.proxy(this.onItemClick);

        this._init();
    },
    _init: function() {
        this.listPanel = $("<div class='ui-selection-list-panel border-highlight' />");
        this.listPanel.click(this.onItemClickHandler);

        this.wrapElement(this.element, this.listPanel);

        this._showClass = "ui-selection-list-show";
        this._clearClass = "ui-selection-list-clear";
        this._clear = function() {
            this.cancelSelection();
        };
        this._selectTextClass = "select-text";

        this.initPanelWidth(this.option.width);
        if (ui.core.isFunction(this.option.itemFormatter)) {
            this.itemFormatter = this.option.itemFormatter;
        } else {
            this.itemFormatter = defaultItemFormatter;
        }
        if (Array.isArray(this.option.viewData)) {
            this._fill(this.option.viewData);
        }
        this._super();
    },
    _fill: function (data) {
        var ul, li, i;

        this.clear();
        ul = $("<ul />").addClass(listUL);
        for (i = 0; i < data.length; i++) {
            this.option.viewData.push(data[i]);

            li = $("<li />");
            if (this.isMultiple()) {
                li.append(this._createCheckbox());
            }
            li.append(this.itemFormatter(data[i], i, li));
            li.attr("data-index", i);
            ul.append(li);
        }
        this.listPanel.append(ul);
    },
    _createCheckbox: function() {
        return $("<input type='checkbox' />");
    },
    _getItemIndex: function(li) {
        return parseInt(li.getAttribute(indexAttr), 10);
    },
    _getSelectionData: function(li) {
        var index = this._getItemIndex(li),
            data = {},
            viewData = this.getViewData();
        data.itemData = viewData[index];
        data.itemIndex = index;
        return data;
    },
    _selectItem: function(elem, isCheckbox, checked, isFire) {
        var eventData;

        eventData = this._getSelectionData(elem[0]);
        eventData.isSelected = false;
        eventData.itemElement = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;
    
        if(this.fire("selecting", eventData) === false) {
            return;
        }

        if(this.isMultiple()) {
            // 多选
        } else {
            // 单选
            if (this._current) {
                if (this._current[0] == elem[0]) {
                    return;
                }
                this._current
                    .removeClass(selectionClass)
                    .removeClass("background-highlight");
            }
            this.current = elem;
            this._current
                    .addClass(selectionClass)
                    .addClass("background-highlight");
            eventData.isSelected = true;
        }

        if(isFire === false) {
            return;
        }
        this.fire("selected", eventData);
    },

    /// API
    /** 重新设置数据 */
    setData: function(data) {
        if(Array.isArray(data)) {
            this._fill(data);
        }
    },
    /** 获取选中项 */
    getSelection: function() {

    },
    /** 设置选中项 */
    setSelection: function() {
    },
    /** 取消选中 */
    cancelSelection: function() {

    },
    /** 获取视图数据 */
    getViewData: function() {
        return Array.isArray(this.option.viewData) 
            ? this.option.viewData 
            : [];
    },
    /** 获取项目数 */
    count: function() {
        return this.viewData.length;
    },
    /** 是否可以多选 */
    isMultiple: function() {
        return this.option.multiple === true;
    },
    /** 清空列表 */
    clear: function() {
        this.option.viewData = [];
        this.listPanel.empty();
        this._current = null;
        this._selectList = [];
    }
});

$.fn.selectionList = function (option) {
    if (this.length === 0) {
        return null;
    }
    return ui.ctrls.SelectionList(option, this);
};
