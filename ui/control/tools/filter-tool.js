/* 内容过滤选择器 */
var prefix = "filter_tool";
var filterCount = 0;

ui.define("ui.ctrls.FilterTool", {
    _defineOption: function () {
        //data item is { text: "", value: "" }
        return {
            data: [],
            defaultIndex: 0,
            filterCss: null
        };
    },
    _defineEvents: function () {
        return ["selected", "deselected"];
    },
    _create: function () {
        var i, len, item;

        this.data = Array.isArray(this.option.data) ? this.option.data : [];
        this.filterPanel = $("<div class='filter-tools-panel'>");
        this.parent = this.element;
        this.radioName = prefix + "_" + (filterCount++);

        len = this.data.length;
        for (i = 0; i < len; i++) {
            item = this.data[i];
            if (item.selected === true) {
                this.option.defaultIndex = i;
            }
            this._createTool(item, i);
        }
        if (this.option.filterCss) {
            this.filterPanel.css(this.option.filterCss);
        }
        this.filterPanel.click($.proxy(this.onClickHandler, this));
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
            radio = $("<input type='radio' name='" + this.radioName + "'/>"),
            span = $("<span />");
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
    onClickHandler: function (e) {
        var elem = $(e.target);
        var nodeName;
        while ((nodeName = elem.nodeName()) !== "LABEL") {
            if (nodeName === "DIV") {
                return;
            }
            elem = elem.parent();
        }
        this.selectFilterItem(elem);
    },
    selectFilterItem: function (label) {
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
        var index = -1;
        if(!this.data) {
            return index;
        }
        var i = this.data.length - 1;
        for (; i >= 0; i--) {
            if (this.data[i].value === value) {
                index = i;
                break;
            }
        }
        return index;
    },
    setIndex: function (index) {
        if (!this.data) {
            return;
        }
        if (!$.isNumeric(index)) {
            index = 0;
        }
        var label;
        if (index >= 0 && index < this.data.length) {
            label = $(this.filterPanel.children()[index]);
            this.selectFilterItem(label);
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
    },
    _setDisplayIndex: function(index, isHide) {
        if (!this.data) {
            return;
        }
        if (!ui.core.isNumber(index)) {
            index = 0;
        }
        var label;
        if (index >= 0 && index < this.data.length) {
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
        var children = this.filterPanel.children();
        var i = 0,
            len = children.length,
            label,
            firstLabel;
        for(; i < len; i++) {
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
    getCurrent: function () {
        var currentItem = null;
        if (this.current) {
            currentItem = this.current.data("dataItem");
        }
        return currentItem;
    }
});
$.fn.createFilterTools = function (option) {
    if (this.length === 0) {
        return null;
    }
    return ui.ctrls.FilterTool(option, this);
};
