// GridViewGroup

function defaultCreateGroupItem(groupKey) {
    return {
        groupText: groupKey
    };
}
function isGroupItem() {
    return ui.core.type(this.itemIndexes) === "array";
}
function renderGroupItemCell(data, column, index, td) {
    td.isFinale = true;
    td.attr("colspan", this.option.columns.length);
    td.click(this.group.onGroupRowClickHandler);
    this.group["_last_group_index_"] = data.groupIndex;
    return this.group.groupItemFormatter.apply(this, arguments);
}

function onGropRowClick(e) {
    var viewData,
        td,
        groupItem;

    e.stopPropagation();
    td = $(e.target);
    while(!td.isNodeName("td")) {
        if(td.isNodeName("tr")) {
            return;
        }
        td = td.parent();
    }

    viewData = this.gridview.getViewData();
    groupItem = viewData[td.parent()[0].rowIndex];
    if(td.hasClass("group-fold")) {
        td.removeClass("group-fold");
        this._operateChildren(groupItem.itemIndexes, function(item, row) {
            $(row).css("display", "table-row");
        });
    } else {
        td.addClass("group-fold");
        this._operateChildren(groupItem.itemIndexes, function(item, row) {
            $(row).css("display", "none");
        });
    }
}

function GridViewGroup() {
    if(this instanceof GridViewGroup) {
        this.initialize();
    } else {
        return new GridViewGroup();
    }
}
GridViewGroup.prototype = {
    constructor: GridViewGroup,
    initialize: function() {
        this.gridview = null;
        this.onGroupRowClickHandler = $.proxy(onGropRowClick, this);
    },
    _operateChildren: function (list, action) {
        var viewData,
            rowIndex,
            rows, item, result,
            i, len;

        viewData = this.gridview.getViewData();
        rows = this.gridview.tableBody[0].rows;
        for (i = 0, len = list.length; i < len; i++) {
            rowIndex = list[i];
            item = viewData[rowIndex];
            action.call(this, item, rows[rowIndex]);
        }
    },

    /// API
    /** 绑定GridView */
    setGridView: function(gridview) {
        if(gridview instanceof ui.ctrls.GridView) {
            this.gridview = gridview;
            this.gridview.group = this;
        }
    },
    /** 数据结构转换 */
    listGroup: function(list, groupField, createGroupItem) {
        var groupList = [];
        var dict = {};
        
        if(!Array.isArray(list) || list.length === 0) {
            return groupList;
        }
        createGroupItem = $.isFunction(createGroupItem) ? createGroupItem : defaultCreateGroupItem;
        var i = 0,
            len = list.length;
        var item,
            groupKey,
            groupItem;
        for(; i < len; i++) {
            item = list[i];
            groupKey = item[groupField];
            if(!dict.hasOwnProperty(groupKey)) {
                groupItem = createGroupItem.call(item, groupKey);
                groupItem.itemIndexes = [i];
                dict[groupKey] = groupItem;
            } else {
                dict[groupKey].itemIndexes.push(i);
            }
        }
        for(groupKey in dict) {
            groupItem = dict[groupKey];
            groupList.push(groupItem);
            groupItem.groupIndex = groupList.length - 1;
            for(i = 0, len = groupItem.itemIndexes.length; i < len; i++) {
                groupList.push(list[groupItem.itemIndexes[i]]);
                groupItem.itemIndexes[i] = groupList.length - 1;
            }
        }
        return groupList;
    },
    /** 分组行号格式化器，每个分组都会自动调用分组格式化器，并从1开始 */
    rowNumber: function(value, column, index, td) {
        var viewData,
            data;

        viewData = this.getViewData();
        data = viewData[index];

        if(isGroupItem.call(data)) {
            return renderGroupItemCell.call(this, data, column, index, td);
        } else {
            return "<span>" + (index - this.group["_last_group_index_"]) + "</span>";
        }
    },
    /** 分组文本格式化器，每次开始新分组都会自动调用分组格式化器 */
    formatText: function(value, column, index, td) {
        var viewData,
            data;
        
        viewData = this.getViewData();
        data = viewData[index];
        
        if(isGroupItem.call(data)) {
            return renderGroupItemCell.call(this, data, column, index, td);
        } else {
            return ui.ColumnStyle.cfn.defaultText.apply(this, arguments);
        }
    },
    /** 分组单元格格式化器，外部需要重写 */
    groupItemFormatter: function(val, col, idx, td) {
        return null;
    }
};

ui.ctrls.GridViewGroup = GridViewGroup;
