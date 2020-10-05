/* 内容过滤选择器 */
var prefix = "filter_button_",
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

ui.ctrls.define("ui.ctrls.FilterButton", {
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

        this.filterPanel = $("<div class='filter-button-panel'>");
        this.parent = this.element;
        this.radioName = prefix + (filterCount++);
        this._current = null;

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
        this.filterPanel.on("click", this.onItemClickHandler);
        this.parent.append(this.filterPanel);

        if (!ui.core.isNumber(this.option.defaultIndex) || this.option.defaultIndex >= len || this.option.defaultIndex < 0) {
            this.option.defaultIndex = 0;
        }
        this.setIndex(this.option.defaultIndex);
    },
    _createTool: function (item, index) {
        var label,
            radio,
            span;

        if (!ui.core.isPlainObject(item)) {
            return;
        }

        label = $("<label class='filter-button-item' />");
        radio = $("<input type='radio' class='filter-button-item-radio' name='" + this.radioName + "'/>");
        span = $("<span class='filter-button-item-text' />");
        label.append(radio).append(span);

        label.attr("data-index", index);
        if (index === 0) {
            label.addClass("filter-button-item-first");
        }
        label.addClass("font-highlight").addClass("border-highlight");

        radio.prop("value", item.value || "");
        span.text(item.text || "tool" + index);

        this.filterPanel.append(label);
    },
    _getSelectionData: function(elem) {
        var index = parseInt(elem.attr("data-index"), 10);
        return {
            itemIndex: index,
            itemData: this.getViewData()[index]
        };
    },
    _selectItem: function (label) {
        var eventData;
        if (this._current) {
            if (label[0] === this._current[0]) {
                return;
            }

            this._current
                .addClass("font-highlight")
                .removeClass("background-highlight");
            eventData = this._getSelectionData(this._current);
            this.fire("deselected", eventData);
        }

        this._current = label;
        label.find("input").prop("checked", true);
        this._current
            .addClass("background-highlight")
            .removeClass("font-highlight");

        eventData = this._getSelectionData(this._current);
        this.fire("selected", eventData);
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
        if (viewData.length === 0) {
            return;
        }
        if (!ui.core.isNumber(index)) {
            index = 0;
        }
        if (index >= 0 && index < viewData.length) {
            label = $(this.filterPanel.children()[index]);
            if(isHide) {
                label.addClass("filter-button-item-hide");
            } else {
                label.removeClass("filter-button-item-hide");
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
            if(label.hasClass("filter-button-item-hide")) {
                continue;
            }
            if(!firstLabel) {
                firstLabel = label;
            } else {
                label.removeClass("filter-button-item-first");
            }
        }
        if(firstLabel) {
            firstLabel.addClass("filter-button-item-first");
        }
    },
    getViewData: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData : [];
    },
    getSelection: function () {
        if (this._current) {
            return this._getSelectionData(this._current);
        }
        return null;
    },
    setIndex: function (index) {
        var viewData,
            label;

        viewData = this.getViewData();
        if (viewData.length === 0) {
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
$.fn.filterButton = function (option) {
    if (this.length === 0) {
        return null;
    }
    return ui.ctrls.FilterButton(option, this);
};
