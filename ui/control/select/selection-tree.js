/**
 * 树形下拉列表，可以完美的解决多级联动下拉列表的各种弊端
 * 支持单项选择和多项选择
 */

var selectedClass = "ui-selection-tree-selected",
    checkboxClass = "ui-selection-tree-checkbox",
    foldClass = "fold-button",
    expandClass = "expand-button";

var instanceCount = 0,
    parentNode = "_selectionTreeParentNode";

var flodButtonLeft = 3,
    flodButtonWidth = 14;

function getParent() {
    return this[parentNode];
}
// 获取值
function getValue(field) {
    var value,
        arr,
        i, len;
    
    arr = field.split(".");
    value = this[arr[0]];
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
function defaultItemFormatter(text, marginLeft, item) {
    var span = $("<span />").text(text);
    if(marginLeft > 0) {
        span.css("margin-left", marginLeft);
    }
    return span;
}
function setChecked(cbx, checked) {
    if(checked) {
        cbx.removeClass("fa-square")
            .addClass("fa-check-square").addClass("font-highlight");
    } else {
        cbx.removeClass("fa-check-square").removeClass("font-highlight")
            .addClass("fa-square");
    }
}
function isChecked(cbx) {
    return cbx.hasClass("fa-check-square");
}

// 事件处理函数
// 树节点点击事件
function onTreeItemClick(e) {
    var elem,
        nodeName,
        nodeData,
        hasChildren;

    if(this.isMultiple()) {
        e.stopPropagation();
    }

    elem = $(e.target);
    if(elem.hasClass(foldClass)) {
        e.stopPropagation();
        this.onTreeFoldClickHandler(e);
        return;
    }

    while((nodeName = elem.nodeName()) !== "DT"
            && !elem.hasClass("ui-selection-tree-dt")) {
        
        if(elem.hasClass("ui-selection-tree-panel")) {
            return;
        }
        elem = elem.parent();
    }

    if(elem[0] !== e.target) {
        elem.context = e.target;
    }

    nodeData = this._getNodeData(elem);
    hasChildren = this._hasChildren(nodeData);
    if(this.option.nodeSelectable === true || !hasChildren) {
        this._selectItem(elem, nodeData);
    } else {
        if(hasChildren) {
            e.stopPropagation();
            this.onTreeFoldClickHandler({
                target: elem.children(".fold-button")[0]
            });
        }
    }
}
// 折叠按钮点击事件
function onTreeFoldClick(e) {
    var elem, dt;

    elem = $(e.target);
    dt = elem.parent();
    if(elem.hasClass(expandClass)) {
        this._setChildrenExpandStatus(dt, false, elem);
    } else {
        this._setChildrenExpandStatus(dt, true, elem);
    }
}
// 异步状态点击折叠按钮事件
function onTreeFoldLazyClick(e) {
    var elem, dt, dd;

    elem = $(e.target);
    dt = elem.parent();
    dd = dt.next();
    if(elem.hasClass(expandClass)) {
        this._setChildrenExpandStatus(dt, false, elem);
    } else {
        this._setChildrenExpandStatus(dt, true, elem);
        if(dd.children().length === 0) {
            this._loadChildren(dt, dd, this._getNodeData(dt));
        }
    }
}

ui.define("ui.ctrls.SelectionTree", ui.ctrls.DropDownBase, {
    _defineOption: function() {
        return {
            // 是否支持多选
            multiple: false,
            // 获取值的属性名称，可以用多个值进行组合，用数组传入["id", "name"], 可以支持子属性node.id，可以支持function
            valueField: null,
            // 获取文字的属性名称，可以用多个值进行组合，用数组传入["id", "name"], 可以支持子属性node.id，可以支持function
            textField: null,
            // 获取父节点的属性名称，可以用多个值进行组合，用数组传入["id", "name"], 可以支持子属性node.id，可以支持function
            parentField: null,
            // 子节点的属性名称，子节点为数组，和parentField互斥，如果两个值都设置了，优先使用childField
            childField: null,
            // 视图数据
            viewData: null,
            // 是否可以选择父节点
            nodeSelectable: true,
            // 默认展开的层级，false|0：显示第一层级，true：显示所有层级，数字：显示的层级值(0表示根级别，数值从1开始)
            defaultExpandLevel: false,
            // 是否延迟加载，只有用户展开这个节点才会渲染节点下面的数据（对大数据量时十分有效）
            lazy: false,
            // 内容格式化器，可以自定义内容
            itemFormatter: null,
            // 下拉框的宽度
            width: null
        };
    },
    _defineEvents: function() {
        return ["changing", "changed", "cancel"];
    },
    _create: function() {
        var fields, fieldMethods;

        this._super();
        this._current = null;
        this._selectList = [];
        this._treePrefix = "selectionTree_" + (++instanceCount) + "_";
        
        fields = [this.option.valueField, this.option.textField, this.option.parentField];
        fieldMethods = ["_getValue", "_getText", "_getParent"];
        fields.forEach(function(item, index) {
            if(Array.isArray(item, index)) {
                this[fieldMethods[index]] = getArrayValue;
            } else if($.isFunction(item)) {
                this[fieldMethods[index]] = item;
            } else {
                this[fieldMethods[index]] = getValue;
            }
        }, this);

        if(this.option.defaultExpandLevel === false) {
            this.expandLevel = 0;
        } else {
            if(ui.core.isNumber(this.option.defaultExpandLevel)) {
                this.expandLevel = 
                    this.option.defaultExpandLevel <= 0
                        ? 0 
                        : this.option.defaultExpandLevel;
            } else {
                // 设置到最大展开1000层
                this.expandLevel = 1000;
            }
        }

        if(this.option.lazy) {
            if(ui.core.isFunction(this.option.lazy.hasChildren)) {
                this._hasChildren = this.option.lazy.hasChildren;
            }
            if(ui.core.isFunction(this.option.lazy.loadChildren)) {
                this._loadChildren = this.option.lazy.loadChildren;
                // 当数据延迟加载是只能默认加载根节点
                this.expandLevel = 0;
            }

            this.onTreeFoldClickHandler = onTreeFoldLazyClick.bind(this);
            this.option.lazy = true;
        } else {
            this.onTreeFoldClickHandler = onTreeFoldClick.bind(this);
            this.option.lazy = false;
        }

        if(!ui.core.isFunction(this.option.itemFormatter)) {
            this.option.itemFormatter = defaultItemFormatter;
        }

        this.onTreeItemClickHandler = onTreeItemClick.bind(this);
    },
    _render: function() {
        this.treePanel = $("<div class='ui-selection-tree-panel border-highlight' />");
        this.treePanel.click(this.onTreeItemClickHandler);
        this.wrapElement(this.element, this.treePanel);

        this._showClass = "ui-selection-tree-show";
        this._clearClass = "ui-selection-tree-clear";
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
        var dl,
            viewData;

        this.clear();
        this.option.viewData = data;

        dl = $("<dl class='ui-selection-tree-dl' />");
        viewData = this.getViewData();
        if (this.option.childField) {
            this._renderTree(viewData, dl, 0);
        } else if (this.option.parentField) {
            this._listDataToTree(viewData, dl, 0);
        }
        this.treePanel.append(dl);
    },
    _listDataToTree: function(viewData, dl, level) {
        var childField;
        if(!Array.isArray(viewData) || viewData.length === 0) {
            return;
        }

        this.originalViewData = viewData;
        childField = "children";
        viewData = ui.trans.listToTree(
            viewData, 
            this.option.parentField, 
            this.option.valueField, 
            childField);
        if(viewData) {
            this.option.childField = childField;
            this.option.viewData = viewData;
            this._renderTree(viewData, dl, level);
        } else {
            delete this.originalViewData;
        }
    },
    _renderTree: function(list, dl, level, idValue, parentData) {
        var id, text, children,
            item, i, len, tempMargin,
            childDL, dt, dd, cbx,
            path;
        if(!Array.isArray(list) || list.length === 0) {
            return;
        }

        path = idValue;
        for(i = 0, len = list.length; i < len; i++) {
            tempMargin = 0;
            item = list[i];
            item[parentNode] = parentData || null;
            item.getParent = getParent;

            id = path ? (path + "_" + i) : ("" + i);
            text = this._getText.call(item, this.option.textField) || "";

            dt = $("<dt class='ui-selection-tree-dt' />");
            if(this.isMultiple()) {
                cbx = this._createCheckbox();
            }
            dt.prop("id", this._treePrefix + id);
            dl.append(dt);

            if(this._hasChildren(item)) {
                children = this._getChildren(item);
                dd = $("<dd class='ui-selection-tree-dd' />");

                if(level + 1 <= this.expandLevel) {
                    dt.append(this._createFoldButton(level, expandClass, "fa-angle-down"));
                } else {
                    dt.append(this._createFoldButton(level, "fa-angle-right"));
                    dd.css("display", "none");
                }
                if(this.option.nodeSelectable === true && cbx) {
                    dt.append(cbx);
                }

                if(this.option.lazy) {
                    if(level + 1 <= this.expandLevel) {
                        this._loadChildren(dt, dd, item);
                    }
                } else {
                    childDL = $("<dl class='ui-selection-tree-dl' />");
                    this._renderTree(children, childDL, level + 1, id, item);
                    dd.append(childDL);
                }
                dl.append(dd);
            } else {
                tempMargin = (level + 1) * (flodButtonWidth + flodButtonLeft) + flodButtonLeft;
                if(cbx) {
                    cbx.css("margin-left", tempMargin + "px");
                    tempMargin = 0;
                    dt.append(cbx);
                }
            }
            dt.append(
                this.option.itemFormatter.call(this, text, tempMargin, item, dt));
        }
    },
    _createCheckbox: function() {
        var checkbox = $("<i class='fa fa-square' />");
        checkbox.addClass(checkboxClass);
        return checkbox;
    },
    _createFoldButton: function(level) {
        var btn, i, len;
        
        btn = $("<i class='fold-button font-highlight-hover fa' />");
        for (i = 1, len = arguments.length; i < len; i++) {
            btn.addClass(arguments[i]);
        }
        btn.css("margin-left", (level * (flodButtonWidth + flodButtonLeft) + flodButtonLeft) + "px");
        return btn;
    },
    _setChildrenExpandStatus: function(dt, isOpen, btn) {
        var dd = dt.next();
        if(!btn || btn.length === 0) {
            btn = dt.children(".fold-button");
        }
        if(isOpen) {
            btn.addClass(expandClass)
                .removeClass("fa-angle-right")
                .addClass("fa-angle-down");
            dd.css("display", "block");
        } else {
            btn.removeClass(expandClass)
                .removeClass("fa-angle-down")
                .addClass("fa-angle-right");
            dd.css("display", "none");
        }
    },
    _getChildren: function (nodeData) {
        return nodeData[this.option.childField] || null;
    },
    _hasChildren: function(nodeData) {
        var children = this._getChildren(nodeData);
        return Array.isArray(children) && children.length > 0;
    },
    _loadChildren: function(dt, dd, nodeData) {
        var children,
            dl;
        
        children = this._getChildren(nodeData)
        if(Array.isArray(children) && children.length > 0) {
            dl = $("<dl />");
            this._renderTree(
                children,
                dl,
                this._getLevel(nodeData) + 1,
                ui.str.lTrim(dt.prop("id"), this._treePrefix),
                nodeData);
            dd.append(dl);
        }
    },
    _getLevel: function(nodeData) {
        var level = 0;
        while(nodeData[parentNode]) {
            level++;
            nodeData = nodeData[parentNode];
        }
        return level;
    },
    _getNodeData: function(elem) {
        var id;
        if(!elem) {
            return null;
        }
        id = elem.prop("id");
        if(id.length === 0 || id.indexOf(this._treePrefix) !== 0) {
            return null;
        }
        id = id.substring(this._treePrefix.length);
        return this._getNodeDataByPath(id);
    },
    _getNodeDataByPath: function(path) {
        var arr, data, viewData,
            i, len;
        if(!path) {
            return null;
        }
        arr = path.split("_");
        viewData = this.getViewData();
        data = viewData[parseInt(arr[0], 10)];
        for(i = 1, len = arr.length; i < len; i++) {
            data = this._getChildren(data)[parseInt(arr[i], 10)];
        }
        return data;
    },
    _getSelectionData: function(dt, nodeData) {
        var data = {};
        if(!nodeData) {
            nodeData = this._getNodeData(dt);
        }
        data.nodeData = nodeData;
        data.children = this._getChildren(nodeData);
        data.parent = nodeData[parentNode];
        data.isRoot = !nodeData[parentNode];
        data.isNode = this._hasChildren(nodeData);
        return data;
    },
    _selectItem: function(elem, nodeData, isSelection, isFire) {
        var eventData,
            checkbox,
            isMultiple,
            i, len;

        eventData = this._getSelectionData(elem, nodeData);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        isMultiple = this.isMultiple();
        if(isMultiple) {
            checkbox = elem.find("." + checkboxClass);
        }

        // 当前是要选中还是取消选中
        if(ui.core.isBoolean(isSelection)) {
            eventData.isSelection = isSelection;
        } else {
            if(isMultiple) {
                eventData.isSelection = !isChecked.call(this, checkbox);
            } else {
                eventData.isSelection = true;
            }
        }

        if(this.fire("changing", eventData) === false) {
            return;
        }

        if(isMultiple) {
            // 多选
            if(!eventData.isSelection) {
                // 当前要取消选中，如果本来就没选中则不用取消选中状态了
                if(!isChecked.call(this, checkbox)) {
                    return;
                }
                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if(this._selectList[i] === elem[0]) {
                        setChecked.call(this, checkbox, false);
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
            } else {
                // 当前要选中，如果已经是选中状态了就不再选中
                if(isChecked.call(this, checkbox)) {
                    return;
                }
                setChecked.call(this, checkbox, true);
                this._selectList.push(elem[0]);
            }
        } else {
            // 单选
            if (this._current) {
                if (this._current[0] == elem[0]) {
                    return;
                }
                this._current
                    .removeClass(selectedClass)
                    .removeClass("background-highlight");
            }
            this._current = elem;
            this._current
                .addClass(selectedClass)
                .addClass("background-highlight");
        }

        if(isFire === false) {
            return;
        }
        this.fire("changed", eventData);
    },
    _selectTreeByValues: function(list, values, level, path, outArguments) {
        var i, j, len,
            item, id;

        if(!Array.isArray(list) || list.length === 0) {
            return;
        }
        if(!Array.isArray(values) || values.length === 0) {
            return;
        }

        for(i = 0, len = list.length; i < len; i++) {
            item = list[i];
            id = path ? (path + "_" + i) : ("" + i);
            
            for(j = 0; j < values.length; j++) {
                if(this._equalValue(item, values[j])) {
                    outArguments.elem = this._selectNodeByValue(item, id);
                    values.splice(j, 1);
                    break;
                }
            }
            if(values.length === 0) {
                break;
            }
            this._selectTreeByValues(
                this._getChildren(item), values, level + 1, id, outArguments);
        }
    },
    _equalValue: function(item, value) {
        if (ui.core.isObject(item) && !ui.core.isObject(value)) {
            return this._getValue.call(item, this.option.valueField) === value;
        } else {
            return this._getValue.call(item, this.option.valueField) === this._getValue.call(value, this.option.valueField);
        }
    },
    _selectNodeByValue: function(nodeData, path) {
        var dt, tempId, needAppendElements, athArray,
            i, treeNodeDT, treeNodeDD;
        
        if(this.option.lazy) {
            needAppendElements = [];
            pathArray = path.split("_");

            tempId = "#" + this._treePrefix + path;
            dt = $(tempId);
            while(dt.length === 0) {
                needAppendElements.push(tempId);
                pathArray.splice(pathArray.length - 1, 1);
                if(pathArray.length === 0) {
                    break;
                }
                tempId = "#" + this._treePrefix + pathArray.join("_");
                dt = $(tempId);
            }
            if (dt.length === 0) {
                return;
            }
            for (i = needAppendElements.length - 1; i >= 0; i--) {
                treeNodeDT = dt;
                treeNodeDD = treeNodeDT.next();
                this._loadChildren(treeNodeDT, treeNodeDD, this._getNodeData(treeNodeDT));
                dt = $(needAppendElements[i]);
            }
        } else {
            dt = $("#" + this._treePrefix + path);
        }

        treeNodeDD = dt.parent().parent();
        while (treeNodeDD.nodeName() === "DD" 
                && treeNodeDD.hasClass("ui-selection-tree-dd")) {

            treeNodeDT = treeNodeDD.prev();
            if (treeNodeDD.css("display") === "none") {
                this._setChildrenExpandStatus(treeNodeDT, true);
            }
            treeNodeDD = treeNodeDT.parent().parent();
        }
        this._selectItem(dt, nodeData, true, false);
        return dt;
    },
    _selectChildNode: function (nodeData, dt, isSelection) {
        var children,
            parentId,
            dd,
            i, len;

        children = this._getChildren(nodeData);
        if (!Array.isArray(children) || children.length === 0) {
            return;
        }
        parentId = dt.prop("id");
        dd = dt.next();

        if (this.option.lazy && dd.children().length === 0) {
            this._loadChildren(dt, dd, nodeData);
        }
        for (i = 0, len = children.length; i < len; i++) {
            nodeData = children[i];
            dt = $("#" + parentId + "_" + i);
            this._selectItem(dt, nodeData, isSelection, false);
            this._selectChildNode(nodeData, dt, isSelection);
        }
    },
    _selectParentNode: function (nodeData, nodeId, isSelection) {
        var parentNodeData, parentId,
            elem, nextElem, dtList, 
            i, len, checkbox;

        parentNodeData = nodeData[parentNode];
        if (!parentNodeData) {
            return;
        }
        parentId = nodeId.substring(0, nodeId.lastIndexOf("_"));
        elem = $("#" + parentId);
        if (!isSelection) {
            nextElem = elem.next();
            if (nextElem.nodeName() === "DD") {
                dtList = nextElem.find("dt");
                for (i = 0, len = dtList.length; i < len; i++) {
                    checkbox = $(dtList[i]).find("." + checkboxClass);
                    if (isChecked.call(this, checkbox)) {
                        return;
                    }
                }
            }
        }
        this._selectItem(elem, parentNodeData, isSelection, false);
        this._selectParentNode(parentNodeData, parentId, isSelection);
    },

    /// API
    /** 获取选中项 */
    getSelection: function() {
        var result = null,
            i, len;
        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                result.push(this._getNodeData($(this._selectList[i])));
            }
        } else {
            if(this._current) {
                result = this._getNodeData(this._current);
            }
        }
        return result;
    },
    /** 获取选中项的值 */
    getSelectionValues: function() {
        var result = null,
            item,
            i, len;
        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                item = this._getNodeData($(this._selectList[i]));
                result.push(this._getValue.call(item, this.option.valueField));
            }
        } else {
            if(this._current) {
                item = this._getNodeData(this._current);
                result = this._getValue.call(item, this.option.valueField);
            }
        }
        return result;
    },
    /** 设置选中项 */
    setSelection: function(values) {
        var outArguments,
            viewData,
            eventData;

        this.cancelSelection();
        if(this.isMultiple()) {
            if(!Array.isArray(values)) {
                values = [values];
            }
        } else {
            if(Array.isArray(values)) {
                values = [values[0]];
            } else {
                values = [values];
            }
        }

        outArguments = {
            elem: null
        };
        viewData = this.getViewData();
        this._selectTreeByValues(viewData, values, 0, null, outArguments);
        if(outArguments.elem) {
            eventData = this._getSelectionData(outArguments.elem);
            eventData.element = outArguments.elem;
            eventData.originElement = null;
            this.fire("changed", eventData);
        }
    },
    /** 选择一个节点的所有子节点 */
    selectChildNode: function(nodeElement, isSelection) {
        var nodeData;
        if(arguments.length === 1) {
            isSelection = true;
        } else {
            isSelection = !!isSelection;
        }

        nodeData = this._getNodeData(nodeElement);
        if(!nodeData) {
            return;
        }
        if(!this.isMultiple() || this.option.nodeSelectable !== true) {
            return;
        }
        this._selectChildNode(nodeData, nodeElement, isSelection);
    },
    /** 选择一个节点的所有父节点 */
    selectParentNode: function(nodeElement, isSelection) {
        var nodeData,
            nodeId;
        if(arguments.length === 1) {
            isSelection = true;
        } else {
            isSelection = !!isSelection;
        }

        nodeData = this._getNodeData(nodeElement);
        if(!nodeData) {
            return;
        }
        if(!this.isMultiple() || this.option.nodeSelectable !== true) {
            return;
        }
        nodeId = nodeElement.prop("id");
        this._selectParentNode(nodeData, nodeId, isSelection);
    },
    /** 取消选中 */
    cancelSelection: function(isFire) {
        var elem,
            i, len;
        if(this.isMultiple()) {
            for(i = 0, len = this._selectList.length; i < len; i++) {
                elem = $(this._selectList[i]);
                setChecked.call(this, elem.find("." + checkboxClass), false);
            }
            this._selectList = [];
        } else {
            if(this._current) {
                this._current
                    .removeClass(selectedClass)
                    .removeClass("background-highlight");
                this._current = null;
            }
        }

        if(isFire !== false) {
            this.fire("cancel");
        }
    },
    /** 设置视图数据 */
    setViewData: function(data) {
        if(Array.isArray(data)) {
            this._fill(data);
        }
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
        this.treePanel.empty();
        this._current = null;
        this._selectList = [];
        delete this.originalViewData;
    }
});

$.fn.selectionTree = function (option) {
    if (this.length === 0) {
        return null;
    }
    return ui.ctrls.SelectionTree(option, this);
};
