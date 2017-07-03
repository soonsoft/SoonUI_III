// Report View

var cellCheckbox = "grid-checkbox",
    cellCheckboxAll = "grid-checkbox-all",
    lastCell = "last-cell",
    sortClass = "fa-sort",
    asc = "fa-sort-asc",
    desc = "fa-sort-desc",
    emptyRow = "empty-row";

var DATA_BODY = "DataBody",
    // 默认行高30像素
    rowHeight = 30,
    // 最小不能小于40像素
    defaultFixedCellWidth = 40;

var tag = /^((?:[\w\u00c0-\uFFFF\*_-]|\\.)+)/,
    attributes = /\[\s*((?:[\w\u00c0-\uFFFF_-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/;

var columnCheckboxAllFormatter = ui.ColumnStyle.cnfn.checkAll,
    checkboxFormatter = ui.ColumnStyle.cfn.check,
    columnTextFormatter = ui.ColumnStyle.cnfn.columnText,
    textFormatter = ui.ColumnStyle.cfn.text,
    rowNumberFormatter = ui.ColumnStyle.cfn.rowNumber;

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
function resetSortColumnState() {
    var cells, cells1, cells2,
        icon, i, len,
        lastIndex, index;

    if (this.tableFixedHead) {
        cells1 = this.fixedColumns;
    }
    if (this.tableDataHead) {
        cells2 = this.dataColumns;
    }

    cells = cells1;
    if(!cells) {
        cells = cells2;
    }
    if(!cells) {
        return;
    }

    lastIndex = -1;
    for (i = 0, len = this._sorterIndexes.length; i < len; i++) {
        index = this._sorterIndexes[i];
        if (index <= lastIndex || !cells[index]) {
            cells = cells2;
            lastIndex = -1;
        } else {
            lastIndex = index;
        }

        icon = cells[index].cell;
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
        colIndex = this._getColumnIndexAndTableByFormatter(columnCheckboxAllFormatter, "text");
        if(colIndex === -1) {
            return;
        }
        this._gridCheckboxAll = 
            $(this.tableHead[0].tBodies[0].rows[0].cells[colIndex])
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
function getExcludeValue(elem) {
    var exclude = this.option.selection.exclude,
        result = true;
    if(exclude) {
        if(ui.core.isString(exclude)) {
            result = this._excludeElement(elem, exclude);
        } else if(ui.core.isFunction(exclude)) {
            result = exclude.call(this, elem);
        }
    }
    return result;
}

/// 事件函数
// 排序点击事件处理
function onSort(e) {
    var viewData,
        elem, nodeName,
        table, columnIndex, column,
        fn, isSelf,
        tempTbody, icon, 
        rows, oldRows, 
        newRows, i, len;

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

    table = elem.parent().parent().parent();
    columnIndex = elem.data("data-columnIndex") || elem[0].cellIndex;
    if(table.hasClass("table-fixed-head")) {
        column = this.fixedColumns[columnIndex];
    } else {
        column = this.dataColumns[columnIndex];
    }

    if (this._lastSortColumn !== column) {
        resetSortColumnState.call(this, elem.parent());
    }

    fn = $.proxy(sorting, this);
    isSelf = this._lastSortColumn == column;
    this._lastSortColumn = column;

    if(this.tableFixedBody) {
        // 如果有固定列表，则先排固定列表
        tempTbody = this.tableFixedBody.children("tbody");
    } else {
        tempTbody = this.tableDataBody.children("tbody");
    }
    rows = tempTbody.children().get();
    if (!Array.isArray(rows) || rows.length != viewData.length) {
        throw new Error("data row error");
    }
    // 保留排序前的副本，以后根据索引和rowIndex调整其它表格的顺序
    oldRows = rows.slice(0);

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

    if(this.tableFixedBody) {
        // 根据排好序的固定列表将数据列表也排序
        if(this.tableDataBody) {
            tempTbody = this.tableDataBody.find("tbody");
            rows = tempTbody.children().get();
            newRows = new Array(rows.length);
            for(i = 0, len = oldRows.length; i < len; i++) {
                newRows[oldRows[i].rowIndex] = rows[i];
            }
            tempTbody.append(newRows);
        }
    }
    
    // 刷新行号
    this._refreshRowNumber();
}
// 滚动条同步事件
function onScrolling(e) {
    this.reportDataHead.scrollLeft(
        this.reportDataBody.scrollLeft());
    this.reportFixedBody.scrollTop(
        this.reportDataBody.scrollTop());
}
// 全选按钮点击事件处理
function onCheckboxAllClick(e) {
    var cbxAll, cbx, 
        checkedValue, columnInfo,
        rows, dataRows, dataCell,
        selectedClass, fn, 
        i, len;

    e.stopPropagation();

    columnInfo = this._getColumnIndexAndTableByFormatter(columnCheckboxAllFormatter, "text");
    if(!columnInfo) {
        return;
    }

    cbxAll = $(e.target);
    checkedValue = !cbxAll.hasClass("fa-check-square");
    setChecked.call(this, cbxAll, checkedValue);

    if(this.option.selection.isRelateCheckbox === true && this.isMultiple()) {
        selectedClass = this.option.seletion.type === "cell" ? "cell-selected" : "row-selected";
        
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
    
    rows = columnInfo.bodyTable[0].tBodies[0].rows;
    for(i = 0, len = rows.length; i < len; i++) {
        cbx = $(rows[i].cells[columnInfo.columnIndex]).find("." + cellCheckbox);
        if(cbx.length > 0) {
            if(ui.core.isFunction(fn)) {
                if(!dataRows) {
                    dataRows = this.tableDataBody[0].tBodies[0].rows; 
                }
                dataCell = $(dataRows[i].cells[0]);
                fn.call(this, dataCell, cbx);
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
// 固定行点击事件
function onTableFixedBodyClick(e) {
    var elem,
        rowIndex,
        nodeName;

    elem = $(e.target);
    // 如果该元素已经被标记为排除项
    if(getExcludeValue.call(this, elem) === false) {
        return;
    }

    if(elem.hasClass(cellCheckbox)) {
        // 如果checkbox和选中行不联动
        if(!this.option.selection.isRelateCheckbox) {
            changeChecked.call(this, elem);
            return;
        }
    }

    // 如果是单元格选择模式则不用设置联动
    if (this.option.selection.type === "cell") {
        return;
    }

    if(this.tableDataBody) {
        while((nodeName = elem.nodeName()) !== "TR") {
            if(nodeName === "TBODY") {
                return;
            }
            elem = elem.parent();
        }
        rowIndex = elem[0].rowIndex;
        elem = $(this.tableDataBody[0].rows[rowIndex]);

        this._selectItem(elem, "row-selected");
    }
}
// 数据行点击事件
function onTableDataBodyClick(e) {
    var elem, 
        tagName, 
        selectedClass,
        nodeName;
    
    elem = $(e.target);
    // 如果该元素已经被标记为排除项
    if(getExcludeValue.call(this, elem) === false) {
        return;
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

ui.define("ui.ctrls.ReportView", {
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
            // 固定列
            fixedGroupColumns: null,
            // 数据列
            dataGroupColumns: null,
            // 视图数据
            viewData: null,
            // 没有数据时显示的提示信息
            promptText: "没有数据",
            // 高度
            height: false,
            // 宽度
            width: false,
            // 调节列宽
            suitable: true,
            // 分页参数
            pager: {
                // 当前页码，默认从第1页开始
                pageIndex: 1,
                // 记录数，默认100条
                pageSize: 100,
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

        // 列头对象
        this.reportHead = null;
        this.reportFixedHead = null;
        this.reportDataHead = null;
        // 表体对象
        this.reportBody = null;
        this.reportFixedBody = null;
        this.reportDataBody = null;

        this.columnHeight = this.rowHeight = rowHeight;
        this.pagerHeight = 30;

        if(this.option.pager) {
            preparePager.call(this, this.option.pager);
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

        // 事件初始化
        // 全选按钮点击事件
        this.onCheckboxAllClickHandler = $.proxy(onCheckboxAllClick, this);
        // 滚动条同步事件
        this.onScrollingHandler = $.proxy(onScrolling, this);
        // 固定行点击事件
        this.onTableFixedBodyClickHandler = $.proxy(onTableFixedBodyClick);
        // 数据行点击事件
        this.onTableDataBodyClickHandler = $.proxy(onTableDataBodyClick, this);
    },
    _render: function() {
        if(!this.element.hasClass("ui-report-view")) {
            this.element.addClass("ui-report-view");
        }

        this._initBorderWidth();
        this._initDataPrompt();

        // 表头
        this.reportHead = $("<div class='ui-report-head' />");
        this.reportFixedHead = $("<div class='fixed-head' />");
        this.reportDataHead = $("<div class='data-head'>");
        this.reportHead
            .append(this.reportFixedHead)
            .append(this.reportDataHead);
        this.element.append(this.reportHead);
        // 定义列宽调整
        this._initSuitable();
        // 表体
        this.reportBody = $("<div class='ui-report-body' />");
        this.reportFixedBody = $("<div class='fixed-body' />");
        this._fixedBodyScroll = $("<div class='fixed-body-scroll' />")
            .css("height", ui.scrollbarHeight);
        this.reportDataBody = $("<div class='data-body' />");
        this.reportDataBody.scroll(this.onScrollingHandler);
        this.reportBody
            .append(this.reportFixedBody)
            .append(this._fixedBodyScroll)
            .append(this.reportDataBody);
        this.element.append(this.reportBody);
        // 分页栏
        this._initPagerPanel();
        // 设置容器大小
        this.setSize(this.option.width, this.option.height);

        // 创建表头
        this.createReportHead(
            this.option.fixedGroupColumns, 
            this.option.dataGroupColumns);
        // 创建表体
        if (Array.isArray(this.option.viewData)) {
            this.createReportBody(
                this.option.viewData, 
                this.option.viewData.length);
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
    _initSuitable: function() {
        if(!this.option.suitable) {
            return;
        }
        this._fitLine = $("<hr class='fit-line background-highlight' />");
        this.element.append(this._fitLine);
        this.dragger = ui.MouseDragger({
            context: this,
            target: this._fitLine,
            handle: this.reportDataHead,
            onBeginDrag: function() {
                var elem, that, option,
                    elemOffset, panelOffset, left;
                
                elem = $(this.taget);
                if(!elem.isNodeName("b")) {
                    return false;
                }

                option = this.option;
                that = option.context;
                elemOffset = elem.offset();
                panelOffset = that.element.offset();
                left = elemOffset.left - panelOffset.left + elem.width();

                option.th = elem.parent();
                option.beginLeft = left;
                option.endLeft = left;
                option.leftLimit = panelOffset.left;
                option.rightLimit = panelOffset.left + that.element.outerWidth();
                
                option.target.css({
                    "left": left + "px",
                    "display": "block"
                });
            },
            onMoving: function() {
                var option,
                    that,
                    left;
                
                option = this.option;
                that = option.context;

                left = parseFloat(option.target.css("left"));
                left += this.x;

                if (left < option.leftLimit) {
                    left = option.leftLimit;
                } else if (left > option.rightLimit) {
                    left = option.rightLimit;
                }
                option.endLeft = left;
                option.target.css("left", left + "px");
            },
            onEndDrag: function() {
                var option,
                    that,
                    colIndex, column,
                    width, col;

                option = this.option;
                that = option.context;
                option.target.css("display", "none");

                colIndex = option.th.data("data-columnIndex");
                column = that.dataColumns[colIndex];
                if(!column) {
                    return;
                }
                if(option.endLeft === option.beginLeft) {
                    return;
                }
                width = column.len + (option.endLeft - option.beginLeft);
                if(width < 30) {
                    width = 30;
                }
                column.len = width;
                if(that.tableDataBody) {
                    col = that.tableDataBody.children("colgroup").children()[colIndex];
                    if(col) {
                        col = $(col);
                        col.css("width", width + "px");
                    }
                }
                that._updateScrollState();
            }
        });
        this.dragger.on();
    },
    _initPagerPanel: function() {
        if(this.pager) {
            this.reportFoot = $("<div class='ui-report-foot clear' />");
            this.element.append(this.reportFoot);
            
            this.pager.pageNumPanel = $("<div class='page-panel' />");
            if (this.option.pager.displayDataInfo) {
                this.pager.pageInfoPanel = $("<div class='data-info' />");
                this.reportFoot.append(this.pager.pageInfoPanel);
            } else {
                this.pager.pageNumPanel.css("width", "100%");
            }

            this.reportFoot.append(this.pager.pageNumPanel);
            this.pager.pageChanged(function(pageIndex, pageSize) {
                this.pageIndex = pageIndex;
                this.pageSize = pageSize;
                this.fire("pagechanging", pageIndex, pageSize);
            }, this);
        }
    },
    _createFixedHead: function (fixedColumns, fixedGroupColumns) {
        if (!this.tableFixedHead) {
            this.tableFixedHead = $("<table class='table-fixed-head' cellspacing='0' cellpadding='0' />");
            this.reportFixedHead.append(this.tableFixedHead);
        } else {
            this.tableFixedHead.html("");
        }
        this._fixedColumnWidth = 0;
        this._createHeadTable(this.tableFixedHead, fixedColumns, fixedGroupColumns,
            function (c) {
                if (!c.len) {
                    c.len = defaultFixedCellWidth;
                }
                this._fixedColumnWidth += c.len + 1;
            }
        );
        this.reportFixedHead.css("width", this._fixedColumnWidth + "px");
    },
    _createDataHead: function (dataColumns, dataGroupColumns) {
        if (!this.tableDataHead) {
            this.tableDataHead = $("<table class='table-data-head' cellspacing='0' cellpadding='0' />");
            this.reportDataHead.append(this.tableDataHead);
            this.reportDataHead.css("left", this._fixedColumnWidth + "px");
        } else {
            this.tableDataHead.html("");
        }
        this._createHeadTable(this.tableDataHead, dataColumns, dataGroupColumns,
            // 创建最后的列
            function (c, th, cidx, len) {
                if (cidx == len - 1) {
                    th.addClass(lastCell);
                }
            },
            // 创建滚动条适应列
            function(headTable, tr, colGroup) {
                var rows,
                    rowspan,
                    th;

                this._dataHeadScrollCol = $("<col style='width:0' />");
                colGroup.append(this._dataHeadScrollCol);

                rows = tr.parent().children();
                rowspan = rows.length;
                th = $("<th class='scroll-cell' />");
                if (rowspan > 1) {
                    th.attr("rowspan", rowspan);
                }
                $(rows[0]).append(th);
            });
    },   
    _createFixedBody: function (viewData, columns) {
        if (!this.tableFixedBody) {
            this.tableFixedBody = $("<table class='table-fixed-body' cellspacing='0' cellpadding='0' />");
            if (this.isSelectable()) {
                this.tableFixedBody.click(this.onTableFixedBodyClickHandler);
            }
            this.reportFixedBody.append(this.tableFixedBody);
        } else {
            this.reportFixedBody.scrollTop(0);
            this._emptyFixed();
        }

        if (viewData.length === 0) {
            return;
        }

        this._createBodyTable(this.tableFixedBody, viewData, columns);

        this.reportFixedBody.css("width", this._fixedColumnWidth + "px");
        this._fixedBodyScroll.css("width", this._fixedColumnWidth + "px");
    },
    _createDataBody: function (viewData, columns, rowCount) {
        var isRebind = false;
        if (!this.tableDataBody) {
            this.tableDataBody = $("<table class='table-data-body' cellspacing='0' cellpadding='0' />");
            if (this.isSelectable()) {
                this.tableDataBody.click(this.onTableDataBodyClickHandler);
            }
            this.reportDataBody.append(this.tableDataBody);
            this.reportDataBody.css("left", this._fixedColumnWidth + "px");
        } else {
            this.reportDataBody.scrollTop(0);
            this._emptyData();
            isRebind = true;
        }

        if (viewData.length === 0) {
            this._showDataPrompt();
            return;
        } else {
            this._hideDataPrompt();
        }

        this._createBodyTable(this.tableDataBody, viewData, columns, { type: DATA_BODY });

        this._updateScrollState();
        //update page numbers
        if (ui.core.isNumber(rowCount)) {
            this._renderPageList(rowCount);
        }

        if (isRebind) {
            this.fire("rebind");
        }
    },
    _createHeadTable: function (headTable, columns, groupColumns, eachFn, colFn) {
        var hasFn,
            colGroup, thead,
            tr, th, c, el,
            i, j, row,
            cHeight = 0,
            args, columnIndex, isDataHeadTable;
        
        hasFn = ui.core.isFunction(eachFn);
        isDataHeadTable = headTable.hasClass("table-data-head");

        thead = $("<thead />");
        if (Array.isArray(groupColumns)) {
            for (i = 0; i < groupColumns.length; i++) {
                row = groupColumns[i];
                tr = $("<tr />");
                if (!row || row.length === 0) {
                    tr.addClass(emptyRow);
                }
                columnIndex = 0;
                for (j = 0; j < row.length; j++) {
                    c = row[j];
                    th = this._createCell("th", c);
                    th.addClass("ui-report-head-cell");
                    if (ui.core.isFunction(c.text)) {
                        el = c.text.call(this, c, th);
                    } else {
                        if(c.text) {
                            el = columnTextFormatter.call(this, c, th);
                        }
                    }
                    if (el) {
                        th.append(el);
                    }

                    if (c.column || ui.core.isFunction(c.handler)) {
                        if (!c._columnKeys) {
                            c._columnKeys = {};
                        }
                        while (columns[columnIndex]) {
                            columnIndex++;
                        }
                        this._setSorter(th, c, columnIndex);

                        delete c.rowspan;
                        delete c.colspan;
                        th.data("data-columnIndex", columnIndex);
                        c.cell = th;
                        c.columnIndex = columnIndex;
                        columns[columnIndex] = c;
                    }
                    if(this.option.fitColumns && isDataHeadTable) {
                        th.append("<b class='fit-column-handle' />");
                    }
                    tr.append(th);

                    columnIndex += c.colspan || 1;
                }
                thead.append(tr);
                cHeight += this.rowHeight;
            }
        }

        colGroup = $("<colgroup />");
        for (i = 0; i < columns.length; i++) {
            c = columns[i];
            c.cellIndex = i;
            colGroup.append(this.createCol(c));

            args = [c, c.cell];
            if (hasFn) {
                args.push(i);
                args.push(columns.length);
                eachFn.apply(this, args);
            }
        }
        if (ui.core.isFunction(colFn)) {
            colFn.call(this, headTable, tr, colGroup);
        }
        if (cHeight > this.columnHeight) {
            this.columnHeight = cHeight;
        }
        
        headTable.append(colGroup);
        headTable.append(thead);
    },
    _createBodyTable: function (bodyTable, viewData, columns, tempData, afterFn) {
        var colGroup, tbody,
            obj, tr, c, i, j,
            columnLength,
            lastCellFlag;

        columnLength = columns.length;
        lastCellFlag = (tempData && tempData.type === DATA_BODY);
        this._tempHandler = null;

        colGroup = $("<colgroup />");
        for (j = 0; j < columnLength; j++) {
            c = columns[j];
            colGroup.append(this.createCol(c));
        }

        tbody = $("<tbody />");
        for (i = 0; i < viewData.length; i++) {
            tr = $("<tr />");
            obj = viewData[i];
            this._createRowCells(tr, obj, i, columns, lastCellFlag);
            tbody.append(tr);
        }

        bodyTable.append(colGroup);
        bodyTable.append(tbody);

        if (ui.core.isFunction(afterFn)) {
            afterFn.call(this, bodyTable);
        }
    },
    _createRowCells: function (tr, rowData, rowIndex, columns, lastCellFlag) {
        var columnLength,
            formatter,
            isRowHover,
            i, c, cval, td, el;

        isRowHover = this.option.selection.type !== "cell";
        if(isRowHover) {
            tr.addClass("table-body-row-hover");
        }

        columnLength = columns.length;
        for (i = 0; i < columnLength; i++) {
            c = columns[i];
            formatter = c.formatter;
            if (!ui.core.isFunction(formatter)) {
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
            if (lastCellFlag && i === columnLength - 1) {
                td.addClass(lastCell);
            }
            tr.append(td);
        }
    },
    // 获得并组装值
    _prepareValue: function (rowData, c) {
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
        if (ui.core.isNumber(column.colspan)) {
            cell.prop("colspan", column.colspan);
        }
        if (ui.core.isNumber(column.rowspan)) {
            cell.prop("rowspan", column.rowspan);
            if(column.rowspan > 1) {
                cell.css("height", column.rowspan * this.rowHeight - 1);
            }
        }
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
        var h, w, sh, sw;
        if (!this.reportDataBody || !this.tableDataHead) {
            return;
        }

        h = this.reportDataBody.height();
        w = this.reportDataBody.width();
        sh = this.reportDataBody[0].scrollHeight;
        sw = this.reportDataBody[0].scrollWidth;

        if (sh > h) {
            //滚动条默认是17像素，在IE下会显示为16.5，有效值为16。为了修正此问题设置为17.1
            this.dataHeadScrollCol.css("width", ui.scrollbarWidth + 0.1 + "px");
        } else {
            this.dataHeadScrollCol.css("width", "0");
        }

        if (sw > w) {
            this.reportFixedBody.css("height", h - ui.scrollbarWidth + "px");
            this._fixedBodyScroll.css("display", "block");
        } else {
            this.reportFixedBody.css("height", h + "px");
            this._fixedBodyScroll.css("display", "none");
        }
    },
    _refreshRowNumber: function(startRowIndex, endRowIndex) {
        var viewData,
            columnInfo, rowNumber,
            rows, cell,
            column, i, len;

        viewData = this.option.viewData;
        if(!viewData || viewData.length === 0) {
            return;
        }

        rowNumber = rowNumberFormatter;
        columnInfo = this._getColumnIndexAndTableByFormatter(rowNumber);
        
        if (!columnInfo) return;
        if (!ui.core.isNumber(startRowIndex)) {
            startRowIndex = 0;
        } else {
            startRowIndex += 1;
        }
        rows = columnInfo.tableBody[0].rows;
        column = columnInfo.columns[columnInfo.columnIndex];
        len = ui.core.isNumber(endRowIndex) ? endRowIndex + 1 : rows.length;
        for (i = startRowIndex; i < len; i++) {
            cell = $(rows[i].cells[columnInfo.columnIndex]);
            cell.html("");
            cell.append(rowNumber.call(this, null, column, i));
        }
    },
    _emptyFixed: function() {
        if (this.tableFixedBody) {
            this.tableFixedBody.html("");
            resetColumnState.call(this);
            this._lastSortColumn = null;
        }
    },
    _emptyData: function() {
        if (this.tableDataBody) {
            this.tableDataBody.html("");
            this._selectList = [];
            this._current = null;
        }
        if (this.pager) {
            this.pager.empty();
        }
    },
    _getColumnIndexAndTableByFormatter: function(formatter, field) {
        var result, i, len;
        result = {
            columnIndex: -1,
            columns: null,
            headTable: null,
            bodyTable: null
        };

        if(!field) {
            field = "formatter";
        }

        if(this.fixedColumns) {
            for(i = 0, len = this.fixedColumns.length; i < len; i++) {
                if(this.fixedColumns[i][field] === formatter) {
                    result.columnIndex = i;
                    result.columns = this.fixedColumns;
                    result.headTable = this.tableFixedHead;
                    result.bodyTable = this.tableFixedBody;
                    return result;
                }
            }
        }
        if(this.dataColumns) {
            for(i = 0, len = this.dataColumns.length; i < len; i++) {
                if(this.dataColumns[i][field] === formatter) {
                    result.columnIndex = i;
                    result.columns = this.dataColumns;
                    result.headTable = this.tableDataHead;
                    result.bodyTable = this.tableDataBody;
                    return result;
                }
            }
        }
        if(result.columnIndex === -1) {
            return null;
        }
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
    _selectItem: function(elem, selectedClass, selectValue) {
        var eventData, result,
            columnInfo, checkbox,
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
                    columnInfo = this._getColumnIndexAndTableByFormatter(checkboxFormatter);
                    if(columnInfo) {
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
                if(this_current[0] === elem[0]) {
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
    createReportHead: function(fixedGroupColumns, dataGroupColumns) {
        if(Array.isArray(fixedGroupColumns)) {
            this.fixedColumns = [];
            if(!Array.isArray(fixedGroupColumns[0])) {
                fixedGroupColumns = [fixedGroupColumns];
            }
            this._createFixedHead(this.fixedColumns, fixedGroupColumns);
        }

        if (Array.isArray(dataGroupColumns)) {
            this.dataColumns = [];
            if(!Array.isArray(dataGroupColumns[0])) {
                dataGroupColumns = [dataGroupColumns];
            }
            this._createDataHead(this.dataColumns, dataGroupColumns);
        }

        this.reportFixedHead.css("height", this.columnHeight + "px");
        this.reportDataHead.css("height", this.columnHeight + "px");
        this.reportHead.css("height", this.columnHeight + "px");
    },
    /** 创建表体 */
    createReportBody: function(viewData, rowCount) {
        if(!Array.isArray(viewData)) {
            viewData = [];
        }
        this.option.viewData = viewData;
        if (this.fixedColumns && Array.isArray(this.fixedColumns)) {
            this._createFixedBody(viewData, this.fixedColumns);
        }

        if (this.dataColumns && Array.isArray(this.dataColumns)) {
            this._createDataBody(viewData, this.dataColumns, rowCount);
        }
    },
    /** 获取checkbox勾选项的值 */
    getCheckedValues: function() {
        var columnInfo, rows, elem,
            checkboxClass = "." + cellCheckbox,
            result = [],
            i, len;

        columnInfo = this._getColumnIndexAndTableByFormatter(checkboxFormatter);
        if(!columnInfo) {
            return result;
        }

        rows = columnInfo.bodyTable[0].tBodies[0].rows;
        for(i = 0, len = rows.length; i < len; i++) {
            elem = $(rows[i].cells[columnInfo.columnIndex]).find(checkboxClass);
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
            columnInfo, checkboxClass, fn,
            i, len;

        if (!this.isSelectable()) {
            return;
        }

        selectedClass = this.option.selection.type === "cell" ? "cell-selected" : "row-selected";
        if(this.option.selection.isRelateCheckbox) {
            checkboxClass = "." + cellCheckbox;
            columnInfo = this._getColumnIndexAndTableByFormatter(checkboxFormatter);
            fn = function(elem) {
                var checkbox,
                    rowIndex,
                    tr;
                if(columnInfo) {
                    rowIndex = this.option.selection.type === "cell"
                        ? elem.parent()[0].rowIndex
                        : elem[0].rowIndex;
                    tr = $(columnInfo.bodyTable[0].tBodies[0].rows[rowIndex]);
                    checkbox = $(tr[0].cells[columnInfo.columnIndex]);
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
            this_current = null;
        }
        if(this.tableFixedBody) {
            $(this.tableFixedBody[0].rows[rowIndex]).remove();
        }
        row.remove();
        viewData.splice(rowIndex, 1);
        this._updateScrollState();
        this._refreshRowNumber();
    },
    /** 更新行 */
    updateRow: function(rowIndex, rowData) {
        var viewData,
            fixedRow,
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
        if(thsi.tableFixedBody) {
            fixedRow = $(this.tableFixedBody[0].rows[rowIndex]);
            fixedRow.empty();
            this._createRowCells(fixedRow, rowData, rowIndex, this.fixedColumns);
        }
        row.empty();
        viewData[rowIndex] = rowData;
        this._createRowCells(row, rowData, rowIndex, this.dataColumns, true);
    },
    /** 增加行 */
    addRow: function(rowData) {
        var viewData,
            row;
        if(!rowData) return;
        viewData = this.option.viewData;

        if(!Array.isArray(viewData) || viewData.length === 0) {
            if (this.tableFixedBody) {
                this.tableFixedBody.remove();
                this.tableFixedBody = null;
            }
            if (this.tableDataBody) {
                this.tableDataBody.remove();
                this.tableDataBody = null;
            }
            this.createReportBody([data]);
            return;
        }

        if(this.tableFixedBody) {
            row = $("<tr />");
            this._createRowCells(row, rowData, viewData.length, this.fixedColumns);
            $(this.tableFixedBody[0].tBodies[0]).append(row);
        }
        if(this.tableDataBody) {
            row = $("<tr />");
            this._createRowCells(row, rowData, viewData.length, this.dataColumns, true);
            $(this.tableDataBody[0].tBodies[0]).append(row);
        }
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
            if(this.tableFixedBody) {
                row = $("<tr />");
                this._createRowCells(row, rowData, rowIndex, this.fixedColumns);
                $(this.tableFixedBody[0].rows[rowIndex]).before(row);
                viewData.splice(rowIndex, 0, rowData);
            }
            if(this.tableDataBody) {
                row = $("<tr />");
                this._createRowCells(row, rowData, rowIndex, this.dataColumns, true);
                $(this.tableDataBody[0].rows[rowIndex]).before(row);
                viewData.splice(rowIndex, 0, rowData);
            }
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

        if(destIndex > rowIndex) {
            if(this.tableFixedBody) {
                rows = this.tableFixedBody[0].tBodies[0].rows;
                destRow = $(rows[destIndex]);
                destRow.after($(rows[sourceIndex]));
            }
            if(thsi.tableDataBody) {
                rows = this.tableDataBody[0].tBodies[0].rows;
                destRow = $(rows[destIndex]);
                destRow.after($(rows[sourceIndex]));
            }
            this._refreshRowNumber(sourceIndex - 1, destIndex);
        } else {
            if(this.tableFixedBody) {
                rows = this.tableFixedBody[0].tBodies[0].rows;
                destRow = $(rows[destIndex]);
                destRow.before($(rows[sourceIndex]));
            }
            if(thsi.tableDataBody) {
                rows = this.tableDataBody[0].tBodies[0].rows;
                destRow = $(rows[destIndex]);
                destRow.before($(rows[sourceIndex]));
            }
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
            ? 0
            : this.option.viewData.length;
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
        this.option.viewData = [];
        this._checkedCount = 0;

        this._emptyFixed();
        this._emptyData();

        resetSortColumnState.call(this);
        this._showDataPrompt();
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
            this.reportBody.css("height", height + "px");
            this.reportFixedBody.css("height", height + "px");
            this.reportDataBody.css("height", height + "px");
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

$.fn.reportView = function(option) {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.ReportView(option, this);
};
