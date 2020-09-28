// Report View

var lastCell = "last-cell",
    sortColumn = "sort-column",
    emptyRow = "empty-row",
    fixedEmpty = "ui-report-fixed-empty",
    fixedShadow = "border-highlight";
var // 最小不能小于40像素
    defaultFixedCellWidth = 40;

var columnTextFormatter = ui.ColumnStyle.cnfn.columnText,
    textFormatter = ui.ColumnStyle.cfn.text,
    columnStyle = ui.ColumnStyle;

function ReportFixed(view, parent, css) {
    this.view = view;
    this.parent = parent;
    this.panel = $("<div class='ui-report-fixed' />");
    if(css) {
        this.panel.css(css);
    }
    this.head = $("<div class='ui-grid-head ui-report-fixed-head' />");
    this.head.css("height", this.view.headHeight + "px");
    this.body = $("<div class='ui-grid-body ui-report-fixed-body' />");
    this.body.css("height", this.view.bodyHeight + "px");
    this.width = 0;
    this.height = 0;
    // 偏移的列索引
    this.offsetCellIndex = 0;

    this.panel
        .append(this.head)
        .append(this.body);
    this.parent.append(this.panel);
}
ReportFixed.prototype = {
    constructor: ReportFixed,
    setHead: function(groupColumns) {
        var width = 0;
        this.columns = [];
        this.headTable = $("<table class='ui-table-head' cellspacing='0' cellpadding='0' style='left:0' />");
        this.view._createHeadTable(this.headTable, this.columns, groupColumns, true,
            function(column, th, columnIndex, len) {
                if(!column.len) {
                    column.len = defaultFixedCellWidth;
                }
                width += column.len;
            }
        );
        this.width = width;
        this.head.html("").append(this.headTable);
        this.head.css("width", this.width + "px");
    },
    setBody: function(viewData) {
        this.bodyTable = $("<table class='ui-table-body' cellspacing='0' cellpadding='0' style='left:0' />");
        this.view._createBodyTable(this.bodyTable, viewData, this.columns);
        this.body.scrollTop(0);
        this.body.html("").append(this.bodyTable);
        this.body.css("width", this.width + "px");
        this.panel.removeClass(fixedEmpty);
    },
    clear: function() {
        if(this.bodyTable) {
            this.bodyTable.remove();
            delete this.bodyTable;
        }
        this.panel.removeClass(fixedShadow).addClass(fixedEmpty);
    },
    destroy: function() {
        this.panel.remove();
    },
    findColumnInfo: function(formatter, field) {
        var i, len;
        for(i = 0, len = this.columns.length; i < len; i++) {
            if(this.columns[i][field] === formatter) {
                return {
                    columnIndex: i,
                    columns: this.columns,
                    headTable: this.headTable,
                    bodyTable: this.bodyTable
                };
            }
        }
    },
    getElement: function(rowIndex, cellIndex) {
        var element = $(this.bodyTable[0].tBodies[0].rows[rowIndex]);
        if(ui.core.isNumber(cellIndex)) {
            cellIndex = cellIndex - this.offsetCellIndex;
            if(cellIndex < 0 || cellIndex >= element[0].cells.length) {
                element = null;
            } else {
                element = $(element[0].cells[cellIndex]);
            }
        }
        return element;
    },
    updateRow: function(rowIndex, rowData) {
        var row = $(this.bodyTable[0].rows[rowIndex]);
        if(row.length === 0) return;

        row.empty();
        this.view._createRowCells(row, rowData, rowIndex, this.columns);
    },
    appendRow: function(rowData) {
        var row = $("<tr />"),
            len = this.view.count();
        this.view._createRowCells(row, rowData, len, this.columns);
        $(this.bodyTable[0].tBodies[0]).append(row);
    },
    insertRow: function(rowIndex, rowData) {
        var row = $("<tr />");
        this.view._createRowCells(row, rowData, rowIndex, this.columns);
        $(this.bodyTable[0].rows[rowIndex]).before(row);
    },
    moveRow: function(sourceIndex, destIndex) {
        var rows = this.bodyTable[0].tBodies[0].rows,
            sourceRow = $(rows[sourceIndex]),
            destRow = $(rows[destIndex]);
        if(destIndex > sourceIndex) {
            destRow.after(sourceRow);
        } else {
            destRow.before(sourceRow);
        }
    }
};

function ReportFixedWrapper(view) {
    this.view = view;
    this.left = null;
    this.right = null;
}
ReportFixedWrapper.prototype = {
    constructor: ReportFixedWrapper,
    clear: function() {
        if(this.left) {
            this.left.clear();
        }
        if(this.right) {
            this.right.clear();
        }
    },
    setBodyHeight: function(bodyHeight) {
        if(this.left) {
            this.left.body.css("height", bodyHeight + "px");
        }
        if(this.right) {
            this.right.body.css("height", bodyHeight + "px");
        }
    },
    reset: function() {
        if(this.left) {
            this.left.destroy();
            this.left = null;
        }
        if(this.right) {
            this.right.destroy();
            this.right = null;
        }
    },
    findColumnInfo: function(formatter, field) {
        var columnInfo;
        if(this.left) {
            columnInfo = this.left.findColumnInfo(formatter, field);
            if(columnInfo != null) {
                return columnInfo;
            }
        }
        if(this.right) {
            columnInfo = this.right.findColumnInfo(formatter, field);
        }
        return columnInfo;
    },
    syncScroll: function(scrollTop, scrollLeft, scrollWidth) {
        if(this.left) {
            this.left.body.scrollTop(scrollTop);
            if(scrollLeft > 0) {
                this.left.panel.addClass(fixedShadow);
            } else {
                this.left.panel.removeClass(fixedShadow);
            }
        }
        if(this.right) {
            this.right.body.scrollTop(scrollTop);
            if(Math.ceil(this.view.innerWidth + scrollLeft) < scrollWidth) {
                this.right.panel.addClass(fixedShadow);
            } else {
                this.right.panel.removeClass(fixedShadow);
            }
        }
    },
    syncSelectedState: function(dataElement, selectedClass, state) {
        var rowIndex, cellIndex, setStateFn, fn;

        if(!this.left || !this.right) {
            return;
        }
        if(this.view.option.selection.type === "row") {
            rowIndex = dataElement[0].rowIndex;
        } else {
            cellIndex = dataElement[0].cellIndex;
            rowIndex = dataElement.parent()[0].rowIndex;
        }

        setStateFn = function(node, action) {
            var element;
            if(node) {
                element = node.getElement(rowIndex, cellIndex);
                if(element) {
                    action(element);
                }
            }
        };
        
        if(state) {
            fn = function(element) {
                element.addClass(selectedClass).addClass("background-highlight");
            };
            setStateFn(this.left, fn);
            setStateFn(this.right, fn);
        } else {
            fn = function(element) {
                element.removeClass(selectedClass).removeClass("background-highlight");
            };
            setStateFn(this.left, fn);
            setStateFn(this.right, fn);
        }
    },
    sortSync: function(sortMapper) {
        var leftRows, rightRows,
            leftNewRows, rightNewRows,
            leftTbody, rightTbody,
            i, len;
        if(!this.left && !this.right) {
            return;
        }
        if(this.left) {
            leftTbody = this.left.bodyTable.children("tbody");
            leftRows = leftTbody[0].rows;
            leftNewRows = new Array(leftRows.length);
        }
        if(this.right) {
            rightTbody = this.right.bodyTable.children("tbody");
            rightRows = rightTbody[0].rows;
            rightNewRows = new Array(rightRows.length);
        }
        for(i = 0, len = sortMapper.length; i < len; i++) {
            if(leftNewRows) {
                leftNewRows[sortMapper[i].rowIndex] = leftRows[i];
            }
            if(rightNewRows) {
                rightNewRows[sortMapper[i].rowIndex] = rightRows[i];
            }
        }
    }
};

// 排序点击事件处理
function onSort(e, element) {
    var viewData,
        columnIndex, column;

    viewData = this.getViewData();
    if (viewData.length === 0) {
        return;
    }

    columnIndex = parseInt(element.attr("data-columnIndex"), 10) || element[0].cellIndex;
    column = this._getColumn(columnIndex);

    this.sorter.sort(viewData, element, column);
}
// 滚动条同步事件
function onScrolling(e) {
    var reportDataBodyElement = this.reportDataBody[0],
        reportDataHeadElement = this.reportDataHead[0],
        scrollTop = reportDataBodyElement.scrollTop,
        scrollLeft = reportDataBodyElement.scrollLeft;

    reportDataHeadElement.scrollLeft = scrollLeft;
    this.fixed.syncScroll(scrollTop, scrollLeft, reportDataBodyElement.scrollWidth);
}

ui.ctrls.define("ui.ctrls.ReportView", ui.ctrls.GridView, {
    _defineOption: function() {
        /*
            column property
            text:       string|function     列名，默认为null
            column:     string|Array        绑定字段名，默认为null
            len:        number              列宽度，默认为auto
            align:      center|left|right   列对齐方式，默认为left(但是表头居中)
            formatter:  function            格式化器，默认为null
            sort:       boolean|function    是否支持排序，true-支持，false-不支持，默认为false
            fixed:      boolean             是否为固定列，true-是，false-否，默认否
        */
        var option = this._super();
        // 可调节列宽
        option.adjustable = true;
        return option;
    },
    _create: function() {
        var view = this;
        this._super();

        // 滚动条占位符对象
        this._headScrollColumn = {
            addScrollCol: function(tr, colGroup) {
                var rows,
                    rowspan,
                    th;

                this.scrollCol = $("<col style='width:0' />");
                colGroup.append(this.scrollCol);
            
                rows = tr.parent().children();
                rowspan = rows.length;
                th = $("<th class='ui-table-head-cell scroll-cell' />");
                if (rowspan > 1) {
                    th.attr("rowspan", rowspan);
                }
                $(rows[0]).append(th);
            },
            addFixedScrollColumn: function(div) {
                this.scrollBlock = $("<div class='ui-report-fixed-block' />");
                this.scrollBlock.css({
                    "width": ui.scrollbarWidth + "px",
                    "height": view.headHeight - 2 + "px"
                });
                div.append(this.scrollBlock);
            },
            show: function() {
                if(this.scrollCol) {
                    //滚动条默认是17像素，在IE下会显示为16.5，有效值为16。为了修正此问题设置为17.1
                    this.scrollCol.css("width", ui.scrollbarWidth + 0.1 + "px");
                }
                if(this.scrollBlock) {
                    this.scrollBlock.css("display", "block");
                    view.fixed.right.panel.css("right", (ui.scrollbarWidth + 1) + "px");
                }
            },
            hide: function() {
                if(this.scrollCol) {
                    this.scrollCol.css("width", 0);
                }
                if(this.scrollBlock) {
                    this.scrollBlock.css("display", "none");
                    view.fixed.right.panel.css("right", 0);
                }
            }
        };

        // 固定列管理器
        this.fixed = new ReportFixedWrapper(this);
        // 排序器
        this.sorter.sortAfterFn = (function(rowsMapper) {
            this.fixed.sortSync(rowsMapper);
        }).bind(this);

        // 事件初始化
        // 排序列点击事件
        this.clickHandlers.add(sortColumn, onSort.bind(this));
        // 滚动条同步事件
        this.onScrollingHandler = onScrolling.bind(this);
    },
    _render: function() {
        this._super();

        this.element.addClass("ui-report-view");
        this.head.addClass("ui-report-head");
        this.body.addClass("ui-report-body");
        
        // 定义列宽调整
        this._initAdjustColumn();
    },
    _initAdjustColumn: function() {
        if(!this.option.adjustable) {
            return;
        }
        this._adjustLine = $("<hr class='adjust-line background-highlight' />");
        this.element.append(this._adjustLine);
        this.dragger = ui.MouseDragger({
            context: this,
            target: this._adjustLine,
            handle: this.head,
            onBeginDrag: function(arg) {
                var elem, that, option,
                    elemOffset, panelOffset, left;
                
                elem = $(arg.target);
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
                option.leftLimit = 0;
                option.rightLimit = that.element.width();
                
                option.target.css({
                    "left": left + "px",
                    "display": "block"
                });
            },
            onMoving: function(arg) {
                var option,
                    left;
                
                option = this.option;
                that = option.context;

                left = parseFloat(option.target.css("left"));
                left += arg.x;

                if (left < option.leftLimit) {
                    left = option.leftLimit;
                } else if (left > option.rightLimit) {
                    left = option.rightLimit;
                }
                option.endLeft = left;
                option.target.css("left", left + "px");
            },
            onEndDrag: function(arg) {
                var option,
                    that,
                    colIndex, column,
                    width, col,
                    setWidthFn;

                option = this.option;
                that = option.context;
                option.target.css("display", "none");

                colIndex = parseInt(option.th.attr("data-columnIndex"), 10);
                column = that._getColumn(colIndex);
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
                setWidthFn  = function(container) {
                    var col;
                    if(container) {
                        col = container.children("colgroup").children()[colIndex];
                        if(col) {
                            col = $(col);
                            col.css("width", column.len + "px");
                        }
                    }
                };
                setWidthFn(that.headTable);
                setWidthFn(that.bodyTable);
                that._updateScrollState();
            }
        });
        this.dragger.on();
    },
    _createFixedHead: function (groupColumns) {
        var leftFixedGroupColumns = [],
            rightFixedGroupColumns = [],
            i, len, j, len2,
            columns, leftColumns, rightColumns;
        
        for(i = 0, len = groupColumns.length; i < len; i++) {
            columns = groupColumns[i];
            len2 = columns.length;

            leftColumns = [];
            j = 0;
            while(true) {
                if(j >= len2 || !columns[j].fixed) {
                    break;
                }
                leftColumns.push(columns[j]);
                j++;
            }
            if(leftColumns.length > 0) {
                leftFixedGroupColumns.push(leftColumns);

                if(leftColumns.length < len2) {
                    rightColumns = [];
                    j = len2;
                    while(j >= 0) {
                        j--;
                        if(j < 0) {
                            break;
                        }
                        if(columnStyle.isEmpty(columns[j])) {
                            continue;
                        }
                        if(!columns[j].fixed) {
                            break;
                        }
                        rightColumns.push(columns[j]);
                    }
                    if(rightColumns.length > 0) {
                        rightFixedGroupColumns.push(rightColumns);
                    }
                }
            }
        }

        this._noBodyHover = false;
        if(leftFixedGroupColumns.length > 0) {
            this._noBodyHover = true;
            if(!this.fixed.left) {
                this.fixed.left = new ReportFixed(this, this.element, {
                    "border-right-width": "1px",
                    "border-right-style": "solid",
                    "left": 0
                });
            }
            this.fixed.left.setHead(leftFixedGroupColumns);
        }

        if(rightFixedGroupColumns.length > 0) {
            this._noBodyHover = true;
            if(!this.fixed.right) {
                this.fixed.right = new ReportFixed(this, this.element, {
                    "border-left-width": "1px",
                    "border-left-style": "solid",
                    "right": 0
                });
                // 右边的索引需要一个偏移值能和DataColumns对应
                this.fixed.right.offsetCellIndex = j + 1;
                // 创建滚动条块
                this._headScrollColumn.addFixedScrollColumn(this.head);
            }
            this.fixed.right.setHead(rightFixedGroupColumns);
        }
    },
    _createDataHead: function (columns, groupColumns) {
        if (!this.reportDataHead) {
            this.reportDataHead = $("<div class='data-head'>");
            this.head.append(this.reportDataHead);
        } else {
            this.reportDataHead.html("");
        }

        this.headTable = $("<table class='ui-table-head' cellspacing='0' cellpadding='0' />");
        this._createHeadTable(this.headTable, columns, groupColumns, false, null, 
            // 创建滚动条适应列
            function(table, tr, groupCol) {
                this._headScrollColumn.addScrollCol(tr, groupCol);
            });
        this.reportDataHead.append(this.headTable);
    },   
    _createFixedBody: function (viewData) {
        if (viewData.length === 0) {
            return;
        }

        // 左边的固定列
        if(this.fixed.left) {
            this.fixed.left.setBody(viewData);
        }
        // 右边的固定列
        if(this.fixed.right) {
            this.fixed.right.setBody(viewData);
        }
    },
    _createDataBody: function (viewData, columns, rowCount) {
        var isRebind = false;
        if (!this.reportDataBody) {
            this.reportDataBody = $("<div class='data-body' />");
            this.reportDataBody.scroll(this.onScrollingHandler);
            this.body.append(this.reportDataBody);
        } else {
            this.reportDataBody.html("");
            isRebind = true;
        }

        this.bodyTable = $("<table class='ui-table-body' cellspacing='0' cellpadding='0' />");

        if (viewData.length === 0) {
            this.prompt.show();
        } else {
            this.prompt.hide();

            this._createBodyTable(this.bodyTable, viewData, columns, 
                function(el, column) {
                    return column.fixed ? null : el;
                }
            );
            this.reportDataBody.append(this.bodyTable);
    
            // 初始化滚动条状态
            this._updateScrollState();
            ui.setTask((function() {
                var reportDataBodyElement = this.reportDataBody[0],
                    scrollLeft = reportDataBodyElement.scrollLeft,
                    scrollWidth = reportDataBodyElement.scrollWidth;
                    
                this.fixed.syncScroll(0, scrollLeft, scrollWidth);
            }).bind(this));
        }

        //update page numbers
        if (ui.core.isNumber(rowCount)) {
            this._renderPageList(rowCount);
        }

        if (isRebind) {
            this.fire("rebind");
        }
    },
    _createHeadTable: function (headTable, columns, groupColumns, renderFixed, eachFn, colFn) {
        var hasFn,
            colGroup, thead,
            tr, th, columnObj, elem,
            i, j, len, row, totalRow,
            args, columnIndex;
        
        hasFn = ui.core.isFunction(eachFn);

        thead = $("<thead />");
        if (Array.isArray(groupColumns)) {
            totalRow = groupColumns.length;
            for (i = 0; i < totalRow; i++) {
                row = groupColumns[i];
                tr = $("<tr />");
                len = row.length;
                if (!row || len === 0) {
                    tr.addClass(emptyRow);
                }
                columnIndex = 0;
                for (j = 0; j < len; j++) {
                    columnObj = row[j];
                    if(columnObj.rowspan > totalRow) {
                        columnObj.rowspan = totalRow;
                    }
                    th = this._createCell("th", columnObj);
                    th.addClass("ui-table-head-cell");
                    if(j === len - 1) {
                        th.addClass(lastCell);
                    }
                    
                    // 计算当前的列索引
                    if ((columnObj.rowspan + i) === totalRow || i === totalRow - 1) {
                        if (!columnObj._columnKeys) {
                            columnObj._columnKeys = {};
                        }
                        while (columns[columnIndex]) {
                            columnIndex++;
                        }

                        if(columnObj.hasOwnProperty("columnIndex")) {
                            th.attr("data-columnIndex", columnObj.columnIndex);
                        } else {
                            th.attr("data-columnIndex", columnIndex);
                            columnObj.columnIndex = columnIndex;
                        }
                        columnObj.cell = th;
                        columns[columnIndex] = columnObj;
                    }

                    if(!columnObj.fixed || renderFixed) {
                        // 设置单元格的值
                        if (ui.core.isFunction(columnObj.text)) {
                            elem = columnObj.text.call(this, columnObj, th);
                        } else {
                            if(columnObj.text) {
                                elem = columnTextFormatter.call(this, columnObj, th);
                            }
                        }
                        if (elem) {
                            th.append(elem);
                        }
                        this.sorter.setSortColumn(th, columnObj, j);
                        // 设置列宽拖动把手
                        if(this.option.adjustable && !renderFixed) {
                            th.append("<b class='adjust-column-handle'></b>");
                        }
                        
                    }
                    tr.append(th);
                    columnIndex += columnObj.colspan || 1;
                }
                thead.append(tr);
            }
        }

        colGroup = $("<colgroup />");
        for (i = 0, len = columns.length; i < len; i++) {
            columnObj = columns[i];
            colGroup.append(this._createCol(columnObj));

            args = [columnObj, columnObj.cell];
            delete columnObj.cell;
            if (hasFn) {
                args.push(i);
                args.push(len);
                eachFn.apply(this, args);
            }
        }
        if (ui.core.isFunction(colFn)) {
            colFn.call(this, headTable, tr, colGroup);
        }
        
        headTable.append(colGroup);
        headTable.append(thead);
    },
    _createBodyTable: function (bodyTable, viewData, columns, cellFilter, rowFilter) {
        var colGroup, tbody,
            rowData, 
            tr, c, i, j,
            columnLength,
            hasRowFilter;

        columnLength = columns.length;
        hasRowFilter = ui.core.isFunction(rowFilter);

        colGroup = $("<colgroup />");
        for (j = 0; j < columnLength; j++) {
            c = columns[j];
            colGroup.append(this._createCol(c));
        }

        tbody = $("<tbody />");
        for (i = 0; i < viewData.length; i++) {
            tr = $("<tr />");
            rowData = viewData[i];
            this._createRowCells(tr, rowData, i, columns, cellFilter);

            if (hasRowFilter && rowFilter.call(this, tr, rowData) === false) {
                continue;
            }
            tbody.append(tr);
        }

        bodyTable.append(colGroup);
        bodyTable.append(tbody);
    },
    _createCell: function(tagName, column) {
        var cell = this._super(tagName, column);
        if (ui.core.isNumber(column.colspan)) {
            cell.prop("colspan", column.colspan);
        }
        if (ui.core.isNumber(column.rowspan)) {
            cell.prop("rowspan", column.rowspan);
            if(column.rowspan > 1) {
                cell.css("height", column.rowspan * this.rowHeight - 1);
            }
        }
        return cell;
    },
    // 获取column对象
    _getColumn: function(index) {
        return this.dataColumns[index];
    },
    _updateScrollState: function() {
        var width,
            height, 
            scrollWidth,
            scrollHeight;
        if (!this.reportDataBody || !this.headTable) {
            return;
        }

        width = this.reportDataBody.width();
        height = this.reportDataBody.height();
        scrollWidth = this.reportDataBody[0].scrollWidth;
        scrollHeight = this.reportDataBody[0].scrollHeight;

        if (scrollHeight - height > 1) {
            // Y轴滚动条出现
            this._headScrollColumn.show();
        } else {
            this._headScrollColumn.hide();
        }

        if(scrollWidth > width) {
            // X轴滚动条出现
            this.fixed.setBodyHeight(this.bodyHeight - ui.scrollbarWidth);
        } else {
            this.fixed.setBodyHeight(this.bodyHeight);
        }
    },
    _getColumnIndexByFormatter: function(formatter, field) {
        var i, len, columnInfo;

        if(!field) {
            field = "formatter";
        }

        // 从固定列中查找
        columnInfo = this.fixed.findColumnInfo(formatter, field);
        if(columnInfo) {
            return columnInfo;
        }
        
        if(this.dataColumns) {
            // 从数据列中查找
            for(i = 0, len = this.dataColumns.length; i < len; i++) {
                if(this.dataColumns[i][field] === formatter) {
                    return {
                        columnIndex: i,
                        columns: this.dataColumns,
                        headTable: this.headTable,
                        bodyTable: this.bodyTable
                    };
                }
            }
        }
        return {
            columnIndex: -1
        };
    },
    _addSelectedState: function(elem, selectedClass, eventData) {
        this.fixed.syncSelectedState(elem, selectedClass, true);
        this._super(elem, selectedClass, eventData);
    },
    _removeSelectedState: function(elem, selectedClass, eventData) {
        this.fixed.syncSelectedState(elem, selectedClass, false);
        this._super(elem, selectedClass, eventData);
    },
    _selectItem: function(elem, selectedClass, selectValue) {
        var container = elem,
            rowIndex, cellIndex;
        
        while(true) {
            if(container.isNodeName("div")) {
                break;
            }
            container = container.parent();
        }
        if(container.hasClass("ui-report-fixed-body")) {
            if(this.option.selection.type === "row") {
                rowIndex = elem[0].rowIndex;
                elem = $(this.bodyTable[0].tBodies[0].rows[rowIndex]);
            } else {
                rowIndex = elem.parent()[0].rowIndex;
                cellIndex = elem[0].cellIndex;
                if(container[0] === this.fixed.left.body[0]) {
                    cellIndex += this.fixed.left.offsetCellIndex;
                } else if(container[0] === this.fixed.right.body[0]) {
                    cellIndex += this.fixed.right.offsetCellIndex;
                }
                elem = $(this.bodyTable[0].tBodies[0].rows[rowIndex].cells[cellIndex]);
            }
        }
        this._super(elem, selectedClass, selectValue);
    },

    /// API
    /** 创建表头 */
    createHead: function(columns) {
        if (!Array.isArray(columns)) {
            return;
        }

        this.dataColumns = [];
        if(!Array.isArray(columns[0])) {
            columns = [columns];
        }
        this.headHeight = this.rowHeight * columns.length;
        this.fixed.reset();
        this.sorter.prepareHead();
        this._createDataHead(this.dataColumns, columns);
        this._createFixedHead(columns);
        // 删除，避免在生成数据行的时候被影响
        this.dataColumns.forEach(function(columnObj) {
            delete columnObj.rowspan;
            delete columnObj.colspan;
        });

        this.head.css("height", this.headHeight + "px");
    },
    /** 创建表体 */
    createBody: function(viewData, rowCount) {
        if(!Array.isArray(viewData)) {
            viewData = [];
        }
        
        this.clear();
        if(viewData.length === 0) {
            return;
        }
        this.option.viewData = viewData;
        
        if (this.dataColumns && Array.isArray(this.dataColumns)) {
            this._createDataBody(viewData, this.dataColumns, rowCount);
        }

        this._createFixedBody(viewData);
    },
    /** 移除行 */
    removeRowAt: function() {
        var rowIndex,
            indexes,
            i, len;

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
        if(len === 0) {
            return;
        }

        // 降序
        indexes.sort(function(a, b) {
            return b - a;
        });
        for(i = 0; i < len; i++) {
            rowIndex = indexes[i];
            if(this.fixed.left) {
                $(this.fixed.left.bodyTable[0].rows[rowIndex]).remove();
            }
            if(this.fixed.right) {
                $(this.fixed.right.bodyTable[0].rows[rowIndex]).remove();
            }
        }
        this._super.apply(this, indexes);
    },
    /** 更新行 */
    updateRow: function(rowIndex, rowData) {
        var viewData,
            len;

        viewData = this.getViewData();
        len = viewData.length;
        if(len === 0) {
            return;
        }
        if(rowIndex < 0 || rowIndex > len) {
            return;
        }

        if(this.fixed.left) {
            this.fixed.left.updateRow(rowIndex, rowData);
        }
        if(this.fixed.right) {
            this.fixed.right.updateRow(rowIndex, rowData);
        }

        this._super(rowIndex, rowData, this.dataColumns, 
            function(el, column) {
                return column.fixed ? null : el;
            }
        );
    },
    /** 增加行 */
    addRow: function(rowData) {
        var viewData;
        if(!rowData) return;
        
        viewData = this.getViewData();
        if(viewData.length === 0) {
            this._super(rowData);
            return;
        }

        if(this.fixed.left) {
            this.fixed.left.appendRow(rowData);
        }
        if(this.fixed.right) {
            this.fixed.right.appendRow(rowData);
        }
        this._super(rowData, this.dataColumns, 
            function(el, column) {
                return column.fixed ? null : el;
            }
        );
    },
    /** 插入行 */
    insertRow: function(rowIndex, rowData) {
        var viewData,
            len;
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
        if(rowIndex < len) {
            if(this.fixed.left) {
                this.fixed.left.insertRow(rowIndex, rowData);
            }
            if(this.fixed.right) {
                this.fixed.right.insertRow(rowIndex, rowData);
            }
        }
        this._super(rowIndex, rowData, this.dataColumns, 
            function(el, column) {
                return column.fixed ? null : el;
            }
        );
    },
    /** 移动行 */
    moveRow: function(sourceIndex, destIndex) {
        var viewData;
        
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

        if(this.fixed.left) {
            this.fixed.left.moveRow(sourceIndex, destIndex);
        }
        if(this.fixed.right) {
            this.fixed.right.moveRow(sourceIndex, destIndex);
        }
        this._super(sourceIndex, destIndex);
    },
    /** 清空表格数据 */
    clear: function() {
        this._super();
        if(this.bodyTable) {
            delete this.bodyTable;
        }
        this.fixed.clear();
    }
});

$.fn.reportView = function(option) {
    if(this.length === 0) {
        return;
    }
    return ui.ctrls.ReportView(option, this);
};
