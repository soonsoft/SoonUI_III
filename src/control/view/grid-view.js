// grid view

var cellCheckbox = "grid-checkbox",
    cellCheckboxAll = "grid-checkbox-all",
    bodyCell = "ui-table-body-cell",
    lastCell = "last-cell",
    sortColumn = "sort-column",
    sortClass = "fa-sort",
    asc = "fa-sort-asc",
    desc = "fa-sort-desc";

var tag = /^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/,
    attributes = /\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/;

var columnCheckboxAllFormatter = ui.ColumnStyle.cnfn.checkAll,
    checkboxFormatter = ui.ColumnStyle.cfn.check,
    columnTextFormatter = ui.ColumnStyle.cnfn.columnText,
    textFormatter = ui.ColumnStyle.cfn.text,
    rowNumberFormatter = ui.ColumnStyle.cfn.rowNumber;

var defaultPageSize = 100;

function encode(input) {
    return input ? ui.str.htmlEncode(input) : input;
}
function preparePager(option) {
    if(option.showPageInfo) {
        if(!option.pageInfoFormatter) {
            option.pageInfoFormatter = {
                currentRowNum: function(val) {
                    return "<span>本页" + val + "行</span>";
                },
                rowCount: function(val) {
                    return "<span class='font-highlight'>共" + val + "行</span>";
                },
                pageCount: function(val) {
                    return "<span>" + val + "页</span>";
                }
            };
        }
    }

    this.pager = ui.ctrls.Pager(option);
    this.pageIndex = this.pager.pageIndex;
    this.pageSize = this.pager.pageSize;
}

// 排序器
function Sorter(view) {
    this.view = view;
    this.currentSortColumn = null;
    this.sorter = new ui.Introsort();
    this.sortAfterFn = null;
    this._resetSortColumnStateHandler = (function() {
        this.resetSortColumnState();
    }).bind(this);
}
Sorter.prototype = {
    constructor: Sorter,
    prepareHead: function() {
        this.sortCells = [];
        this._isAddedResetSortColumnState = false;
        this.view.columnResetter.remove(this._resetSortColumnStateHandler);
    },
    setSortColumn: function(cell, column, index) {
        if (column.sort === true || ui.core.isFunction(column.sort)) {
            cell.addClass(sortColumn);
            cell.append("<i class='fa fa-sort' />");
            this.sortCells.push(cell);
            if(!this._isAddedResetSortColumnState) {
                this.view.columnResetter.add(this._resetSortColumnStateHandler);
                this._isAddedResetSortColumnState = true;
            }
        }
    },
    resetSortColumnState: function() {
        var icon, i, len;
        if(!this.sortCells) {
            return;
        }
        for (i = 0, len = this.sortCells.length; i < len; i++) {
            icon = this.sortCells[i].find("i");
            if (!icon.hasClass(sortClass)) {
                icon.attr("class", "fa fa-sort");
                return;
            }
        }
    },
    sort: function(viewData, elem, column) {
        var view,
            isSelf,
            comparer, fn,
            tempTbody, rows, rowsMapper, icon;

        view = this.view;
        if (viewData.length === 0) {
            return;
        }

        if (this.currentSortColumn !== column) {
            this.resetSortColumnState();
        }

        isSelf = this.currentSortColumn === column;
        this.currentSortColumn = column;

        tempTbody = view.bodyTable.children("tbody");
        rows = tempTbody.children().get();
        if(ui.core.isFunction(this.sortAfterFn)) {
            // 保留排序前的副本，以后根据索引和rowIndex调整其它表格的顺序
            rowsMapper = rows.slice(0);
        }
        if (!Array.isArray(rows) || rows.length !== viewData.length) {
            throw new Error("data row error");
        }

        icon = elem.find("i");
        if (icon.hasClass(asc)) {
            this.reverse(viewData, rows);
            icon.removeClass(sortClass).removeClass(asc).addClass(desc);
        } else {
            if (isSelf) {
                this.reverse(viewData, rows);
            } else {
                fn = column.sort;
                if(!ui.core.isFunction(fn)) {
                    fn = (function(v1, v2) {
                        return this.defaultComparer(v1, v2);
                    }).bind(this);
                }
                comparer = function(v1, v2) {
                    v1 = view._prepareValue(v1, column);
                    v2 = view._prepareValue(v2, column);
                    return fn(v1, v2);
                };

                this.sorter.items = rows;
                this.sorter.sort(viewData, comparer);
            }
            icon.removeClass(sortClass).removeClass(desc).addClass(asc);
        }
        tempTbody.append(rows);

        if(rowsMapper) {
            // 执行排序后的其他操作
            this.sortAfterFn(rowsMapper);
        }

        view._refreshRowNumber();
    },
    defaultComparer: function(v1, v2) {
        var val, i, len;
        if (Array.isArray(v1)) {
            val = 0;
            for (i = 0, len = v1.length; i < len; i++) {
                val = this.sorting(v1[i], v2[i]);
                if (val !== 0) {
                    return val;
                }
            }
            return val;
        } else {
            return this.sorting(v1, v2);
        }
    },
    sorting: function(v1, v2) {
        if (typeof v1 === "string") {
            return v1.localeCompare(v2);
        }
        if (v1 < v2) {
            return -1;
        } else if (v1 > v2) {
            return 1;
        } else {
            return 0;
        }
    },
    reverse: function(arr1, arr2) {
        var temp, i, j, len;
        for (i = 0, j = arr1.length - 1, len = arr1.length / 2; i < len; i++, j--) {
            temp = arr1[i];
            arr1[i] = arr1[j];
            arr1[j] = temp;

            temp = arr2[i];
            arr2[i] = arr2[j];
            arr2[j] = temp;
        }
    },
    reset: function() {
        this.currentSortColumn = null;
        this.sorter.keys = null;
        this.sorter.items = null;
    }
};

// 列还原器
function ColumnResetter(view) {
    this.handlers = [];
    this.view = view;
}
ColumnResetter.prototype = {
    constructor: ColumnResetter,
    add: function(fn) {
        if(ui.core.isFunction(fn)) {
            this.handlers.push(fn);
        }
    },
    remove: function(fn) {
        var i;
        for(i = this.handlers.length - 1; i >= 0; i--) {
            if(this.handlers[i] === fn) {
                this.handlers.splice(i, 1);
                break;
            }
        }
    },
    reset: function() {
        var view = this.view;
        this.handlers.forEach(function(fn) {
            try {
                fn.call(view);
            } catch(e) { }
        });
    }
};
function setChecked(cbx, checked) {
    if(checked) {
        cbx.removeClass("fa-square")
            .addClass("fa-check-square").addClass("font-highlight");
    } else {
        cbx.removeClass("fa-check-square").removeClass("font-highlight")
            .addClass("fa-square");
    }
}
function changeChecked(cbx) {
    var checked = !cbx.hasClass("fa-check-square"),
        columnInfo,
        headRows;
    setChecked(cbx, checked);
    if(!this._gridCheckboxAll) {
        columnInfo = this._getColumnIndexByFormatter(columnCheckboxAllFormatter, "text");
        if(columnInfo.columnIndex === -1) {
            return;
        }
        headRows = columnInfo.headTable[0].tHead.rows;
        this._gridCheckboxAll = 
            $(headRows[headRows.length - 1].cells[columnInfo.columnIndex])
                .find("." + cellCheckboxAll);
    }
    if(checked) {
        this._checkedCount++;
    } else {
        this._checkedCount--;
    }
    if(this._checkedCount === this.count()) {
        setChecked(this._gridCheckboxAll, true);
    } else {
        setChecked(this._gridCheckboxAll, false);
    }
}

// 排序点击事件处理
function onSort(e, element) {
    var viewData,
        columnIndex, column;

    viewData = this.getViewData();
    if (viewData.length === 0) {
        return;
    }

    columnIndex = element[0].cellIndex;
    column = this._getColumn(columnIndex);

    this.sorter.sort(viewData, element, column);
}
// 表格内容点击事件处理
function onBodyClick(e, element) {
    var elem, selectedClass,
        exclude, result;

    if(!this.isSelectable()) {
        return;
    }
    
    elem = $(e.target);
    exclude = this.option.selection.exclude;
    if(exclude) {
        result = true;
        if(ui.core.isString(exclude)) {
            result = this._excludeElement(elem, exclude);
        } else if(ui.core.isFunction(exclude)) {
            result = exclude.call(this, elem);
        }
        if(result === false) return;
    }

    if(elem.hasClass(cellCheckbox)) {
        // 如果checkbox和选中行不联动
        if(!this.option.selection.isRelateCheckbox) {
            changeChecked.call(this, elem);
            return;
        }
    }

    if(this.option.selection.type === "row") {
        element = element.parent();
    }
    selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
    element.context = e.target;

    this._selectItem(element, selectedClass);
}
// 全选按钮点击事件处理
function onCheckboxAllClick(e) {
    var cbxAll, cbx, cell,
        checkedValue, cellIndex,
        rows, selectedClass, fn, 
        i, len,
        container;

    e.stopPropagation();
    if(this.count() === 0) {
        return;
    }

    cbxAll = $(e.target);
    cellIndex = cbxAll.parent().prop("cellIndex");
    if(cellIndex === -1) {
        return;
    }

    checkedValue = !cbxAll.hasClass("fa-check-square");
    setChecked.call(this, cbxAll, checkedValue);

    if(this.option.selection.isRelateCheckbox === true && this.isMultiple()) {
        selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
        if(checkedValue) {
            // 如果是要选中，需要同步行状态
            fn = function(td, checkbox) {
                var elem;
                if(this.option.selection.type === "cell") {
                    elem = td;
                } else {
                    elem = td.parent();
                }
                elem.context = checkbox[0];
                this._selectItem(elem, selectedClass, checkedValue);
            };
        } else {
            // 如果是取消选中，直接清空选中行状态
            for(i = 0, len = this._selectList.length; i < len; i++) {
                $(this._selectList[i])
                    .removeClass(selectedClass)
                    .removeClass("background-highlight");
            }
            this._selectList = [];
        }
    }

    container = cbxAll.parent();
    while(true) {
        if(container.hasClass("ui-grid-view")) {
            return;
        }
        if(container.hasClass("ui-grid-head")) {
            container = container.next();
            container = container.find("table");
            if(container.length === 0) {
                rows = [];
            } else {
                rows = container[0].tBodies[0].rows;
            }
            break;
        }
        container = container.parent();
    }
    for(i = 0, len = rows.length; i < len; i++) {
        cell = $(rows[i].cells[cellIndex]);
        cbx = cell.find("." + cellCheckbox);
        if(cbx.length > 0) {
            if(ui.core.isFunction(fn)) {
                fn.call(this, cell, cbx);
            } else {
                setChecked.call(this, cbx, checkedValue);
            }
        }
    }
    if(checkedValue) {
        this._checkedCount = this.count();
    } else {
        this._checkedCount = 0;
    }
}
// 横向滚动条跟随事件处理
function onScrolling(e) {
    var headDiv = this.head[0],
        bodyDiv = this.body[0];
    headDiv.scrollLeft = bodyDiv.scrollLeft;
}

// 提示信息
function Prompt(view, text) {
    this.view = view;
    this.enabled = true;
    if(!text) {
        this.enabled = false;
    }
    this.element = $("<div class='data-prompt' />");
    this.setText(text);
    this.view.body.append(this.element);
}
Prompt.prototype = {
    constructor: Prompt,
    isShow: function() {
        return this.enabled && this.element.css("display") === "block";
    },
    show: function() {
        if(this.enabled) {
            this.element.css("display", "block");
        }
    },
    hide: function() {
        if(this.enabled) {
            this.element.css("display", "none");
        }
    },
    setText: function(text) {
        if(!this.enabled) {
            return;
        }
        if (ui.core.isString(text) && text.length > 0) {
            this.element.html("<span class='font-highlight'>" + encode(text) + "</span>");
        } else if (ui.core.isFunction(text)) {
            text = text();
            this.element.append(text);
        }
    }
};

ui.ctrls.define("ui.ctrls.GridView", {
    _defineOption: function() {
        return {
            /*
                column property
                text:       string|function     列名，默认为null
                column:     string|Array        绑定字段名，默认为null
                len:        number              列宽度，默认为auto
                align:      center|left|right   列对齐方式，默认为left(但是表头居中)
                formatter:  function            格式化器，默认为null
                sort:       boolean|function    是否支持排序，true支持，false不支持，默认为false
            */
            columns: [],
            // 视图数据
            viewData: null,
            // 没有数据时显示的提示信息
            prompt: "没有数据",
            // 高度
            height: false,
            // 宽度
            width: false,
            // 默认格式化器
            textFormatter: null,
            // 鼠标悬停反馈
            mouseHoverReaction: true,
            // 分页参数
            pager: {
                // 当前页码，默认从第1页开始
                pageIndex: 1,
                // 记录数，默认100条
                pageSize: defaultPageSize,
                // 显示按钮数量，默认显示10个按钮
                pageButtonCount: 10,
                // 是否显示分页统计信息，true|false，默认不显示
                showPageInfo: false,
                // 格式化器，包含currentRowNum, rowCount, pageCount的显示
                pageInfoFormatter: null
            },
            // 选择设置
            selection: {
                // cell|row|disabled
                type: "row",
                // string 排除的标签类型，标记后点击这些标签将不会触发选择事件
                exclude: false,
                // 是否可以多选
                multiple: false,
                // 多选时是否和checkbox关联
                isRelateCheckbox: true
            }
        };
    },
    _defineEvents: function() {
        var events = ["selecting", "selected", "deselected", "rebind", "cancel"];
        if(this.option.pager) {
            events.push("pagechanging");
        }
        return events;
    },
    _create: function() {
        this._selectList = [];

        // 存放列头状态重置器
        this.columnResetter = new ColumnResetter(this);
        // 排序器
        this.sorter = new Sorter(this);
        
        this.head = null;
        this.body = null;
        this.foot = null;
        
        this.rowHeight = 30;
        this.headHeight = this.rowHeight;
        this.bodyHeight = 0;
        this.footHeight = 30;
        // checkbox勾选计数器
        this._checkedCount = 0;
        
        if(this.option.pager) {
            preparePager.call(this, this.option.pager);
        } else {
            this.pageIndex = 1;
            this.pageSize = defaultPageSize;
        }

        // 修正selection设置项
        if(!this.option.selection) {
            this.option.selection = {
                type: "disabled"
            };
        } else {
            if(ui.core.isString(this.option.selection.type)) {
                this.option.selection.type = this.option.selection.type.toLowerCase();
            } else {
                this.option.selection.type = "disabled";
            }
            if(!this.option.selection.multiple) {
                this.option.selection.isRelateCheckbox = false;
            }
        }

        if(!ui.core.isNumber(this.option.width) || this.option.width <= 0) {
            this.option.width = false;
        }
        if(!ui.core.isNumber(this.option.height) || this.option.height <= 0) {
            this.option.height = false;
        }

        // event handlers
        this.clickHandlers = this.createClassEventDelegate("click");
        // 排序列点击事件
        this.clickHandlers.add(sortColumn, onSort.bind(this));
        // 全选按钮点击事件
        this.clickHandlers.add(cellCheckboxAll, onCheckboxAllClick.bind(this));
        // 行或者单元格点击事件
        this.clickHandlers.add(bodyCell, onBodyClick.bind(this));
        
        // 滚动条同步事件
        this.onScrollingHandler = onScrolling.bind(this);
    },
    _render: function() {
        if(!this.element) {
            throw new Error("the element is null.");
        }
        if(!this.element.hasClass("ui-grid-view")) {
            this.element.addClass("ui-grid-view");
        }
        this.element.click(
            this.clickHandlers
                .getDelegateHandler(function(elem) {
                    return elem.hasClass("ui-grid-view");
                })
                .bind(this));
        this._initBorderWidth();

        // 表头
        this.head = $("<div class='ui-grid-head' />");
        this.element.append(this.head);
        // 表体
        this.body = $("<div class='ui-grid-body' />");
        this.body.scroll(this.onScrollingHandler);
        this.element.append(this.body);
        // 信息提示
        this.prompt = new Prompt(this, this.option.prompt);
        // 分页栏
        this._initPagerPanel();

        // 创建表头
        this.createHead(this.option.columns);
        // 创建表体
        if (Array.isArray(this.option.viewData)) {
            this.createBody(
                this.option.viewData, this.option.viewData.length);
        } else {
            this.option.viewData = [];
        }
        // 设置容器大小
        this.setSize(this.option.width, this.option.height);
    },
    _initBorderWidth: function() {
        var getBorderWidth = function(key) {
            return parseInt(this.element.css(key), 10) || 0;
        };
        this.borderWidth = 0;
        this.borderHeight = 0;

        this.borderWidth += getBorderWidth.call(this, "border-left-width");
        this.borderWidth += getBorderWidth.call(this, "border-right-width");

        this.borderHeight += getBorderWidth.call(this, "border-top-width");
        this.borderHeight += getBorderWidth.call(this, "border-bottom-width");
    },
    _initPagerPanel: function() {
        if(this.pager) {
            this.foot = $("<div class='ui-grid-foot clear' />");
            this.element.append(this.foot);
            
            this.pager.pageNumPanel = $("<div class='page-panel' />");
            if (this.option.pager.showPageInfo) {
                this.pager.pageInfoPanel = $("<div class='data-info' />");
                this.foot.append(this.pager.pageInfoPanel);
            } else {
                this.pager.pageNumPanel.css("width", "100%");
            }

            this.foot.append(this.pager.pageNumPanel);
            this.pager.pageChanged(function(pageIndex, pageSize) {
                this.pageIndex = pageIndex;
                this.pageSize = pageSize;
                this.fire("pagechanging", pageIndex, pageSize);
            }, this);
        }
    },
    // 创建一行的所有单元格
    _createRowCells: function(tr, rowData, rowIndex, columns, filter) {
        var i, len, 
            column, cval, td, el,
            formatter,
            hasFilter,
            isRowHover;
            
        isRowHover = this.option.selection.type !== "cell";
        if(!this._noBodyHover && isRowHover) {
            tr.addClass("table-body-row-hover");
        }

        if(ui.core.isFunction(columns)) {
            columns = null;
            filter = columns;
        }
        if(!Array.isArray(columns)) {
            columns = this.option.columns;
        }
        hasFilter = ui.core.isFunction(filter);
        for (i = 0, len = columns.length; i < len; i++) {
            column = columns[i];
            formatter = column.formatter;
            // 自定义格式化器
            if (!ui.core.isFunction(column.formatter)) {
                formatter = this.option.textFormatter;
            }
            // option默认格式化器
            if(!ui.core.isFunction(formatter)) {
                formatter = textFormatter;
            }
            cval = this._prepareValue(rowData, column);
            td = this._createCell("td", column);
            td.addClass("ui-table-body-cell");
            if(!this._noBodyHover && !isRowHover) {
                td.addClass("table-body-cell-hover");
            }
            el = formatter.call(this, cval, column, rowIndex, td);
            if (td.isAnnulment) {
                continue;
            }
            if(hasFilter) {
                el = filter.call(this, el, column, rowData);
            }
            if (el) {
                td.append(el);
            }
            if (i === len - 1) {
                td.addClass(lastCell);
            }
            tr.append(td);
            // group-table使用，合并一行单元格时使用
            if(td.isFinale) {
                td.addClass(lastCell);
                break;
            }
        }
    },
    _createCol: function(column) {
        var col = $("<col />");
        if (ui.core.isNumber(column.len)) {
            col.css("width", column.len + "px");
        }
        return col;
    },
    _createCell: function(tagName, column) {
        var cell = $("<" + tagName + " />"),
            css = {};
        if (column.align) {
            css["text-align"] = column.align;
        }
        cell.css(css);

        return cell;
    },
    // 获得并组装值
    _prepareValue: function(rowData, columnObj) {
        var value,
            i, len;
        if (Array.isArray(columnObj.column)) {
            value = {};
            for (i = 0, len = columnObj.column.length; i < len; i++) {
                value[i] = value[columnObj.column[i]] = 
                    this._getValue(rowData, columnObj.column[i], columnObj);
            }
        } else {
            value = this._getValue(rowData, columnObj.column, columnObj);
        }
        return value;
    },
    // 获取值
    _getValue: function(rowData, column, columnObj) {
        var arr, i = 0, value;
        if (!ui.core.isString(column)) {
            return null;
        }
        if (!columnObj._columnKeys.hasOwnProperty(column)) {
            columnObj._columnKeys[column] = column.split(".");
        }
        arr = columnObj._columnKeys[column];
        value = rowData[arr[i]];
        for (i = 1; i < arr.length; i++) {
            value = value[arr[i]];
            if (value === undefined || value === null) {
                return value;
            }
        }
        return value;
    },
    // 获取column对象
    _getColumn: function(index) {
        return this.option.columns[index];
    },
    _renderPageList: function(rowCount) {
        if (!this.pager) {
            return;
        }
        this.pager.data = this.getViewData();
        this.pager.pageIndex = this.pageIndex;
        this.pager.pageSize = this.pageSize;
        this.pager.renderPageList(rowCount);
    },
    _updateScrollState: function() {
        var scrollHeight = this.body[0].scrollHeight;
        var height = this.body.height();
        if (!this.headTable) return;
        if(scrollHeight - height > 1) {
            this._headScrollCol.css("width", ui.scrollbarWidth + 0.1 + "px");
        } else {
            this._headScrollCol.css("width", "0");
        }
    },
    _refreshRowNumber: function(startRowIndex, endRowIndex) {
        var viewData,
            columnInfo, rowNumber,
            rows, cell,
            column, i, len;

        viewData = this.getViewData();
        if(viewData.length === 0) {
            return;
        }

        rowNumber = rowNumberFormatter;
        columnInfo = this._getColumnIndexByFormatter(rowNumber);
        
        if (columnInfo.columnIndex == -1) return;
        if (!ui.core.isNumber(startRowIndex)) {
            startRowIndex = 0;
        }
        rows = columnInfo.bodyTable[0].rows;
        column = columnInfo.columns[columnInfo.columnIndex];
        len = ui.core.isNumber(endRowIndex) ? endRowIndex + 1 : rows.length;
        for (i = startRowIndex; i < len; i++) {
            cell = $(rows[i].cells[columnInfo.columnIndex]);
            cell.html("");
            cell.append(rowNumber.call(this, null, column, i));
        }
    },
    _getColumnIndexByFormatter: function(formatter, field) {
        var result, i, len;

        result = {
            columnIndex: -1,
            columns: this.option.columns,
            headTable: this.headTable,
            bodyTable: this.bodyTable
        };
        if(!field) {
            field = "formatter";
        }
        for(i = 0, len = result.columns.length; i < len; i++) {
            if(result.columns[i][field] === formatter) {
                result.columnIndex = i;
                return result;
            }
        }
        return result;
    },
    _getSelectionData: function(elem) {
        var data = {},
            viewData = this.getViewData();
        if(this.option.selection.type === "cell") {
            data.rowIndex = elem.parent().prop("rowIndex");
            data.cellIndex = elem.prop("cellIndex");
            data.rowData = viewData[data.rowIndex];
            data.column = this._getColumn(data.cellIndex).column;
        } else {
            data.rowIndex = elem.prop("rowIndex");
            data.rowData = viewData[data.rowIndex];
        }
        return data;
    },
    _excludeElement: function(elem, exclude) {
        var tagName = elem.nodeName().toLowerCase(),
            exArr = exclude.split(","),
            ex, match,
            i, len;
        for(i = 0, len = exArr.length; i < len; i++) {
            ex = ui.str.trim(exArr[i]);
            match = ex.match(attributes);
            if(match) {
                ex = ex.match(tag)[1];
                if(ex === tagName) {
                    return elem.attr(match[1]) !== match[4];
                }
            } else {
                if(ex.toLowerCase() === tagName) {
                    return false;
                }
            }
        }
    },
    _addSelectedState: function(elem, selectedClass, eventData) {
        elem.addClass(selectedClass).addClass("background-highlight");
        if(eventData) {
            this.fire("selected", eventData);
        }
    },
    _removeSelectedState: function(elem, selectedClass, eventData) {
        elem.removeClass(selectedClass).removeClass("background-highlight");
        if(eventData) {
            this.fire("deselected", eventData);
        }
    },
    _selectItem: function(elem, selectedClass, selectValue) {
        var eventData, result,
            columnInfo, checkbox,
            i, len, isFire;

        eventData = this._getSelectionData(elem);
        eventData.element = elem;
        eventData.originElement = elem.context ? $(elem.context) : null;

        result = this.fire("selecting", eventData);
        if(result === false) {
            return;
        }

        if(this.isMultiple()) {
            // 多选
            if(elem.hasClass(selectedClass)) {
                // 现在要取消
                // 如果selectValue定义了选中，则不要执行取消逻辑
                if(selectValue === true) {
                    return;
                }
                selectValue = false;

                for(i = 0, len = this._selectList.length; i < len; i++) {
                    if(this._selectList[i] === elem[0]) {
                        this._selectList.splice(i, 1);
                        break;
                    }
                }
                this._removeSelectedState(elem, selectedClass, eventData);
            } else {
                // 现在要选中
                // 如果selectValue定义了取消，则不要执行选中逻辑
                if(selectValue === false) {
                    return;
                }
                selectValue = true;

                this._selectList.push(elem[0]);
                this._addSelectedState(elem, selectedClass, eventData);
            }

            // 同步checkbox状态
            if(this.option.selection.isRelateCheckbox) {
                // 用过用户点击的是checkbox则保存变量，不用重新去获取了
                if(eventData.originElement && eventData.originElement.hasClass(cellCheckbox)) {
                    checkbox = eventData.originElement;
                }
                // 如果用户点击的不是checkbox则找出对应的checkbox
                if(!checkbox) {
                    columnInfo = this._getColumnIndexByFormatter(checkboxFormatter);
                    if(columnInfo.columnIndex > -1) {
                        checkbox = this.option.selection.type === "cell" ? 
                            $(elem.parent()[0].cells[columnInfo.columnIndex]) : 
                            $(elem[0].cells[columnInfo.columnIndex]);
                        checkbox = checkbox.find("." + cellCheckbox);
                    }
                }
                if(checkbox && checkbox.length > 0) {
                    setChecked.call(this, checkbox, selectValue);
                }
            }
        } else {
            // 单选
            if(this._current) {
                isFire = this._current[0] === elem[0];
                this._removeSelectedState(this._current, selectedClass, (isFire ? eventData : null));
                if(isFire) {
                    this._current = null;
                    return;
                }
            }
            this._current = elem;
            this._addSelectedState(elem, selectedClass, eventData);
        }
    },

    /// API
    /** 创建表头 */
    createHead: function(columns) {
        var colGroup, thead,
            tr, th,
            columnObj, i;

        if(Array.isArray(columns)) {
            this.option.columns = columns;
        }

        this.sorter.prepareHead();
        if (!this.headTable) {
            this.headTable = $("<table class='ui-table-head' cellspacing='0' cellpadding='0' />");
            this.head.append(this.headTable);
        } else {
            this.headTable.html("");
        }

        colGroup = $("<colgroup />");
        thead = $("<thead />");
        tr = $("<tr />");
        for (i = 0; i < columns.length; i++) {
            columnObj = columns[i];
            if (!columnObj._columnKeys) {
                columnObj._columnKeys = {};
            }
            colGroup.append(this._createCol(columnObj));
            th = this._createCell("th", columnObj);
            th.addClass("ui-table-head-cell");
            if (ui.core.isFunction(columnObj.text)) {
                th.append(columnObj.text.call(this, columnObj, th));
            } else {
                if(columnObj.text) {
                    th.append(columnTextFormatter.call(this, columnObj, th));
                }
            }
            this.sorter.setSortColumn(th, columnObj, i);
            if (i == columns.length - 1) {
                th.addClass(lastCell);
            }
            tr.append(th);
        }

        this._headScrollCol = $("<col style='width:0' />");
        colGroup.append(this._headScrollCol);
        tr.append($("<th class='ui-table-head-cell scroll-cell' />"));
        thead.append(tr);

        this.headTable.append(colGroup);
        this.headTable.append(thead);
    },
    /** 创建内容 */
    createBody: function(viewData, rowCount) {
        var colGroup, tbody,
            tr, i, j, len,
            columns, 
            column,
            isRebind = false;
        
        if (!this.bodyTable) {
            this.bodyTable = $("<table class='ui-table-body' cellspacing='0' cellpadding='0' />");
            this.body.append(this.bodyTable);
        } else {
            this.body.scrollTop(0);
            this.clear(false);
            isRebind = true;
        }

        columns = this.option.columns;
        if(!Array.isArray(viewData)) {
            viewData = [];
        }
        this.option.viewData = viewData;

        if(viewData.length === 0) {
            this.prompt.show();
        } else {
            this.prompt.hide();

            colGroup = $("<colgroup />"),
            tbody = $("<tbody />");
            this.bodyTable.append(colGroup);

            for (j = 0, len = columns.length; j < len; j++) {
                column = columns[j];
                colGroup.append(this._createCol(column));
            }
            for (i = 0, len = viewData.length; i < len; i++) {
                tr = $("<tr />");
                this._createRowCells(tr, viewData[i], i, columns);
                tbody.append(tr);
            }
            this.bodyTable.append(tbody);

            this._updateScrollState();
        }
        
        //update page numbers
        if (ui.core.isNumber(rowCount)) {
            this._renderPageList(rowCount);
        }

        if (isRebind) {
            this.fire("rebind");
        }
    },
    /** 获取checkbox勾选项的值 */
    getCheckedValues: function() {
        var columnInfo, rows, elem,
            checkboxClass = "." + cellCheckbox,
            result = [],
            i, len;

        columnInfo = this._getColumnIndexByFormatter(checkboxFormatter);
        if(columnInfo.columnIndex === -1) {
            return result;
        }
        rows = columnInfo.bodyTable[0].tBodies[0].rows;
        for(i = 0, len = rows.length; i < len; i++) {
            elem = $(rows[i].cells[columnInfo.columnIndex]).find(checkboxClass);
            if(elem.length > 0) {
                result.push(encode(elem.attr("data-value")));
            }
        }
        return result;
    },
    /** 获取选中的数据，单选返回单个对象，多选返回数组 */
    getSelection: function() {
        var result,
            i, len;
        if(!this.isSelectable()) {
            return null;
        }
        if(this.isMultiple()) {
            result = [];
            for(i = 0, len = this._selectList.length; i < len; i++) {
                result.push(this._getSelectionData($(this._selectList[i])));
            }
        } else {
            result = null;
            if(this._current) {
                result = this._getSelectionData(this._current);
            }
        }
        return result;
    },
    /** 取消选中项 */
    cancelSelection: function() {
        var selectedClass, elem, 
            columnInfo, checkboxClass, fn,
            i, len;

        if (!this.isSelectable()) {
            return;
        }

        selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
        if(this.option.selection.isRelateCheckbox) {
            checkboxClass = "." + cellCheckbox;
            columnInfo = this._getColumnIndexByFormatter(checkboxFormatter);
            fn = function(elem) {
                var checkbox,
                    cell;
                if(columnInfo.columnIndex !== -1) {
                    cell = this.option.selection.type === "cell" ? 
                        $(elem.parent()[0].cells[columnInfo.columnIndex]) : 
                        $(elem[0].cells[columnInfo.columnIndex]);
                    checkbox = cell.find(checkboxClass);
                    setChecked(checkbox, false);
                }
                this._removeSelectedState(elem, selectedClass);
            };
        } else {
            fn = function(elem) {
                this._removeSelectedState(elem, selectedClass);
            };
        }

        if(this.isMultiple()) {
            if(this._selectList.length === 0) {
                return;
            }
            for(i = 0, len = this._selectList.length; i < len; i++) {
                elem = $(this._selectList[i]);
                fn.call(this, elem);
            }
            this._selectList = [];
        } else {
            if(!this._current) {
                return;
            }
            fn.call(this, this._current);
            this._current = null;    
        }
        this.fire("cancel");
    },
    /** 移除行 */
    removeRowAt: function() {
        var rowIndex,
            indexes,
            viewData,
            row,
            i, len,
            isMultiple,
            type,
            removeSelectItemFn;

        viewData = this.getViewData();
        if(viewData.length === 0) {
            return;
        }
        len = arguments.length;
        if(len === 0) {
            return;
        }
        indexes = [];
        for(i = 0; i < len; i++) {
            rowIndex = arguments[i];
            if(ui.core.isNumber(rowIndex) && rowIndex >= 0 && rowIndex < viewData.length) {
                indexes.push(rowIndex);
            }
        }
        len = indexes.length;
        if(len > 0) {
            // 降序
            indexes.sort(function(a, b) {
                return b - a;
            });
            type = this.option.selection.type;
            isMultiple = this.isMultiple();
            if(type === "row") {
                removeSelectItemFn = function(idx) {
                    var i, len, selectItem;
                    if(isMultiple) {
                        for(i = 0, len = this._selectList.length; i < len; i++) {
                            selectItem = this._selectList[i];
                            if(idx === selectItem.rowIndex) {
                                this._selectList.splice(i, 1);
                                return;
                            }
                        }
                    } else {
                        if(this._current && this._current[0].rowIndex === idx) {
                            this._current = null;
                        }
                    }
                };
            } else if(type === "cell") {
                removeSelectItemFn = function(idx) {
                    var i, len, row;
                    if(isMultiple) {
                        for(i = 0, len = this._selectList.length; i < len; i++) {
                            row = this._selectList[i];
                            row = row.parentNode;
                            if(idx === row.rowIndex) {
                                this._selectList.splice(i, 1);
                                return;
                            }
                        }
                    } else {
                        if(this._current) {
                            row = this._current.parent();
                            if(row[0].rowIndex === idx) {
                                this._current = null;
                            }
                        }
                    }
                };
            }
            for(i = 0; i < len; i++) {
                rowIndex = indexes[i];
                row = $(this.bodyTable[0].rows[rowIndex]);
                row.remove();
                viewData.splice(rowIndex, 1);
                if(removeSelectItemFn) {
                    removeSelectItemFn.call(this, rowIndex);
                }
            }
            this._updateScrollState();
            this._refreshRowNumber(rowIndex);
        }
    },
    /** 更新行 */
    updateRow: function(rowIndex, rowData) {
        var viewData,
            row,
            _columns = arguments[2],
            _cellFilter = arguments[3];

        viewData = this.getViewData();
        if(viewData.length === 0) {
            return;
        }
        if(rowIndex < 0 || rowIndex > viewData.length) {
            return;
        }

        row = $(this.bodyTable[0].rows[rowIndex]);
        if(row.length === 0) {
            return;
        }
        row.empty();
        viewData[rowIndex] = rowData;
        this._createRowCells(row, rowData, rowIndex, _columns, _cellFilter);
    },
    /** 增加行 */
    addRow: function(rowData) {
        var viewData,
            row,
            len,
            _columns = arguments[1],
            _cellFilter = arguments[2];

        if(!rowData) return;

        viewData = this.getViewData();
        len = viewData.length;
        if(len === 0) {
            if(this.bodyTable) {
                this.bodyTable.remove();
                this.bodyTable = null;
            }
            this.createBody([rowData]);
            return;
        }

        row = $("<tr />");
        this._createRowCells(row, rowData, len, _columns, _cellFilter);
        $(this.bodyTable[0].tBodies[0]).append(row);
        viewData.push(rowData);
        this._updateScrollState();
    },
    /** 插入行 */
    insertRow: function(rowIndex, rowData) {
        var viewData,
            row,
            len,
            _columns = arguments[2],
            _cellFilter = arguments[3];
        if(!rowData) return;

        viewData = this.getViewData();
        len = viewData.length;
        if(len === 0) {
            this.addRow(rowData);
            return;
        }
        if(rowIndex < 0) {
            rowIndex = 0;
        }
        if(rowIndex < viewData.length) {
            row = $("<tr />");
            this._createRowCells(row, rowData, rowIndex, _columns, _cellFilter);
            $(this.bodyTable[0].rows[rowIndex]).before(row);
            viewData.splice(rowIndex, 0, rowData);
            this._updateScrollState();
            this._refreshRowNumber();
        } else {
            this.addRow(rowData);
        }
    },
    /** 当前行上移 */
    currentRowUp: function() {
        var data;
        if(this.isMultiple()) {
            throw new Error("The currentRowUp can not support for multiple selection");
        }
        if(this.option.selection.type === "cell") {
            throw new Error("The currentRowUp can not support for cell selection");
        }
        
        data = this.getSelection();
        if(!data || data.rowIndex === 0) {
            return;
        }
        this.moveRow(data.rowIndex, data.rowIndex - 1);
    },
    /** 当前行下移 */
    currentRowDown: function() {
        var data;
        if(this.isMultiple()) {
            throw new Error("The currentRowDown can not support for multiple selection");
        }
        if(this.option.selection.type === "cell") {
            throw new Error("The currentRowDown can not support for cell selection");
        }
        
        data = this.getSelection();
        if(!data || data.rowIndex >= this.count()) {
            return;
        }
        this.moveRow(data.rowIndex, data.rowIndex + 1);
    },
    /** 移动行 */
    moveRow: function(sourceIndex, destIndex) {
        var viewData,
            rows,
            destRow,
            tempData;
        
        viewData = this.getViewData();
        if(viewData.length === 0) {
            return;
        }
        if(destIndex < 0) {
            destIndex = 0;
        } else if(destIndex >= viewData.length) {
            destIndex = viewData.length - 1;
        }

        if(sourceIndex === destIndex) {
            return;
        }

        rows = this.bodyTable[0].tBodies[0].rows;
        destRow = $(rows[destIndex]);
        if(destIndex > sourceIndex) {
            destRow.after($(rows[sourceIndex]));
            this._refreshRowNumber(sourceIndex, destIndex);
        } else {
            destRow.before($(rows[sourceIndex]));
            this._refreshRowNumber(destIndex, sourceIndex);
        }
        tempData = viewData[sourceIndex];
        viewData.splice(sourceIndex, 1);
        viewData.splice(destIndex, 0, tempData);
    },
    /** 获取行数据 */
    getRowData: function(rowIndex) {
        var viewData = this.getViewData();
        if(viewData.length === 0) {
            return null;
        }
        if(!ui.core.isNumber(rowIndex) || rowIndex < 0 || rowIndex >= viewData.length) {
            return null;
        }
        return viewData[rowIndex];
    },
    /** 获取视图数据 */
    getViewData: function() {
        return Array.isArray(this.option.viewData) ? this.option.viewData : [];
    },
    /** 获取项目数 */
    count: function() {
        return this.getViewData().length;
    },
    /** 是否可以选择 */
    isSelectable: function() {
        var type = this.option.selection.type;
        return type === "row" || type === "cell";
    },
    /** 是否支持多选 */
    isMultiple: function() {
        return this.option.selection.multiple === true;
    },
    /** 清空表格数据 */
    clear: function() {
        this.option.viewData = null;
        this._selectList = [];
        this._current = null;
        this._checkedCount = 0;

        if (this.bodyTable) {
            this.bodyTable.html("");
        }
        if (this.headTable) {
            this.columnResetter.reset();
        }
        if (this.pager) {
            this.pager.empty();
        }
        this.sorter.reset();
        if (arguments[0] !== false) {
            this.prompt.show();
        }
    },
    /** 设置表格的尺寸, width: 宽度, height: 高度 */
    setSize: function(width, height) {
        if(arguments.length === 1) {
            height = width;
            width = null;
        }
        if(ui.core.isNumber(height)) {
            this.height = height;
            this.innerHeight = height - this.borderHeight;
            height = this.innerHeight - this.headHeight;
            if(this.pager) {
                height -= this.footHeight;
            }
            this.bodyHeight = height;
            this.body.css("height", this.bodyHeight + "px");
        } else {
            this.innerHeight = this.element.height();
            this.height = this.innerHeight + this.borderHeight;
        }
        if(ui.core.isNumber(width)) {
            this.width = width;
            this.innerWidth = width - this.borderWidth;
            this.bodyWidth = this.innerWidth;
            this.element.css("width", this.innerWidth + "px");
        } else {
            this.innerWidth = this.element.width();
            this.width = this.innerWidth + this.borderWidth;
        }
        this._updateScrollState();
    }
});

$.fn.gridView = function(option) {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.GridView(option, this);
};
