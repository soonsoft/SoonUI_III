// grid view

var cellCheckbox = "grid-checkbox",
    cellCheckboxAll = "grid-checkbox-all",
    lastCell = "last-cell",
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

function preparePager(option) {
    if(option.showPageInfo === true) {
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
function reverse(arr1, arr2) {
    var temp,
        i = 0, 
        j = arr1.length - 1,
        len = arr1.length / 2;
    for (; i < len; i++, j--) {
        temp = arr1[i];
        arr1[i] = arr1[j];
        arr1[j] = temp;

        temp = arr2[i];
        arr2[i] = arr2[j];
        arr2[j] = temp;
    }
}
function sorting(v1, v2) {
    var column,
        fn,
        val1, val2;
    column = this._lastSortColumn;
    fn = column.sort;
    if(!ui.core.isFunction(fn)) {
        fn = defaultSortFn;
    }

    val1 = this._prepareValue(v1, column);
    val2 = this._prepareValue(v2, column);
    return fn(val1, val2);
}
function defaultSortFn(v1, v2) {
    var val, i, len;
    if (Array.isArray(v1)) {
        val = 0;
        for (i = 0, len = v1.length; i < len; i++) {
            val = defaultSorting(v1[i], v2[i]);
            if (val !== 0) {
                return val;
            }
        }
        return val;
    } else {
        return defaultSorting(v1, v2);
    }
}
function defaultSorting(v1, v2) {
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
}
function resetColumnState() {
    var fn, key;
    for(key in this.resetColumnStateHandlers) {
        if(this.resetColumnStateHandlers.hasOwnProperty(key)) {
            fn = this.resetColumnStateHandlers[key];
            if(ui.core.isFunction(fn)) {
                try {
                    fn.call(this);
                } catch (e) { }
            }
        }
    }
}
function resetSortColumnState (tr) {
    var icon, 
        cells,
        i, 
        len;

    if (!tr) {
        tr = this.tableHead.find("tr");
    }

    cells = tr.children();
    for (i = 0, len = this._sorterIndexes.length; i < len; i++) {
        icon = $(cells[this._sorterIndexes[i]]);
        icon = icon.find("i");
        if (!icon.hasClass(sortClass)) {
            icon.attr("class", "fa fa-sort");
            return;
        }
    }
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
function changeChecked(cbx) {
    var checked = !cbx.hasClass("fa-check-square"),
        colIndex;
    setChecked(cbx, checked);
    if(!this._gridCheckboxAll) {
        colIndex = this._getColumnIndexByFormatter(columnCheckboxAllFormatter, "text");
        if(colIndex === -1) {
            return;
        }
        this._gridCheckboxAll = 
            $(this.tableHead[0].tHead.rows[0].cells[colIndex])
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

// 事件处理函数
// 排序点击事件处理
function onSort(e) {
    var viewData,
        elem,
        nodeName,
        columnIndex, column,
        fn, isSelf,
        tempTbody, rows, icon;

    e.stopPropagation();
    viewData = this.option.viewData;
    if (!Array.isArray(viewData) || viewData.length === 0) {
        return;
    }
    elem = $(e.target);
    while ((nodeName = elem.nodeName()) !== "TH") {
        if (nodeName === "TR") {
            return;
        }
        elem = elem.parent();
    }

    columnIndex = elem[0].cellIndex;
    column = this.option.columns[columnIndex];

    if (this._lastSortColumn !== column) {
        resetSortColumnState.call(this, elem.parent());
    }

    fn = $.proxy(sorting, this);
    isSelf = this._lastSortColumn == column;
    this._lastSortColumn = column;

    tempTbody = this.tableBody.children("tbody");
    rows = tempTbody.children().get();
    if (!Array.isArray(rows) || rows.length != viewData.length) {
        throw new Error("data row error");
    }

    icon = elem.find("i");
    if (icon.hasClass(asc)) {
        reverse(viewData, rows);
        icon.removeClass(sortClass).removeClass(asc).addClass(desc);
    } else {
        if (isSelf) {
            reverse(viewData, rows);
        } else {
            this.sorter.items = rows;
            this.sorter.sort(viewData, fn);
        }
        icon.removeClass(sortClass).removeClass(desc).addClass(asc);
    }
    tempTbody.append(rows);
    this._refreshRowNumber();
}
// 表格内容点击事件处理
function onTableBodyClick(e) {
    var elem, tagName, selectedClass,
        exclude, result,
        nodeName;

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

    tagName = this.option.selection.type === "cell" ? "TD" : "TR";
    selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
    while((nodeName = elem.nodeName()) !== tagName) {
        if(nodeName === "TBODY") {
            return;
        }
        elem = elem.parent();
    }

    this._selectItem(elem, selectedClass);
}
// 横向滚动条跟随事件处理
function onScrollingX(e) {
    this.gridHead.scrollLeft(
        this.gridBody.scrollLeft());
}
// 全选按钮点击事件处理
function onCheckboxAllClick(e) {
    var cbxAll, cbx, cell,
        checkedValue, cellIndex,
        rows, selectedClass, fn, 
        i, len;

    e.stopPropagation();

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

    rows = this.tableBody[0].tBodies[0].rows;
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


ui.define("ui.ctrls.GridView", {
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
            promptText: "没有数据",
            // 高度
            height: false,
            // 宽度
            width: false,
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
        var events = ["selecting", "selected", "deselected", "rebind", "cencel"];
        if(this.option.pager) {
            events.push("pagechanging");
        }
        return events;
    },
    _create: function() {
        this._selectList = [];
        this._sorterIndexes = [];
        this._hasPrompt = !!this.option.promptText;
        // 存放列头状态重置方法
        this.resetColumnStateHandlers = {};
        
        this.gridHead = null;
        this.gridBody = null;
        this.columnHeight = 30;
        this.pagerHeight = 30;
        
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

        // 排序器
        this.sorter = ui.Introsort();
        // checkbox勾选计数器
        this._checkedCount = 0;

        // event handlers
        // 排序按钮点击事件
        this.onSortHandler = $.proxy(onSort, this);
        // 行或者单元格点击事件
        this.onTableBodyClickHandler = $.proxy(onTableBodyClick, this);
        // 全选按钮点击事件
        this.onCheckboxAllClickHandler = $.proxy(onCheckboxAllClick, this);
        // 横向滚动条同步事件
        this.onScrollingXHandler = $.proxy(onScrollingX, this);
    },
    _render: function() {
        if(!this.element.hasClass("ui-grid-view")) {
            this.element.addClass("ui-grid-view");
        }
        this._initBorderWidth();

        // 表头
        this.gridHead = $("<div class='ui-grid-head' />");
        this.element.append(this.gridHead);
        // 表体
        this.gridBody = $("<div class='ui-grid-body' />");
        this._initDataPrompt();
        this.gridBody.scroll(this.onScrollingXHandler);
        this.element.append(this.gridBody);
        // 分页栏
        this._initPagerPanel();
        // 设置容器大小
        this.setSize(this.option.width, this.option.height);

        // 创建表头
        this.createGridHead();
        // 创建表体
        if (Array.isArray(this.option.viewData)) {
            this.createGridBody(
                this.option.viewData, this.option.viewData.length);
        } else {
            this.option.viewData = [];
        }
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
    _initDataPrompt: function() {
        var text;
        if(this._hasPrompt) {
            this._dataPrompt = $("<div class='data-prompt' />");
            text = this.option.promptText;
            if (ui.core.isString(text) && text.length > 0) {
                this._dataPrompt.html("<span class='font-highlight'>" + text + "</span>");
            } else if (ui.core.isFunction(text)) {
                text = text();
                this._dataPrompt.append(text);
            }
            this.gridBody.append(this._dataPrompt);
        }
    },
    _initPagerPanel: function() {
        if(this.pager) {
            this.gridFoot = $("<div class='ui-grid-foot clear' />");
            this.element.append(this.gridFoot);
            
            this.pager.pageNumPanel = $("<div class='page-panel' />");
            if (this.option.pager.displayDataInfo) {
                this.pager.pageInfoPanel = $("<div class='data-info' />");
                this.gridFoot.append(this.pager.pageInfoPanel);
            } else {
                this.pager.pageNumPanel.css("width", "100%");
            }

            this.gridFoot.append(this.pager.pageNumPanel);
            this.pager.pageChanged(function(pageIndex, pageSize) {
                this.pageIndex = pageIndex;
                this.pageSize = pageSize;
                this.fire("pagechanging", pageIndex, pageSize);
            }, this);
        }
    },
    // 创建一行的所有单元格
    _createRowCells: function(tr, rowData, rowIndex) {
        var i, len, 
            c, cval, td, el,
            formatter,
            isRowHover;
        
        isRowHover = this.option.selection.type !== "cell";
        if(isRowHover) {
            tr.addClass("table-body-row-hover");
        }
        for (i = 0, len = this.option.columns.length; i < len; i++) {
            c = this.option.columns[i];
            formatter = c.formatter;
            if (!ui.core.isFunction(c.formatter)) {
                formatter = textFormatter;
            }
            cval = this._prepareValue(rowData, c);
            td = this._createCell("td", c);
            td.addClass("ui-table-body-cell");
            if(!isRowHover) {
                td.addClass("table-body-cell-hover");
            }
            el = formatter.call(this, cval, c, rowIndex, td);
            if (td.isAnnulment) {
                continue;
            }
            if (el) {
                td.append(el);
            }
            if (i === len - 1) {
                td.addClass(lastCell);
            }
            tr.append(td);
            if(td.isFinale) {
                td.addClass(lastCell);
                break;
            }
        }
    },
    // 获得并组装值
    _prepareValue: function(rowData, c) {
        var value,
            i, len;
        if (Array.isArray(c.column)) {
            value = {};
            for (i = 0, len = c.column.length; i < len; i++) {
                value[c.column[i]] = this._getValue(rowData, c.column[i], c);
            }
        } else {
            value = this._getValue(rowData, c.column, c);
        }
        return value;
    },
    // 获取值
    _getValue: function(rowData, column, c) {
        var arr, i = 0, value;
        if (!ui.core.isString(column)) {
            return null;
        }
        if (!c._columnKeys.hasOwnProperty(column)) {
            c._columnKeys[column] = column.split(".");
        }
        arr = c._columnKeys[column];
        value = rowData[arr[i]];
        for (i = 1; i < arr.length; i++) {
            value = value[arr[i]];
            if (value === undefined || value === null) {
                return value;
            }
        }
        return value;
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
    _setSorter: function(cell, column, index) {
        if (column.sort === true || ui.core.isFunction(column.sort)) {
            cell.click(this.onSortHandler);
            cell.addClass("sorter");
            cell.append("<i class='fa fa-sort' />");
            this.sorterIndexes.push(index);
        }
    },
    _renderPageList: function(rowCount) {
        if (!this.pager) {
            return;
        }
        this.pager.data = this.option.viewData;
        this.pager.pageIndex = this.pageIndex;
        this.pager.pageSize = this.pageSize;
        this.pager.renderPageList(rowCount);
    },
    _updateScrollState: function() {
        if (!this.tableHead) return;
        if(this.gridBody[0].scrollHeight > this.gridBody.height()) {
            this._headScrollCol.css("width", ui.scrollbarWidth + 0.1 + "px");
        } else {
            this._headScrollCol.css("width", "0");
        }
    },
    _refreshRowNumber: function(startRowIndex, endRowIndex) {
        var viewData,
            colIndex, rowNumber,
            rows, cell,
            column, i, len;

        viewData = this.option.viewData;
        if(!viewData || viewData.length === 0) {
            return;
        }

        rowNumber = rowNumberFormatter;
        colIndex = this._getColumnIndexByFormatter(rowNumber);
        
        if (colIndex == -1) return;
        if (!ui.core.isNumber(startRowIndex)) {
            startRowIndex = 0;
        } else {
            startRowIndex += 1;
        }
        rows = this.tableBody[0].rows;
        column = this.option.columns[colIndex];
        len = ui.core.isNumber(endRowIndex) ? endRowIndex + 1 : rows.length;
        for (i = startRowIndex; i < len; i++) {
            cell = $(rows[i].cells[colIndex]);
            cell.html("");
            cell.append(rowNumber.call(this, null, column, i));
        }
    },
    _getColumnIndexByFormatter: function(formatter, field) {
        var i, 
            len = this.option.columns.length;
        if(!field) {
            field = "formatter";
        }
        for(i = 0; i < len; i++) {
            if(this.option.columns[i][field] === formatter) {
                return i;
            }
        }
        return -1;
    },
    _getSelectionData: function(elem) {
        var data = {};
        if(this.option.selection.type === "cell") {
            data.rowIndex = elem.parent().prop("rowIndex");
            data.cellIndex = elem.prop("cellIndex");
            data.rowData = this.option.viewData[data.rowIndex];
            data.column = this.option.columns[data.cellIndex].column;
        } else {
            data.rowIndex = elem.prop("rowIndex");
            data.rowData = this.option.viewData[data.rowIndex];
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
            match = ex.match(atttibutes);
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
    _selectItem: function(elem, selectedClass, selectValue) {
        var eventData, result,
            colIndex, checkbox,
            i, len;

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
                elem.removeClass(selectedClass).removeClass("background-highlight");
                this.fire("deselected", eventData);
            } else {
                // 现在要选中
                // 如果selectValue定义了取消，则不要执行选中逻辑
                if(selectValue === false) {
                    return;
                }
                selectValue = true;

                this._selectList.push(elem[0]);
                elem.addClass(selectedClass).addClass("background-highlight");
                this.fire("selected", eventData);
            }

            // 同步checkbox状态
            if(this.option.selection.isRelateCheckbox) {
                // 用过用户点击的是checkbox则保存变量，不用重新去获取了
                if(eventData.originElement && eventData.originElement.hasClass(cellCheckbox)) {
                    checkbox = eventData.originElement;
                }
                // 如果用户点击的不是checkbox则找出对于的checkbox
                if(!checkbox) {
                    colIndex = this._getColumnIndexByFormatter(checkboxFormatter);
                    if(colIndex > -1) {
                        checkbox = this.option.selection.type === "cell"
                            ? $(elem.parent()[0].cells[colIndex])
                            : $(elem[0].cells[colIndex]);
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
                this._current.removeClass(selectedClass).removeClass("background-highlight");
                if(this._current[0] === elem[0]) {
                    this._current = null;
                    this.fire("deselected", eventData);
                    return;
                }
            }
            this._current = elem;
            elem.addClass(selectedClass).addClass("background-highlight");
            this.fire("selected", eventData);
        }
    },
    _promptIsShow: function() {
        return this._hasPrompt 
            && this._dataPrompt.css("display") === "block";
    },
    _setPromptLocation: function() {
        var height = this._dataPrompt.height();
        this._dataPrompt.css("margin-top", -(height / 2) + "px");
    },
    _showDataPrompt: function() {
        if(!this._hasPrompt) return;
        this._dataPrompt.css("display", "block");
        this._setPromptLocation();
    },
    _hideDataPrompt: function() {
        if(!this._hasPrompt) return;
        this._dataPrompt.css("display", "none");
    },


    /// API
    /** 创建表头 */
    createGridHead: function(columns) {
        var colGroup, thead,
            tr, th,
            c, i;

        if(Array.isArray(columns)) {
            this.option.columns = columns;
        } else {
            columns = this.option.columns;
        }

        if (!this.tableHead) {
            this.tableHead = $("<table class='ui-table-head' cellspacing='0' cellpadding='0' />");
            this.gridHead.append(this.tableHead);
        } else {
            this.tableHead.html("");
        }

        colGroup = $("<colgroup />");
        thead = $("<thead />");
        tr = $("<tr />");
        for (i = 0; i < columns.length; i++) {
            c = columns[i];
            if (!c._columnKeys) {
                c._columnKeys = {};
            }
            colGroup.append(this._createCol(c));
            th = this._createCell("th", c);
            th.addClass("ui-table-head-cell");
            if ($.isFunction(c.text)) {
                th.append(c.text.call(this, c, th));
            } else {
                if(c.text) {
                    th.append(columnTextFormatter.call(this, c, th));
                }
            }
            this._setSorter(th, c, i);
            if (i == columns.length - 1) {
                th.addClass(lastCell);
            }
            tr.append(th);
        }

        this._headScrollCol = $("<col style='width:0' />");
        colGroup.append(this._headScrollCol);
        tr.append($("<th class='ui-table-head-cell scroll-cell' />"));
        thead.append(tr);

        this.tableHead.append(colGroup);
        this.tableHead.append(thead);
    },
    /** 创建内容 */
    createGridBody: function(viewData, rowCount) {
        var colGroup, tbody,
            tr, i, j, c,
            isRebind = false;
        
        if (!this.tableBody) {
            this.tableBody = $("<table class='ui-table-body' cellspacing='0' cellpadding='0' />");
            this.tableBody.click(this.onTableBodyClickHandler);
            this.gridBody.append(this.tableBody);
        } else {
            this.gridBody.scrollTop(0);
            this.clear(false);
            isRebind = true;
        }

        if(!Array.isArray(viewData)) {
            viewData = [];
        }
        this.option.viewData = viewData;

        if(viewData.length === 0) {
            this._showDataPrompt();
            return;
        } else {
            this._hideDataPrompt();
        }

        colGroup = $("<colgroup />"),
        tbody = $("<tbody />");
        this.tableBody.append(colGroup);

        for (j = 0; j < this.option.columns.length; j++) {
            c = this.option.columns[j];
            colGroup.append(this._createCol(c));
        }
        for (i = 0; i < viewData.length; i++) {
            tr = $("<tr />");
            this._createRowCells(tr, viewData[i], i);
            tbody.append(tr);
        }
        this.tableBody.append(tbody);

        this._updateScrollState();
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
        var columnIndex, rows, elem,
            checkboxClass = "." + cellCheckbox,
            result = [],
            i, len;

        columnIndex = this._getColumnIndexByFormatter(checkboxFormatter);
        if(columnIndex === -1) {
            return result;
        }

        rows = this.gridBody[0].tBodies[0].rows;
        for(i = 0, len = rows.length; i < len; i++) {
            elem = $(rows[i].cells[columnIndex]).find(checkboxClass);
            if(elem.length > 0) {
                result.push(ui.str.htmlDecode(elem.attr("data-value")));
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
            columnIndex, checkboxClass, fn,
            i, len;

        if (!this.isSelectable()) {
            return;
        }

        selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
        if(this.option.selection.isRelateCheckbox) {
            checkboxClass = "." + cellCheckbox;
            columnIndex = this._getColumnIndexByFormatter(checkboxFormatter);
            fn = function(elem) {
                var checkbox;
                if(columnIndex !== -1) {
                    checkbox = this.option.selection.type === "cell"
                        ? $(elem.parent()[0].cells[columnIndex])
                        : $(elem[0].cells[columnIndex]);
                    checkbox = checkbox.find(checkboxClass);
                    setChecked(checkbox, false);
                }
                elem.removeClass(selectedClass).removeClass("background-highlight");
            };
        } else {
            fn = function(elem) {
                elem.removeClass(selectedClass).removeClass("background-highlight");
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
    removeRowAt: function(rowIndex) {
        var viewData,
            row;

        viewData = this.option.viewData;
        if(!viewData) {
            return;
        }
        if(rowIndex < 0 || rowIndex > viewData.length) {
            return;
        }

        row = $(this.tableBody[0].rows[rowIndex]);
        if(row.length === 0) {
            return;
        }
        if(this._current && this._current[0] === row[0]) {
            this._current = null;
        }
        row.remove();
        viewData.splice(rowIndex, 1);
        this._updateScrollState();
        this._refreshRowNumber();
    },
    /** 更新行 */
    updateRow: function(rowIndex, rowData) {
        var viewData,
            row;

        viewData = this.option.viewData;
        if(!viewData) {
            return;
        }
        if(rowIndex < 0 || rowIndex > viewData.length) {
            return;
        }

        row = $(this.tableBody[0].rows[rowIndex]);
        if(row.length === 0) {
            return;
        }
        row.empty();
        viewData[rowIndex] = rowData;
        this._createRowCells(row, rowData, rowIndex);
    },
    /** 增加行 */
    addRow: function(rowData) {
        var viewData,
            row;
        if(!rowData) return;
        viewData = this.option.viewData;

        if(!Array.isArray(viewData) || viewData.length === 0) {
            if(this.tableBody) {
                this.tableBody.remove();
                this.tableBody = null;
            }
            this.createGridBody([rowData]);
            return;
        }

        row = $("<tr />");
        this._createRowCells(row, rowData, viewData.length);
        $(this.tableBody[0].tBodies[0]).append(row);
        viewData.push(rowData);
        this._updateScrollState();
    },
    /** 插入行 */
    insertRow: function(rowIndex, rowData) {
        var viewData,
            row;
        if(!rowData) return;
        viewData = this.option.viewData;

        if(!Array.isArray(viewData) || viewData.length === 0) {
            this.addRow(rowData);
            return;
        }
        if(rowIndex < 0) {
            rowIndex = 0;
        }
        if(rowIndex < viewData.length) {
            row = $("<tr />");
            this._createRowCells(row, rowData, rowIndex);
            $(this.tableBody[0].rows[rowIndex]).before(row);
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
        
        viewData = this.option.viewData;
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

        rows = this.tableBody[0].tBodies[0].rows;
        destRow = $(rows[destIndex]);
        if(destIndex > rowIndex) {
            destRow.after($(rows[sourceIndex]));
            this._refreshRowNumber(sourceIndex - 1, destIndex);
        } else {
            destRow.before($(rows[sourceIndex]));
            this._refreshRowNumber(destIndex - 1, sourceIndex);
        }
        tempData = viewData[sourceIndex];
        viewData.splice(sourceIndex, 1);
        viewData.splice(destIndex, 0, tempData);
    },
    /** 获取行数据 */
    getRowData: function(rowIndex) {
        var viewData = this.option.viewData;
        if(!Array.isArray(viewData) || viewData.length === 0) {
            return null;
        }
        if(!ui.core.isNumber(rowIndex) || rowIndex < 0 || rowIndex >= viewData.length) {
            return null;
        }
        return viewData[rowIndex];
    },
    /** 获取视图数据 */
    getViewData: function() {
        return Array.isArray(this.option.viewData) 
            ? this.option.viewData 
            : [];
    },
    /** 获取项目数 */
    count: function() {
        return Array.isArray(this.option.viewData)
            ? this.option.viewData.length
            : 0;
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
        if (this.tableBody) {
            this.tableBody.html("");
            this.option.listView = null;
            this._selectList = [];
            this._current = null;
            resetColumnState.call(this);
        }
        if (this.tableHead) {
            resetSortColumnState.call(this);
            this._lastSortColumn = null;
        }
        if (this.pager) {
            this.pager.empty();
        }
        if (arguments[0] !== false) {
            this._showDataPrompt();
        }
    },
    /** 设置表格的尺寸, width: 宽度, height: 高度 */
    setSize: function(width, height) {
        if(arguments.length === 1) {
            height = width;
            width = null;
        }
        if(ui.core.isNumber(height)) {
            height -= this.columnHeight + this.borderHeight;
            if(this.pager) {
                height -= this.pagerHeight;
            }
            this.gridBody.css("height", height + "px");
        }
        if(ui.core.isNumber(width)) {
            width -= this.borderWidth;
            this.element.css("width", width + "px");
        }
        this._updateScrollState();
        if(this._promptIsShow()) {
            this._setPromptLocation();
        }
    }
});

$.fn.gridView = function(option) {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.GridView(option, this);
};
