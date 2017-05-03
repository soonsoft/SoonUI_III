// GridViewTree

var childrenField = "_children",
    parentField = "_parent",
    flagField = "_fromList";

function getValue(field) {
    return this[field];
}
function isTreeNode (item) {
    return !!item[childrenField];
}
function onFoldButtonClick(e) {
    var btn,
        rowIndex,
        rowData;

    e.stopPropagation();

    btn = $(e.target),
    rowIndex = btn.parent().parent()[0].rowIndex,
    rowData = this.gridview.getRowData(rowIndex);

    if (btn.hasClass("unfold")) {
        rowData._isFolded = true;
        btn.removeClass("unfold")
            .removeClass("fa-angle-down")
            .addClass("fa-angle-right");
        this._hideChildren(rowData, rowIndex);
    } else {
        rowData._isFolded = false;
        btn.addClass("unfold")
            .removeClass("fa-angle-right")
            .addClass("fa-angle-down");
        this._showChildren(rowData, rowIndex);
    }
}

function GridViewTree() {
    if(this instanceof GridViewTree) {
        this.initialize();
    } else {
        return new GridViewTree();
    }
}
GridViewTree.prototype = {
    constructor: GridViewTree,
    initialize: function() {
        this.lazy = false;
        this.loadChildrenHandler = null;
        this.gridview = null;
        
        this.onFoldButtonClickHandler = $.proxy(onFoldButtonClick, this);
    },
    //修正父级元素的子元素索引
    _fixParentIndexes: function (rowData, rowIndex, count) {
        var parent = rowData[parentField];
        if (!parent)
            return;
        var children = parent[childrenField],
            len = children.length,
            i = 0;
        for (; i < len; i++) {
            if (children[i] > rowIndex) {
                children[i] = children[i] + count;
            }
        }
        rowIndex = children[0] - 1;
        if (rowIndex >= 0) {
            arguments.callee.call(this, parent, rowIndex, count);
        }
    },
    //修正所有的子元素索引
    _fixTreeIndexes: function (startIndex, endIndex, viewData, count) {
        var i = startIndex,
            len = endIndex;
        var item,
            children,
            j;
        for (; i < len; i++) {
            item = viewData[i];
            if (isTreeNode(item)) {
                children = item[childrenField];
                if (!children) {
                    continue;
                }
                for (j = 0; j < children.length; j++) {
                    children[j] = children[j] + count;
                }
            }
        }
    },
    _showChildren: function (rowData, rowIndex) {
        if (!rowData[childrenField]) {
            if (this.lazy && $.isFunction(this.loadChildrenHandler)) {
                this.loadChildrenHandler(rowData, rowIndex);
            }
        } else {
            this._operateChildren(rowData[childrenField], function (item, row) {
                $(row).css("display", "table-row");
                if (item._isFolded === true) {
                    return false;
                }
            });
        }
    },
    _hideChildren: function (rowData) {
        if (rowData[childrenField]) {
            this._operateChildren(rowData[childrenField], function (item, row) {
                $(row).css("display", "none");
            });
        }
    },
    _operateChildren: function (list, action) {
        var viewData,
            rowIndex,
            row, item,
            result,
            i, len;

        if (!list) {
            return;
        }
        
        viewData = this.gridview.getViewData();
        rows = this.gridview.tableBody[0].rows;
        for (i= 0, len = list.length; i < len; i++) {
            rowIndex = list[i];
            item = viewData[rowIndex];
            result = action.call(this, item, rows[rowIndex]);
            if (result === false) {
                continue;
            }
            if (item[childrenField]) {
                arguments.callee.call(this, item[childrenField], action);
            }
        }
    },
    _changeLevel: function(rowIndex, cellIndex, rowData, value) {
        var level = rowData._level + value;
        if(level < 0)
            level = 0;
        rowData._level = level;
        
        var	column = this.gridview.option.columns[cellIndex],
            cell = $(this.gridview.tableBody.get(0).rows[rowIndex].cells[cellIndex]);
        cell.empty();
        cell.append(
            column.handler.call(
                this.gridview, 
                this.gridview.prepareValue(rowData, column), 
                column, 
                rowIndex, 
                cell));
    },
    _sortListTree: function (tree, listTree, parent, level) {
        var i = 0,
            len = tree.length,
            item;
        for (; i < len; i++) {
            item = tree[i];
            delete item[flagField];
            item._level = level;
            item[parentField] = parent;
            listTree.push(item);
            tree[i] = listTree.length - 1;
            if (item[childrenField].length > 0) {
                arguments.callee.call(this, item[childrenField], listTree, item, level + 1);
            } else {
                delete item[childrenField];
            }
        }
    },

    /// API
    /** 绑定gridview */
    setGridView: function (gridview) {
        if(gridview instanceof ui.ctrls.GridView) {
            this.gridview = gridview;
            this.gridview.tree = this;
        }
    },
    /** 转换数据结构 */
    listTree: function (list, parentField, valueField) {
        var listTree = [];
        var getParentValue = getValue,
            getChildValue = getValue;
        if (!Array.isArray(list) || list.length == 0)
            return listTree;

        if ($.isFunction(parentField)) {
            getParentValue = parentField;
        }
        if ($.isFunction(valueField)) {
            getChildValue = valueField;
        }

        var tempList = {}, temp, root,
            item, i, id, pid;
        for (i = 0; i < list.length; i++) {
            item = list[i];
            pid = getParentValue.call(item, parentField) + "" || "__";
            if (tempList.hasOwnProperty(pid)) {
                temp = tempList[pid];
                temp[childrenField].push(item);
            } else {
                temp = {};
                temp[childrenField] = [];
                temp[childrenField].push(item);
                tempList[pid] = temp;
            }
            id = getChildValue.call(item, valueField) + "";
            if (tempList.hasOwnProperty(id)) {
                temp = tempList[id];
                item[childrenField] = temp[childrenField];
                tempList[id] = item;
                item[flagField] = true;
            } else {
                item[childrenField] = [];
                item[flagField] = true;
                tempList[id] = item;
            }
        }
        for (var key in tempList) {
            if(tempList.hasOwnProperty(key)) {
                temp = tempList[key];
                if (!temp.hasOwnProperty(flagField)) {
                    root = temp;
                    break;
                }
            }
        }
        
        this._sortListTree(root[childrenField], listTree, null, 0);
        return listTree;
    },
    /** 根据层级转换数据结构 */
    listTreeByLevel: function(list, parentField, valueField) {
        var listTree = [];
        var getParentValue = getValue,
            getChildValue = getValue;
        if (!Array.isArray(list) || list.length == 0)
            return listTree;
        
        var parents = [],
            rootChildren = [],
            i, 
            item,
            parentItem,
            level;
        for(i = 0; i < list.length; i++) {
            item = list[i];
            item[childrenField] = [];
            item[parentField] = null;
            
            if(i > 0) {
                if(item._level - list[i - 1]._level > 1) {
                    item._level = list[i - 1]._level + 1;
                }
            } else {
                item._level = 0; 
            }
            
            level = item._level;
            parents[level] = item;
            if(level == 0) {
                rootChildren.push(item);
                continue;
            }
            parentItem = parents[level - 1];
            parentItem[childrenField].push(item);
            item[parentField] = getParentValue.call(parentItem, valueField);
        }
        
        this._sortListTree(rootChildren, listTree, null, 0);
        return listTree;
    },
    /** 树格式化器 */
    treeNode: function (val, col, idx, td) {
        var viewData,
            item,
            span, 
            fold;
        
        if (!val) {
            return null;
        }

        viewData = this.getViewData();
        item = viewData[idx];
        if (!$.isNumeric(item._level)) {
            item._level = 0;
        }
        span = $("<span />").text(val);
        if (isTreeNode(item)) {
            item._isFolded = false;
            span = [null, span[0]];
            if (this.tree.lazy) {
                fold = $("<i class='fold font-highlight-hover fa fa-angle-right' />");
            } else {
                fold = $("<i class='fold unfold font-highlight-hover fa fa-angle-down' />");
            }
            fold.css("margin-left", (item._level * (12 + 5) + 5) + "px");
            fold.click(this.tree.onFoldButtonClickHandler);
            span[0] = fold[0];
        } else {
            span.css("margin-left", ((item._level + 1) * (12 + 5) + 5) + "px");
        }
        return span;
    },
    /** 层级格式化器 */
    levelNode: function(val, col, idx, td) {
        var viewData,
            item,
            span;

        if (!val) {
            return null;
        }

        viewData = this.getViewData();
        item = viewData[idx];
        if (!ui.type.isNumber(item._level)) {
            item._level = 0;
        }
        
        span = $("<span />").text(val);
        span.css("margin-left", ((item._level + 1) * (12 + 5) + 5) + "px");
        return span;
    },
    /** 异步添加子节点 */
    addChildren: function (rowData, rowIndex, children) {
        var viewData,
            item,
            currRowIndex = rowIndex + 1,
            row,
            i, len;

        rowData[childrenField] = [];
        viewData = this.gridview.getViewData();
        for (i = 0, len = children.length; i < len; i++) {
            item = children[i];
            item._level = rowData._level + 1;
            item[parentField] = rowData;
            rowData[childrenField].push(currRowIndex);

            row = $("<tr />");
            viewData.splice(currRowIndex, 0, item);
            this.gridview._createCells(row, item, currRowIndex);
            if (currRowIndex < viewData.length - 1) {
                $(this.gridview.tableBody[0].rows[currRowIndex]).before(row);
            } else {
                this.gridview.tableBody.append(row);
            }

            currRowIndex++;
        }
        this.gridview._updateScrollState();
        this.gridview.refreshRowNumber(currRowIndex - 1);

        this._fixParentIndexes(rowData, rowIndex, len);
        this._fixTreeIndexes(
            rowIndex + 1 + len, 
            viewData.length,
            viewData, 
            len);
    },
    /** 调整节点的缩进 */
    changeLevel: function(rowIndex, cellIndex, value, changeChildrenLevel) {
        var rowData,
            viewData, 
            level,
            i;
        
        viewData = this.gridview.getViewData();
        if(ui.core.type(rowIndex) !== "number" || rowIndex < 0 || rowIndex >= viewData.length) {
            return;
        }
        
        rowData = viewData[rowIndex];
        changeChildrenLevel = !!changeChildrenLevel;
        
        level = rowData._level;
        this._changeLevel(rowIndex, cellIndex, rowData, value); 
        if(changeChildrenLevel) {
            i = rowIndex + 1;
            while(i < viewData.length) {
                rowData = viewData[i];
                if(rowData._level <= level) {
                    return;
                }
                this._changeLevel(i, cellIndex, rowData, value);
                i++;
            }
        }
    }
};
ui.ctrls.GridViewTree = GridViewTree;
