/* 内容过滤选择器 */
var prefix = "filter_tool",
    filterCount = 0;

function onItemClick (e) {
    var elem = $(e.target);
    var nodeName;
    while ((nodeName = elem.nodeName()) !== "LABEL") {
        if (nodeName === "DIV") {
            return;
        }
        elem = elem.parent();
    }
    this._selectItem(elem);
}

ui.define("ui.ctrls.FilterTool", {
    _defineOption: function () {
        //data item is { text: "", value: "" }
        return {
            viewData: [],
            defaultIndex: 0,
            filterCss: null
        };
    },
    _defineEvents: function () {
        return ["selected", "deselected"];
    },
    _create: function () {
        var i, len, 
            item,
            viewData;

        this.filterPanel = $("<div class='filter-tools-panel'>");
        this.parent = this.element;
        this.radioName = prefix + "_" + (filterCount++);

        this.onItemClickHandler = $.proxy(onItemClick, this);

        viewData = this.getViewData();
        for (i = 0, len = viewData.length; i < len; i++) {
            item = viewData[i];
            if (item.selected === true) {
                this.option.defaultIndex = i;
            }
            this._createTool(item, i);
        }
        if (this.option.filterCss) {
            this.filterPanel.css(this.option.filterCss);
        }
        this.filterPanel.click(this.onItemClickHandler);
        this.parent.append(this.filterPanel);

        if (!ui.core.isNumber(this.option.defaultIndex) || this.option.defaultIndex >= len || this.option.defaultIndex < 0) {
            this.option.defaultIndex = 0;
        }
        this.setIndex(this.option.defaultIndex);
    },
    _createTool: function (item, index) {
        if (!ui.core.isPlainObject(item)) {
            return;
        }

        item.index = index;
        var label = $("<label class='filter-tools-item' />"),
            radio = $("<input type='radio' class='filter-tools-item-radio' name='" + this.radioName + "'/>"),
            span = $("<span class='filter-tools-item-text' />");
        label.append(radio).append(span);

        if (index === 0) {
            label.addClass("filter-tools-item-first");
        }
        label.addClass("font-highlight").addClass("border-highlight");
        radio.prop("value", item.value || "");
        span.text(item.text || "tool" + index);
        label.data("dataItem", item);

        this.filterPanel.append(label);
    },
    _selectItem: function (label) {
        var item = label.data("dataItem"),
            currentItem;
        if (this.current) {
            currentItem = this.current.data("dataItem");
            if (item.index == currentItem.index) {
                return;
            }

            this.current
                .addClass("font-highlight")
                .removeClass("background-highlight");
            this.fire("deselected", currentItem);
        }

        this.current = label;
        label.find("input").prop("checked", true);
        this.current
            .addClass("background-highlight")
            .removeClass("font-highlight");

        this.fire("selected", item);
    },
    _getIndexByValue: function(value) {
        var viewData,
            index, 
            i;

        viewData = this.getViewData();
        index = -1;
        for (i = viewData.length - 1; i >= 0; i--) {
            if (viewData[i].value === value) {
                index = i;
                break;
            }
        }
        return index;
    },
    _setDisplayIndex: function(index, isHide) {
        var viewData, 
            label;

        viewData = this.getViewData();
        if (!viewData.length === 0) {
            return;
        }
        if (!ui.core.isNumber(index)) {
            index = 0;
        }
        if (index >= 0 && index < viewData.length) {
            label = $(this.filterPanel.children()[index]);
            if(isHide) {
                label.addClass("filter-tools-item-hide");
            } else {
                label.removeClass("filter-tools-item-hide");
            }
            this._updateFirstClass();
        }  
    },
    _updateFirstClass: function() {
        var children,
            i, len,
            label,
            firstLabel;
        
        children = this.filterPanel.children();
        for(i, len = children.length; i < len; i++) {
            label = $(children[i]);
            if(label.hasClass("filter-tools-item-hide")) {
                continue;
            }
            if(!firstLabel) {
                firstLabel = label;
            } else {
                label.removeClass("filter-tools-item-first");
            }
        }
        if(firstLabel) {
            firstLabel.addClass("filter-tools-item-first");
        }
    },
    getViewData: function() {
        return Array.isArray(this.option.viewData)
            ? this.option.viewData
            : [];
    },
    getSelection: function () {
        var currentItem = null;
        if (this.current) {
            currentItem = this.current.data("dataItem");
        }
        return currentItem;
    },
    setIndex: function (index) {
        var viewData,
            label;

        viewData = this.getViewData();
        if (!viewData.length === 0) {
            return;
        }
        if (!$.isNumeric(index)) {
            index = 0;
        }
        if (index >= 0 && index < viewData.length) {
            label = $(this.filterPanel.children()[index]);
            this._selectItem(label);
        }
    },
    setValue: function(value) {
        var index = this._getIndexByValue(value);
        if(index > -1) {
            this.setIndex(index);
        }
    },
    hideIndex: function(index) {
        this._setDisplayIndex(index, true);
    },
    hideValue: function(value) {
        var index = this._getIndexByValue(value);
        if(index > -1) {
            this.hideIndex(index);
        }
    },
    showIndex: function(index) {
        this._setDisplayIndex(index, false);
    },
    showValue: function(value) {
        var index = this._getIndexByValue(value);
        if(index > -1) {
            this.showIndex(index);
        }
    }
});
$.fn.filterTool = function (option) {
    if (this.length === 0) {
        return null;
    }
    return ui.ctrls.FilterTool(option, this);
};
